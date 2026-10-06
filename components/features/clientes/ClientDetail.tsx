"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Phone,
    Mail,
    MapPin,
    Cake,
    ShoppingCart,
    DollarSign,
    TrendingUp,
    Eye,
} from "lucide-react";
import { formatCurrency } from "@/lib/whatsapp";

interface Client {
    id_client: number;
    name: string;
    email: string | null;
    phone: string;
    address: string | null;
    birthday: string | null;
    notes: string | null;
    createdAt: string;
}

interface Order {
    id_order: number;
    total: string;
    status: string;
    createdAt: string;
    delivered_at: string | null;
    paid_at: string | null;
}

interface ClientDetailProps {
    clientId: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
    confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-700" },
    delivered: { label: "Entregado", color: "bg-green-100 text-green-700" },
    cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

export function ClientDetail({ clientId }: ClientDetailProps) {
    const router = useRouter();
    const [client, setClient] = useState<Client | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [clientRes, ordersRes] = await Promise.all([
                    fetch(`/api/clients/${clientId}`),
                    fetch(`/api/clients/${clientId}/orders`),
                ]);

                const clientData = await clientRes.json();
                const ordersData = await ordersRes.json();

                if (clientRes.ok) setClient(clientData.client);
                if (ordersRes.ok) setOrders(ordersData.orders || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [clientId]);

    async function handleDelete() {
        if (!client) return;
        if (
            !confirm(
                `¿Eliminar a ${client.name}? Esta acción no se puede deshacer.`
            )
        )
            return;

        try {
            await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
            router.push("/admin/clientes");
        } catch (error) {
            console.error(error);
            alert("Error al eliminar");
        }
    }

    if (loading) {
        return (
            <div className="text-center py-16 text-text-secondary text-sm">
                Cargando...
            </div>
        );
    }

    if (!client) {
        return (
            <div className="text-center py-16">
                <p className="text-text-secondary">Cliente no encontrado</p>
                <Link
                    href="/admin/clientes"
                    className="inline-block mt-4 text-accent-pink hover:underline text-sm"
                >
                    Volver a clientes
                </Link>
            </div>
        );
    }

    // Estadísticas
    const validOrders = orders.filter((o) => o.status !== "cancelled");
    const totalSpent = validOrders.reduce(
        (acc, o) => acc + Number(o.total),
        0
    );
    const totalOrders = validOrders.length;
    const avgTicket = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const pendingPayment = validOrders.filter((o) => !o.paid_at).length;
    const lastOrder = validOrders[0];

    function getInitials(name: string) {
        return name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    }

    function isBirthdaySoon(birthday: string | null) {
        if (!birthday) return false;
        const today = new Date();
        const bday = new Date(birthday);
        bday.setFullYear(today.getFullYear());
        if (bday < today) bday.setFullYear(today.getFullYear() + 1);
        const diffDays = Math.ceil(
            (bday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diffDays <= 30;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/clientes"
                    className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 text-text-primary" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-text-primary">
                        {client.name}
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Cliente desde{" "}
                        {new Date(client.createdAt).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                        })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={`/admin/clientes/${clientId}/editar`}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-text-primary rounded-full px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        <Pencil className="w-4 h-4" />
                        Editar
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 bg-white border border-red-200 text-red-600 rounded-full px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                    </button>
                </div>
            </div>

            {/* Ficha del cliente */}
            <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6">
                <div className="flex items-start gap-5">
                    <div className="w-16 h-16 rounded-full bg-gradient-main flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                        {getInitials(client.name)}
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                                <Phone className="w-3.5 h-3.5 text-text-secondary" />
                            </div>
                            <div>
                                <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                                    Teléfono
                                </p>
                                <p className="text-sm font-medium text-text-primary">
                                    {client.phone}
                                </p>
                            </div>
                        </div>

                        {client.email && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-3.5 h-3.5 text-text-secondary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                                        Email
                                    </p>
                                    <p className="text-sm font-medium text-text-primary truncate">
                                        {client.email}
                                    </p>
                                </div>
                            </div>
                        )}

                        {client.address && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-3.5 h-3.5 text-text-secondary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                                        Dirección
                                    </p>
                                    <p className="text-sm font-medium text-text-primary">
                                        {client.address}
                                    </p>
                                </div>
                            </div>
                        )}

                        {client.birthday && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                                    <Cake className="w-3.5 h-3.5 text-text-secondary" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div>
                                        <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                                            Cumpleaños
                                        </p>
                                        <p className="text-sm font-medium text-text-primary">
                                            {new Date(client.birthday).toLocaleDateString("es-AR", {
                                                day: "2-digit",
                                                month: "long",
                                            })}
                                        </p>
                                    </div>
                                    {isBirthdaySoon(client.birthday) && (
                                        <span className="text-xs bg-accent-pink/10 text-accent-pink px-2 py-0.5 rounded-full">
                                            🎂 Pronto
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {client.notes && (
                    <div className="mt-5 pt-5 border-t border-gray-100">
                        <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1">
                            Notas
                        </p>
                        <p className="text-sm text-text-primary whitespace-pre-wrap">
                            {client.notes}
                        </p>
                    </div>
                )}
            </div>

            {/* KPIs del cliente */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard
                    icon={<ShoppingCart className="w-4 h-4" />}
                    label="Pedidos"
                    value={String(totalOrders)}
                    color="pink"
                />
                <KPICard
                    icon={<DollarSign className="w-4 h-4" />}
                    label="Total gastado"
                    value={formatCurrency(totalSpent)}
                    color="green"
                />
                <KPICard
                    icon={<TrendingUp className="w-4 h-4" />}
                    label="Ticket promedio"
                    value={formatCurrency(avgTicket)}
                    color="purple"
                />
                <KPICard
                    icon={<Eye className="w-4 h-4" />}
                    label="Sin pagar"
                    value={String(pendingPayment)}
                    subtitle={
                        pendingPayment > 0 ? "Requiere seguimiento" : "Todo al día"
                    }
                    color={pendingPayment > 0 ? "orange" : "green"}
                />
            </div>

            {/* Último pedido destacado */}
            {lastOrder && (
                <div className="bg-gradient-soft rounded-3xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1">
                                Último pedido
                            </p>
                            <p className="text-lg font-bold text-text-primary">
                                #{lastOrder.id_order} — {formatCurrency(lastOrder.total)}
                            </p>
                            <p className="text-xs text-text-secondary mt-0.5">
                                {new Date(lastOrder.createdAt).toLocaleDateString("es-AR", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                        <Link
                            href={`/admin/pedidos/${lastOrder.id_order}`}
                            className="flex items-center gap-2 bg-white text-text-primary rounded-full px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                            Ver pedido
                        </Link>
                    </div>
                </div>
            )}

            {/* Historial de pedidos */}
            <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 overflow-hidden">
                <div className="p-6 pb-3">
                    <h2 className="text-base font-semibold text-text-primary">
                        Historial de pedidos
                    </h2>
                    <p className="text-xs text-text-secondary mt-1">
                        {orders.length} pedido{orders.length !== 1 ? "s" : ""} en total
                    </p>
                </div>

                {orders.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary text-sm">
                        Este cliente todavía no tiene pedidos
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-text-secondary border-y border-gray-100">
                                <th className="px-6 py-3 font-medium">#</th>
                                <th className="px-6 py-3 font-medium">Fecha</th>
                                <th className="px-6 py-3 font-medium">Estado</th>
                                <th className="px-6 py-3 font-medium">Entrega</th>
                                <th className="px-6 py-3 font-medium">Pago</th>
                                <th className="px-6 py-3 font-medium text-right">Total</th>
                                <th className="px-6 py-3 font-medium text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => {
                                const st = statusLabels[order.status] || statusLabels.pending;
                                return (
                                    <tr
                                        key={order.id_order}
                                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                                    >
                                        <td className="px-6 py-3 text-sm font-medium text-text-primary">
                                            #{order.id_order}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-text-secondary">
                                            {new Date(order.createdAt).toLocaleDateString("es-AR")}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span
                                                className={`text-[10px] font-medium px-2 py-1 rounded-full ${st.color}`}
                                            >
                                                {st.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-xs text-text-secondary">
                                            {order.delivered_at
                                                ? new Date(order.delivered_at).toLocaleDateString(
                                                    "es-AR"
                                                )
                                                : "—"}
                                        </td>
                                        <td className="px-6 py-3">
                                            {order.paid_at ? (
                                                <span className="text-[10px] font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                                    Pagado
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                                                    Pendiente
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-sm font-semibold text-accent-pink text-right">
                                            {formatCurrency(order.total)}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <Link
                                                href={`/admin/pedidos/${order.id_order}`}
                                                className="w-7 h-7 rounded-full hover:bg-gray-100 inline-flex items-center justify-center transition-colors"
                                                title="Ver pedido"
                                            >
                                                <Eye className="w-3.5 h-3.5 text-text-secondary" />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function KPICard({
    icon,
    label,
    value,
    subtitle,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    subtitle?: string;
    color: "pink" | "green" | "purple" | "orange";
}) {
    const colors = {
        pink: "text-accent-pink bg-accent-pink/10",
        green: "text-green-600 bg-green-50",
        purple: "text-accent-purple bg-accent-purple/10",
        orange: "text-orange-500 bg-orange-50",
    };

    return (
        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100/50">
            <div
                className={`w-8 h-8 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}
            >
                {icon}
            </div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                {label}
            </p>
            <p className="text-lg font-bold text-text-primary mt-0.5 truncate">
                {value}
            </p>
            {subtitle && (
                <p className="text-[10px] text-text-secondary mt-0.5">{subtitle}</p>
            )}
        </div>
    );
}