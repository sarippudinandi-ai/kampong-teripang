import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Listing {
  id: string;
  nama: string;
  deskripsi: string;
  harga: number;
  tipe: "stay" | "tour";
  fasilitas: string[];
  foto_url: string;
  kapasitas?: number;
  durasi?: string;
  created_at: string;
}

export interface Product {
  id: string;
  nama: string;
  deskripsi: string;
  manfaat: string[];
  harga: number;
  stok: number;
  foto_url: string;
  berat: string;
  kategori: string;
  created_at: string;
}

export interface Availability {
  id: string;
  listing_id: string;
  tanggal: string;
  status: "tersedia" | "penuh";
}

export interface Transaction {
  id: string;
  user_id?: string;
  nama_pemesan: string;
  email: string;
  no_wa: string;
  total_bayar: number;
  status_pembayaran: "pending" | "success" | "failed";
  snap_token?: string;
  tipe_order: "villa" | "produk" | "tour";
  detail_order: Record<string, unknown>;
  created_at: string;
}
