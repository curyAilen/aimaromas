"use client";

import { useEffect, useRef } from "react";

/**
 * Anti-spam gratuito de Cloudflare (Turnstile).
 * Solo se muestra si está cargada NEXT_PUBLIC_TURNSTILE_SITE_KEY; si no, no hace nada
 * y el sitio sigue funcionando con el límite por IP.
 */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
export const turnstileConfigured = TURNSTILE_SITE_KEY !== "";

interface TurnstileApi {
    render: (el: HTMLElement, options: Record<string, unknown>) => string;
    reset: (widgetId?: string) => void;
    remove: (widgetId: string) => void;
}

declare global {
    interface Window {
        turnstile?: TurnstileApi;
    }
}

const SCRIPT_ID = "cloudflare-turnstile-script";

function loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.turnstile) return resolve();
        const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
        if (existing) {
            existing.addEventListener("load", () => resolve());
            existing.addEventListener("error", () => reject(new Error("turnstile")));
            return;
        }
        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("turnstile"));
        document.head.appendChild(script);
    });
}

interface TurnstileProps {
    onToken: (token: string) => void;
    /** Cambiar este número reinicia la verificación (por ejemplo después de un error) */
    resetKey?: number;
}

export function Turnstile({ onToken, resetKey = 0 }: TurnstileProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetId = useRef<string | null>(null);
    const onTokenRef = useRef(onToken);

    useEffect(() => {
        onTokenRef.current = onToken;
    }, [onToken]);

    useEffect(() => {
        if (!turnstileConfigured) return;
        let cancelled = false;

        loadScript()
            .then(() => {
                if (cancelled || !containerRef.current || !window.turnstile) return;
                widgetId.current = window.turnstile.render(containerRef.current, {
                    sitekey: TURNSTILE_SITE_KEY,
                    callback: (token: string) => onTokenRef.current(token),
                    "expired-callback": () => onTokenRef.current(""),
                    "error-callback": () => onTokenRef.current(""),
                    language: "es",
                });
            })
            .catch(() => onTokenRef.current(""));

        return () => {
            cancelled = true;
            if (widgetId.current && window.turnstile) {
                window.turnstile.remove(widgetId.current);
                widgetId.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (resetKey > 0 && widgetId.current && window.turnstile) {
            onTokenRef.current("");
            window.turnstile.reset(widgetId.current);
        }
    }, [resetKey]);

    if (!turnstileConfigured) return null;
    return <div ref={containerRef} className="flex justify-center" />;
}
