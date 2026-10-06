import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

// GET /api/public/products
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const categoryId = searchParams.get("category") || "";

        let query = `
      SELECT 
        p.id_product,
        p.name,
        p.size_name,
        p.size_cm,
        p.price,
        p.description,
        p.stock_status,
        c.id_category,
        c.name AS category_name,
        c.slug AS category_slug,
        (
          SELECT url FROM product_images 
          WHERE id_product = p.id_product 
          ORDER BY sort_order ASC, id_image ASC 
          LIMIT 1
        ) AS image_url
      FROM products p
      INNER JOIN categories c ON c.id_category = p.id_category
      WHERE p.active = 1
        AND p.stock_status != 'discontinued'
    `;
        const params: (string | number)[] = [];

        if (search) {
            query += " AND p.name LIKE ?";
            params.push(`%${search}%`);
        }

        if (categoryId) {
            query += " AND p.id_category = ?";
            params.push(categoryId);
        }

        query += " ORDER BY p.createdAt DESC";

        const [rows] = await pool.query<RowDataPacket[]>(query, params);

        // Traer todas las categorías también
        const [categories] = await pool.query<RowDataPacket[]>(
            "SELECT id_category, name, slug FROM categories ORDER BY sort_order ASC"
        );

        return NextResponse.json({
            products: rows,
            categories,
        });
    } catch (error) {
        console.error("Error en GET /api/public/products:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}