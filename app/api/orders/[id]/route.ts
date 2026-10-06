import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/orders/[id]
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
        o.*,
        c.name AS client_name,
        c.phone AS client_phone,
        c.email AS client_email,
        c.address AS client_address,
        u.name AS user_name
       FROM orders o
       INNER JOIN clients c ON c.id_client = o.id_client
       INNER JOIN users u ON u.id_user = o.id_user
       WHERE o.id_order = ?
       LIMIT 1`,
            [id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: "Pedido no encontrado" },
                { status: 404 }
            );
        }

        const [items] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM order_items WHERE id_order = ? ORDER BY id_item ASC",
            [id]
        );

        return NextResponse.json({
            order: { ...rows[0], items },
        });
    } catch (error) {
        console.error("Error en GET /api/orders/[id]:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

// PUT /api/orders/[id] - Cambiar estado, marcar entregado/pagado
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { status, markDelivered, markPaid } = body;

        const updates: string[] = [];
        const values: any[] = [];

        if (status) {
            updates.push("status = ?");
            values.push(status);
        }

        if (markDelivered === true) {
            updates.push("delivered_at = NOW()");
        } else if (markDelivered === false) {
            updates.push("delivered_at = NULL");
        }

        if (markPaid === true) {
            updates.push("paid_at = NOW()");
        } else if (markPaid === false) {
            updates.push("paid_at = NULL");
        }

        if (updates.length === 0) {
            return NextResponse.json(
                { error: "Nada para actualizar" },
                { status: 400 }
            );
        }

        updates.push("updatedAt = NOW()");
        values.push(id);

        await pool.query(
            `UPDATE orders SET ${updates.join(", ")} WHERE id_order = ?`,
            values
        );

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error en PUT /api/orders/[id]:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

// DELETE /api/orders/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        await pool.query("DELETE FROM orders WHERE id_order = ?", [id]);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error en DELETE /api/orders/[id]:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}