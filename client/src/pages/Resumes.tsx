import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import {
  Download,
  Upload,
  FileText,
  Trash2,
  MapPin,
  Briefcase,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export default function Resumes() {
  const [, setLocation] = useLocation();
  const [isUploading, setIsUploading] = useState(false);

  // Fetch resumes from backend
  const { data, refetch, isLoading } = trpc.resumes.list.useQuery();
  const uploadMutation = trpc.resumes.uploadResume.useMutation();
  const generateMutation = trpc.resumes.generate.useMutation();

  const resumes = data?.resumes ?? [];
  const recommendedJobs = data?.recommendedJobs ?? [];
  const resumeStatus = data?.resumeStatus;
  const hasResumeContext = useMemo(
    () => resumes.length > 0 || Boolean(resumeStatus?.complete),
    [resumes.length, resumeStatus?.complete]
  );

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        await uploadMutation.mutateAsync({
          file: base64,
          fileName: file.name,
        });
        refetch();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const openJobLink = (url: string) => {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      newWindow.opener = null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F4] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1C1C1C] mb-2">Meus Currículos</h1>
          <p className="text-[#5A5A5A]">Gerencie seus currículos enviados para oportunidades</p>
        </div>

        {hasResumeContext && (
          <section className="mb-10">
            <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-6 border border-[#E6E2D9]">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[#75182C] font-semibold uppercase text-xs tracking-wide">
                    <Sparkles size={16} />
                    Sugestões personalizadas
                  </div>
                  <h2 className="text-2xl font-bold text-[#1C1C1C] mt-2 mb-1">
                    Vagas recomendadas para você
                  </h2>
                  <p className="text-sm text-[#5A5A5A]">
                    {resumeStatus?.complete
                      ? 'Selecionamos oportunidades com base no seu currículo completo.'
                      : `Estamos usando ${resumeStatus?.completion ?? 0}% das informações do seu currículo para encontrar as melhores vagas.`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="self-start border-[#75182C] text-[#75182C]"
                  onClick={() => setLocation('/jobs')}
                >
                  Ver todas as vagas
                </Button>
              </div>

              <div className="mt-6">
                {isLoading && !data ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className="h-32 rounded-[16px] bg-[#E6E2D9]/40 animate-pulse"
                      />
                    ))}
                  </div>
                ) : recommendedJobs.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {recommendedJobs.map((job) => (
                      <div
                        key={job.id}
                        className="bg-white rounded-[16px] border border-[#E6E2D9] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm text-[#5A5A5A] font-medium">
                              {job.company.name}
                            </p>
                            <h3 className="text-lg font-semibold text-[#1C1C1C] leading-snug">
                              {job.title}
                            </h3>
                          </div>
                          <div className="text-right">
                            <span className="text-xs uppercase text-[#9A998C] tracking-wide">
                              Match
                            </span>
                            <p className="text-2xl font-bold text-[#75182C]">
                              {job.matchScore}%
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-[#5A5A5A]">
                          {job.location && (
                            <div className="flex items-center gap-2">
                              <MapPin size={16} className="text-[#75182C]" />
                              <span>
                                {job.location}
                                {job.remote ? ' · remoto' : ''}
                              </span>
                            </div>
                          )}
                          {job.salaryLabel && (
                            <div className="flex items-center gap-2">
                              <Briefcase size={16} className="text-[#75182C]" />
                              <span>{job.salaryLabel}</span>
                            </div>
                          )}
                          <p className="text-xs text-[#9A998C]">Fonte: {job.source === 'adzuna' ? 'Adzuna' : 'Web'}</p>
                        </div>

                        <Button onClick={() => openJobLink(job.applyUrl)} className="mt-auto">
                          <ExternalLink size={16} />
                          Candidatar-se agora
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-sm text-[#5A5A5A]">
                    Ainda estamos refinando as recomendações com base no seu currículo. Volte em instantes para conferir.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="mb-4 flex gap-3">
          <Button onClick={async () => {
            await generateMutation.mutateAsync({});
            await refetch();
          }} className="bg-[#75182C] text-white">Gerar currículo (perfil)</Button>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-[16px] border-2 border-dashed border-[#75182C] p-8 mb-8 text-center cursor-pointer hover:bg-[#FFFDF5] transition-colors">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="resume-upload"
          />
          <label htmlFor="resume-upload" className="cursor-pointer block">
            <Upload className="mx-auto mb-4 text-[#75182C]" size={40} />
            <h3 className="text-lg font-bold text-[#1C1C1C] mb-2">Adicionar Currículo</h3>
            <p className="text-[#5A5A5A] text-sm mb-4">Clique para selecionar ou arraste um arquivo</p>
            <p className="text-xs text-[#5A5A5A]">PDF, DOC ou DOCX (máx. 10MB)</p>
          </label>
        </div>

        {/* Resumes List */}
        {resumes.length > 0 ? (
          <div className="space-y-4">
            {resumes.map(resume => (
              <div key={resume.id} className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-[#75182C] text-white rounded-lg p-3">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-[#1C1C1C]">Currículo Enviado</p>
                    <p className="text-sm text-[#5A5A5A]">
                      Status: <span className="font-semibold capitalize">{resume.status}</span>
                    </p>
                    <p className="text-xs text-[#5A5A5A]">
                      {new Date(resume.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={resume.resume_url} download className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors">
                    <Download size={20} className="text-[#75182C]" />
                  </a>
                  <button className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors">
                    <Trash2 size={20} className="text-[#D32F2F]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#FFFDF5] rounded-[16px] p-12 text-center">
            <FileText size={48} className="mx-auto text-[#5A5A5A] mb-4 opacity-50" />
            <p className="text-[#5A5A5A] text-lg">Nenhum currículo enviado ainda</p>
            <p className="text-[#5A5A5A] text-sm mt-2">Comece a enviar seus currículos para as vagas</p>
          </div>
        )}
      </div>
    </div>
  );
}
