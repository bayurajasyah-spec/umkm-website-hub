import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, Wallet } from "lucide-react";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useStoreActions, useStoreState } from "@/lib/store";

const topUpOptions = [50000, 100000, 250000, 500000];

export const Route = createFileRoute("/wallet")({
  component: WalletPage,
  head: () => ({
    meta: [
      { title: "Bills & Wallet — BY.CASHIER" },
      { name: "description", content: "Manage your balance and top up your wallet." },
      { property: "og:title", content: "Bills & Wallet — BY.CASHIER" },
      { property: "og:description", content: "Manage your balance and top up your wallet." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/wallet" }],
  }),
});

function WalletPage() {
  const { balance } = useStoreState();
  const { topUp } = useStoreActions();
  const [selected, setSelected] = useState(100000);

  const formattedBalance = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(balance);

  return (
    <AppLayout>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-100 bg-white/95 px-5 pl-16 backdrop-blur lg:px-8">
        <h1 className="font-display text-2xl font-bold text-brand">
          Bills & Wallet
        </h1>
      </header>

      <div className="px-5 pb-28 pt-5 lg:px-8 lg:pb-10">
        {/* Balance card */}
        <div className="mx-auto max-w-xl rounded-3xl bg-gradient-to-br from-brand to-[#3e1595] p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/50">
                Total Balance
              </p>
              <h2 className="mt-1.5 font-display text-3xl font-bold">
                {formattedBalance}
              </h2>
            </div>
            <div className="grid size-12 place-items-center rounded-2xl bg-white/15">
              <Wallet size={24} className="text-accent-yellow" />
            </div>
          </div>
          <div className="mt-4 text-xs tracking-widest text-white/40">
            •••• •••• •••• 4209
          </div>
          <div className="mt-6 flex gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-white/15">
              <CreditCard size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Visa ending in 4209</p>
              <p className="text-[11px] text-white/50">Expires 12/28</p>
            </div>
          </div>
        </div>

        {/* Top up */}
        <div className="mx-auto mt-6 max-w-xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h3 className="font-display text-lg font-bold text-brand">Top Up</h3>
          <p className="text-sm text-gray-500">Select amount to add to your wallet</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {topUpOptions.map((amount) => (
              <button
                key={amount}
                onClick={() => setSelected(amount)}
                className={`rounded-2xl border-2 py-3 text-sm font-bold transition ${
                  selected === amount
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200"
                }`}
              >
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(amount)}
              </button>
            ))}
          </div>
          <button
            onClick={() => topUp(selected)}
            className="mt-5 w-full rounded-xl bg-brand py-3.5 text-sm font-bold text-white transition hover:bg-[#2d1080]"
          >
            Top Up{" "}
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(selected)}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
