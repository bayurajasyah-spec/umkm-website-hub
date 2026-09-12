import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Order, Product } from "./types";

export function usePosProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [{ data: productRows }, { data: categoryRows }] = await Promise.all([
        supabase.from("products").select("*").eq("aktif", true).order("nama"),
        supabase.from("categories").select("*").order("nama"),
      ]);
      if (!active) return;
      setProducts((productRows ?? []) as Product[]);
      setCategories((categoryRows ?? []) as Category[]);
      setLoading(false);
    };
    load();
    const channel = supabase
      .channel("pos-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, load)
      .subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);

  return { products, categories, loading };
}

export function usePosOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50);
      if (active) setOrders((data ?? []) as Order[]);
    };
    load();
    const channel = supabase
      .channel("pos-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);
  return orders;
}

export function toFood(product: Product) {
  return {
    id: product.id,
    name: product.nama,
    restaurant: product.restaurant || "Outlet aktif",
    description: product.deskripsi,
    price: product.harga,
    image: product.foto_url ?? "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop&auto=format",
    rating: product.rating,
    reviews: 0,
    time: "POS",
    badge: product.stok <= 5 ? "Low stock" : undefined,
    stock: product.stok,
    product,
  };
}
export type PosFood = ReturnType<typeof toFood>;
