import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function POST(req: NextRequest) {
    const conn = await pool.getConnection();
    try {
        const body = await req.json();
        const {
            name,
            email,
            phone,
            requires_delivery,
            delivery_address,
            notes,
            items,
        } = body;

        // Validaciones
        if (!name || !email || !phone) {
            conn.release();
            return NextResponse.json(
                { error: "Nombre, email y teléfono son obligatorios" },
                { status: 400 }
            );
        }

        if (!items || items.length === 0) {
            conn.release();
            return NextResponse.json(
                { error: "El pedido no tiene productos" },
                { status: 400 }
            );
        }

        if (requires_delivery && !delivery_address) {
            conn.release();
            return NextResponse.json(
                { error: "Si requiere envío, ingresá la dirección" },
                { status: 400 }
            );
        }

        // Buscar cliente por email
        const [clientRows] = await conn.query<RowDataPacket[]>(
            "SELECT id_client, name, phone FROM clients WHERE email = ? LIMIT 1",
            [email]
        );

        let idClient: number;

        if (clientRows.length > 0) {
            idClient = clientRows[0].id_client;
            // Actualizar nombre y teléfono si cambiaron
            await conn.query(
                "UPDATE clients SET name = ?, phone = ?, updatedAt = NOW() WHERE id_client = ?",
                [name, phone, idClient]
            );
        } else {
            // Crear cliente nuevo
            const [newClient] = await conn.query<ResultSetHeader>(
                `INSERT INTO clients (name, email, phone, createdAt, updatedAt)
         VALUES (?, ?, ?, NOW(), NOW())`,
                [name, email, phone]
            );
            idClient = newClient.insertId;
        }

        // Calcular subtotal
        const subtotal = items.reduce(
            (acc: number, item: any) => acc + item.unit_price * item.quantity,
            0
        );

        // Leer settings
        const [settingsRows] = await conn.query<RowDataPacket[]>(
            "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('free_shipping_threshold', 'delivery_cost')"
        );
        const settings: Record<string, string> = {};
        for (const row of settingsRows) {
            settings[row.setting_key] = row.setting_value;
        }

        const freeShippingThreshold = Number(settings.free_shipping_threshold) || 80000;
        const deliveryCostBase = Number(settings.delivery_cost) || 5000;

        let deliveryCost = 0;
        if (requires_delivery && subtotal < freeShippingThreshold) {
            deliveryCost = deliveryCostBase;
        }

        const total = subtotal + deliveryCost;

        // Buscar un user admin para asignar el pedido (id_user es NOT NULL)
        const [adminRows] = await conn.query<RowDataPacket[]>(
            "SELECT id_user FROM users ORDER BY id_user ASC LIMIT 1"
        );

        if (adminRows.length === 0) {
            conn.release();
            return NextResponse.json(
                { error: "No hay usuarios configurados" },
                { status: 500 }
            );
        }

        const idUser = adminRows[0].id_user;

        // Insertar pedido
        const [orderResult] = await conn.query<ResultSetHeader>(
            `INSERT INTO orders 
       (id_client, id_user, total, delivery_cost, requires_delivery, delivery_address, status, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), NOW())`,
            [
                idClient,
                idUser,
                total,
                deliveryCost,
                requires_delivery ? 1 : 0,
                requires_delivery ? delivery_address : null,
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

        conn.release();

        return NextResponse.json(
            {
                ok: true,
                id_order: idOrder,
                is_new_client: clientRows.length === 0,
            },
            { status: 201 }
        );
    } catch (error) {
        conn.release();
        console.error("Error en POST /api/public/orders:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}