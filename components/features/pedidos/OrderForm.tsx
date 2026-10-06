"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, Package, Truck } from "lucide-react";
import Link from "next/link";
import { formatCurrency, buildOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import type { Client, Product, OrderItemInput } from "@/lib/types";

interface Variant {
    id_variant: number;
    id_product: number;
    scent: string;
}

interface OrderFormProps {
    preselectedClientId?: number;
}

export function OrderForm({ preselectedClientId }: OrderFormProps) {
    const router = useRouter();

    const [clients, setClients] = useState<Client[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>(
        preselectedClientId ? String(preselectedClientId) : ""
    );
    const [requiresDelivery, setRequiresDelivery] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<OrderItemInput[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [freeShippingThreshold, setFreeShippingThreshold] = useState(80000);
    const [deliveryCostBase, setDeliveryCostBase] = useState(5000);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Cargar datos iniciales
    useEffect(() => {
        async function load() {
            try {
                const [clientsRes, productsRes, settingsRes] = await Promise.all([
                    fetch("/api/clients"),
                    fetch("/api/products"),
                    fetch("/api/settings"),
                ]);

                const clientsData = await clientsRes.json();
                const productsData = await productsRes.json();
                const settingsData = await settingsRes.json();

                setClients(clientsData.clients || []);
                setProducts(productsData.products || []);
                setFreeShippingThreshold(
                    Number(settingsData.settings?.free_shipping_threshold) || 80000
                );
                setDeliveryCostBase(
                    Number(settingsData.settings?.delivery_cost) || 5000
                );

                if (preselectedClientId) {
                    const client = (clientsData.clients || []).find(
                        (c: Client) => c.id_client === preselectedClientId
                    );
                    if (client?.address) setDeliveryAddress(client.address);
                }
            } catch (error) {
                console.error(error);
            }
        }
        load();
    }, [preselectedClientId]);

    // Cargar rol del usuario
    useEffect(() => {
        async function loadSession() {
            try {
                const res = await fetch("/api/auth/me");
                const data = await res.json();
                if (data.user?.role === "CEO" || data.user?.role === "GERENTA") {
                    setIsAdmin(true);
                }
            } catch (error) {
                console.error(error);
            }
        }
        loadSession();
    }, []);

    // Cuando cambia el cliente y tiene dirección, pre-cargarla
    useEffect(() => {
        if (!selectedClientId) return;
        const client = clients.find((c) => c.id_client === Number(selectedClientId));
        if (client?.address) setDeliveryAddress(client.address);
    }, [selectedClientId, clients]);

    function addItem(product: Product) {
        const newItem: OrderItemInput = {
            id_product: product.id_product,
            id_variant: null,
            product_name: product.name,
            variant_scent: null,
            quantity: 1,
            unit_price: Number(product.price),
        };
        setItems((prev) => [...prev, newItem]);
    }

    function removeItem(index: number) {
        setItems((prev) => prev.filter((_, i) => i !== index));
    }

    function updateQuantity(index: number, quantity: number) {
        if (quantity < 1) return;
        setItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, quantity } : item))
        );
    }

    function updateVariant(
        index: number,
        variantId: number | null,
        scent: string | null
    ) {
        setItems((prev) =>
            prev.map((item, i) =>
                i === index
                    ? { ...item, id_variant: variantId, variant_scent: scent }
                    : item
            )
        );
    }

    const subtotal = items.reduce(
        (acc, item) => acc + item.unit_price * item.quantity,
        0
    );
    const deliveryCost =
        requiresDelivery && subtotal < freeShippingThreshold ? deliveryCostBase : 0;
    const total = subtotal + deliveryCost;
    const qualifiesForFreeShipping = subtotal >= freeShippingThreshold;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!selectedClientId) {
            setError("Tenés que seleccionar un cliente");
            return;
        }

        if (items.length === 0) {
            setError("Agregá al menos un producto");
            return;
        }

        if (requiresDelivery && !deliveryAddress.trim()) {
            setError("Si requiere envío, tenés que ingresar la dirección");
            return;
        }

        setSaving(true);

        try {
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id_client: Number(selectedClientId),
                    requires_delivery: requiresDelivery,
                    delivery_address: deliveryAddress,
                    notes,
                    items,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Error al guardar el pedido");
                setSaving(false);
                return;
            }

            // Solo abrir WhatsApp si NO es admin
            if (!isAdmin) {
                const detailRes = await fetch(`/api/orders/${data.id_order}`);
                const detailData = await detailRes.json();

                if (detailRes.ok && detailData.order) {
                    const message = buildOrderMessage(
                        detailData.order,
                        detailData.order.items
                    );
                    const url = buildWhatsAppUrl(message);
                    window.open(url, "_blank");
                }
            }

            // Admin → detalle del pedido. Cliente → listado.
            if (isAdmin) {
                router.push(`/admin/pedidos/${data.id_order}`);
            } else {
                router.push("/admin/pedidos");
            }
            router.refresh();
        } catch {
            setError("Error de conexión");
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6 max-w-5x mx-auto">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/pedidos"
                    className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 text-text-primary" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Nuevo pedido</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Elegí el cliente y agregá los productos
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6">
                    <h2 className="text-sm font-semibold text-text-primary mb-4">
                        Cliente
                    </h2>
                    <select
                        required
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="input"
                    >
                        <option value="">Seleccioná un cliente</option>
                        {clients.map((c) => (
                            <option key={c.id_client} value={c.id_client}>
                                {c.name} — {c.phone}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-text-primary">
                            Productos
                        </h2>
                        <span className="text-xs text-text-secondary">
                            {items.length} item{items.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    <ProductPicker products={products} onAdd={addItem} />

                    {items.length > 0 ? (
                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <OrderItemRow
                                    key={index}
                                    item={item}
                                    onRemove={() => removeItem(index)}
                                    onUpdateQuantity={(q) => updateQuantity(index, q)}
                                    onUpdateVariant={(vid, scent) =>
                                        updateVariant(index, vid, scent)
                                    }
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-text-secondary text-sm border-2 border-dashed border-gray-100 rounded-2xl">
                            Agregá productos al pedido
                        </div>
                    )}
                </div>

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
                            className="text-sm font-medium text-text-primary flex items-center gap-2"
                        >
                            <Truck className="w-4 h-4" />
                            Requiere envío
                        </label>
                    </div>

                    {requiresDelivery && (
                        <div className="space-y-3 pt-2">
                            <input
                                type="text"
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                placeholder="Dirección de entrega"
                                className="input"
                            />
                            <div
                                className={`text-xs p-3 rounded-xl ${qualifiesForFreeShipping
                                    ? "bg-green-50 text-green-700 border border-green-100"
                                    : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                                    }`}
                            >
                                {qualifiesForFreeShipping ? (
                                    <>
                                        🎉 Este pedido califica para envío <b>gratis</b> (supera{" "}
                                        {formatCurrency(freeShippingThreshold)})
                                    </>
                                ) : (
                                    <>
                                        🚚 Se cobrará envío de{" "}
                                        <b>{formatCurrency(deliveryCostBase)}</b>. Envío gratis a
                                        partir de {formatCurrency(freeShippingThreshold)}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6">
                    <h2 className="text-sm font-semibold text-text-primary mb-3">
                        Notas (opcional)
                    </h2>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ej: Entregar el viernes, cliente avisa cuando llega..."
                        rows={3}
                        className="input resize-none"
                    />
                </div>

                <div className="bg-gradient-soft rounded-3xl p-6 space-y-3">
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
                                {deliveryCost > 0 ? formatCurrency(deliveryCost) : "Gratis"}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-white/60">
                        <span className="text-base font-semibold text-text-primary">
                            Total
                        </span>
                        <span className="text-2xl font-bold text-accent-pink">
                            {formatCurrency(total)}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-3">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-end gap-3">
                    <Link
                        href="/admin/pedidos"
                        className="px-5 py-2.5 rounded-full text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={saving || items.length === 0 || !selectedClientId}
                        className="flex items-center gap-2 bg-gradient-main text-white rounded-full px-6 py-3 text-sm font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving
                            ? "Guardando..."
                            : isAdmin
                                ? "Guardar pedido"
                                : "Guardar y enviar por WhatsApp"}
                    </button>
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

/* ============================================================
   SELECTOR DE PRODUCTOS
   ============================================================ */
function ProductPicker({
    products,
    onAdd,
}: {
    products: Product[];
    onAdd: (p: Product) => void;
}) {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);

    const filtered = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 text-sm text-text-secondary hover:border-accent-pink/50 transition-colors"
            >
                <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Agregar producto
                </span>
            </button>

            {open && (
                <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-popup overflow-hidden">
                    <div className="p-3 border-b border-gray-100">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar producto..."
                            autoFocus
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-accent-pink/50"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="p-4 text-center text-text-secondary text-sm">
                                No hay productos
                            </div>
                        ) : (
                            filtered.map((product) => (
                                <button
                                    key={product.id_product}
                                    type="button"
                                    onClick={() => {
                                        onAdd(product);
                                        setSearch("");
                                        setOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-text-primary">
                                            {product.name}
                                        </p>
                                        <p className="text-xs text-text-secondary">
                                            {product.category_name}
                                            {product.size_name && ` • ${product.size_name}`}
                                        </p>
                                    </div>
                                    <span className="text-sm font-semibold text-accent-pink">
                                        {formatCurrency(product.price)}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ============================================================
   FILA DE ITEM
   ============================================================ */
function OrderItemRow({
    item,
    onRemove,
    onUpdateQuantity,
    onUpdateVariant,
}: {
    item: OrderItemInput;
    onRemove: () => void;
    onUpdateQuantity: (q: number) => void;
    onUpdateVariant: (variantId: number | null, scent: string | null) => void;
}) {
    const [variants, setVariants] = useState<Variant[]>([]);
    const [loadingVariants, setLoadingVariants] = useState(false);

    useEffect(() => {
        async function loadVariants() {
            setLoadingVariants(true);
            try {
                const res = await fetch(`/api/products/${item.id_product}/variants`);
                const data = await res.json();
                setVariants(data.variants || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingVariants(false);
            }
        }
        loadVariants();
    }, [item.id_product]);

    return (
        <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-gray-50/50 rounded-2xl">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                    {item.product_name}
                </p>
                <p className="text-xs text-text-secondary">
                    {formatCurrency(item.unit_price)} c/u
                </p>
            </div>

            {variants.length > 0 && (
                <select
                    value={item.id_variant || ""}
                    onChange={(e) => {
                        const vid = e.target.value ? Number(e.target.value) : null;
                        const v = variants.find((x) => x.id_variant === vid);
                        onUpdateVariant(vid, v?.scent || null);
                    }}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-accent-pink/50 bg-white"
                >
                    <option value="">Sin fragancia</option>
                    {variants.map((v) => (
                        <option key={v.id_variant} value={v.id_variant}>
                            {v.scent}
                        </option>
                    ))}
                </select>
            )}

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.quantity - 1)}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-colors"
                >
                    −
                </button>
                <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(Number(e.target.value) || 1)}
                    className="w-14 text-center px-2 py-1.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-accent-pink/50 bg-white"
                />
                <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.quantity + 1)}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-colors"
                >
                    +
                </button>
            </div>

            <div className="text-sm font-bold text-accent-pink md:w-24 md:text-right">
                {formatCurrency(item.unit_price * item.quantity)}
            </div>

            <button
                type="button"
                onClick={onRemove}
                className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors"
            >
                <Trash2 className="w-4 h-4 text-red-500" />
            </button>
        </div>
    );
}