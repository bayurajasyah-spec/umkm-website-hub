import { createFileRoute } from "@tanstack/react-router";
import { BusinessModulePage } from "@/components/BusinessModulePage";
export const Route = createFileRoute("/products")({ component: () => <BusinessModulePage module="products" /> });
