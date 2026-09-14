import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  Clock,
  Heart,
  Minus,
  Plus,
  Share2,
  Star,
} from "lucide-react";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { dishes } from "@/lib/types";
import { useStoreActions, useStoreState } from "@/lib/store";

const extrasList: { label: string; price: number }[] = [
  { label: "Extra Cheese", price: 1.5 },
  { label: "Crispy Bacon", price: 2.0 },
  { label: "Fried Egg", price: 1.0 },
  { label: "Jalapeños", price: 0.75 },
];

export const Route = createFileRoute("/detail/$id")({
  component: DetailPage,
  head: ({ params }) => {
    const food = dishes.find((d) => String(d.id) === params.id);
    return {
      meta: [
        { title: food ? `${food.name} — BY.CASHIER` : "Detail — BY.CASHIER" },
        {
          name: "description",
          content: food
            ? food.description
            : "View dish details and customize your order.",
        },
        {
          property: "og:title",
          content: food ? `${food.name} — BY.CASHIER` : "Detail — BY.CASHIER",
        },
        {
          property: "og:description",
          content: food
            ? food.description
            : "View dish details and customize your order.",
        },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: `/detail/${params.id}` }],
    };
  },
});

function DetailPage() {
  const { id } = Route.useParams();
  const foodId = Number(id);
  const food = dishes.find((d) => d.id === foodId);
  const navigate = useNavigate();
  const { favorites } = useStoreState();
  const { addToCart, toggleFavorite } = useStoreActions();

  const [size, setSize] = useState<"Regular" | "Large" | "Double">("Regular");
  const [extras, setExtras] = useState<string[]>([]);
  const [qty, setQty] = useState(1);

  if (!food) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-brand">
              Dish not found
            </h1>
            <Link to="/order" className="mt-4 text-[#7c5cbf] hover:underline">
              Back to menu
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isFav = favorites.includes(food.id);

  const sizeExtra = size === "Large" ? 2.0 : size === "Double" ? 4.0 : 0;
  const extrasTotal = extras.reduce(
    (acc, label) =>
      acc + (extrasList.find((e) => e.label === label)?.price ?? 0),
    0
  );
  const unitPrice = food.price + sizeExtra + extrasTotal;
  const totalPrice = unitPrice * qty;

  const toggleExtra = (label: string) =>
    setExtras((e) =>
      e.includes(label) ? e.filter((v) => v !== label) : [...e, label]
    );

  const handleAdd = () => {
    addToCart(food, qty, size, extras);
    navigate({ to: "/checkout" });
  };

  return (
    <AppLayout>
      {/* Hero image */}
      <div className="relative h-72 lg:h-96 overflow-hidden bg-gray-200">
        <img src={food.image} alt={food.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />

        {/* Actions overlay */}
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <Link
            to="/order"
            className="flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2.5 text-sm font-semibold text-brand backdrop-blur-sm shadow-md transition hover:bg-white"
          >
            <ChevronLeft size={16} />
            Back
          </Link>
          <div className="flex gap-2">
            <button className="grid size-10 place-items-center rounded-2xl bg-white/90 backdrop-blur-sm shadow-md transition hover:bg-white">
              <Share2 size={16} className="text-gray-600" />
            </button>
            <button
              onClick={() => toggleFavorite(food.id)}
              className="grid size-10 place-items-center rounded-2xl bg-white/90 backdrop-blur-sm shadow-md transition hover:bg-white"
            >
              <Heart
                size={16}
                className={isFav ? "fill-rose-500 text-rose-500" : "text-gray-600"}
              />
            </button>
          </div>
        </div>

        {/* Rating + time badge */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 backdrop-blur-sm shadow-sm">
            <Star size={13} className="fill-accent-yellow text-accent-yellow" />
            <span className="text-sm font-bold text-brand">{food.rating}</span>
            <span className="text-xs text-gray-500">
              ({food.reviews.toLocaleString("en-US")})
            </span>
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 backdrop-blur-sm shadow-sm">
            <Clock size={13} className="text-brand" />
            <span className="text-xs font-medium text-brand">{food.time}</span>
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:px-8 lg:grid-cols-[1fr_380px]">
        {/* Left – info */}
        <div className="space-y-6 pb-28 lg:pb-0">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-2xl font-bold text-brand leading-snug">
                {food.name}
              </h1>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-brand">
                  ${unitPrice.toFixed(2)}
                </div>
                {food.originalPrice && (
                  <div className="text-sm text-gray-400 line-through">
                    ${food.originalPrice.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
            <p className="mt-1 text-sm font-medium text-[#7c5cbf]">
              {food.restaurant}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              {food.description}
            </p>
          </div>

          {/* Ingredients */}
          <div>
            <h2 className="font-display text-base font-bold text-brand">
              Key Ingredients
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {food.ingredients.map((ing) => (
                <span
                  key={ing}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-soft px-3.5 py-2 text-xs font-medium text-brand"
                >
                  ◈ {ing}
                </span>
              ))}
            </div>
          </div>

          {/* Nutritional quick info */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Calories", value: "620 kcal" },
              { label: "Protein", value: "42g" },
              { label: "Carbs", value: "38g" },
            ].map((n) => (
              <div
                key={n.label}
                className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-100"
              >
                <div className="font-display text-base font-bold text-brand">
                  {n.value}
                </div>
                <div className="mt-0.5 text-[11px] text-gray-400">{n.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right – customize */}
        <aside className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 h-fit">
          <h2 className="font-display text-lg font-bold text-brand">
            Customize Order
          </h2>

          {/* Size */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Size</p>
              <span className="rounded-full bg-accent-yellow/30 px-2.5 py-0.5 text-[11px] font-bold text-brand">
                Required
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["Regular", "Large", "Double"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`rounded-2xl border-2 p-3 text-left transition-all ${
                    size === s
                      ? "border-brand bg-brand-soft"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <div className="text-sm font-bold text-brand">{s}</div>
                  <div className="mt-0.5 text-[11px] text-gray-500">
                    {s === "Regular" ? "Standard" : s === "Large" ? "+$2.00" : "+$4.00"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Extras */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                Extra Toppings
              </p>
              <span className="text-[11px] text-gray-400">Optional</span>
            </div>
            <div className="mt-3 space-y-2.5">
              {extrasList.map(({ label, price }) => (
                <label
                  key={label}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 transition-all ${
                    extras.includes(label)
                      ? "border-brand bg-brand-soft"
                      : "border-gray-100 bg-gray-50 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid size-5 place-items-center rounded-md border-2 transition ${
                        extras.includes(label)
                          ? "border-brand bg-brand"
                          : "border-gray-300"
                      }`}
                    >
                      {extras.includes(label) && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path
                            d="M1 4L3.5 6.5L9 1"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </div>
                  <span className="text-sm font-bold text-brand">
                    +${price.toFixed(2)}
                  </span>
                  <input
                    type="checkbox"
                    checked={extras.includes(label)}
                    onChange={() => toggleExtra(label)}
                    className="sr-only"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Quantity</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid size-9 place-items-center rounded-xl border border-gray-200 bg-white transition hover:bg-gray-50 active:scale-95"
              >
                <Minus size={14} />
              </button>
              <span className="w-6 text-center text-base font-bold text-brand">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="grid size-9 place-items-center rounded-xl bg-brand text-white transition hover:bg-[#2d1080] active:scale-95"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Total + CTA */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="font-display text-2xl font-bold text-brand">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleAdd}
              className="mt-4 w-full rounded-xl bg-brand py-3.5 text-sm font-bold text-white transition hover:bg-[#2d1080] active:scale-[0.98]"
            >
              Add to Cart • ${totalPrice.toFixed(2)}
            </button>
          </div>
        </aside>
      </div>
    </AppLayout>
  );
}
