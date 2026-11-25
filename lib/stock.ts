import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";

/**
 * Control de stock.
 * - Producto con fragancias: manda el stock de cada fragancia.
 * - Producto sin fragancias: manda products.stock.
 * Si hay stock → "entrega inmediata". Si no → "a pedido" (el pedido se acepta igual).
 */

/** Descuenta del stock lo que haya (nunca deja negativo) y anota cuánto salió de cada renglón. */
export async function deductStockForOrder(conn: PoolConnection, idOrder: number): Promise<void> {
    const [items] = await conn.query<RowDataPacket[]>(
        "SELECT id_item, id_product, id_variant, quantity FROM order_items WHERE id_order = ?",
        [idOrder]
    );

    const touched = new Set<number>();
    for (const item of items) {
        const quantity = Number(item.quantity);
        const isVariant = item.id_variant !== null;
        const [rows] = isVariant
            ? await conn.query<RowDataPacket[]>(
                  "SELECT stock FROM product_variants WHERE id_variant = ? FOR UPDATE",
                  [item.id_variant]
              )
            : await conn.query<RowDataPacket[]>(
                  "SELECT stock FROM products WHERE id_product = ? FOR UPDATE",
                  [item.id_product]
              );
        if (rows.length === 0) continue;

        const available = Number(rows[0].stock) || 0;
        const take = Math.min(available, quantity);
        if (take <= 0) continue;

        if (isVariant) {
            await conn.query("UPDATE product_variants SET stock = stock - ? WHERE id_variant = ?", [take, item.id_variant]);
        } else {
            await conn.query("UPDATE products SET stock = stock - ? WHERE id_product = ?", [take, item.id_product]);
        }
        await conn.query("UPDATE order_items SET stock_deducted = ? WHERE id_item = ?", [take, item.id_item]);
        touched.add(Number(item.id_product));
    }
    await syncStockStatus(conn, [...touched]);
}

/** Devuelve al stock lo que había salido de ese pedido (cancelación o borrado). */
export async function restoreStockForOrder(conn: PoolConnection, idOrder: number): Promise<void> {
    const [items] = await conn.query<RowDataPacket[]>(
        "SELECT id_item, id_product, id_variant, stock_deducted FROM order_items WHERE id_order = ? AND stock_deducted > 0",
        [idOrder]
    );

    const touched = new Set<number>();
    for (const item of items) {
        const give = Number(item.stock_deducted);
        if (item.id_variant !== null) {
            await conn.query("UPDATE product_variants SET stock = stock + ? WHERE id_variant = ?", [give, item.id_variant]);
        } else {
            await conn.query("UPDATE products SET stock = stock + ? WHERE id_product = ?", [give, item.id_product]);
        }
        await conn.query("UPDATE order_items SET stock_deducted = 0 WHERE id_item = ?", [item.id_item]);
        touched.add(Number(item.id_product));
    }
    await syncStockStatus(conn, [...touched]);
}

/**
 * Mantiene products.stock_status (en_stock / a pedido) alineado con el stock real,
 * porque otras pantallas (listado, estadísticas, exportaciones) lo leen.
 * Los productos discontinuados no se tocan.
 */
export async function syncStockStatus(conn: Pool | PoolConnection, productIds: number[]): Promise<void> {
    if (productIds.length === 0) return;
    await conn.query(
        `UPDATE products p
         SET p.stock_status = IF(
             IF(
                 (SELECT COUNT(*) FROM product_variants v WHERE v.id_product = p.id_product AND v.active = 1) > 0,
                 (SELECT COALESCE(SUM(v.stock), 0) FROM product_variants v WHERE v.id_product = p.id_product AND v.active = 1),
                 p.stock
             ) > 0,
             'in_stock', 'on_demand')
         WHERE p.id_product IN (?) AND p.stock_status != 'discontinued'`,
        [productIds]
    );
}
