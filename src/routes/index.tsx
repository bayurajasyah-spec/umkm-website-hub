import { createFileRoute } from "@tanstack/react-router";
import OperationsDashboard from "@/components/OperationsDashboard";

export const Route = createFileRoute("/")({
  component: OperationsDashboard,
  head: () => ({
    meta: [
      { title: "Dashboard Bisnis — BY.CASHIER UMKM" },
      { name: "description", content: "Pantau staff, voucher, analytics, transaksi, dan operasional outlet secara realtime." },
    ],
  }),
});

export default OperationsDashboard;
