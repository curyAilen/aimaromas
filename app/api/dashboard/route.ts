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
        const tag = searchParams.get("tag") || "all";

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // ============================================================
        // CARD 1: VENTAS MENSUALES POR TAG
        // ============================================================
        const [ventasAromas] = await pool.query<RowDataPacket[]>(
            `SELECT COALESCE(SUM(o.total), 0) AS total
       FROM orders o
       WHERE o.status != 'cancelled'
         AND o.paid_at IS NOT NULL
         AND MONTH(o.paid_at) = MONTH(NOW())
         AND YEAR(o.paid_at) = YEAR(NOW())
         AND EXISTS (
           SELECT 1 FROM order_items oi
           INNER JOIN products p ON p.id_product = oi.id_product
           WHERE oi.id_order = o.id_order AND p.tag = 'aromas'
         )`
        );

        const [ventasRelax] = await pool.query<RowDataPacket[]>(
            `SELECT COALESCE(SUM(o.total), 0) AS total
       FROM orders o
       WHERE o.status != 'cancelled'
         AND o.paid_at IS NOT NULL
         AND MONTH(o.paid_at) = MONTH(NOW())
         AND YEAR(o.paid_at) = YEAR(NOW())
         AND EXISTS (
           SELECT 1 FROM order_items oi
           INNER JOIN products p ON p.id_product = oi.id_product
           WHERE oi.id_order = o.id_order AND p.tag = 'relax'
         )`
        );

        const [ventasTotal] = await pool.query<RowDataPacket[]>(
            `SELECT 
        COALESCE(SUM(total), 0) AS total,
        COUNT(*) AS orders_count
       FROM orders
       WHERE status != 'cancelled'
         AND paid_at IS NOT NULL
         AND MONTH(paid_at) = MONTH(NOW())
         AND YEAR(paid_at) = YEAR(NOW())`
        );

        const [clientesMes] = await pool.query<RowDataPacket[]>(
            `SELECT COUNT(DISTINCT id_client) AS total
       FROM orders
       WHERE status != 'cancelled'
         AND MONTH(createdAt) = MONTH(NOW())
         AND YEAR(createdAt) = YEAR(NOW())`
        );

        // ============================================================
        // CARD 2: PEDIDOS PENDIENTES
        // ============================================================
        const [pendientes] = await pool.query<RowDataPacket[]>(
            `SELECT 
        COUNT(*) AS count,
        COALESCE(SUM(o.total), 0) AS total
       FROM orders o
       WHERE o.paid_at IS NULL AND o.status != 'cancelled'`
        );

        let pendingQuery = `
      SELECT 
        o.id_order,
        o.tag,
        o.total,
        o.createdAt,
        c.name AS client_name,
        c.phone AS client_phone,
        r.name AS reseller_name
      FROM orders o
      INNER JOIN clients c ON c.id_client = o.id_client
      LEFT JOIN resellers r ON r.id_reseller = o.id_reseller
      WHERE o.paid_at IS NULL AND o.status != 'cancelled'
    `;

        if (tag === "aromas") {
            pendingQuery += " AND (o.tag = 'aromas' OR o.tag = 'mixed')";
        } else if (tag === "relax") {
            pendingQuery += " AND (o.tag = 'relax' OR o.tag = 'mixed')";
        }

        pendingQuery += " ORDER BY o.createdAt DESC LIMIT 10";

        const [pendingOrders] = await pool.query<RowDataPacket[]>(pendingQuery);

        // ============================================================
        // CARD 3: COMPRADOR N°1
        // ============================================================
        const [compradorMes] = await pool.query<RowDataPacket[]>(
            `SELECT 
        c.id_client, c.name,
        COUNT(o.id_order) AS order_count,
        COALESCE(SUM(o.total), 0) AS total_spent
       FROM clients c
       INNER JOIN orders o ON o.id_client = c.id_client
       WHERE o.status != 'cancelled'
         AND MONTH(o.createdAt) = MONTH(NOW())
         AND YEAR(o.createdAt) = YEAR(NOW())
       GROUP BY c.id_client, c.name
       ORDER BY total_spent DESC
       LIMIT 1`
        );

        const [compradorAnio] = await pool.query<RowDataPacket[]>(
            `SELECT 
        c.id_client, c.name,
        COUNT(o.id_order) AS order_count,
        COALESCE(SUM(o.total), 0) AS total_spent
       FROM clients c
       INNER JOIN orders o ON o.id_client = c.id_client
       WHERE o.status != 'cancelled'
         AND YEAR(o.createdAt) = YEAR(NOW())
       GROUP BY c.id_client, c.name
       ORDER BY total_spent DESC
       LIMIT 1`
        );

        // ============================================================
        // CARD 4: CUMPLEAÑOS
        // ============================================================
        const [birthdayRows] = await pool.query<RowDataPacket[]>(
            `SELECT id_client, name, phone, birthday FROM clients WHERE birthday IS NOT NULL`
        );

        const birthdays = birthdayRows
            .map((c) => {
                const bday = new Date(c.birthday);
                const nextBday = new Date(
                    today.getFullYear(),
                    bday.getMonth(),
                    bday.getDate()
                );
                if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1);
                const daysUntil = Math.ceil(
                    (nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );
                return {
                    id_client: c.id_client,
                    name: c.name,
                    phone: c.phone,
                    birthday: c.birthday,
                    days_until: daysUntil,
                    next_birthday: nextBday.toISOString().slice(0, 10),
                };
            })
            .sort((a, b) => a.days_until - b.days_until)
            .slice(0, 4);

        // ============================================================
        // CARD 5: TOP PRODUCTOS
        // ============================================================
        const [topAromasMes] = await pool.query<RowDataPacket[]>(
            `SELECT oi.product_name, oi.variant_scent, SUM(oi.quantity) AS total_qty
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       INNER JOIN products p ON p.id_product = oi.id_product
       WHERE o.status != 'cancelled'
         AND p.tag = 'aromas'
         AND MONTH(o.createdAt) = MONTH(NOW())
         AND YEAR(o.createdAt) = YEAR(NOW())
       GROUP BY oi.product_name, oi.variant_scent
       ORDER BY total_qty DESC
       LIMIT 1`
        );

        const [topAromasAnio] = await pool.query<RowDataPacket[]>(
            `SELECT oi.product_name, oi.variant_scent, SUM(oi.quantity) AS total_qty
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       INNER JOIN products p ON p.id_product = oi.id_product
       WHERE o.status != 'cancelled'
         AND p.tag = 'aromas'
         AND YEAR(o.createdAt) = YEAR(NOW())
       GROUP BY oi.product_name, oi.variant_scent
       ORDER BY total_qty DESC
       LIMIT 1`
        );

        const [topRelaxMes] = await pool.query<RowDataPacket[]>(
            `SELECT oi.product_name, oi.variant_scent, SUM(oi.quantity) AS total_qty
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       INNER JOIN products p ON p.id_product = oi.id_product
       WHERE o.status != 'cancelled'
         AND p.tag = 'relax'
         AND MONTH(o.createdAt) = MONTH(NOW())
         AND YEAR(o.createdAt) = YEAR(NOW())
       GROUP BY oi.product_name, oi.variant_scent
       ORDER BY total_qty DESC
       LIMIT 1`
        );

        const [topRelaxAnio] = await pool.query<RowDataPacket[]>(
            `SELECT oi.product_name, oi.variant_scent, SUM(oi.quantity) AS total_qty
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       INNER JOIN products p ON p.id_product = oi.id_product
       WHERE o.status != 'cancelled'
         AND p.tag = 'relax'
         AND YEAR(o.createdAt) = YEAR(NOW())
       GROUP BY oi.product_name, oi.variant_scent
       ORDER BY total_qty DESC
       LIMIT 1`
        );

        // ============================================================
        // FILA 3: VENTAS DEL AÑO POR MES Y POR ÁREA
        // ============================================================
        const currentYear = today.getFullYear();
        const [salesByMonthAromas] = await pool.query<RowDataPacket[]>(
            `SELECT 
        MONTH(o.createdAt) AS month,
        COALESCE(SUM(o.total), 0) AS revenue
       FROM orders o
       WHERE o.status != 'cancelled'
         AND YEAR(o.createdAt) = ?
         AND EXISTS (
           SELECT 1 FROM order_items oi
           INNER JOIN products p ON p.id_product = oi.id_product
           WHERE oi.id_order = o.id_order AND p.tag = 'aromas'
         )
       GROUP BY MONTH(o.createdAt)
       ORDER BY month ASC`,
            [currentYear]
        );

        const [salesByMonthRelax] = await pool.query<RowDataPacket[]>(
            `SELECT 
        MONTH(o.createdAt) AS month,
        COALESCE(SUM(o.total), 0) AS revenue
       FROM orders o
       WHERE o.status != 'cancelled'
         AND YEAR(o.createdAt) = ?
         AND EXISTS (
           SELECT 1 FROM order_items oi
           INNER JOIN products p ON p.id_product = oi.id_product
           WHERE oi.id_order = o.id_order AND p.tag = 'relax'
         )
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

        return NextResponse.json({
            tag,
            ventas: {
                aromas: Number(ventasAromas[0]?.total || 0),
                relax: Number(ventasRelax[0]?.total || 0),
                total: Number(ventasTotal[0]?.total || 0),
                orders_count: Number(ventasTotal[0]?.orders_count || 0),
                clientes: Number(clientesMes[0]?.total || 0),
            },
            pendientes: {
                count: Number(pendientes[0]?.count || 0),
                total: Number(pendientes[0]?.total || 0),
                orders: pendingOrders,
            },
            compradorMes: compradorMes[0] || null,
            compradorAnio: compradorAnio[0] || null,
            birthdays,
            topAromas: {
                mes: topAromasMes[0] || null,
                anio: topAromasAnio[0] || null,
            },
            topRelax: {
                mes: topRelaxMes[0] || null,
                anio: topRelaxAnio[0] || null,
            },
            salesByMonth,
        });
    } catch (error) {
        console.error("Error en GET /api/dashboard:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}