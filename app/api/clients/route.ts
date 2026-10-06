import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { Client } from "@/lib/types";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";

        let query = "SELECT * FROM clients";
        const params: string[] = [];

        if (search) {
            query += " WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?";
            const like = `%${search}%`;
            params.push(like, like, like);
        }

        query += " ORDER BY name ASC";

        const [rows] = await pool.query<RowDataPacket[]>(query, params);

        return NextResponse.json({ clients: rows as Client[] });
    } catch (error) {
        console.error("Error en GET /api/clients:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { name, email, phone, address, birthday, notes } = body;

        if (!name || !phone) {
            return NextResponse.json(
                { error: "Nombre y teléfono son obligatorios" },
                { status: 400 }
            );
        }

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO clients (name, email, phone, address, birthday, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                name,
                email || null,
                phone,
                address || null,
                birthday || null,
                notes || null,
            ]
        );

        return NextResponse.json(
            { ok: true, id_client: result.insertId },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error en POST /api/clients:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}