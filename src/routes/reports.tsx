import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/components/BusinessModulePage";
export const Route = createFileRoute("/reports")({ component: ReportsPage });
