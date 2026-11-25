import { NextRequest, NextResponse } from "next/server";
import {
    CATALOG_FIRST_PAGE,
    listCategories,
    listPublicProducts,
} from "@/lib/catalog";

// GET /api/public/products?search=&category=&offset=0&limit=6
// La tienda pide de a poco: 6 la primera vez y 3 por cada vez que se llega al final.
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = (searchParams.get("search") || "").trim().slice(0, 100);
        const categoryParam = Number(searchParams.get("category"));
        const categoryId =
            Number.isInteger(categoryParam) && categoryParam > 0 ? categoryParam : null;

        const offsetParam = Number(searchParams.get("offset"));
        const limitParam = Number(searchParams.get("limit"));
        const offset = Number.isInteger(offsetParam) && offsetParam >= 0 ? offsetParam : 0;
        const limit =
            Number.isInteger(limitParam) && limitParam > 0
                ? Math.min(limitParam, 24)
                : CATALOG_FIRST_PAGE;

        const { products, total } = await listPublicProducts({ search, categoryId, offset, limit });

        const body: Record<string, unknown> = {
            products,
            total,
            hasMore: offset + products.length < total,
        };
        // Las categorías solo hacen falta en la primera carga
        if (offset === 0) body.categories = await listCategories();

        return NextResponse.json(body);
    } catch (error) {
        console.error("Error en GET /api/public/products:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
