import type { ReactNode } from "react";
import { useMemo } from "react";
import { useLocation } from "wouter";
import {
  Home as HomeIcon,
  Briefcase,
  BarChart2,
  MessageCircle,
  FileText,
  Settings,
  LogOut,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type NavItem = {
  label: string;
  path: string;
  icon: typeof HomeIcon;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: HomeIcon },
  { label: "Vagas", path: "/jobs", icon: Briefcase },
  { label: "Relatórios", path: "/reports/detail", icon: BarChart2 },
  { label: "MAIA", path: "/chat", icon: MessageCircle },
  { label: "Currículos", path: "/resumes", icon: FileText },
  { label: "Configurações", path: "/settings", icon: Settings },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const { data: stats } = trpc.statistics.getUserStats.useQuery();

  const currentPath = location.split("?")[0];
  const profileCompletion = stats?.profileCompletion ?? 0;
  const totalApplications = stats?.applications ?? 0;

  const initials = useMemo(() => {
    if (!user?.name) return "VC";
    return user.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [user?.name]);

  return (
    <div className="h-screen flex bg-[#F6F1E9] text-[#1C1C1C]">
      <aside className="hidden lg:flex lg:w-72 flex-col bg-[#121013] text-white h-screen sticky top-0">
        <div className="px-6 py-6 border-b border-[#201B22]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#7B1B31] text-sm font-semibold uppercase">
              VC
            </div>
            <div>
              <p className="text-lg font-semibold leading-tight">Vaga Certa</p>
              <p className="text-xs text-[#C8BFC6]">Empregabilidade</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 border-b border-[#201B22]">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-[#241F28] text-lg font-semibold uppercase">
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">{user?.name ?? "Usuario"}</p>
                <p className="text-xs text-[#C8BFC6]">Empregabilidade</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs text-[#C8BFC6]">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-[#FFD54F]" />
                <span>Perfil: {profileCompletion}% completo</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-[#66BB6A]" />
                <span>{totalApplications} candidaturas</span>
              </div>
            </div>
          </div>

          <nav className="px-4 py-6 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                currentPath === item.path ||
                (item.path !== "/reports/detail" && currentPath.startsWith(item.path));
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`group flex w-full items-center gap-3 rounded-[12px] px-4 py-3 text-sm font-medium transition-colors ${
                    isActive ? "bg-[#7B1B31] text-white shadow-sm" : "text-[#D3CBD1] hover:bg-[#1C181F]"
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-4 py-5 border-t border-[#201B22]">
          <button
            onClick={() => {
              void signOut();
            }}
            className="flex w-full items-center gap-3 rounded-[12px] px-4 py-3 text-sm font-medium text-[#E3D9DF] hover:bg-[#1C181F] transition-colors"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
          <p className="mt-4 text-[11px] text-[#8B8087]">
            Vaga Certa {new Date().getFullYear()} - Todos os direitos reservados.
          </p>
        </div>
      </aside>

      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#121013] text-white">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 flex items-center justify-center rounded-full bg-[#7B1B31] text-xs font-semibold uppercase">
              VC
            </div>
            <span className="text-lg font-semibold">Vaga Certa</span>
          </div>
          <button onClick={() => setLocation("/settings")} className="text-sm font-medium text-[#FFD54F]">
            Conta
          </button>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
