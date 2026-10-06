import type { Order, OrderItem } from "./types";

const WHATSAPP_NUMBER = "5491173735090";

export function formatCurrency(value: number | string): string {
    const num = typeof value === "string" ? Number(value) : value;
    return `$${num.toLocaleString("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;
}

export function buildOrderMessage(
    order: Order,
    items: OrderItem[]
): string {
    const lines: string[] = [];

    lines.push(`🛍️ *NUEVO PEDIDO #${order.id_order}*`);
    lines.push("");
    lines.push(`👤 *Cliente:* ${order.client_name}`);
    lines.push(`📞 *Tel:* ${order.client_phone}`);

    if (order.requires_delivery && order.delivery_address) {
        lines.push(`📍 *Dirección:* ${order.delivery_address}`);
    }

    lines.push("");
    lines.push("📦 *Productos:*");

    for (const item of items) {
        const variant = item.variant_scent ? ` (${item.variant_scent})` : "";
        lines.push(
            `• ${item.quantity}x ${item.product_name}${variant} — ${formatCurrency(
                Number(item.subtotal)
            )}`
        );
    }

    lines.push("");
    if (Number(order.delivery_cost) > 0) {
        lines.push(`🚚 *Envío:* ${formatCurrency(order.delivery_cost)}`);
    }
    lines.push(`💰 *TOTAL: ${formatCurrency(order.total)}*`);

    if (order.notes) {
        lines.push("");
        lines.push(`📝 *Notas:* ${order.notes}`);
    }

    return lines.join("\n");
}

export function buildWhatsAppUrl(message: string): string {
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}