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
        const from = searchParams.get("from") || "";
        const to = searchParams.get("to") || "";
        const tag = searchParams.get("tag") || "";
        const idReseller = searchParams.get("id_reseller") || "";

        // Rango por defecto: mes corriente
        const today = new Date();
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const dateFrom = from || firstOfMonth.toISOString().slice(0, 10);
        const dateTo = to || today.toISOString().slice(0, 10);

        let query = `
      SELECT 
        o.*,
        c.name AS client_name,
        c.phone AS client_phone,
        u.name AS user_name,
        r.name AS reseller_name
      FROM orders o
      INNER JOIN clients c ON c.id_client = o.id_client
      INNER JOIN users u ON u.id_user = o.id_user
      LEFT JOIN resellers r ON r.id_reseller = o.id_reseller
      WHERE DATE(o.createdAt) >= ?
        AND DATE(o.createdAt) <= ?
    `;
        const params: (string | number)[] = [dateFrom, dateTo];

        // Filtro por tag
        if (tag === "aromas" || tag === "relax") {
            query += " AND (o.tag = ? OR o.tag = 'mixed')";
            params.push(tag);
        } else if (tag === "mix") {
            query += " AND o.tag = 'mixed'";
        }

        // Filtro por revendedora
        if (idReseller) {
            query += " AND o.id_reseller = ?";
            params.push(idReseller);
        }

        // Filtro por búsqueda
        if (search) {
            query += " AND (c.name LIKE ? OR c.phone LIKE ? OR o.id_order = ?)";
            const like = `%${search}%`;
            params.push(like, like, search);
        }

        // Filtro por estado
        if (status) {
            query += " AND o.status = ?";
            params.push(status);
        }

        query += " ORDER BY o.createdAt DESC";

        const [rows] = await pool.query<RowDataPacket[]>(query, params);

        return NextResponse.json({
            orders: rows,
            range: { from: dateFrom, to: dateTo },
        });
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
        const {
            id_client,
            id_reseller,
            commission_percent,
            pays_next_month,   // Opcional: si viene, sobreescribe el default
            requires_delivery,
            delivery_address,
            notes,
            items,
        } = body;

        if (!id_client || !items || items.length === 0) {
            conn.release();
            return NextResponse.json(
                { error: "Cliente e items son obligatorios" },
                { status: 400 }
            );
        }

        // Calcular subtotal
        const subtotal = items.reduce(
            (acc: number, item: any) => acc + item.unit_price * item.quantity,
            0
        );

        // Leer settings de envío
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

        // Calcular costo de envío
        let deliveryCost = 0;
        if (requires_delivery && subtotal < freeShippingThreshold) {
            deliveryCost = deliveryCostBase;
        }

        const total = subtotal + deliveryCost;

        // Detectar tag del pedido (aromas / relax / mixed)
        const productIds = items.map((i: any) => i.id_product);
        const [tagsRows] = await conn.query<RowDataPacket[]>(
            "SELECT DISTINCT tag FROM products WHERE id_product IN (?)",
            [productIds]
        );
        const tags = tagsRows.map((r) => r.tag);
        let orderTag: string = "aromas";
        if (tags.includes("aromas") && tags.includes("relax")) {
            orderTag = "mixed";
        } else if (tags.includes("relax")) {
            orderTag = "relax";
        } else if (tags.includes("aromas")) {
            orderTag = "aromas";
        } else if (tags.includes("mix")) {
            orderTag = "mixed";
        }

        // Calcular comisión
        let finalCommissionPercent = 0;
        if (id_reseller) {
            if (commission_percent !== undefined && commission_percent !== null && commission_percent !== "") {
                // Si el usuario especificó un %
                finalCommissionPercent = Number(commission_percent);
            } else {
                // Si no, usar el default de la revendedora
                const [resellerRows] = await conn.query<RowDataPacket[]>(
                    "SELECT default_commission_percent FROM resellers WHERE id_reseller = ? LIMIT 1",
                    [id_reseller]
                );
                finalCommissionPercent = resellerRows.length
                    ? Number(resellerRows[0].default_commission_percent)
                    : 0;
            }
        }

        // La comisión se calcula sobre el SUBTOTAL (sin envío)
        const commissionAmount = Number(
            ((subtotal * finalCommissionPercent) / 100).toFixed(2)
        );

        await conn.beginTransaction();

        // Insertar pedido
        const [orderResult] = await conn.query<ResultSetHeader>(
            `INSERT INTO orders 
   (id_client, id_user, id_reseller, total, delivery_cost, requires_delivery, delivery_address, status, tag, commission_percent, commission_amount, commission_paid, pays_next_month, notes, createdAt, updatedAt)
   VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, 0, ?, ?, NOW(), NOW())`,
            [
                id_client,
                session.userId,
                id_reseller || null,
                total,
                deliveryCost,
                requires_delivery ? 1 : 0,
                requires_delivery && delivery_address ? delivery_address : null,
                orderTag,
                finalCommissionPercent,
                commissionAmount,
                pays_next_month ? 1 : 0,   // ⬅️ NUEVO
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