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
        const tag = searchParams.get("tag") || "all"; // "aromas" | "relax" | "all"

        // Condición WHERE según el tag
        let tagCondition = "";
        if (tag === "aromas") tagCondition = " AND p.tag = 'aromas'";
        else if (tag === "relax") tagCondition = " AND p.tag = 'relax'";

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // ============================================================
        // CARD 1: VENTAS MENSUALES (por tag)
        // ============================================================
        const [ventasGrupoA] = await pool.query<RowDataPacket[]>(
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

        const [ventasGrupoB] = await pool.query<RowDataPacket[]>(
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
        COALESCE(SUM(total), 0) AS total
       FROM orders
       WHERE paid_at IS NULL AND status != 'cancelled'`
        );

        // ============================================================
        // CARD 2B: COMPRADOR N°1 DEL MES Y DEL AÑO
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
        // CARD 3: PRÓXIMOS CUMPLEAÑOS
        // ============================================================
        const [birthdayRows] = await pool.query<RowDataPacket[]>(
            `SELECT id_client, name, phone, birthday FROM clients WHERE birthday IS NOT NULL`
        );

        const birthdays = birthdayRows
            .map((c) => {
                const bday = new Date(c.birthday);
                const nextBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
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
            .slice(0, 8);

        // ============================================================
        // CARD 4: TOP PRODUCTO (según tag seleccionado)
        // ============================================================
        const [topProductoMes] = await pool.query<RowDataPacket[]>(
            `SELECT 
        oi.product_name,
        oi.variant_scent,
        SUM(oi.quantity) AS total_qty
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       INNER JOIN products p ON p.id_product = oi.id_product
       WHERE o.status != 'cancelled'
         ${tagCondition}
         AND MONTH(o.createdAt) = MONTH(NOW())
         AND YEAR(o.createdAt) = YEAR(NOW())
       GROUP BY oi.product_name, oi.variant_scent
       ORDER BY total_qty DESC
       LIMIT 1`
        );

        const [topProductoAnio] = await pool.query<RowDataPacket[]>(
            `SELECT 
        oi.product_name,
        oi.variant_scent,
        SUM(oi.quantity) AS total_qty
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       INNER JOIN products p ON p.id_product = oi.id_product
       WHERE o.status != 'cancelled'
         ${tagCondition}
         AND YEAR(o.createdAt) = YEAR(NOW())
       GROUP BY oi.product_name, oi.variant_scent
       ORDER BY total_qty DESC
       LIMIT 1`
        );

        // ============================================================
        // CARD 5: VENTAS POR TAG (aromas vs relax)
        // ============================================================
        const [tagStats] = await pool.query<RowDataPacket[]>(
            `SELECT 
        p.tag,
        COALESCE(SUM(oi.subtotal), 0) AS total_revenue,
        SUM(oi.quantity) AS total_qty
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       INNER JOIN products p ON p.id_product = oi.id_product
       WHERE o.status != 'cancelled'
         AND YEAR(o.createdAt) = YEAR(NOW())
       GROUP BY p.tag`
        );

        return NextResponse.json({
            tag,
            ventas: {
                grupoA: Number(ventasGrupoA[0]?.total || 0),
                grupoB: Number(ventasGrupoB[0]?.total || 0),
                total: Number(ventasTotal[0]?.total || 0),
                orders_count: Number(ventasTotal[0]?.orders_count || 0),
                clientes: Number(clientesMes[0]?.total || 0),
            },
            pendientes: {
                count: Number(pendientes[0]?.count || 0),
                total: Number(pendientes[0]?.total || 0),
            },
            compradorMes: compradorMes[0] || null,
            compradorAnio: compradorAnio[0] || null,
            birthdays,
            topProducto: {
                mes: topProductoMes[0] || null,
                anio: topProductoAnio[0] || null,
            },
            tagStats,
        });
    } catch (error) {
        console.error("Error en GET /api/dashboard:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}