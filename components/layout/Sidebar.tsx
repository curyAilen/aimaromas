"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    BarChart3,
    Settings,
    Cake,
    LogOut,
} from "lucide-react";

const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
    { href: "/admin/catalogo", label: "Catálogo", icon: Package },
    { href: "/admin/clientes", label: "Clientes", icon: Users },
    { href: "/admin/cumpleanos", label: "Cumpleaños", icon: Cake },
    { href: "/admin/estadisticas", label: "Estadísticas", icon: BarChart3 },
    { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];






export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col">
            <div className="p-6 flex items-center gap-2">
                <img src="/logo.png" alt="AIMA Aromas" className="w-8 h-8 rounded-lg" />
                <span className="text-lg font-bold text-text-primary">AIMA Aromas</span>
            </div>

            <nav className="flex-1 px-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
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

            <div className="p-3 border-t border-gray-100 space-y-1">
                <button
                    onClick={async () => {
                        await fetch("/api/auth/logout", { method: "POST" });
                        window.location.href = "/";
                    }}
                    className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-red-50 transition-colors"
                    title="Cerrar sesión"
                >
                    <LogOut className="w-4 h-4 text-red-500" />
                </button>
            </div>
        </aside>
    );
}