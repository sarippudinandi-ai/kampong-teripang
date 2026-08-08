"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Download, Calendar, RefreshCw } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Booking {
  id: string;
  booking_id: string;
  guest_name: string;
  guest_email: string;
  guest_wa: string;
  room_name: string;
  room_number: string;
  check_in: string;
  check_out: string;
  nights: number;
  guest_count: number;
  total_price: number;
  booking_status: string;
  payment_status: string;
  created_at: string;
}

// Status yang dianggap "Riwayat" (selesai / batal)
const HISTORY_STATUSES = ["CHECKED_OUT", "CANCELLED"];

export default function BookingsHistory() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Default range: 30 hari terakhir s/d hari ini
  const today = new Date().toISOString().split("T")[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const [fromDate, setFromDate] = useState(monthAgo);
  const [toDate, setToDate] = useState(today);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("vw_bookings_dashboard")
        .select("*")
        .in("booking_status", HISTORY_STATUSES)
        // Filter berdasarkan tanggal dibuat (created_at) dalam rentang
        .gte("created_at", `${fromDate}T00:00:00`)
        .lte("created_at", `${toDate}T23:59:59`);

      if (statusFilter !== "all") {
        query = query.eq("booking_status", statusFilter);
      }

      query = query.order("created_at", { ascending: false }).limit(500);

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching history:", error);
        setBookings([]);
        return;
      }
      setBookings(data || []);
    } catch (err) {
      console.error("Unexpected error:", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, statusFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const handleExportPDF = async () => {
    if (bookings.length === 0) return;
    setExporting(true);
    try {
      // Dynamic import agar tidak membebani bundle awal & aman dari SSR
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();

      // Header
      doc.setFontSize(16);
      doc.text("Riwayat Booking - Kelong Melamun", 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Periode: ${formatDate(fromDate)} s/d ${formatDate(toDate)}`,
        14,
        25
      );
      doc.text(`Total data: ${bookings.length} booking`, 14, 30);

      // Tabel
      autoTable(doc, {
        startY: 36,
        head: [
          [
            "Booking ID",
            "Tamu",
            "Kamar",
            "Check-in",
            "Check-out",
            "Total (Rp)",
            "Status",
          ],
        ],
        body: bookings.map((b) => [
          b.booking_id,
          b.guest_name,
          `${b.room_name} (${b.room_number})`,
          formatDate(b.check_in),
          formatDate(b.check_out),
          Number(b.total_price).toLocaleString("id-ID"),
          b.booking_status,
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [13, 59, 77] }, // ocean tone
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      const fileName = `riwayat-booking_${fromDate}_${toDate}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Gagal membuat PDF. Coba lagi.");
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      CHECKED_OUT: "bg-white/10 text-white/70 border-white/20",
      CANCELLED: "bg-red-500/20 text-red-300 border-red-500/40",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${
          map[status] || "bg-white/10 text-white/70 border-white/20"
        }`}
      >
        {status === "CHECKED_OUT" ? "Selesai" : "Dibatalkan"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="block text-white/50 text-xs mb-1">Dari Tanggal</label>
              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-sand [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                max={today}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-sand [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-sand"
              >
                <option value="all" className="bg-ocean-deep">Semua Riwayat</option>
                <option value="CHECKED_OUT" className="bg-ocean-deep">Selesai (Check-out)</option>
                <option value="CANCELLED" className="bg-ocean-deep">Dibatalkan</option>
              </select>
            </div>
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="glass px-4 py-2 rounded-xl text-white/70 hover:text-white text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Terapkan
            </button>
          </div>

          <button
            onClick={handleExportPDF}
            disabled={exporting || bookings.length === 0}
            className="btn-gold px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Membuat PDF...
              </>
            ) : (
              <>
                <Download size={16} /> Export PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Count */}
      <div className="glass rounded-2xl px-4 py-3">
        <p className="text-sm text-white/70">
          <Calendar size={14} className="inline mr-1 -mt-0.5" />
          <strong className="text-sand">{bookings.length}</strong> riwayat ditemukan
        </p>
      </div>

      {/* Table */}
      <div className="glass rounded-3xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sand mx-auto mb-3"></div>
            <p className="text-white/50 text-sm">Memuat riwayat...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-3xl">📂</span>
            <p className="text-white/60 font-medium mt-2">
              Tidak ada riwayat pada rentang ini
            </p>
            <p className="text-white/30 text-xs mt-1">
              Coba ubah rentang tanggal di atas
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  {["Booking ID", "Tamu", "Kamar", "Check-in", "Check-out", "Total", "Status"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-sand">
                      {b.booking_id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-white">{b.guest_name}</span>
                        <span className="text-xs text-white/40">{b.guest_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/80">
                      {b.room_name}
                      <span className="text-white/40"> ({b.room_number})</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      {formatDate(b.check_in)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      {formatDate(b.check_out)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      Rp {Number(b.total_price).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(b.booking_status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
