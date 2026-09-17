import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, CircleDollarSign, Clock3, Gift, RefreshCw, ShieldCheck, UsersRound } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { rupiah } from "@/lib/types";

const purple = "#5b21b6";

type OrderRow = { id: string; total: number | null; status: string | null; created_at: string };
type StaffRow = { id: string; name: string; status: string | null; updated_at: string };
type VoucherRow = { id: string; name: string; status: string | null; quantity: number | null; updated_at: string };

export function OperationsDashboard() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const [ordersResult, staffResult, voucherResult] = await Promise.all([
      supabase.from("orders").select("id,total,status,created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("business_records").select("id,name,status,updated_at").eq("module", "staff").order("updated_at", { ascending: false }).limit(20),
      supabase.from("business_records").select("id,name,status,quantity,updated_at").eq("module", "vouchers").order("updated_at", { ascending: false }).limit(20),
    ]);
    if (ordersResult.error) toast.error(ordersResult.error.message);
    setOrders((ordersResult.data ?? []) as OrderRow[]);
    setStaff((staffResult.data ?? []) as StaffRow[]);
    setVouchers((voucherResult.data ?? []) as VoucherRow[]);
    setLoading(false);
  };
  useEffect(() => {
    void load();
    const channel = supabase.channel("operations-dashboard").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => void load()).on("postgres_changes", { event: "*", schema: "public", table: "business_records" }, () => void load()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);
  const today = new Date();
  const todayOrders = orders.filter((order) => new Date(order.created_at).toDateString() === today.toDateString());
  const revenue = todayOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  const completed = todayOrders.filter((order) => ["paid", "completed", "selesai"].includes((order.status ?? "").toLowerCase())).length;
  const activeStaff = staff.filter((member) => ["active", "aktif", "online"].includes((member.status ?? "").toLowerCase())).length;
  const chartData = useMemo(() => Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (6 - index)); const dayOrders = orders.filter((order) => new Date(order.created_at).toDateString() === date.toDateString()); return { day: date.toLocaleDateString("id-ID", { weekday: "short" }), transaksi: dayOrders.length, omzet: dayOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0) }; }), [orders]);
  const pending = orders.filter((order) => !["paid", "completed", "selesai", "cancelled"].includes((order.status ?? "").toLowerCase())).slice(0, 5);
  return <main className="mx-auto max-w-7xl px-5 pb-24 pt-6 lg:px-8 lg:pt-8">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8b6bc4]">Pusat kendali operasional</p><h1 className="mt-2 font-display text-3xl font-bold text-[#24105f]">Dashboard Bisnis</h1><p className="mt-2 text-sm text-gray-500">Pantau staff, voucher, analytics, dan aktivitas outlet dalam satu layar.</p></div><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-purple-100 bg-white px-4 py-2.5 text-sm font-semibold text-[#5b21b6] shadow-sm"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button></header>
    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={CircleDollarSign} label="Omzet hari ini" value={rupiah(revenue)} tone="purple" /><Metric icon={BarChart3} label="Transaksi selesai" value={String(completed)} tone="yellow" /><Metric icon={UsersRound} label="Staff aktif" value={`${activeStaff}/${staff.length}`} tone="lavender" /><Metric icon={Gift} label="Voucher aktif" value={String(vouchers.filter((voucher) => voucher.status === "active").length)} tone="pink" /></section>
    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"><section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-bold text-[#24105f]">Analytics penjualan</h2><p className="mt-1 text-xs text-gray-500">Performa transaksi tujuh hari terakhir</p></div><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Realtime</span></div><div className="mt-5 h-[260px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} barSize={24}><CartesianGrid vertical={false} stroke="#eeeafa" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8b86a0" }} /><YAxis hide /><Tooltip cursor={{ fill: "#faf8ff" }} formatter={(value: number, name: string) => [name === "omzet" ? rupiah(value) : value, name === "omzet" ? "Omzet" : "Transaksi"]} /><Bar dataKey="transaksi" fill={purple} radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
      <section className="rounded-3xl bg-[#24105f] p-5 text-white shadow-lg shadow-purple-950/15"><div className="flex items-center gap-2"><ShieldCheck size={18} className="text-yellow-300" /><h2 className="font-display text-lg font-bold">Monitoring outlet</h2></div><div className="mt-5 space-y-4"><StatusRow label="Sistem pembayaran" value="Normal" /><StatusRow label="Sinkronisasi data" value="Realtime" /><StatusRow label="Pesanan menunggu" value={String(pending.length)} /><StatusRow label="Voucher terpakai" value={String(vouchers.reduce((sum, voucher) => sum + Math.max(0, Number(voucher.quantity ?? 0)), 0))} /></div><div className="mt-6 flex items-center gap-2 rounded-2xl bg-white/10 p-3 text-xs text-white/70"><Activity size={15} className="text-yellow-300" /> Semua modul terhubung ke Supabase</div></section></div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2"><DataPanel title="Staff & shift" icon={UsersRound} action="Kelola staff" empty="Belum ada data staff"><div className="divide-y divide-gray-100">{staff.slice(0, 5).map((member) => <div key={member.id} className="flex items-center justify-between py-3"><div><p className="text-sm font-semibold text-[#24105f]">{member.name}</p><p className="mt-1 text-xs text-gray-400">Update {new Date(member.updated_at).toLocaleDateString("id-ID")}</p></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${member.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{member.status === "active" ? "Aktif" : member.status ?? "Belum diatur"}</span></div>)}</div></DataPanel><DataPanel title="Voucher & promosi" icon={Gift} action="Kelola voucher" empty="Belum ada voucher"><div className="divide-y divide-gray-100">{vouchers.slice(0, 5).map((voucher) => <div key={voucher.id} className="flex items-center justify-between py-3"><div><p className="text-sm font-semibold text-[#24105f]">{voucher.name}</p><p className="mt-1 text-xs text-gray-400">Kuota {voucher.quantity ?? 0}</p></div><span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-[#5b21b6]">{voucher.status ?? "draft"}</span></div>)}</div></DataPanel></div>
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-lg font-bold text-[#24105f]">Manajemen Staff & Role</h2><p className="mt-1 text-xs text-gray-500">Atur akses fitur sesuai tanggung jawab tim.</p></div><span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">Owner access</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><RoleCard role="Owner" detail="Semua fitur" tone="bg-[#24105f] text-white" /><RoleCard role="Supervisor" detail="Analytics, staff, approval" tone="bg-purple-50 text-[#5b21b6]" /><RoleCard role="Kasir" detail="POS, transaksi, voucher" tone="bg-yellow-100 text-[#24105f]" /><RoleCard role="Driver" detail="Order delivery" tone="bg-green-50 text-green-700" /></div></section>
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-bold text-[#24105f]">Aktivitas terbaru</h2><p className="mt-1 text-xs text-gray-500">Transaksi yang perlu dipantau</p></div><Clock3 size={18} className="text-[#8b6bc4]" /></div><div className="mt-4 divide-y divide-gray-100">{pending.map((order) => <div key={order.id} className="flex items-center justify-between py-3 text-sm"><span className="font-medium text-[#24105f]">Order #{order.id.slice(0, 8)}</span><span className="text-gray-500">{order.status ?? "Menunggu"} · {rupiah(Number(order.total ?? 0))}</span></div>)}{!pending.length && <p className="py-6 text-center text-sm text-gray-500">Tidak ada aktivitas tertunda.</p>}</div></section>
  </main>;
}
function Metric({ icon: Icon, label, value, tone }: { icon: typeof Activity; label: string; value: string; tone: string }) { const tones: Record<string, string> = { purple: "bg-[#24105f] text-white", yellow: "bg-yellow-300 text-[#24105f]", lavender: "bg-purple-50 text-[#5b21b6]", pink: "bg-fuchsia-50 text-fuchsia-700" }; return <div className={`rounded-3xl p-5 shadow-sm ${tones[tone]}`}><Icon size={20} /><p className="mt-5 text-xs opacity-70">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>; }
function RoleCard({ role, detail, tone }: { role: string; detail: string; tone: string }) { return <div className={`rounded-2xl p-4 ${tone}`}><p className="text-sm font-bold">{role}</p><p className="mt-1 text-xs opacity-75">{detail}</p></div>; }
function StatusRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between border-b border-white/10 pb-3 text-sm"><span className="text-white/60">{label}</span><span className="font-semibold text-white">{value}</span></div>; }
function DataPanel({ title, icon: Icon, action, empty, children }: { title: string; icon: typeof Activity; action: string; empty: string; children: React.ReactNode }) { return <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-display text-lg font-bold text-[#24105f]"><Icon size={18} className="text-[#8b6bc4]" />{title}</h2><span className="text-xs font-semibold text-[#8b6bc4]">{action}</span></div>{children}</section>; }
export default OperationsDashboard;
