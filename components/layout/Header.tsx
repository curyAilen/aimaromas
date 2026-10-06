"use client";

import { Bell, Link, Search, Settings } from "lucide-react";
import { NotificationPanel } from "./NotificationPanel";

export function Header() {
    return (
        <header className="sticky top-0 z-10 bg-bg-main/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
            <div className="relative w-96 max-w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                    type="text"
                    placeholder="Buscar pedidos, clientes, productos..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white rounded-full border border-gray-100 text-sm outline-none focus:border-accent-pink/50 transition-colors"
                />
            </div>

            <div className="flex items-center gap-3">
                <NotificationPanel />


                <div className="flex items-center gap-3 bg-white rounded-full pl-1 pr-4 py-1 border border-gray-100">
                    <div className="flex items-center">
                        <img src="/logo.png" alt="AIMA Aromas" className="w-8 h-8 rounded-lg" />
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-semibold text-text-primary leading-tight">
                            AIMA Aromas
                        </p>
                        <p className="text-[10px] text-text-secondary leading-tight">
                            Panel de administración
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}