import { CartProvider } from "@/lib/cart-context";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { WhatsAppConfig } from "@/components/layout/WhatsAppConfig";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <CartProvider>
            <div className="min-h-screen bg-bg-main">
                <WhatsAppConfig />
                <PublicHeader />
                <main className="pb-12">{children}</main>
            </div>
        </CartProvider>
    );
}