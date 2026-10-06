import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

// GET /api/orders
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";

        let query = `
      SELECT 
        o.*,
        c.name AS client_name,
        c.phone AS client_phone,
        u.name AS user_name
      FROM orders o
      INNER JOIN clients c ON c.id_client = o.id_client
      INNER JOIN users u ON u.id_user = o.id_user
      WHERE 1 = 1
    `;
        const params: (string | number)[] = [];

        if (search) {
            query += " AND (c.name LIKE ? OR c.phone LIKE ? OR o.id_order = ?)";
            const like = `%${search}%`;
            params.push(like, like, search);
        }

        if (status) {
            query += " AND o.status = ?";
            params.push(status);
        }

        query += " ORDER BY o.createdAt DESC";

        const [rows] = await pool.query<RowDataPacket[]>(query, params);

        return NextResponse.json({ orders: rows });
    } catch (error) {
        console.error("Error en GET /api/orders:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

// POST /api/orders
export async function POST(req: NextRequest) {
    const conn = await pool.getConnection();
    try {
        const session = await getSession();
        if (!session) {
            conn.release();
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { id_client, requires_delivery, delivery_address, notes, items } = body;

        if (!id_client || !items || items.length === 0) {
            conn.release();
            return NextResponse.json(
                { error: "Cliente e items son obligatorios" },
                { status: 400 }
            );
        }

        // Calcular subtotal (sin envío todavía)
        const subtotal = items.reduce(
            (acc: number, item: any) => acc + item.unit_price * item.quantity,
            0
        );

        // Leer el threshold de envío gratis
        const [settingsRows] = await conn.query<RowDataPacket[]>(
            "SELECT setting_value FROM settings WHERE setting_key = 'free_shipping_threshold'"
        );
        const freeShippingThreshold = settingsRows.length
            ? Number(settingsRows[0].setting_value)
            : 80000;

        const [deliveryRows] = await conn.query<RowDataPacket[]>(
            "SELECT setting_value FROM settings WHERE setting_key = 'delivery_cost'"
        );
        const deliveryCostBase = deliveryRows.length
            ? Number(deliveryRows[0].setting_value)
            : 5000;

        // Determinar costo de envío
        let deliveryCost = 0;
        if (requires_delivery && subtotal < freeShippingThreshold) {
            deliveryCost = deliveryCostBase;
        }

        const total = subtotal + deliveryCost;

        await conn.beginTransaction();

        // Insertar pedido
        const [orderResult] = await conn.query<ResultSetHeader>(
            `INSERT INTO orders 
       (id_client, id_user, total, delivery_cost, requires_delivery, delivery_address, status, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), NOW())`,
            [
                id_client,
                session.userId,
                total,
                deliveryCost,
                requires_delivery ? 1 : 0,
                requires_delivery && delivery_address ? delivery_address : null,
                notes || null,
            ]
        );

        const idOrder = orderResult.insertId;

        // Insertar items
        for (const item of items) {
            await conn.query(
                `INSERT INTO order_items 
         (id_order, id_product, id_variant, product_name, variant_scent, quantity, unit_price, subtotal, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    idOrder,
                    item.id_product,
                    item.id_variant || null,
                    item.product_name,
                    item.variant_scent || null,
                    item.quantity,
                    item.unit_price,
                    item.unit_price * item.quantity,
                ]
            );
        }

        await conn.commit();
        conn.release();

        return NextResponse.json({ ok: true, id_order: idOrder }, { status: 201 });
    } catch (error) {
        await conn.rollback();
        conn.release();
        console.error("Error en POST /api/orders:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}