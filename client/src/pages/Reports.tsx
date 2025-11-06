import { BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Reports() {
  return (
    <div className="min-h-screen bg-[#FAF9F4] pb-20">
      <div className="bg-white border-b border-[#E6E2D9] sticky top-0 z-40 px-4 py-4">
        <h1 className="text-2xl font-bold text-[#75182C]">Relatórios</h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-8 text-center">
          <h2 className="text-xl font-semibold text-[#1C1C1C] mb-4">Empresas que combinam com você</h2>
          <div className="w-24 h-24 rounded-full bg-[#75182C] text-white flex items-center justify-center font-bold text-3xl mx-auto">85%</div>
        </div>

        <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-8 text-center">
          <h2 className="text-xl font-semibold text-[#1C1C1C] mb-4">Currículos enviados</h2>
          <div className="text-5xl font-bold text-[#75182C]">12</div>
          <p className="text-[#5A5A5A] mt-2">oportunidades</p>
        </div>

        <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6">
          <h2 className="text-xl font-semibold text-[#1C1C1C] mb-4">Cursos recomendados</h2>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-4 border border-[#E6E2D9] rounded-[14px]">
                <div className="flex-1">
                  <p className="font-semibold text-[#1C1C1C]">Curso de React Avançado</p>
                  <p className="text-sm text-[#5A5A5A]">Plataforma de Educação</p>
                </div>
                <Button className="bg-[#75182C] text-white text-sm">Ver</Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
