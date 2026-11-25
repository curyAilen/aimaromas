import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Iniciar sesión",
    description: "Acceso al panel de administración de AIMA Aromas.",
    robots: { index: false, follow: false },
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <div className="min-h-screen bg-bg-main">{children}</div>;
}
