import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

interface Params {
    params: Promise<{ id: string }>;
}

// PUT /api/orders/[id]/commission
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { commission_paid } = body;

        if (commission_paid === true) {
            await pool.query(
                `UPDATE orders 
         SET commission_paid = 1, commission_paid_at = NOW(), updatedAt = NOW()
         WHERE id_order = ?`,
                [id]
            );
        } else {
            await pool.query(
                `UPDATE orders 
         SET commission_paid = 0, commission_paid_at = NULL, updatedAt = NOW()
         WHERE id_order = ?`,
                [id]
            );
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error en PUT /api/orders/[id]/commission:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}