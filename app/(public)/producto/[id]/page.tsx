import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ProductDetail } from "@/components/features/tienda/ProductDetail";
import { getPublicProduct } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { getSiteUrl, optimizeImage, parseProductId, productPath } from "@/lib/slug";

export const dynamic = "force-dynamic";

interface Props {
    params: Promise<{ id: string }>;
}

function shortDescription(text: string | null, fallback: string): string {
    const clean = (text ?? "").replace(/\s+/g, " ").trim();
    if (!clean) return fallback;
    return clean.length <= 155 ? clean : `${clean.slice(0, 152).trimEnd()}...`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const productId = parseProductId(id);
    const detail = productId ? await getPublicProduct(productId).catch(() => null) : null;
    if (!detail) return { title: "Producto no encontrado", robots: { index: false } };

    const { product, images } = detail;
    const path = productPath(product.id_product, product.name);
    const title = `${product.name} | ${product.category_name}`;
    const description = shortDescription(
        product.description,
        `${product.name} de AIMA Aromas, hecho a mano en Argentina.`
    );
    const ogImage = optimizeImage(images[0]?.url ?? null, "f_jpg,q_auto,c_fill,w_1200,h_630");

    return {
        title,
        description,
        alternates: { canonical: path },
        openGraph: {
            type: "website",
            url: path,
            title,
            description,
            siteName: "AIMA Aromas",
            locale: "es_AR",
            images: ogImage
                ? [{ url: ogImage, width: 1200, height: 630, alt: product.name }]
                : [{ url: "/logo.png", width: 963, height: 962, alt: "AIMA Aromas" }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [ogImage ?? "/logo.png"],
        },
    };
}

export default async function ProductoPage({ params }: Props) {
    const { id } = await params;
    const productId = parseProductId(id);
    if (!productId) notFound();

    const detail = await getPublicProduct(productId).catch(() => null);
    if (!detail) notFound();

    // Una sola dirección por producto: /producto/17 pasa a /producto/17-naranja-y-almendra
    const canonical = productPath(detail.product.id_product, detail.product.name);
    if (`/producto/${id}` !== canonical) permanentRedirect(canonical);

    const { whatsapp_number: whatsappNumber } = await getSettings(["whatsapp_number"]);

    const siteUrl = getSiteUrl();
    const { product, images } = detail;
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: shortDescription(product.description, product.name),
        image: images.map((i) => i.url),
        sku: String(product.id_product),
        category: product.category_name,
        brand: { "@type": "Brand", name: "AIMA Aromas" },
        offers: {
            "@type": "Offer",
            url: `${siteUrl}${canonical}`,
            priceCurrency: "ARS",
            price: Number(product.price),
            itemCondition: "https://schema.org/NewCondition",
            availability: product.available_now
                ? "https://schema.org/InStock"
                : "https://schema.org/PreOrder",
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
                }}
            />
            <ProductDetail
                product={detail.product}
                images={detail.images}
                variants={detail.variants}
                whatsappNumber={whatsappNumber}
            />
        </>
    );
}
