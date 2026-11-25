import mysql from "mysql2/promise";
import { requireEnv } from "./env";

const globalForDb = globalThis as unknown as {
    pool: mysql.Pool | undefined;
};

/**
 * Conexión segura (TLS). Es opcional: solo se activa con DB_SSL=true
 * (o 1), así que Railway sigue funcionando igual sin tocar nada.
 * Los proveedores como TiDB Cloud la exigen. Se verifica el certificado
 * del servidor con las autoridades de confianza del sistema.
 */
function sslOption(): mysql.PoolOptions["ssl"] | undefined {
    const flag = (process.env.DB_SSL ?? "").trim().toLowerCase();
    if (flag !== "true" && flag !== "1") return undefined;
    return { minVersion: "TLSv1.2", rejectUnauthorized: true };
}

function createPool() {
    // Sin valores por defecto: las credenciales viven solo en .env / Vercel.
    return mysql.createPool({
        host: requireEnv("DB_HOST"),
        port: Number(requireEnv("DB_PORT")),
        user: requireEnv("DB_USER"),
        password: requireEnv("DB_PASSWORD"),
        database: requireEnv("DB_NAME"),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: "utf8mb4",
        ssl: sslOption(),
    });
}

export const pool = globalForDb.pool ?? createPool();

if (process.env.NODE_ENV !== "production") {
    globalForDb.pool = pool;
}
