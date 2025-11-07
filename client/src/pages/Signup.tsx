import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import LandingHeader from "@/components/marketing/LandingHeader";
import LandingFooter from "@/components/marketing/LandingFooter";
import { getPasswordStrengthError, isStrongPassword } from "@shared/password";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const digitsOnly = (value: string) => value.replace(/\D/g, "");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "password") {
      setError(getPasswordStrengthError(value));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isStrongPassword(formData.password)) {
      setError(getPasswordStrengthError(formData.password));
      return;
    }

    if (digitsOnly(formData.phone).length < 10 || digitsOnly(formData.phone).length > 11) {
      setError("Telefone invalido");
      return;
    }

    if (digitsOnly(formData.cpf).length !== 11) {
      setError("CPF invalido");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas nao coincidem");
      return;
    }

    try {
      setError(null);
      await registerMutation.mutateAsync({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        cpf: formData.cpf.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      await utils.auth.me.invalidate();
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Falha ao criar conta");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F4]">
      <div className="bg-gradient-to-br from-[#7B1B31] to-[#5C1323] text-white">
        <LandingHeader />
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-8">
          <h1 className="text-3xl font-bold text-[#75182C] mb-2">Criar conta</h1>
          <p className="text-[#5A5A5A] mb-8">Junte-se ao Vaga Certa</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1C1C1C] mb-2">
                Nome
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Seu nome"
                className="w-full border border-[#E6E2D9] rounded-[14px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#75182C33]"
              />
            </div>
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
                Telefone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
                className="w-full border border-[#E6E2D9] rounded-[14px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#75182C33]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1C1C1C] mb-2">
                CPF
              </label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
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
                placeholder="8-12 caracteres, maiuscula, minuscula, numero e especial"
                className="w-full border border-[#E6E2D9] rounded-[14px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#75182C33]"
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1C1C1C] mb-2">
                Confirmar senha
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repita a senha"
                className="w-full border border-[#E6E2D9] rounded-[14px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#75182C33]"
              />
            </div>

            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-[#75182C] text-white hover:opacity-90 py-3"
            >
              {registerMutation.isPending ? "Criando..." : "Criar conta"}
            </Button>
          </form>

          <p className="text-center text-sm text-[#5A5A5A] mt-6">
            Ja tem conta?{" "}
            <button
              type="button"
              onClick={() => setLocation("/login")}
              className="text-[#75182C] hover:underline font-semibold"
            >
              Entrar
            </button>
          </p>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
