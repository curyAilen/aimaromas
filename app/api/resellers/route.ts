import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
        r.id_reseller,
        r.name,
        r.phone,
        r.email,
        r.dni,
        r.address,
        r.notes,
        r.active,
        r.createdAt,
        (SELECT COUNT(*) FROM orders o WHERE o.id_reseller = r.id_reseller AND o.status != 'cancelled') AS order_count,
        (SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.id_reseller = r.id_reseller AND o.status != 'cancelled') AS total_sold
       FROM resellers r
       ORDER BY r.name ASC`
        );

        return NextResponse.json({ resellers: rows });
    } catch (error) {
        console.error("Error en GET /api/resellers:", error);
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
        const { name, phone, email, dni, address, notes } = body;

        if (!name) {
            return NextResponse.json(
                { error: "El nombre es obligatorio" },
                { status: 400 }
            );
        }

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO resellers (name, phone, email, dni, address, notes, active, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
            [
                name,
                phone || null,
                email || null,
                dni || null,
                address || null,
                notes || null,
            ]
        );

        return NextResponse.json(
            { ok: true, id_reseller: result.insertId },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error en POST /api/resellers:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}