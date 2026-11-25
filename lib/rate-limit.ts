import { pool } from "./db";
import { ensureSchema } from "./schema";
import type { RowDataPacket } from "mysql2/promise";

/** IP del visitante. En Vercel, x-forwarded-for la completa la plataforma. */
export function getClientIp(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "desconocida";
    return ip.slice(0, 64);
}

/** Cuántos eventos registró esa IP en la ventana de tiempo. */
export async function countRecent(
    bucket: string,
    ip: string,
    windowMinutes: number
): Promise<number> {
    await ensureSchema();
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS n FROM rate_limit_events
         WHERE bucket = ? AND ip = ? AND createdAt >= DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
        [bucket, ip, windowMinutes]
    );
    return Number(rows[0]?.n ?? 0);
}

export async function recordEvent(bucket: string, ip: string): Promise<void> {
    await ensureSchema();
    await pool.query("INSERT INTO rate_limit_events (bucket, ip) VALUES (?, ?)", [bucket, ip]);
    // Limpieza ocasional de registros viejos (1 de cada 20 veces)
    if (Math.random() < 0.05) {
        await pool.query(
            "DELETE FROM rate_limit_events WHERE createdAt < DATE_SUB(NOW(), INTERVAL 1 DAY)"
        );
    }
}

export async function clearEvents(bucket: string, ip: string): Promise<void> {
    await ensureSchema();
    await pool.query("DELETE FROM rate_limit_events WHERE bucket = ? AND ip = ?", [bucket, ip]);
}
