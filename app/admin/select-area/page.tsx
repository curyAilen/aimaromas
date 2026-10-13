"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Droplet, ArrowRight } from "lucide-react";

export default function SelectAreaPage() {
    const router = useRouter();
    const [role, setRole] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadSession() {
            try {
                const res = await fetch("/api/auth/me");
                const data = await res.json();
                if (res.ok && data.user) {
                    setRole(data.user.role);

                    // Si es Gerenta, ir directo a Relax
                    if (data.user.role === "GERENTA") {
                        router.push("/admin/relax");
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        loadSession();
    }, [router]);

    function goToArea(area: "aromas" | "relax") {
        router.push(`/admin/${area}`);
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-main">
                <div className="text-text-secondary text-sm">Cargando...</div>
            </div>
        );
    }

    if (role === "GERENTA") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-main">
                <div className="text-text-secondary text-sm">
                    Redirigiendo a tu área...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-main p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-text-primary">
                        Elegí tu área de trabajo
                    </h1>
                    <p className="text-sm text-text-secondary mt-2">
                        Podés cambiar de área en cualquier momento
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {role === "CEO" && (
                        <button
                            onClick={() => goToArea("aromas")}
                            className="group bg-white rounded-3xl p-8 shadow-card border-2 border-transparent hover:border-accent-pink transition-all text-left"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gradient-soft flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-8 h-8 text-accent-pink" />
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-2">
                                Aromas
                            </h2>
                            <p className="text-sm text-text-secondary mb-6">
                                Velas de soja, Wax Melts y todos los productos aromáticos.
                            </p>
                            <div className="flex items-center gap-2 text-accent-pink font-medium text-sm">
                                Entrar
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>
                    )}

                    <button
                        onClick={() => goToArea("relax")}
                        className={`group bg-white rounded-3xl p-8 shadow-card border-2 border-transparent hover:border-accent-purple transition-all text-left ${role !== "CEO" ? "md:col-span-2 md:max-w-md md:mx-auto" : ""
                            }`}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-soft flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Droplet className="w-8 h-8 text-accent-purple" />
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-2">
                            Relax
                        </h2>
                        <p className="text-sm text-text-secondary mb-6">
                            Jabones artesanales, esponjas y productos de cuidado personal.
                        </p>
                        <div className="flex items-center gap-2 text-accent-purple font-medium text-sm">
                            Entrar
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}