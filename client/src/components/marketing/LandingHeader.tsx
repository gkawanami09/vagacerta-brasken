import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "Inicio", href: "inicio" },
  { label: "Recursos", href: "recursos" },
  { label: "Funcionalidades", href: "funcionalidades" },
  { label: "Depoimentos", href: "depoimentos" },
  { label: "FAQ", href: "faq" },
];

export default function LandingHeader() {
  const [location, setLocation] = useLocation();

  const handleNav = (id: string) => {
    const onLanding = location.split("#")[0] === "/";
    if (onLanding) {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    const hash = id ? `#${id}` : "";
    setLocation(`/${hash}`);
  };

  return (
    <header className="bg-[#1C161B]/70 backdrop-blur-sm border-b border-[#412533] sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#FFD54F] flex items-center justify-center text-[#5C1323] font-semibold">
            VC
          </div>
          <div>
            <p className="text-white font-semibold text-lg leading-tight">
              Vaga Certa
            </p>
            <p className="text-xs text-[#E2D4D9]">
              IA para sua jornada profissional
            </p>
          </div>
        </div>
        <nav className="hidden lg:flex items-center gap-8 text-sm text-[#F5E8EC]">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              className="hover:text-[#FFD54F] transition-colors"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-[#FFD54F] hover:text-white hover:bg-[#FFD54F]/10 hidden sm:inline-flex"
            onClick={() => setLocation("/login")}
          >
            Entrar
          </Button>
          <Button
            className="bg-[#FFD54F] text-[#5C1323] hover:bg-[#FFCA28]"
            onClick={() => setLocation("/signup")}
          >
            Criar conta
          </Button>
        </div>
      </div>
      <nav className="lg:hidden flex items-center justify-around px-4 pb-3 text-xs text-[#F5E8EC]">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.href}
            onClick={() => handleNav(item.href)}
            className="hover:text-[#FFD54F] transition-colors"
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
