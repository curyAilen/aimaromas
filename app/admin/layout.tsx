import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-bg-main">
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