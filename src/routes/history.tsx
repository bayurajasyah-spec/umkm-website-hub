import { createFileRoute } from "@tanstack/react-router";
import { PackageCheck } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "Order History — BY.CASHIER" },
      { name: "description", content: "View your past orders." },
      { property: "og:title", content: "Order History — BY.CASHIER" },
      { property: "og:description", content: "View your past orders." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/history" }],
  }),
});

function HistoryPage() {
  return (
    <AppLayout>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-100 bg-white/95 px-5 pl-16 backdrop-blur lg:px-8">
        <h1 className="font-display text-2xl font-bold text-brand">
          Order History
        </h1>
      </header>
      <div className="flex flex-col items-center justify-center px-5 pb-28 pt-20 lg:px-8 lg:pb-10">
        <div className="grid size-16 place-items-center rounded-3xl bg-brand-soft">
          <PackageCheck size={28} className="text-[#7c5cbf]" />
        </div>
        <h2 className="mt-5 font-display text-xl font-bold text-brand">
          No Orders Yet
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Your completed orders will appear here.
        </p>
      </div>
    </AppLayout>
  );
}
