const FALLBACK_SITE_URL = "https://aimaaromas.com.ar";

export function getSiteUrl(): string {
    const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (!raw || raw.includes("localhost")) return FALLBACK_SITE_URL;
    return raw.replace(/\/+$/, "");
}

export function slugify(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}

/** Ruta pública del producto: el id sigue mandando, el nombre es para Google y para humanos. */
export function productPath(id: number | string, name: string): string {
    const slug = slugify(name);
    return slug ? `/producto/${id}-${slug}` : `/producto/${id}`;
}

/** De "17-naranja-y-almendra" (o "17") saca el id 17. */
export function parseProductId(param: string): number | null {
    const match = /^(\d+)(?:-|$)/.exec(param);
    if (!match) return null;
    const id = Number(match[1]);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Imágenes de Cloudinary más livianas: tamaño justo, formato y calidad automáticos. */
export function optimizeImage(url: string | null | undefined, transform: string): string | null {
    if (!url) return null;
    const marker = "/image/upload/";
    if (!url.includes("res.cloudinary.com") || !url.includes(marker)) return url;
    return url.replace(marker, `${marker}${transform}/`);
}
