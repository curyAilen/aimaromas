"use client";

import { useEffect, useState } from "react";
import {
    TrendingUp,
    ShoppingCart,
    AlertCircle,
    Trophy,
    Sparkles,
    Droplet,
    BarChart3,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { formatCurrency } from "@/lib/whatsapp";

interface TopProduct {
    product_name: string;
    total_qty: number;
    total_revenue: string;
}

interface OverviewData {
    ventasMes: {
        aromas: number;
        relax: number;
        aromasUnits: number;
        relaxUnits: number;
    };
    ventasAnio: {
        aromas: number;
        relax: number;
    };
    pedidos: {
        aromas: { count: number; total: number };
        relax: { count: number; total: number };
        mixed: { count: number; total: number };
    };
    pendientes: {
        aromas: { count: number; total: number };
        relax: { count: number; total: number };
    };
    topProductos: {
        aromas: TopProduct[];
        relax: TopProduct[];
    };
    salesByMonth: Array<{
        monthName: string;
        Aromas: number;
        Relax: number;
    }>;
}

export function OverviewView() {
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/overview");
                const json = await res.json();
                if (res.ok) setData(json);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading || !data) {
        return (
            <div className="text-center py-16 text-text-secondary text-sm">
                Cargando overview...
            </div>
        );
    }

    const totalMes = data.ventasMes.aromas + data.ventasMes.relax;
    const totalAnio = data.ventasAnio.aromas + data.ventasAnio.relax;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Overview</h1>
                <p className="text-sm text-text-secondary mt-1">
                    Vista combinada de Aromas + Relax
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-soft rounded-3xl p-6 shadow-card">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-accent-pink" />
                        <h2 className="text-sm font-semibold text-text-primary">
                            Ventas del mes
                        </h2>
                    </div>
                    <p className="text-4xl font-bold text-text-primary">
                        {formatCurrency(totalMes)}
                    </p>
                    <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-white/60">
                        <div>
                            <p className="text-[10px] text-text-secondary uppercase tracking-wide flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Aromas
                            </p>
                            <p className="text-lg font-bold text-accent-pink mt-1">
                                {formatCurrency(data.ventasMes.aromas)}
                            </p>
                            <p className="text-[10px] text-text-secondary">
                                {data.ventasMes.aromasUnits} unidades
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-text-secondary uppercase tracking-wide flex items-center gap-1">
                                <Droplet className="w-3 h-3" /> Relax
                            </p>
                            <p className="text-lg font-bold text-accent-purple mt-1">
                                {formatCurrency(data.ventasMes.relax)}
                            </p>
                            <p className="text-[10px] text-text-secondary">
                                {data.ventasMes.relaxUnits} unidades
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100/50">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-4 h-4 text-accent-purple" />
                        <h2 className="text-sm font-semibold text-text-primary">
                            Ventas del año
                        </h2>
                    </div>
                    <p className="text-4xl font-bold text-text-primary">
                        {formatCurrency(totalAnio)}
                    </p>
                    <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-gray-100">
                        <div>
                            <p className="text-[10px] text-text-secondary uppercase tracking-wide flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Aromas
                            </p>
                            <p className="text-lg font-bold text-accent-pink mt-1">
                                {formatCurrency(data.ventasAnio.aromas)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-text-secondary uppercase tracking-wide flex items-center gap-1">
                                <Droplet className="w-3 h-3" /> Relax
                            </p>
                            <p className="text-lg font-bold text-accent-purple mt-1">
                                {formatCurrency(data.ventasAnio.relax)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100/50">
                    <div className="flex items-center gap-2 mb-4">
                        <ShoppingCart className="w-4 h-4 text-blue-500" />
                        <h2 className="text-sm font-semibold text-text-primary">
                            Pedidos del mes
                        </h2>
                    </div>
                    <p className="text-4xl font-bold text-text-primary">
                        {data.pedidos.aromas.count + data.pedidos.relax.count}
                    </p>
                    <div className="space-y-2 mt-5 pt-5 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 text-text-secondary">
                                <Sparkles className="w-3 h-3" /> Aromas
                            </span>
                            <span className="font-semibold text-text-primary">
                                {data.pedidos.aromas.count}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 text-text-secondary">
                                <Droplet className="w-3 h-3" /> Relax
                            </span>
                            <span className="font-semibold text-text-primary">
                                {data.pedidos.relax.count}
                            </span>
                        </div>
                        {data.pedidos.mixed.count > 0 && (
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-text-secondary">Mixtos</span>
                                <span className="font-semibold text-text-primary">
                                    {data.pedidos.mixed.count}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100/50">
                <h2 className="text-sm font-semibold text-text-primary mb-4">
                    Ventas del año por área
                </h2>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.salesByMonth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F5" vertical={false} />
                            <XAxis
                                dataKey="monthName"
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
                            <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                            <Bar dataKey="Aromas" fill="#FF4D8D" radius={[8, 8, 0, 0]} barSize={20} />
                            <Bar dataKey="Relax" fill="#A855F7" radius={[8, 8, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100/50">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <h2 className="text-sm font-semibold text-text-primary">
                            Pendiente de cobro
                        </h2>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-orange-50 rounded-2xl p-4">
                            <p className="text-[10px] text-orange-700 uppercase tracking-wide flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Aromas
                            </p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">
                                {formatCurrency(data.pendientes.aromas.total)}
                            </p>
                            <p className="text-[10px] text-orange-700">
                                {data.pendientes.aromas.count} pedido
                                {data.pendientes.aromas.count !== 1 ? "s" : ""}
                            </p>
                        </div>
                        <div className="bg-purple-50 rounded-2xl p-4">
                            <p className="text-[10px] text-purple-700 uppercase tracking-wide flex items-center gap-1">
                                <Droplet className="w-3 h-3" /> Relax
                            </p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">
                                {formatCurrency(data.pendientes.relax.total)}
                            </p>
                            <p className="text-[10px] text-purple-700">
                                {data.pendientes.relax.count} pedido
                                {data.pendientes.relax.count !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100/50">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy className="w-4 h-4 text-accent-pink" />
                        <h2 className="text-sm font-semibold text-text-primary">
                            Top Aromas (mes)
                        </h2>
                    </div>
                    {data.topProductos.aromas.length === 0 ? (
                        <p className="text-xs text-text-secondary py-4 text-center">
                            Sin ventas este mes
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {data.topProductos.aromas.map((p, i) => (
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

                <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100/50">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy className="w-4 h-4 text-accent-purple" />
                        <h2 className="text-sm font-semibold text-text-primary">
                            Top Relax (mes)
                        </h2>
                    </div>
                    {data.topProductos.relax.length === 0 ? (
                        <p className="text-xs text-text-secondary py-4 text-center">
                            Sin ventas este mes
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {data.topProductos.relax.map((p, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-accent-purple/10 flex items-center justify-center text-[10px] font-bold text-accent-purple flex-shrink-0">
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
                                    <p className="text-xs font-semibold text-accent-purple whitespace-nowrap">
                                        {formatCurrency(p.total_revenue)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}