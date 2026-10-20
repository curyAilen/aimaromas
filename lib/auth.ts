import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getJwtSecret } from "./env";
import { pool } from "./db";
import type { RowDataPacket } from "mysql2";

const COOKIE_NAME = "mezo_session";
export interface SessionPayload {
    userId: number;
    email: string;
    name: string;
    role: "CEO" | "GERENTA";
}

export async function createSession(payload: SessionPayload): Promise<string> {
    return await new SignJWT(payload as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(getJwtSecret());
}

export async function verifySession(
    token: string
): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getJwtSecret());
        return payload as unknown as SessionPayload;
    } catch {
        return null;
    }
}

export async function setSessionCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });
}

export async function clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const session = await verifySession(token);
    if (!session) return null;

    // La sesión dura 7 días: si mientras tanto la usuaria fue dada de baja,
    // se corta en el próximo pedido a la API.
    const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT 1 FROM users WHERE id_user = ? AND active = 1 LIMIT 1",
        [session.userId]
    );
    return rows.length > 0 ? session : null;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;