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
        o.status, 
        o.tag,
        o.createdAt, 
        o.delivered_at, 
        o.paid_at,
        o.commission_amount,
        o.commission_paid,
        o.id_reseller,
        r.name AS reseller_name
       FROM orders o
       LEFT JOIN resellers r ON r.id_reseller = o.id_reseller
       WHERE o.id_client = ?
       ORDER BY o.createdAt DESC`,
            [id]
        );

        return NextResponse.json({ orders: rows });
    } catch (error) {
        console.error("Error en GET /api/clients/[id]/orders:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}