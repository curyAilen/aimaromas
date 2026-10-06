import { pool } from "./lib/db";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

async function main() {
    const email = "admin@aimaaromas.com";
    const password = "afrgafrg";

    const hashed = await bcrypt.hash(password, 10);
    const id = randomUUID();

    console.log("Creando usuario...");

    await pool.query(
        `INSERT INTO users (email, password, name, role, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [id, email, hashed, "Admin CEO", "CEO"]
    );

    console.log("✅ Usuario creado:", email);

    // Verificar
    const [rows] = await pool.query("SELECT id, email, role FROM users");
    console.log("Usuarios en la DB:", rows);
}

main()
    .catch((e) => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(() => pool.end());