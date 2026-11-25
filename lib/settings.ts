import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { pool } from "./db";
import { DEFAULT_SETTINGS, type SettingKey } from "./settings-defaults";

export { DEFAULT_SETTINGS };
export type { SettingKey };

/** Claves que puede ver cualquier visitante de la tienda (nunca el email). */
export const PUBLIC_SETTING_KEYS: SettingKey[] = [
    "free_shipping_threshold",
    "delivery_cost",
    "whatsapp_number",
];

/**
 * Lee la configuración. Si una clave no existe (o está vacía) usa el valor por
 * defecto, así la tienda nunca queda sin número de WhatsApp ni costo de envío.
 */
export async function getSettings(
    keys: SettingKey[] = Object.keys(DEFAULT_SETTINGS) as SettingKey[],
    db: Pool | PoolConnection = pool
): Promise<Record<SettingKey, string>> {
    const result = { ...DEFAULT_SETTINGS } as Record<SettingKey, string>;
    const [rows] = await db.query<RowDataPacket[]>(
        "SELECT setting_key, setting_value FROM settings WHERE setting_key IN (?)",
        [keys]
    );
    for (const row of rows) {
        const key = row.setting_key as SettingKey;
        const value = String(row.setting_value ?? "").trim();
        if (key in result && value !== "") result[key] = value;
    }
    return result;
}

/** Número de WhatsApp en formato wa.me (solo dígitos, con código de país). */
export function normalizeWhatsApp(value: string): string {
    return value.replace(/\D/g, "");
}
