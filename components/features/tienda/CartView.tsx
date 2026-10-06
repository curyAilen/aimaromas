"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, ShoppingBag, Truck } from "lucide-react";
import { formatCurrency } from "@/lib/whatsapp";
import { useCart } from "@/lib/cart-context";

export function CartView() {
    const { items, removeItem, updateQuantity, subtotal, totalItems } = useCart();
    const [freeShippingThreshold, setFreeShippingThreshold] = useState(80000);
    const [deliveryCost, setDeliveryCost] = useState(5000);

    useEffect(() => {
        async function loadSettings() {
            try {
                const res = await fetch("/api/public/settings");
                const data = await res.json();
                setFreeShippingThreshold(
                    Number(data.settings?.free_shipping_threshold) || 80000
                );
                setDeliveryCost(Number(data.settings?.delivery_cost) || 5000);
            } catch (error) {
                console.error(error);
            }
        }
        loadSettings();
    }, []);

    const qualifiesForFreeShipping = subtotal >= freeShippingThreshold;
    const missingForFreeShipping = freeShippingThreshold - subtotal;

    if (items.length === 0) {
        return (
            <div className="max-w-3xl mx-auto  px-4 py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-soft flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-8 h-8 text-accent-pink" />
                </div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">
                    Tu carrito está vacío
                </h1>
                <p className="text-text-secondary mb-6">
                    Todavía no agregaste productos.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-gradient-main text-white rounded-full px-6 py-3 text-sm font-medium hover:opacity-90 transition-all active:scale-95"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Ir a la tienda
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/"
                    className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 text-text-primary" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Tu carrito</h1>
                    <p className="text-sm text-text-secondary">
                        {totalItems} producto{totalItems !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lista de items */}
                <div className="lg:col-span-2 space-y-3">
                    {items.map((item) => (
                        <div
                            key={`${item.id_product}-${item.id_variant}`}
                            className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-card border border-gray-100/50"
                        >
                            <div className="w-20 h-20 rounded-xl bg-gradient-soft overflow-hidden flex-shrink-0">
                                {item.image_url ? (
                                    <img
                                        src={item.image_url}
                                        alt={item.product_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl">
                                        🕯️
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-text-primary leading-tight">
                                    {item.product_name}
                                </p>
                                {item.variant_scent && (
                                    <p className="text-xs text-text-secondary mt-0.5">
                                        {item.variant_scent}
                                    </p>
                                )}
                                <p className="text-sm font-bold text-accent-pink mt-1">
                                    {formatCurrency(item.price)}
                                </p>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <button
                                    onClick={() => removeItem(item.id_product, item.id_variant)}
                                    className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                </button>

                                <div className="flex items-center gap-2 bg-gray-50 rounded-full">
                                    <button
                                        onClick={() =>
                                            updateQuantity(
                                                item.id_product,
                                                item.id_variant,
                                                item.quantity - 1
                                            )
                                        }
                                        className="w-7 h-7 rounded-full hover:bg-white flex items-center justify-center transition-colors text-text-primary font-bold text-sm"
                                    >
                                        −
                                    </button>
                                    <span className="text-sm font-semibold text-text-primary w-5 text-center">
                                        {item.quantity}
                                    </span>
                                    <button
                                        onClick={() =>
                                            updateQuantity(
                                                item.id_product,
                                                item.id_variant,
                                                item.quantity + 1
                                            )
                                        }
                                        className="w-7 h-7 rounded-full hover:bg-white flex items-center justify-center transition-colors text-text-primary font-bold text-sm"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Resumen */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100/50 space-y-4 sticky top-24">
                        <h2 className="text-base font-semibold text-text-primary">
                            Resumen
                        </h2>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-text-secondary">Subtotal</span>
                            <span className="font-semibold text-text-primary">
                                {formatCurrency(subtotal)}
                            </span>
                        </div>

                        {/* Info de envío gratis */}
                        <div className="pt-3 border-t border-gray-100 space-y-3">
                            {qualifiesForFreeShipping ? (
                                <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-700">
                                    🎉 ¡Tenés <b>envío gratis</b>!
                                </div>
                            ) : (
                                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-xs text-yellow-700 flex items-start gap-2">
                                    <Truck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>
                                        Te faltan <b>{formatCurrency(missingForFreeShipping)}</b>{" "}
                                        para tener envío gratis
                                    </span>
                                </div>
                            )}
                        </div>

                        <Link
                            href="/checkout"
                            className="block w-full bg-gradient-main text-white rounded-full px-6 py-3.5 text-sm font-semibold text-center hover:opacity-90 transition-all active:scale-95"
                        >
                            Finalizar pedido
                        </Link>

                        <Link
                            href="/"
                            className="block text-center text-xs text-text-secondary hover:text-accent-pink transition-colors"
                        >
                            Seguir comprando
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}