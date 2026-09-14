import {
  BarChart3,
  Boxes,
  Heart,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  Settings,
  ShoppingBag,
  Store,
  UserRound,
  UsersRound,
  Utensils,
  WalletCards,
  X,
} from "lucide-react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const navGroups = [
  {
    label: "Penjualan",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/order", label: "Kasir / POS", icon: ShoppingBag },
      { to: "/history", label: "Riwayat Transaksi", icon: PackageCheck },
    ],
  },
  {
    label: "Operasional",
    items: [
      { to: "/products", label: "Produk & Menu", icon: Boxes },
      { to: "/inventory", label: "Inventory & Stok", icon: Boxes },
      { to: "/kitchen", label: "Kitchen Display", icon: Utensils },
      { to: "/favorites", label: "Favorit Menu", icon: Heart },
    ],
  },
  {
    label: "Pelanggan & Keuangan",
    items: [
      { to: "/customers", label: "CRM & Loyalty", icon: UsersRound },
      { to: "/wallet", label: "Pembayaran", icon: WalletCards },
      { to: "/reports", label: "Laporan", icon: BarChart3 },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { to: "/staff", label: "Karyawan & Shift", icon: UserRound },
      { to: "/store", label: "Toko Online", icon: Store },
      { to: "/settings", label: "Pengaturan", icon: Settings },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  close: () => void;
}

export function Sidebar({ open, close }: SidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [email, setEmail] = useState("Akun kasir");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) { toast.error("Logout gagal."); return; }
    toast.success("Anda sudah logout.");
    navigate({ to: "/login", replace: true });
  }

  function isActive(to: string) {
    if (to === "/") return pathname === "/";
    return pathname === to || pathname.startsWith(`${to}/`);
  }

  return (
    <>
      {/* Backdrop */}
      <button
        onClick={close}
        aria-label="Close menu"
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden ${
          open ? "block" : "hidden"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-brand transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-6">
          <Link
            to="/"
            onClick={close}
            className="flex items-center gap-3"
          >
            <div className="grid size-10 place-items-center rounded-2xl bg-accent-yellow">
              <Utensils size={18} className="text-brand" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <div className="font-display text-lg font-bold leading-tight text-white">
                BY.CASHIER
              </div>
              <div className="text-[11px] text-white/40 leading-none">
                Premium Delivery
              </div>
            </div>
          </Link>
          <button
            onClick={close}
            className="rounded-xl p-1.5 text-white/50 hover:bg-white/10 transition lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mx-6 mb-4 inline-flex w-fit items-center gap-2 rounded-lg bg-emerald-400/15 px-3 py-2 text-xs font-semibold text-emerald-300">
          <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(110,231,183,0.12)]" /> Online
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{group.label}</p>
              <div className="flex flex-col gap-1">
                {group.items.map(({ to, label, icon: Icon }) => {
                  const active = isActive(to);
                  return <Link key={to} to={to} onClick={close} className={`group flex w-full items-center gap-3.5 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-200 ${active ? "bg-accent-yellow text-brand shadow-[0_4px_16px_rgba(255,229,28,0.3)]" : "text-white/65 hover:bg-white/10 hover:text-white"}`}><Icon size={20} strokeWidth={active ? 2.5 : 2} /><span>{label}</span>{active && <span className="ml-auto size-1.5 rounded-full bg-brand opacity-60" />}</Link>;
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Order Now CTA */}
        <div className="mx-3 mb-3">
          <div className="rounded-2xl bg-white/[0.08] border border-white/10 p-4">
            <p className="text-xs text-white/50">Operasional hari ini</p>
            <p className="mt-1 text-xl font-bold text-white">Rp 0</p>
            <p className="text-xs text-white/40">0 transaksi</p>
            <Link
              to="/order"
              onClick={close}
              className="mt-3 block w-full rounded-xl bg-blue-500 py-3 text-center text-sm font-bold text-white transition hover:brightness-105 active:scale-[0.98]"
            >
              Buka Kasir / POS
            </Link>
          </div>
        </div>

        {/* User */}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative grid size-10 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-rose-300 text-lg flex-shrink-0">
              <span className="text-sm font-bold text-brand">{email.slice(0, 1).toUpperCase()}</span>
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-brand bg-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-semibold text-white">
                {email}
              </div>
              <div className="truncate text-[11px] text-white/40">
                Pro Member ⭐
              </div>
            </div>
            <button onClick={handleLogout} aria-label="Logout" className="rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white transition">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
