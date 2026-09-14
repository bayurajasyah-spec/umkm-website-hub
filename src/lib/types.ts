export type Role = "customer" | "kasir" | "driver" | "admin";

export type OrderStatus =
  | "menunggu"
  | "diproses"
  | "siap_antar"
  | "diambil_driver"
  | "diantar"
  | "selesai"
  | "ditolak"
  | "gagal_antar";

export type Category = {
  id: string;
  nama: string;
  icon: string | null;
};

export type Product = {
  id: string;
  nama: string;
  category_id: string | null;
  restaurant: string;
  deskripsi: string;
  harga: number;
  stok: number;
  foto_url: string | null;
  rating: number;
  aktif: boolean;
};

export type Food = {
  id: string;
  name: string;
  restaurant: string;
  description: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  time: string;
  badge?: string;
  discount?: string;
  originalPrice?: number;
  stock?: number;
  product?: Product;
};

export const dishes: Food[] = [];

export type CartItem = {
  product: Product;
  qty: number;
};

export type OrderItem = {
  id: string;
  nama_produk: string;
  harga: number;
  qty: number;
  subtotal: number;
};

export type Order = {
  id: string;
  order_code: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  address: string | null;
  kasir_id: string | null;
  driver_id: string | null;
  status: OrderStatus;
  metode_bayar: string;
  catatan: string | null;
  alasan: string | null;
  subtotal: number;
  total: number;
  created_at: string;
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  menunggu: "Menunggu Konfirmasi",
  diproses: "Diproses Kasir",
  siap_antar: "Siap Diantar",
  diambil_driver: "Diambil Driver",
  diantar: "Sedang Diantar",
  selesai: "Selesai",
  ditolak: "Ditolak",
  gagal_antar: "Gagal Antar",
};

export const STATUS_TONE: Record<OrderStatus, string> = {
  menunggu: "bg-amber-100 text-amber-700",
  diproses: "bg-blue-100 text-blue-700",
  siap_antar: "bg-indigo-100 text-indigo-700",
  diambil_driver: "bg-purple-100 text-purple-700",
  diantar: "bg-cyan-100 text-cyan-700",
  selesai: "bg-emerald-100 text-emerald-700",
  ditolak: "bg-rose-100 text-rose-700",
  gagal_antar: "bg-rose-100 text-rose-700",
};

export function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop&auto=format";
