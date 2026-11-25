import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { WhatsAppConfig } from "@/components/layout/WhatsAppConfig";

export const metadata: Metadata = {
    title: "Panel de administración",
    description:
        "Gestión de pedidos, clientas, catálogo, revendedoras y estadísticas de AIMA Aromas.",
    // El panel es privado: que Google no lo indexe
    robots: { index: false, follow: false },
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-bg-main">
            <WhatsAppConfig />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 min-h-screen">
                    <Header />
                    <div className="p-6">{children}</div>
                </main>
            </div>
        </div>
    );
}
