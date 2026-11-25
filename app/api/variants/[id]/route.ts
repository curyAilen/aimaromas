import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { syncStockStatus } from "@/lib/stock";
import { cleanLine } from "@/lib/text";
import type { RowDataPacket } from "mysql2";

interface Params {
    params: Promise<{ id: string }>;
}

// PUT /api/variants/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const scent = body.scent === undefined ? null : cleanLine(body.scent);
        const stock =
            body.stock === undefined
                ? null
                : Math.max(0, Math.floor(Number(body.stock) || 0));

        if (scent === "" || (scent === null && stock === null)) {
            return NextResponse.json(
                { error: "La fragancia es obligatoria" },
                { status: 400 }
            );
        }

        // Solo se cambia lo que viene en el pedido (nombre y/o stock)
        await pool.query(
            `UPDATE product_variants
       SET scent = COALESCE(?, scent), stock = COALESCE(?, stock), updatedAt = NOW()
       WHERE id_variant = ?`,
            [scent, stock, id]
        );

        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id_product FROM product_variants WHERE id_variant = ? LIMIT 1",
            [id]
        );
        if (rows.length > 0) await syncStockStatus(pool, [Number(rows[0].id_product)]);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error en PUT variant:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

// DELETE /api/variants/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id_product FROM product_variants WHERE id_variant = ? LIMIT 1",
            [id]
        );
        await pool.query("DELETE FROM product_variants WHERE id_variant = ?", [id]);
        if (rows.length > 0) await syncStockStatus(pool, [Number(rows[0].id_product)]);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error en DELETE variant:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}