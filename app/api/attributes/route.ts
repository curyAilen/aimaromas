import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";
import type { AttributeType, AttributeValue } from "@/lib/types";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const [types] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM attribute_types ORDER BY sort_order ASC"
        );

        const [values] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM attribute_values ORDER BY id_attribute, sort_order ASC"
        );

        return NextResponse.json({
            types: types as AttributeType[],
            values: values as AttributeValue[],
        });
    } catch (error) {
        console.error("Error en GET /api/attributes:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}