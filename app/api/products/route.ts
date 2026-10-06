import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const categoryId = searchParams.get("category") || "";
        const withVariants = searchParams.get("withVariants") === "true";

        let query = `
      SELECT 
        p.*,
        c.name AS category_name,
        (SELECT COUNT(*) FROM product_variants v WHERE v.id_product = p.id_product) AS variant_count,
        (SELECT COUNT(*) FROM product_images i WHERE i.id_product = p.id_product) AS image_count
      FROM products p
      INNER JOIN categories c ON c.id_category = p.id_category
      WHERE 1 = 1
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

        query += " ORDER BY c.sort_order ASC, p.name ASC";

        const [rows] = await pool.query<RowDataPacket[]>(query, params);

        // Si pide las variantes, traerlas
        if (withVariants && rows.length > 0) {
            const productIds = rows.map((p) => p.id_product);

            const [variants] = await pool.query<RowDataPacket[]>(
                `SELECT id_variant, id_product, scent FROM product_variants 
         WHERE id_product IN (?) AND active = 1
         ORDER BY scent ASC`,
                [productIds]
            );

            // Agrupar por producto
            for (const product of rows) {
                product.variants = variants.filter(
                    (v) => v.id_product === product.id_product
                );
            }
        }

        return NextResponse.json({ products: rows });
    } catch (error) {
        console.error("Error en GET /api/products:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const {
            id_category,
            name,
            size_name,
            size_cm,
            price,
            description,
            active,
            stock_status,
        } = body;

        if (!id_category || !name) {
            return NextResponse.json(
                { error: "Categoría y nombre son obligatorios" },
                { status: 400 }
            );
        }

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO products 
       (id_category, name, size_name, size_cm, price, description, active, stock_status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                id_category,
                name,
                size_name || null,
                size_cm || null,
                price || 0,
                description || null,
                active === false ? 0 : 1,
                stock_status || "in_stock",
            ]
        );

        return NextResponse.json(
            { ok: true, id_product: result.insertId },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error en POST /api/products:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}