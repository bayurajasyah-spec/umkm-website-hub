import { Clock, Heart, Plus, Star } from "lucide-react";
import { rupiah, type Food } from "@/lib/types";

interface FoodCardProps {
  food: Food;
  isFav: boolean;
  onFav: () => void;
  onAdd: () => void;
  onDetail: () => void;
}

export function FoodCard({ food, isFav, onFav, onAdd, onDetail }: FoodCardProps) {
  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-[0_4px_20px_rgba(28,7,92,0.07)] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(28,7,92,0.14)] hover:-translate-y-0.5">
      {/* Image Area */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={food.image}
          alt={food.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />

        {/* Badge */}
        {(food.badge || food.discount) && (
          <span className="absolute left-3 top-3 rounded-full bg-accent-yellow px-3 py-1 text-[11px] font-bold text-brand shadow-sm">
            {food.discount ? `-${food.discount}` : food.badge}
          </span>
        )}

        {/* Heart */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFav();
          }}
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition hover:scale-110 active:scale-95"
        >
          <Heart
            size={15}
            strokeWidth={2}
            className={isFav ? "fill-rose-500 text-rose-500" : "text-gray-500"}
          />
        </button>

        {/* Rating */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 backdrop-blur-sm shadow-sm">
          <Star size={11} className="fill-accent-yellow text-accent-yellow" />
          <span className="text-xs font-bold text-brand">{food.rating}</span>
          <span className="text-[10px] text-gray-500">({food.reviews.toLocaleString("en-US")})</span>
        </div>
      </div>

      {/* Card Body */}
      <button onClick={onDetail} className="w-full px-4 pt-4 pb-2 text-left">
        <h3 className="font-display text-[15px] font-bold text-brand leading-snug line-clamp-1">
          {food.name}
        </h3>
        <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{food.restaurant}</p>
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
          <Clock size={11} strokeWidth={2} />
          <span>{food.time}</span>
        </div>
      </button>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-50 px-4 py-3 mt-1">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-brand">{rupiah(food.price)}</span>
          {food.originalPrice && (
            <span className="text-xs text-gray-400 line-through">
              {rupiah(food.originalPrice)}
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2.5 text-xs font-bold text-white transition-all hover:bg-accent-yellow hover:text-brand active:scale-95"
        >
          <Plus size={13} strokeWidth={2.5} />
          Add
        </button>
      </div>
    </article>
  );
}
