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

        const today = new Date();
        const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
        const defaultTo = today;

        const dateFrom = from || defaultFrom.toISOString().slice(0, 10);
        const dateTo = to || defaultTo.toISOString().slice(0, 10);

        // ============================================================
        // KPIs PRINCIPALES
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

        const [newClientsRows] = await pool.query<RowDataPacket[]>(
            `SELECT COUNT(*) AS count FROM clients
       WHERE DATE(createdAt) >= ? AND DATE(createdAt) <= ?`,
            [dateFrom, dateTo]
        );
        const newClients = newClientsRows[0]?.count || 0;

        const [pendingRows] = await pool.query<RowDataPacket[]>(
            `SELECT 
        COUNT(*) AS count,
        COALESCE(SUM(total), 0) AS total
       FROM orders
       WHERE paid_at IS NULL AND status != 'cancelled'`
        );
        const pendingPayment = pendingRows[0] || { count: 0, total: 0 };

        // ============================================================
        // VENTAS POR DÍA (rango seleccionado)
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
        // VENTAS POR MES (año actual - 12 meses)
        // ============================================================
        const currentYear = today.getFullYear();
        const [salesByMonth] = await pool.query<RowDataPacket[]>(
            `SELECT 
        MONTH(createdAt) AS month,
        YEAR(createdAt) AS year,
        COUNT(*) AS orders,
        COALESCE(SUM(total), 0) AS revenue
       FROM orders
       WHERE status != 'cancelled'
         AND YEAR(createdAt) = ?
       GROUP BY YEAR(createdAt), MONTH(createdAt)
       ORDER BY month ASC`,
            [currentYear]
        );

        // Completar los meses sin ventas
        const monthNames = [
            "Ene", "Feb", "Mar", "Abr", "May", "Jun",
            "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
        ];
        const salesByMonthComplete = monthNames.map((name, i) => {
            const found = salesByMonth.find(
                (m) => Number(m.month) === i + 1
            );
            return {
                month: i + 1,
                monthName: name,
                year: currentYear,
                orders: found ? Number(found.orders) : 0,
                revenue: found ? Number(found.revenue) : 0,
            };
        });

        // ============================================================
        // TOP 5 PRODUCTOS DEL MES
        // ============================================================
        const [topProductsMonth] = await pool.query<RowDataPacket[]>(
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
        // TOP 5 PRODUCTOS DEL AÑO
        // ============================================================
        const [topProductsYear] = await pool.query<RowDataPacket[]>(
            `SELECT 
        oi.product_name,
        SUM(oi.quantity) AS total_qty,
        COALESCE(SUM(oi.subtotal), 0) AS total_revenue
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       WHERE o.status != 'cancelled'
         AND YEAR(o.createdAt) = ?
       GROUP BY oi.product_name
       ORDER BY total_qty DESC
       LIMIT 5`,
            [currentYear]
        );

        // ============================================================
        // TOP 10 CLIENTES
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
        // PEDIDOS PENDIENTES DE PAGO
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
        // PRODUCTOS SIN VENTAS EN 60 DÍAS
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
          WHERE oi.id_product = p.id_product AND o.status != 'cancelled'
        ) AS last_sale
       FROM products p
       INNER JOIN categories c ON c.id_category = p.id_category
       WHERE p.active = 1
         AND p.stock_status != 'discontinued'
         AND (
           (
             SELECT MAX(o.createdAt)
             FROM order_items oi
             INNER JOIN orders o ON o.id_order = oi.id_order
             WHERE oi.id_product = p.id_product AND o.status != 'cancelled'
           ) IS NULL
           OR
           (
             SELECT MAX(o.createdAt)
             FROM order_items oi
             INNER JOIN orders o ON o.id_order = oi.id_order
             WHERE oi.id_product = p.id_product AND o.status != 'cancelled'
           ) < DATE_SUB(NOW(), INTERVAL 60 DAY)
         )
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
            salesByMonth: salesByMonthComplete,
            topProductsMonth,
            topProductsYear,
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