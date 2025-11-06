import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { ChevronDown, Star, Users, TrendingUp, Zap, CheckCircle } from 'lucide-react';

export default function Home() {
  const [, setLocation] = useLocation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    { q: 'Como funciona o Vaga Certa?', a: 'Você cria um perfil, otimiza seu currículo com IA, e recebe vagas personalizadas automaticamente. Nossa inteligência artificial analisa compatibilidade entre seu perfil e as oportunidades.' },
    { q: 'É realmente gratuito?', a: 'Sim! O Vaga Certa é 100% gratuito. Você pode criar conta, buscar vagas e usar todas as funcionalidades sem pagar nada.' },
    { q: 'Quantas vagas posso candidatar?', a: 'Ilimitadas! Você pode se candidatar a quantas vagas quiser. Nosso sistema otimiza seu currículo para cada oportunidade.' },
    { q: 'Como a IA MAIA me ajuda?', a: 'MAIA é sua assistente de IA que ajuda a otimizar currículo, responde dúvidas sobre vagas, sugere cursos e acompanha sua jornada de empregabilidade.' },
    { q: 'Meus dados são seguros?', a: 'Sim! Utilizamos criptografia de ponta e conformidade com LGPD. Seus dados nunca são compartilhados sem consentimento.' },
  ];

  const testimonials = [
    { name: 'João Silva', role: 'Desenvolvedor', company: 'Tech Company', text: 'Consegui meu emprego em 2 semanas usando Vaga Certa!', rating: 5 },
    { name: 'Maria Santos', role: 'Designer UX', company: 'StartUp XYZ', text: 'A IA MAIA foi incrível para otimizar meu currículo.', rating: 5 },
    { name: 'Pedro Costa', role: 'Product Manager', company: 'Big Corp', text: 'Plataforma intuitiva e muito eficaz. Recomendo!', rating: 5 },
  ];

  const features = [
    { icon: Zap, title: 'Currículo com IA', desc: 'Otimize seu currículo em segundos com inteligência artificial' },
    { icon: TrendingUp, title: 'Vagas Personalizadas', desc: 'Receba apenas vagas que combinam com seu perfil' },
    { icon: Users, title: 'Assistente MAIA', desc: 'Converse com IA para dúvidas sobre carreira e vagas' },
    { icon: CheckCircle, title: 'Cursos Recomendados', desc: 'Aprenda novas habilidades com cursos sugeridos' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F4]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#75182C] to-[#5A1220] text-white px-4 py-20 md:py-32">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Encontre sua <span className="text-[#FFD700]">Vaga Certa</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Inteligência artificial para conectar você com as melhores oportunidades de emprego
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setLocation('/signup')}
              className="bg-[#FFD700] text-[#75182C] hover:bg-yellow-400 px-8 py-4 text-lg font-semibold"
            >
              Começar Agora
            </Button>
            <Button
              onClick={() => setLocation('/login')}
              className="border-2 border-white text-white hover:bg-white hover:text-[#75182C] px-8 py-4 text-lg font-semibold"
            >
              Já tem conta?
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-8 text-center">
              <div className="text-5xl font-bold text-[#75182C] mb-2">80%</div>
              <p className="text-[#5A5A5A] text-lg">dos currículos são descartados</p>
              <p className="text-sm text-[#999] mt-2">por falta de otimização</p>
            </div>
            <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-8 text-center">
              <div className="text-5xl font-bold text-[#75182C] mb-2">2x</div>
              <p className="text-[#5A5A5A] text-lg">mais chances de ser chamado</p>
              <p className="text-sm text-[#999] mt-2">com currículo otimizado</p>
            </div>
            <div className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-8 text-center">
              <div className="text-5xl font-bold text-[#75182C] mb-2">10k+</div>
              <p className="text-[#5A5A5A] text-lg">vagas disponíveis</p>
              <p className="text-sm text-[#999] mt-2">atualizadas diariamente</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-[#1C1C1C] mb-16">Por que escolher Vaga Certa?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-8 text-center hover:shadow-[0_8px_24px_rgba(0,0,0,0.16)] transition-shadow">
                  <Icon size={40} className="text-[#75182C] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#1C1C1C] mb-2">{feature.title}</h3>
                  <p className="text-[#5A5A5A]">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-[#1C1C1C] mb-16">Como funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { num: 1, title: 'Crie sua conta', desc: 'Cadastro rápido e seguro' },
              { num: 2, title: 'Otimize currículo', desc: 'IA melhora seu perfil' },
              { num: 3, title: 'Receba vagas', desc: 'Oportunidades personalizadas' },
              { num: 4, title: 'Consiga o emprego', desc: 'Acompanhamento até o final' },
            ].map((step) => (
              <div key={step.num} className="relative">
                <div className="bg-[#75182C] text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">{step.num}</div>
                <h3 className="text-lg font-semibold text-[#1C1C1C] text-center mb-2">{step.title}</h3>
                <p className="text-[#5A5A5A] text-center text-sm">{step.desc}</p>
                {step.num < 4 && <div className="hidden md:block absolute top-8 -right-3 w-6 h-1 bg-[#75182C]"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-[#1C1C1C] mb-16">O que dizem nossos usuários</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] p-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} size={20} className="fill-[#FFD700] text-[#FFD700]" />
                  ))}
                </div>
                <p className="text-[#1C1C1C] mb-6 italic">"{testimonial.text}"</p>
                <div className="border-t border-[#E6E2D9] pt-4">
                  <p className="font-semibold text-[#1C1C1C]">{testimonial.name}</p>
                  <p className="text-sm text-[#5A5A5A]">{testimonial.role} @ {testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-[#1C1C1C] mb-16">Perguntas Frequentes</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#FFFDF5] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full p-6 flex items-center justify-between hover:bg-[#F5F5F5] transition-colors"
                >
                  <h3 className="text-lg font-semibold text-[#1C1C1C] text-left">{faq.q}</h3>
                  <ChevronDown
                    size={24}
                    className={`text-[#75182C] transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {expandedFaq === i && (
                  <div className="px-6 pb-6 border-t border-[#E6E2D9]">
                    <p className="text-[#5A5A5A]">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-[#75182C] to-[#5A1220] text-white px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Pronto para encontrar sua vaga certa?</h2>
          <p className="text-xl text-gray-200 mb-8">Comece agora e receba vagas personalizadas em minutos</p>
          <Button
            onClick={() => setLocation('/signup')}
            className="bg-[#FFD700] text-[#75182C] hover:bg-yellow-400 px-8 py-4 text-lg font-semibold"
          >
            Criar Conta Gratuita
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1C1C1C] text-white px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Vaga Certa</h4>
              <p className="text-gray-400 text-sm">Conectando talentos com oportunidades</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Vagas</a></li>
                <li><a href="#" className="hover:text-white">Cursos</a></li>
                <li><a href="#" className="hover:text-white">Relatórios</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Sobre</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Privacidade</a></li>
                <li><a href="#" className="hover:text-white">Termos</a></li>
                <li><a href="#" className="hover:text-white">LGPD</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
            <p>© 2024 Vaga Certa. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
