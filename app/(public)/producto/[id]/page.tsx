import { ProductDetail } from "@/components/features/tienda/ProductDetail";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ProductoPage({ params }: Props) {
    const { id } = await params;
    return <ProductDetail productId={id} />;
}