import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";
import type { Product, ProductImage } from "@/lib/types";

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/products/[id]
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT p.*, c.name AS category_name
       FROM products p
       INNER JOIN categories c ON c.id_category = p.id_category
       WHERE p.id_product = ?
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
            "SELECT * FROM product_images WHERE id_product = ? ORDER BY sort_order ASC",
            [id]
        );

        return NextResponse.json({
            product: rows[0] as Product,
            images: images as ProductImage[],
        });
    } catch (error) {
        console.error("Error en GET /api/products/[id]:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

// PUT /api/products/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { id_category, name, size_name, size_cm, price, description, active, stock_status } = body;

        if (!id_category || !name) {
            return NextResponse.json(
                { error: "Categoría y nombre son obligatorios" },
                { status: 400 }
            );
        }

        await pool.query(
            `UPDATE products
       SET id_category = ?, name = ?, size_name = ?, size_cm = ?, 
           price = ?, description = ?, active = ?, stock_status = ?, updatedAt = NOW()
       WHERE id_product = ?`,
            [
                id_category,
                name,
                size_name || null,
                size_cm || null,
                price || 0,
                description || null,
                active === false ? 0 : 1,
                stock_status || "in_stock",
                id,
            ]
        );

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error en PUT /api/products/[id]:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

// DELETE /api/products/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        await pool.query("DELETE FROM products WHERE id_product = ?", [id]);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error en DELETE /api/products/[id]:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}