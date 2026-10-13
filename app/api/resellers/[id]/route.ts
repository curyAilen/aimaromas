import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

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
            "SELECT * FROM resellers WHERE id_reseller = ? LIMIT 1",
            [id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: "Revendedora no encontrada" },
                { status: 404 }
            );
        }

        return NextResponse.json({ reseller: rows[0] });
    } catch (error) {
        console.error("Error en GET /api/resellers/[id]:", error);
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
        const { name, phone, email, dni, address, notes, active } = body;

        if (!name) {
            return NextResponse.json(
                { error: "El nombre es obligatorio" },
                { status: 400 }
            );
        }

        await pool.query(
            `UPDATE resellers
       SET name = ?, phone = ?, email = ?, dni = ?, address = ?, notes = ?, active = ?, updatedAt = NOW()
       WHERE id_reseller = ?`,
            [
                name,
                phone || null,
                email || null,
                dni || null,
                address || null,
                notes || null,
                active === false ? 0 : 1,
                id,
            ]
        );

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error en PUT /api/resellers/[id]:", error);
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

        await pool.query("DELETE FROM resellers WHERE id_reseller = ?", [id]);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error en DELETE /api/resellers/[id]:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}