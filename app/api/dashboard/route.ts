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

        const CATEGORIAS_AROMAS = ["velas-de-soja", "wax-melts"];
        const CATEGORIAS_JABONES = [
            "jabones-piel-seca",
            "jabones-piel-grasa",
            "jabones-piel-mixta",
        ];

        // ============================================================
        // CARD 1: VENTAS MENSUALES
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
           INNER JOIN categories c ON c.id_category = p.id_category
           WHERE oi.id_order = o.id_order AND c.slug IN (?)
         )`,
            [CATEGORIAS_AROMAS]
        );

        const [ventasGrupoB] = await pool.query<RowDataPacket[]>(
            `SELECT COALESCE(SUM(o.total), 0) AS total
       FROM orders o
       WHERE o.status != 'cancelled'
         AND o.paid_at IS NOT NULL
         AND MONTH(o.paid_at) = MONTH(NOW())
         AND YEAR(o.paid_at) = YEAR(NOW())
         AND NOT EXISTS (
           SELECT 1 FROM order_items oi
           INNER JOIN products p ON p.id_product = oi.id_product
           INNER JOIN categories c ON c.id_category = p.id_category
           WHERE oi.id_order = o.id_order AND c.slug IN (?)
         )`,
            [CATEGORIAS_AROMAS]
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
        c.id_client,
        c.name,
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
        c.id_client,
        c.name,
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

        const today = new Date();
        today.setHours(0, 0, 0, 0);

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
        // CARD 4: PRODUCTO MÁS VENDIDO - AROMAS
        // ============================================================
        const [topAromaMes] = await pool.query<RowDataPacket[]>(
            `SELECT 
        oi.product_name,
        oi.variant_scent,
        SUM(oi.quantity) AS total_qty
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       INNER JOIN products p ON p.id_product = oi.id_product
       INNER JOIN categories c ON c.id_category = p.id_category
       WHERE o.status != 'cancelled'
         AND c.slug IN (?)
         AND MONTH(o.createdAt) = MONTH(NOW())
         AND YEAR(o.createdAt) = YEAR(NOW())
       GROUP BY oi.product_name, oi.variant_scent
       ORDER BY total_qty DESC
       LIMIT 1`,
            [CATEGORIAS_AROMAS]
        );

        const [topAromaAnio] = await pool.query<RowDataPacket[]>(
            `SELECT 
        oi.product_name,
        oi.variant_scent,
        SUM(oi.quantity) AS total_qty
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       INNER JOIN products p ON p.id_product = oi.id_product
       INNER JOIN categories c ON c.id_category = p.id_category
       WHERE o.status != 'cancelled'
         AND c.slug IN (?)
         AND YEAR(o.createdAt) = YEAR(NOW())
       GROUP BY oi.product_name, oi.variant_scent
       ORDER BY total_qty DESC
       LIMIT 1`,
            [CATEGORIAS_AROMAS]
        );

        // ============================================================
        // CARD 5: PRODUCTO MÁS VENDIDO - JABONES
        // ============================================================
        const [topJabonMes] = await pool.query<RowDataPacket[]>(
            `SELECT 
        oi.product_name,
        oi.variant_scent,
        SUM(oi.quantity) AS total_qty
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       INNER JOIN products p ON p.id_product = oi.id_product
       INNER JOIN categories c ON c.id_category = p.id_category
       WHERE o.status != 'cancelled'
         AND c.slug IN (?)
         AND MONTH(o.createdAt) = MONTH(NOW())
         AND YEAR(o.createdAt) = YEAR(NOW())
       GROUP BY oi.product_name, oi.variant_scent
       ORDER BY total_qty DESC
       LIMIT 1`,
            [CATEGORIAS_JABONES]
        );

        const [topJabonAnio] = await pool.query<RowDataPacket[]>(
            `SELECT 
        oi.product_name,
        oi.variant_scent,
        SUM(oi.quantity) AS total_qty
       FROM order_items oi
       INNER JOIN orders o ON o.id_order = oi.id_order
       INNER JOIN products p ON p.id_product = oi.id_product
       INNER JOIN categories c ON c.id_category = p.id_category
       WHERE o.status != 'cancelled'
         AND c.slug IN (?)
         AND YEAR(o.createdAt) = YEAR(NOW())
       GROUP BY oi.product_name, oi.variant_scent
       ORDER BY total_qty DESC
       LIMIT 1`,
            [CATEGORIAS_JABONES]
        );

        return NextResponse.json({
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
            topAroma: { mes: topAromaMes[0] || null, anio: topAromaAnio[0] || null },
            topJabon: { mes: topJabonMes[0] || null, anio: topJabonAnio[0] || null },
        });
    } catch (error) {
        console.error("Error en GET /api/dashboard:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}