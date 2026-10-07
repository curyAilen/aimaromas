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
} from "lucide-react";
import { formatCurrency } from "@/lib/whatsapp";

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

interface DashboardData {
    ventas: {
        grupoA: number;
        grupoB: number;
        total: number;
        orders_count: number;
        clientes: number;
    };
    pendientes: { count: number; total: number };
    compradorMes: Comprador | null;
    compradorAnio: Comprador | null;
    birthdays: Array<{
        id_client: number;
        name: string;
        birthday: string;
        days_until: number;
        next_birthday: string;
    }>;
    topAroma: { mes: TopProduct | null; anio: TopProduct | null };
    topJabon: { mes: TopProduct | null; anio: TopProduct | null };
}

export function DashboardView() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/dashboard");
                const json = await res.json();
                setData(json);
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 h-48 animate-pulse" />
                ))}
            </div>
        );
    }

    const { ventas, pendientes, compradorMes, compradorAnio, birthdays, topAroma, topJabon } = data;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
                <p className="text-sm text-text-secondary mt-1">
                    Resumen general de la operación
                </p>
            </div>

            {/* FILA 1: Ventas + Pendientes + Comprador N°1 */}
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
                            <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                                Velas + Wax Melts
                            </p>
                            <p className="text-xl font-bold text-accent-pink mt-1 truncate">
                                {formatCurrency(ventas.grupoA)}
                            </p>
                        </div>
                        <div className="bg-white/70 rounded-2xl p-3">
                            <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                                Jabones + Accs.
                            </p>
                            <p className="text-xl font-bold text-accent-purple mt-1 truncate">
                                {formatCurrency(ventas.grupoB)}
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

                    <div className="flex-1 flex flex-col justify-center">
                        <p className="text-6xl font-bold text-orange-500">
                            {pendientes.count}
                        </p>
                        <p className="text-xs text-text-secondary mt-2">
                            pedido{pendientes.count !== 1 ? "s" : ""} sin pagar
                        </p>
                        <div className="mt-5 pt-5 border-t border-gray-100">
                            <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1">
                                Total a cobrar
                            </p>
                            <p className="text-2xl font-bold text-text-primary">
                                {formatCurrency(pendientes.total)}
                            </p>
                        </div>
                    </div>
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

            {/* FILA 2: Top Aromas + Top Jabones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopProductCard
                    title="Top Producto — Aromas"
                    emoji="🕯️"
                    mes={topAroma.mes}
                    anio={topAroma.anio}
                    color="pink"
                />
                <TopProductCard
                    title="Top Producto — Jabones"
                    emoji="🧼"
                    mes={topJabon.mes}
                    anio={topJabon.anio}
                    color="purple"
                />
            </div>

            {/* FILA 3: Cumpleaños (4 por fila) + Fechas Importantes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
   TOP PRODUCT CARD
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
                <div className={`w-8 h-8 rounded-lg bg-gradient-soft flex items-center justify-center text-base`}>
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