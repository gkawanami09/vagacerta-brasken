import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, DollarSign, Briefcase } from 'lucide-react';

export default function Jobs() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch jobs from backend
  const { data: jobs, isLoading, error } = trpc.jobs.list.useQuery();
  const { data: searchResults } = trpc.jobs.search.useQuery(
    { query: searchQuery, limit: 20 },
    { enabled: searchQuery.length > 0 }
  );

  const jobsToDisplay = searchQuery ? searchResults : jobs;

  return (
    <div className="min-h-screen bg-[#FAF9F4]">
      {/* AppBar */}
      <div className="bg-white border-b border-[#E6E2D9] sticky top-0 z-30 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-[#1C1C1C] mb-4">Vagas para Você</h1>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-[#5A5A5A]" size={20} />
            <Input
              type="text"
              placeholder="Buscar vagas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#FFFDF5] border-[#E6E2D9]"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#FFFDF5] rounded-[16px] p-6 h-32 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-[16px] p-6 text-center">
            <p className="text-red-600">Erro ao carregar vagas. Tente novamente.</p>
          </div>
        ) : jobsToDisplay && jobsToDisplay.length > 0 ? (
          <div className="space-y-4">
            {jobsToDisplay.map(job => (
              <div
                key={String(job.id)}
                onClick={() => {
                  if ((job as any).external_url) {
                    window.open((job as any).external_url, '_blank');
                  } else {
                    setLocation(`/job-detail?id=${job.id}`)
                  }
                }}
                className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6 cursor-pointer hover:shadow-[0_8px_16px_rgba(0,0,0,0.15)] transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#1C1C1C] mb-1">{job.title}</h2>
                    <p className="text-[#5A5A5A] font-medium">{job.company}</p>
                  </div>
                  <div className="bg-[#75182C] text-white rounded-full w-12 h-12 flex items-center justify-center font-bold">
                    {job.compatibility}%
                  </div>
                </div>

                <p className="text-[#5A5A5A] mb-4 line-clamp-2">{job.description}</p>

                <div className="flex flex-wrap gap-4 mb-4 text-sm text-[#5A5A5A]">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} />
                    R$ {job.salary_min?.toLocaleString()} - R$ {job.salary_max?.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} />
                    {job.modality}
                  </div>
                </div>

                <Button className="w-full bg-[#75182C] text-white">Ver Detalhes</Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#FFFDF5] rounded-[16px] p-12 text-center">
            <p className="text-[#5A5A5A] text-lg">Nenhuma vaga encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
