/**
 * Lee una variable de entorno obligatoria.
 * Si falta, corta con un error claro en vez de usar un valor por defecto
 * (los valores por defecto con credenciales reales quedaban en el repositorio).
 */
export function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value || value.trim() === "") {
        throw new Error(
            `Falta la variable de entorno ${name}. Configurala en .env (local) o en Vercel (producción).`
        );
    }
    return value;
}

/**
 * Clave para firmar las sesiones (JWT).
 * Se exige un mínimo de 32 caracteres para que no se pueda adivinar.
 */
export function getJwtSecret(): Uint8Array {
    const secret = requireEnv("JWT_SECRET");
    if (secret.length < 32) {
        throw new Error("JWT_SECRET tiene que tener al menos 32 caracteres.");
    }
    return new TextEncoder().encode(secret);
}
