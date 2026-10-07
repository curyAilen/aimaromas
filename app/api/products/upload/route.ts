import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { ResultSetHeader } from "mysql2";

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { id_product, url, public_id } = body;

        if (!url || !id_product) {
            return NextResponse.json(
                { error: "Faltan datos (url, id_product)" },
                { status: 400 }
            );
        }

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO product_images (id_product, url, public_id, sort_order, createdAt)
       VALUES (?, ?, ?, 0, NOW())`,
            [id_product, url, public_id || null]
        );

        return NextResponse.json({
            ok: true,
            image: {
                id_image: result.insertId,
                id_product: Number(id_product),
                url,
                public_id: public_id || null,
                sort_order: 0,
            },
        });
    } catch (error) {
        console.error("Error en upload:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}