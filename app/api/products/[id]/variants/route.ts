import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/products/[id]/variants
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id_variant, id_product, scent, active, createdAt, updatedAt
 FROM product_variants
 WHERE id_product = ?
 ORDER BY scent ASC`,
            [id]
        );

        return NextResponse.json({ variants: rows });
    } catch (error) {
        console.error("Error en GET variants:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

// POST /api/products/[id]/variants
export async function POST(req: NextRequest, { params }: Params) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { scent } = body;

        if (!scent) {
            return NextResponse.json(
                { error: "La fragancia es obligatoria" },
                { status: 400 }
            );
        }

        // Verificar que no exista ya esa fragancia para ese producto
        const [existing] = await pool.query<RowDataPacket[]>(
            "SELECT id_variant FROM product_variants WHERE id_product = ? AND scent = ? LIMIT 1",
            [id, scent]
        );

        if (existing.length > 0) {
            return NextResponse.json(
                { error: "Ya existe una variante con esa fragancia" },
                { status: 400 }
            );
        }

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO product_variants (id_product, scent, price, stock, active, createdAt, updatedAt)
       VALUES (?, ?, 0, 0, 1, NOW(), NOW())`,
            [id, scent]
        );

        return NextResponse.json(
            { ok: true, id_variant: result.insertId },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error en POST variants:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}