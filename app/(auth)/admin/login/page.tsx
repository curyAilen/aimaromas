"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        e.stopPropagation();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Error al iniciar sesión");
                setLoading(false);
                return;
            }

            router.push("/admin");
            router.refresh();
        } catch {
            setError("Error de conexión");
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-4">
            <div className="bg-white rounded-3xl shadow-popup p-8 w-full max-w-md border border-gray-100/50">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-main flex items-center justify-center">
                        <span className="text-white font-bold">A</span>
                    </div>
                    <span className="text-2xl font-bold text-text-primary">
                        AIMA Aromas
                    </span>
                </div>

                <h1 className="text-2xl font-bold text-text-primary text-center mb-2">
                    Iniciar sesión
                </h1>
                <p className="text-sm text-text-secondary text-center mb-6">
                    Panel de administración
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-text-secondary block mb-1.5">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="admin@aimaaromas.com"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent-pink/50 focus:ring-2 focus:ring-accent-pink/10 transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-text-secondary block mb-1.5">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent-pink/50 focus:ring-2 focus:ring-accent-pink/10 transition-all"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-2.5">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-main text-white rounded-full px-6 py-3 text-base font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "Ingresando..." : "Ingresar"}
                    </button>
                </form>
            </div>
        </div>
    );
}