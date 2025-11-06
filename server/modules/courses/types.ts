export interface NormalizedCourse {
  id: string;
  title: string;
  summary: string;
  url: string;
  imageUrl?: string;
  provider: string;
  category?: string;
  priceLabel: string;
  rating?: number;
  skills: string[];
  workload?: string;
  estimatedTime?: string;
  certification: boolean;
  level?: string;
  courseType?: string;
}

export interface CourseDetailData {
  id: string;
  title: string;
  summary: string;
  description: string;
  url: string;
  imageUrl?: string;
  provider: string;
  rating?: number;
  priceLabel: string;
  skills: string[];
  workload?: string;
  estimatedTime?: string;
  certification: boolean;
  durationHours?: number;
  similar: Array<{
    title: string;
    priceLabel: string;
    rating?: number;
    url: string;
  }>;
}

export interface CourseRecommendationResponse {
  recommended: CourseListItem[];
}

export interface CourseListItem {
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
}

export interface CourseDetailResponse {
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
  similares: Array<{
    titulo: string;
    preco: string;
    avaliacao?: number;
    link: string;
  }>;
}
