import { createFileRoute } from "@tanstack/react-router";
import { BusinessModulePage } from "@/components/BusinessModulePage";
export const Route = createFileRoute("/store")({ component: () => <BusinessModulePage module="online_store" /> });
