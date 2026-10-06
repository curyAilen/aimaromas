import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
    id_user: number;
    email: string;
    password: string;
    name: string;
    role: "CEO" | "GERENTA";
}

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email y contraseña son obligatorios" },
                { status: 400 }
            );
        }

        const [rows] = await pool.query<UserRow[]>(
            "SELECT id_user, email, password, name, role FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: "Credenciales inválidas" },
                { status: 401 }
            );
        }

        const user = rows[0];
        const passwordOk = await bcrypt.compare(password, user.password);

        if (!passwordOk) {
            return NextResponse.json(
                { error: "Credenciales inválidas" },
                { status: 401 }
            );
        }

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