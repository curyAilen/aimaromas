"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, Eye, Trash2, Package } from "lucide-react";
import { formatCurrency } from "@/lib/whatsapp";
import type { Order, OrderStatus } from "@/lib/types";

const statusLabels: Record<OrderStatus, { label: string; color: string }> = {
    pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
    confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-700" },
    delivered: { label: "Entregado", color: "bg-green-100 text-green-700" },
    cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

export function OrderList() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(true);

    async function loadOrders(query = "", status = "") {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (query) params.set("search", query);
            if (status) params.set("status", status);

            const res = await fetch(`/api/orders?${params.toString()}`);
            const data = await res.json();
            setOrders(data.orders || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadOrders(search, statusFilter);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, statusFilter]);

    async function handleDelete(id: number) {
        if (!confirm(`¿Eliminar el pedido #${id}?`)) return;
        try {
            await fetch(`/api/orders/${id}`, { method: "DELETE" });
            loadOrders(search, statusFilter);
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Pedidos</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        {orders.length} pedido{orders.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <Link
                    href="/admin/pedidos/nuevo"
                    className="flex items-center gap-2 bg-gradient-main text-white rounded-full px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo pedido
                </Link>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por cliente, teléfono o N° de pedido..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-100 text-sm outline-none focus:border-accent-pink/50 transition-colors"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white rounded-xl border border-gray-100 text-sm outline-none focus:border-accent-pink/50 transition-colors"
                >
                    <option value="">Todos los estados</option>
                    <option value="pending">Pendiente</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="delivered">Entregado</option>
                    <option value="cancelled">Cancelado</option>
                </select>
            </div>

            {loading ? (
                <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-8 text-center text-text-secondary text-sm">
                    Cargando pedidos...
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-12 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-text-secondary text-sm">
                        {search || statusFilter
                            ? "No se encontraron pedidos"
                            : "Todavía no hay pedidos. Creá el primero."}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead>
                                <tr className="text-left text-xs text-text-secondary border-b border-gray-100">
                                    <th className="px-6 py-3 font-medium">#</th>
                                    <th className="px-6 py-3 font-medium">Cliente</th>
                                    <th className="px-6 py-3 font-medium">Fecha</th>
                                    <th className="px-6 py-3 font-medium">Total</th>
                                    <th className="px-6 py-3 font-medium">Estado</th>
                                    <th className="px-6 py-3 font-medium">Pago</th>
                                    <th className="px-6 py-3 font-medium">Entrega</th>
                                    <th className="px-6 py-3 font-medium text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => {
                                    const isCancelled = order.status === "cancelled";
                                    const isPaid = !!order.paid_at;
                                    const isDelivered = !!order.delivered_at;

                                    return (
                                        <tr
                                            key={order.id_order}
                                            className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${isCancelled ? "opacity-60" : ""
                                                }`}
                                        >
                                            <td className="px-6 py-4 text-sm font-medium text-text-primary">
                                                #{order.id_order}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-text-primary">
                                                    {order.client_name}
                                                </p>
                                                <p className="text-xs text-text-secondary">
                                                    {order.client_phone}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap">
                                                {new Date(order.createdAt).toLocaleDateString("es-AR", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "2-digit",
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-accent-pink whitespace-nowrap">
                                                {formatCurrency(order.total)}
                                            </td>

                                            {/* Estado: Activo / Cancelado */}
                                            <td className="px-6 py-4">
                                                {isCancelled ? (
                                                    <span className="text-[10px] font-medium text-red-700 bg-red-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                        Cancelado
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-medium text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                        Activo
                                                    </span>
                                                )}
                                            </td>

                                            {/* Pago: Pagado / Pendiente / Cancelado */}
                                            <td className="px-6 py-4">
                                                {isCancelled ? (
                                                    <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                        —
                                                    </span>
                                                ) : isPaid ? (
                                                    <span className="text-[10px] font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                        ✓ Pagado
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-medium text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                        Pendiente
                                                    </span>
                                                )}
                                            </td>

                                            {/* Entrega: Entregado / Pendiente */}
                                            <td className="px-6 py-4">
                                                {isCancelled ? (
                                                    <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                        —
                                                    </span>
                                                ) : isDelivered ? (
                                                    <span className="text-[10px] font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                        ✓ Entregado
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-medium text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                        Pendiente
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/admin/pedidos/${order.id_order}`}
                                                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye className="w-4 h-4 text-text-secondary" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(order.id_order)}
                                                        className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}