"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Plus,
  Minus,
  Check,
  ArrowRight,
  X,
  CheckCircle,
} from "lucide-react";
import { PRODUCTS } from "@/lib/data";

interface CartItem {
  id: string;
  nama: string;
  harga: number;
  qty: number;
  foto_url: string;
}

export default function StorePage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [checkoutForm, setCheckoutForm] = useState({
    nama: "",
    email: "",
    no_wa: "",
    alamat: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const addToCart = (product: (typeof PRODUCTS)[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          nama: product.nama,
          harga: product.harga,
          qty: 1,
          foto_url: product.foto_url,
        },
      ];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: item.qty + delta } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const itemList = cart
        .map((item) => `  • ${item.nama} x${item.qty} = Rp ${(item.harga * item.qty).toLocaleString("id-ID")}`)
        .join("\n");

      const message = [
        "🛍️ *PEMESANAN HOUSOME STORE*",
        "─────────────────────",
        "*Produk yang dipesan:*",
        itemList,
        "─────────────────────",
        `💰 *Total:* Rp ${cartTotal.toLocaleString("id-ID")}`,
        "─────────────────────",
        `👤 *Nama:* ${checkoutForm.nama}`,
        `📱 *No. WA:* ${checkoutForm.no_wa}`,
        `📧 *Email:* ${checkoutForm.email}`,
        `📦 *Alamat:* ${checkoutForm.alamat}`,
        "",
        "Mohon konfirmasi pesanan dan detail pengiriman. Terima kasih! 🙏",
      ].join("\n");

      const waUrl = `https://wa.me/6283161259104?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");
      setSuccess(true);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const detailProduct = PRODUCTS.find((p) => p.id === selectedProduct);

  return (
    <>
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[350px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=1920&q=85"
          alt="Housome Store"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ocean-deep/70 via-ocean-deep/40 to-ocean-deep/80" />
        <div className="absolute inset-0 flex items-end pb-16 px-6 sm:px-10 lg:px-16">
          <div className="max-w-7xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-px bg-sand" />
                <span className="text-sand text-sm tracking-widest uppercase">
                  The Shop
                </span>
              </div>
              <h1 className="font-serif text-5xl sm:text-6xl text-white mb-4">
                Housome Store
              </h1>
              <p className="text-white/70 text-lg max-w-xl">
                Kolagen teripang murni dari laut Bintan. Bawa pulang kesehatan
                dalam setiap tetes.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Cart Button */}
      {cartCount > 0 && (
        <div className="sticky top-20 z-40 flex justify-end px-8 sm:px-14 lg:px-24 max-w-6xl mx-auto py-4">
          <button
            onClick={() => setCartOpen(true)}
            className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg"
          >
            <ShoppingCart size={18} />
            Keranjang ({cartCount}) · Rp {cartTotal.toLocaleString("id-ID")}
          </button>
        </div>
      )}

      {/* Products */}
      <section className="py-16 px-8 sm:px-14 lg:px-24 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="section-divider mb-6" />
          <h2 className="font-serif text-4xl text-white mb-4">
            Produk Kolagen Teripang
          </h2>
          <p className="text-white/50 max-w-xl">
            Diformulasikan dari teripang segar hasil budidaya Kampong Teripang.
            Tanpa pengawet buatan, tanpa bahan kimia berbahaya.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {PRODUCTS.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-3xl overflow-hidden card-hover"
            >
              {/* Product Image */}
              <div
                className="img-zoom h-64 overflow-hidden cursor-pointer relative"
                onClick={() => setSelectedProduct(product.id)}
              >
                <Image
                  src={product.foto_url}
                  alt={product.nama}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
                {/* Stok Badge */}
                <div className="absolute top-3 right-3">
                  <span className="bg-green-500/90 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    Stok Ready
                  </span>
                </div>
              </div>

              <div className="p-6">
                <span className="text-sand text-xs tracking-widest uppercase">
                  {product.kategori}
                </span>
                <h3 className="font-serif text-2xl text-white mt-1 mb-1">
                  {product.nama}
                </h3>
                <p className="text-white/50 text-sm italic mb-3">
                  {product.tagline}
                </p>
                <p className="text-white/60 text-sm leading-relaxed mb-4 line-clamp-3">
                  {product.deskripsi}
                </p>

                {/* Benefits */}
                <ul className="space-y-1.5 mb-6">
                  {product.manfaat.slice(0, 3).map((m, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-2 text-white/60 text-xs"
                    >
                      <Check size={12} className="text-sand shrink-0" />
                      {m}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/40 text-xs">{product.berat}</p>
                    <p className="font-serif text-2xl text-sand">
                      Rp {product.harga.toLocaleString("id-ID")}
                    </p>
                    <p className="text-green-400 text-xs mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      Stok tersedia: {product.stok} unit
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedProduct(product.id)}
                    className="text-sand text-sm hover:text-sand-light transition-colors"
                  >
                    Detail →
                  </button>
                </div>

                <button
                  onClick={() => addToCart(product)}
                  className="btn-gold w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                >
                  <ShoppingCart size={16} />
                  Tambah ke Keranjang
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Collagen Info Section */}
      <section className="py-20 bg-ocean-mid/30">
        <div className="max-w-6xl mx-auto px-8 sm:px-14 lg:px-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="section-divider mb-6" />
              <h2 className="font-serif text-4xl text-white mb-6">
                Mengapa Kolagen{" "}
                <span className="text-sand italic">Teripang</span>?
              </h2>
              <p className="text-white/60 leading-relaxed mb-4">
                Teripang (sea cucumber) mengandung kolagen tipe I yang identik
                dengan kolagen manusia — membuatnya lebih mudah diserap tubuh
                dibanding kolagen dari sumber lain.
              </p>
              <p className="text-white/60 leading-relaxed mb-4">
                Selain kolagen, teripang kaya akan chondroitin sulfate,
                mucopolysaccharides, dan mineral laut yang bekerja sinergis
                untuk regenerasi sel, kesehatan sendi, dan kecantikan kulit.
              </p>
              <p className="text-white/60 leading-relaxed">
                Produk kami diekstrak dari teripang segar hasil budidaya
                berkelanjutan di perairan bersih Bintan — tanpa polutan, tanpa
                bahan kimia berbahaya.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { value: "95%", label: "Tingkat Penyerapan" },
                { value: "3x", label: "Lebih Efektif dari Kolagen Sapi" },
                { value: "100%", label: "Bahan Alami" },
                { value: "0", label: "Pengawet Buatan" },
              ].map((stat, i) => (
                <div key={i} className="glass rounded-2xl p-6 text-center">
                  <p className="font-serif text-4xl text-sand mb-2">
                    {stat.value}
                  </p>
                  <p className="text-white/60 text-sm">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Product Detail Modal */}
      {selectedProduct && detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-ocean-mid border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="relative h-64 overflow-hidden rounded-t-3xl">
              <Image
                src={detailProduct.foto_url}
                alt={detailProduct.nama}
                fill
                className="object-cover"
              />
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-8">
              <span className="text-sand text-xs tracking-widest uppercase">
                {detailProduct.kategori}
              </span>
              <h3 className="font-serif text-3xl text-white mt-1 mb-1">
                {detailProduct.nama}
              </h3>
              <p className="text-white/50 italic mb-4">{detailProduct.tagline}</p>
              <p className="text-white/60 leading-relaxed mb-6">
                {detailProduct.deskripsi}
              </p>

              <h4 className="text-white font-semibold mb-3">Manfaat Utama</h4>
              <ul className="space-y-2 mb-6">
                {detailProduct.manfaat.map((m, i) => (
                  <li key={i} className="flex items-center gap-2 text-white/60 text-sm">
                    <Check size={14} className="text-sand shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/40 text-xs">{detailProduct.berat}</p>
                  <p className="font-serif text-3xl text-sand">
                    Rp {detailProduct.harga.toLocaleString("id-ID")}
                  </p>
                </div>
                <button
                  onClick={() => {
                    addToCart(detailProduct);
                    setSelectedProduct(null);
                  }}
                  className="btn-gold px-7 py-3 rounded-full font-semibold flex items-center gap-2"
                >
                  <ShoppingCart size={16} />
                  Tambah ke Keranjang
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="flex-1 bg-black/50"
            onClick={() => setCartOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="w-full max-w-md bg-ocean-mid border-l border-white/10 h-full overflow-y-auto flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-serif text-2xl text-white">Keranjang</h3>
              <button
                onClick={() => setCartOpen(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 p-6 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 glass rounded-xl p-4"
                >
                  <Image
                    src={item.foto_url}
                    alt={item.nama}
                    width={60}
                    height={60}
                    className="rounded-lg object-cover w-16 h-16"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{item.nama}</p>
                    <p className="text-sand text-sm">
                      Rp {item.harga.toLocaleString("id-ID")}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-7 h-7 rounded-full glass flex items-center justify-center text-white hover:bg-white/10"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-white text-sm">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-7 h-7 rounded-full glass flex items-center justify-center text-white hover:bg-white/10"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-white/70 text-sm">
                    Rp {(item.harga * item.qty).toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>

            {/* Checkout Form */}
            {!success ? (
              <div className="p-6 border-t border-white/10">
                <div className="flex justify-between text-white mb-4">
                  <span>Total</span>
                  <span className="font-serif text-xl text-sand">
                    Rp {cartTotal.toLocaleString("id-ID")}
                  </span>
                </div>
                <form onSubmit={handleCheckout} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nama Lengkap"
                    value={checkoutForm.nama}
                    onChange={(e) =>
                      setCheckoutForm({ ...checkoutForm, nama: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-sand"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="No. WhatsApp"
                    value={checkoutForm.no_wa}
                    onChange={(e) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        no_wa: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-sand"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={checkoutForm.email}
                    onChange={(e) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        email: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-sand"
                    required
                  />
                  <textarea
                    placeholder="Alamat pengiriman lengkap"
                    value={checkoutForm.alamat}
                    onChange={(e) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        alamat: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-sand resize-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-gold w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? "Memproses..." : "Chat WhatsApp & Pesan"}
                    {!loading && <ArrowRight size={16} />}
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-6 text-center">
                <CheckCircle size={48} className="text-green-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-2">Pesanan Berhasil!</p>
                <p className="text-white/60 text-sm">
                  Kami akan menghubungi Anda via WhatsApp.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </>
  );
}
