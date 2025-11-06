import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Download, Upload, FileText, Trash2 } from 'lucide-react';

export default function Resumes() {
  const [isUploading, setIsUploading] = useState(false);
  
  // Fetch resumes from backend
  const { data: resumes, refetch } = trpc.resumes.list.useQuery();
  const uploadMutation = trpc.resumes.uploadResume.useMutation();
  const generateMutation = trpc.resumes.generate.useMutation();

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

  return (
    <div className="min-h-screen bg-[#FAF9F4] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1C1C1C] mb-2">Meus Currículos</h1>
          <p className="text-[#5A5A5A]">Gerencie seus currículos enviados para oportunidades</p>
        </div>

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
        {resumes && resumes.length > 0 ? (
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
