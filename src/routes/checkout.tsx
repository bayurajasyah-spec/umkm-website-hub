import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Loader2, MapPin, Minus, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { useStoreActions, useStoreState } from "@/lib/store";
import { createOrder, type OrderResult } from "@/lib/payment.functions";
import {
  calculateShipping,
  searchDestination,
  type Destination,
  type ShippingOption,
} from "@/lib/shipping.functions";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({
    meta: [
      { title: "Checkout & Ongkir — BY.CASHIER" },
      {
        name: "description",
        content:
          "Hitung ongkos kirim RajaOngkir, isi alamat, dan bayar pesanan dengan QRIS secara instan.",
      },
      { property: "og:title", content: "Checkout & Ongkir — BY.CASHIER" },
      {
        property: "og:description",
        content: "Hitung ongkir RajaOngkir dan bayar pesanan dengan QRIS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/checkout" }],
  }),
});

const RATE = 16000; // konversi harga menu ($) ke Rupiah
const rp = (n: number) => `Rp${Math.round(n).toLocaleString("en-US").replace(/,/g, ".")}`;

function CheckoutPage() {
  const { cart } = useStoreState();
  const { updateQty, removeFromCart, clearCart } = useStoreActions();

  const findDestination = useServerFn(searchDestination);
  const getShipping = useServerFn(calculateShipping);
  const submitOrder = useServerFn(createOrder);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [query, setQuery] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [shipping, setShipping] = useState<ShippingOption | null>(null);
  const [loading, setLoading] = useState<"search" | "cost" | "pay" | null>(null);
  const [order, setOrder] = useState<OrderResult | null>(null);

  const subtotalIdr = Math.round(cart.reduce((a, x) => a + x.food.price * x.qty, 0) * RATE);
  const weight = Math.max(
    500,
    cart.reduce((a, x) => a + x.qty * 500, 0),
  );
  const shippingCost = shipping?.cost ?? 0;
  const total = subtotalIdr + shippingCost;

  const handleSearch = async () => {
    if (query.trim().length < 3) {
      toast.error("Ketik minimal 3 huruf nama kota/kecamatan");
      return;
    }
    setLoading("search");
    try {
      const res = await findDestination({ data: { search: query.trim() } });
      setDestinations(res);
      if (res.length === 0) toast.error("Tujuan tidak ditemukan");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mencari tujuan");
    } finally {
      setLoading(null);
    }
  };

  const pickDestination = async (d: Destination) => {
    setDestination(d);
    setDestinations([]);
    setShipping(null);
    setLoading("cost");
    try {
      const res = await getShipping({
        data: { destinationId: d.id, weight, couriers: "jne:sicepat:jnt:pos" },
      });
      setOptions(res);
      if (res.length === 0) toast.error("Tidak ada layanan kurir untuk tujuan ini");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghitung ongkir");
    } finally {
      setLoading(null);
    }
  };

  const handlePay = async () => {
    if (!destination || !shipping) {
      toast.error("Pilih tujuan dan layanan pengiriman dulu");
      return;
    }
    setLoading("pay");
    try {
      const res = await submitOrder({
        data: {
          customerName: name.trim(),
          customerPhone: phone.trim(),
          address: address.trim(),
          destinationId: destination.id,
          destinationLabel: destination.label,
          courier: shipping.courier,
          service: shipping.service,
          weightGrams: weight,
          shippingCost,
          items: cart.map((x) => ({
            id: x.food.id,
            name: x.food.name,
            qty: x.qty,
            price: Math.round(x.food.price * RATE),
          })),
        },
      });
      setOrder(res);
      clearCart();
      toast.success("Pesanan dibuat. Silakan bayar dengan QRIS.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal membuat pesanan");
    } finally {
      setLoading(null);
    }
  };

  const canPay =
    cart.length > 0 &&
    name.trim().length >= 2 &&
    phone.trim().length >= 6 &&
    address.trim().length >= 5 &&
    !!shipping;

  return (
    <AppLayout>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-100 bg-white/95 px-5 pl-16 backdrop-blur lg:px-8">
        <h1 className="font-display text-2xl font-bold text-brand">Checkout</h1>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <div className="space-y-4 pb-28 lg:pb-0">
          {order ? (
            <section className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
              <h2 className="font-display text-xl font-bold text-brand">
                Pesanan {order.orderCode}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Total tagihan {rp(order.total)} · status {order.paymentStatus}
              </p>
              {order.qrisImageUrl ? (
                <img
                  src={order.qrisImageUrl}
                  alt={`Kode QRIS untuk pesanan ${order.orderCode}`}
                  className="mx-auto mt-6 size-64 rounded-2xl ring-1 ring-gray-100"
                />
              ) : (
                <p className="mx-auto mt-6 max-w-md break-all rounded-2xl bg-gray-50 p-4 text-left text-[11px] text-gray-500">
                  {order.qrisPayload ??
                    "Gateway QRIS belum dikonfigurasi. Pesanan tersimpan dengan status pending dan akan otomatis diperbarui saat webhook pembayaran masuk."}
                </p>
              )}
              <Link
                to="/order"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-[#2d1080]"
              >
                Pesan lagi
              </Link>
            </section>
          ) : cart.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
              <h2 className="font-display text-xl font-bold text-brand">Keranjang kosong</h2>
              <p className="mt-2 text-sm text-gray-500">Tambahkan menu untuk mulai memesan.</p>
              <Link
                to="/order"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-[#2d1080]"
              >
                <ChevronLeft size={16} />
                Lihat Menu
              </Link>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div
                  key={item.food.id}
                  className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
                >
                  <div className="size-20 overflow-hidden rounded-2xl bg-gray-100">
                    <img
                      src={item.food.image}
                      alt={item.food.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-base font-bold text-brand">
                      {item.food.name}
                    </h3>
                    <p className="text-xs text-gray-500">{item.food.restaurant}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        onClick={() => updateQty(item.food.id, item.qty - 1)}
                        aria-label="Kurangi jumlah"
                        className="grid size-7 place-items-center rounded-lg border border-gray-200 bg-white transition hover:bg-gray-50"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-bold text-brand">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.food.id, item.qty + 1)}
                        aria-label="Tambah jumlah"
                        className="grid size-7 place-items-center rounded-lg bg-brand text-white transition hover:bg-[#2d1080]"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-base font-bold text-brand">
                      {rp(item.food.price * item.qty * RATE)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.food.id)}
                      aria-label="Hapus item"
                      className="grid size-8 place-items-center rounded-xl text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <h2 className="font-display text-lg font-bold text-brand">Data Pengiriman</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama penerima"
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand"
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nomor HP"
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand"
                  />
                </div>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat lengkap"
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand"
                />

                <div className="flex gap-2">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Cari kecamatan / kota tujuan"
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading === "search"}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white transition hover:bg-[#2d1080] disabled:bg-gray-300"
                  >
                    {loading === "search" ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Search size={16} />
                    )}
                    Cari
                  </button>
                </div>

                {destinations.length > 0 && (
                  <ul className="max-h-56 overflow-auto rounded-xl border border-gray-100">
                    {destinations.map((d) => (
                      <li key={d.id}>
                        <button
                          onClick={() => pickDestination(d)}
                          className="w-full px-4 py-3 text-left text-xs text-gray-600 transition hover:bg-gray-50"
                        >
                          {d.label} {d.zipCode && `· ${d.zipCode}`}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {destination && (
                  <p className="flex items-start gap-2 text-xs text-[#7c5cbf]">
                    <MapPin size={13} className="mt-0.5 shrink-0" />
                    {destination.label}
                  </p>
                )}

                {loading === "cost" && (
                  <p className="flex items-center gap-2 text-xs text-gray-400">
                    <Loader2 size={13} className="animate-spin" /> Menghitung ongkir…
                  </p>
                )}

                {options.length > 0 && (
                  <div className="grid gap-2">
                    {options.map((o) => {
                      const active =
                        shipping?.courier === o.courier && shipping?.service === o.service;
                      return (
                        <button
                          key={`${o.courier}-${o.service}`}
                          onClick={() => setShipping(o)}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-xs transition ${
                            active
                              ? "border-brand bg-[#f5f1ff]"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <span>
                            <span className="font-bold uppercase text-brand">{o.courier}</span>{" "}
                            {o.service} · {o.etd} hari
                          </span>
                          <span className="font-bold text-brand">{rp(o.cost)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        <aside className="h-fit space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="font-display text-lg font-bold text-brand">Ringkasan</h2>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>{rp(subtotalIdr)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Ongkir {shipping ? `(${shipping.courier} ${shipping.service})` : ""}</span>
            <span>{shipping ? rp(shippingCost) : "—"}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Berat</span>
            <span>{(weight / 1000).toFixed(1)} kg</span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-sm font-semibold text-brand">Total</span>
            <span className="font-display text-2xl font-bold text-brand">{rp(total)}</span>
          </div>
          <button
            onClick={handlePay}
            disabled={!canPay || loading === "pay"}
            className="w-full rounded-xl bg-brand py-3.5 text-sm font-bold text-white transition hover:bg-[#2d1080] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading === "pay" ? "Memproses…" : "Bayar dengan QRIS"}
          </button>
          <p className="text-[11px] leading-relaxed text-gray-400">
            Ongkir dihitung real-time lewat RajaOngkir. Status pembayaran diperbarui otomatis
            melalui webhook dari gateway pembayaran.
          </p>
        </aside>
      </div>
    </AppLayout>
  );
}
