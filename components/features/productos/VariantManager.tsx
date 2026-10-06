"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Tag, Loader2 } from "lucide-react";

interface Variant {
    id_variant: number;
    id_product: number;
    scent: string;
    sku: string | null;
    active: number;
    createdAt: string;
    updatedAt: string;
}

interface VariantManagerProps {
    productId: string;
}

export function VariantManager({ productId }: VariantManagerProps) {
    const [variants, setVariants] = useState<Variant[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newScent, setNewScent] = useState("");
    const [error, setError] = useState("");

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

    useEffect(() => {
        loadVariants();
    }, [productId]);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!newScent.trim()) return;

        setAdding(true);
        setError("");

        try {
            const res = await fetch(`/api/products/${productId}/variants`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scent: newScent.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Error al agregar");
                setAdding(false);
                return;
            }

            setNewScent("");
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
                        Agregá las fragancias disponibles para este producto
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

                    <form onSubmit={handleAdd} className="flex gap-2 pt-2">
                        <input
                            type="text"
                            value={newScent}
                            onChange={(e) => setNewScent(e.target.value)}
                            placeholder="Ej: Lavanda Rosas, Café, Coco Vainilla..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent-pink/50 focus:ring-2 focus:ring-accent-pink/10 transition-all"
                            disabled={adding}
                        />
                        <button
                            type="submit"
                            disabled={adding || !newScent.trim()}
                            className="flex items-center gap-2 bg-gradient-main text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {adding ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Plus className="w-4 h-4" />
                            )}
                            Agregar
                        </button>
                    </form>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-2.5">
                            {error}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}