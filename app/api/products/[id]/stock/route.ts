import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureSchema } from "@/lib/schema";
import { syncStockStatus } from "@/lib/stock";

interface Params {
    params: Promise<{ id: string }>;
}

// PUT /api/products/[id]/stock
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { stock } = body;

        if (stock === undefined || stock === null) {
            return NextResponse.json(
                { error: "Falta el campo stock" },
                { status: 400 }
            );
        }

        await ensureSchema();
        const units = Math.max(0, Math.floor(Number(stock) || 0));
        await pool.query(
            "UPDATE products SET stock = ?, updatedAt = NOW() WHERE id_product = ?",
            [units, id]
        );
        await syncStockStatus(pool, [Number(id)]);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error en PUT /api/products/[id]/stock:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}