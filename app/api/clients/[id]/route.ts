import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";
import type { Client } from "@/lib/types";

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM clients WHERE id_client = ? LIMIT 1",
            [id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: "Cliente no encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json({ client: rows[0] as Client });
    } catch (error) {
        console.error("Error en GET /api/clients/[id]:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, email, phone, address, birthday, notes } = body;

        if (!name || !phone) {
            return NextResponse.json(
                { error: "Nombre y teléfono son obligatorios" },
                { status: 400 }
            );
        }

        await pool.query(
            `UPDATE clients
       SET name = ?, email = ?, phone = ?, address = ?, birthday = ?, notes = ?, updatedAt = NOW()
       WHERE id_client = ?`,
            [
                name,
                email || null,
                phone,
                address || null,
                birthday || null,
                notes || null,
                id,
            ]
        );

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error en PUT /api/clients/[id]:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        await pool.query("DELETE FROM clients WHERE id_client = ?", [id]);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error en DELETE /api/clients/[id]:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}