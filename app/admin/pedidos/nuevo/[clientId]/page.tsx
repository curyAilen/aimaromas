import { OrderForm } from "@/components/features/pedidos/OrderForm";

interface Props {
    params: Promise<{ clientId: string }>;
}

export default async function NuevoPedidoClientePage({ params }: Props) {
    const { clientId } = await params;
    return <OrderForm preselectedClientId={Number(clientId)} />;
}