import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Menu, X, Home, Briefcase, BarChart3, MessageCircle, FileText, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, logout, loading } = useAuth();
  const { data: stats } = trpc.statistics.getUserStats.useQuery();

  const initials = useMemo(() => {
    const name = user?.name?.trim();
    if (!name) return 'VC';
    const parts = name.split(/\s+/);
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
    return (first + last).toUpperCase();
  }, [user?.name]);

  const menuItems = [
    { label: 'Dashboard', icon: Home, path: '/dashboard' },
    { label: 'Vagas', icon: Briefcase, path: '/jobs' },
    { label: 'Relatórios', icon: BarChart3, path: '/reports' },
    { label: 'Chat MAIA', icon: MessageCircle, path: '/chat' },
    { label: 'Currículos', icon: FileText, path: '/resumes' },
    { label: 'Configurações', icon: Settings, path: '/settings' },
  ];

  const isActive = (path: string) => location === path;

  if (loading) {
    return (
      <div className="hidden lg:block w-64 bg-[#1C1C1C]" />
    );
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 lg:hidden bg-[#75182C] text-white p-3 rounded-full shadow-lg hover:opacity-90"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-[#1C1C1C] text-white z-40 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-[#333] flex items-center gap-3">
          <div className="w-10 h-10 bg-[#75182C] rounded-lg flex items-center justify-center font-bold text-lg">
            VC
          </div>
          <div>
            <h1 className="font-bold text-lg">Vaga Certa</h1>
            <p className="text-xs text-gray-400">Empregabilidade</p>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-6 border-b border-[#333]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#75182C] rounded-full flex items-center justify-center font-bold text-lg">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-sm">{user?.name || 'Usuário'}</p>
              <p className="text-xs text-gray-400">{user?.loginMethod || 'Conta'}</p>
            </div>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <p>📊 Perfil: {stats?.profileCompletion ?? 0}% completo</p>
            <p>✅ Candidaturas hoje: {stats?.applicationsToday ?? 0}</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  setLocation(item.path);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-[#75182C] text-white'
                    : 'text-gray-300 hover:bg-[#333]'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#333]">
          <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#333] transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Padding */}
      <div className="hidden lg:block w-64" />
    </>
  );
}
