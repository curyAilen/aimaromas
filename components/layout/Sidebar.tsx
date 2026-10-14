"use client";

import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    BarChart3,
    Settings,
    Cake,
    Store,
    LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [role, setRole] = useState<string>("");

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

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/admin/login");
    }

    const navItems = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
        { href: "/admin/catalogo", label: "Catálogo", icon: Package },
        { href: "/admin/clientes", label: "Clientes", icon: Users },
        { href: "/admin/revendedoras", label: "Revendedoras", icon: Store },
        { href: "/admin/cumpleanos", label: "Cumpleaños", icon: Cake },
        { href: "/admin/estadisticas", label: "Estadísticas", icon: BarChart3 },
        ...(role === "CEO"
            ? [
                {
                    href: "/admin/configuracion",
                    label: "Configuración",
                    icon: Settings,
                },
            ]
            : []),
    ];

    return (
        <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col">
            {/* Logo */}
            <Link href="/admin" className="p-6 flex items-center gap-2">
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
                    <span className="text-[10px] text-text-secondary">
                        Panel de administración
                    </span>
                </div>
            </Link>

            {/* Nav */}
            <nav className="flex-1 px-3 space-y-1">
                {navItems.map((item) => {
                    // Dashboard activo solo si la ruta es exactamente /admin
                    const isActive =
                        item.href === "/admin"
                            ? pathname === "/admin"
                            : pathname.startsWith(item.href);

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
            </nav>

            {/* Logout */}
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