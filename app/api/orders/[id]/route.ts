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
        u.name AS user_name,
        r.name AS reseller_name,
        r.default_commission_percent AS reseller_default_percent
       FROM orders o
       INNER JOIN clients c ON c.id_client = o.id_client
       INNER JOIN users u ON u.id_user = o.id_user
       LEFT JOIN resellers r ON r.id_reseller = o.id_reseller
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

// PUT /api/orders/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    const conn = await pool.getConnection();
    try {
        const session = await getSession();
        if (!session) {
            conn.release();
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const {
            status,
            markDelivered,
            markPaid,
            id_reseller,
            commission_percent,
            pays_next_month,
        } = body;

        // 1. Si viene id_reseller, recalcular comisión
        if (id_reseller !== undefined) {
            const [items] = await conn.query<RowDataPacket[]>(
                "SELECT COALESCE(SUM(subtotal), 0) AS subtotal FROM order_items WHERE id_order = ?",
                [id]
            );
            const subtotal = Number(items[0]?.subtotal || 0);

            let finalCommissionPercent = 0;
            if (id_reseller) {
                if (
                    commission_percent !== undefined &&
                    commission_percent !== null &&
                    commission_percent !== ""
                ) {
                    finalCommissionPercent = Number(commission_percent);
                } else {
                    const [resellerRows] = await conn.query<RowDataPacket[]>(
                        "SELECT default_commission_percent FROM resellers WHERE id_reseller = ? LIMIT 1",
                        [id_reseller]
                    );
                    finalCommissionPercent = resellerRows.length
                        ? Number(resellerRows[0].default_commission_percent)
                        : 0;
                }
            }

            const commissionAmount = Number(
                ((subtotal * finalCommissionPercent) / 100).toFixed(2)
            );

            await conn.query(
                `UPDATE orders 
         SET id_reseller = ?, 
             commission_percent = ?, 
             commission_amount = ?, 
             updatedAt = NOW()
         WHERE id_order = ?`,
                [id_reseller || null, finalCommissionPercent, commissionAmount, id]
            );
        }

        // 2. Armar updates dinámicos
        const updates: string[] = [];
        const values: any[] = [];

        if (status) {
            updates.push("status = ?");
            values.push(status);
            if (status === "cancelled") {
                updates.push("cancelled_at = NOW()");
            }
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

        if (pays_next_month !== undefined) {
            updates.push("pays_next_month = ?");
            values.push(pays_next_month ? 1 : 0);
        }

        if (updates.length > 0) {
            updates.push("updatedAt = NOW()");
            values.push(id);

            await conn.query(
                `UPDATE orders SET ${updates.join(", ")} WHERE id_order = ?`,
                values
            );
        }

        conn.release();
        return NextResponse.json({ ok: true });
    } catch (error) {
        conn.release();
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