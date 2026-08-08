import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";
import Providers from "@/components/Providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });
const Footer = dynamic(() => import("@/components/Footer"), { ssr: false });
const WhatsAppButton = dynamic(() => import("@/components/WhatsAppButton"), { ssr: false });

// HOTFIX: Agresif font optimization untuk eliminate blocking
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"], // Fallback cepat
  adjustFontFallback: true, // Auto-adjust metrics
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "serif"], // Fallback cepat
  adjustFontFallback: true, // Auto-adjust metrics
});

export const metadata: Metadata = {
  title: "MeLamun Kelong Villa | Kampong Teripang Bintan",
  description:
    "Edu-ekowisata teripang pertama di dunia. Menginap di atas laut, belajar budidaya teripang, dan rasakan kearifan lokal Bintan. Wisata Bintan terbaik.",
  keywords:
    "Wisata Bintan, Kelong Bintan, Teripang, Villa Bintan, Edu Wisata, MeLamun Villa, Kampong Teripang, Sea Healing",
  openGraph: {
    title: "MeLamun Kelong Villa | Kampong Teripang Bintan",
    description:
      "Edu-ekowisata teripang pertama di dunia. Menginap di atas laut, belajar budidaya teripang, dan rasakan kearifan lokal Bintan.",
    url: "https://melamumbintanindonesia.com",
    siteName: "MeLamun Kelong Villa",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${cormorant.variable}`}>
      <head>
        {/* HOTFIX: Preload hero image untuk instant LCP */}
        <link
          rel="preload"
          as="image"
          href="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=85&fm=webp"
          type="image/webp"
          fetchPriority="high"
        />
      </head>
      <body className="bg-ocean-deep text-white antialiased">
        <ErrorBoundary>
          <Providers>
            <Navbar />
            <main>{children}</main>
            <Footer />
            <WhatsAppButton />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
