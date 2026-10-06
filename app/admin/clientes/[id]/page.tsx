import { ClientDetail } from "@/components/features/clientes/ClientDetail";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ClienteDetallePage({ params }: Props) {
    const { id } = await params;
    return <ClientDetail clientId={id} />;
}