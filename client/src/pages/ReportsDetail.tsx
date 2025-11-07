import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';

export default function ReportsDetail() {
  const [selectedDays, setSelectedDays] = useState(30);
  const [, setLocation] = useLocation();
  
  // Fetch report data from backend
  const { data: reportData, isLoading } = trpc.statistics.getReportData.useQuery({ days: selectedDays });
  const { data: courses } = trpc.courses.getRecommended.useQuery({ limit: 5 });

  return (
    <div className="min-h-screen bg-[#FAF9F4] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1C1C1C] mb-4">Seus Relatórios</h1>
          
          {/* Time Filter */}
          <div className="flex gap-2">
            {[7, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => setSelectedDays(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedDays === days
                    ? 'bg-[#75182C] text-white'
                    : 'bg-white text-[#1C1C1C] border border-[#E6E2D9]'
                }`}
              >
                Últimos {days} dias
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#FFFDF5] rounded-[16px] h-40 animate-pulse" />
            ))}
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* Banner 1: Compatibility */}
            <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-8">
              <h2 className="text-xl font-bold text-[#1C1C1C] mb-6">Empresas que combinam com você</h2>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="90" fill="none" stroke="#E6E2D9" strokeWidth="12" />
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      fill="none"
                      stroke="#75182C"
                      strokeWidth="12"
                      strokeDasharray={`${(reportData.compatibility / 100) * 565.49} 565.49`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-4xl font-bold text-[#75182C]">{reportData.compatibility}%</p>
                    <p className="text-sm text-[#5A5A5A]">compatibilidade média</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Banner 2: Resumes Submitted */}
            <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-8">
              <h2 className="text-xl font-bold text-[#1C1C1C] mb-6">Já enviamos seu currículo para</h2>
              <div className="text-center">
                <p className="text-6xl font-bold text-[#75182C] mb-2">{reportData.resumesSubmitted}</p>
                <p className="text-lg text-[#5A5A5A]">oportunidades</p>
              </div>
            </div>

            {/* Banner 3: Recommended Courses */}
            <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-8">
              <h2 className="text-xl font-bold text-[#1C1C1C] mb-6">Cursos recomendados para fortalecer seu perfil</h2>
              <div className="space-y-4">
                {courses && courses.length > 0 ? (
                  courses.map(course => (
                    <div key={course.id} className="bg-white rounded-[14px] border border-[#E6E2D9] p-4 flex items-center justify-between hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold bg-[#75182C] text-white px-2 py-1 rounded">
                            {course.categoria}
                          </span>
                        </div>
                        <h3 className="font-bold text-[#1C1C1C] mb-1">{course.titulo}</h3>
                        <p className="text-sm text-[#5A5A5A] line-clamp-2">{course.descricaoResumo ?? ""}</p>
                      </div>
                      {course.imagem && (
                        <div className="ml-4 flex-shrink-0">
                          <img src={course.imagem} alt={course.titulo} className="w-24 h-24 rounded-lg object-cover" />
                        </div>
                      )}
                      <Button className="ml-4 bg-[#75182C] text-white" onClick={() => setLocation(`/course-detail?id=${encodeURIComponent(String(course.id))}`)}>
                        Ver curso
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-[#5A5A5A]">Nenhum curso recomendado no momento</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
