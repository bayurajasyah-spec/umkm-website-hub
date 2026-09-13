import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { FoodCard } from "@/components/FoodCard";
import { supabase } from "@/integrations/supabase/client";
import { rupiah } from "@/lib/types";
import { toFood, usePosProducts } from "@/lib/pos-data";
import { useStoreActions, useStoreState } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/order")({ component: CashierPage, head: () => ({ meta: [{ title: "Kasir POS — Delivero" }] }) });

function CashierPage() {
  const { products, categories, loading } = usePosProducts();
  const { cart, favorites } = useStoreState();
  const { addToCart, removeFromCart, updateQty, toggleFavorite, getCartTotal, clearCart } = useStoreActions();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [orderType, setOrderType] = useState("Dine In");
  const [showCart, setShowCart] = useState(false);
  const [cash, setCash] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const visible = useMemo(() => products.filter((product) => (!category || product.category_id === category) && product.nama.toLowerCase().includes(query.toLowerCase())), [products, category, query]);
  const subtotal = getCartTotal();
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;
  const change = Math.max(0, cash - total);

  async function checkout() {
    if (!cart.length) return toast.error("Tambahkan menu terlebih dahulu");
    if (cash < total) return toast.error("Nominal pembayaran belum cukup");
    setSubmitting(true);
    const items = cart.map(({ product, qty }) => ({
      product_id: product.id,
      name: product.nama,
      price: product.harga,
      qty,
      subtotal: product.harga * qty,
    }));
    const { data, error } = await supabase.rpc("create_pos_order", {
      p_order_type: orderType.toLowerCase().replace(" ", "_"),
      p_items: items,
      p_subtotal: subtotal,
      p_tax: tax,
      p_total: total,
      p_payment_method: "cash",
      p_paid_amount: cash,
      p_note: "Kasir POS",
    });
    setSubmitting(false);
    if (error) return toast.error(error.message || "Checkout gagal. Periksa koneksi database.");
    clearCart(); setCash(0); setShowCart(false); toast.success(`Order ${data.order_code} berhasil dibuat`);
  }

  return <AppLayout>
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white/95 px-5 py-4 pl-16 backdrop-blur lg:px-8 lg:pl-8"><div><p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Kasir aktif · Outlet utama</p><h1 className="font-display text-2xl font-bold text-brand">New Order</h1></div><button onClick={() => setShowCart(true)} className="relative flex items-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-bold text-white"><ShoppingCart size={17} /> Cart <span className="grid size-5 place-items-center rounded-full bg-accent-yellow text-[11px] text-brand">{cart.reduce((sum, item) => sum + item.qty, 0)}</span></button></header>
    <div className="grid gap-6 px-5 pb-28 pt-5 lg:px-8 lg:pb-10 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section><div className="flex flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-gray-100"><button onClick={() => setCategory(null)} className={`rounded-xl px-4 py-2 text-xs font-bold ${!category ? "bg-brand text-white" : "text-gray-500"}`}>Semua Menu</button>{categories.map((item) => <button key={item.id} onClick={() => setCategory(item.id)} className={`rounded-xl px-4 py-2 text-xs font-bold ${category === item.id ? "bg-brand text-white" : "text-gray-500"}`}>{item.nama}</button>)}</div><label className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-gray-100"><Search size={17} className="text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="flex-1 bg-transparent text-sm outline-none" placeholder="Cari menu atau scan barcode..." /></label>{loading ? <div className="mt-5 rounded-3xl bg-white p-16 text-center text-sm text-gray-500">Memuat katalog menu...</div> : <div className="mt-5 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">{visible.map((product) => <FoodCard key={product.id} food={toFood(product)} isFav={favorites.includes(product.id)} onFav={() => toggleFavorite(product.id)} onAdd={() => addToCart(product)} onDetail={() => addToCart(product)} />)}</div>}</section>
      <CartPanel cart={cart} subtotal={subtotal} tax={tax} total={total} cash={cash} change={change} orderType={orderType} setOrderType={setOrderType} setCash={setCash} updateQty={updateQty} removeFromCart={removeFromCart} checkout={checkout} submitting={submitting} />
    </div>
    {showCart && <div className="fixed inset-0 z-50 bg-brand/40 p-4 backdrop-blur-sm xl:hidden"><div className="ml-auto h-full max-w-md overflow-y-auto rounded-3xl bg-[#f7f7fa] p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-xl font-bold text-brand">Current Order</h2><button onClick={() => setShowCart(false)} className="rounded-xl bg-white p-2"><X size={18} /></button></div><CartPanel cart={cart} subtotal={subtotal} tax={tax} total={total} cash={cash} change={change} orderType={orderType} setOrderType={setOrderType} setCash={setCash} updateQty={updateQty} removeFromCart={removeFromCart} checkout={checkout} submitting={submitting} /></div></div>}
  </AppLayout>;
}

function CartPanel({ cart, subtotal, tax, total, cash, change, orderType, setOrderType, setCash, updateQty, removeFromCart, checkout, submitting }: any) {
  return <aside className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100"><CartContent {...{ cart, subtotal, tax, total, cash, change, orderType, setOrderType, setCash, updateQty, removeFromCart, checkout, submitting }} /></aside>;
}
function CartContent({ cart, subtotal, tax, total, cash, change, orderType, setOrderType, setCash, updateQty, removeFromCart, checkout, submitting }: any) {
  return <div><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Order baru</p><h2 className="font-display text-xl font-bold text-brand">Current Order</h2></div><span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">{cart.length} item</span></div><div className="mt-4 grid grid-cols-3 gap-2">{["Dine In", "Take Away", "Delivery"].map((type) => <button key={type} onClick={() => setOrderType(type)} className={`rounded-xl py-2 text-[11px] font-bold ${orderType === type ? "bg-accent-yellow text-brand" : "bg-gray-50 text-gray-500"}`}>{type}</button>)}</div><div className="mt-5 flex min-h-40 flex-col gap-3">{cart.length ? cart.map((item: any) => <div key={item.product.id} className="flex gap-3 border-b border-gray-100 pb-3"><img src={item.product.foto_url ?? "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100"} alt="" className="size-12 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-brand">{item.product.nama}</p><p className="text-xs text-gray-400">{rupiah(item.product.harga)}</p><div className="mt-2 flex items-center gap-2"><button onClick={() => updateQty(item.product.id, item.qty - 1)} className="rounded-lg bg-gray-100 p-1"><Minus size={12} /></button><span className="w-5 text-center text-xs font-bold">{item.qty}</span><button onClick={() => updateQty(item.product.id, item.qty + 1)} className="rounded-lg bg-brand p-1 text-white"><Plus size={12} /></button></div></div><button onClick={() => removeFromCart(item.product.id)} className="self-start text-gray-300 hover:text-rose-500"><Trash2 size={15} /></button></div>) : <div className="grid flex-1 place-items-center rounded-2xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">Belum ada item.<br />Pilih menu untuk memulai.</div>}</div><div className="mt-5 border-t border-gray-100 pt-4 text-sm"><div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{rupiah(subtotal)}</span></div><div className="mt-2 flex justify-between text-gray-500"><span>Pajak 10%</span><span>{rupiah(tax)}</span></div><div className="mt-3 flex justify-between text-lg font-bold text-brand"><span>Total</span><span>{rupiah(total)}</span></div></div><label className="mt-4 block text-xs font-bold text-brand">Cash diterima<input type="number" value={cash || ""} onChange={(event) => setCash(Number(event.target.value))} className="mt-2 w-full rounded-xl bg-gray-50 px-3 py-3 text-sm outline-none ring-1 ring-gray-100 focus:ring-brand" placeholder="Masukkan nominal" /></label><div className="mt-3 flex justify-between rounded-xl bg-emerald-50 px-3 py-3 text-sm font-bold text-emerald-700"><span>Kembalian</span><span>{rupiah(change)}</span></div><button disabled={submitting || !cart.length} onClick={checkout} className="mt-4 w-full rounded-xl bg-brand py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{submitting ? "Memproses..." : "Bayar Cash & Cetak Struk"}</button></div>;
}
