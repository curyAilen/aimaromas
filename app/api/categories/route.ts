import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";
import type { Category } from "@/lib/types";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM categories ORDER BY sort_order ASC"
        );

        return NextResponse.json({ categories: rows as Category[] });
    } catch (error) {
        console.error("Error en GET /api/categories:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}