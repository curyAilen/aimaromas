"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Upload, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { VariantManager } from "./VariantManager";
import type { Category, Product, ProductImage, StockStatus } from "@/lib/types";

interface ProductFormProps {
    productId?: string;
}

export function ProductForm({ productId }: ProductFormProps) {
    const router = useRouter();
    const isEdit = !!productId;

    const [categories, setCategories] = useState<Category[]>([]);
    const [form, setForm] = useState({
        id_category: "",
        name: "",
        size_name: "",
        size_cm: "",
        price: "",
        description: "",
        active: true,
        stock_status: "in_stock" as StockStatus,
    });
    const [images, setImages] = useState<ProductImage[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadCategories() {
            try {
                const res = await fetch("/api/categories");
                const data = await res.json();
                setCategories(data.categories || []);
            } catch (error) {
                console.error(error);
            }
        }
        loadCategories();
    }, []);

    useEffect(() => {
        if (!productId) return;

        async function load() {
            try {
                const res = await fetch(`/api/products/${productId}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                const product: Product = data.product;
                setForm({
                    id_category: String(product.id_category),
                    name: product.name || "",
                    size_name: product.size_name || "",
                    size_cm: product.size_cm || "",
                    price: product.price || "",
                    description: product.description || "",
                    active: product.active === 1,
                    stock_status: product.stock_status || "in_stock",
                });
                setImages(data.images || []);
            } catch {
                setError("No se pudo cargar el producto");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [productId]);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            for (const file of Array.from(files)) {
                const fd = new FormData();
                fd.append("file", file);
                if (productId) fd.append("id_product", productId);

                const res = await fetch("/api/products/upload", {
                    method: "POST",
                    body: fd,
                });
                const data = await res.json();

                if (!res.ok) {
                    alert(data.error || "Error al subir imagen");
                    continue;
                }

                setImages((prev) => [...prev, data.image]);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    }

    async function handleDeleteImage(imageId: number) {
        if (!confirm("¿Eliminar esta imagen?")) return;
        try {
            await fetch(`/api/products/images/${imageId}`, { method: "DELETE" });
            setImages((prev) => prev.filter((i) => i.id_image !== imageId));
        } catch (error) {
            console.error(error);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            const url = isEdit ? `/api/products/${productId}` : "/api/products";
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id_category: Number(form.id_category),
                    name: form.name,
                    size_name: form.size_name,
                    size_cm: form.size_cm,
                    price: Number(form.price) || 0,
                    description: form.description,
                    active: form.active,
                    stock_status: form.stock_status,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Error al guardar");
                setSaving(false);
                return;
            }

            router.push("/admin/catalogo");
            router.refresh();
        } catch {
            setError("Error de conexión");
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="p-8 text-center text-text-secondary text-sm">
                Cargando...
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/catalogo"
                    className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 text-text-primary" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">
                        {isEdit ? "Editar producto" : "Nuevo producto"}
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">
                        {isEdit
                            ? "Modificá los datos del producto"
                            : "Cargá los datos del producto base"}
                    </p>
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6 space-y-5"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Categoría *">
                        <select
                            required
                            value={form.id_category}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, id_category: e.target.value }))
                            }
                            className="input"
                        >
                            <option value="">Seleccioná una categoría</option>
                            {categories.map((cat) => (
                                <option key={cat.id_category} value={cat.id_category}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Nombre del producto *">
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="Ej: Vela de soja Volcancito"
                            className="input"
                        />
                    </Field>

                    <Field label="Tamaño / Nombre">
                        <input
                            type="text"
                            value={form.size_name}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, size_name: e.target.value }))
                            }
                            placeholder="Ej: Volcán, Nadir, Chico"
                            className="input"
                        />
                    </Field>

                    <Field label="Medidas (cm)">
                        <input
                            type="text"
                            value={form.size_cm}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, size_cm: e.target.value }))
                            }
                            placeholder="Ej: 8x8 o 10x12"
                            className="input"
                        />
                    </Field>

                    <Field label="Precio *">
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={form.price}
                            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                            placeholder="30000"
                            className="input"
                        />
                    </Field>
                </div>

                <Field label="Descripción">
                    <textarea
                        value={form.description}
                        onChange={(e) =>
                            setForm((p) => ({ ...p, description: e.target.value }))
                        }
                        placeholder="Descripción del producto..."
                        rows={3}
                        className="input resize-none"
                    />
                </Field>

                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="active"
                            checked={form.active}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, active: e.target.checked }))
                            }
                            className="w-4 h-4 rounded border-gray-300 text-accent-pink focus:ring-accent-pink/20"
                        />
                        <label htmlFor="active" className="text-sm text-text-primary">
                            Producto activo (visible en la tienda)
                        </label>
                    </div>

                    <Field label="Estado del stock">
                        <select
                            value={form.stock_status}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    stock_status: e.target.value as StockStatus,
                                }))
                            }
                            className="input"
                        >
                            <option value="in_stock">Disponible</option>
                            <option value="on_demand">
                                A pedido (se muestra, se puede pedir)
                            </option>
                            <option value="discontinued">
                                Discontinuo (se muestra pero no se puede pedir)
                            </option>
                        </select>
                    </Field>
                </div>

                {/* Imágenes */}
                <div>
                    <label className="text-xs font-medium text-text-secondary block mb-2">
                        Imágenes del producto
                    </label>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {images.map((img) => (
                            <div
                                key={img.id_image}
                                className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group"
                            >
                                <img
                                    src={img.url}
                                    alt="Producto"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleDeleteImage(img.id_image)}
                                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4 text-red-500" />
                                </button>
                            </div>
                        ))}

                        <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-accent-pink/50 hover:bg-accent-pink/5 transition-colors">
                            {uploading ? (
                                <Loader2 className="w-6 h-6 text-accent-pink animate-spin" />
                            ) : (
                                <>
                                    <Upload className="w-6 h-6 text-text-secondary mb-1" />
                                    <span className="text-[10px] text-text-secondary">
                                        Subir foto
                                    </span>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleUpload}
                                className="hidden"
                                disabled={uploading}
                            />
                        </label>
                    </div>

                    {!productId && (
                        <p className="text-[10px] text-text-secondary mt-2">
                            💡 Guardá el producto primero para poder subir imágenes.
                        </p>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-2.5">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link
                        href="/admin/catalogo"
                        className="px-5 py-2.5 rounded-full text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-gradient-main text-white rounded-full px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving
                            ? "Guardando..."
                            : isEdit
                                ? "Guardar cambios"
                                : "Crear producto"}
                    </button>
                </div>
            </form>

            {/* Variantes - solo visible si estamos editando */}
            {isEdit && productId && <VariantManager productId={productId} />}

            <style jsx global>{`
        .input {
          width: 100%;
          padding: 0.625rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.15s;
          background: #fff;
        }
        .input:focus {
          border-color: rgba(255, 77, 141, 0.5);
          box-shadow: 0 0 0 2px rgba(255, 77, 141, 0.1);
        }
      `}</style>
        </div>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="text-xs font-medium text-text-secondary block mb-1.5">
                {label}
            </label>
            {children}
        </div>
    );
}