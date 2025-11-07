import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Clock, Award, User, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";

type CourseDetailResponse = {
  id: string;
  titulo: string;
  preco: string;
  avaliacao?: number;
  plataforma: string;
  link: string;
  imagem?: string;
  sobre: string;
  habilidadesDesenvolvidas: string[];
  cargaHoraria?: string;
  duracaoEstimada?: string;
  certificacao: boolean;
  ofertaPor: string;
};

type CourseListItem = {
  id: string;
  categoria: string;
  titulo: string;
  descricaoResumo: string;
  preco: string;
  avaliacao?: number;
  plataforma: string;
  habilidadesDesenvolvidas: string[];
  cargaHoraria?: string;
  duracaoEstimada?: string;
  certificacao: boolean;
  imagem?: string;
  link: string;
};

type Detail = CourseDetailResponse & {
  resumo?: string;
};

type StructuredCourseContent = {
  title?: string;
  description?: string;
  url?: string;
  content?: string;
  provider?: string;
  pricing?: string;
};

const toOptionalText = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const parseCourseContent = (raw?: string): StructuredCourseContent | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const data = typeof parsed?.data === "object" && parsed.data !== null ? parsed.data : parsed;
    if (typeof data !== "object" || data === null) return null;

    const record = data as Record<string, unknown>;
    const content = toOptionalText(record.content);

    return {
      title: toOptionalText(record.title),
      description: toOptionalText(record.description),
      url: toOptionalText(record.url),
      content: content ? content.replace(/\r\n/g, "\n") : undefined,
      provider:
        toOptionalText(record.provider) ??
        toOptionalText(record.author) ??
        toOptionalText(record.platform),
      pricing:
        toOptionalText(record.pricing) ??
        toOptionalText(record.priceLabel) ??
        toOptionalText(record.price),
    };
  } catch {
    return null;
  }
};

const toPlainText = (value?: string): string | undefined => {
  if (!value) return undefined;
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
};

export default function CourseDetail() {
  const [, setLocation] = useLocation();
  const courseId =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") ?? "" : "";
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: recommendedCourses } = trpc.courses.getRecommended.useQuery({ limit: 3 });
  const {
    data: summaryData,
    isLoading: summaryLoading,
    isFetching: summaryFetching,
  } = trpc.courses.getSummary.useQuery(
    { id: courseId, maxLength: 320 },
    { enabled: Boolean(courseId) }
  );

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/courses/${encodeURIComponent(courseId)}`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Erro ao buscar curso (${res.status})`);
        return (await res.json()) as CourseDetailResponse;
      })
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(String((err as Error).message || err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const parsedContent = useMemo(() => parseCourseContent(detail?.sobre), [detail?.sobre]);
  const fallbackSummary = useMemo(() => {
    if (!detail) return "Resumo indisponivel no momento.";
    const candidates = [
      parsedContent?.description,
      parsedContent?.content,
      detail.resumo,
      detail.sobre,
    ];
    for (const candidate of candidates) {
      const plain = toPlainText(candidate);
      if (plain) return plain;
    }
    return "Resumo indisponivel no momento.";
  }, [detail, parsedContent]);

  const similarCourses: CourseListItem[] = useMemo(() => {
    if (!recommendedCourses) return [];
    return recommendedCourses
      .filter((course) => String(course.id) !== courseId)
      .slice(0, 3);
  }, [recommendedCourses, courseId]);

  if (!courseId) {
    return (
      <div className="min-h-screen bg-[#FAF9F4] flex items-center justify-center">
        <p className="text-[#5A5A5A]">Selecione um curso para visualizar os detalhes.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F4] p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-64 bg-[#FFFDF5] rounded-[16px] animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#FFFDF5] rounded-[16px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-[#FAF9F4] p-6">
        <div className="max-w-4xl mx-auto text-center bg-white border border-[#E6E2D9] rounded-[16px] p-10">
          <p className="text-[#5A5A5A]">{error ?? "Curso não encontrado"}</p>
        </div>
      </div>
    );
  }

  const courseTitle = parsedContent?.title ?? detail.titulo;
  const providerLabel = parsedContent?.provider ?? detail.ofertaPor;
  const priceLabel = parsedContent?.pricing ?? detail.preco;
  const courseLink = parsedContent?.url ?? detail.link;
  const summaryText = summaryData?.summary?.trim();
  const courseSummary =
    summaryText && summaryText.length > 0 ? summaryText : fallbackSummary;
  const showSummarySkeleton = (summaryLoading || summaryFetching) && !summaryText;

  return (
    <div className="min-h-screen bg-[#FAF9F4]">
      <header className="bg-white border-b border-[#E6E2D9] sticky top-0 z-20 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => setLocation("/reports/detail")} className="p-2 hover:bg-[#F5F5F5] rounded-lg">
            <ChevronLeft size={24} className="text-[#75182C]" />
          </button>
          <h1 className="text-lg font-semibold text-[#1C1C1C]">Detalhes do Curso</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <section className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              {priceLabel ? (
                <span className="inline-block px-3 py-1 mb-3 text-xs font-bold rounded-full bg-[#75182C] text-white">
                  {priceLabel}
                </span>
              ) : null}
              <h2 className="text-3xl font-bold text-[#1C1C1C] mb-2">{courseTitle}</h2>
              <p className="text-[#5A5A5A]">Oferta por {providerLabel}</p>
            </div>
          </div>

          <div className="mt-4 text-[#5A5A5A] leading-relaxed min-h-[60px]">
            {showSummarySkeleton ? (
              <div className="space-y-3">
                <div className="h-3 w-3/4 rounded-full bg-[#E6E2D9] animate-pulse" />
                <div className="h-3 w-2/3 rounded-full bg-[#E6E2D9] animate-pulse" />
                <div className="h-3 w-1/2 rounded-full bg-[#E6E2D9] animate-pulse" />
              </div>
            ) : (
              <p className="whitespace-pre-line">{courseSummary}</p>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="text-[#75182C]" size={22} />
              <h3 className="text-lg font-semibold text-[#1C1C1C]">Carga Horária</h3>
            </div>
            <p className="text-[#5A5A5A] text-sm">{detail.cargaHoraria ?? detail.duracaoEstimada ?? "Não informada"}</p>
          </div>

          <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6">
            <div className="flex items-center gap-3 mb-3">
              <Award className="text-[#75182C]" size={22} />
              <h3 className="text-lg font-semibold text-[#1C1C1C]">Certificação</h3>
            </div>
            <p className="text-[#5A5A5A] text-sm">{detail.certificacao ? "Disponível" : "Não informada"}</p>
          </div>

          <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6">
            <div className="flex items-center gap-3 mb-3">
              <User className="text-[#75182C]" size={22} />
              <h3 className="text-lg font-semibold text-[#1C1C1C]">Plataforma</h3>
            </div>
            <p className="text-[#5A5A5A] text-sm">{detail.plataforma}</p>
          </div>
        </section>

        <section className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-6 space-y-4">
          <h3 className="text-lg font-semibold text-[#1C1C1C]">Habilidades Desenvolvidas</h3>
          <div className="flex flex-wrap gap-2">
            {detail.habilidadesDesenvolvidas.map((skill) => (
              <span key={skill} className="bg-white border border-[#E6E2D9] px-3 py-2 rounded-[14px] text-sm">
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section className="flex flex-col md:flex-row gap-4">
          <a href={courseLink} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button className="w-full bg-[#75182C] text-white flex items-center justify-center gap-2">
              <ExternalLink size={16} /> Acessar Curso
            </Button>
          </a>
          <Button variant="outline" className="flex-1">
            Salvar Curso
          </Button>
        </section>

        {similarCourses.length > 0 && (
          <section className="mt-10 space-y-4">
            <h3 className="text-xl font-semibold text-[#1C1C1C]">Cursos Similares</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {similarCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-[#FFFDF5] border border-[#E6E2D9] rounded-[16px] p-5 shadow-sm hover:shadow-md transition"
                >
                  <p className="text-xs font-semibold text-[#75182C] uppercase mb-2">{course.plataforma}</p>
                  <h4 className="font-semibold text-[#1C1C1C] mb-2">{course.titulo}</h4>
                  <p className="text-sm text-[#5A5A5A] mb-4 line-clamp-3">{course.descricaoResumo}</p>
                  <Button
                    variant="outline"
                    className="w-full text-sm"
                    onClick={() => setLocation(`/course-detail?id=${encodeURIComponent(course.id)}`)}
                  >
                    Ver Curso
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

