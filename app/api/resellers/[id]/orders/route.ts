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
            `SELECT 
        o.id_order,
        o.total,
        o.delivery_cost,
        o.status,
        o.tag,
        o.delivered_at,
        o.paid_at,
        o.createdAt,
        o.commission_percent,
        o.commission_amount,
        o.commission_paid,
        o.commission_paid_at,
        c.id_client,
        c.name AS client_name,
        c.phone AS client_phone,
        c.email AS client_email
       FROM orders o
       INNER JOIN clients c ON c.id_client = o.id_client
       WHERE o.id_reseller = ?
       ORDER BY o.createdAt DESC`,
            [id]
        );

        return NextResponse.json({ orders: rows });
    } catch (error) {
        console.error("Error en GET /api/resellers/[id]/orders:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}