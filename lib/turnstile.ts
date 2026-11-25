/**
 * Protección anti-spam gratuita con Cloudflare Turnstile.
 * Si no está configurada (sin TURNSTILE_SECRET_KEY) no bloquea nada: el límite
 * por IP y el campo trampa siguen funcionando igual.
 */
export function turnstileEnabled(): boolean {
    return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(token: unknown, ip: string): Promise<boolean> {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) return true;
    if (typeof token !== "string" || token.length === 0 || token.length > 2048) return false;

    try {
        const body = new URLSearchParams({ secret, response: token });
        if (ip && ip !== "desconocida") body.set("remoteip", ip);
        const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            body,
            signal: AbortSignal.timeout(5000),
        });
        const data = (await res.json()) as { success?: boolean };
        return data.success === true;
    } catch (error) {
        console.error("Error verificando Turnstile:", error);
        return false;
    }
}
