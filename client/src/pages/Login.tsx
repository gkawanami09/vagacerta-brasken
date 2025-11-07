import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import LandingHeader from "@/components/marketing/LandingHeader";
import LandingFooter from "@/components/marketing/LandingFooter";

export default function Login() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError(null);
      await loginMutation.mutateAsync({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      await utils.auth.me.invalidate();
      setLocation("/dashboard");
    } catch (err: unknown) {
      setError("Email ou senha invalidos");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F4]">
      <div className="bg-gradient-to-br from-[#7B1B31] to-[#5C1323] text-white">
        <LandingHeader />
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-8">
          <h1 className="text-3xl font-bold text-[#75182C] mb-2">Entrar</h1>
          <p className="text-[#5A5A5A] mb-8">Acesso rapido e seguro</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1C1C1C] mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                className="w-full border border-[#E6E2D9] rounded-[14px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#75182C33]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1C1C1C] mb-2">
                Senha
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Sua senha"
                className="w-full border border-[#E6E2D9] rounded-[14px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#75182C33]"
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-[#75182C] text-white hover:opacity-90 py-3"
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="text-center text-sm text-[#5A5A5A] mt-6">
            Nao tem conta?{" "}
            <button
              type="button"
              onClick={() => setLocation("/signup")}
              className="text-[#75182C] hover:underline font-semibold"
            >
              Criar conta
            </button>
          </p>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
