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
        id_order, 
        total, 
        status, 
        createdAt, 
        delivered_at, 
        paid_at
       FROM orders
       WHERE id_client = ?
       ORDER BY createdAt DESC`,
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