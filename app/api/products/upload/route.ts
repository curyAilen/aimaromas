import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";
import type { ResultSetHeader } from "mysql2";

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const idProduct = formData.get("id_product") as string;

        if (!file) {
            return NextResponse.json({ error: "No hay archivo" }, { status: 400 });
        }

        if (!idProduct) {
            return NextResponse.json(
                { error: "Falta id_product. Guardá el producto primero." },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { url, publicId } = await uploadImage(buffer, "mezo/productos");

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO product_images (id_product, url, public_id, sort_order, createdAt)
       VALUES (?, ?, ?, 0, NOW())`,
            [idProduct, url, publicId]
        );

        return NextResponse.json({
            ok: true,
            image: {
                id_image: result.insertId,
                id_product: Number(idProduct),
                url,
                public_id: publicId,
                sort_order: 0,
            },
        });
    } catch (error) {
        console.error("Error en upload:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}