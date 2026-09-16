import { useEffect, useMemo, useState } from "react";
import { Calculator, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Ingredient = { id: string; name: string; quantity: number; unit: string; unitCost: number };
type Recipe = { id: string; name: string; portions: number; labor_cost: number; overhead_cost: number; target_margin: number; ingredients: Ingredient[] };
const emptyIngredient = (): Ingredient => ({ id: crypto.randomUUID(), name: "", quantity: 1, unit: "gram", unitCost: 0 });
const money = (value: number) => `Rp ${Math.round(value).toLocaleString("id-ID")}`;

export function HppCalculator() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [name, setName] = useState("");
  const [portions, setPortions] = useState(1);
  const [laborCost, setLaborCost] = useState(0);
  const [overheadCost, setOverheadCost] = useState(0);
  const [targetMargin, setTargetMargin] = useState(30);
  const [ingredients, setIngredients] = useState<Ingredient[]>([emptyIngredient()]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const ingredientCost = useMemo(() => ingredients.reduce((sum, item) => sum + Math.max(0, item.quantity) * Math.max(0, item.unitCost), 0), [ingredients]);
  const totalCost = ingredientCost + Math.max(0, laborCost) + Math.max(0, overheadCost);
  const costPerPortion = totalCost / Math.max(1, portions);
  const recommendedPrice = costPerPortion / Math.max(0.01, 1 - Math.min(99, Math.max(0, targetMargin)) / 100);
  const profitPerPortion = recommendedPrice - costPerPortion;

  const loadRecipes = async () => {
    const { data, error } = await supabase.from("hpp_recipes").select("id,name,portions,labor_cost,overhead_cost,target_margin,ingredients").order("updated_at", { ascending: false });
    if (error) {
      if (error.code === "PGRST205" || error.message.includes("schema cache")) return;
      toast.error(`Gagal memuat resep HPP: ${error.message}`);
      return;
    }
    setRecipes((data ?? []) as Recipe[]);
  };

  useEffect(() => {
    void loadRecipes();
    const channel = supabase.channel("hpp-recipes-realtime").on("postgres_changes", { event: "*", schema: "public", table: "hpp_recipes" }, () => void loadRecipes()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  const reset = () => { setName(""); setPortions(1); setLaborCost(0); setOverheadCost(0); setTargetMargin(30); setIngredients([emptyIngredient()]); setEditingId(null); };
  const updateIngredient = (id: string, field: keyof Ingredient, value: string | number) => setIngredients((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));

  const saveRecipe = async () => {
    if (!name.trim()) { toast.error("Nama resep wajib diisi"); return; }
    const validIngredients = ingredients.filter((item) => item.name.trim() && item.quantity > 0 && item.unitCost >= 0).map((item) => ({ ...item, name: item.name.trim() }));
    if (!validIngredients.length) { toast.error("Tambahkan minimal satu bahan dengan jumlah dan harga modal"); return; }
    setSaving(true);
    const payload = { name: name.trim(), portions, labor_cost: laborCost, overhead_cost: overheadCost, target_margin: targetMargin, ingredients: validIngredients };
    const query = editingId ? supabase.from("hpp_recipes").update(payload).eq("id", editingId) : supabase.from("hpp_recipes").insert(payload);
    const { error } = await query;
    setSaving(false);
    if (error) { toast.error(`Gagal menyimpan HPP: ${error.message}`); return; }
    toast.success("Perhitungan HPP tersimpan"); reset(); await loadRecipes();
  };

  const editRecipe = (recipe: Recipe) => { setEditingId(recipe.id); setName(recipe.name); setPortions(Number(recipe.portions)); setLaborCost(Number(recipe.labor_cost)); setOverheadCost(Number(recipe.overhead_cost)); setTargetMargin(Number(recipe.target_margin)); setIngredients(recipe.ingredients?.length ? recipe.ingredients : [emptyIngredient()]); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const deleteRecipe = async (id: string) => { if (!window.confirm("Hapus perhitungan HPP ini?")) return; const { error } = await supabase.from("hpp_recipes").delete().eq("id", id); if (error) toast.error(`Gagal menghapus HPP: ${error.message}`); else toast.success("HPP dihapus"); };

  return <main className="mx-auto max-w-7xl px-5 pb-24 pt-6 lg:px-8 lg:pt-8"><header><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-brand text-white"><Calculator size={21} /></div><div><h1 className="font-display text-3xl font-bold text-brand">Kalkulator HPP</h1><p className="mt-1 text-sm text-gray-500">Hitung modal bahan, tenaga kerja, overhead, dan harga jual ideal.</p></div></div></header><div className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]"><section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold text-brand">{editingId ? "Edit perhitungan" : "Buat perhitungan baru"}</h2>{editingId && <button onClick={reset} className="flex items-center gap-1 text-sm text-gray-500"><X size={15} /> Batal</button>}</div><div className="mt-5 grid gap-3 sm:grid-cols-2"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama produk / resep" className="sm:col-span-2 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand" /><NumberField label="Jumlah porsi" value={portions} onChange={setPortions} min={1} /><NumberField label="Biaya tenaga kerja" value={laborCost} onChange={setLaborCost} /><NumberField label="Biaya overhead" value={overheadCost} onChange={setOverheadCost} /><NumberField label="Target margin (%)" value={targetMargin} onChange={setTargetMargin} min={0} max={99} /></div><div className="mt-6 flex items-center justify-between"><h3 className="font-semibold text-brand">Bahan baku</h3><button onClick={() => setIngredients((items) => [...items, emptyIngredient()])} className="flex items-center gap-1 rounded-xl bg-purple-50 px-3 py-2 text-sm font-semibold text-brand"><Plus size={15} /> Tambah bahan</button></div><div className="mt-3 space-y-3">{ingredients.map((item) => <div key={item.id} className="grid gap-2 rounded-2xl bg-gray-50 p-3 sm:grid-cols-[1.5fr_0.7fr_0.8fr_0.8fr_auto]"><input value={item.name} onChange={(e) => updateIngredient(item.id, "name", e.target.value)} placeholder="Nama bahan" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /><input type="number" min={0} step="0.001" value={item.quantity} onChange={(e) => updateIngredient(item.id, "quantity", Number(e.target.value))} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /><input value={item.unit} onChange={(e) => updateIngredient(item.id, "unit", e.target.value)} placeholder="Satuan" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /><input type="number" min={0} value={item.unitCost} onChange={(e) => updateIngredient(item.id, "unitCost", Number(e.target.value))} placeholder="Harga/unit" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /><button aria-label="Hapus bahan" onClick={() => setIngredients((items) => items.length === 1 ? [emptyIngredient()] : items.filter((value) => value.id !== item.id))} className="grid place-items-center rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button></div>)}</div><button disabled={saving} onClick={saveRecipe} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-bold text-white disabled:opacity-50"><Save size={17} /> {saving ? "Menyimpan..." : editingId ? "Perbarui HPP" : "Simpan HPP"}</button></section><aside className="space-y-4"><section className="rounded-3xl bg-brand p-5 text-white"><p className="text-sm text-white/60">HPP total</p><p className="mt-2 text-3xl font-bold">{money(totalCost)}</p><p className="mt-1 text-sm text-white/60">{money(costPerPortion)} per porsi</p><div className="mt-5 grid grid-cols-2 gap-3"><Metric label="Bahan" value={money(ingredientCost)} /><Metric label="Tenaga + overhead" value={money(laborCost + overheadCost)} /></div></section><section className="rounded-3xl bg-purple-50 p-5 text-brand"><p className="text-sm text-gray-500">Harga jual rekomendasi</p><p className="mt-2 text-3xl font-bold">{money(recommendedPrice)}</p><p className="mt-1 text-sm text-gray-500">Estimasi laba {money(profitPerPortion)} per porsi</p></section></aside></div><section className="mt-7 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100"><h2 className="font-display text-lg font-bold text-brand">Perhitungan tersimpan</h2><div className="mt-4 divide-y divide-gray-100">{recipes.map((recipe) => <div key={recipe.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-semibold text-brand">{recipe.name}</p><p className="text-sm text-gray-500">{recipe.ingredients?.length ?? 0} bahan · {recipe.portions} porsi · HPP/porsi {money((recipe.ingredients ?? []).reduce((sum, item) => sum + item.quantity * item.unitCost, 0) + Number(recipe.labor_cost) + Number(recipe.overhead_cost))}</p></div><div className="flex gap-2"><button onClick={() => editRecipe(recipe)} className="rounded-lg p-2 text-brand hover:bg-purple-50" aria-label={`Edit ${recipe.name}`}><Pencil size={16} /></button><button onClick={() => deleteRecipe(recipe.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label={`Hapus ${recipe.name}`}><Trash2 size={16} /></button></div></div>)}{recipes.length === 0 && <p className="py-6 text-sm text-gray-500">Belum ada perhitungan HPP tersimpan.</p>}</div></section></main>;
}

function NumberField({ label, value, onChange, min = 0, max }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) { return <label className="grid gap-1 text-xs font-semibold text-gray-500">{label}<input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-normal text-gray-900 outline-none focus:border-brand" /></label>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-white/60">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>; }
