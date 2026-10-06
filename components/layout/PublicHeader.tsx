"use client";

import Link from "next/link";
import { ShoppingBag, LogIn } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";

export function PublicHeader() {
    const { totalItems } = useCart();
    const [logoError, setLogoError] = useState(false);

    return (
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3">
                    {!logoError ? (
                        <img
                            src="/logo.png"
                            alt="AIMA Aromas"
                            className="w-10 h-10 rounded-xl object-cover"
                            onError={() => setLogoError(true)}
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-main flex items-center justify-center">
                            <span className="text-white font-bold text-sm">A</span>
                        </div>
                    )}
                    <div className="flex flex-col leading-tight">
                        <span className="text-lg font-bold text-text-primary">
                            AIMA Aromas
                        </span>
                        <span className="text-[10px] text-text-secondary">
                            Jabones & Velas Artesanales
                        </span>
                    </div>
                </Link>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                    <Link
                        href="/admin/login"
                        className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        title="Panel de administración"
                    >
                        <LogIn className="w-4 h-4 text-text-primary" />
                    </Link>

                    <Link
                        href="/carrito"
                        className="relative flex items-center gap-2 bg-gradient-main text-white rounded-full px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-all active:scale-95"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        <span className="hidden sm:inline">Carrito</span>
                        {totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 bg-white text-accent-pink text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                                {totalItems}
                            </span>
                        )}
                    </Link>
                </div>
            </div>
        </header>
    );
}