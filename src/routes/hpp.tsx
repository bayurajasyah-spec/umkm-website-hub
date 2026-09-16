import { createFileRoute } from "@tanstack/react-router";
import { HppCalculator } from "@/components/HppCalculator";

export const Route = createFileRoute("/hpp")({ component: HppPage });

function HppPage() {
  return <HppCalculator />;
}
