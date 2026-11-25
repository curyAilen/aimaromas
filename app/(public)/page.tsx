import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { Catalog } from "@/components/features/tienda/Catalog";
import {
    CATALOG_FIRST_PAGE,
    listCategories,
    listPublicProducts,
    type CatalogCategory,
    type CatalogProduct,
} from "@/lib/catalog";
import { getSiteUrl } from "@/lib/slug";

// El catálogo se arma en el servidor para que Google y WhatsApp vean los productos
export const dynamic = "force-dynamic";

const TITLE = "AIMA Aromas | Velas de soja, wax melts y jabones artesanales";
const DESCRIPTION =
    "Velas de soja, wax melts y jabones artesanales hechos a mano en Argentina. Elegí tus productos, armá tu pedido y enviálo por WhatsApp. Sin registro, sin vueltas.";

export const metadata: Metadata = {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: "/" },
    openGraph: {
        type: "website",
        url: "/",
        title: TITLE,
        description: DESCRIPTION,
        siteName: "AIMA Aromas",
        locale: "es_AR",
        images: [{ url: "/logo.png", width: 963, height: 962, alt: "AIMA Aromas" }],
    },
    twitter: {
        card: "summary_large_image",
        title: TITLE,
        description: DESCRIPTION,
        images: ["/logo.png"],
    },
};

export default async function HomePage() {
    let products: CatalogProduct[] = [];
    let total = 0;
    let categories: CatalogCategory[] = [];
    let failed = false;

    try {
        const [page, cats] = await Promise.all([
            listPublicProducts({ offset: 0, limit: CATALOG_FIRST_PAGE }),
            listCategories(),
        ]);
        products = page.products;
        total = page.total;
        categories = cats;
    } catch (error) {
        console.error("Error cargando el catálogo en el servidor:", error);
        failed = true;
    }

    const siteUrl = getSiteUrl();
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Store",
        name: "AIMA Aromas",
        description: DESCRIPTION,
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        image: `${siteUrl}/logo.png`,
        areaServed: "AR",
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
                }}
            />

            {/* Hero */}
            <div className="bg-gradient-soft rounded-3xl p-8 md:p-12 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-accent-pink" />
                    <span className="text-xs font-medium text-accent-pink uppercase tracking-wide">
                        Hecho a mano con amor
                    </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
                    Velas y Jabones Artesanales
                </h1>
                <p className="text-sm md:text-base text-text-secondary max-w-xl mx-auto">
                    Elegí tus productos favoritos, armá tu pedido y enviálo por WhatsApp.
                    Sin registro, sin vueltas.
                </p>
            </div>

            <Catalog
                initialProducts={products}
                initialTotal={total}
                categories={categories}
                initialFailed={failed}
            />
        </div>
    );
}
