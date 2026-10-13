"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Search,
    Plus,
    Eye,
    Pencil,
    Trash2,
    Users,
    Phone,
    Mail,
    DollarSign,
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
    active: number;
    default_commission_percent: string;
    createdAt: string;
    order_count: number;
    total_sold: string;
}

export function ResellerList() {
    const [resellers, setResellers] = useState<Reseller[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    async function loadResellers(query = "") {
        setLoading(true);
        try {
            const res = await fetch("/api/resellers");
            const data = await res.json();
            let list: Reseller[] = data.resellers || [];

            if (query) {
                const q = query.toLowerCase();
                list = list.filter(
                    (r) =>
                        r.name.toLowerCase().includes(q) ||
                        (r.phone && r.phone.includes(q)) ||
                        (r.email && r.email.toLowerCase().includes(q))
                );
            }

            setResellers(list);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadResellers();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadResellers(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    async function handleDelete(id: number, name: string) {
        if (
            !confirm(
                `¿Eliminar a "${name}"? Los pedidos van a quedar sin revendedora asignada.`
            )
        )
            return;

        try {
            await fetch(`/api/resellers/${id}`, { method: "DELETE" });
            loadResellers(search);
        } catch (error) {
            console.error(error);
            alert("Error al eliminar");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">
                        Revendedoras
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">
                        {resellers.length} revendedora{resellers.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <Link
                    href="/admin/revendedoras/nuevo"
                    className="flex items-center gap-2 bg-gradient-main text-white rounded-full px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Nueva revendedora
                </Link>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre, teléfono o email..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-100 text-sm outline-none focus:border-accent-pink/50 transition-colors"
                />
            </div>

            {loading ? (
                <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-8 text-center text-text-secondary text-sm">
                    Cargando revendedoras...
                </div>
            ) : resellers.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-text-secondary text-sm">
                        {search
                            ? "No se encontraron revendedoras"
                            : "Todavía no hay revendedoras. Creá la primera."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {resellers.map((reseller) => (
                        <div
                            key={reseller.id_reseller}
                            className={`bg-white rounded-3xl shadow-card border border-gray-100/50 p-5 hover:shadow-lg transition-shadow ${reseller.active === 0 ? "opacity-60" : ""
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-12 h-12 rounded-full bg-gradient-main flex items-center justify-center text-white font-bold flex-shrink-0">
                                        {reseller.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .slice(0, 2)
                                            .join("")
                                            .toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base font-semibold text-text-primary truncate">
                                            {reseller.name}
                                        </h3>
                                        <p className="text-[10px] font-medium text-accent-purple">
                                            {Number(reseller.default_commission_percent).toFixed(0)}% comisión
                                        </p>
                                        {reseller.active === 0 && (
                                            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                Inactiva
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5 mb-4 text-xs text-text-secondary">
                                {reseller.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-3 h-3" />
                                        {reseller.phone}
                                    </div>
                                )}
                                {reseller.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-3 h-3" />
                                        <span className="truncate">{reseller.email}</span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4 pt-3 border-t border-gray-100">
                                <div>
                                    <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                                        Pedidos
                                    </p>
                                    <p className="text-lg font-bold text-text-primary">
                                        {reseller.order_count}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                                        Total vendido
                                    </p>
                                    <p className="text-lg font-bold text-accent-pink truncate">
                                        {formatCurrency(reseller.total_sold)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-1 pt-3 border-t border-gray-100">
                                <Link
                                    href={`/admin/revendedoras/${reseller.id_reseller}`}
                                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                                    title="Ver ficha"
                                >
                                    <Eye className="w-4 h-4 text-text-secondary" />
                                </Link>
                                <Link
                                    href={`/admin/revendedoras/${reseller.id_reseller}/editar`}
                                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                                    title="Editar"
                                >
                                    <Pencil className="w-4 h-4 text-text-secondary" />
                                </Link>
                                <button
                                    onClick={() =>
                                        handleDelete(reseller.id_reseller, reseller.name)
                                    }
                                    className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}