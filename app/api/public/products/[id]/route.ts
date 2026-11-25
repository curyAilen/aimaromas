import { NextRequest, NextResponse } from "next/server";
import { getPublicProduct } from "@/lib/catalog";

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/public/products/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const productId = Number(id);
        if (!Number.isInteger(productId) || productId <= 0) {
            return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
        }

        const detail = await getPublicProduct(productId);
        if (!detail) {
            return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
        }

        return NextResponse.json({
            product: detail.product,
            images: detail.images,
            variants: detail.variants,
        });
    } catch (error) {
        console.error("Error en GET /api/public/products/[id]:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
