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

        if (session.role !== "CEO") {
            return NextResponse.json(
                { error: "Solo el CEO puede acceder al overview" },
                { status: 403 }
            );
        }

        // ============================================================
        // VENTAS DEL MES POR TAG (usa order_items.subtotal)
        // ============================================================
        const [ventasAromas] = await pool.query<RowDataPacket[]>(
            `SELECT 
        COALESCE(SUM(oi.subtotal), 0) AS total,
        SUM(oi.quantity) AS units
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       INNER JOIN products p ON p.id_product = oi.id_product
       WHERE o.status != 'cancelled'
         AND o.paid_at IS NOT NULL
         AND MONTH(o.paid_at) = MONTH(NOW())
         AND YEAR(o.paid_at) = YEAR(NOW())
         AND p.tag = 'aromas'`
        );

        const [ventasRelax] = await pool.query<RowDataPacket[]>(
            `SELECT 
        COALESCE(SUM(oi.subtotal), 0) AS total,
        SUM(oi.quantity) AS units
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       INNER JOIN products p ON p.id_product = oi.id_product
       WHERE o.status != 'cancelled'
         AND o.paid_at IS NOT NULL
         AND MONTH(o.paid_at) = MONTH(NOW())
         AND YEAR(o.paid_at) = YEAR(NOW())
         AND p.tag = 'relax'`
        );

        // ============================================================
        // VENTAS DEL AÑO POR TAG
        // ============================================================
        const [ventasAromasAnio] = await pool.query<RowDataPacket[]>(
            `SELECT COALESCE(SUM(oi.subtotal), 0) AS total
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       INNER JOIN products p ON p.id_product = oi.id_product
       WHERE o.status != 'cancelled'
         AND o.paid_at IS NOT NULL
         AND YEAR(o.paid_at) = YEAR(NOW())
         AND p.tag = 'aromas'`
        );

        const [ventasRelaxAnio] = await pool.query<RowDataPacket[]>(
            `SELECT COALESCE(SUM(oi.subtotal), 0) AS total
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       INNER JOIN products p ON p.id_product = oi.id_product
       WHERE o.status != 'cancelled'
         AND o.paid_at IS NOT NULL
         AND YEAR(o.paid_at) = YEAR(NOW())
         AND p.tag = 'relax'`
        );

        // ============================================================
        // PEDIDOS POR TAG
        // ============================================================
        const [pedidosStats] = await pool.query<RowDataPacket[]>(
            `SELECT 
        tag,
        COUNT(*) AS count,
        COALESCE(SUM(total), 0) AS total
       FROM orders
       WHERE status != 'cancelled'
         AND MONTH(createdAt) = MONTH(NOW())
         AND YEAR(createdAt) = YEAR(NOW())
       GROUP BY tag`
        );

        // ============================================================
        // PENDIENTES DE PAGO POR TAG
        // ============================================================
        const [pendientesAromas] = await pool.query<RowDataPacket[]>(
            `SELECT 
        COUNT(*) AS count,
        COALESCE(SUM(total), 0) AS total
       FROM orders
       WHERE paid_at IS NULL
         AND status != 'cancelled'
         AND (tag = 'aromas' OR tag = 'mixed')`
        );

        const [pendientesRelax] = await pool.query<RowDataPacket[]>(
            `SELECT 
        COUNT(*) AS count,
        COALESCE(SUM(total), 0) AS total
       FROM orders
       WHERE paid_at IS NULL
         AND status != 'cancelled'
         AND (tag = 'relax' OR tag = 'mixed')`
        );

        // ============================================================
        // TOP 3 PRODUCTOS POR ÁREA (MES)
        // ============================================================
        const [topAromas] = await pool.query<RowDataPacket[]>(
            `SELECT 
        oi.product_name,
        SUM(oi.quantity) AS total_qty,
        COALESCE(SUM(oi.subtotal), 0) AS total_revenue
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       INNER JOIN products p ON p.id_product = oi.id_product
       WHERE o.status != 'cancelled'
         AND p.tag = 'aromas'
         AND MONTH(o.createdAt) = MONTH(NOW())
         AND YEAR(o.createdAt) = YEAR(NOW())
       GROUP BY oi.product_name
       ORDER BY total_qty DESC
       LIMIT 3`
        );

        const [topRelax] = await pool.query<RowDataPacket[]>(
            `SELECT 
        oi.product_name,
        SUM(oi.quantity) AS total_qty,
        COALESCE(SUM(oi.subtotal), 0) AS total_revenue
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       INNER JOIN products p ON p.id_product = oi.id_product
       WHERE o.status != 'cancelled'
         AND p.tag = 'relax'
         AND MONTH(o.createdAt) = MONTH(NOW())
         AND YEAR(o.createdAt) = YEAR(NOW())
       GROUP BY oi.product_name
       ORDER BY total_qty DESC
       LIMIT 3`
        );

        // ============================================================
        // VENTAS POR MES (AÑO) POR ÁREA
        // ============================================================
        const currentYear = new Date().getFullYear();
        const [salesByMonthAromas] = await pool.query<RowDataPacket[]>(
            `SELECT 
        MONTH(o.createdAt) AS month,
        COALESCE(SUM(oi.subtotal), 0) AS revenue
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       INNER JOIN products p ON p.id_product = oi.id_product
       WHERE o.status != 'cancelled'
         AND YEAR(o.createdAt) = ?
         AND p.tag = 'aromas'
       GROUP BY MONTH(o.createdAt)
       ORDER BY month ASC`,
            [currentYear]
        );

        const [salesByMonthRelax] = await pool.query<RowDataPacket[]>(
            `SELECT 
        MONTH(o.createdAt) AS month,
        COALESCE(SUM(oi.subtotal), 0) AS revenue
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       INNER JOIN products p ON p.id_product = oi.id_product
       WHERE o.status != 'cancelled'
         AND YEAR(o.createdAt) = ?
         AND p.tag = 'relax'
       GROUP BY MONTH(o.createdAt)
       ORDER BY month ASC`,
            [currentYear]
        );

        const monthNames = [
            "Ene", "Feb", "Mar", "Abr", "May", "Jun",
            "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
        ];
        const salesByMonth = monthNames.map((name, i) => {
            const aromasFound = salesByMonthAromas.find(
                (m) => Number(m.month) === i + 1
            );
            const relaxFound = salesByMonthRelax.find(
                (m) => Number(m.month) === i + 1
            );
            return {
                monthName: name,
                Aromas: aromasFound ? Number(aromasFound.revenue) : 0,
                Relax: relaxFound ? Number(relaxFound.revenue) : 0,
            };
        });

        const aromasStats = pedidosStats.find((p) => p.tag === "aromas") || {
            count: 0,
            total: 0,
        };
        const relaxStats = pedidosStats.find((p) => p.tag === "relax") || {
            count: 0,
            total: 0,
        };
        const mixedStats = pedidosStats.find((p) => p.tag === "mixed") || {
            count: 0,
            total: 0,
        };

        return NextResponse.json({
            ventasMes: {
                aromas: Number(ventasAromas[0]?.total || 0),
                relax: Number(ventasRelax[0]?.total || 0),
                aromasUnits: Number(ventasAromas[0]?.units || 0),
                relaxUnits: Number(ventasRelax[0]?.units || 0),
            },
            ventasAnio: {
                aromas: Number(ventasAromasAnio[0]?.total || 0),
                relax: Number(ventasRelaxAnio[0]?.total || 0),
            },
            pedidos: {
                aromas: { count: Number(aromasStats.count), total: Number(aromasStats.total) },
                relax: { count: Number(relaxStats.count), total: Number(relaxStats.total) },
                mixed: { count: Number(mixedStats.count), total: Number(mixedStats.total) },
            },
            pendientes: {
                aromas: {
                    count: Number(pendientesAromas[0]?.count || 0),
                    total: Number(pendientesAromas[0]?.total || 0),
                },
                relax: {
                    count: Number(pendientesRelax[0]?.count || 0),
                    total: Number(pendientesRelax[0]?.total || 0),
                },
            },
            topProductos: {
                aromas: topAromas,
                relax: topRelax,
            },
            salesByMonth,
        });
    } catch (error) {
        console.error("Error en GET /api/overview:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}