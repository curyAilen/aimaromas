import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/slug";

export default function robots(): MetadataRoute.Robots {
    const siteUrl = getSiteUrl();
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                // El panel, la API y el carrito/checkout no tienen que aparecer en Google
                disallow: ["/admin", "/api/", "/carrito", "/checkout"],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
        host: siteUrl,
    };
}
