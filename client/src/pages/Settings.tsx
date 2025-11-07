import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const formatPhone = (value?: string | null) => {
  if (!value) return "não informado";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return value;
};

const formatCpf = (value?: string | null) => {
  if (!value) return "não informado";
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return value;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export default function Settings() {
  const { user, profile, signOut, isLoading } = useAuth();
  const utils = trpc.useUtils();

  const updateAccount = trpc.auth.updateAccount.useMutation();
  const updateProfile = trpc.userProfile.update.useMutation({
    onSuccess: () => utils.userProfile.get.invalidate(),
  });

  const [preferences, setPreferences] = useState({
    whatsapp: Boolean(profile?.notification_whatsapp ?? false),
    push: Boolean(profile?.notification_push ?? false),
    email: Boolean(profile?.notification_email ?? true),
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setPreferences({
      whatsapp: Boolean(profile?.notification_whatsapp ?? false),
      push: Boolean(profile?.notification_push ?? false),
      email: Boolean(profile?.notification_email ?? true),
    });
  }, [
    profile?.notification_whatsapp,
    profile?.notification_push,
    profile?.notification_email,
  ]);

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: user?.name ?? "",
        email: user?.email ?? "",
        phone: profile?.phone ?? "",
        cpf: profile?.cpf ?? "",
      });
      setSaveError(null);
      setSaveSuccess(false);
    }
  }, [isEditing, user?.name, user?.email, profile?.phone, profile?.cpf]);

  const accountData = useMemo(
    () => [
      { label: "Nome", value: user?.name ?? "não informado" },
      { label: "Email", value: user?.email ?? "não informado" },
      { label: "Telefone", value: formatPhone(profile?.phone) },
      { label: "CPF", value: formatCpf(profile?.cpf) },
    ],
    [user?.name, user?.email, profile?.phone, profile?.cpf]
  );

  const handleSignOut = () => {
    void signOut();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    const accountUpdates: { name?: string; email?: string } = {};
    const profileUpdates: { phone?: string; cpf?: string } = {};

    const trimmedName = formData.name.trim();
    if (trimmedName && trimmedName !== (user?.name ?? "")) {
      accountUpdates.name = trimmedName;
    }

    const trimmedEmail = formData.email.trim().toLowerCase();
    if (trimmedEmail && trimmedEmail !== (user?.email ?? "")) {
      accountUpdates.email = trimmedEmail;
    }

    const phoneValue = formData.phone.trim();
    if (phoneValue !== (profile?.phone ?? "")) {
      profileUpdates.phone = phoneValue || undefined;
    }

    const digits = (value: string) => value.replace(/\D/g, "");
    const currentCpfDigits = digits(profile?.cpf ?? "");
    const newCpfDigits = digits(formData.cpf);
    if (newCpfDigits && newCpfDigits !== currentCpfDigits) {
      profileUpdates.cpf = newCpfDigits;
    }
    if (!newCpfDigits && currentCpfDigits) {
      profileUpdates.cpf = undefined;
    }

    if (
      Object.keys(accountUpdates).length === 0 &&
      Object.keys(profileUpdates).length === 0
    ) {
      setIsEditing(false);
      return;
    }

    try {
      await Promise.all([
        Object.keys(accountUpdates).length
          ? updateAccount.mutateAsync(accountUpdates)
          : Promise.resolve(),
        Object.keys(profileUpdates).length
          ? updateProfile.mutateAsync(profileUpdates)
          : Promise.resolve(),
      ]);
      setSaveSuccess(true);
      setIsEditing(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao atualizar dados";
      setSaveError(message);
    }
  };

  const isSaving = updateAccount.isPending || updateProfile.isPending;

  return (
    <div className="min-h-screen bg-[#FAF9F4] pb-16">
      <header className="bg-white border-b border-[#E6E2D9] sticky top-0 z-10 px-4 py-4">
        <h1 className="text-2xl font-bold text-[#75182C]">Configurações</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-[#1C1C1C]">
        <section className="bg-[#FFFDF5] border border-[#E6E2D9] rounded-[16px] p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Dados da conta</h2>
          <p className="text-sm text-[#5A5A5A] mb-4">
            Estes dados são exibidos apenas para você. Ajuste conforme necessário.
          </p>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-4 bg-[#E6E2D9] rounded-full animate-pulse w-1/2" />
              ))}
            </div>
          ) : isEditing ? (
            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold mb-1" htmlFor="name">
                  Nome
                </label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border border-[#E6E2D9] rounded-[12px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#75182C33]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border border-[#E6E2D9] rounded-[12px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#75182C33]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1" htmlFor="phone">
                  Telefone
                </label>
                <input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                  className="w-full border border-[#E6E2D9] rounded-[12px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#75182C33]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1" htmlFor="cpf">
                  CPF
                </label>
                <input
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  placeholder="000.000.000-00"
                  className="w-full border border-[#E6E2D9] rounded-[12px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#75182C33]"
                />
              </div>

              {saveError ? (
                <p className="text-sm text-red-600">{saveError}</p>
              ) : null}
              {saveSuccess ? (
                <p className="text-sm text-[#2E7D32]">
                  Dados atualizados com sucesso.
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSaving}
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="space-y-3 text-sm">
                {accountData.map((item) => (
                  <div key={item.label}>
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-[#4A4046]">{item.value}</p>
                  </div>
                ))}
              </div>
              {saveSuccess ? (
                <p className="text-sm text-[#2E7D32] mt-4">
                  Dados atualizados com sucesso.
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Editar dados
                </Button>
                <Button variant="ghost" onClick={handleSignOut}>
                  Sair da conta
                </Button>
              </div>
            </>
          )}
        </section>

        <section className="bg-[#FFFDF5] border border-[#E6E2D9] rounded-[16px] p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Notificações</h2>
          <p className="text-sm text-[#5A5A5A]">
            Escolha como prefere receber alertas de vagas e atualizações da MAIA.
          </p>
          {(["whatsapp", "push", "email"] as const).map((channel) => (
            <label
              key={channel}
              className="flex items-center justify-between py-3 border-b border-[#E6E2D9] last:border-b-0 capitalize"
            >
              <span>{channel}</span>
              <input
                type="checkbox"
                checked={preferences[channel]}
                onChange={(event) =>
                  setPreferences((prev) => ({ ...prev, [channel]: event.target.checked }))
                }
                className="w-5 h-5 text-[#75182C]"
              />
            </label>
          ))}
        </section>

        <section className="bg-[#FFFDF5] border border-[#E6E2D9] rounded-[16px] p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Privacidade</h2>
          <p className="text-sm text-[#5A5A5A] leading-relaxed">
            Tratamos seus dados com confidencialidade. Atualize suas preferencias de privacidade quando quiser.
          </p>
          <Button variant="outline" className="mt-4">
            Preferencias de privacidade
          </Button>
        </section>
      </main>
    </div>
  );
}
