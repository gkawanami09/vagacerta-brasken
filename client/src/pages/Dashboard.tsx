import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { TrendingUp, Briefcase, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: stats, isLoading } = trpc.statistics.getUserStats.useQuery();
  const { data: courses } = trpc.courses.getRecommended.useQuery({ limit: 3 });

  const statsCards = stats
    ? [
        { label: "Vagas Vistas", value: stats.jobsViewed, icon: Briefcase, color: "#75182C" },
        { label: "Candidaturas", value: stats.applications, icon: CheckCircle, color: "#2E7D32" },
        { label: "Candidaturas Hoje", value: stats.applicationsToday ?? 0, icon: CheckCircle, color: "#1E88E5" },
        { label: "Perfil Completo", value: `${stats.profileCompletion}%`, icon: TrendingUp, color: "#FFD700" },
        { label: "Entrevistas", value: stats.interviews, icon: Clock, color: "#D32F2F" },
      ]
    : [];

  const firstName =
    user?.name?.trim().split(" ").filter(Boolean)[0] ?? "Usuario";

  return (
    <div className="min-h-screen bg-[#FAF9F4] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#1C1C1C] mb-2">
            Bem-vindo, {firstName}! <span aria-hidden="true"></span>
          </h1>
          <p className="text-[#5A5A5A]">
            Aqui esta um resumo da sua jornada de empregabilidade
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className="bg-[#FFFDF5] rounded-[16px] h-32 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={`${stat.label}-${index}`}
                  className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Icon size={28} style={{ color: stat.color }} />
                  </div>
                  <p className="text-[#5A5A5A] text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-[#1C1C1C]">{stat.value}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6">
            <h2 className="text-xl font-bold text-[#1C1C1C] mb-6">
              Proximos Eventos
            </h2>
            <p className="text-sm text-[#5A5A5A]">Sem eventos no momento</p>
          </div>

          <div className="lg:col-span-1 bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6">
            <h2 className="text-xl font-bold text-[#1C1C1C] mb-6">
              Completude do Perfil
            </h2>
            <div className="relative w-32 h-32 mx-auto mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#E6E2D9" strokeWidth="8" />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#75182C"
                  strokeWidth="8"
                  strokeDasharray={`${((stats?.profileCompletion ?? 0) / 100) * 339.29} 339.29`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-2xl font-bold text-[#75182C]">
                  {stats?.profileCompletion ?? 0}%
                </p>
              </div>
            </div>
            <p className="text-sm text-[#5A5A5A] text-center mb-4">
              Complete seu perfil para aumentar suas chances
            </p>
            <Button className="w-full bg-[#75182C] text-white" onClick={() => setLocation("/chat")}>
              Completar Perfil
            </Button>
          </div>

          <div className="lg:col-span-1 bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6">
            <h2 className="text-xl font-bold text-[#1C1C1C] mb-6">
              Ações Rápidas
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => setLocation("/jobs")}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-white border border-[#E6E2D9] hover:bg-[#F5F5F5] transition-colors"
              >
                <span className="text-sm font-medium text-[#1C1C1C]">
                  Explorar Vagas
                </span>
                <ArrowRight size={18} className="text-[#75182C]" />
              </button>
              <button
                onClick={() => setLocation("/chat")}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-white border border-[#E6E2D9] hover:bg-[#F5F5F5] transition-colors"
              >
                <span className="text-sm font-medium text-[#1C1C1C]">
                  Chat com MAIA
                </span>
                <ArrowRight size={18} className="text-[#75182C]" />
              </button>
              <button
                onClick={() => setLocation("/reports")}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-white border border-[#E6E2D9] hover:bg-[#F5F5F5] transition-colors"
              >
                <span className="text-sm font-medium text-[#1C1C1C]">
                  Ver Relatórios
                </span>
                <ArrowRight size={18} className="text-[#75182C]" />
              </button>
            </div>
          </div>
        </div>

        {courses && courses.length > 0 && (
          <div className="mt-8 bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6">
            <h2 className="text-2xl font-bold text-[#1C1C1C] mb-6">
              Recomendações para você
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-[14px] border border-[#E6E2D9] p-6 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow"
                >
                  {course.imagem ? (
                    <img
                      src={course.imagem}
                      alt={course.titulo}
                      className="w-full h-32 rounded-[14px] object-cover mb-4"
                    />
                  ) : null}
                  <p className="text-xs font-semibold text-[#75182C] mb-2 uppercase">
                    {course.categoria}
                  </p>
                  <h3 className="text-lg font-semibold text-[#1C1C1C] mb-2">
                    {course.titulo}
                  </h3>
                  <p className="text-sm text-[#5A5A5A] mb-4 line-clamp-2">
                    {course.descricaoResumo ?? ""}
                  </p>
                  <Button
                    className="w-full bg-[#75182C] text-white text-sm"
                    onClick={() =>
                      setLocation(`/course-detail?id=${encodeURIComponent(String(course.id))}`)
                    }
                  >
                    Explorar
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
