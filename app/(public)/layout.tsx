import { CartProvider } from "@/lib/cart-context";
import { PublicHeader } from "@/components/layout/PublicHeader";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <CartProvider>
            <div className="min-h-screen bg-bg-main">
                <PublicHeader />
                <main className="pb-12">{children}</main>
            </div>
        </CartProvider>
    );
}