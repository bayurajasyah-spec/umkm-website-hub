import { createFileRoute } from "@tanstack/react-router";
import { BusinessModulePage } from "@/components/BusinessModulePage";
export const Route = createFileRoute("/staff")({ component: () => <BusinessModulePage module="staff" /> });
