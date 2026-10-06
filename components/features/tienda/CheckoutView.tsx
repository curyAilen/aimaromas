"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    MapPin,
    Truck,
    MessageCircle,
    ShoppingBag,
} from "lucide-react";
import { formatCurrency, buildOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { useCart } from "@/lib/cart-context";

export function CheckoutView() {
    const router = useRouter();
    const { items, subtotal, clearCart } = useCart();

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        delivery_address: "",
        notes: "",
    });
    const [requiresDelivery, setRequiresDelivery] = useState(false);
    const [freeShippingThreshold, setFreeShippingThreshold] = useState(80000);
    const [deliveryCostBase, setDeliveryCostBase] = useState(5000);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Cargar settings
    useEffect(() => {
        async function loadSettings() {
            try {
                const res = await fetch("/api/public/settings");
                const data = await res.json();
                setFreeShippingThreshold(
                    Number(data.settings?.free_shipping_threshold) || 80000
                );
                setDeliveryCostBase(
                    Number(data.settings?.delivery_cost) || 5000
                );
            } catch (error) {
                console.error(error);
            }
        }
        loadSettings();
    }, []);

    // Si el carrito está vacío, volver
    useEffect(() => {
        if (items.length === 0) {
            router.push("/carrito");
        }
    }, [items, router]);

    const qualifiesForFreeShipping = subtotal >= freeShippingThreshold;
    const deliveryCost =
        requiresDelivery && !qualifiesForFreeShipping ? deliveryCostBase : 0;
    const total = subtotal + deliveryCost;

    function update(field: keyof typeof form, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
            setError("Nombre, email y teléfono son obligatorios");
            return;
        }

        if (requiresDelivery && !form.delivery_address.trim()) {
            setError("Si elegís envío, ingresá la dirección");
            return;
        }

        setSubmitting(true);

        try {
            // Preparar items para la API
            const orderItems = items.map((item) => ({
                id_product: item.id_product,
                id_variant: item.id_variant,
                product_name: item.product_name,
                variant_scent: item.variant_scent,
                quantity: item.quantity,
                unit_price: item.price,
            }));

            const res = await fetch("/api/public/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name.trim(),
                    email: form.email.trim().toLowerCase(),
                    phone: form.phone.trim(),
                    requires_delivery: requiresDelivery,
                    delivery_address: form.delivery_address.trim(),
                    notes: form.notes.trim(),
                    items: orderItems,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Error al procesar el pedido");
                setSubmitting(false);
                return;
            }

            // Armar mensaje de WhatsApp
            const orderForMessage = {
                id_order: data.id_order,
                client_name: form.name,
                client_phone: form.phone,
                requires_delivery: requiresDelivery ? 1 : 0,
                delivery_address: requiresDelivery ? form.delivery_address : null,
                delivery_cost: String(deliveryCost),
                total: String(total),
                notes: form.notes,
            } as any;

            const messageItems = items.map((item, i) => ({
                id_item: i,
                id_order: data.id_order,
                id_product: item.id_product,
                id_variant: item.id_variant,
                product_name: item.product_name,
                variant_scent: item.variant_scent,
                quantity: item.quantity,
                unit_price: String(item.price),
                subtotal: String(item.price * item.quantity),
            }));

            const message = buildOrderMessage(orderForMessage, messageItems as any);
            const url = buildWhatsAppUrl(message);

            // Abrir WhatsApp
            window.open(url, "_blank");

            // Limpiar carrito y redirigir
            clearCart();
            router.push("/");
        } catch (err) {
            console.error(err);
            setError("Error de conexión. Intentá de nuevo.");
            setSubmitting(false);
        }
    }

    if (items.length === 0) {
        return null; // El useEffect redirige
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">
            {/* Volver */}
            <div className="flex items-center gap-4">
                <Link
                    href="/carrito"
                    className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 text-text-primary" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">
                        Finalizar pedido
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Completá tus datos y envianos el pedido por WhatsApp
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Formulario */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Datos personales */}
                        <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6 space-y-4">
                            <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                                <User className="w-4 h-4 text-accent-pink" />
                                Tus datos
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Nombre completo *">
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={(e) => update("name", e.target.value)}
                                        placeholder="Juan Pérez"
                                        className="input"
                                    />
                                </Field>

                                <Field label="Teléfono *">
                                    <input
                                        type="tel"
                                        required
                                        value={form.phone}
                                        onChange={(e) => update("phone", e.target.value)}
                                        placeholder="1173735090"
                                        className="input"
                                    />
                                </Field>

                                <Field label="Email *" full>
                                    <input
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={(e) => update("email", e.target.value)}
                                        placeholder="juan@email.com"
                                        className="input"
                                    />
                                    <p className="text-[10px] text-text-secondary mt-1">
                                        Lo usamos para identificar tu pedido. Si ya compraste
                                        antes, tus datos se completan automáticamente.
                                    </p>
                                </Field>
                            </div>
                        </div>

                        {/* Envío */}
                        <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="requiresDelivery"
                                    checked={requiresDelivery}
                                    onChange={(e) => setRequiresDelivery(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-accent-pink focus:ring-accent-pink/20"
                                />
                                <label
                                    htmlFor="requiresDelivery"
                                    className="text-sm font-medium text-text-primary flex items-center gap-2 cursor-pointer"
                                >
                                    <Truck className="w-4 h-4" />
                                    Quiero que me lo envíen
                                </label>
                            </div>

                            {requiresDelivery && (
                                <div className="space-y-3 pt-2">
                                    <Field label="Dirección de entrega *">
                                        <input
                                            type="text"
                                            required={requiresDelivery}
                                            value={form.delivery_address}
                                            onChange={(e) => update("delivery_address", e.target.value)}
                                            placeholder="Av. Siempre Viva 742, CABA"
                                            className="input"
                                        />
                                    </Field>

                                    <div
                                        className={`text-xs p-3 rounded-xl ${qualifiesForFreeShipping
                                            ? "bg-green-50 text-green-700 border border-green-100"
                                            : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                                            }`}
                                    >
                                        {qualifiesForFreeShipping ? (
                                            <>
                                                🎉 Tu pedido califica para <b>envío gratis</b> (supera{" "}
                                                {formatCurrency(freeShippingThreshold)})
                                            </>
                                        ) : (
                                            <>
                                                🚚 Costo de envío: <b>{formatCurrency(deliveryCostBase)}</b>.
                                                Envío gratis a partir de{" "}
                                                {formatCurrency(freeShippingThreshold)}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notas */}
                        <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6">
                            <h2 className="text-base font-semibold text-text-primary mb-3">
                                Notas (opcional)
                            </h2>
                            <textarea
                                value={form.notes}
                                onChange={(e) => update("notes", e.target.value)}
                                placeholder="Ej: Entregar por la tarde, avisar antes de ir..."
                                rows={3}
                                className="input resize-none"
                            />
                        </div>
                    </div>

                    {/* Resumen */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6 space-y-4 sticky top-24">
                            <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-accent-pink" />
                                Tu pedido
                            </h2>

                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {items.map((item, i) => (
                                    <div
                                        key={`${item.id_product}-${item.id_variant}-${i}`}
                                        className="flex items-start justify-between text-xs"
                                    >
                                        <div className="flex-1 min-w-0 pr-2">
                                            <p className="text-text-primary font-medium truncate">
                                                {item.quantity}x {item.product_name}
                                            </p>
                                            {item.variant_scent && (
                                                <p className="text-text-secondary">
                                                    {item.variant_scent}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-text-primary font-semibold whitespace-nowrap">
                                            {formatCurrency(item.price * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-3 border-t border-gray-100 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-secondary">Subtotal</span>
                                    <span className="font-semibold text-text-primary">
                                        {formatCurrency(subtotal)}
                                    </span>
                                </div>

                                {requiresDelivery && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-text-secondary">Envío</span>
                                        <span className="font-semibold text-text-primary">
                                            {deliveryCost > 0
                                                ? formatCurrency(deliveryCost)
                                                : "Gratis"}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                    <span className="text-base font-semibold text-text-primary">
                                        Total
                                    </span>
                                    <span className="text-xl font-bold text-accent-pink">
                                        {formatCurrency(total)}
                                    </span>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-3">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-main text-white rounded-full px-6 py-3.5 text-sm font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <MessageCircle className="w-4 h-4" />
                                {submitting ? "Enviando..." : "Confirmar por WhatsApp"}
                            </button>

                            <p className="text-[10px] text-text-secondary text-center">
                                Al confirmar, se abrirá WhatsApp con tu pedido listo para
                                enviar.
                            </p>
                        </div>
                    </div>
                </div>
            </form>

            <style jsx global>{`
        .input {
          width: 100%;
          padding: 0.625rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.15s;
          background: #fff;
        }
        .input:focus {
          border-color: rgba(255, 77, 141, 0.5);
          box-shadow: 0 0 0 2px rgba(255, 77, 141, 0.1);
        }
      `}</style>
        </div>
    );
}

function Field({
    label,
    children,
    full,
}: {
    label: string;
    children: React.ReactNode;
    full?: boolean;
}) {
    return (
        <div className={full ? "md:col-span-2" : ""}>
            <label className="text-xs font-medium text-text-secondary block mb-1.5">
                {label}
            </label>
            {children}
        </div>
    );
}