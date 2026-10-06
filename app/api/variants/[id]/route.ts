import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

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
        const { scent } = body;

        if (!scent) {
            return NextResponse.json(
                { error: "La fragancia es obligatoria" },
                { status: 400 }
            );
        }

        await pool.query(
            `UPDATE product_variants
       SET scent = ?, updatedAt = NOW()
       WHERE id_variant = ?`,
            [scent, id]
        );

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

        await pool.query("DELETE FROM product_variants WHERE id_variant = ?", [id]);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error en DELETE variant:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}