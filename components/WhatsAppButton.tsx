"use client";

import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const waNumber = "6283161259104";
  const message = encodeURIComponent(
    "Halo MeLamun Villa! Saya tertarik untuk mengetahui lebih lanjut tentang paket menginap/wisata. Bisa bantu saya?"
  );

  return (
    <a
      href={`https://wa.me/${waNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-lg shadow-green-500/30 transition-all hover:scale-105 group"
      aria-label="Chat via WhatsApp"
    >
      <MessageCircle size={22} />
      <span className="text-sm font-semibold hidden sm:block">
        Chat WhatsApp
      </span>
    </a>
  );
}
