import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { ArrowLeft, Bookmark, Share2, MapPin, DollarSign, Clock, Users } from 'lucide-react';

export default function JobDetail() {
  const [, setLocation] = useLocation();
  const [isSaved, setIsSaved] = useState(false);

  const job = {
    id: 1,
    title: 'Desenvolvedor React Senior',
    company: 'Tech Company',
    logo: '🏢',
    location: 'São Paulo, SP',
    salary: 'R$ 8.000 - R$ 12.000',
    type: 'Tempo integral',
    compatibility: 85,
    about: 'Procuramos um Desenvolvedor React Senior com experiência em projetos de grande escala. Você trabalhará com uma equipe talentosa em um ambiente inovador.',
    description: 'Responsabilidades:\n• Desenvolver e manter componentes React\n• Colaborar com designers e product managers\n• Revisar código de outros desenvolvedores\n• Participar de reuniões de planejamento\n\nRequisitos:\n• 5+ anos de experiência com React\n• Conhecimento de TypeScript\n• Experiência com testes unitários\n• Comunicação em inglês fluente',
    salary_details: 'R$ 8.000 - R$ 12.000 por mês, dependendo da experiência',
    process: '1. Entrevista com RH\n2. Teste técnico\n3. Entrevista com time\n4. Entrevista final com gerente',
    benefits: ['Vale refeição', 'Vale transporte', 'Plano de saúde', 'Home office 3x/semana', 'Bônus anual'],
  };

  const similarJobs = [
    { id: 2, title: 'Desenvolvedor React Pleno', company: 'StartUp XYZ', compatibility: 78 },
    { id: 3, title: 'Frontend Engineer', company: 'Big Corp', compatibility: 72 },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F4] pb-20">
      {/* AppBar */}
      <div className="bg-white border-b border-[#E6E2D9] sticky top-0 z-40 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => setLocation('/jobs')} className="p-2 hover:bg-[#F0F0F0] rounded-lg">
            <ArrowLeft size={24} className="text-[#75182C]" />
          </button>
          <h1 className="text-xl font-bold text-[#1C1C1C]">Detalhes da Vaga</h1>
          <button onClick={() => setLocation('/jobs')} className="p-2 hover:bg-[#F0F0F0] rounded-lg">
            <Share2 size={24} className="text-[#75182C]" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Card */}
        <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-8 mb-8">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div className="flex-1">
              <div className="text-5xl mb-4">{job.logo}</div>
              <h1 className="text-3xl font-bold text-[#1C1C1C] mb-2">{job.title}</h1>
              <p className="text-lg text-[#5A5A5A] mb-4">{job.company}</p>
              <div className="flex flex-wrap gap-4 text-[#5A5A5A]">
                <div className="flex items-center gap-2">
                  <MapPin size={18} />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign size={18} />
                  <span>{job.salary}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} />
                  <span>{job.type}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-[#75182C] text-white flex items-center justify-center font-bold text-2xl">
                {job.compatibility}%
              </div>
              <p className="text-sm text-[#5A5A5A] text-center">Compatibilidade com seu perfil</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button className="flex-1 bg-[#75182C] text-white hover:opacity-90 py-3">
              Enviar Currículo
            </Button>
            <Button
              onClick={() => setIsSaved(!isSaved)}
              className={`flex-1 border-2 border-[#75182C] py-3 ${isSaved ? 'bg-[#75182C] text-white' : 'text-[#75182C] hover:bg-[#75182C] hover:text-white'}`}
            >
              <Bookmark size={18} className="mr-2" />
              {isSaved ? 'Salvo' : 'Salvar'}
            </Button>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* About */}
          <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-8">
            <h2 className="text-2xl font-bold text-[#1C1C1C] mb-4">Sobre a Oportunidade</h2>
            <p className="text-[#5A5A5A] leading-relaxed">{job.about}</p>
          </div>

          {/* Description */}
          <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-8">
            <h2 className="text-2xl font-bold text-[#1C1C1C] mb-4">Descrição da Vaga</h2>
            <p className="text-[#5A5A5A] whitespace-pre-line leading-relaxed">{job.description}</p>
          </div>

          {/* Salary */}
          <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-8">
            <h2 className="text-2xl font-bold text-[#1C1C1C] mb-4">Remuneração</h2>
            <p className="text-lg text-[#75182C] font-semibold mb-2">{job.salary_details}</p>
            <div className="space-y-2">
              {job.benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-[#5A5A5A]">
                  <span className="w-2 h-2 bg-[#75182C] rounded-full"></span>
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          {/* Process */}
          <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-8">
            <h2 className="text-2xl font-bold text-[#1C1C1C] mb-4">Processo Seletivo</h2>
            <p className="text-[#5A5A5A] whitespace-pre-line leading-relaxed">{job.process}</p>
          </div>
        </div>

        {/* Similar Jobs */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-[#1C1C1C] mb-6">Vagas Similares</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {similarJobs.map(job => (
              <div key={job.id} className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6">
                <h3 className="text-lg font-semibold text-[#1C1C1C] mb-2">{job.title}</h3>
                <p className="text-[#5A5A5A] mb-4">{job.company}</p>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-full bg-[#75182C] text-white flex items-center justify-center font-bold">
                    {job.compatibility}%
                  </div>
                  <Button className="bg-[#75182C] text-white text-sm">Ver</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
