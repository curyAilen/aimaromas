import type { RowDataPacket } from "mysql2/promise";
import { pool } from "./db";
import { DEFAULT_SETTINGS } from "./settings";

/**
 * Deja la base lista para las funciones nuevas (stock, límite de intentos,
 * configuración). Es idempotente: corre una vez por instancia, mira qué falta
 * y solo agrega eso. No toca ni borra datos existentes.
 */
let ready: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
    if (!ready) {
        ready = run().catch((error) => {
            ready = null; // reintenta en el próximo pedido
            console.error("ensureSchema falló:", error);
        });
    }
    return ready;
}

async function hasColumn(table: string, column: string): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS n FROM information_schema.columns
         WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
        [table, column]
    );
    return Number(rows[0]?.n) > 0;
}

async function run(): Promise<void> {
    // Stock de productos sin fragancias (las fragancias ya tienen su propio stock)
    if (!(await hasColumn("products", "stock"))) {
        await pool.query(
            "ALTER TABLE products ADD COLUMN stock INT UNSIGNED NOT NULL DEFAULT 0"
        );
    }

    // Cuántas unidades de cada renglón salieron de stock (para devolverlas si se cancela)
    if (!(await hasColumn("order_items", "stock_deducted"))) {
        await pool.query(
            "ALTER TABLE order_items ADD COLUMN stock_deducted INT UNSIGNED NOT NULL DEFAULT 0"
        );
    }

    // Registro de intentos para el límite por IP (login y pedidos de la tienda)
    await pool.query(
        `CREATE TABLE IF NOT EXISTS rate_limit_events (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            bucket VARCHAR(40) NOT NULL,
            ip VARCHAR(64) NOT NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_bucket_ip (bucket, ip, createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );

    // Configuración: solo agrega las claves que faltan, nunca pisa las existentes
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        await pool.query(
            "INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)",
            [key, value]
        );
    }
}
