import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Users,
  Zap,
  TrendingUp,
  ShieldCheck,
  Star,
} from "lucide-react";
import LandingHeader from "@/components/marketing/LandingHeader";
import LandingFooter from "@/components/marketing/LandingFooter";

const STATS = [
  {
    value: "80%",
    title: "dos curriculos sao descartados",
    subtitle: "por falta de otimizacao",
  },
  {
    value: "2x",
    title: "mais chances de ser chamado",
    subtitle: "com curriculo otimizado",
  },
  {
    value: "10k+",
    title: "vagas disponiveis",
    subtitle: "atualizadas diariamente",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Curriculo com IA",
    description:
      "Gere um curriculo pronto para ATS em minutos com apoio da MAIA.",
  },
  {
    icon: TrendingUp,
    title: "Vagas sob medida",
    description:
      "Receba oportunidades que combinam com seu perfil e objetivos.",
  },
  {
    icon: Users,
    title: "Mentoria continua",
    description:
      "Acompanhe sua jornada e receba dicas para cada etapa do processo.",
  },
  {
    icon: ShieldCheck,
    title: "Dados protegidos",
    description:
      "Seguranca total com criptografia e respeito a LGPD em cada etapa.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Crie seu perfil",
    description:
      "Cadastre suas experiencias, habilidades e preferencias de vaga.",
  },
  {
    number: "02",
    title: "Otimize com IA",
    description:
      "Deixe a MAIA transformar seu curriculo e carta de apresentacao.",
  },
  {
    number: "03",
    title: "Encontre vagas",
    description:
      "Receba recomendacoes alinhadas ao seu objetivo profissional.",
  },
];

const TESTIMONIALS = [
  {
    name: "Joao Silva",
    role: "Desenvolvedor Front-end",
    text: "Consegui entrevistas em duas semanas usando as recomendacoes da plataforma.",
  },
  {
    name: "Maria Santos",
    role: "UX Designer",
    text: "A MAIA me ajudou a reescrever meu curriculo e destacar meus projetos.",
  },
  {
    name: "Pedro Costa",
    role: "Product Manager",
    text: "Ter tudo em um unico lugar facilita demais a jornada de recolocacao.",
  },
];

const FAQ = [
  {
    question: "O Vaga Certa e gratuito?",
    answer:
      "Sim, voce pode criar sua conta, gerar curriculo, explorar vagas e usar a MAIA sem custo.",
  },
  {
    question: "Como a MAIA ajuda?",
    answer:
      "A MAIA usa IA para analisar seu perfil e gerar curriculos, cartas e dicas personalizadas.",
  },
  {
    question: "Posso salvar minhas vagas?",
    answer:
      "Sim, salve vagas favoritas, acompanhe candidaturas e receba alertas em tempo real.",
  },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const scrollToHash = () => {
      if (typeof window === "undefined") return;
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;
      const target = document.getElementById(hash);
      if (target) {
        window.requestAnimationFrame(() =>
          target.scrollIntoView({ behavior: "smooth", block: "start" })
        );
      }
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F4] text-[#1C1C1C]">
      <div className="bg-gradient-to-br from-[#7B1B31] to-[#5C1323] text-white">
        <LandingHeader />
        <div className="px-4 py-20 md:py-28">
          <div id="inicio" className="max-w-5xl mx-auto text-center space-y-6">
          <span className="inline-block text-sm uppercase tracking-[0.3em] text-[#FFD54F]">
            Empregabilidade com IA
          </span>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Encontre sua <span className="text-[#FFD54F]">Vaga Certa</span>
          </h1>
          <p className="text-lg md:text-xl text-[#F5E8EC] max-w-3xl mx-auto">
            Inteligencia artificial para conectar voce com as melhores
            oportunidades de emprego, do curriculo ideal aos processos seletivos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setLocation("/signup")}
              className="bg-[#FFD54F] text-[#5C1323] hover:bg-[#FFCA28] px-8 py-4 text-lg font-semibold"
            >
              Comecar Agora
            </Button>
            <Button
              onClick={() => setLocation("/login")}
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-[#5C1323] px-8 py-4 text-lg font-semibold"
            >
              Ja tem conta?
            </Button>
          </div>
        </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-16 md:py-24 space-y-16">
        <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATS.map((stat) => (
            <div
              key={stat.value}
              className="bg-[#FFFDF5] rounded-[20px] shadow-[0_14px_40px_rgba(91,19,35,0.08)] p-8"
            >
              <p className="text-4xl font-bold text-[#7B1B31]">{stat.value}</p>
              <p className="mt-3 text-[#4A4046] font-medium">{stat.title}</p>
              <p className="mt-2 text-sm text-[#8F858B]">{stat.subtitle}</p>
            </div>
          ))}
        </section>

        <section id="recursos" className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
            <div>
              <span className="text-sm font-semibold text-[#7B1B31] uppercase tracking-[0.25em]">
                Recursos
              </span>
              <h2 className="mt-2 text-3xl md:text-4xl font-bold">
                Tudo que voce precisa em um unico lugar
              </h2>
              <p className="mt-3 text-[#5A5056] max-w-2xl">
                Combine dados reais de vagas com inteligencia artificial para criar
                uma jornada de recolocacao clara, eficiente e personalizada.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white border border-[#EFE6EA] rounded-[20px] p-6 flex gap-4 hover:shadow-[0_10px_30px_rgba(91,19,35,0.08)] transition-shadow"
              >
                <div className="h-12 w-12 rounded-full bg-[#F5E9EC] flex items-center justify-center">
                  <feature.icon size={20} className="text-[#7B1B31]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-[#5A5056] mt-2">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="funcionalidades" className="max-w-6xl mx-auto bg-[#7B1B31] text-white rounded-[28px] p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-xl space-y-5">
              <span className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-[#FFD54F]">
                Como funciona
              </span>
              <h2 className="text-3xl md:text-4xl font-bold">
                Sua jornada de recolocacao com passos simples
              </h2>
              <p className="text-[#F5E8EC]">
                Do cadastro ao acompanhamento das candidaturas, voce conta com
                nossa IA para acelerar cada etapa e aumentar suas chances de contratacao.
              </p>
            </div>
            <div className="flex-1 grid grid-cols-1 gap-4">
              {STEPS.map((step) => (
                <div
                  key={step.number}
                  className="bg-[#67162A] rounded-[18px] p-5 border border-[#8F2D45]"
                >
                  <div className="text-sm font-semibold text-[#FFD54F]">
                    {step.number}
                  </div>
                  <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-[#F5E8EC]">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="depoimentos" className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <span className="text-sm font-semibold text-[#7B1B31] uppercase tracking-[0.25em]">
                Depoimentos
              </span>
              <h2 className="mt-2 text-3xl font-bold">
                Historias de quem encontrou a vaga certa
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-white border border-[#EFE6EA] rounded-[20px] p-6 space-y-4"
              >
                <Star className="text-[#FFD54F]" size={24} />
                <p className="text-[#4A4046]">{testimonial.text}</p>
                <div>
                  <p className="font-semibold text-[#1C1C1C]">{testimonial.name}</p>
                  <p className="text-sm text-[#8F858B]">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="max-w-5xl mx-auto space-y-4">
          <div className="text-center space-y-2">
            <span className="text-sm font-semibold text-[#7B1B31] uppercase tracking-[0.2em]">
              FAQ
            </span>
            <h2 className="text-3xl font-bold">Perguntas frequentes</h2>
            <p className="text-[#5A5056]">
              Tudo que voce precisa saber para comecar com seguranca.
            </p>
          </div>
          <div className="space-y-3">
            {FAQ.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={item.question}
                  className="bg-white border border-[#EFE6EA] rounded-[16px] p-5"
                >
                  <button
                    className="flex w-full items-center justify-between text-left"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    <span className="font-semibold text-[#1C1C1C]">
                      {item.question}
                    </span>
                    <ChevronDown
                      size={20}
                      className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen ? (
                    <p className="mt-3 text-sm text-[#5A5056]">{item.answer}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="max-w-5xl mx-auto bg-[#FFFDF5] rounded-[24px] p-10 text-center shadow-[0_14px_40px_rgba(91,19,35,0.08)]">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1C1C1C] mb-4">
            Pronto para acelerar sua recolocacao?
          </h2>
          <p className="text-[#5A5056] mb-8 max-w-2xl mx-auto">
            Cadastre-se gratuitamente, gere seu curriculo e comece a receber
            oportunidades alinhadas ao seu perfil profissional.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setLocation("/signup")}
              className="bg-[#7B1B31] text-white hover:bg-[#631327] px-8 py-4 text-lg font-semibold"
            >
              Criar conta gratuita
            </Button>
            <Button
              onClick={() => setLocation("/login")}
              variant="outline"
              className="border-2 border-[#7B1B31] text-[#7B1B31] hover:bg-[#7B1B31] hover:text-white px-8 py-4 text-lg font-semibold"
            >
              Entrar
            </Button>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
