import { ClientForm } from "@/components/features/clientes/ClientForm";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditarClientePage({ params }: Props) {
    const { id } = await params;
    return <ClientForm clientId={id} />;
}