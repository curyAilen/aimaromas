"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { Client } from "@/lib/types";

interface ClientSearchProps {
    clients: Client[];
    selectedClientId: number | null;
    onSelect: (clientId: number | null) => void;
}

export function ClientSearch({
    clients,
    selectedClientId,
    onSelect,
}: ClientSearchProps) {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Si ya hay un cliente seleccionado, mostrarlo en el input
    useEffect(() => {
        if (selectedClientId) {
            const client = clients.find((c) => c.id_client === selectedClientId);
            if (client) setSearch(client.name);
        } else {
            setSearch("");
        }
    }, [selectedClientId, clients]);

    // Cerrar al hacer click afuera
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const filtered = search
        ? clients.filter(
            (c) =>
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                (c.phone && c.phone.includes(search))
        )
        : clients.slice(0, 20); // Mostrar los primeros 20 si no hay búsqueda

    function handleSelect(client: Client) {
        onSelect(client.id_client);
        setSearch(client.name);
        setOpen(false);
    }

    function handleClear() {
        onSelect(null);
        setSearch("");
        setOpen(false);
    }

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setOpen(true);
                        if (!e.target.value) onSelect(null);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder="Escribí el nombre del cliente..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent-pink/50 transition-colors"
                />
                {selectedClientId && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-gray-100 flex items-center justify-center"
                    >
                        <X className="w-3 h-3 text-text-secondary" />
                    </button>
                )}
            </div>

            {open && (
                <div className="absolute z-30 top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-popup max-h-64 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="p-4 text-center text-text-secondary text-sm">
                            No se encontraron clientes
                        </div>
                    ) : (
                        filtered.map((client) => (
                            <button
                                key={client.id_client}
                                type="button"
                                onClick={() => handleSelect(client)}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                            >
                                <div>
                                    <p className="text-sm font-medium text-text-primary">
                                        {client.name}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        {client.phone}
                                        {client.email && ` • ${client.email}`}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}