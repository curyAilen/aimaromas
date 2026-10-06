import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const from = searchParams.get("from") || "";
        const to = searchParams.get("to") || "";

        // Rango de fechas por defecto: este mes
        const today = new Date();
        const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
        const defaultTo = today;

        const dateFrom = from || defaultFrom.toISOString().slice(0, 10);
        const dateTo = to || defaultTo.toISOString().slice(0, 10);

        // ============================================================
        // 1. KPIs PRINCIPALES
        // ============================================================
        const [kpiRows] = await pool.query<RowDataPacket[]>(
            `SELECT 
        COUNT(*) AS total_orders,
        COALESCE(SUM(total), 0) AS total_revenue,
        COALESCE(AVG(total), 0) AS avg_ticket,
        COUNT(DISTINCT id_client) AS unique_clients
       FROM orders
       WHERE status != 'cancelled'
         AND DATE(createdAt) >= ?
         AND DATE(createdAt) <= ?`,
            [dateFrom, dateTo]
        );

        const kpis = kpiRows[0] || {
            total_orders: 0,
            total_revenue: 0,
            avg_ticket: 0,
            unique_clients: 0,
        };

        // Clientes nuevos del período
        const [newClientsRows] = await pool.query<RowDataPacket[]>(
            `SELECT COUNT(*) AS count FROM clients
       WHERE DATE(createdAt) >= ? AND DATE(createdAt) <= ?`,
            [dateFrom, dateTo]
        );
        const newClients = newClientsRows[0]?.count || 0;

        // Pendiente de cobro (pedidos no pagados, sin importar el rango)
        const [pendingRows] = await pool.query<RowDataPacket[]>(
            `SELECT 
        COUNT(*) AS count,
        COALESCE(SUM(total), 0) AS total
       FROM orders
       WHERE paid_at IS NULL AND status != 'cancelled'`
        );
        const pendingPayment = pendingRows[0] || { count: 0, total: 0 };

        // ============================================================
        // 2. VENTAS POR DÍA (para gráfico de línea)
        // ============================================================
        const [salesByDay] = await pool.query<RowDataPacket[]>(
            `SELECT 
        DATE(createdAt) AS date,
        COUNT(*) AS orders,
        COALESCE(SUM(total), 0) AS revenue
       FROM orders
       WHERE status != 'cancelled'
         AND DATE(createdAt) >= ?
         AND DATE(createdAt) <= ?
       GROUP BY DATE(createdAt)
       ORDER BY date ASC`,
            [dateFrom, dateTo]
        );

        // ============================================================
        // 3. PRODUCTOS MÁS VENDIDOS (top 5)
        // ============================================================
        const [topProducts] = await pool.query<RowDataPacket[]>(
            `SELECT 
        oi.product_name,
        SUM(oi.quantity) AS total_qty,
        COALESCE(SUM(oi.subtotal), 0) AS total_revenue
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       WHERE o.status != 'cancelled'
         AND DATE(o.createdAt) >= ?
         AND DATE(o.createdAt) <= ?
       GROUP BY oi.product_name
       ORDER BY total_qty DESC
       LIMIT 5`,
            [dateFrom, dateTo]
        );

        // ============================================================
        // 4. TOP 10 CLIENTES (por monto total)
        // ============================================================
        const [topClients] = await pool.query<RowDataPacket[]>(
            `SELECT 
        c.id_client,
        c.name,
        c.phone,
        c.email,
        COUNT(o.id_order) AS order_count,
        COALESCE(SUM(o.total), 0) AS total_spent
       FROM clients c
       INNER JOIN orders o ON o.id_client = c.id_client
       WHERE o.status != 'cancelled'
         AND DATE(o.createdAt) >= ?
         AND DATE(o.createdAt) <= ?
       GROUP BY c.id_client, c.name, c.phone, c.email
       ORDER BY total_spent DESC
       LIMIT 10`,
            [dateFrom, dateTo]
        );

        // ============================================================
        // 5. PEDIDOS PENDIENTES DE PAGO
        // ============================================================
        const [pendingOrders] = await pool.query<RowDataPacket[]>(
            `SELECT 
        o.id_order,
        o.total,
        o.createdAt,
        o.delivered_at,
        c.name AS client_name,
        c.phone AS client_phone
       FROM orders o
       INNER JOIN clients c ON c.id_client = o.id_client
       WHERE o.paid_at IS NULL AND o.status != 'cancelled'
       ORDER BY o.createdAt ASC`
        );

        // ============================================================
        // 6. PRODUCTOS SIN VENTAS EN LOS ÚLTIMOS 60 DÍAS
        // ============================================================
        const [staleProducts] = await pool.query<RowDataPacket[]>(
            `SELECT 
        p.id_product,
        p.name,
        p.size_name,
        p.price,
        p.stock_status,
        c.name AS category_name,
        (
          SELECT MAX(o.createdAt)
          FROM order_items oi
          INNER JOIN orders o ON o.id_order = oi.id_order
          WHERE oi.id_product = p.id_product
            AND o.status != 'cancelled'
        ) AS last_sale
       FROM products p
       INNER JOIN categories c ON c.id_category = p.id_category
       WHERE p.active = 1
         AND p.stock_status != 'discontinued'
         AND (
           SELECT MAX(o.createdAt)
           FROM order_items oi
           INNER JOIN orders o ON o.id_order = oi.id_order
           WHERE oi.id_product = p.id_product
             AND o.status != 'cancelled'
         ) IS NULL
         OR (
           SELECT MAX(o.createdAt)
           FROM order_items oi
           INNER JOIN orders o ON o.id_order = oi.id_order
           WHERE oi.id_product = p.id_product
             AND o.status != 'cancelled'
         ) < DATE_SUB(NOW(), INTERVAL 60 DAY)
       ORDER BY last_sale ASC`
        );

        return NextResponse.json({
            range: { from: dateFrom, to: dateTo },
            kpis: {
                total_orders: Number(kpis.total_orders),
                total_revenue: Number(kpis.total_revenue),
                avg_ticket: Number(kpis.avg_ticket),
                unique_clients: Number(kpis.unique_clients),
                new_clients: Number(newClients),
                pending_count: Number(pendingPayment.count),
                pending_total: Number(pendingPayment.total),
            },
            salesByDay,
            topProducts,
            topClients,
            pendingOrders,
            staleProducts,
        });
    } catch (error) {
        console.error("Error en GET /api/analytics:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}