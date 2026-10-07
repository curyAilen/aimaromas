"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Tag, Loader2, Search, X } from "lucide-react";

interface Variant {
    id_variant: number;
    id_product: number;
    scent: string;
    active: number;
    createdAt: string;
    updatedAt: string;
}

interface VariantManagerProps {
    productId: string;
}

export function VariantManager({ productId }: VariantManagerProps) {
    const [variants, setVariants] = useState<Variant[]>([]);
    const [availableScents, setAvailableScents] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState("");
    const [showPicker, setShowPicker] = useState(false);
    const [search, setSearch] = useState("");
    const [newScent, setNewScent] = useState("");

    async function loadVariants() {
        try {
            const res = await fetch(`/api/products/${productId}/variants`);
            const data = await res.json();
            setVariants(data.variants || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function loadScents() {
        try {
            const res = await fetch("/api/scents");
            const data = await res.json();
            setAvailableScents(data.scents || []);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        loadVariants();
        loadScents();
    }, [productId]);

    async function addScent(scentName: string) {
        if (!scentName.trim()) return;

        setAdding(true);
        setError("");

        try {
            const res = await fetch(`/api/products/${productId}/variants`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scent: scentName.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Error al agregar");
                setAdding(false);
                return;
            }

            setSearch("");
            setNewScent("");
            setShowPicker(false);
            await loadVariants();
        } catch {
            setError("Error de conexión");
        } finally {
            setAdding(false);
        }
    }

    async function handleDelete(id: number, scent: string) {
        if (!confirm(`¿Eliminar la variante "${scent}"?`)) return;

        try {
            await fetch(`/api/variants/${id}`, { method: "DELETE" });
            await loadVariants();
        } catch (error) {
            console.error(error);
        }
    }

    // Fragancias disponibles que NO están ya asignadas a este producto
    const assignedScents = variants.map((v) => v.scent.toLowerCase());
    const suggestions = availableScents.filter(
        (s) =>
            !assignedScents.includes(s.toLowerCase()) &&
            s.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-soft flex items-center justify-center">
                    <Tag className="w-5 h-5 text-accent-pink" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-text-primary">
                        Variantes por fragancia
                    </h2>
                    <p className="text-xs text-text-secondary">
                        Seleccioná las fragancias disponibles para este producto
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="p-4 text-center text-text-secondary text-sm">
                    Cargando variantes...
                </div>
            ) : (
                <>
                    {variants.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {variants.map((variant) => (
                                <div
                                    key={variant.id_variant}
                                    className="group flex items-center gap-2 bg-gradient-soft border border-accent-pink/20 rounded-full pl-4 pr-2 py-2"
                                >
                                    <span className="text-sm font-medium text-text-primary">
                                        {variant.scent}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(variant.id_variant, variant.scent)}
                                        className="w-6 h-6 rounded-full hover:bg-white/60 flex items-center justify-center transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-3 h-3 text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-text-secondary">
                            Todavía no hay variantes. Agregá la primera fragancia.
                        </p>
                    )}

                    {/* Botón agregar */}
                    {!showPicker && (
                        <button
                            onClick={() => setShowPicker(true)}
                            className="flex items-center gap-2 bg-gradient-main text-white rounded-full px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar fragancia
                        </button>
                    )}

                    {/* Selector de fragancias */}
                    {showPicker && (
                        <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-text-primary">
                                    Elegí una fragancia
                                </p>
                                <button
                                    onClick={() => {
                                        setShowPicker(false);
                                        setSearch("");
                                        setNewScent("");
                                    }}
                                    className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center"
                                >
                                    <X className="w-3.5 h-3.5 text-text-secondary" />
                                </button>
                            </div>

                            {/* Buscador */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar fragancia..."
                                    autoFocus
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent-pink/50"
                                />
                            </div>

                            {/* Lista de fragancias */}
                            <div className="max-h-48 overflow-y-auto space-y-1">
                                {suggestions.length === 0 && search ? (
                                    <div className="p-3 text-center">
                                        <p className="text-xs text-text-secondary mb-2">
                                            No existe "{search}"
                                        </p>
                                        <button
                                            onClick={() => addScent(search)}
                                            disabled={adding}
                                            className="text-xs font-medium text-accent-pink hover:underline disabled:opacity-50"
                                        >
                                            + Crear "{search}" como nueva fragancia
                                        </button>
                                    </div>
                                ) : suggestions.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-text-secondary">
                                        No hay más fragancias disponibles
                                    </div>
                                ) : (
                                    suggestions.map((scent) => (
                                        <button
                                            key={scent}
                                            onClick={() => addScent(scent)}
                                            disabled={adding}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-text-primary disabled:opacity-50 flex items-center justify-between group"
                                        >
                                            <span>{scent}</span>
                                            <Plus className="w-3.5 h-3.5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* Crear nueva fragancia (siempre visible) */}
                            {search && suggestions.length > 0 && (
                                <div className="pt-2 border-t border-gray-100">
                                    <button
                                        onClick={() => addScent(search)}
                                        disabled={adding}
                                        className="text-xs font-medium text-accent-pink hover:underline disabled:opacity-50 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Crear "{search}" como nueva fragancia
                                    </button>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-3 py-2">
                                    {error}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}