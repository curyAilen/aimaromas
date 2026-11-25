import { getSettings } from "./settings";
import { getSiteUrl } from "./slug";

/**
 * Aviso por email de cada pedido nuevo de la tienda.
 * Usa Resend (gratis hasta 3.000 mails por mes) con su API por HTTP, sin librerías.
 * Variables: RESEND_API_KEY (obligatoria para enviar) y EMAIL_FROM (opcional).
 * El destinatario se cambia en Admin → Configuración.
 * Si falla, el pedido NO se pierde: ya está guardado y solo queda el aviso en el log.
 */
export interface OrderEmailData {
    id_order: number;
    client_name: string;
    client_email: string;
    client_phone: string;
    requires_delivery: boolean;
    delivery_address: string | null;
    notes: string | null;
    subtotal: number;
    delivery_cost: number;
    total: number;
    items: { product_name: string; variant_scent: string | null; quantity: number; subtotal: number }[];
}

const money = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;

function esc(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export async function sendNewOrderEmail(order: OrderEmailData): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn("Aviso de pedido no enviado: falta RESEND_API_KEY.");
        return;
    }

    try {
        const { order_notification_email: to } = await getSettings(["order_notification_email"]);
        const from = process.env.EMAIL_FROM || "AIMA Aromas <onboarding@resend.dev>";
        const adminUrl = `${getSiteUrl()}/admin/pedidos/${order.id_order}`;

        const lines = order.items.map(
            (i) =>
                `${i.quantity} x ${i.product_name}${i.variant_scent ? ` (${i.variant_scent})` : ""} — ${money(i.subtotal)}`
        );
        const text = [
            `Nuevo pedido #${order.id_order} desde la tienda`,
            "",
            `Clienta: ${order.client_name}`,
            `Teléfono: ${order.client_phone}`,
            `Email: ${order.client_email}`,
            order.requires_delivery ? `Envío a: ${order.delivery_address ?? "—"}` : "Retira / sin envío",
            "",
            ...lines,
            "",
            order.delivery_cost > 0 ? `Envío: ${money(order.delivery_cost)}` : "Envío: sin costo",
            `TOTAL: ${money(order.total)}`,
            order.notes ? `\nNotas: ${order.notes}` : "",
            "",
            `Ver en el panel: ${adminUrl}`,
        ].join("\n");

        const html = `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#222">
  <h2 style="margin:0 0 4px">🛍️ Nuevo pedido #${order.id_order}</h2>
  <p style="margin:0 0 16px;color:#666">Llegó desde la tienda online</p>
  <p style="margin:0"><b>${esc(order.client_name)}</b><br>${esc(order.client_phone)} · ${esc(order.client_email)}</p>
  <p style="margin:12px 0">${order.requires_delivery ? `📍 Envío a: ${esc(order.delivery_address ?? "—")}` : "🏠 Retira / sin envío"}</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    ${order.items
        .map(
            (i) => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${i.quantity} × ${esc(i.product_name)}${i.variant_scent ? ` <span style="color:#888">(${esc(i.variant_scent)})</span>` : ""}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${money(i.subtotal)}</td></tr>`
        )
        .join("")}
  </table>
  <p style="text-align:right;margin:12px 0 0">${order.delivery_cost > 0 ? `Envío: ${money(order.delivery_cost)}<br>` : ""}<b style="font-size:18px">TOTAL: ${money(order.total)}</b></p>
  ${order.notes ? `<p style="background:#faf5ff;padding:10px;border-radius:8px">📝 ${esc(order.notes)}</p>` : ""}
  <p style="margin-top:20px"><a href="${adminUrl}" style="background:#ec4899;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">Ver pedido en el panel</a></p>
</div>`;

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                from,
                to: [to],
                reply_to: order.client_email,
                subject: `🛍️ Nuevo pedido #${order.id_order} — ${order.client_name} — ${money(order.total)}`,
                text,
                html,
            }),
            signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) {
            console.error("Resend rechazó el aviso de pedido:", res.status, await res.text());
        }
    } catch (error) {
        console.error("No se pudo enviar el aviso de pedido:", error);
    }
}
