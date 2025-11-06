import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Paperclip, Mic } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Chat() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'maia'; content: string }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat messages from backend
  const { data: chatMessages } = trpc.chat.getMessages.useQuery();
  const sendMessageMutation = trpc.chat.sendMessage.useMutation();
  const generateResumeMutation = trpc.resumes.generate.useMutation();

  useEffect(() => {
    if (chatMessages) {
      setMessages(chatMessages.map(msg => ({
        sender: msg.sender as 'user' | 'maia',
        content: msg.content,
      })));
    }
  }, [chatMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue('');
    setIsLoading(true);

    // Add user message to UI
    setMessages(prev => [...prev, { sender: 'user', content: userMessage }]);

    try {
      // Non-streaming only: responde uma vez já estruturado
      const response = await sendMessageMutation.mutateAsync({ content: userMessage });
      setMessages(prev => [...prev, { sender: 'maia', content: String(response.aiResponse) }]);
    } catch (err: any) {
      const msg = String(err?.message || err || 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.');
      setMessages(prev => [...prev, { sender: 'maia', content: msg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateResume = async () => {
    setIsLoading(true);
    try {
      const result = await generateResumeMutation.mutateAsync({});
      const url = result?.url || '';
      const absoluteUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
      setMessages(prev => [
        ...prev,
        {
          sender: 'maia',
          content: `Seu currículo foi gerado com sucesso. Baixe em: ${absoluteUrl}`,
        },
      ]);
      // Ir para a aba de Currículos
      setLocation('/resumes');
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'maia',
          content: `Não consegui gerar o currículo agora: ${String(e?.message || e)}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#FAF9F4]">
      {/* Header */}
      <div className="bg-white border-b border-[#E6E2D9] p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-[#1C1C1C]">Chat com MAIA</h1>
          <p className="text-[#5A5A5A] text-sm">Assistente de IA para empregabilidade</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="text-6xl mb-4">👋</div>
              <h2 className="text-2xl font-bold text-[#1C1C1C] mb-2">Olá! Sou a MAIA</h2>
              <p className="text-[#5A5A5A] max-w-md">
                Sou sua assistente de IA especializada em empregabilidade. Posso ajudar com dúvidas sobre vagas, cursos, preparação para entrevistas e desenvolvimento de carreira.
              </p>
              <div className="mt-8 space-y-2">
                <p className="text-sm font-semibold text-[#1C1C1C]">Tente perguntar:</p>
                <div className="space-y-2">
                  <button onClick={() => setInputValue('Quais são as melhores práticas para uma entrevista?')} className="text-sm text-[#75182C] hover:underline">
                    "Quais são as melhores práticas para uma entrevista?"
                  </button>
                  <button onClick={() => setInputValue('Qual curso devo fazer para melhorar meu perfil?')} className="text-sm text-[#75182C] hover:underline">
                    "Qual curso devo fazer para melhorar meu perfil?"
                  </button>
                  <button onClick={() => setInputValue('Como me preparar para uma entrevista técnica?')} className="text-sm text-[#75182C] hover:underline">
                    "Como me preparar para uma entrevista técnica?"
                  </button>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-[16px] ${
                    message.sender === 'user'
                      ? 'bg-[#75182C] text-white'
                      : 'bg-white border border-[#E6E2D9] text-[#1C1C1C]'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {String(message.content).replace(/\*\*(.*?)\*\*/g, '$1')}
                  </p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#E6E2D9] px-4 py-3 rounded-[16px]">
                <Loader2 className="animate-spin text-[#75182C]" size={20} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-[#E6E2D9] p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <button className="p-3 hover:bg-[#F5F5F5] rounded-lg transition-colors">
              <Paperclip size={20} className="text-[#5A5A5A]" />
            </button>
            <Input
              type="text"
              placeholder="Digite sua mensagem..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-[#FFFDF5] border-[#E6E2D9]"
              disabled={isLoading}
            />
            <button className="p-3 hover:bg-[#F5F5F5] rounded-lg transition-colors">
              <Mic size={20} className="text-[#5A5A5A]" />
            </button>
            <Button
              onClick={handleGenerateResume}
              disabled={isLoading || generateResumeMutation.isPending}
              className="bg-[#E0DACF] text-[#1C1C1C] hover:opacity-90"
            >
              Gerar currículo
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="bg-[#75182C] text-white"
            >
              <Send size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
