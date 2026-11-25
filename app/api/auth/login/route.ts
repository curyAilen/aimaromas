import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/auth";
import { clearEvents, countRecent, getClientIp, recordEvent } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import type { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
    id_user: number;
    email: string;
    password: string;
    name: string;
    role: "CEO" | "GERENTA";
}

// Máximo de contraseñas incorrectas por IP en la ventana de tiempo
const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const BUCKET = "login_fail";

export async function POST(req: NextRequest) {
    try {
        const { email, password, turnstileToken } = await req.json();
        const ip = getClientIp(req);

        // 1. Límite de intentos: con 5 fallos seguidos esa IP queda bloqueada 15 minutos
        if ((await countRecent(BUCKET, ip, WINDOW_MINUTES)) >= MAX_FAILED_ATTEMPTS) {
            return NextResponse.json(
                {
                    error: `Demasiados intentos fallidos. Esperá ${WINDOW_MINUTES} minutos y volvé a probar.`,
                },
                { status: 429, headers: { "Retry-After": String(WINDOW_MINUTES * 60) } }
            );
        }

        // 2. Anti-spam (Cloudflare Turnstile, si está configurado)
        if (!(await verifyTurnstile(turnstileToken, ip))) {
            return NextResponse.json(
                { error: "No pudimos verificar que sos una persona. Recargá la página e intentá de nuevo." },
                { status: 400 }
            );
        }

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email y contraseña son obligatorios" },
                { status: 400 }
            );
        }

        const [rows] = await pool.query<UserRow[]>(
            // Solo usuarias activas: una usuaria dada de baja no puede entrar
            "SELECT id_user, email, password, name, role FROM users WHERE email = ? AND active = 1 LIMIT 1",
            [String(email).trim().toLowerCase()]
        );

        const user = rows[0];
        // Mismo mensaje si el email no existe o la contraseña está mal (no se delatan los mails registrados)
        const passwordOk = user
            ? await bcrypt.compare(String(password), user.password)
            : false;

        if (!user || !passwordOk) {
            await recordEvent(BUCKET, ip);
            return NextResponse.json(
                { error: "Credenciales inválidas" },
                { status: 401 }
            );
        }

        // Entró bien: se borra el contador de fallos de esa IP
        await clearEvents(BUCKET, ip);

        const token = await createSession({
            userId: user.id_user,
            email: user.email,
            name: user.name,
            role: user.role,
        });

        await setSessionCookie(token);

        return NextResponse.json({
            ok: true,
            user: {
                id_user: user.id_user,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Error en login:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
