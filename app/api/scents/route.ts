import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Traer todas las fragancias únicas que ya existen en el sistema
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT DISTINCT scent FROM product_variants 
       WHERE scent IS NOT NULL AND scent != ''
       ORDER BY scent ASC`
        );

        const scents = rows.map((r) => r.scent);

        return NextResponse.json({ scents });
    } catch (error) {
        console.error("Error en GET /api/scents:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}