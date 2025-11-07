import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F4] px-4">
      <div className="max-w-md w-full bg-white border border-[#E6E2D9] rounded-[20px] p-10 text-center shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="text-red-500" size={36} />
        </div>
        <h1 className="text-4xl font-bold text-[#1C1C1C]">404</h1>
        <p className="mt-3 text-[#5A5A5A]">
          A página que você tentou acessar não existe
          ou foi movida.
        </p>
        <Button onClick={() => setLocation("/")} className="mt-6 bg-[#75182C] text-white flex items-center justify-center gap-2 w-full">
          <Home size={16} /> Voltar para o início
        </Button>
      </div>
    </div>
  );
}
