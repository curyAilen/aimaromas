import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";

// GET /api/users/me - Devuelve el usuario logueado
export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id_user, email, name, role FROM users WHERE id_user = ? LIMIT 1",
            [session.userId]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: "Usuario no encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json({ user: rows[0] });
    } catch (error) {
        console.error("Error en GET /api/users/me:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

// PUT /api/users/me - Actualizar mi perfil (nombre y/o contraseña)
export async function PUT(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { name, currentPassword, newPassword } = body;

        const updates: string[] = [];
        const values: any[] = [];

        if (name !== undefined && name.trim() !== "") {
            updates.push("name = ?");
            values.push(name.trim());
        }

        // Si quiere cambiar la contraseña, verificar la actual
        if (newPassword !== undefined && newPassword !== "") {
            if (!currentPassword) {
                return NextResponse.json(
                    { error: "Ingresá tu contraseña actual" },
                    { status: 400 }
                );
            }

            if (newPassword.length < 6) {
                return NextResponse.json(
                    { error: "La nueva contraseña debe tener al menos 6 caracteres" },
                    { status: 400 }
                );
            }

            // Verificar contraseña actual
            const [rows] = await pool.query<RowDataPacket[]>(
                "SELECT password FROM users WHERE id_user = ? LIMIT 1",
                [session.userId]
            );

            if (rows.length === 0) {
                return NextResponse.json(
                    { error: "Usuario no encontrado" },
                    { status: 404 }
                );
            }

            const ok = await bcrypt.compare(currentPassword, rows[0].password);
            if (!ok) {
                return NextResponse.json(
                    { error: "La contraseña actual es incorrecta" },
                    { status: 400 }
                );
            }

            const hashed = await bcrypt.hash(newPassword, 10);
            updates.push("password = ?");
            values.push(hashed);
        }

        if (updates.length === 0) {
            return NextResponse.json(
                { error: "Nada para actualizar" },
                { status: 400 }
            );
        }

        updates.push("updatedAt = NOW()");
        values.push(session.userId);

        await pool.query(
            `UPDATE users SET ${updates.join(", ")} WHERE id_user = ?`,
            values
        );

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error en PUT /api/users/me:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}