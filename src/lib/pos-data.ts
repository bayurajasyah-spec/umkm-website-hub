import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Order, Product } from "./types";

const productKey = ["pos", "products"] as const;
const orderKey = ["pos", "orders"] as const;

export function usePosProducts() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: productKey,
    queryFn: async () => {
      const [{ data: productRows, error: productError }, { data: categoryRows, error: categoryError }] = await Promise.all([
        supabase.from("products").select("*").eq("aktif", true).order("nama"),
        supabase.from("categories").select("*").order("nama"),
      ]);
      if (productError) throw productError;
      if (categoryError) throw categoryError;
      return { products: (productRows ?? []) as Product[], categories: (categoryRows ?? []) as Category[] };
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    const channel = supabase.channel("pos-products-realtime").on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => queryClient.invalidateQueries({ queryKey: productKey })).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [queryClient]);

  return { products: query.data?.products ?? [], categories: query.data?.categories ?? [], loading: query.isLoading, error: query.error };
}

export function usePosOrders() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: orderKey,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return (data ?? []) as Order[];
    },
    staleTime: 10_000,
  });

  useEffect(() => {
    const channel = supabase.channel("pos-orders-realtime").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => queryClient.invalidateQueries({ queryKey: orderKey })).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [queryClient]);
  return query.data ?? [];
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
