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

        // Totales generales
        const [totals] = await pool.query<RowDataPacket[]>(
            `SELECT 
        COUNT(*) AS total_orders,
        COALESCE(SUM(total), 0) AS total_sold,
        COALESCE(SUM(CASE WHEN paid_at IS NULL THEN total ELSE 0 END), 0) AS pending_payment,
        COUNT(DISTINCT id_client) AS unique_clients,
        COALESCE(SUM(commission_amount), 0) AS total_commission,
        COALESCE(SUM(CASE WHEN commission_paid = 0 THEN commission_amount ELSE 0 END), 0) AS pending_commission,
        COALESCE(SUM(CASE WHEN commission_paid = 1 THEN commission_amount ELSE 0 END), 0) AS paid_commission
       FROM orders
       WHERE id_reseller = ? AND status != 'cancelled'`,
            [id]
        );

        // Ventas por mes
        const [salesByMonth] = await pool.query<RowDataPacket[]>(
            `SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') AS month,
        COUNT(*) AS orders,
        COALESCE(SUM(total), 0) AS revenue,
        COALESCE(SUM(commission_amount), 0) AS commission
       FROM orders
       WHERE id_reseller = ? 
         AND status != 'cancelled'
         AND createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
       ORDER BY month ASC`,
            [id]
        );

        // Top productos vendidos por esta revendedora
        const [topProducts] = await pool.query<RowDataPacket[]>(
            `SELECT 
        oi.product_name,
        SUM(oi.quantity) AS total_qty,
        COALESCE(SUM(oi.subtotal), 0) AS total_revenue
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       WHERE o.id_reseller = ? AND o.status != 'cancelled'
       GROUP BY oi.product_name
       ORDER BY total_qty DESC
       LIMIT 10`,
            [id]
        );

        // Top clientes de esta revendedora
        const [topClients] = await pool.query<RowDataPacket[]>(
            `SELECT 
        c.id_client,
        c.name,
        c.phone,
        COUNT(o.id_order) AS order_count,
        COALESCE(SUM(o.total), 0) AS total_spent
       FROM clients c
       INNER JOIN orders o ON o.id_client = c.id_client
       WHERE o.id_reseller = ? AND o.status != 'cancelled'
       GROUP BY c.id_client, c.name, c.phone
       ORDER BY total_spent DESC
       LIMIT 10`,
            [id]
        );

        return NextResponse.json({
            totals: totals[0] || {
                total_orders: 0,
                total_sold: 0,
                pending_payment: 0,
                unique_clients: 0,
                total_commission: 0,
                pending_commission: 0,
                paid_commission: 0,
            },
            salesByMonth,
            topProducts,
            topClients,
        });
    } catch (error) {
        console.error("Error en GET /api/resellers/[id]/stats:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}