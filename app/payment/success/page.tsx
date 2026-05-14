"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Home, ShoppingBag } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="glass rounded-3xl p-12 max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <CheckCircle size={72} className="text-green-400 mx-auto mb-6" />
        </motion.div>

        <h1 className="font-serif text-4xl text-white mb-4">
          Pembayaran Berhasil!
        </h1>
        <p className="text-white/60 leading-relaxed mb-8">
          Terima kasih! Pesanan Anda telah dikonfirmasi. Tim kami akan
          menghubungi Anda via WhatsApp dalam waktu 1x24 jam dengan detail
          lengkap.
        </p>

        <div className="flex flex-col gap-3">
          <a
            href="https://wa.me/6283161259104"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            Chat WhatsApp Admin
          </a>
          <Link
            href="/"
            className="glass py-3.5 rounded-xl text-white/70 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <Home size={16} />
            Kembali ke Beranda
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
