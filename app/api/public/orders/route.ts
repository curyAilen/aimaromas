import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { getSettings } from "@/lib/settings";
import { deductStockForOrder } from "@/lib/stock";
import { sendNewOrderEmail } from "@/lib/email";
import { countRecent, getClientIp, recordEvent } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

// Límites para evitar pedidos absurdos desde la tienda
const MAX_ITEMS = 50;
const MAX_QTY_PER_ITEM = 100;
// Anti-spam: máximo de pedidos por IP por hora
const MAX_ORDERS_PER_HOUR = 10;
const ORDER_BUCKET = "public_order";

interface IncomingItem {
    id_product: number;
    id_variant: number | null;
    quantity: number;
}

interface PricedItem {
    id_product: number;
    id_variant: number | null;
    product_name: string;
    variant_scent: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
    tag: string;
}

/**
 * Valida lo que manda el carrito. Del navegador SOLO se toma qué producto,
 * qué fragancia y cuántas unidades. Precio y nombre se leen de la base.
 */
function parseItems(raw: unknown): IncomingItem[] | null {
    if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_ITEMS) {
        return null;
    }
    const items: IncomingItem[] = [];
    for (const r of raw) {
        const idProduct = Number(r?.id_product);
        const idVariant =
            r?.id_variant === null || r?.id_variant === undefined || r?.id_variant === ""
                ? null
                : Number(r.id_variant);
        const quantity = Number(r?.quantity);
        if (
            !Number.isInteger(idProduct) || idProduct <= 0 ||
            (idVariant !== null && (!Number.isInteger(idVariant) || idVariant <= 0)) ||
            !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY_PER_ITEM
        ) {
            return null;
        }
        items.push({ id_product: idProduct, id_variant: idVariant, quantity });
    }
    return items;
}

export async function POST(req: NextRequest) {
    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
    }

    // Campo trampa: las personas no lo ven ni lo completan, los robots sí
    if (typeof body?.website === "string" && body.website.trim() !== "") {
        return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
    }

    const ip = getClientIp(req);
    if ((await countRecent(ORDER_BUCKET, ip, 60)) >= MAX_ORDERS_PER_HOUR) {
        return NextResponse.json(
            { error: "Enviaste muchos pedidos seguidos. Probá de nuevo en un rato o escribinos por WhatsApp." },
            { status: 429, headers: { "Retry-After": "3600" } }
        );
    }
    if (!(await verifyTurnstile(body?.turnstileToken, ip))) {
        return NextResponse.json(
            { error: "No pudimos verificar que sos una persona. Recargá la página e intentá de nuevo." },
            { status: 400 }
        );
    }

    await ensureSchema();

    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const phone = String(body?.phone ?? "").trim();
    const requiresDelivery = Boolean(body?.requires_delivery);
    const deliveryAddress = String(body?.delivery_address ?? "").trim();
    const notes = String(body?.notes ?? "").trim();

    // Validaciones
    if (!name || !email || !phone) {
        return NextResponse.json(
            { error: "Nombre, email y teléfono son obligatorios" },
            { status: 400 }
        );
    }

    const incoming = parseItems(body?.items);
    if (!incoming) {
        return NextResponse.json(
            { error: "El pedido no tiene productos válidos" },
            { status: 400 }
        );
    }

    if (requiresDelivery && !deliveryAddress) {
        return NextResponse.json(
            { error: "Si requiere envío, ingresá la dirección" },
            { status: 400 }
        );
    }

    const conn = await pool.getConnection();
    try {
        // ------------------------------------------------------------
        // 1. Precios, nombres y fragancias desde la base
        //    (mismas reglas que la tienda: activo y no discontinuado)
        // ------------------------------------------------------------
        const productIds = [...new Set(incoming.map((i) => i.id_product))];
        const [productRows] = await conn.query<RowDataPacket[]>(
            `SELECT id_product, name, price, tag
             FROM products
             WHERE id_product IN (?) AND active = 1 AND stock_status != 'discontinued'`,
            [productIds]
        );
        const products = new Map(productRows.map((p) => [Number(p.id_product), p]));

        const variantIds = incoming
            .map((i) => i.id_variant)
            .filter((v): v is number => v !== null);
        const variants = new Map<number, RowDataPacket>();
        if (variantIds.length > 0) {
            const [variantRows] = await conn.query<RowDataPacket[]>(
                `SELECT id_variant, id_product, scent
                 FROM product_variants
                 WHERE id_variant IN (?) AND active = 1`,
                [variantIds]
            );
            for (const v of variantRows) variants.set(Number(v.id_variant), v);
        }

        const priced: PricedItem[] = [];
        for (const item of incoming) {
            const product = products.get(item.id_product);
            if (!product) {
                conn.release();
                return NextResponse.json(
                    { error: "Uno de los productos ya no está disponible. Revisá el carrito." },
                    { status: 409 }
                );
            }
            let scent: string | null = null;
            if (item.id_variant !== null) {
                const variant = variants.get(item.id_variant);
                if (!variant || Number(variant.id_product) !== item.id_product) {
                    conn.release();
                    return NextResponse.json(
                        { error: "Una de las fragancias ya no está disponible. Revisá el carrito." },
                        { status: 409 }
                    );
                }
                scent = variant.scent;
            }
            const unitPrice = Number(product.price);
            priced.push({
                id_product: item.id_product,
                id_variant: item.id_variant,
                product_name: product.name,
                variant_scent: scent,
                quantity: item.quantity,
                unit_price: unitPrice,
                subtotal: unitPrice * item.quantity,
                tag: product.tag,
            });
        }

        const subtotal = priced.reduce((acc, i) => acc + i.subtotal, 0);

        // ------------------------------------------------------------
        // 2. Envío según la configuración
        // ------------------------------------------------------------
        const settings = await getSettings(["free_shipping_threshold", "delivery_cost"], conn);
        const freeShippingThreshold = Number(settings.free_shipping_threshold);
        const deliveryCostBase = Number(settings.delivery_cost);
        const deliveryCost =
            requiresDelivery && subtotal < freeShippingThreshold ? deliveryCostBase : 0;
        const total = subtotal + deliveryCost;

        // Tag del pedido (aromas / relax / mixed), igual que en el panel
        const tags = new Set(priced.map((i) => i.tag));
        const orderTag =
            (tags.has("aromas") && tags.has("relax")) || tags.has("mix")
                ? "mixed"
                : tags.has("relax")
                    ? "relax"
                    : "aromas";

        // Usuario al que se asigna el pedido (id_user es obligatorio)
        const [adminRows] = await conn.query<RowDataPacket[]>(
            "SELECT id_user FROM users WHERE active = 1 ORDER BY id_user ASC LIMIT 1"
        );
        if (adminRows.length === 0) {
            conn.release();
            return NextResponse.json(
                { error: "No hay usuarios configurados" },
                { status: 500 }
            );
        }
        const idUser = adminRows[0].id_user;

        await conn.beginTransaction();

        // ------------------------------------------------------------
        // 3. Clienta: si ya existe NO se pisan sus datos desde la web
        //    (cualquiera que sepa un mail podría cambiarlos). Si cargó
        //    otros datos, quedan en las notas para que la vendedora revise.
        // ------------------------------------------------------------
        const [clientRows] = await conn.query<RowDataPacket[]>(
            "SELECT id_client, name, phone FROM clients WHERE email = ? LIMIT 1",
            [email]
        );

        let idClient: number;
        const extraNotes: string[] = [];

        if (clientRows.length > 0) {
            idClient = clientRows[0].id_client;
            const differs =
                clientRows[0].name.trim().toLowerCase() !== name.toLowerCase() ||
                clientRows[0].phone.replace(/\D/g, "") !== phone.replace(/\D/g, "");
            if (differs) {
                extraNotes.push(`Datos cargados en la web: ${name}, tel. ${phone}`);
            }
        } else {
            const [newClient] = await conn.query<ResultSetHeader>(
                `INSERT INTO clients (name, email, phone, createdAt, updatedAt)
                 VALUES (?, ?, ?, NOW(), NOW())`,
                [name, email, phone]
            );
            idClient = newClient.insertId;
        }

        const finalNotes = [notes, ...extraNotes].filter(Boolean).join("\n") || null;

        // ------------------------------------------------------------
        // 4. Pedido + productos, todo o nada
        // ------------------------------------------------------------
        const [orderResult] = await conn.query<ResultSetHeader>(
            `INSERT INTO orders
             (id_client, id_user, total, delivery_cost, requires_delivery, delivery_address, status, tag, notes, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, NOW(), NOW())`,
            [
                idClient,
                idUser,
                total,
                deliveryCost,
                requiresDelivery ? 1 : 0,
                requiresDelivery ? deliveryAddress : null,
                orderTag,
                finalNotes,
            ]
        );
        const idOrder = orderResult.insertId;

        for (const item of priced) {
            await conn.query(
                `INSERT INTO order_items
                 (id_order, id_product, id_variant, product_name, variant_scent, quantity, unit_price, subtotal, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    idOrder,
                    item.id_product,
                    item.id_variant,
                    item.product_name,
                    item.variant_scent,
                    item.quantity,
                    item.unit_price,
                    item.subtotal,
                ]
            );
        }

        // Stock: lo que haya sale de stock (entrega inmediata); el resto queda "a pedido"
        await deductStockForOrder(conn, idOrder);

        await conn.commit();
        conn.release();

        await recordEvent(ORDER_BUCKET, ip).catch(() => undefined);

        // Aviso por email al local (si falla, el pedido ya quedó guardado)
        await sendNewOrderEmail({
            id_order: idOrder,
            client_name: name,
            client_email: email,
            client_phone: phone,
            requires_delivery: requiresDelivery,
            delivery_address: requiresDelivery ? deliveryAddress : null,
            notes: finalNotes,
            subtotal,
            delivery_cost: deliveryCost,
            total,
            items: priced.map((i) => ({
                product_name: i.product_name,
                variant_scent: i.variant_scent,
                quantity: i.quantity,
                subtotal: i.subtotal,
            })),
        });

        // Se devuelve lo que quedó guardado, para que el mensaje de
        // WhatsApp muestre los precios reales y no los del carrito.
        return NextResponse.json(
            {
                ok: true,
                id_order: idOrder,
                is_new_client: clientRows.length === 0,
                subtotal,
                delivery_cost: deliveryCost,
                total,
                items: priced.map(({ tag: _tag, ...rest }) => rest),
            },
            { status: 201 }
        );
    } catch (error) {
        try {
            await conn.rollback();
        } catch {
            // sin transacción abierta
        }
        conn.release();
        console.error("Error en POST /api/public/orders:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
