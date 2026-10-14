"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    TrendingUp,
    AlertCircle,
    Cake,
    Calendar,
    Trophy,
    ArrowUpRight,
    Wallet,
    Crown,
    Sparkles,
    Droplet,
    BarChart3,
    ShoppingCart,
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

type TagFilter = "all" | "aromas" | "relax";

interface TopProduct {
    product_name: string;
    variant_scent: string | null;
    total_qty: number;
}

interface Comprador {
    id_client: number;
    name: string;
    order_count: number;
    total_spent: string;
}

interface PendingOrder {
    id_order: number;
    tag: string;
    total: string;
    createdAt: string;
    client_name: string;
    client_phone: string;
    reseller_name: string | null;
}

interface DashboardData {
    tag: string;
    ventas: {
        aromas: number;
        relax: number;
        total: number;
        orders_count: number;
        clientes: number;
    };
    pendientes: {
        count: number;
        total: number;
        orders: PendingOrder[];
    };
    compradorMes: Comprador | null;
    compradorAnio: Comprador | null;
    birthdays: Array<{
        id_client: number;
        name: string;
        birthday: string;
        days_until: number;
        next_birthday: string;
    }>;
    topAromas: {
        mes: TopProduct | null;
        anio: TopProduct | null;
    };
    topRelax: {
        mes: TopProduct | null;
        anio: TopProduct | null;
    };
    salesByMonth: Array<{
        monthName: string;
        Aromas: number;
        Relax: number;
    }>;
}

const STORAGE_KEY = "aima_dashboard_tag";

export function DashboardView() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    // Cargar tag desde localStorage
    const [tag, setTag] = useState<TagFilter>(() => {
        if (typeof window === "undefined") return "all";
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "aromas" || stored === "relax") return stored;
        return "all";
    });

    // Persistir tag
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, tag);
    }, [tag]);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const res = await fetch(`/api/dashboard?tag=${tag}`);
                const json = await res.json();
                if (res.ok) setData(json);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [tag]);

    if (loading || !data) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="bg-white rounded-3xl p-6 h-48 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    const {
        ventas,
        pendientes,
        compradorMes,
        compradorAnio,
        birthdays,
        topAromas,
        topRelax,
        salesByMonth,
    } = data;

    const tagLabels: Record<TagFilter, string> = {
        all: "Todos",
        aromas: "🕯️ Aromas",
        relax: "🧼 Relax",
    };

    return (
        <div className="space-y-6">
            {/* Header + Selector de Tag */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Resumen general de la operación
                    </p>
                </div>

                {/* Selector de tag */}
                <div className="flex items-center gap-2 bg-white rounded-full border border-gray-100 p-1">
                    {(Object.keys(tagLabels) as TagFilter[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTag(t)}
                            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${tag === t
                                    ? "bg-gradient-main text-white shadow-md shadow-accent-pink/20"
                                    : "text-text-secondary hover:bg-gray-50"
                                }`}
                        >
                            {tagLabels[t]}
                        </button>
                    ))}
                </div>
            </div>

            {/* FILA 1: Ventas + Pedidos Pendientes + Comprador N°1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CARD 1: Ventas Mensuales */}
                <div className="bg-gradient-soft rounded-3xl p-6 shadow-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-accent-pink" />
                            </div>
                            <h2 className="text-sm font-semibold text-text-primary">
                                Ventas Mensuales
                            </h2>
                        </div>
                        <span className="text-[10px] text-text-secondary uppercase tracking-wide">
                            Mes actual
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-white/70 rounded-2xl p-3">
                            <p className="text-[10px] text-text-secondary uppercase tracking-wide flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Aromas
                            </p>
                            <p className="text-xl font-bold text-accent-pink mt-1 truncate">
                                {formatCurrency(ventas.aromas)}
                            </p>
                        </div>
                        <div className="bg-white/70 rounded-2xl p-3">
                            <p className="text-[10px] text-text-secondary uppercase tracking-wide flex items-center gap-1">
                                <Droplet className="w-3 h-3" /> Relax
                            </p>
                            <p className="text-xl font-bold text-accent-purple mt-1 truncate">
                                {formatCurrency(ventas.relax)}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/70 rounded-2xl p-4 mb-3">
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                                    Total facturado
                                </p>
                                <p className="text-2xl font-bold text-text-primary mt-1">
                                    {formatCurrency(ventas.total)}
                                </p>
                            </div>
                            <span className="text-[10px] text-text-secondary">
                                {ventas.orders_count} pedido{ventas.orders_count !== 1 ? "s" : ""}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-text-secondary pt-2 border-t border-white/60">
                        <TrendingUp className="w-3 h-3" />
                        <span>
                            <b className="text-text-primary">{ventas.clientes}</b> cliente
                            {ventas.clientes !== 1 ? "s" : ""} registraron pedidos
                        </span>
                    </div>
                </div>

                {/* CARD 2: Pedidos Pendientes */}
                <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100/50 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                            </div>
                            <h2 className="text-sm font-semibold text-text-primary">
                                Pedidos Pendientes
                            </h2>
                        </div>
                        <Link
                            href="/admin/pedidos"
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                            <ArrowUpRight className="w-3.5 h-3.5 text-text-secondary" />
                        </Link>
                    </div>

                    <div className="flex items-baseline gap-2 mb-3">
                        <p className="text-4xl font-bold text-orange-500">
                            {pendientes.count}
                        </p>
                        <p className="text-xs text-text-secondary">sin pagar</p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 mb-3">
                        <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1">
                            Total a cobrar
                        </p>
                        <p className="text-2xl font-bold text-text-primary">
                            {formatCurrency(pendientes.total)}
                        </p>
                    </div>

                    {/* Lista de pendientes */}
                    {pendientes.orders.length > 0 && (
                        <div className="pt-3 border-t border-gray-100 space-y-2 max-h-48 overflow-y-auto">
                            <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                                Detalle
                            </p>
                            {pendientes.orders.slice(0, 5).map((o) => (
                                <Link
                                    key={o.id_order}
                                    href={`/admin/pedidos/${o.id_order}`}
                                    className="flex items-start justify-between gap-2 py-1.5 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-text-primary truncate">
                                            #{o.id_order} — {o.client_name}
                                        </p>
                                        <p className="text-[10px] text-text-secondary truncate">
                                            {o.tag === "aromas"
                                                ? "🕯️ Aromas"
                                                : o.tag === "relax"
                                                    ? "🧼 Relax"
                                                    : "🔀 Mixto"}
                                            {o.reseller_name && ` • ${o.reseller_name}`}
                                        </p>
                                    </div>
                                    <p className="text-xs font-semibold text-orange-600 whitespace-nowrap">
                                        {formatCurrency(o.total)}
                                    </p>
                                </Link>
                            ))}
                            {pendientes.orders.length > 5 && (
                                <Link
                                    href="/admin/pedidos"
                                    className="block text-center text-[10px] text-accent-pink hover:underline"
                                >
                                    Ver todos ({pendientes.orders.length})
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* CARD 3: Comprador N°1 */}
                <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100/50 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                            <Crown className="w-4 h-4 text-yellow-600" />
                        </div>
                        <h2 className="text-sm font-semibold text-text-primary">
                            Comprador N°1
                        </h2>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div>
                            <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1">
                                🏆 Del mes
                            </p>
                            {compradorMes ? (
                                <Link
                                    href={`/admin/clientes/${compradorMes.id_client}`}
                                    className="block hover:opacity-80 transition-opacity"
                                >
                                    <p className="text-sm font-bold text-text-primary">
                                        {compradorMes.name}
                                    </p>
                                    <p className="text-xs text-text-secondary mt-0.5">
                                        {compradorMes.order_count} pedido
                                        {compradorMes.order_count !== 1 ? "s" : ""}
                                    </p>
                                    <p className="text-lg font-bold text-accent-pink mt-1">
                                        {formatCurrency(compradorMes.total_spent)}
                                    </p>
                                </Link>
                            ) : (
                                <p className="text-xs text-text-secondary">Sin datos</p>
                            )}
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1">
                                📅 Del año
                            </p>
                            {compradorAnio ? (
                                <Link
                                    href={`/admin/clientes/${compradorAnio.id_client}`}
                                    className="block hover:opacity-80 transition-opacity"
                                >
                                    <p className="text-sm font-bold text-text-primary">
                                        {compradorAnio.name}
                                    </p>
                                    <p className="text-xs text-text-secondary mt-0.5">
                                        {compradorAnio.order_count} pedido
                                        {compradorAnio.order_count !== 1 ? "s" : ""}
                                    </p>
                                    <p className="text-lg font-bold text-accent-pink mt-1">
                                        {formatCurrency(compradorAnio.total_spent)}
                                    </p>
                                </Link>
                            ) : (
                                <p className="text-xs text-text-secondary">Sin datos</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* FILA 2: Top Productos (Aromas + Relax) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopProductCard
                    title="Top Aromas"
                    emoji="🕯️"
                    mes={topAromas.mes}
                    anio={topAromas.anio}
                    color="pink"
                />
                <TopProductCard
                    title="Top Relax"
                    emoji="🧼"
                    mes={topRelax.mes}
                    anio={topRelax.anio}
                    color="purple"
                />
            </div>

            {/* FILA 3: Gráfico Ventas por Mes */}
            <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100/50">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-accent-purple" />
                    <h2 className="text-sm font-semibold text-text-primary">
                        Ventas del año por área
                    </h2>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesByMonth}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#F0F0F5"
                                vertical={false}
                            />
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
                            <Bar
                                dataKey="Aromas"
                                fill="#FF4D8D"
                                radius={[8, 8, 0, 0]}
                                barSize={20}
                            />
                            <Bar
                                dataKey="Relax"
                                fill="#A855F7"
                                radius={[8, 8, 0, 0]}
                                barSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* FILA 4: Cumpleaños + Fechas Importantes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cumpleaños */}
                <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-accent-pink/10 flex items-center justify-center">
                                <Cake className="w-4 h-4 text-accent-pink" />
                            </div>
                            <h2 className="text-sm font-semibold text-text-primary">
                                Próximos Cumpleaños
                            </h2>
                        </div>
                        <Link
                            href="/admin/cumpleanos"
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                            <ArrowUpRight className="w-3.5 h-3.5 text-text-secondary" />
                        </Link>
                    </div>

                    {birthdays.length === 0 ? (
                        <div className="py-8 text-center text-sm text-text-secondary">
                            No hay cumpleaños cargados
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {birthdays.slice(0, 4).map((b) => (
                                <Link
                                    key={b.id_client}
                                    href={`/admin/clientes/${b.id_client}`}
                                    className="flex flex-col items-center text-center p-3 rounded-2xl hover:bg-gray-50 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-full bg-gradient-main flex items-center justify-center text-white text-sm font-bold mb-2">
                                        {b.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .slice(0, 2)
                                            .join("")
                                            .toUpperCase()}
                                    </div>
                                    <p className="text-xs font-medium text-text-primary line-clamp-2 leading-tight">
                                        {b.name}
                                    </p>
                                    <p className="text-[10px] text-text-secondary mt-1">
                                        {new Date(b.next_birthday).toLocaleDateString("es-AR", {
                                            day: "2-digit",
                                            month: "short",
                                        })}
                                    </p>
                                    <span
                                        className={`text-[9px] font-medium mt-1.5 px-2 py-0.5 rounded-full ${b.days_until === 0
                                                ? "bg-accent-pink text-white"
                                                : b.days_until <= 7
                                                    ? "bg-orange-100 text-orange-700"
                                                    : "bg-gray-100 text-gray-600"
                                            }`}
                                    >
                                        {b.days_until === 0
                                            ? "HOY 🎂"
                                            : b.days_until === 1
                                                ? "Mañana"
                                                : `${b.days_until}d`}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Fechas Importantes */}
                <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100/50">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-accent-purple" />
                        </div>
                        <h2 className="text-sm font-semibold text-text-primary">
                            Fechas Importantes (CABA)
                        </h2>
                    </div>
                    <FechasImportantes />
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   TOP PRODUCT CARD (3 productos por área)
   ============================================================ */
function TopProductCard({
    title,
    emoji,
    mes,
    anio,
    color,
}: {
    title: string;
    emoji: string;
    mes: TopProduct | null;
    anio: TopProduct | null;
    color: "pink" | "purple";
}) {
    const colorClass =
        color === "pink" ? "text-accent-pink" : "text-accent-purple";

    return (
        <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100/50">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-soft flex items-center justify-center text-base">
                    {emoji}
                </div>
                <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1">
                        Del mes
                    </p>
                    {mes ? (
                        <>
                            <p className="text-sm font-bold text-text-primary leading-tight">
                                {mes.product_name}
                            </p>
                            {mes.variant_scent && (
                                <p className={`text-xs ${colorClass} mt-0.5`}>
                                    {mes.variant_scent}
                                </p>
                            )}
                            <p className={`text-2xl font-bold ${colorClass} mt-2`}>
                                {mes.total_qty}
                            </p>
                            <p className="text-[10px] text-text-secondary">
                                unidades vendidas
                            </p>
                        </>
                    ) : (
                        <p className="text-xs text-text-secondary">Sin ventas</p>
                    )}
                </div>

                <div className="border-l border-gray-100 pl-4">
                    <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1">
                        Del año
                    </p>
                    {anio ? (
                        <>
                            <p className="text-sm font-bold text-text-primary leading-tight">
                                {anio.product_name}
                            </p>
                            {anio.variant_scent && (
                                <p className={`text-xs ${colorClass} mt-0.5`}>
                                    {anio.variant_scent}
                                </p>
                            )}
                            <p className={`text-2xl font-bold ${colorClass} mt-2`}>
                                {anio.total_qty}
                            </p>
                            <p className="text-[10px] text-text-secondary">
                                unidades vendidas
                            </p>
                        </>
                    ) : (
                        <p className="text-xs text-text-secondary">Sin ventas</p>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   FECHAS IMPORTANTES
   ============================================================ */
function FechasImportantes() {
    const fechas = [
        { dia: 1, mes: 0, nombre: "Año Nuevo" },
        { dia: 14, mes: 1, nombre: "San Valentín" },
        { dia: 8, mes: 2, nombre: "Día de la Mujer" },
        { dia: 24, mes: 2, nombre: "Día de la Memoria" },
        { dia: 2, mes: 3, nombre: "Día del Veterano (Malvinas)" },
        { dia: 1, mes: 4, nombre: "Día del Trabajador" },
        { dia: 25, mes: 4, nombre: "Día de la Revolución de Mayo" },
        { dia: 20, mes: 5, nombre: "Día de la Bandera" },
        { dia: 9, mes: 6, nombre: "Día de la Independencia" },
        { dia: 17, mes: 7, nombre: "Día de San Martín" },
        { dia: 21, mes: 8, nombre: "Día de la Primavera" },
        { dia: 12, mes: 9, nombre: "Día del Respeto a la Diversidad" },
        { dia: 20, mes: 9, nombre: "Día de la Madre 👩" },
        { dia: 1, mes: 10, nombre: "Día de Todos los Santos" },
        { dia: 20, mes: 10, nombre: "Día de la Soberanía" },
        { dia: 8, mes: 11, nombre: "Inmaculada Concepción" },
        { dia: 25, mes: 11, nombre: "Navidad 🎄" },
        { dia: 31, mes: 11, nombre: "Fin de Año 🎉" },
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = fechas
        .map((f) => {
            const nextDate = new Date(today.getFullYear(), f.mes, f.dia);
            if (nextDate < today) nextDate.setFullYear(today.getFullYear() + 1);
            const daysUntil = Math.ceil(
                (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            return { ...f, daysUntil, nextDate };
        })
        .sort((a, b) => a.daysUntil - b.daysUntil)
        .slice(0, 5);

    return (
        <div className="space-y-2">
            {upcoming.map((f, i) => (
                <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/70 hover:bg-gray-100/70 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex flex-col items-center justify-center flex-shrink-0 border border-gray-100">
                            <span className="text-[9px] text-text-secondary uppercase leading-tight">
                                {f.nextDate
                                    .toLocaleDateString("es-AR", { month: "short" })
                                    .replace(".", "")}
                            </span>
                            <span className="text-sm font-bold text-text-primary leading-tight">
                                {f.dia}
                            </span>
                        </div>
                        <span className="text-sm text-text-primary font-medium">
                            {f.nombre}
                        </span>
                    </div>
                    <span
                        className={`text-[10px] font-medium px-2 py-1 rounded-full whitespace-nowrap ${f.daysUntil === 0
                                ? "bg-accent-pink text-white"
                                : f.daysUntil <= 14
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-white text-text-secondary border border-gray-100"
                            }`}
                    >
                        {f.daysUntil === 0
                            ? "HOY"
                            : f.daysUntil === 1
                                ? "Mañana"
                                : `En ${f.daysUntil} días`}
                    </span>
                </div>
            ))}
        </div>
    );
}