import mysql from "mysql2/promise";
import { requireEnv } from "./env";

const globalForDb = globalThis as unknown as {
    pool: mysql.Pool | undefined;
};

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
    });
}

export const pool = globalForDb.pool ?? createPool();

if (process.env.NODE_ENV !== "production") {
    globalForDb.pool = pool;
}
