"use client";

import { useEffect } from "react";
import { setWhatsAppNumber } from "@/lib/whatsapp";

/** Carga el número de WhatsApp desde Configuración y se lo pasa a los botones y mensajes. */
export function WhatsAppConfig() {
    useEffect(() => {
        let cancelled = false;
        fetch("/api/public/settings")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                const number = data?.settings?.whatsapp_number;
                if (!cancelled && typeof number === "string") setWhatsAppNumber(number);
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, []);

    return null;
}
