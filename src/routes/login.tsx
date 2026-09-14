import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn, UserPlus, Utensils } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) navigate({ to: "/", replace: true });
    });
    return () => { active = false; };
  }, [navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setPending(false);
    if (error) {
      toast.error("Email atau password tidak valid.");
      return;
    }
    toast.success("Login berhasil.");
    navigate({ to: "/", replace: true });
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) return toast.error("Password minimal 8 karakter.");
    if (password !== confirmPassword) return toast.error("Konfirmasi password tidak sama.");
    setPending(true);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    setPending(false);
    if (error) return toast.error(error.message);
    if (!data.session) return toast.success("Registrasi berhasil. Cek email untuk konfirmasi akun.");
    toast.success("Akun berhasil dibuat.");
    navigate({ to: "/", replace: true });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7fb] px-4 py-8">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl ring-1 ring-black/5">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-accent-yellow text-brand"><Utensils /></div>
          <div><p className="text-xl font-black text-brand">BY.CASHIER</p><p className="text-xs text-muted-foreground">F&B Cashier POS</p></div>
        </div>
        <h1 className="text-2xl font-bold text-brand">{registering ? "Buat akun kasir" : "Masuk ke akun kasir"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{registering ? "Daftarkan akun operasional baru untuk mengakses POS." : "Gunakan akun operasional Anda untuk mengakses POS."}</p>
        <form className="mt-7 flex flex-col gap-4" onSubmit={registering ? handleRegister : handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-semibold text-brand">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-brand" /></label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-brand">Password<input required type="password" autoComplete={registering ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-brand" /></label>
          {registering && <label className="flex flex-col gap-2 text-sm font-semibold text-brand">Konfirmasi password<input required type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-brand" /></label>}
          <button disabled={pending} className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-bold text-white disabled:opacity-60">{pending ? <Loader2 className="animate-spin" /> : registering ? <UserPlus /> : <LogIn />}{registering ? "Daftar" : "Masuk"}</button>
        </form>
        <button type="button" onClick={() => { setRegistering((value) => !value); setConfirmPassword(""); }} className="mt-5 w-full text-sm font-semibold text-brand underline-offset-4 hover:underline">{registering ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}</button>
      </section>
    </main>
  );
}
