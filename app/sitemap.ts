import type { MetadataRoute } from "next";
import { listProductsForSitemap } from "@/lib/catalog";
import { getSiteUrl, productPath } from "@/lib/slug";

// Se arma en cada pedido para que los productos nuevos aparezcan solos
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteUrl = getSiteUrl();
    const entries: MetadataRoute.Sitemap = [
        { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    ];

    try {
        const products = await listProductsForSitemap();
        for (const product of products) {
            entries.push({
                url: `${siteUrl}${productPath(product.id_product, product.name)}`,
                lastModified: product.updatedAt ? new Date(product.updatedAt) : undefined,
                changeFrequency: "weekly",
                priority: 0.8,
            });
        }
    } catch (error) {
        console.error("No se pudo armar el sitemap con productos:", error);
    }

    return entries;
}
