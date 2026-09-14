import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronRight, CircleDollarSign, ClipboardList, MapPin, Search, ShoppingCart, SlidersHorizontal, TrendingUp, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { FoodCard } from "@/components/FoodCard";
import { rupiah } from "@/lib/types";
import { toFood, usePosOrders, usePosProducts } from "@/lib/pos-data";
import { useStoreActions, useStoreState } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Dashboard Kasir — BY.CASHIER" }, { name: "description", content: "Dashboard POS F&B realtime BY.CASHIER." }] }),
});

function DashboardPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { products, categories, loading } = usePosProducts();
  const orders = usePosOrders();
  const { favorites } = useStoreState();
  const { toggleFavorite, addToCart } = useStoreActions();
  const visible = useMemo(() => products.filter((product) => (!activeCategory || product.category_id === activeCategory) && product.nama.toLowerCase().includes(query.toLowerCase())), [products, activeCategory, query]);
  const today = new Date().toDateString();
  const todayOrders = orders.filter((order) => new Date(order.created_at).toDateString() === today && order.status !== "ditolak");
  const revenue = todayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  return <AppLayout>
    <div className="flex items-center justify-between px-5 pb-2 pt-5 lg:px-8 lg:pt-8">
      <div><div className="flex items-center gap-1.5 text-xs text-gray-500"><MapPin size={12} className="text-brand" /> Outlet utama</div><h1 className="mt-1 font-display text-2xl font-bold text-brand lg:text-3xl">Dashboard Kasir</h1><p className="mt-1 text-sm text-gray-500">Pantau operasional outlet secara realtime.</p></div>
      <div className="flex items-center gap-2"><button aria-label="Notifikasi" className="grid size-10 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-100"><Bell size={18} className="text-gray-600" /></button><Link to="/checkout" aria-label="Keranjang" className="relative grid size-10 place-items-center rounded-2xl bg-brand"><ShoppingCart size={18} className="text-white" /></Link></div>
    </div>
    <div className="grid gap-6 px-5 pb-28 pt-4 lg:px-8 lg:pb-10">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CircleDollarSign} label="Omzet hari ini" value={rupiah(revenue)} tone="bg-brand" />
        <StatCard icon={ClipboardList} label="Order hari ini" value={String(todayOrders.length)} tone="bg-[#3e1595]" />
        <StatCard icon={TrendingUp} label="Menu aktif" value={String(products.length)} tone="bg-[#7655bb]" />
        <StatCard icon={Users} label="Order berjalan" value={String(orders.filter((order) => !["selesai", "ditolak"].includes(order.status)).length)} tone="bg-[#a07bd5]" />
      </section>
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl bg-brand px-6 py-7"><div className="relative z-10 max-w-[70%]"><span className="inline-block rounded-full bg-accent-yellow px-3 py-1 text-[11px] font-bold text-brand">SHIFT KASIR AKTIF</span><h2 className="mt-3 font-display text-2xl font-bold leading-tight text-white">Siap melayani order berikutnya</h2><p className="mt-2 text-sm text-white/60">Transaksi baru akan langsung masuk ke kitchen display.</p><Link to="/order" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-accent-yellow px-4 py-2.5 text-sm font-bold text-brand">Buka Kasir <ChevronRight size={14} /></Link></div></div>
          <section><div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold text-brand">Kategori Menu</h2><Link to="/settings" className="text-sm text-[#7c5cbf]">Kelola menu →</Link></div><div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"><button onClick={() => setActiveCategory(null)} className={`flex flex-shrink-0 flex-col items-center gap-1.5 rounded-2xl px-4 py-3 text-center text-[11px] font-medium ${!activeCategory ? "bg-brand text-white" : "bg-white text-gray-600 shadow-sm ring-1 ring-gray-100"}`}><span className="text-xl">◎</span>Semua</button>{categories.map((category) => <button key={category.id} onClick={() => setActiveCategory(category.id)} className={`flex flex-shrink-0 flex-col items-center gap-1.5 rounded-2xl px-4 py-3 text-center text-[11px] font-medium ${activeCategory === category.id ? "bg-brand text-white" : "bg-white text-gray-600 shadow-sm ring-1 ring-gray-100"}`}><span className="text-xl">{category.icon === "beverage" ? "◉" : "○"}</span>{category.nama}</button>)}</div></section>
          <section><div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold text-brand">Produk POS</h2><Link to="/order" className="text-sm text-[#7c5cbf]">Lihat semua →</Link></div><label className="mt-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-gray-100 focus-within:ring-brand/30"><Search size={17} className="text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400" placeholder="Cari menu untuk transaksi..." /><SlidersHorizontal size={17} className="text-gray-400" /></label>{loading ? <div className="mt-4 rounded-3xl bg-white p-12 text-center text-sm text-gray-500">Memuat menu dari database...</div> : visible.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">{visible.map((product) => { const food = toFood(product); return <FoodCard key={product.id} food={food} isFav={favorites.includes(product.id)} onFav={() => toggleFavorite(product.id)} onAdd={() => addToCart(product)} onDetail={() => navigate({ to: "/detail/$id", params: { id: product.id } })} />; })}</div> : <div className="mt-4 rounded-3xl bg-white p-12 text-center text-sm text-gray-500">Belum ada produk aktif pada outlet ini.</div>}</section>
        </div>
        <aside className="hidden xl:flex flex-col gap-5"><div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100"><h3 className="font-display text-base font-bold text-brand">Order Terbaru</h3><div className="mt-4 flex flex-col gap-3">{orders.slice(0, 5).map((order) => <div key={order.id} className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-brand">{order.order_code}</p><p className="text-[11px] text-gray-400">{order.metode_bayar}</p></div><div className="text-right"><p className="text-sm font-bold text-brand">{rupiah(Number(order.total))}</p><span className="text-[10px] text-[#7c5cbf]">{order.status}</span></div></div>)}{!orders.length && <p className="text-sm text-gray-400">Belum ada transaksi.</p>}</div></div><div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100"><p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Status outlet</p><div className="mt-3 flex items-center gap-2 text-sm font-semibold text-brand"><span className="size-2 rounded-full bg-emerald-400" /> Online & realtime</div><p className="mt-2 text-xs text-gray-400">Data disinkronkan melalui Supabase Realtime.</p></div></aside>
      </div>
    </div>
  </AppLayout>;
}

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof CircleDollarSign; label: string; value: string; tone: string }) { return <div className={`${tone} rounded-3xl p-5 text-white`}><Icon size={20} className="text-white/70" /><p className="mt-4 text-xs text-white/60">{label}</p><p className="mt-1 font-display text-2xl font-bold">{value}</p></div>; }
