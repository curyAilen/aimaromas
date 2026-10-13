import { ResellerDetail } from "@/components/features/revendedoras/ResellerDetail";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function RevendedoraDetailPage({ params }: Props) {
    const { id } = await params;
    return <ResellerDetail resellerId={id} />;
}