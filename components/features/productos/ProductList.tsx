"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Search,
    Plus,
    Pencil,
    Trash2,
    Package,
    LayoutGrid,
    List,
    Tag,
} from "lucide-react";
import { formatCurrency } from "@/lib/whatsapp";
import type { Product, Category, ProductVariant } from "@/lib/types";

type ViewMode = "card" | "list";

interface ProductWithVariants extends Product {
    variants?: ProductVariant[];
}

const STORAGE_KEY = "catalogo_view_mode";

export function ProductList() {
    const [products, setProducts] = useState<ProductWithVariants[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [loading, setLoading] = useState(true);

    // Inicializar desde localStorage directamente (SSR-safe)
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        if (typeof window === "undefined") return "card";
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved === "list" ? "list" : "card";
    });

    // Guardar cuando cambia
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, viewMode);
    }, [viewMode]);

    async function loadProducts(query = "", categoryId = "") {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (query) params.set("search", query);
            if (categoryId) params.set("category", categoryId);
            params.set("withVariants", "true");

            const res = await fetch(`/api/products?${params.toString()}`);
            const data = await res.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function loadCategories() {
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            setCategories(data.categories || []);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        loadCategories();
        loadProducts();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadProducts(search, categoryFilter);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, categoryFilter]);

    async function handleDelete(id: number, name: string) {
        if (
            !confirm(
                `¿Eliminar "${name}"? Se borrarán también sus variantes e imágenes.`
            )
        )
            return;

        try {
            await fetch(`/api/products/${id}`, { method: "DELETE" });
            loadProducts(search, categoryFilter);
        } catch (error) {
            console.error(error);
            alert("Error al eliminar");
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Catálogo</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        {products.length} producto{products.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Toggle de vista */}
                    <div className="flex items-center bg-white rounded-full border border-gray-100 p-1">
                        <button
                            onClick={() => setViewMode("card")}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === "card"
                                    ? "bg-gradient-main text-white"
                                    : "text-text-secondary hover:bg-gray-50"
                                }`}
                            title="Vista de tarjetas"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === "list"
                                    ? "bg-gradient-main text-white"
                                    : "text-text-secondary hover:bg-gray-50"
                                }`}
                            title="Vista de lista"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <Link
                        href="/admin/catalogo/nuevo"
                        className="flex items-center gap-2 bg-gradient-main text-white rounded-full px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo producto
                    </Link>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-100 text-sm outline-none focus:border-accent-pink/50 transition-colors"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white rounded-xl border border-gray-100 text-sm outline-none focus:border-accent-pink/50 transition-colors"
                >
                    <option value="">Todas las categorías</option>
                    {categories.map((cat) => (
                        <option key={cat.id_category} value={cat.id_category}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Contenido */}
            {loading ? (
                <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-8 text-center text-text-secondary text-sm">
                    Cargando productos...
                </div>
            ) : products.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-12 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-text-secondary text-sm">
                        {search || categoryFilter
                            ? "No se encontraron productos"
                            : "Todavía no hay productos. Creá el primero."}
                    </p>
                </div>
            ) : viewMode === "card" ? (
                <CardView products={products} onDelete={handleDelete} />
            ) : (
                <ListView products={products} onDelete={handleDelete} />
            )}
        </div>
    );
}

/* ============================================================
   VISTA CARD
   ============================================================ */
function CardView({
    products,
    onDelete,
}: {
    products: ProductWithVariants[];
    onDelete: (id: number, name: string) => void;
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product) => (
                <div
                    key={product.id_product}
                    className={`bg-white rounded-3xl shadow-card border border-gray-100/50 p-5 hover:shadow-lg transition-shadow ${product.stock_status === "discontinued" ? "opacity-60" : ""
                        }`}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="inline-block text-[10px] font-medium text-accent-pink bg-accent-pink/10 px-2 py-1 rounded-full">
                                    {product.category_name}
                                </span>
                                <StockBadge status={product.stock_status} />
                            </div>
                            <h3 className="text-base font-semibold text-text-primary leading-tight">
                                {product.name}
                            </h3>
                            {product.size_name && (
                                <p className="text-xs text-text-secondary mt-1">
                                    {product.size_name}
                                    {product.size_cm && ` • ${product.size_cm} cm`}
                                </p>
                            )}
                            <p className="text-lg font-bold text-accent-pink mt-2">
                                {formatCurrency(product.price)}
                            </p>
                        </div>
                        {product.active === 0 && (
                            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                Inactivo
                            </span>
                        )}
                    </div>

                    {product.variants && product.variants.length > 0 && (
                        <div className="mb-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Tag className="w-3 h-3 text-text-secondary" />
                                <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wide">
                                    {product.variants.length} variante
                                    {product.variants.length !== 1 ? "s" : ""}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {product.variants.slice(0, 3).map((v) => (
                                    <span
                                        key={v.id_variant}
                                        className="text-[10px] bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5 text-text-secondary"
                                    >
                                        {v.scent}
                                    </span>
                                ))}
                                {product.variants.length > 3 && (
                                    <span className="text-[10px] bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5 text-text-secondary">
                                        +{product.variants.length - 3}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <div className="text-xs text-text-secondary">
                            <span className="font-semibold text-text-primary">
                                {product.variant_count || 0}
                            </span>{" "}
                            variante{(product.variant_count || 0) !== 1 ? "s" : ""}
                        </div>
                        <div className="flex items-center gap-1">
                            <Link
                                href={`/admin/catalogo/${product.id_product}`}
                                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                                title="Editar"
                            >
                                <Pencil className="w-4 h-4 text-text-secondary" />
                            </Link>
                            <button
                                onClick={() => onDelete(product.id_product, product.name)}
                                className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors"
                                title="Eliminar"
                            >
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ============================================================
   VISTA LISTA
   ============================================================ */
function ListView({
    products,
    onDelete,
}: {
    products: ProductWithVariants[];
    onDelete: (id: number, name: string) => void;
}) {
    return (
        <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="text-left text-xs text-text-secondary border-b border-gray-100 bg-gray-50/50">
                        <th className="px-4 py-3 font-medium">Producto</th>
                        <th className="px-4 py-3 font-medium">Categoría</th>
                        <th className="px-4 py-3 font-medium">Tamaño</th>
                        <th className="px-4 py-3 font-medium text-right">Precio</th>
                        <th className="px-4 py-3 font-medium">Variantes</th>
                        <th className="px-4 py-3 font-medium">Estado</th>
                        <th className="px-4 py-3 font-medium text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr
                            key={product.id_product}
                            className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors ${product.stock_status === "discontinued" ? "opacity-60" : ""
                                }`}
                        >
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-text-primary">
                                        {product.name}
                                    </span>
                                    {product.active === 0 && (
                                        <span className="text-[9px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                            Inactivo
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <span className="text-[10px] font-medium text-accent-pink bg-accent-pink/10 px-2 py-1 rounded-full">
                                    {product.category_name}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-text-secondary">
                                {product.size_name || "—"}
                                {product.size_cm && (
                                    <span className="block text-[10px]">{product.size_cm} cm</span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-text-primary text-right whitespace-nowrap">
                                {formatCurrency(product.price)}
                            </td>
                            <td className="px-4 py-3">
                                {product.variants && product.variants.length > 0 ? (
                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                        {product.variants.slice(0, 2).map((v) => (
                                            <span
                                                key={v.id_variant}
                                                className="text-[10px] bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5 text-text-secondary whitespace-nowrap"
                                            >
                                                {v.scent}
                                            </span>
                                        ))}
                                        {product.variants.length > 2 && (
                                            <span className="text-[10px] text-text-secondary">
                                                +{product.variants.length - 2} más
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-text-secondary">
                                        Sin variantes
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                <StockBadge status={product.stock_status} />
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1">
                                    <Link
                                        href={`/admin/catalogo/${product.id_product}`}
                                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                                        title="Editar"
                                    >
                                        <Pencil className="w-4 h-4 text-text-secondary" />
                                    </Link>
                                    <button
                                        onClick={() => onDelete(product.id_product, product.name)}
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
        </div>
    );
}

/* ============================================================
   BADGE DE STOCK
   ============================================================ */
function StockBadge({ status }: { status: string }) {
    if (status === "on_demand") {
        return (
            <span className="inline-block text-[10px] font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded-full whitespace-nowrap">
                A pedido
            </span>
        );
    }

    if (status === "discontinued") {
        return (
            <span className="inline-block text-[10px] font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full whitespace-nowrap">
                Discontinuo
            </span>
        );
    }

    return (
        <span className="inline-block text-[10px] font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full whitespace-nowrap">
            Disponible
        </span>
    );
}