"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Sparkles, Plus, Check } from "lucide-react";
import { formatCurrency } from "@/lib/whatsapp";
import { useCart } from "@/lib/cart-context";
import type { Product, Category } from "@/lib/types";

interface PublicProduct extends Product {
    image_url: string | null;
    category_slug: string;
    category_name: string;
}

interface PublicCategory {
    id_category: number;
    name: string;
    slug: string;
}

export default function HomePage() {
    const [products, setProducts] = useState<PublicProduct[]>([]);
    const [categories, setCategories] = useState<PublicCategory[]>([]);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    async function loadProducts(query = "", categoryId: number | null = null) {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (query) params.set("search", query);
            if (categoryId) params.set("category", String(categoryId));

            const res = await fetch(`/api/public/products?${params.toString()}`);
            const data = await res.json();
            setProducts(data.products || []);
            if (data.categories) setCategories(data.categories);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadProducts(search, categoryFilter);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, categoryFilter]);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
            {/* Hero */}
            <div className="bg-gradient-soft rounded-3xl p-8 md:p-12 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-accent-pink" />
                    <span className="text-xs font-medium text-accent-pink uppercase tracking-wide">
                        Hecho a mano con amor
                    </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
                    Velas y Jabones Artesanales
                </h1>
                <p className="text-sm md:text-base text-text-secondary max-w-xl mx-auto">
                    Elegí tus productos favoritos, armá tu pedido y envialo por WhatsApp.
                    Sin registro, sin vueltas.
                </p>
            </div>

            {/* Buscador */}
            <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar productos..."
                    className="w-full pl-11 pr-4 py-3 bg-white rounded-full border border-gray-100 text-sm outline-none focus:border-accent-pink/50 transition-colors shadow-sm"
                />
            </div>

            {/* Filtros de categoría */}
            <div className="flex gap-2 overflow-x-auto pb-2 justify-start md:justify-center">
                <button
                    onClick={() => setCategoryFilter(null)}
                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${categoryFilter === null
                            ? "bg-gradient-main text-white shadow-md shadow-accent-pink/20"
                            : "bg-white text-text-secondary border border-gray-100 hover:border-accent-pink/50"
                        }`}
                >
                    Todos
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id_category}
                        onClick={() => setCategoryFilter(cat.id_category)}
                        className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${categoryFilter === cat.id_category
                                ? "bg-gradient-main text-white shadow-md shadow-accent-pink/20"
                                : "bg-white text-text-secondary border border-gray-100 hover:border-accent-pink/50"
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Grid de productos */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-3xl overflow-hidden animate-pulse"
                        >
                            <div className="aspect-square bg-gray-100" />
                            <div className="p-4 space-y-2">
                                <div className="h-3 bg-gray-100 rounded w-3/4" />
                                <div className="h-3 bg-gray-100 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-text-secondary">No se encontraron productos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                        <ProductCard key={product.id_product} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ProductCard({ product }: { product: PublicProduct }) {
    const { addItem } = useCart();
    const [added, setAdded] = useState(false);
    const isOnDemand = product.stock_status === "on_demand";

    function handleQuickAdd(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        addItem(
            {
                id_product: product.id_product,
                id_variant: null,
                product_name: product.name,
                variant_scent: null,
                price: Number(product.price),
                image_url: product.image_url,
                stock_status: product.stock_status,
            },
            1
        );

        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    }

    return (
        <Link
            href={`/producto/${product.id_product}`}
            className="group bg-white rounded-3xl overflow-hidden shadow-card border border-gray-100/50 hover:shadow-lg hover:-translate-y-1 transition-all relative"
        >
            <div className="aspect-square bg-gradient-soft relative overflow-hidden">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">🕯️</span>
                    </div>
                )}
                {isOnDemand && (
                    <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                        A pedido
                    </div>
                )}

                <button
                    onClick={handleQuickAdd}
                    className={`absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 ${added
                            ? "bg-green-500 text-white"
                            : "bg-white text-accent-pink hover:bg-accent-pink hover:text-white"
                        }`}
                    title="Agregar al carrito"
                >
                    {added ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
            </div>
            <div className="p-3 md:p-4">
                <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                    {product.category_name}
                </p>
                <h3 className="text-sm font-semibold text-text-primary mt-0.5 leading-tight line-clamp-2">
                    {product.name}
                </h3>
                {product.size_name && (
                    <p className="text-[10px] text-text-secondary mt-1">
                        {product.size_name}
                        {product.size_cm && ` • ${product.size_cm} cm`}
                    </p>
                )}
                <p className="text-base font-bold text-accent-pink mt-2">
                    {formatCurrency(product.price)}
                </p>
            </div>
        </Link>
    );
}