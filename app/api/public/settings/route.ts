import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

// GET /api/public/settings
export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT setting_key, setting_value FROM settings 
       WHERE setting_key IN ('free_shipping_threshold', 'delivery_cost')`
        );

        const settings: Record<string, string> = {};
        for (const row of rows) {
            settings[row.setting_key] = row.setting_value;
        }

        return NextResponse.json({ settings });
    } catch (error) {
        console.error("Error en GET /api/public/settings:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}