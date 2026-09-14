import { createFileRoute } from "@tanstack/react-router";
import { BusinessModulePage } from "@/components/BusinessModulePage";
export const Route = createFileRoute("/customers")({ component: () => <BusinessModulePage module="customers" /> });
