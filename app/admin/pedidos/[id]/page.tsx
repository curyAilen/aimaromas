import { OrderDetail } from "@/components/features/pedidos/OrderDetail";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function PedidoDetallePage({ params }: Props) {
    const { id } = await params;
    return <OrderDetail orderId={id} />;
}