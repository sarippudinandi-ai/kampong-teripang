import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";
import Providers from "@/components/Providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });
const Footer = dynamic(() => import("@/components/Footer"), { ssr: false });
const WhatsAppButton = dynamic(() => import("@/components/WhatsAppButton"), { ssr: false });

// Optimized font loading dengan next/font/google
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap", // Mencegah FOUT (Flash of Unstyled Text)
  preload: true,
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
  preload: true,
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
