import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureSchema } from "@/lib/schema";
import type { RowDataPacket } from "mysql2";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        await ensureSchema();
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM settings"
        );

        const settings: Record<string, string> = {};
        for (const row of rows) {
            settings[row.setting_key] = row.setting_value;
        }

        return NextResponse.json({ settings });
    } catch (error) {
        console.error("Error en GET /api/settings:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (session.role !== "CEO") {
            return NextResponse.json(
                { error: "Solo el CEO puede modificar la configuración" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { settings } = body;

        if (!settings || typeof settings !== "object") {
            return NextResponse.json(
                { error: "Formato inválido" },
                { status: 400 }
            );
        }

        // Validaciones de los datos que usa la tienda
        const incoming = settings as Record<string, unknown>;
        if ("whatsapp_number" in incoming) {
            const digits = String(incoming.whatsapp_number ?? "").replace(/\D/g, "");
            if (digits.length < 10 || digits.length > 15) {
                return NextResponse.json(
                    { error: "El WhatsApp tiene que tener entre 10 y 15 dígitos, con código de país (ej. 5491112345678)" },
                    { status: 400 }
                );
            }
            incoming.whatsapp_number = digits;
        }
        if ("order_notification_email" in incoming) {
            const mail = String(incoming.order_notification_email ?? "").trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail) || mail.length > 254) {
                return NextResponse.json(
                    { error: "El mail para avisos no es válido" },
                    { status: 400 }
                );
            }
            incoming.order_notification_email = mail;
        }
        for (const key of ["free_shipping_threshold", "delivery_cost"]) {
            if (key in incoming) {
                const n = Number(incoming[key]);
                if (!Number.isFinite(n) || n < 0) {
                    return NextResponse.json(
                        { error: "Los montos de envío tienen que ser números mayores o iguales a 0" },
                        { status: 400 }
                    );
                }
            }
        }

        for (const [key, value] of Object.entries(settings)) {
            await pool.query(
                `INSERT INTO settings (setting_key, setting_value, updatedAt)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE setting_value = ?, updatedAt = NOW()`,
                [key, String(value), String(value)]
            );
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error en PUT /api/settings:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}