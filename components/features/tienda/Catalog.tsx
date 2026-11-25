"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Check, Zap, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/whatsapp";
import { useCart } from "@/lib/cart-context";
import { optimizeImage, productPath } from "@/lib/slug";
import type { CatalogCategory, CatalogProduct } from "@/lib/catalog";

// Cuántos productos se piden: 6 al entrar o al filtrar, y 3 cada vez que se llega al final
const FIRST_PAGE = 6;
const NEXT_PAGE = 3;

interface CatalogProps {
    initialProducts: CatalogProduct[];
    initialTotal: number;
    categories: CatalogCategory[];
    /** true si el servidor no pudo leer la base: el navegador reintenta al cargar */
    initialFailed?: boolean;
}

interface PageResponse {
    products: CatalogProduct[];
    total: number;
    categories?: CatalogCategory[];
}

export function Catalog({
    initialProducts,
    initialTotal,
    categories: initialCategories,
    initialFailed = false,
}: CatalogProps) {
    const [products, setProducts] = useState<CatalogProduct[]>(initialProducts);
    const [total, setTotal] = useState(initialTotal);
    const [categories, setCategories] = useState<CatalogCategory[]>(initialCategories);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
    const [loading, setLoading] = useState(initialFailed);
    const [loadingMore, setLoadingMore] = useState(false);
    const [failed, setFailed] = useState(false);

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const requestId = useRef(0);
    const firstFilterRun = useRef(true);

    const hasMore = products.length < total;

    const fetchPage = useCallback(
        async (offset: number, limit: number): Promise<PageResponse | null> => {
            const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
            if (search.trim()) params.set("search", search.trim());
            if (categoryFilter) params.set("category", String(categoryFilter));
            const res = await fetch(`/api/public/products?${params.toString()}`);
            if (!res.ok) return null;
            return (await res.json()) as PageResponse;
        },
        [search, categoryFilter]
    );

    // Primera página de nuevo: al cambiar el buscador o la categoría (o si el servidor falló)
    useEffect(() => {
        if (firstFilterRun.current) {
            firstFilterRun.current = false;
            if (!initialFailed) return;
        }
        const id = ++requestId.current;
        const timer = setTimeout(async () => {
            setLoading(true);
            setFailed(false);
            try {
                const data = await fetchPage(0, FIRST_PAGE);
                if (id !== requestId.current) return;
                if (!data) {
                    setFailed(true);
                    return;
                }
                setProducts(data.products);
                setTotal(data.total);
                if (data.categories) setCategories(data.categories);
            } catch {
                if (id === requestId.current) setFailed(true);
            } finally {
                if (id === requestId.current) setLoading(false);
            }
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, categoryFilter]);

    const loadMore = useCallback(async () => {
        if (loadingMore || loading || !hasMore) return;
        const id = requestId.current;
        setLoadingMore(true);
        try {
            const data = await fetchPage(products.length, NEXT_PAGE);
            if (id !== requestId.current || !data) return;
            setProducts((prev) => {
                const seen = new Set(prev.map((p) => p.id_product));
                return [...prev, ...data.products.filter((p) => !seen.has(p.id_product))];
            });
            setTotal(data.total);
        } catch {
            // se reintenta cuando vuelva a aparecer el final de la lista
        } finally {
            setLoadingMore(false);
        }
    }, [fetchPage, hasMore, loading, loadingMore, products.length]);

    // Cuando se llega al final de la lista, se piden 3 más
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !hasMore || loading) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) loadMore();
            },
            { rootMargin: "300px" }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loading, loadMore]);

    return (
        <div className="space-y-8">
            {/* Buscador */}
            <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar productos..."
                    aria-label="Buscar productos"
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

            {/* Productos */}
            {loading ? (
                <SkeletonGrid count={FIRST_PAGE} />
            ) : failed ? (
                <div className="text-center py-16">
                    <p className="text-text-secondary">
                        No pudimos cargar los productos. Probá de nuevo en un momento.
                    </p>
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-text-secondary">No se encontraron productos.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.map((product, index) => (
                            <ProductCard
                                key={product.id_product}
                                product={product}
                                priority={index < 4}
                            />
                        ))}
                    </div>

                    {hasMore && (
                        <div ref={sentinelRef} className="pt-2">
                            {loadingMore && <SkeletonGrid count={NEXT_PAGE} />}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function SkeletonGrid({ count }: { count: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-100" />
                    <div className="p-4 space-y-2">
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function ProductCard({ product, priority }: { product: CatalogProduct; priority: boolean }) {
    const router = useRouter();
    const { addItem } = useCart();
    const [added, setAdded] = useState(false);
    const href = productPath(product.id_product, product.name);
    const image = optimizeImage(product.image_url, "f_auto,q_auto,c_fill,ar_1:1,w_520");

    function handleQuickAdd(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        // Si tiene fragancias hay que elegir una: se abre el producto
        if (product.has_variants) {
            router.push(href);
            return;
        }

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
            href={href}
            className="group bg-white rounded-3xl overflow-hidden shadow-card border border-gray-100/50 hover:shadow-lg hover:-translate-y-1 transition-all relative"
        >
            <div className="aspect-square bg-gradient-soft relative overflow-hidden">
                {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={image}
                        alt={`${product.name} - ${product.category_name}`}
                        width={520}
                        height={520}
                        loading={priority ? "eager" : "lazy"}
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">🕯️</span>
                    </div>
                )}

                {product.available_now ? (
                    <div className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Entrega inmediata
                    </div>
                ) : (
                    <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        A pedido
                    </div>
                )}

                <button
                    onClick={handleQuickAdd}
                    className={`absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 ${added
                            ? "bg-green-500 text-white"
                            : "bg-white text-accent-pink hover:bg-accent-pink hover:text-white"
                        }`}
                    title={product.has_variants ? "Elegir fragancia" : "Agregar al carrito"}
                    aria-label={product.has_variants ? "Elegir fragancia" : "Agregar al carrito"}
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
