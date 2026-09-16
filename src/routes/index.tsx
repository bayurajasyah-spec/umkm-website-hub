import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronRight, MapPin, Search, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { FoodCard } from "@/components/FoodCard";
import { rupiah } from "@/lib/types";
import { toFood, usePosProducts } from "@/lib/pos-data";
import { useStoreActions, useStoreState } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Beranda — BY.CASHIER" }, { name: "description", content: "Pesan menu favorit dan kelola transaksi outlet." }] }),
});

const bannerImage = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_20260826_181942-s0h3SxEUV8YP7OVw9DIO8UiLmZf6yk.jpg";

function DashboardPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [accountName, setAccountName] = useState("Akun kasir");
  const navigate = useNavigate();
  const { products, categories, loading } = usePosProducts();
  const { favorites } = useStoreState();
  const { toggleFavorite, addToCart } = useStoreActions();
  const visible = useMemo(() => products.filter((product) => (!activeCategory || product.category_id === activeCategory) && product.nama.toLowerCase().includes(query.toLowerCase())), [products, activeCategory, query]);

  useEffect(() => {
    let active = true;
    const loadName = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active || !data.user) return;
      const { data: profile } = await supabase.from("profiles").select("nama").eq("id", data.user.id).maybeSingle();
      const name = profile?.nama?.trim() || data.user.user_metadata?.nama?.trim() || data.user.user_metadata?.full_name?.trim() || data.user.email?.split("@")[0] || "Akun kasir";
      if (active) setAccountName(name.split(" ")[0]);
    };
    void loadName();
    return () => { active = false; };
  }, []);

  return <AppLayout>
    <main className="mx-auto min-h-screen max-w-5xl bg-[#f7f7fb] px-5 pb-28 pt-5 lg:px-8 lg:pt-8">
      <header className="flex items-center justify-between"><div><div className="flex items-center gap-1.5 text-xs text-gray-500"><MapPin size={13} className="text-brand" /> Emi Street 23, Jakarta</div><h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#24105f]">Hey, {accountName} <span aria-hidden="true" className="text-yellow-500">!</span></h1></div><div className="flex gap-2"><button aria-label="Notifikasi" className="grid size-11 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-100"><Bell size={19} className="text-[#24105f]" /></button><Link to="/checkout" aria-label="Keranjang" className="grid size-11 place-items-center rounded-2xl bg-[#250768] shadow-lg shadow-purple-950/20"><ShoppingCart size={19} className="text-white" /></Link></div></header>
      <div className="mt-6 flex gap-3"><label className="flex flex-1 items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-gray-100"><Search size={18} className="text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400" placeholder="Search dishes, restaurants..." /></label><button aria-label="Filter menu" className="grid size-12 place-items-center rounded-2xl bg-[#250768] text-white"><SlidersHorizontal size={19} /></button></div>
      <section className="relative mt-6 min-h-[190px] overflow-hidden rounded-[26px] bg-[#250768] px-6 py-7"><div className="absolute inset-y-0 right-0 w-1/2 bg-cover bg-center opacity-70" style={{ backgroundImage: `linear-gradient(90deg, #250768 0%, transparent 65%), url(${bannerImage})` }} /><div className="relative z-10 max-w-[62%]"><span className="rounded-full bg-yellow-300 px-3 py-1 text-[10px] font-bold text-[#24105f]">Today&apos;s Special</span><h2 className="mt-4 font-display text-2xl font-bold leading-tight text-white">Get 30% Off<br />Your First Order</h2><Link to="/order" className="mt-5 inline-flex items-center gap-2 rounded-full bg-yellow-300 px-4 py-2.5 text-sm font-bold text-[#24105f]">Order Now <ChevronRight size={16} /></Link></div><div className="absolute bottom-4 left-6 flex gap-1.5"><span className="h-1.5 w-6 rounded-full bg-yellow-300" /><span className="size-1.5 rounded-full bg-white/50" /><span className="size-1.5 rounded-full bg-white/50" /></div></section>
      <section className="mt-7"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold text-[#24105f]">Categories</h2><Link to="/order" className="text-sm text-[#8967b9]">See all</Link></div><div className="mt-3 flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"><button onClick={() => setActiveCategory(null)} className={`flex min-w-[64px] flex-col items-center gap-2 rounded-2xl px-3 py-3 text-[11px] ${!activeCategory ? "bg-[#250768] text-white shadow-lg shadow-purple-950/20" : "bg-white text-gray-500 shadow-sm"}`}><span className="text-lg">◉</span>All</button>{categories.map((category) => <button key={category.id} onClick={() => setActiveCategory(category.id)} className={`flex min-w-[64px] flex-col items-center gap-2 rounded-2xl px-3 py-3 text-[11px] ${activeCategory === category.id ? "bg-[#250768] text-white" : "bg-white text-gray-500 shadow-sm"}`}><span className="text-lg">{category.icon === "beverage" ? "○" : "◇"}</span>{category.nama}</button>)}</div></section>
      <section className="mt-7"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold text-[#24105f]">Popular Dishes</h2><Link to="/order" className="text-sm text-[#8967b9]">See all <span aria-hidden="true">→</span></Link></div>{loading ? <div className="mt-4 rounded-3xl bg-white p-10 text-center text-sm text-gray-500">Memuat menu...</div> : visible.length ? <div className="mt-4 grid gap-5 sm:grid-cols-2">{visible.map((product) => { const food = toFood(product); return <div key={product.id} className="relative"><FoodCard food={food} isFav={favorites.includes(product.id)} onFav={() => toggleFavorite(product.id)} onAdd={() => addToCart(product)} onDetail={() => navigate({ to: "/detail/$id", params: { id: product.id } })} /></div>; })}</div> : <div className="mt-4 rounded-3xl bg-white p-10 text-center text-sm text-gray-500">Belum ada menu aktif.</div>}</section>
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-5xl justify-around border-t border-gray-100 bg-white/95 px-3 py-3 backdrop-blur lg:static lg:mt-8 lg:rounded-2xl lg:border lg:bg-white"><BottomLink to="/" label="Home" active icon="⌂" /><BottomLink to="/order" label="Order" icon="▣" /><BottomLink to="/favorites" label="Saved" icon="♡" /><BottomLink to="/history" label="History" icon="◇" /><BottomLink to="/wallet" label="Wallet" icon="▤" /></nav>
    </main>
  </AppLayout>;
}

function BottomLink({ to, label, icon, active = false }: { to: string; label: string; icon: string; active?: boolean }) { return <Link to={to} className={`flex min-w-14 flex-col items-center gap-1 text-[11px] ${active ? "font-bold text-[#250768]" : "text-gray-400"}`}><span className={`grid size-9 place-items-center rounded-xl text-xl ${active ? "bg-yellow-300" : ""}`}>{icon}</span>{label}</Link>; }

export default DashboardPage;
