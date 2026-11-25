import type { RowDataPacket } from "mysql2/promise";
import { pool } from "./db";
import { ensureSchema } from "./schema";

/** La tienda carga 6 productos al entrar y 3 más cada vez que se llega al final. */
export const CATALOG_FIRST_PAGE = 6;
export const CATALOG_NEXT_PAGE = 3;

export interface CatalogProduct {
    id_product: number;
    name: string;
    size_name: string | null;
    size_cm: string | null;
    price: string;
    description: string | null;
    id_category: number;
    category_name: string;
    category_slug: string;
    image_url: string | null;
    has_variants: boolean;
    available_now: boolean;
    stock_status: "in_stock" | "on_demand";
}

export interface CatalogCategory {
    id_category: number;
    name: string;
    slug: string;
}

const PRODUCT_COLUMNS = `
    p.id_product, p.name, p.size_name, p.size_cm, p.price, p.description,
    p.stock,
    c.id_category, c.name AS category_name, c.slug AS category_slug,
    (SELECT url FROM product_images WHERE id_product = p.id_product
        ORDER BY sort_order ASC, id_image ASC LIMIT 1) AS image_url,
    (SELECT COUNT(*) FROM product_variants v
        WHERE v.id_product = p.id_product AND v.active = 1) AS variant_count,
    (SELECT COALESCE(SUM(v.stock), 0) FROM product_variants v
        WHERE v.id_product = p.id_product AND v.active = 1) AS variants_stock
`;

function toCatalogProduct(row: RowDataPacket): CatalogProduct {
    const hasVariants = Number(row.variant_count) > 0;
    const availableNow = hasVariants ? Number(row.variants_stock) > 0 : Number(row.stock) > 0;
    return {
        id_product: row.id_product,
        name: row.name,
        size_name: row.size_name,
        size_cm: row.size_cm,
        price: String(row.price),
        description: row.description,
        id_category: row.id_category,
        category_name: row.category_name,
        category_slug: row.category_slug,
        image_url: row.image_url,
        has_variants: hasVariants,
        available_now: availableNow,
        stock_status: availableNow ? "in_stock" : "on_demand",
    };
}

export async function listCategories(): Promise<CatalogCategory[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT id_category, name, slug FROM categories ORDER BY sort_order ASC"
    );
    return rows as unknown as CatalogCategory[];
}

export async function listPublicProducts(opts: {
    search?: string;
    categoryId?: number | null;
    offset: number;
    limit: number;
}): Promise<{ products: CatalogProduct[]; total: number }> {
    await ensureSchema();

    let where = "WHERE p.active = 1 AND p.stock_status != 'discontinued'";
    const params: (string | number)[] = [];
    if (opts.search) {
        where += " AND p.name LIKE ?";
        params.push(`%${opts.search}%`);
    }
    if (opts.categoryId) {
        where += " AND p.id_category = ?";
        params.push(opts.categoryId);
    }

    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT ${PRODUCT_COLUMNS}
         FROM products p
         INNER JOIN categories c ON c.id_category = p.id_category
         ${where}
         ORDER BY p.createdAt DESC, p.id_product DESC
         LIMIT ? OFFSET ?`,
        [...params, opts.limit, opts.offset]
    );
    const [count] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS n FROM products p ${where}`,
        params
    );

    return { products: rows.map(toCatalogProduct), total: Number(count[0]?.n ?? 0) };
}

export interface ProductVariantPublic {
    id_variant: number;
    scent: string;
    in_stock: boolean;
    stock: number;
}

export interface ProductPublicDetail {
    product: CatalogProduct & { stock: number };
    images: { id_image: number; url: string }[];
    variants: ProductVariantPublic[];
    updatedAt: Date | null;
}

export async function getPublicProduct(id: number): Promise<ProductPublicDetail | null> {
    await ensureSchema();
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT ${PRODUCT_COLUMNS}, p.updatedAt
         FROM products p
         INNER JOIN categories c ON c.id_category = p.id_category
         WHERE p.id_product = ? AND p.active = 1 AND p.stock_status != 'discontinued'
         LIMIT 1`,
        [id]
    );
    if (rows.length === 0) return null;

    const [images] = await pool.query<RowDataPacket[]>(
        "SELECT id_image, url FROM product_images WHERE id_product = ? ORDER BY sort_order ASC, id_image ASC",
        [id]
    );
    const [variants] = await pool.query<RowDataPacket[]>(
        "SELECT id_variant, scent, stock FROM product_variants WHERE id_product = ? AND active = 1 ORDER BY scent ASC",
        [id]
    );

    return {
        product: { ...toCatalogProduct(rows[0]), stock: Number(rows[0].stock) || 0 },
        images: images.map((i) => ({ id_image: i.id_image, url: i.url })),
        variants: variants.map((v) => ({
            id_variant: v.id_variant,
            scent: v.scent,
            stock: Number(v.stock) || 0,
            in_stock: Number(v.stock) > 0,
        })),
        updatedAt: rows[0].updatedAt ?? null,
    };
}

export async function listProductsForSitemap(): Promise<
    { id_product: number; name: string; updatedAt: Date | null }[]
> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT id_product, name, updatedAt FROM products
         WHERE active = 1 AND stock_status != 'discontinued'
         ORDER BY id_product ASC`
    );
    return rows as unknown as { id_product: number; name: string; updatedAt: Date | null }[];
}
