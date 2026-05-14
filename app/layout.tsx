import type { Metadata } from "next";
import "./globals.css";
import dynamic from "next/dynamic";
import Providers from "@/components/Providers";

const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });
const Footer = dynamic(() => import("@/components/Footer"), { ssr: false });
const WhatsAppButton = dynamic(() => import("@/components/WhatsAppButton"), { ssr: false });

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
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-ocean-deep text-white antialiased">
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <WhatsAppButton />
        </Providers>
      </body>
    </html>
  );
}
