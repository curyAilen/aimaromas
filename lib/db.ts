import mysql from "mysql2/promise";

const globalForDb = globalThis as unknown as {
    pool: mysql.Pool | undefined;
};

function createPool() {
    return mysql.createPool({
        host: process.env.DB_HOST || "gondola.proxy.rlwy.net",
        port: Number(process.env.DB_PORT) || 58796,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "BVfKqVaVGaNfoHAUAfeQgNkvQXZFolDA",
        database: process.env.DB_NAME || "aimaaromas",
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