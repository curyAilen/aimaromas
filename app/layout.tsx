import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/slug";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "AIMA Aromas | Velas de soja, wax melts y jabones artesanales",
    template: "%s | AIMA Aromas",
  },
  description:
    "Velas de soja, wax melts y jabones artesanales hechos a mano en Argentina. Armá tu pedido y enviálo por WhatsApp.",
  applicationName: "AIMA Aromas",
  openGraph: {
    type: "website",
    siteName: "AIMA Aromas",
    locale: "es_AR",
    images: [{ url: "/logo.png", width: 963, height: 962, alt: "AIMA Aromas" }],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}