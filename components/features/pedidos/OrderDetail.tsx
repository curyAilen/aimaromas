"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle2,
    Truck,
    DollarSign,
    XCircle,
    MessageCircle,
    Trash2,
    Store,
    Save,
} from "lucide-react";
import {
    formatCurrency,
    buildOrderMessage,
    buildWhatsAppUrl,
} from "@/lib/whatsapp";
import type { OrderItem, OrderStatus } from "@/lib/types";

interface OrderDetailProps {
    orderId: string;
}

interface Reseller {
    id_reseller: number;
    name: string;
    default_commission_percent: string;
}

const statusLabels: Record<OrderStatus, { label: string; color: string }> = {
    pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
    confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-700" },
    delivered: { label: "Entregado", color: "bg-green-100 text-green-700" },
    cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

export function OrderDetail({ orderId }: OrderDetailProps) {
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [resellers, setResellers] = useState<Reseller[]>([]);
    const [selectedResellerId, setSelectedResellerId] = useState<string>("");
    const [commissionPercent, setCommissionPercent] = useState<string>("");
    const [savingReseller, setSavingReseller] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    async function loadOrder() {
        try {
            const res = await fetch(`/api/orders/${orderId}`);
            const data = await res.json();
            if (res.ok) setOrder(data.order);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function loadResellers() {
        try {
            const res = await fetch("/api/resellers");
            const data = await res.json();
            setResellers(data.resellers || []);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        loadOrder();
        loadResellers();
    }, [orderId]);

    // Precargar revendedora cuando carga el pedido
    useEffect(() => {
        if (order) {
            setSelectedResellerId(
                order.id_reseller ? String(order.id_reseller) : ""
            );
            setCommissionPercent(
                order.commission_percent
                    ? Number(order.commission_percent).toFixed(2)
                    : "0"
            );
        }
    }, [order]);

    async function updateOrder(body: Record<string, unknown>) {
        setUpdating(true);
        try {
            await fetch(`/api/orders/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            await loadOrder();
        } catch (error) {
            console.error(error);
        } finally {
            setUpdating(false);
        }
    }

    async function handleSaveReseller() {
        setSavingReseller(true);
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id_reseller: selectedResellerId
                        ? Number(selectedResellerId)
                        : null,
                    commission_percent: commissionPercent
                        ? Number(commissionPercent)
                        : 0,
                }),
            });

            if (!res.ok) {
                alert("Error al guardar");
                setSavingReseller(false);
                return;
            }

            await loadOrder();
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        } finally {
            setSavingReseller(false);
        }
    }

    async function handleDelete() {
        if (!confirm(`¿Eliminar el pedido #${orderId}?`)) return;
        try {
            await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
            router.push("/admin/pedidos");
        } catch (error) {
            console.error(error);
        }
    }

    function handleSendWhatsApp() {
        if (!order) return;
        const message = buildOrderMessage(order, order.items);
        const url = buildWhatsAppUrl(message);
        window.open(url, "_blank");
    }

    if (loading) {
        return (
            <div className="p-8 text-center text-text-secondary text-sm">
                Cargando pedido...
            </div>
        );
    }

    if (!order) {
        return (
            <div className="p-8 text-center text-text-secondary text-sm">
                Pedido no encontrado
            </div>
        );
    }

    const st = statusLabels[order.status as OrderStatus];
    const isDelivered = !!order.delivered_at;
    const isPaid = !!order.paid_at;
    const isCancelled = order.status === "cancelled";

    // Calcular subtotal del pedido y comisión en vivo
    const orderSubtotal =
        order.items?.reduce(
            (acc: number, item: any) => acc + Number(item.subtotal),
            0
        ) || 0;

    const commissionAmount =
        selectedResellerId && commissionPercent
            ? (orderSubtotal * Number(commissionPercent)) / 100
            : 0;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/pedidos"
                        className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 text-text-primary" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">
                            Pedido #{order.id_order}
                        </h1>
                        <p className="text-sm text-text-secondary mt-1">
                            {new Date(order.createdAt).toLocaleString("es-AR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span
                        className={`text-xs font-medium px-3 py-1.5 rounded-full ${st.color}`}
                    >
                        {st.label}
                    </span>
                    <button
                        onClick={handleDelete}
                        className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-red-50 transition-colors"
                        title="Eliminar pedido"
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-3">
                {order.status === "pending" && (
                    <button
                        onClick={() => updateOrder({ status: "confirmed" })}
                        disabled={updating}
                        className="flex items-center gap-2 bg-blue-500 text-white rounded-full px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmar pedido
                    </button>
                )}

                <button
                    onClick={() => updateOrder({ markDelivered: !isDelivered })}
                    disabled={updating}
                    className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all active:scale-95 disabled:opacity-50 ${isDelivered
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-green-500 text-white hover:opacity-90"
                        }`}
                >
                    <Truck className="w-4 h-4" />
                    {isDelivered ? "Entregado ✓" : "Marcar entregado"}
                </button>

                <button
                    onClick={() => updateOrder({ markPaid: !isPaid })}
                    disabled={updating}
                    className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all active:scale-95 disabled:opacity-50 ${isPaid
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-emerald-500 text-white hover:opacity-90"
                        }`}
                >
                    <DollarSign className="w-4 h-4" />
                    {isPaid ? "Pagado ✓" : "Marcar pagado"}
                </button>

                <button
                    onClick={handleSendWhatsApp}
                    className="flex items-center gap-2 bg-white border border-gray-200 text-text-primary rounded-full px-5 py-2.5 text-sm font-medium hover:bg-gray-50 transition-all active:scale-95"
                >
                    <MessageCircle className="w-4 h-4" />
                    Reenviar por WhatsApp
                </button>

                {order.status !== "cancelled" && (
                    <button
                        onClick={() => {
                            if (confirm("¿Cancelar este pedido?")) {
                                updateOrder({ status: "cancelled" });
                            }
                        }}
                        disabled={updating}
                        className="flex items-center gap-2 bg-white border border-red-200 text-red-600 rounded-full px-5 py-2.5 text-sm font-medium hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <XCircle className="w-4 h-4" />
                        Cancelar pedido
                    </button>
                )}
            </div>

            {/* Datos del cliente */}
            <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6">
                <h2 className="text-sm font-semibold text-text-primary mb-4">
                    Cliente
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-text-secondary">Nombre</p>
                        <p className="text-sm font-medium text-text-primary">
                            {order.client_name}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary">Teléfono</p>
                        <p className="text-sm font-medium text-text-primary">
                            {order.client_phone}
                        </p>
                    </div>
                </div>

                {order.requires_delivery === 1 && order.delivery_address && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-text-secondary mb-1">
                            Dirección de entrega
                        </p>
                        <p className="text-sm text-text-primary">
                            {order.delivery_address}
                        </p>
                    </div>
                )}
            </div>

            {/* Revendedora y Comisión */}
            <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6 space-y-4">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <Store className="w-4 h-4 text-accent-purple" />
                    Revendedora y comisión
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium text-text-secondary block mb-1.5">
                            Asignar / cambiar revendedora
                        </label>
                        <select
                            value={selectedResellerId}
                            onChange={(e) => {
                                setSelectedResellerId(e.target.value);
                                const r = resellers.find(
                                    (x) => x.id_reseller === Number(e.target.value)
                                );
                                if (r) {
                                    setCommissionPercent(
                                        Number(r.default_commission_percent).toFixed(2)
                                    );
                                } else {
                                    setCommissionPercent("0");
                                }
                            }}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent-purple/50"
                        >
                            <option value="">— Sin revendedora —</option>
                            {resellers.map((r) => (
                                <option key={r.id_reseller} value={r.id_reseller}>
                                    {r.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-text-secondary block mb-1.5">
                            Comisión (%)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={commissionPercent}
                            onChange={(e) => setCommissionPercent(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent-purple/50"
                        />
                    </div>
                </div>

                {selectedResellerId && (
                    <div className="bg-accent-purple/10 border border-accent-purple/20 rounded-2xl p-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-text-primary">
                            Comisión calculada (sobre subtotal)
                        </span>
                        <span className="text-xl font-bold text-accent-purple">
                            {formatCurrency(commissionAmount)}
                        </span>
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    <button
                        onClick={handleSaveReseller}
                        disabled={savingReseller}
                        className="flex items-center gap-2 bg-gradient-main text-white rounded-full px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {savingReseller ? "Guardando..." : "Guardar revendedora"}
                    </button>
                </div>

                {/* Estado de comisión */}
                {order.reseller_name && order.commission_paid !== null && (
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-text-secondary">
                                Estado de comisión
                            </p>
                            {order.commission_paid === 1 ? (
                                <p className="text-sm font-medium text-green-700">
                                    ✓ Pagada el{" "}
                                    {new Date(order.commission_paid_at).toLocaleDateString(
                                        "es-AR"
                                    )}
                                </p>
                            ) : (
                                <p className="text-sm font-medium text-orange-600">
                                    Pendiente de pago
                                </p>
                            )}
                        </div>
                        <button
                            onClick={async () => {
                                if (!confirm("¿Cambiar el estado de la comisión?")) return;
                                await fetch(`/api/orders/${orderId}/commission`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        commission_paid: order.commission_paid === 1 ? false : true,
                                    }),
                                });
                                await loadOrder();
                            }}
                            disabled={updating}
                            className={`text-xs font-medium px-4 py-2 rounded-full transition-colors disabled:opacity-50 ${order.commission_paid === 1
                                    ? "bg-gray-100 text-text-secondary hover:bg-gray-200"
                                    : "bg-green-500 text-white hover:bg-green-600"
                                }`}
                        >
                            {order.commission_paid === 1
                                ? "Marcar pendiente"
                                : "Marcar pagada"}
                        </button>
                    </div>
                )}
            </div>

            {/* Items */}
            <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 overflow-hidden">
                <div className="p-6 pb-3">
                    <h2 className="text-sm font-semibold text-text-primary">
                        Productos
                    </h2>
                </div>
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-xs text-text-secondary border-b border-gray-100">
                            <th className="px-6 py-3 font-medium">Producto</th>
                            <th className="px-6 py-3 font-medium">Cantidad</th>
                            <th className="px-6 py-3 font-medium">Precio</th>
                            <th className="px-6 py-3 font-medium text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item: OrderItem) => (
                            <tr
                                key={item.id_item}
                                className="border-b border-gray-50 last:border-0"
                            >
                                <td className="px-6 py-4">
                                    <p className="text-sm font-medium text-text-primary">
                                        {item.product_name}
                                    </p>
                                    {item.variant_scent && (
                                        <p className="text-xs text-text-secondary">
                                            {item.variant_scent}
                                        </p>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-text-secondary">
                                    {item.quantity}
                                </td>
                                <td className="px-6 py-4 text-sm text-text-secondary">
                                    {formatCurrency(item.unit_price)}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-text-primary text-right">
                                    {formatCurrency(item.subtotal)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totales */}
            <div className="bg-gradient-soft rounded-3xl p-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Subtotal</span>
                    <span className="font-semibold text-text-primary">
                        {formatCurrency(
                            Number(order.total) - Number(order.delivery_cost)
                        )}
                    </span>
                </div>
                {Number(order.delivery_cost) > 0 && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Envío</span>
                        <span className="font-semibold text-text-primary">
                            {formatCurrency(order.delivery_cost)}
                        </span>
                    </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-white/60">
                    <span className="text-base font-semibold text-text-primary">
                        Total
                    </span>
                    <span className="text-2xl font-bold text-accent-pink">
                        {formatCurrency(order.total)}
                    </span>
                </div>
            </div>

            {/* Notas */}
            {order.notes && (
                <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6">
                    <h2 className="text-sm font-semibold text-text-primary mb-2">
                        Notas
                    </h2>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">
                        {order.notes}
                    </p>
                </div>
            )}

            {/* Estado de entrega / pago / cobro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                    className={`rounded-3xl p-5 ${isDelivered
                            ? "bg-green-50 border border-green-100"
                            : "bg-gray-50 border border-gray-100"
                        }`}
                >
                    <p className="text-xs text-text-secondary mb-1">Entrega</p>
                    {isDelivered ? (
                        <p className="text-sm font-semibold text-green-700">
                            Entregado el{" "}
                            {new Date(order.delivered_at!).toLocaleDateString("es-AR")}
                        </p>
                    ) : (
                        <p className="text-sm text-text-secondary">Sin entregar</p>
                    )}
                </div>

                <div
                    className={`rounded-3xl p-5 ${isPaid
                            ? "bg-emerald-50 border border-emerald-100"
                            : "bg-gray-50 border border-gray-100"
                        }`}
                >
                    <p className="text-xs text-text-secondary mb-1">Pago</p>
                    {isPaid ? (
                        <p className="text-sm font-semibold text-emerald-700">
                            Pagado el{" "}
                            {new Date(order.paid_at!).toLocaleDateString("es-AR")}
                        </p>
                    ) : (
                        <p className="text-sm text-text-secondary">Sin pagar</p>
                    )}
                </div>

                {order.pays_next_month === 1 && (
                    <div className="rounded-3xl p-5 bg-purple-50 border border-purple-100">
                        <p className="text-xs text-purple-600 mb-1">Cobro</p>
                        <p className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                            📅 Se cobra a mes siguiente
                        </p>
                    </div>
                )}

                {isCancelled && order.cancelled_at && (
                    <div className="rounded-3xl p-5 bg-red-50 border border-red-100">
                        <p className="text-xs text-red-600 mb-1">Cancelación</p>
                        <p className="text-sm font-semibold text-red-700">
                            Cancelado el{" "}
                            {new Date(order.cancelled_at).toLocaleDateString("es-AR")}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}