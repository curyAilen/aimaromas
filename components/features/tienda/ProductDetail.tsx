"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag, Check } from "lucide-react";
import { formatCurrency } from "@/lib/whatsapp";
import { useCart } from "@/lib/cart-context";

interface Variant {
    id_variant: number;
    scent: string;
}

interface ProductImage {
    id_image: number;
    url: string;
}

interface ProductData {
    id_product: number;
    name: string;
    description: string | null;
    price: string;
    size_name: string | null;
    size_cm: string | null;
    stock_status: string;
    category_name: string;
}

interface ProductDetailProps {
    productId: string;
}

export function ProductDetail({ productId }: ProductDetailProps) {
    const router = useRouter();
    const { addItem } = useCart();

    const [product, setProduct] = useState<ProductData | null>(null);
    const [images, setImages] = useState<ProductImage[]>([]);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/public/products/${productId}`);
                const data = await res.json();
                if (!res.ok) {
                    setLoading(false);
                    return;
                }
                setProduct(data.product);
                setImages(data.images || []);
                setVariants(data.variants || []);
                if (data.variants?.length > 0) {
                    setSelectedVariant(data.variants[0].id_variant);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [productId]);

    function handleAddToCart() {
        if (!product) return;

        const variant = variants.find((v) => v.id_variant === selectedVariant);

        addItem(
            {
                id_product: product.id_product,
                id_variant: selectedVariant,
                product_name: product.name,
                variant_scent: variant?.scent || null,
                price: Number(product.price),
                image_url: images[0]?.url || null,
                stock_status: product.stock_status,
            },
            quantity
        );

        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    }

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="aspect-square bg-white rounded-3xl animate-pulse" />
                    <div className="space-y-4">
                        <div className="h-6 bg-gray-100 rounded w-1/2 animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
                        <div className="h-8 bg-gray-100 rounded w-1/3 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-16 text-center">
                <p className="text-text-secondary">Producto no encontrado</p>
                <Link
                    href="/"
                    className="inline-block mt-4 text-accent-pink hover:underline text-sm"
                >
                    Volver a la tienda
                </Link>
            </div>
        );
    }

    const isOnDemand = product.stock_status === "on_demand";
    const currentImage = images[selectedImage]?.url;

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6">
            {/* Volver */}
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent-pink transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver a la tienda
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                {/* Galería */}
                <div className="space-y-3">
                    <div className="aspect-square bg-gradient-soft rounded-3xl overflow-hidden">
                        {currentImage ? (
                            <img
                                src={currentImage}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-6xl">🕯️</span>
                            </div>
                        )}
                    </div>

                    {images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto">
                            {images.map((img, i) => (
                                <button
                                    key={img.id_image}
                                    onClick={() => setSelectedImage(i)}
                                    className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-colors ${selectedImage === i
                                            ? "border-accent-pink"
                                            : "border-transparent"
                                        }`}
                                >
                                    <img
                                        src={img.url}
                                        alt={`Vista ${i + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="space-y-5">
                    <div>
                        <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">
                            {product.category_name}
                        </p>
                        <h1 className="text-2xl md:text-3xl font-bold text-text-primary leading-tight">
                            {product.name}
                        </h1>
                        {product.size_name && (
                            <p className="text-sm text-text-secondary mt-1">
                                {product.size_name}
                                {product.size_cm && ` • ${product.size_cm} cm`}
                            </p>
                        )}
                    </div>

                    <p className="text-3xl font-bold text-accent-pink">
                        {formatCurrency(product.price)}
                    </p>

                    {isOnDemand && (
                        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 text-xs text-orange-700">
                            ⏱️ Este producto es <b>a pedido</b>. Puede demorar unos días más
                            en estar listo.
                        </div>
                    )}

                    {product.description && (
                        <div>
                            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">
                                Descripción
                            </p>
                            <p className="text-sm text-text-primary whitespace-pre-wrap">
                                {product.description}
                            </p>
                        </div>
                    )}

                    {/* Selector de fragancia */}
                    {variants.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
                                Elegí tu fragancia
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {variants.map((v) => (
                                    <button
                                        key={v.id_variant}
                                        onClick={() => setSelectedVariant(v.id_variant)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedVariant === v.id_variant
                                                ? "bg-gradient-main text-white shadow-md shadow-accent-pink/20"
                                                : "bg-white border border-gray-200 text-text-secondary hover:border-accent-pink/50"
                                            }`}
                                    >
                                        {v.scent}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cantidad */}
                    <div>
                        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
                            Cantidad
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                                <Minus className="w-4 h-4 text-text-primary" />
                            </button>
                            <span className="text-lg font-semibold text-text-primary w-10 text-center">
                                {quantity}
                            </span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                                <Plus className="w-4 h-4 text-text-primary" />
                            </button>
                        </div>
                    </div>

                    {/* Botón agregar */}
                    <button
                        onClick={handleAddToCart}
                        className={`w-full flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-medium transition-all active:scale-95 ${added
                                ? "bg-green-500 text-white"
                                : "bg-gradient-main text-white hover:opacity-90"
                            }`}
                    >
                        {added ? (
                            <>
                                <Check className="w-5 h-5" />
                                ¡Agregado!
                            </>
                        ) : (
                            <>
                                <ShoppingBag className="w-5 h-5" />
                                Agregar al carrito
                            </>
                        )}
                    </button>

                    <Link
                        href="/carrito"
                        className="block text-center text-sm text-text-secondary hover:text-accent-pink transition-colors"
                    >
                        Ver carrito →
                    </Link>
                </div>
            </div>
        </div>
    );
}