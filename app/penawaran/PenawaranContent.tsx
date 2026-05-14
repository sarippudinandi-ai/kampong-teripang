"use client";
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;background:#fff;color:#1a1a1a;font-size:14px;line-height:1.6}
  @media print{.no-print{display:none!important}.pb{page-break-before:always}}
  .cover{background:linear-gradient(135deg,#0a2a2a 0%,#1a5c5c 60%,#0d3d3d 100%);color:#fff;min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px 40px;position:relative;overflow:hidden}
  .cover-bg{position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=50') center/cover;opacity:.12}
  .cover-z{position:relative;z-index:1;max-width:700px}
  .badge{background:rgba(200,169,110,.2);border:1px solid rgba(200,169,110,.4);color:#c8a96e;padding:8px 20px;border-radius:50px;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:24px;display:inline-block}
  .cover h1{font-family:'Cormorant Garamond',serif;font-size:64px;font-weight:400;line-height:1.1;margin-bottom:16px;color:#fff}
  .cover h1 em{color:#c8a96e;font-style:italic}
  .cover-sub{font-size:16px;color:rgba(255,255,255,.7);font-weight:300;margin-bottom:40px;max-width:500px;margin-left:auto;margin-right:auto}
  .divider{width:60px;height:2px;background:linear-gradient(90deg,#c8a96e,transparent);margin:32px auto}
  .meta-row{display:flex;gap:40px;justify-content:center;flex-wrap:wrap}
  .meta-item .val{font-family:'Cormorant Garamond',serif;font-size:28px;color:#c8a96e}
  .meta-item .lbl{font-size:11px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:2px}
  .cover-foot{position:absolute;bottom:40px;left:0;right:0;text-align:center;color:rgba(255,255,255,.4);font-size:12px}
  .sec{padding:60px;max-width:900px;margin:0 auto}
  .sec-dark{background:#0a2a2a;color:#fff;padding:60px}
  .sec-dark .inner{max-width:900px;margin:0 auto}
  .sec-gray{background:#f8f5f0;padding:60px}
  .sec-gray .inner{max-width:900px;margin:0 auto}
  .tag{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c8a96e;margin-bottom:12px;display:block}
  h2{font-family:'Cormorant Garamond',serif;font-size:40px;font-weight:400;line-height:1.2;margin-bottom:16px}
  h3{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:400;margin-bottom:10px}
  p{color:#555;margin-bottom:12px;line-height:1.8}
  .dk p{color:rgba(255,255,255,.75)}
  .dk h2,.dk h3{color:#fff}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:28px}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:28px}
  .card{background:#fff;border:1px solid #e8e0d5;border-radius:16px;padding:24px;position:relative;overflow:hidden}
  .card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#c8a96e,#e8d5a3)}
  .card-dk{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:24px}
  .icon{font-size:28px;margin-bottom:10px}
  .ft{font-weight:600;font-size:14px;margin-bottom:6px;color:#1a1a1a}
  .card-dk .ft{color:#fff}
  .fd{font-size:13px;color:#777;line-height:1.7}
  .card-dk .fd{color:rgba(255,255,255,.55)}
  .stats{display:flex;border:1px solid #e8e0d5;border-radius:16px;overflow:hidden;margin:28px 0}
  .stat{flex:1;padding:24px 16px;text-align:center;border-right:1px solid #e8e0d5}
  .stat:last-child{border-right:none}
  .sv{font-family:'Cormorant Garamond',serif;font-size:34px;color:#c8a96e}
  .sl{font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-top:4px}
  .pgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:28px}
  .pc{border:2px solid #e8e0d5;border-radius:20px;padding:28px 20px;text-align:center;position:relative}
  .pc.hot{border-color:#c8a96e;background:linear-gradient(135deg,#0a2a2a,#1a5c5c);color:#fff}
  .pc.hot p{color:rgba(255,255,255,.65)}
  .pbadge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#c8a96e;color:#0a2a2a;font-size:11px;font-weight:700;padding:4px 16px;border-radius:50px;white-space:nowrap}
  .price{font-family:'Cormorant Garamond',serif;font-size:40px;color:#c8a96e;line-height:1}
  .pp{font-size:12px;color:#999;margin-top:4px}
  .pc.hot .pp{color:rgba(255,255,255,.5)}
  .plist{list-style:none;margin:16px 0;text-align:left}
  .plist li{padding:5px 0;font-size:12px;color:#555;border-bottom:1px solid #f0ebe4;display:flex;gap:6px}
  .pc.hot .plist li{color:rgba(255,255,255,.7);border-color:rgba(255,255,255,.1)}
  .plist li::before{content:'checkmark';color:#c8a96e;font-weight:700;flex-shrink:0}
  .btn{display:inline-block;background:linear-gradient(135deg,#c8a96e,#e8d5a3);color:#0a2a2a;padding:10px 24px;border-radius:50px;font-weight:700;font-size:12px;text-decoration:none;margin-top:16px}
  .tl{margin-top:28px}
  .tl-item{display:flex;gap:20px;margin-bottom:24px}
  .tl-num{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#c8a96e,#e8d5a3);color:#0a2a2a;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .tl-c h4{font-weight:600;font-size:14px;margin-bottom:3px}
  .tl-c p{font-size:12px;color:#777;margin:0}
  table{width:100%;border-collapse:collapse;margin-top:20px}
  th{background:#0a2a2a;color:#fff;padding:12px 14px;text-align:left;font-size:12px;font-weight:500}
  td{padding:10px 14px;border-bottom:1px solid #f0ebe4;font-size:12px}
  tr:nth-child(even) td{background:#faf8f5}
  .yes{color:#22c55e;font-weight:700}
  .no{color:#ef4444}
  .tgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}
  .tc{background:#fff;border:1px solid #e8e0d5;border-radius:14px;padding:20px}
  .stars{color:#c8a96e;font-size:14px;margin-bottom:6px}
  .tt{font-size:12px;color:#555;font-style:italic;line-height:1.8;margin-bottom:12px}
  .ta{display:flex;align-items:center;gap:10px}
  .av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#0a2a2a,#1a5c5c);color:#c8a96e;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}
  .an{font-weight:600;font-size:12px}
  .al{font-size:11px;color:#999}
  .cta-sec{background:linear-gradient(135deg,#0a2a2a,#1a5c5c);color:#fff;padding:80px 60px;text-align:center}
  .cta-sec h2{color:#fff;font-size:44px}
  .cta-sec p{color:rgba(255,255,255,.65);max-width:480px;margin:0 auto 28px}
  .cta-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
  .print-btn{position:fixed;bottom:28px;right:28px;background:#c8a96e;color:#0a2a2a;border:none;padding:12px 22px;border-radius:50px;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 8px 24px rgba(200,169,110,.4);z-index:999}
  hr.sep{border:none;border-top:1px solid #e8e0d5;margin:0}
  .mockup{background:#1a1a2e;border-radius:14px;padding:10px;margin:24px 0;box-shadow:0 16px 48px rgba(0,0,0,.25)}
  .mbar{display:flex;gap:5px;margin-bottom:8px}
  .md{width:9px;height:9px;border-radius:50%}
  .mscreen{background:#0a2a2a;border-radius:6px;overflow:hidden;min-height:140px;display:flex;align-items:center;justify-content:center}
  .mscreen img{width:100%;display:block}
  .mp{color:rgba(255,255,255,.2);font-size:12px;text-align:center;padding:28px}
  .frow{display:flex;gap:20px;align-items:flex-start;margin-bottom:28px;padding-bottom:28px;border-bottom:1px solid #f0ebe4}
  .frow:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
  .fnum{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#0a2a2a,#1a5c5c);color:#c8a96e;font-family:'Cormorant Garamond',serif;font-size:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .fbody h3{font-size:17px;margin-bottom:5px;color:#0a2a2a;font-family:'Cormorant Garamond',serif}
  .fbody p{font-size:13px;color:#666;margin-bottom:6px;line-height:1.7}
  .ftags{display:flex;gap:6px;flex-wrap:wrap}
  .ftag{background:#f0ebe4;color:#0a2a2a;font-size:11px;padding:3px 10px;border-radius:50px;font-weight:500}
  .img-preview{width:100%;border-radius:10px;object-fit:cover;display:block;margin-top:10px;border:1px solid #e8e0d5}
`;

export default function PenawaranContent() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <button className="print-btn no-print" onClick={() => window.print()}>🖨️ Cetak / Simpan PDF</button>

      {/* ── COVER ── */}
      <div className="cover">
        <div className="cover-bg" />
        <div className="cover-z">
          <span className="badge">Proposal Penawaran Website Profesional</span>
          <h1>Mē<em>lamun</em><br />Kelong Villa</h1>
          <p className="cover-sub">Platform Digital Edu-Ekowisata Teripang Pertama di Dunia<br />Kampong Teripang, Bintan, Kepulauan Riau</p>
          <div className="divider" />
          <div className="meta-row">
            <div className="meta-item"><div className="val">5</div><div className="lbl">Halaman Website</div></div>
            <div className="meta-item"><div className="val">9</div><div className="lbl">Fitur Utama</div></div>
            <div className="meta-item"><div className="val">Rp 0</div><div className="lbl">Biaya Hosting/Bln</div></div>
            <div className="meta-item"><div className="val">24/7</div><div className="lbl">Online Terus</div></div>
          </div>
        </div>
        <div className="cover-foot">Disiapkan oleh Tim Developer · melamumbintanindonesia.com · 2025</div>
      </div>

      {/* ── EXECUTIVE SUMMARY ── */}
      <div className="pb" />
      <div className="sec">
        <span className="tag">Executive Summary</span>
        <h2>Mengapa MeLamun Butuh Website Profesional?</h2>
        <p>Kepulauan Riau adalah salah satu destinasi wisata bahari paling potensial di Indonesia. Namun <strong>90% calon tamu mencari dan memesan akomodasi secara online</strong> — tanpa kehadiran digital yang kuat, bisnis villa dan edu-wisata kehilangan peluang besar setiap harinya.</p>
        <p>Website MeLamun Kelong Villa dirancang sebagai <strong>ekosistem digital lengkap</strong> yang menyatukan pemesanan villa, pendaftaran edu-trip, penjualan produk kolagen, dan manajemen ketersediaan kamar — semuanya dalam satu platform elegan dan mudah digunakan.</p>
        <div className="stats">
          <div className="stat"><div className="sv">Rp 0</div><div className="sl">Biaya Hosting/Bulan</div></div>
          <div className="stat"><div className="sv">&lt;3 dtk</div><div className="sl">Waktu Load Halaman</div></div>
          <div className="stat"><div className="sv">100%</div><div className="sl">Mobile Friendly</div></div>
          <div className="stat"><div className="sv">SEO</div><div className="sl">Optimasi Lokal Bintan</div></div>
          <div className="stat"><div className="sv">Real-time</div><div className="sl">Sync Database</div></div>
        </div>
      </div>
      <hr className="sep" />

      {/* ── TAMPILAN WEBSITE ── */}
      <div className="pb" />
      <div className="sec-dark">
        <div className="inner dk">
          <span className="tag">Tampilan Website</span>
          <h2>5 Halaman Website yang Dibangun</h2>
          <p>Setiap halaman dirancang dengan UI premium terinspirasi resort mewah internasional, dioptimasi untuk mobile dan desktop.</p>

          <div style={{marginTop:32}}>
            <div className="frow">
              <div className="fnum">1</div>
              <div className="fbody" style={{flex:1}}>
                <h3 style={{color:'#fff'}}>Landing Page — The Experience</h3>
                <p style={{color:'rgba(255,255,255,.65)'}}>Hero slider 3 foto dengan animasi parallax, gallery cards mengambang di kanan, stats bar, section pengenalan, 3 pilar utama (Stay/Edu/Store), narasi Bekarang, kalender ketersediaan real-time, testimonial, dan CTA section dengan background foto aerial.</p>
                <div className="ftags">
                  <span className="ftag">Hero Slider</span>
                  <span className="ftag">Kalender Live</span>
                  <span className="ftag">Testimonial</span>
                  <span className="ftag">CTA Section</span>
                </div>
                <div className="mockup" style={{marginTop:16}}>
                  <div className="mbar">
                    <div className="md" style={{background:'#ff5f57'}} />
                    <div className="md" style={{background:'#febc2e'}} />
                    <div className="md" style={{background:'#28c840'}} />
                  </div>
                  <div className="mscreen">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=60" alt="Landing Page" />
                  </div>
                </div>
              </div>
            </div>

            <div className="frow">
              <div className="fnum">2</div>
              <div className="fbody" style={{flex:1}}>
                <h3 style={{color:'#fff'}}>MeLamun Villa — The Stay</h3>
                <p style={{color:'rgba(255,255,255,.65)'}}>Hero foto villa, galeri foto interaktif (klik thumbnail), 3 paket kamar dengan fasilitas lengkap, booking widget dengan kalkulasi harga otomatis, dan section penjelasan Sea Healing.</p>
                <div className="ftags">
                  <span className="ftag">Galeri Interaktif</span>
                  <span className="ftag">Booking Form</span>
                  <span className="ftag">Kalkulasi Harga</span>
                  <span className="ftag">Sea Healing Info</span>
                </div>
              </div>
            </div>

            <div className="frow">
              <div className="fnum">3</div>
              <div className="fbody" style={{flex:1}}>
                <h3 style={{color:'#fff'}}>Edu-Tourism &amp; Open Trip</h3>
                <p style={{color:'rgba(255,255,255,.65)'}}>3 paket edu-trip (School of Fish, Lamun Warrior, Open Trip Bekarang) dengan info durasi, kapasitas, jadwal, dan apa yang termasuk. Form pendaftaran dengan modal popup langsung ke WhatsApp.</p>
                <div className="ftags">
                  <span className="ftag">3 Paket Trip</span>
                  <span className="ftag">Modal Booking</span>
                  <span className="ftag">WA Integration</span>
                </div>
              </div>
            </div>

            <div className="frow">
              <div className="fnum">4</div>
              <div className="fbody" style={{flex:1}}>
                <h3 style={{color:'#fff'}}>Housome Store — The Shop</h3>
                <p style={{color:'rgba(255,255,255,.65)'}}>Katalog 3 produk kolagen (Seacume, Fitsea, Forayya) dengan keranjang belanja, badge stok ready, modal detail produk, dan checkout via WhatsApp dengan format pesanan lengkap otomatis.</p>
                <div className="ftags">
                  <span className="ftag">Shopping Cart</span>
                  <span className="ftag">Stok Badge</span>
                  <span className="ftag">Product Modal</span>
                  <span className="ftag">Auto WA Format</span>
                </div>
              </div>
            </div>

            <div className="frow">
              <div className="fnum">5</div>
              <div className="fbody" style={{flex:1}}>
                <h3 style={{color:'#fff'}}>Our Story &amp; Blog</h3>
                <p style={{color:'rgba(255,255,255,.65)'}}>Timeline sejarah Kampong Teripang sejak 2015, misi &amp; visi, 3 artikel blog, FAQ interaktif accordion, dan narasi tradisi Bekarang yang membangun kepercayaan calon tamu.</p>
                <div className="ftags">
                  <span className="ftag">Timeline</span>
                  <span className="ftag">Blog</span>
                  <span className="ftag">FAQ Accordion</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <hr className="sep" />

      {/* ── FITUR UNGGULAN ── */}
      <div className="pb" />
      <div className="sec">
        <span className="tag">Fitur Unggulan</span>
        <h2>9 Fitur yang Sudah Dibangun</h2>
        <p>Semua fitur sudah live dan berfungsi penuh. Tidak ada biaya tambahan untuk aktivasi.</p>
        <div className="grid2" style={{marginTop:28}}>
          <div className="card">
            <div className="icon">📅</div>
            <div className="ft">Kalender Ketersediaan Real-Time</div>
            <div className="fd">9 kamar (3 paket × 3 kamar) ditampilkan dengan kode warna: hijau (tersedia), kuning (hampir penuh), oranye (sisa 1-2), merah terang (FULL). Data langsung dari database Supabase — admin ubah, langsung tampil di website.</div>
          </div>
          <div className="card">
            <div className="icon">💬</div>
            <div className="ft">Booking Otomatis via WhatsApp</div>
            <div className="fd">Form pemesanan menghasilkan pesan WhatsApp terformat otomatis dengan detail lengkap: nama tamu, paket, tanggal check-in/out, jumlah tamu, dan estimasi harga. Tidak perlu payment gateway — langsung konfirmasi manual.</div>
          </div>
          <div className="card">
            <div className="icon">⚙️</div>
            <div className="ft">CMS Admin Panel</div>
            <div className="fd">Dashboard admin dengan password untuk kelola: harga villa &amp; produk, stok, kalender ketersediaan per kamar, dan info kontak WhatsApp. Tidak perlu coding untuk update konten apapun.</div>
          </div>
          <div className="card">
            <div className="icon">🗄️</div>
            <div className="ft">Database Supabase (PostgreSQL)</div>
            <div className="fd">Data ketersediaan kamar tersimpan di cloud database Supabase gratis. Perubahan dari admin langsung sync ke halaman publik secara real-time. Tidak ada data yang hilang saat refresh.</div>
          </div>
          <div className="card">
            <div className="icon">🛍️</div>
            <div className="ft">Toko Online Produk Kolagen</div>
            <div className="fd">Katalog produk dengan keranjang belanja, badge stok ready, modal detail produk, dan checkout via WhatsApp dengan format pesanan lengkap otomatis termasuk daftar produk dan alamat pengiriman.</div>
          </div>
          <div className="card">
            <div className="icon">📱</div>
            <div className="ft">Mobile-First Design</div>
            <div className="fd">Didesain untuk HP terlebih dahulu. Semua halaman responsif sempurna di layar 320px hingga 4K. Tombol WhatsApp floating selalu terlihat di semua halaman untuk konversi maksimal.</div>
          </div>
          <div className="card">
            <div className="icon">🔍</div>
            <div className="ft">SEO Lokal Bintan</div>
            <div className="fd">Meta title, description, dan keywords dioptimasi untuk pencarian &quot;Wisata Bintan&quot;, &quot;Kelong Bintan&quot;, &quot;Villa Bintan&quot;, &quot;Teripang Bintan&quot;. Open Graph untuk tampilan menarik saat dibagikan di WhatsApp dan media sosial.</div>
          </div>
          <div className="card">
            <div className="icon">🎨</div>
            <div className="ft">Animasi Premium (Framer Motion)</div>
            <div className="fd">Animasi scroll reveal, parallax hero, transisi halaman halus, dan hover effects yang memberikan kesan website resort mewah internasional. Semua animasi dioptimasi agar tidak memperlambat loading.</div>
          </div>
          <div className="card">
            <div className="icon">🔒</div>
            <div className="ft">SSL &amp; Keamanan</div>
            <div className="fd">SSL certificate gratis dari Vercel (HTTPS). Tidak ada data sensitif yang tersimpan di frontend. API routes terproteksi. Siap untuk integrasi payment gateway Xendit di masa depan.</div>
          </div>
        </div>
      </div>
      <hr className="sep" />

      {/* ── KEUNGGULAN & BENEFIT ── */}
      <div className="pb" />
      <div className="sec-gray">
        <div className="inner">
          <span className="tag">Keunggulan &amp; Benefit</span>
          <h2>Mengapa Memilih Platform Ini?</h2>
          <table>
            <thead>
              <tr>
                <th>Fitur</th>
                <th>Website MeLamun</th>
                <th>Booking.com / Airbnb</th>
                <th>Instagram Only</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Komisi per booking</td><td className="yes">0%</td><td className="no">15-20%</td><td className="no">0% tapi manual</td></tr>
              <tr><td>Kontrol penuh konten</td><td className="yes">✓ Penuh</td><td className="no">Terbatas</td><td className="no">Terbatas</td></tr>
              <tr><td>Kalender ketersediaan</td><td className="yes">✓ Real-time</td><td className="yes">✓ Ada</td><td className="no">Manual</td></tr>
              <tr><td>Jual produk sendiri</td><td className="yes">✓ Toko online</td><td className="no">Tidak bisa</td><td className="no">Tidak bisa</td></tr>
              <tr><td>SEO Google</td><td className="yes">✓ Dioptimasi</td><td className="yes">✓ Mereka yang ranking</td><td className="no">Tidak ada</td></tr>
              <tr><td>Data tamu milik sendiri</td><td className="yes">✓ Database sendiri</td><td className="no">Milik platform</td><td className="no">Tidak ada</td></tr>
              <tr><td>Biaya bulanan</td><td className="yes">Rp 0 (free tier)</td><td className="no">Komisi per transaksi</td><td className="yes">Rp 0</td></tr>
              <tr><td>Branding profesional</td><td className="yes">✓ Custom design</td><td className="no">Template standar</td><td className="no">Terbatas</td></tr>
              <tr><td>Edu-tourism content</td><td className="yes">✓ Halaman khusus</td><td className="no">Tidak ada</td><td className="no">Tidak ada</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <hr className="sep" />

      {/* ── HARGA ── */}
      <div className="pb" />
      <div className="sec">
        <span className="tag">Investasi</span>
        <h2>Harga yang Relevan untuk Kepulauan Riau</h2>
        <p>Harga disesuaikan dengan kondisi pasar digital Kepulauan Riau dan potensi ROI bisnis wisata bahari Bintan.</p>
        <div className="pgrid">
          <div className="pc">
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22}}>Starter</h3>
            <div className="price">Rp 3,5 Jt</div>
            <div className="pp">Sekali bayar</div>
            <ul className="plist">
              <li>Landing page saja</li>
              <li>Booking via WhatsApp</li>
              <li>Mobile responsive</li>
              <li>Domain setup</li>
              <li>Hosting 1 tahun</li>
            </ul>
            <span className="btn" style={{display:'block',textAlign:'center'}}>Pilih Paket</span>
          </div>
          <div className="pc hot">
            <div className="pbadge">⭐ Direkomendasikan</div>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#fff'}}>Professional</h3>
            <div className="price">Rp 7,5 Jt</div>
            <div className="pp">Sekali bayar</div>
            <ul className="plist">
              <li>5 halaman lengkap</li>
              <li>Kalender real-time (Supabase)</li>
              <li>CMS Admin panel</li>
              <li>Toko online produk</li>
              <li>Edu-trip booking</li>
              <li>SEO optimasi</li>
              <li>Domain + hosting 1 tahun</li>
              <li>Revisi 3x</li>
            </ul>
            <span className="btn" style={{display:'block',textAlign:'center'}}>Pilih Paket</span>
          </div>
          <div className="pc">
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22}}>Enterprise</h3>
            <div className="price">Rp 15 Jt</div>
            <div className="pp">Sekali bayar</div>
            <ul className="plist">
              <li>Semua fitur Professional</li>
              <li>Payment gateway Xendit</li>
              <li>Notifikasi WA otomatis</li>
              <li>Multi-bahasa (ID/EN)</li>
              <li>Google Analytics</li>
              <li>Maintenance 6 bulan</li>
              <li>Revisi unlimited</li>
            </ul>
            <span className="btn" style={{display:'block',textAlign:'center'}}>Pilih Paket</span>
          </div>
        </div>

        <div style={{marginTop:32,background:'#f8f5f0',borderRadius:16,padding:24}}>
          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,marginBottom:12}}>Biaya Operasional Tahunan (Estimasi)</h3>
          <table>
            <thead><tr><th>Komponen</th><th>Status</th><th>Estimasi Biaya</th></tr></thead>
            <tbody>
              <tr><td>Domain .com/.id</td><td>Wajib</td><td>Rp 150.000 – 250.000/tahun</td></tr>
              <tr><td>Hosting (Vercel)</td><td>Gratis</td><td>Rp 0 (free tier)</td></tr>
              <tr><td>Database (Supabase)</td><td>Gratis</td><td>Rp 0 (free tier)</td></tr>
              <tr><td>SSL Certificate</td><td>Gratis</td><td>Rp 0 (dari Vercel)</td></tr>
              <tr><td>Payment Gateway Xendit</td><td>Opsional</td><td>±2-4% per transaksi sukses</td></tr>
              <tr><td>WhatsApp API</td><td>Opsional</td><td>Rp 50.000 – 100.000/bulan</td></tr>
              <tr><td><strong>Total Minimum/Tahun</strong></td><td></td><td><strong>Rp 150.000 – 250.000</strong></td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <hr className="sep" />

      {/* ── TIMELINE PENGERJAAN ── */}
      <div className="pb" />
      <div className="sec-dark">
        <div className="inner dk">
          <span className="tag">Timeline Pengerjaan</span>
          <h2>Proses Pengerjaan 14 Hari</h2>
          <div className="tl">
            <div className="tl-item">
              <div className="tl-num">1</div>
              <div className="tl-c"><h4 style={{color:'#fff'}}>Hari 1-2: Briefing &amp; Setup</h4><p>Pengumpulan konten, foto, logo, dan informasi bisnis. Setup domain, hosting Vercel, dan database Supabase.</p></div>
            </div>
            <div className="tl-item">
              <div className="tl-num">2</div>
              <div className="tl-c"><h4 style={{color:'#fff'}}>Hari 3-5: Development Frontend</h4><p>Pembangunan 5 halaman website dengan desain premium. Implementasi animasi dan responsivitas mobile.</p></div>
            </div>
            <div className="tl-item">
              <div className="tl-num">3</div>
              <div className="tl-c"><h4 style={{color:'#fff'}}>Hari 6-8: Fitur &amp; Integrasi</h4><p>Kalender ketersediaan, booking form, toko online, CMS admin, dan integrasi WhatsApp.</p></div>
            </div>
            <div className="tl-item">
              <div className="tl-num">4</div>
              <div className="tl-c"><h4 style={{color:'#fff'}}>Hari 9-11: Konten &amp; SEO</h4><p>Input konten asli, foto produk, optimasi SEO, dan meta data untuk semua halaman.</p></div>
            </div>
            <div className="tl-item">
              <div className="tl-num">5</div>
              <div className="tl-c"><h4 style={{color:'#fff'}}>Hari 12-13: Testing &amp; Revisi</h4><p>Testing di berbagai device dan browser. Revisi berdasarkan feedback klien.</p></div>
            </div>
            <div className="tl-item">
              <div className="tl-num">6</div>
              <div className="tl-c"><h4 style={{color:'#fff'}}>Hari 14: Launch</h4><p>Deploy ke production, koneksi domain, dan serah terima dengan panduan penggunaan CMS admin.</p></div>
            </div>
          </div>
        </div>
      </div>
      <hr className="sep" />

      {/* ── TESTIMONI ── */}
      <div className="sec">
        <span className="tag">Kepercayaan Tamu</span>
        <h2>Kata Mereka tentang MeLamun</h2>
        <div className="tgrid">
          <div className="tc">
            <div className="stars">★★★★★</div>
            <div className="tt">&ldquo;Pengalaman paling unik yang pernah saya rasakan. Tidur di atas laut, bangun dengan sunrise yang luar biasa. Benar-benar healing!&rdquo;</div>
            <div className="ta"><div className="av">R</div><div><div className="an">Rina Kusuma</div><div className="al">Jakarta</div></div></div>
          </div>
          <div className="tc">
            <div className="stars">★★★★★</div>
            <div className="tt">&ldquo;School of Fish membuka mata saya tentang pentingnya teripang. Pak nelayan sangat ramah dan informatif. Wajib dicoba!&rdquo;</div>
            <div className="ta"><div className="av">A</div><div><div className="an">Ahmad Fauzi</div><div className="al">Surabaya</div></div></div>
          </div>
          <div className="tc">
            <div className="stars">★★★★★</div>
            <div className="tt">&ldquo;Forayya serum sudah saya pakai 2 bulan, kulit terasa lebih lembab dan cerah. Produk alami terbaik yang pernah saya coba.&rdquo;</div>
            <div className="ta"><div className="av">S</div><div><div className="an">Sarah Tan</div><div className="al">Singapura</div></div></div>
          </div>
          <div className="tc">
            <div className="stars">★★★★★</div>
            <div className="tt">&ldquo;Website-nya sangat mudah digunakan. Saya bisa cek ketersediaan kamar langsung dan booking via WhatsApp dalam 2 menit.&rdquo;</div>
            <div className="ta"><div className="av">D</div><div><div className="an">Doni Pratama</div><div className="al">Batam</div></div></div>
          </div>
        </div>
      </div>
      <hr className="sep" />

      {/* ── CTA ── */}
      <div className="pb" />
      <div className="cta-sec">
        <h2>Siap Meluncurkan Website?</h2>
        <p>Hubungi kami sekarang untuk diskusi lebih lanjut dan mulai proses pengerjaan website MeLamun Kelong Villa.</p>
        <div className="cta-btns">
          <a href="https://wa.me/6283161259104?text=Halo%2C+saya+tertarik+dengan+penawaran+website+MeLamun+Kelong+Villa" className="btn" style={{fontSize:14,padding:'14px 32px'}}>
            💬 Chat WhatsApp Sekarang
          </a>
        </div>
        <div style={{marginTop:40,display:'flex',gap:40,justifyContent:'center',flexWrap:'wrap'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:'#c8a96e'}}>melamumbintanindonesia.com</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.4)',marginTop:4}}>Domain Website</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:'#c8a96e'}}>+62 831-6125-9104</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.4)',marginTop:4}}>WhatsApp Admin</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:'#c8a96e'}}>Bintan, Kepri</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.4)',marginTop:4}}>Lokasi</div>
          </div>
        </div>
      </div>
    </>
  );
}
