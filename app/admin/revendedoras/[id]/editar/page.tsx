import { ResellerForm } from "@/components/features/revendedoras/ResellerForm";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditarRevendedoraPage({ params }: Props) {
    const { id } = await params;
    return <ResellerForm resellerId={id} />;
}