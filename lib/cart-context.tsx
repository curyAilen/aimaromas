"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";

export interface CartItem {
    id_product: number;
    id_variant: number | null;
    product_name: string;
    variant_scent: string | null;
    price: number;
    image_url: string | null;
    quantity: number;
    stock_status: string;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
    removeItem: (id_product: number, id_variant: number | null) => void;
    updateQuantity: (
        id_product: number,
        id_variant: number | null,
        quantity: number
    ) => void;
    clearCart: () => void;
    totalItems: number;
    subtotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "aima_cart";

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [hydrated, setHydrated] = useState(false);

    // Cargar del localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) setItems(JSON.parse(stored));
        } catch (error) {
            console.error("Error leyendo carrito:", error);
        }
        setHydrated(true);
    }, []);

    // Guardar en localStorage cuando cambia
    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            console.error("Error guardando carrito:", error);
        }
    }, [items, hydrated]);

    function addItem(
        item: Omit<CartItem, "quantity">,
        quantity: number = 1
    ) {
        setItems((prev) => {
            const existing = prev.findIndex(
                (i) =>
                    i.id_product === item.id_product && i.id_variant === item.id_variant
            );

            if (existing >= 0) {
                const updated = [...prev];
                updated[existing].quantity += quantity;
                return updated;
            }

            return [...prev, { ...item, quantity }];
        });
    }

    function removeItem(id_product: number, id_variant: number | null) {
        setItems((prev) =>
            prev.filter(
                (i) => !(i.id_product === id_product && i.id_variant === id_variant)
            )
        );
    }

    function updateQuantity(
        id_product: number,
        id_variant: number | null,
        quantity: number
    ) {
        if (quantity < 1) {
            removeItem(id_product, id_variant);
            return;
        }
        setItems((prev) =>
            prev.map((i) =>
                i.id_product === id_product && i.id_variant === id_variant
                    ? { ...i, quantity }
                    : i
            )
        );
    }

    function clearCart() {
        setItems([]);
    }

    const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
    const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                totalItems,
                subtotal,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
    return ctx;
}