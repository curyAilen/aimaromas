import { ProductForm } from "@/components/features/productos/ProductForm";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditarProductoPage({ params }: Props) {
    const { id } = await params;
    return <ProductForm productId={id} />;
}