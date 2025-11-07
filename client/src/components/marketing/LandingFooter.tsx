export default function LandingFooter() {
  return (
    <footer className="bg-[#121013] text-[#E2D4D9] mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <p className="font-semibold text-white mb-3">Vaga Certa</p>
            <p className="text-[#AFA3AB]">
              Conectando talentos com oportunidades
            </p>
          </div>
          <div>
            <p className="font-semibold text-white mb-3">Produto</p>
            <ul className="space-y-2">
              <li className="hover:text-white cursor-pointer">Vagas</li>
              <li className="hover:text-white cursor-pointer">Cursos</li>
              <li className="hover:text-white cursor-pointer">Relatorios</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-3">Empresa</p>
            <ul className="space-y-2">
              <li className="hover:text-white cursor-pointer">Sobre</li>
              <li className="hover:text-white cursor-pointer">Blog</li>
              <li className="hover:text-white cursor-pointer">Contato</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-3">Legal</p>
            <ul className="space-y-2">
              <li className="hover:text-white cursor-pointer">Privacidade</li>
              <li className="hover:text-white cursor-pointer">Termos</li>
              <li className="hover:text-white cursor-pointer">LGPD</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#1F1B20] mt-10 pt-6 text-center text-xs text-[#8B8087]">
          © {new Date().getFullYear()} Vaga Certa. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
