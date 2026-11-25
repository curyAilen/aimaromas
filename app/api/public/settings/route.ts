import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema";
import { getSettings, PUBLIC_SETTING_KEYS } from "@/lib/settings";

// GET /api/public/settings
// Solo datos que puede ver cualquier visitante (envío y WhatsApp). Nunca el email del aviso.
export async function GET() {
    try {
        await ensureSchema();
        const settings = await getSettings(PUBLIC_SETTING_KEYS);
        return NextResponse.json({ settings });
    } catch (error) {
        console.error("Error en GET /api/public/settings:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
