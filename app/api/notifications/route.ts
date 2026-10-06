import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Pedidos nuevos (últimas 24h)
        const [newOrders] = await pool.query<RowDataPacket[]>(
            `SELECT 
        o.id_order, 
        o.total, 
        c.name AS client_name, 
        o.createdAt
       FROM orders o
       INNER JOIN clients c ON c.id_client = o.id_client
       WHERE o.createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
         AND o.status = 'pending'
       ORDER BY o.createdAt DESC
       LIMIT 10`
        );

        // Pedidos pagados recientemente (últimas 24h)
        const [paidOrders] = await pool.query<RowDataPacket[]>(
            `SELECT 
        o.id_order, 
        o.total, 
        c.name AS client_name, 
        o.paid_at
       FROM orders o
       INNER JOIN clients c ON c.id_client = o.id_client
       WHERE o.paid_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       ORDER BY o.paid_at DESC
       LIMIT 10`
        );

        // Pedidos entregados sin pagar
        const [unpaidRows] = await pool.query<RowDataPacket[]>(
            `SELECT 
        COUNT(*) AS count, 
        COALESCE(SUM(total), 0) AS total
       FROM orders
       WHERE delivered_at IS NOT NULL 
         AND paid_at IS NULL 
         AND status != 'cancelled'`
        );

        const unpaidDelivered = unpaidRows[0] || { count: 0, total: "0" };

        return NextResponse.json({
            newOrders: newOrders || [],
            paidOrders: paidOrders || [],
            unpaidDelivered: {
                count: Number(unpaidDelivered.count) || 0,
                total: String(unpaidDelivered.total || "0"),
            },
            unreadCount: (newOrders?.length || 0) + (paidOrders?.length || 0),
        });
    } catch (error) {
        console.error("Error en GET /api/notifications:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}