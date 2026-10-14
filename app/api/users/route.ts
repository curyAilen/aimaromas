import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

// GET /api/users - Listar todos los usuarios (solo CEO)
export async function GET() {
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

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id_user, email, name, role, active, createdAt
       FROM users
       ORDER BY active DESC, name ASC`
        );

        return NextResponse.json({ users: rows });
    } catch (error) {
        console.error("Error en GET /api/users:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

// POST /api/users - Crear usuario (solo CEO)
export async function POST(req: NextRequest) {
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

        const body = await req.json();
        const { email, password, name, role } = body;

        if (!email || !password || !name || !role) {
            return NextResponse.json(
                { error: "Todos los campos son obligatorios" },
                { status: 400 }
            );
        }

        if (role !== "CEO" && role !== "GERENTA") {
            return NextResponse.json(
                { error: "Rol inválido" },
                { status: 400 }
            );
        }

        // Verificar que el email no exista
        const [existing] = await pool.query<RowDataPacket[]>(
            "SELECT id_user FROM users WHERE email = ? LIMIT 1",
            [email.toLowerCase()]
        );

        if (existing.length > 0) {
            return NextResponse.json(
                { error: "Ya existe un usuario con ese email" },
                { status: 400 }
            );
        }

        const hashed = await bcrypt.hash(password, 10);

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO users (email, password, name, role, active, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
            [email.toLowerCase(), hashed, name, role]
        );

        return NextResponse.json(
            { ok: true, id_user: result.insertId },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error en POST /api/users:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}