import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';

export default function Settings() {
  const { user, logout } = useAuth();
  const { data: profile } = trpc.userProfile.get.useQuery();
  const updateProfile = trpc.userProfile.update.useMutation();
  const updateAccount = trpc.auth.updateAccount.useMutation();
  const utils = trpc.useUtils();

  const [openName, setOpenName] = useState(false);
  const [openEmail, setOpenEmail] = useState(false);
  const [openPhone, setOpenPhone] = useState(false);
  const [openCpf, setOpenCpf] = useState(false);

  const [nameVal, setNameVal] = useState('');
  const [emailVal, setEmailVal] = useState('');
  const [phoneVal, setPhoneVal] = useState('');
  const [cpfVal, setCpfVal] = useState('');
  const [formErr, setFormErr] = useState<string | null>(null);

  const [notifications, setNotifications] = useState({
    whatsapp: false,
    push: false,
    email: false,
  });

  useEffect(() => {
    setNotifications({
      whatsapp: Boolean(profile?.notification_whatsapp),
      push: Boolean(profile?.notification_push),
      email: Boolean(profile?.notification_email),
    });
  }, [profile?.notification_email, profile?.notification_push, profile?.notification_whatsapp]);

  return (
    <div className="min-h-screen bg-[#FAF9F4] pb-20">
      <div className="bg-white border-b border-[#E6E2D9] sticky top-0 z-40 px-4 py-4">
        <h1 className="text-2xl font-bold text-[#75182C]">Configurações</h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6">
          <h2 className="text-lg font-semibold text-[#1C1C1C] mb-4">Dados Pessoais</h2>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => { setNameVal(user?.name || ''); setFormErr(null); setOpenName(true); }}
              className="w-full flex justify-between items-center p-3 border-b border-[#E6E2D9] text-left hover:bg-[#F5F5F5] rounded"
            >
              <div><p className="font-medium text-[#1C1C1C]">Nome</p><p className="text-sm text-[#5A5A5A]">{user?.name || '—'}</p></div>
              <ChevronRight size={20} className="text-[#75182C]" />
            </button>
            <button
              type="button"
              onClick={() => { setEmailVal(user?.email || ''); setFormErr(null); setOpenEmail(true); }}
              className="w-full flex justify-between items-center p-3 border-b border-[#E6E2D9] text-left hover:bg-[#F5F5F5] rounded"
            >
              <div><p className="font-medium text-[#1C1C1C]">Email</p><p className="text-sm text-[#5A5A5A]">{user?.email || '—'}</p></div>
              <ChevronRight size={20} className="text-[#75182C]" />
            </button>
            <button
              type="button"
              onClick={() => { setPhoneVal(profile?.phone || ''); setFormErr(null); setOpenPhone(true); }}
              className="w-full flex justify-between items-center p-3 text-left hover:bg-[#F5F5F5] rounded"
            >
              <div><p className="font-medium text-[#1C1C1C]">Telefone</p><p className="text-sm text-[#5A5A5A]">{profile?.phone || '—'}</p></div>
              <ChevronRight size={20} className="text-[#75182C]" />
            </button>
            <button
              type="button"
              onClick={() => { setCpfVal(profile?.cpf || ''); setFormErr(null); setOpenCpf(true); }}
              className="w-full flex justify-between items-center p-3 text-left hover:bg-[#F5F5F5] rounded"
            >
              <div><p className="font-medium text-[#1C1C1C]">CPF</p><p className="text-sm text-[#5A5A5A]">{profile?.cpf || '—'}</p></div>
              <ChevronRight size={20} className="text-[#75182C]" />
            </button>
          </div>
        </div>

        <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6">
          <h2 className="text-lg font-semibold text-[#1C1C1C] mb-4">Notificações</h2>
          <div className="space-y-3">
            {([
              ['whatsapp', 'WhatsApp'],
              ['push', 'Push'],
              ['email', 'Email'],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between p-3 border-b border-[#E6E2D9] last:border-b-0">
                <p className="capitalize text-[#1C1C1C] font-medium">{label}</p>
                <input
                  type="checkbox"
                  checked={notifications[key]}
                  onChange={async () => {
                    const next = { ...notifications, [key]: !notifications[key] } as typeof notifications;
                    setNotifications(next);
                    try {
                      await updateProfile.mutateAsync({
                        notification_whatsapp: next.whatsapp,
                        notification_push: next.push,
                        notification_email: next.email,
                      });
                    } catch {}
                  }}
                  className="w-5 h-5"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6">
          <h2 className="text-lg font-semibold text-[#1C1C1C] mb-4">Privacidade e Segurança</h2>
          <div className="space-y-3">
            <button className="w-full p-3 border-b border-[#E6E2D9] text-left hover:bg-[#F0F0F0] rounded transition-colors">
              <p className="font-medium text-[#1C1C1C]">Alterar Senha</p>
            </button>
            <button className="w-full p-3 border-b border-[#E6E2D9] text-left hover:bg-[#F0F0F0] rounded transition-colors">
              <p className="font-medium text-[#1C1C1C]">Baixar Dados</p>
            </button>
            <button onClick={() => logout()} className="w-full p-3 text-left hover:bg-[#F0F0F0] rounded transition-colors">
              <p className="font-medium text-[#D32F2F]">Sair da Conta</p>
            </button>
          </div>
        </div>

        <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6">
          <h2 className="text-lg font-semibold text-[#1C1C1C] mb-4">Sobre</h2>
          <div className="space-y-2 text-[#5A5A5A]">
            <p>Versão: 1.0.0</p>
            <p className="text-sm">© 2024 Vaga Certa. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>

      {/* Edit Name */}
      <Dialog open={openName} onOpenChange={setOpenName}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar nome</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={nameVal} onChange={e => setNameVal(e.target.value)} />
            {formErr && <p className="text-sm text-red-600">{formErr}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenName(false)}>Cancelar</Button>
            <Button onClick={async () => {
              const v = nameVal.trim();
              if (!v) { setFormErr('Nome inválido'); return; }
              await updateAccount.mutateAsync({ name: v });
              await utils.auth.me.invalidate();
              setOpenName(false);
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Email */}
      <Dialog open={openEmail} onOpenChange={setOpenEmail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar email</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={emailVal} onChange={e => setEmailVal(e.target.value)} />
            {formErr && <p className="text-sm text-red-600">{formErr}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEmail(false)}>Cancelar</Button>
            <Button onClick={async () => {
              const v = emailVal.trim().toLowerCase();
              const ok = /.+@.+\..+/.test(v);
              if (!ok) { setFormErr('Email inválido'); return; }
              try {
                setFormErr(null);
                await updateAccount.mutateAsync({ email: v });
                await utils.auth.me.invalidate();
                setOpenEmail(false);
              } catch (e: any) {
                setFormErr(e?.message || 'Falha ao atualizar email');
              }
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Phone */}
      <Dialog open={openPhone} onOpenChange={setOpenPhone}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar telefone</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" type="tel" value={phoneVal} onChange={e => setPhoneVal(e.target.value)} placeholder="(11) 99999-9999" />
            {formErr && <p className="text-sm text-red-600">{formErr}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPhone(false)}>Cancelar</Button>
            <Button onClick={async () => {
              const digits = (s: string) => s.replace(/\D/g, '');
              const d = digits(phoneVal);
              if (d.length < 10 || d.length > 11) { setFormErr('Telefone inválido'); return; }
              try {
                setFormErr(null);
                await updateProfile.mutateAsync({ phone: phoneVal.trim() });
                setOpenPhone(false);
              } catch (e:any) {
                setFormErr(e?.message || 'Falha ao atualizar telefone');
              }
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit CPF */}
      <Dialog open={openCpf} onOpenChange={setOpenCpf}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar CPF</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" value={cpfVal} onChange={e => setCpfVal(e.target.value)} placeholder="000.000.000-00" />
            {formErr && <p className="text-sm text-red-600">{formErr}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCpf(false)}>Cancelar</Button>
            <Button onClick={async () => {
              const digits = (s: string) => s.replace(/\D/g, '');
              const d = digits(cpfVal);
              if (d.length !== 11) { setFormErr('CPF inválido'); return; }
              try {
                setFormErr(null);
                await updateProfile.mutateAsync({ cpf: d });
                setOpenCpf(false);
              } catch (e:any) {
                setFormErr(e?.message || 'Falha ao atualizar CPF');
              }
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Dialogs
export function SettingsDialogs() {
  return null;
}
