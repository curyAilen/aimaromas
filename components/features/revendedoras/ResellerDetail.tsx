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
    IdCard,
    DollarSign,
    ShoppingCart,
    Users,
    TrendingUp,
    AlertCircle,
    Trophy,
    CheckCircle2,
    Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/whatsapp";

interface Reseller {
    id_reseller: number;
    name: string;
    phone: string | null;
    email: string | null;
    dni: string | null;
    address: string | null;
    notes: string | null;
    default_commission_percent: string;
    active: number;
    createdAt: string;
}

interface Stats {
    totals: {
        total_orders: number;
        total_sold: number;
        pending_payment: number;
        unique_clients: number;
        total_commission: number;
        pending_commission: number;
        paid_commission: number;
    };
    salesByMonth: Array<{
        month: string;
        orders: number;
        revenue: number;
        commission: number;
    }>;
    topProducts: Array<{
        product_name: string;
        total_qty: number;
        total_revenue: number;
    }>;
    topClients: Array<{
        id_client: number;
        name: string;
        phone: string;
        order_count: number;
        total_spent: number;
    }>;
}

interface Order {
    id_order: number;
    total: number;
    status: string;
    tag: string;
    delivered_at: string | null;
    paid_at: string | null;
    createdAt: string;
    commission_percent: string;
    commission_amount: string;
    commission_paid: number;
    commission_paid_at: string | null;
    client_name: string;
    client_phone: string;
}

interface ResellerDetailProps {
    resellerId: string;
}

export function ResellerDetail({ resellerId }: ResellerDetailProps) {
    const router = useRouter();
    const [reseller, setReseller] = useState<Reseller | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingCommission, setUpdatingCommission] = useState<number | null>(
        null
    );

    async function loadAll() {
        try {
            const [resellerRes, statsRes, ordersRes] = await Promise.all([
                fetch(`/api/resellers/${resellerId}`),
                fetch(`/api/resellers/${resellerId}/stats`),
                fetch(`/api/resellers/${resellerId}/orders`),
            ]);

            const resellerData = await resellerRes.json();
            const statsData = await statsRes.json();
            const ordersData = await ordersRes.json();

            if (resellerRes.ok) setReseller(resellerData.reseller);
            if (statsRes.ok) setStats(statsData);
            if (ordersRes.ok) setOrders(ordersData.orders || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAll();
    }, [resellerId]);

    async function toggleCommissionPaid(orderId: number, currentPaid: boolean) {
        setUpdatingCommission(orderId);
        try {
            await fetch(`/api/orders/${orderId}/commission`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ commission_paid: !currentPaid }),
            });
            await loadAll();
        } catch (error) {
            console.error(error);
        } finally {
            setUpdatingCommission(null);
        }
    }

    async function handleDelete() {
        if (!reseller) return;
        if (
            !confirm(
                `¿Eliminar a ${reseller.name}? Los pedidos van a quedar sin revendedora asignada.`
            )
        )
            return;

        try {
            await fetch(`/api/resellers/${resellerId}`, { method: "DELETE" });
            router.push("/admin/revendedoras");
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

    if (!reseller) {
        return (
            <div className="text-center py-16">
                <p className="text-text-secondary">Revendedora no encontrada</p>
                <Link
                    href="/admin/revendedoras"
                    className="inline-block mt-4 text-accent-pink hover:underline text-sm"
                >
                    Volver a revendedoras
                </Link>
            </div>
        );
    }

    function getInitials(name: string) {
        return name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/revendedoras"
                    className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 text-text-primary" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-text-primary">
                        {reseller.name}
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Revendedora desde{" "}
                        {new Date(reseller.createdAt).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                        })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={`/admin/revendedoras/${resellerId}/editar`}
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

            {/* Ficha */}
            <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6">
                <div className="flex items-start gap-5">
                    <div className="w-16 h-16 rounded-full bg-gradient-main flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                        {getInitials(reseller.name)}
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reseller.phone && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-3.5 h-3.5 text-text-secondary" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                                        Teléfono
                                    </p>
                                    <p className="text-sm font-medium text-text-primary">
                                        {reseller.phone}
                                    </p>
                                </div>
                            </div>
                        )}

                        {reseller.email && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-3.5 h-3.5 text-text-secondary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                                        Email
                                    </p>
                                    <p className="text-sm font-medium text-text-primary truncate">
                                        {reseller.email}
                                    </p>
                                </div>
                            </div>
                        )}

                        {reseller.dni && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                                    <IdCard className="w-3.5 h-3.5 text-text-secondary" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                                        DNI
                                    </p>
                                    <p className="text-sm font-medium text-text-primary">
                                        {reseller.dni}
                                    </p>
                                </div>
                            </div>
                        )}

                        {reseller.address && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-3.5 h-3.5 text-text-secondary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                                        Dirección
                                    </p>
                                    <p className="text-sm font-medium text-text-primary">
                                        {reseller.address}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent-pink/10 flex items-center justify-center flex-shrink-0">
                                <DollarSign className="w-3.5 h-3.5 text-accent-pink" />
                            </div>
                            <div>
                                <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                                    Comisión por defecto
                                </p>
                                <p className="text-sm font-bold text-accent-pink">
                                    {Number(reseller.default_commission_percent).toFixed(2)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {reseller.notes && (
                    <div className="mt-5 pt-5 border-t border-gray-100">
                        <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1">
                            Notas
                        </p>
                        <p className="text-sm text-text-primary whitespace-pre-wrap">
                            {reseller.notes}
                        </p>
                    </div>
                )}
            </div>

            {/* KPIs */}
            {stats && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <KPICard
                            icon={<ShoppingCart className="w-4 h-4" />}
                            label="Pedidos"
                            value={String(stats.totals.total_orders)}
                            color="blue"
                        />
                        <KPICard
                            icon={<TrendingUp className="w-4 h-4" />}
                            label="Total vendido"
                            value={formatCurrency(stats.totals.total_sold)}
                            color="pink"
                        />
                        <KPICard
                            icon={<AlertCircle className="w-4 h-4" />}
                            label="Pendiente de cobro"
                            value={formatCurrency(stats.totals.pending_payment)}
                            color="orange"
                        />
                        <KPICard
                            icon={<Users className="w-4 h-4" />}
                            label="Clientes únicos"
                            value={String(stats.totals.unique_clients)}
                            color="green"
                        />
                    </div>

                    {/* Comisiones */}
                    <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6">
                        <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-accent-pink" />
                            Comisiones
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-soft rounded-2xl p-4">
                                <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                                    Total comisiones
                                </p>
                                <p className="text-2xl font-bold text-accent-pink mt-1">
                                    {formatCurrency(stats.totals.total_commission)}
                                </p>
                            </div>
                            <div className="bg-orange-50 rounded-2xl p-4">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Clock className="w-3 h-3 text-orange-600" />
                                    <p className="text-[10px] text-orange-700 uppercase tracking-wide">
                                        Pendiente de pago
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-orange-600 mt-1">
                                    {formatCurrency(stats.totals.pending_commission)}
                                </p>
                            </div>
                            <div className="bg-green-50 rounded-2xl p-4">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                                    <p className="text-[10px] text-green-700 uppercase tracking-wide">
                                        Comisiones pagadas
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                    {formatCurrency(stats.totals.paid_commission)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Top productos y clientes */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6">
                            <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-accent-pink" />
                                Top productos vendidos
                            </h2>
                            {stats.topProducts.length === 0 ? (
                                <p className="text-xs text-text-secondary py-4 text-center">
                                    Sin ventas todavía
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {stats.topProducts.map((p, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-accent-pink/10 flex items-center justify-center text-[10px] font-bold text-accent-pink flex-shrink-0">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-text-primary truncate">
                                                    {p.product_name}
                                                </p>
                                                <p className="text-xs text-text-secondary">
                                                    {p.total_qty} unidades
                                                </p>
                                            </div>
                                            <p className="text-xs font-semibold text-accent-pink whitespace-nowrap">
                                                {formatCurrency(p.total_revenue)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6">
                            <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                                <Users className="w-4 h-4 text-accent-purple" />
                                Top clientes
                            </h2>
                            {stats.topClients.length === 0 ? (
                                <p className="text-xs text-text-secondary py-4 text-center">
                                    Sin clientes todavía
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {stats.topClients.map((c, i) => (
                                        <Link
                                            key={c.id_client}
                                            href={`/admin/clientes/${c.id_client}`}
                                            className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-accent-purple/10 flex items-center justify-center text-[10px] font-bold text-accent-purple flex-shrink-0">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-text-primary truncate">
                                                    {c.name}
                                                </p>
                                                <p className="text-xs text-text-secondary">
                                                    {c.order_count} pedido{c.order_count !== 1 ? "s" : ""}
                                                </p>
                                            </div>
                                            <p className="text-xs font-semibold text-accent-purple whitespace-nowrap">
                                                {formatCurrency(c.total_spent)}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Pedidos */}
            <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 overflow-hidden">
                <div className="p-6 pb-3">
                    <h2 className="text-base font-semibold text-text-primary">
                        Pedidos
                    </h2>
                    <p className="text-xs text-text-secondary mt-1">
                        {orders.length} pedido{orders.length !== 1 ? "s" : ""} en total
                    </p>
                </div>

                {orders.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary text-sm">
                        Esta revendedora todavía no tiene pedidos
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead>
                                <tr className="text-left text-xs text-text-secondary border-y border-gray-100 bg-gray-50/50">
                                    <th className="px-4 py-3 font-medium">#</th>
                                    <th className="px-4 py-3 font-medium">Fecha</th>
                                    <th className="px-4 py-3 font-medium">Cliente</th>
                                    <th className="px-4 py-3 font-medium text-right">Total</th>
                                    <th className="px-4 py-3 font-medium text-right">Comisión</th>
                                    <th className="px-4 py-3 font-medium">Estado</th>
                                    <th className="px-4 py-3 font-medium text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => {
                                    const isPaid = !!order.paid_at;
                                    const isDelivered = !!order.delivered_at;
                                    const commissionPaid = order.commission_paid === 1;
                                    const isUpdating = updatingCommission === order.id_order;

                                    return (
                                        <tr
                                            key={order.id_order}
                                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                                        >
                                            <td className="px-4 py-3 text-sm font-medium text-text-primary">
                                                #{order.id_order}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
                                                {new Date(order.createdAt).toLocaleDateString("es-AR", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "2-digit",
                                                })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-text-primary">
                                                    {order.client_name}
                                                </p>
                                                <p className="text-xs text-text-secondary">
                                                    {order.client_phone}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-text-primary text-right whitespace-nowrap">
                                                {formatCurrency(order.total)}
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <p className="text-sm font-bold text-accent-pink">
                                                    {formatCurrency(order.commission_amount)}
                                                </p>
                                                <p className="text-[10px] text-text-secondary">
                                                    ({Number(order.commission_percent).toFixed(0)}%)
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    {isPaid ? (
                                                        <span className="text-[10px] font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                            ✓ Pagado
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                            Pendiente
                                                        </span>
                                                    )}
                                                    {isDelivered && (
                                                        <span className="text-[10px] font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                            ✓ Entregado
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() =>
                                                        toggleCommissionPaid(
                                                            order.id_order,
                                                            commissionPaid
                                                        )
                                                    }
                                                    disabled={isUpdating}
                                                    className={`text-[10px] font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 whitespace-nowrap ${commissionPaid
                                                            ? "bg-gray-100 text-text-secondary hover:bg-gray-200"
                                                            : "bg-green-500 text-white hover:bg-green-600"
                                                        }`}
                                                >
                                                    {isUpdating
                                                        ? "..."
                                                        : commissionPaid
                                                            ? "Marcar pendiente"
                                                            : "Marcar pagada"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function KPICard({
    icon,
    label,
    value,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: "pink" | "blue" | "purple" | "green" | "orange";
}) {
    const colors = {
        pink: "text-accent-pink bg-accent-pink/10",
        blue: "text-blue-500 bg-blue-50",
        purple: "text-accent-purple bg-accent-purple/10",
        green: "text-green-600 bg-green-50",
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
        </div>
    );
}