"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag, Check, Zap, Clock, MessageCircle } from "lucide-react";
import { buildWhatsAppUrl, formatCurrency } from "@/lib/whatsapp";
import { useCart } from "@/lib/cart-context";
import { optimizeImage } from "@/lib/slug";
import type { CatalogProduct, ProductVariantPublic } from "@/lib/catalog";

interface ProductImage {
    id_image: number;
    url: string;
}

interface ProductDetailProps {
    product: CatalogProduct & { stock: number };
    images: ProductImage[];
    variants: ProductVariantPublic[];
    whatsappNumber: string;
}

export function ProductDetail({ product, images, variants, whatsappNumber }: ProductDetailProps) {
    const { addItem } = useCart();

    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState<number | null>(
        variants.length > 0 ? variants[0].id_variant : null
    );
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);

    function handleAddToCart() {
        const variant = variants.find((v) => v.id_variant === selectedVariant);

        addItem(
            {
                id_product: product.id_product,
                id_variant: selectedVariant,
                product_name: product.name,
                variant_scent: variant?.scent || null,
                price: Number(product.price),
                image_url: images[0]?.url || null,
                stock_status: unitsAvailable >= quantity ? "in_stock" : "on_demand",
            },
            quantity
        );

        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    }

    // Stock de lo que está eligiendo: de la fragancia si tiene, o del producto
    const selected = variants.find((v) => v.id_variant === selectedVariant);
    const unitsAvailable = variants.length > 0 ? selected?.stock ?? 0 : product.stock;
    const fullyAvailable = unitsAvailable >= quantity;
    const partiallyAvailable = unitsAvailable > 0 && unitsAvailable < quantity;

    const inquiryUrl = buildWhatsAppUrl(
        `Hola! Quiero consultar la demora de "${product.name}"${selected ? ` (${selected.scent})` : ""}. Gracias!`,
        whatsappNumber
    );
    const currentImage = optimizeImage(images[selectedImage]?.url, "f_auto,q_auto,c_fill,ar_1:1,w_900");

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
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={currentImage}
                                alt={`${product.name} - ${product.category_name}`}
                                width={900}
                                height={900}
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
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={optimizeImage(img.url, "f_auto,q_auto,c_fill,ar_1:1,w_160") ?? img.url}
                                        alt={`${product.name} - vista ${i + 1}`}
                                        width={160}
                                        height={160}
                                        loading="lazy"
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

                    {/* Disponibilidad según stock */}
                    {fullyAvailable ? (
                        <div className="bg-green-50 border border-green-100 rounded-2xl p-3 text-xs text-green-700 flex items-center gap-2">
                            <Zap className="w-4 h-4 flex-shrink-0" />
                            <span>
                                <b>Entrega inmediata.</b> Lo tenemos listo para enviarte.
                            </span>
                        </div>
                    ) : (
                        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 text-xs text-orange-700 space-y-2">
                            <div className="flex items-start gap-2">
                                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>
                                    {partiallyAvailable ? (
                                        <>
                                            Tenemos <b>{unitsAvailable}</b> para entrega inmediata y el
                                            resto es <b>a pedido</b>.
                                        </>
                                    ) : (
                                        <>
                                            Este producto es <b>a pedido</b>.
                                        </>
                                    )}{" "}
                                    Consultá las demoras por privado al WhatsApp.
                                </span>
                            </div>
                            <a
                                href={inquiryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 font-semibold text-orange-800 hover:underline"
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                                Consultar demora por WhatsApp
                            </a>
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
                                        {!v.in_stock && (
                                            <span className="ml-1.5 text-[10px] opacity-70">a pedido</span>
                                        )}
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