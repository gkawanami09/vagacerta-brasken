import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { ChevronLeft, BookOpen, Clock, DollarSign, Award, User } from 'lucide-react';

export default function CourseDetail() {
  const [, setLocation] = useLocation();
  // Get course ID from URL query params
  const courseId = typeof window !== 'undefined' 
    ? parseInt(new URLSearchParams(window.location.search).get('id') || '1')
    : 1;

  // Fetch course from backend
  const { data: course, isLoading } = trpc.courses.getById.useQuery({ id: courseId });
  const { data: recommendedCourses } = trpc.courses.getRecommended.useQuery({ limit: 3 });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F4] p-4">
        <div className="max-w-4xl mx-auto">
          <div className="h-64 bg-[#FFFDF5] rounded-[16px] animate-pulse mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-[#FFFDF5] rounded-[16px] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#FAF9F4] p-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#5A5A5A] text-lg">Curso não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F4]">
      {/* AppBar */}
      <div className="bg-white border-b border-[#E6E2D9] sticky top-0 z-30 p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => setLocation('/reports')} className="p-2 hover:bg-[#F5F5F5] rounded-lg">
            <ChevronLeft size={24} className="text-[#75182C]" />
          </button>
          <h1 className="text-xl font-bold text-[#1C1C1C]">Detalhes do Curso</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Hero Card */}
        <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${course.is_free ? 'bg-[#2E7D32]' : 'bg-[#D32F2F]'}`}>
                  {course.is_free ? 'GRATUITO' : 'PAGO'}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-[#1C1C1C] mb-2">{course.title}</h1>
              <p className="text-[#5A5A5A]">Por {course.provider}</p>
            </div>
            {course.thumbnail && (
              <img src={course.thumbnail} alt={course.title} className="w-32 h-32 rounded-[14px] object-cover" />
            )}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* Sobre */}
          <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6">
            <h2 className="text-xl font-bold text-[#1C1C1C] mb-4">Sobre o Curso</h2>
            <p className="text-[#5A5A5A] leading-relaxed">{course.description}</p>
          </div>

          {/* Habilidades */}
          {course.skills && (
            <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6">
              <h2 className="text-xl font-bold text-[#1C1C1C] mb-4">Habilidades Desenvolvidas</h2>
              <div className="flex flex-wrap gap-2">
                {course.skills.split(',').map((skill, i) => (
                  <span key={i} className="bg-white border border-[#E6E2D9] px-3 py-2 rounded-[14px] text-sm text-[#1C1C1C]">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Informações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Carga Horária */}
            <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="text-[#75182C]" size={24} />
                <h3 className="text-lg font-bold text-[#1C1C1C]">Carga Horária</h3>
              </div>
              <p className="text-3xl font-bold text-[#75182C]">{course.duration_hours}h</p>
            </div>

            {/* Preço */}
            <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="text-[#75182C]" size={24} />
                <h3 className="text-lg font-bold text-[#1C1C1C]">Preço</h3>
              </div>
              <p className="text-3xl font-bold text-[#75182C]">
                {course.is_free ? 'Gratuito' : `R$ ${(((course.price ?? 0) as number) / 100).toFixed(2)}`}
              </p>
            </div>

            {/* Certificação */}
            <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6">
              <div className="flex items-center gap-3 mb-4">
                <Award className="text-[#75182C]" size={24} />
                <h3 className="text-lg font-bold text-[#1C1C1C]">Certificação</h3>
              </div>
              <p className="text-lg text-[#5A5A5A]">{course.certification ? 'Sim' : 'Não'}</p>
            </div>

            {/* Oferta Por */}
            <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="text-[#75182C]" size={24} />
                <h3 className="text-lg font-bold text-[#1C1C1C]">Oferta Por</h3>
              </div>
              <p className="text-lg text-[#5A5A5A]">{course.provider}</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4">
            <a href={course.external_url || '#'} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="w-full bg-[#75182C] text-white">Acessar Curso</Button>
            </a>
            <Button variant="outline" className="flex-1">Salvar Curso</Button>
          </div>
        </div>

        {/* Cursos Similares */}
        {recommendedCourses && recommendedCourses.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-[#1C1C1C] mb-6">Cursos Similares</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendedCourses.map(c => (
                <div key={c.id} className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6 cursor-pointer hover:shadow-[0_8px_16px_rgba(0,0,0,0.15)] transition-shadow">
                  {c.thumbnail && (
                    <img src={c.thumbnail} alt={c.title} className="w-full h-32 rounded-[14px] object-cover mb-4" />
                  )}
                  <h3 className="font-bold text-[#1C1C1C] mb-2">{c.title}</h3>
                  <p className="text-sm text-[#5A5A5A] mb-4 line-clamp-2">{c.description}</p>
                  <Button className="w-full bg-[#75182C] text-white text-sm">Ver Curso</Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
