export interface Client {
    id_client: number;
    name: string;
    email: string | null;
    phone: string;
    address: string | null;
    birthday: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ClientInput {
    name: string;
    email?: string;
    phone: string;
    address?: string;
    birthday?: string;
    notes?: string;
}

export interface User {
    id_user: number;
    email: string;
    name: string;
    role: "CEO" | "GERENTA";
    createdAt: string;
    updatedAt: string;
}
export interface Category {
    id_category: number;
    name: string;
    slug: string;
    sort_order: number;
}

export interface AttributeType {
    id_attribute: number;
    name: string;
    slug: string;
    sort_order: number;
}

export interface AttributeValue {
    id_value: number;
    id_attribute: number;
    value: string;
    sort_order: number;
}

export interface ProductVariant {
    id_variant: number;
    id_product: number;
    scent: string;
    sku: string | null;
    price: string;
    stock: number;
    active: number;
}

export interface VariantImage {
    id_image: number;
    id_variant: number;
    url: string;
    public_id: string | null;
    sort_order: number;
}
export type StockStatus = "in_stock" | "on_demand" | "discontinued";

export interface Product {
    id_product: number;
    id_category: number;
    name: string;
    size_name: string | null;
    size_cm: string | null;
    price: string;
    description: string | null;
    active: number;
    stock_status: StockStatus;
    createdAt: string;
    updatedAt: string;
    category_name?: string;
    variant_count?: number;
    image_count?: number;
}

export interface ProductInput {
    id_category: number;
    name: string;
    size_name?: string;
    size_cm?: string;
    price: number;
    description?: string;
    active?: boolean;
    stock_status?: StockStatus;
}
export interface ProductImage {
    id_image: number;
    id_product: number;
    url: string;
    public_id: string | null;
    sort_order: number;
}
export type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled";



export interface Order {
    id_order: number;
    id_client: number;
    id_user: number;
    total: string;
    delivery_cost: string;
    requires_delivery: number;
    delivery_address: string | null;
    status: OrderStatus;
    delivered_at: string | null;
    paid_at: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    client_name?: string;
    client_phone?: string;
    user_name?: string;
    items?: OrderItem[];
}

export interface OrderItem {
    id_item: number;
    id_order: number;
    id_product: number;
    id_variant: number | null;
    product_name: string;
    variant_scent: string | null;
    quantity: number;
    unit_price: string;
    subtotal: string;
}

export interface OrderItemInput {
    id_product: number;
    id_variant: number | null;
    quantity: number;
    unit_price: number;
    product_name: string;
    variant_scent: string | null;
}

export interface OrderInput {
    id_client: number;
    requires_delivery: boolean;
    delivery_address?: string;
    notes?: string;
    items: OrderItemInput[];
}
