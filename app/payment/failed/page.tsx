"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { XCircle, Home, RefreshCw } from "lucide-react";

export default function PaymentFailedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-12 max-w-md w-full text-center"
      >
        <XCircle size={72} className="text-red-400 mx-auto mb-6" />
        <h1 className="font-serif text-4xl text-white mb-4">
          Pembayaran Gagal
        </h1>
        <p className="text-white/60 leading-relaxed mb-8">
          Pembayaran tidak berhasil diproses. Silakan coba lagi atau hubungi
          kami via WhatsApp untuk bantuan.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/villa#booking"
            className="btn-gold py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Coba Lagi
          </Link>
          <a
            href="https://wa.me/6283161259104"
            target="_blank"
            rel="noopener noreferrer"
            className="glass py-3.5 rounded-xl text-white/70 hover:text-white transition-colors"
          >
            Hubungi WhatsApp
          </a>
          <Link
            href="/"
            className="text-white/40 hover:text-white/60 text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Home size={14} />
            Kembali ke Beranda
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
