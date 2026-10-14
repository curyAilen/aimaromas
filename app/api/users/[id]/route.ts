import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

interface Params {
    params: Promise<{ id: string }>;
}

// PUT /api/users/[id] - Actualizar usuario (solo CEO)
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (session.role !== "CEO") {
            return NextResponse.json(
                { error: "Solo el CEO puede gestionar usuarios" },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await req.json();
        const { name, email, password, role, active } = body;

        // Armar updates dinámicos
        const updates: string[] = [];
        const values: any[] = [];

        if (name !== undefined) {
            updates.push("name = ?");
            values.push(name);
        }

        if (email !== undefined) {
            updates.push("email = ?");
            values.push(email.toLowerCase());
        }

        if (password !== undefined && password !== "") {
            const hashed = await bcrypt.hash(password, 10);
            updates.push("password = ?");
            values.push(hashed);
        }

        if (role !== undefined) {
            if (role !== "CEO" && role !== "GERENTA") {
                return NextResponse.json(
                    { error: "Rol inválido" },
                    { status: 400 }
                );
            }
            updates.push("role = ?");
            values.push(role);
        }

        if (active !== undefined) {
            updates.push("active = ?");
            values.push(active ? 1 : 0);
        }

        if (updates.length === 0) {
            return NextResponse.json(
                { error: "Nada para actualizar" },
                { status: 400 }
            );
        }

        updates.push("updatedAt = NOW()");
        values.push(id);

        await pool.query(
            `UPDATE users SET ${updates.join(", ")} WHERE id_user = ?`,
            values
        );

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error en PUT /api/users/[id]:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}