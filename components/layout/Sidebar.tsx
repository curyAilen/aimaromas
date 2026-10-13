"use client";

import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    BarChart3,
    Settings,
    Cake,
    Layers,
    Store,
    LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Area = "aromas" | "relax" | null;

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [lastArea, setLastArea] = useState<Area>(null);
    const [role, setRole] = useState<string>("");

    const urlArea: Area = pathname.startsWith("/admin/aromas")
        ? "aromas"
        : pathname.startsWith("/admin/relax")
            ? "relax"
            : null;

    useEffect(() => {
        async function loadSession() {
            try {
                const res = await fetch("/api/auth/me");
                const data = await res.json();
                if (res.ok && data.user) {
                    setRole(data.user.role);
                }
            } catch (error) {
                console.error(error);
            }
        }
        loadSession();
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem("aima_current_area");
        if (stored === "aromas" || stored === "relax") {
            setLastArea(stored);
        }
    }, []);

    useEffect(() => {
        if (urlArea) {
            localStorage.setItem("aima_current_area", urlArea);
            setLastArea(urlArea);
        }
    }, [urlArea]);

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/admin/login");
    }

    const currentArea = urlArea || lastArea;

    const areaItems = currentArea
        ? [
            {
                href: `/admin/${currentArea}`,
                label: "Dashboard",
                icon: LayoutDashboard,
            },
            {
                href: `/admin/${currentArea}/pedidos`,
                label: "Pedidos",
                icon: ShoppingCart,
            },
            {
                href: `/admin/${currentArea}/catalogo`,
                label: "Catálogo",
                icon: Package,
            },
            {
                href: `/admin/${currentArea}/estadisticas`,
                label: "Estadísticas",
                icon: BarChart3,
            },
        ]
        : [];

    const sharedItems = currentArea
        ? [
            ...(role === "CEO"
                ? [{ href: "/admin/overview", label: "Overview", icon: Layers }]
                : []),
            { href: "/admin/revendedoras", label: "Revendedoras", icon: Store },
            { href: "/admin/clientes", label: "Clientes", icon: Users },
            { href: "/admin/cumpleanos", label: "Cumpleaños", icon: Cake },
            ...(role === "CEO"
                ? [
                    {
                        href: "/admin/configuracion",
                        label: "Configuración",
                        icon: Settings,
                    },
                ]
                : []),
        ]
        : [];

    return (
        <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col">
            <Link href="/admin/select-area" className="p-6 flex items-center gap-2">
                <img
                    src="/logo.png"
                    alt="AIMA Aromas"
                    className="w-8 h-8 rounded-lg object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                    }}
                />
                <div className="flex flex-col leading-tight">
                    <span className="text-lg font-bold text-text-primary">
                        AIMA Aromas
                    </span>
                    {currentArea && (
                        <span
                            className={cn(
                                "text-[10px] font-medium uppercase tracking-wide",
                                currentArea === "aromas"
                                    ? "text-accent-pink"
                                    : "text-accent-purple"
                            )}
                        >
                            {currentArea === "aromas" ? "🕯️ Aromas" : "🧼 Relax"}
                        </span>
                    )}
                </div>
            </Link>

            <nav className="flex-1 px-3 space-y-1">
                {areaItems.length > 0 ? (
                    <>
                        {areaItems.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== `/admin/${currentArea}` &&
                                    pathname.startsWith(item.href));
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                                        isActive
                                            ? "bg-gradient-main text-white shadow-md shadow-accent-pink/20"
                                            : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}

                        <div className="pt-3 pb-1">
                            <p className="px-3 text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                                General
                            </p>
                        </div>

                        {sharedItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                                        isActive
                                            ? "bg-gradient-main text-white shadow-md shadow-accent-pink/20"
                                            : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </>
                ) : (
                    <Link
                        href="/admin/select-area"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-gray-50 hover:text-text-primary transition-all"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Elegir área
                    </Link>
                )}
            </nav>

            <div className="p-3 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all w-full"
                >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}