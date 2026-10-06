import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { deleteImage } from "@/lib/cloudinary";
import type { RowDataPacket } from "mysql2";

interface Params {
    params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT public_id FROM product_images WHERE id_image = ? LIMIT 1",
            [id]
        );

        if (rows.length > 0 && rows[0].public_id) {
            try {
                await deleteImage(rows[0].public_id);
            } catch (err) {
                console.error("Error al borrar de Cloudinary:", err);
            }
        }

        await pool.query("DELETE FROM product_images WHERE id_image = ?", [id]);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error en DELETE image:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}