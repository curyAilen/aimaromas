import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

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