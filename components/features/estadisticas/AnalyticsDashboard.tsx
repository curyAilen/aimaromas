"use client";

import { useEffect, useState } from "react";
import {
    TrendingUp,
    ShoppingCart,
    DollarSign,
    Users,
    AlertCircle,
} from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/whatsapp";
import { Card } from "@/components/ui/Card";
import { ExportButton } from "./ExportButton";

interface AnalyticsData {
    range: { from: string; to: string };
    kpis: {
        total_orders: number;
        total_revenue: number;
        avg_ticket: number;
        unique_clients: number;
        new_clients: number;
        pending_count: number;
        pending_total: number;
    };
    salesByDay: Array<{ date: string; orders: number; revenue: number }>;
    salesByMonth: Array<{
        month: number;
        monthName: string;
        year: number;
        orders: number;
        revenue: number;
    }>;
    topProductsMonth: Array<{
        product_name: string;
        total_qty: number;
        total_revenue: number;
    }>;
    topProductsYear: Array<{
        product_name: string;
        total_qty: number;
        total_revenue: number;
    }>;
    topClients: Array<{
        id_client: number;
        name: string;
        phone: string;
        email: string | null;
        order_count: number;
        total_spent: number;
    }>;
    pendingOrders: Array<{
        id_order: number;
        total: number;
        createdAt: string;
        delivered_at: string | null;
        client_name: string;
        client_phone: string;
    }>;
    staleProducts: Array<{
        id_product: number;
        name: string;
        size_name: string | null;
        price: string;
        stock_status: string;
        category_name: string;
        last_sale: string | null;
    }>;
}

type SalesView = "day" | "month";
type TopView = "month" | "year";

export function AnalyticsDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [salesView, setSalesView] = useState<SalesView>("day");
    const [topView, setTopView] = useState<TopView>("month");

    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [from, setFrom] = useState(firstOfMonth.toISOString().slice(0, 10));
    const [to, setTo] = useState(today.toISOString().slice(0, 10));

    async function load() {
        setLoading(true);
        try {
            const res = await fetch(`/api/analytics?from=${from}&to=${to}`);
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [from, to]);

    if (loading && !data) {
        return (
            <div className="text-center py-16 text-text-secondary text-sm">
                Cargando estadísticas...
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-16 text-text-secondary text-sm">
                No se pudieron cargar las estadísticas
            </div>
        );
    }

    const {
        kpis,
        salesByDay,
        salesByMonth,
        topProductsMonth,
        topProductsYear,
        topClients,
        pendingOrders,
        staleProducts,
    } = data;

    // Datos del gráfico de ventas
    const chartSalesData =
        salesView === "day"
            ? salesByDay.map((d) => ({
                date: new Date(d.date).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                }),
                Ingresos: Number(d.revenue),
                Pedidos: Number(d.orders),
            }))
            : salesByMonth.map((m) => ({
                date: m.monthName,
                Ingresos: m.revenue,
                Pedidos: m.orders,
            }));

    // Datos del gráfico de top productos
    const currentTopProducts =
        topView === "month" ? topProductsMonth : topProductsYear;

    const chartProductsData = currentTopProducts.map((p) => ({
        name:
            p.product_name.length > 18
                ? p.product_name.slice(0, 18) + "..."
                : p.product_name,
        Vendidos: Number(p.total_qty),
        Ingresos: Number(p.total_revenue),
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Estadísticas</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Análisis de ventas, clientes y productos
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-100 p-2">
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-transparent outline-none text-text-primary"
                    />
                    <span className="text-text-secondary text-xs">hasta</span>
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-transparent outline-none text-text-primary"
                    />
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KPICard
                    icon={<DollarSign className="w-4 h-4" />}
                    label="Facturación"
                    value={formatCurrency(kpis.total_revenue)}
                    color="pink"
                />
                <KPICard
                    icon={<ShoppingCart className="w-4 h-4" />}
                    label="Pedidos"
                    value={String(kpis.total_orders)}
                    color="blue"
                />
                <KPICard
                    icon={<TrendingUp className="w-4 h-4" />}
                    label="Ticket promedio"
                    value={formatCurrency(kpis.avg_ticket)}
                    color="purple"
                />
                <KPICard
                    icon={<Users className="w-4 h-4" />}
                    label="Clientes únicos"
                    value={String(kpis.unique_clients)}
                    color="green"
                />
                <KPICard
                    icon={<Users className="w-4 h-4" />}
                    label="Clientes nuevos"
                    value={String(kpis.new_clients)}
                    color="orange"
                />
                <KPICard
                    icon={<AlertCircle className="w-4 h-4" />}
                    label="Pendiente de cobro"
                    value={formatCurrency(kpis.pending_total)}
                    subtitle={`${kpis.pending_count} pedido${kpis.pending_count !== 1 ? "s" : ""}`}
                    color="red"
                />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ventas por día / mes */}
                <Card title="Ventas">
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setSalesView("day")}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${salesView === "day"
                                    ? "bg-gradient-main text-white shadow-md shadow-accent-pink/20"
                                    : "bg-gray-100 text-text-secondary hover:bg-gray-200"
                                }`}
                        >
                            Por día
                        </button>
                        <button
                            onClick={() => setSalesView("month")}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${salesView === "month"
                                    ? "bg-gradient-main text-white shadow-md shadow-accent-pink/20"
                                    : "bg-gray-100 text-text-secondary hover:bg-gray-200"
                                }`}
                        >
                            Por mes
                        </button>
                    </div>

                    {chartSalesData.length === 0 ? (
                        <div className="py-16 text-center text-text-secondary text-sm">
                            Sin ventas en este período
                        </div>
                    ) : (
                        <div className="h-64 -ml-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartSalesData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F5" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 10, fill: "#8A8A8A" }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: "#8A8A8A" }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 12,
                                            border: "1px solid #F0F0F5",
                                            fontSize: 12,
                                        }}
                                        formatter={(value: number) => formatCurrency(value)}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Ingresos"
                                        stroke="#FF4D8D"
                                        strokeWidth={2.5}
                                        dot={{ fill: "#FF4D8D", r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>

                {/* Top 5 productos mes / año */}
                <Card title="Top 5 productos más vendidos">
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setTopView("month")}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${topView === "month"
                                    ? "bg-gradient-main text-white shadow-md shadow-accent-pink/20"
                                    : "bg-gray-100 text-text-secondary hover:bg-gray-200"
                                }`}
                        >
                            Del mes
                        </button>
                        <button
                            onClick={() => setTopView("year")}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${topView === "year"
                                    ? "bg-gradient-main text-white shadow-md shadow-accent-pink/20"
                                    : "bg-gray-100 text-text-secondary hover:bg-gray-200"
                                }`}
                        >
                            Del año
                        </button>
                    </div>

                    {chartProductsData.length === 0 ? (
                        <div className="py-16 text-center text-text-secondary text-sm">
                            Sin ventas en este período
                        </div>
                    ) : (
                        <div className="h-64 -ml-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartProductsData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F5" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 10, fill: "#8A8A8A" }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={{ fontSize: 10, fill: "#8A8A8A" }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={100}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 12,
                                            border: "1px solid #F0F0F5",
                                            fontSize: 12,
                                        }}
                                    />
                                    <Bar
                                        dataKey="Vendidos"
                                        fill="url(#gradientBar)"
                                        radius={[0, 8, 8, 0]}
                                        barSize={20}
                                    />
                                    <defs>
                                        <linearGradient id="gradientBar" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#FF4D8D" />
                                            <stop offset="100%" stopColor="#A855F7" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>
            </div>

            {/* Resto igual */}
            <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 overflow-hidden">
                <div className="p-6 pb-3 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-text-primary">
                        Top 10 clientes
                    </h2>
                    <ExportButton
                        data={topClients}
                        filename={`top-clientes-${from}-${to}`}
                        columns={[
                            { key: "name", label: "Nombre" },
                            { key: "phone", label: "Teléfono" },
                            { key: "email", label: "Email" },
                            { key: "order_count", label: "Pedidos" },
                            { key: "total_spent", label: "Total gastado" },
                        ]}
                    />
                </div>
                {topClients.length === 0 ? (
                    <div className="p-6 text-center text-text-secondary text-sm">
                        Sin datos
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-text-secondary border-y border-gray-100">
                                <th className="px-6 py-3 font-medium">#</th>
                                <th className="px-6 py-3 font-medium">Cliente</th>
                                <th className="px-6 py-3 font-medium">Teléfono</th>
                                <th className="px-6 py-3 font-medium text-right">Pedidos</th>
                                <th className="px-6 py-3 font-medium text-right">Total gastado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topClients.map((client, i) => (
                                <tr
                                    key={client.id_client}
                                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                                >
                                    <td className="px-6 py-3 text-sm text-text-secondary">{i + 1}</td>
                                    <td className="px-6 py-3 text-sm font-medium text-text-primary">
                                        {client.name}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-text-secondary">
                                        {client.phone}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-text-primary text-right">
                                        {client.order_count}
                                    </td>
                                    <td className="px-6 py-3 text-sm font-semibold text-accent-pink text-right">
                                        {formatCurrency(client.total_spent)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 overflow-hidden">
                <div className="p-6 pb-3 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-text-primary">
                            Pedidos pendientes de pago
                        </h2>
                        <p className="text-xs text-text-secondary mt-1">
                            {pendingOrders.length} pedido{pendingOrders.length !== 1 ? "s" : ""} sin cobrar
                        </p>
                    </div>
                    <ExportButton
                        data={pendingOrders}
                        filename={`pendientes-pago-${new Date().toISOString().slice(0, 10)}`}
                        columns={[
                            { key: "id_order", label: "Pedido #" },
                            { key: "client_name", label: "Cliente" },
                            { key: "client_phone", label: "Teléfono" },
                            { key: "total", label: "Total" },
                            { key: "createdAt", label: "Creado" },
                            { key: "delivered_at", label: "Entregado" },
                        ]}
                    />
                </div>
                {pendingOrders.length === 0 ? (
                    <div className="p-6 text-center text-text-secondary text-sm">
                        🎉 ¡No hay pedidos pendientes de pago!
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-text-secondary border-y border-gray-100">
                                <th className="px-6 py-3 font-medium">#</th>
                                <th className="px-6 py-3 font-medium">Cliente</th>
                                <th className="px-6 py-3 font-medium">Fecha</th>
                                <th className="px-6 py-3 font-medium">Entrega</th>
                                <th className="px-6 py-3 font-medium text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingOrders.map((order) => (
                                <tr
                                    key={order.id_order}
                                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                                >
                                    <td className="px-6 py-3 text-sm font-medium text-text-primary">
                                        #{order.id_order}
                                    </td>
                                    <td className="px-6 py-3">
                                        <p className="text-sm font-medium text-text-primary">
                                            {order.client_name}
                                        </p>
                                        <p className="text-xs text-text-secondary">
                                            {order.client_phone}
                                        </p>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-text-secondary">
                                        {new Date(order.createdAt).toLocaleDateString("es-AR")}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-text-secondary">
                                        {order.delivered_at
                                            ? new Date(order.delivered_at).toLocaleDateString("es-AR")
                                            : "—"}
                                    </td>
                                    <td className="px-6 py-3 text-sm font-semibold text-accent-pink text-right">
                                        {formatCurrency(order.total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 overflow-hidden">
                <div className="p-6 pb-3 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-text-primary">
                            Productos sin ventas en 60 días
                        </h2>
                    </div>
                    <ExportButton
                        data={staleProducts}
                        filename={`productos-sin-ventas`}
                        columns={[
                            { key: "id_product", label: "ID" },
                            { key: "name", label: "Producto" },
                            { key: "category_name", label: "Categoría" },
                            { key: "size_name", label: "Tamaño" },
                            { key: "price", label: "Precio" },
                            { key: "last_sale", label: "Última venta" },
                        ]}
                    />
                </div>
                {staleProducts.length === 0 ? (
                    <div className="p-6 text-center text-text-secondary text-sm">
                        🎉 ¡Todos los productos tienen ventas recientes!
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-text-secondary border-y border-gray-100">
                                <th className="px-6 py-3 font-medium">Producto</th>
                                <th className="px-6 py-3 font-medium">Categoría</th>
                                <th className="px-6 py-3 font-medium">Última venta</th>
                                <th className="px-6 py-3 font-medium text-right">Precio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staleProducts.map((p) => (
                                <tr
                                    key={p.id_product}
                                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                                >
                                    <td className="px-6 py-3">
                                        <p className="text-sm font-medium text-text-primary">
                                            {p.name}
                                        </p>
                                        {p.size_name && (
                                            <p className="text-xs text-text-secondary">
                                                {p.size_name}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-text-secondary">
                                        {p.category_name}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-text-secondary">
                                        {p.last_sale
                                            ? new Date(p.last_sale).toLocaleDateString("es-AR")
                                            : "Nunca"}
                                    </td>
                                    <td className="px-6 py-3 text-sm font-semibold text-text-primary text-right">
                                        {formatCurrency(p.price)}
                                    </td>
                                </tr>
                            ))}
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
    color: "pink" | "blue" | "purple" | "green" | "orange" | "red";
}) {
    const colors = {
        pink: "text-accent-pink bg-accent-pink/10",
        blue: "text-blue-500 bg-blue-50",
        purple: "text-accent-purple bg-accent-purple/10",
        green: "text-green-600 bg-green-50",
        orange: "text-orange-500 bg-orange-50",
        red: "text-red-500 bg-red-50",
    };

    return (
        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100/50">
            <div className={`w-8 h-8 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
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