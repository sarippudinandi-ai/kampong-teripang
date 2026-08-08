import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel - MeLamun Villa",
  description: "Dashboard administrasi untuk MeLamun Villa Kampong Teripang",
  robots: "noindex, nofollow", // Prevent search engine indexing
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {children}
    </div>
  );
}
