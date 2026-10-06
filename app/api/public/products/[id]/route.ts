import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/public/products/[id]
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
        p.*,
        c.name AS category_name,
        c.slug AS category_slug
       FROM products p
       INNER JOIN categories c ON c.id_category = p.id_category
       WHERE p.id_product = ?
         AND p.active = 1
         AND p.stock_status != 'discontinued'
       LIMIT 1`,
            [id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: "Producto no encontrado" },
                { status: 404 }
            );
        }

        const [images] = await pool.query<RowDataPacket[]>(
            "SELECT id_image, url FROM product_images WHERE id_product = ? ORDER BY sort_order ASC, id_image ASC",
            [id]
        );

        const [variants] = await pool.query<RowDataPacket[]>(
            "SELECT id_variant, scent FROM product_variants WHERE id_product = ? AND active = 1 ORDER BY scent ASC",
            [id]
        );

        return NextResponse.json({
            product: rows[0],
            images,
            variants,
        });
    } catch (error) {
        console.error("Error en GET /api/public/products/[id]:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}