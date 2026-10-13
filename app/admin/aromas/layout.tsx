import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AromasLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect("/admin/login");
    }

    if (session.role !== "CEO") {
        redirect("/admin/relax");
    }

    return <>{children}</>;
}