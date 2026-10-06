"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, Pencil, Trash2, Cake, Eye } from "lucide-react";
import type { Client } from "@/lib/types";

export function ClientList() {
    const [clients, setClients] = useState<Client[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    async function loadClients(query = "") {
        setLoading(true);
        try {
            const res = await fetch(`/api/clients?search=${encodeURIComponent(query)}`);
            const data = await res.json();
            setClients(data.clients || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadClients();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadClients(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    async function handleDelete(id: number, name: string) {
        if (!confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return;

        try {
            await fetch(`/api/clients/${id}`, { method: "DELETE" });
            loadClients(search);
        } catch (error) {
            console.error(error);
            alert("Error al eliminar");
        }
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Clientes</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        {clients.length} cliente{clients.length !== 1 ? "s" : ""} registrado
                        {clients.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <Link
                    href="/admin/clientes/nuevo"
                    className="flex items-center gap-2 bg-gradient-main text-white rounded-full px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo cliente
                </Link>
            </div>

            <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nombre, teléfono o email..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 text-sm outline-none focus:border-accent-pink/50 focus:bg-white transition-colors"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-text-secondary text-sm">
                        Cargando clientes...
                    </div>
                ) : clients.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary text-sm">
                        {search
                            ? "No se encontraron clientes"
                            : "Todavía no hay clientes. Creá el primero."}
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-text-secondary border-b border-gray-100">
                                <th className="px-6 py-3 font-medium">Nombre</th>
                                <th className="px-6 py-3 font-medium">Teléfono</th>
                                <th className="px-6 py-3 font-medium">Email</th>
                                <th className="px-6 py-3 font-medium">Cumpleaños</th>
                                <th className="px-6 py-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map((client) => (
                                <tr
                                    key={client.id_client}
                                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/admin/clientes/${client.id_client}`}
                                            className="text-sm font-medium text-text-primary hover:text-accent-pink transition-colors"
                                        >
                                            {client.name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-text-secondary">
                                        {client.phone}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-text-secondary">
                                        {client.email || "—"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-text-secondary">
                                        <div className="flex items-center gap-2">
                                            {client.birthday
                                                ? new Date(client.birthday).toLocaleDateString("es-AR", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                })
                                                : "—"}
                                            {isBirthdaySoon(client.birthday) && (
                                                <span title="Cumpleaños próximo">
                                                    <Cake className="w-4 h-4 text-accent-pink" />
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/clientes/${client.id_client}`}
                                                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                                                title="Ver ficha"
                                            >
                                                <Eye className="w-4 h-4 text-text-secondary" />
                                            </Link>
                                            <Link
                                                href={`/admin/clientes/${client.id_client}/editar`}
                                                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil className="w-4 h-4 text-text-secondary" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(client.id_client, client.name)}
                                                className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
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