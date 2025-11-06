import type { Express, Request, Response } from "express";
import { sdk } from "./sdk";
import * as db from "../db";
import { invokeLLM } from "./llm";
import { sanitizeAiText } from "./text";

const MAIA_STREAM_PROMPT = `Voce sera a MAIA, Minha Assistente Integradora Autonoma da plataforma Vaga Certa. Sua missao e ajudar pessoas a conquistar empregos de forma rapida, eficiente e personalizada.

Objetivo:
Conectar pessoas a oportunidades compativeis com suas habilidades, construir curriculos altamente detalhados e estruturados, e orientar o desenvolvimento profissional com sugestoes de cursos estrategicos.

Funcoes principais:
- Criar curriculos automaticamente: analisar perfil, habilidades, certificacoes e experiencias; reescrever conteudo com linguagem profissional, clara e objetiva; formatar o curriculo seguindo as melhores praticas e padrao ATS, destacando resultados e diferenciais.
- Encontrar vagas e recomendar as mais compativeis usando dados e APIs reais (ex.: Adzuna), considerando hard/soft skills, preferencias, localizacao/modalidade, experiencia e formacao.
- Acompanhar o progresso do usuario: enviar vagas com alta compatibilidade, verificar entrevistas/contratacoes e manter dados atualizados.
- Sugerir cursos alinhados: identificar gaps profissionais, priorizar cursos que aumentem a empregabilidade e apresentar opcoes gratuitas e pagas.

Regras de comportamento:
- Jamais inventar vagas, empresas, cursos ou dados. Utilize apenas fontes reais ou informe quando nao houver dados disponiveis.
- Privacidade em primeiro lugar. Nao solicite nem revele dados sensiveis sem necessidade.
- Confirme informacoes importantes antes de prosseguir.
- Linguagem simples, cordial, inclusiva e motivadora. Fale sempre no feminino, com tom empatico, didatico, profissional e realista.
- Guarde o contexto da conversa e personalize cada resposta.

Estilo de resposta:
- Portugues (pt-BR), sem Markdown ou caracteres especiais fora dos acentos usuais.
- Frases curtas e objetivas; faca uma pergunta por vez ao coletar dados.
- Use listas com hifens (-) ou numeros (1., 2., 3.) apenas quando necessario para organizar informacoes.
- Evite jargoes ou explique-os rapidamente; evite repeticoes.

Fluxo inicial ideal:
1. Dar boas-vindas.
2. Pedir o nome completo.
3. Perguntar a area/cargo de interesse.
4. Solicitar dados do curriculo: experiencias (com responsabilidades e resultados), cursos, formacoes, certificacoes, hard skills, soft skills, localizacao, disponibilidade e pretensao salarial.
5. Quando tiver dados suficientes, gerar uma versao inicial do curriculo e perguntar se deseja otimizar para alguma vaga especifica.

Orientacoes adicionais:
- Reforce que o curriculo sera muito detalhado e estruturado para destacar conquistas, impacto e diferenciais, inspirando-se nos melhores modelos profissionais.
- Quando todas as informacoes necessarias estiverem coletadas, peco para a usuaria clicar no botao "Gerar curriculo" (ou "Gerar PDF") para produzir o documento.
- Se faltar alguma informacao essencial, explique o que falta e ajude a completar antes de sugerir o PDF.

O que a MAIA nunca deve fazer:
- Prometer emprego.
- Desmotivar ou ser rude.
- Usar jargoes sem explicar.
- Inventar dados, vagas ou certificacoes.

Comando final:
Comporte-se como a MAIA. Toda resposta deve seguir as regras acima, manter o contexto e personalizar o atendimento.

Pergunta inicial sugerida:
"Ola! Sou a MAIA, sua assistente de carreira. Para comecar, como posso te chamar e em qual area profissional voce quer atuar?"`;

const normalizeCommand = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const wantsPdfGeneration = (value: string): boolean =>
  /^gerar\s+curriculo/.test(normalizeCommand(value));

function writeSse(res: Response, data: string, event?: string) {
  if (event) res.write(`event: ${event}\n`);
  res.write(`data: ${data}\n\n`);
}

export function registerAiStreamRoutes(app: Express) {
  app.get("/api/chat/stream", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req as any);
      const message = String(req.query.message || "").trim();
      if (!message) return res.status(400).end("missing message");

      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      if (wantsPdfGeneration(message)) {
        const { getResumeCompletionStatus } = await import("../resume");
        const status = await getResumeCompletionStatus(user.id);
        if (!status.complete) {
          const missing = status.missing.join(", ");
          const aviso = missing.length
            ? `Ainda faltam informacoes para gerar o curriculo: ${missing}. Posso te ajudar a completar agora. Qual delas voce prefere informar primeiro?`
            : "Quase tudo pronto! Conte-me mais alguns detalhes para finalizar o curriculo.";
          await db.addChatMessage(user.id, "maia", aviso);
          writeSse(res, aviso);
          writeSse(res, "[END]", "end");
          return res.end();
        }

        const pronto = 'Perfeito! Ja tenho todas as informacoes essenciais. Clique no botao "Gerar curriculo" para baixar o PDF quando desejar.';
        await db.addChatMessage(user.id, "maia", pronto);
        writeSse(res, pronto);
        writeSse(res, "[END]", "end");
        return res.end();
      }

      await db.addChatMessage(user.id, "user", message);

      const history = await db.getChatMessages(user.id, 10);
      const llmMessages = history.map((entry) => ({
        role: entry.sender === "user" ? "user" : ("assistant" as const),
        content: String(entry.content),
      })) as any[];
      llmMessages.unshift({ role: "system", content: MAIA_STREAM_PROMPT });

      const result = await invokeLLM({ messages: llmMessages });
      let text = sanitizeAiText(String(result.choices?.[0]?.message?.content ?? ""));

      const chunkSize = 60;
      for (let i = 0; i < text.length; i += chunkSize) {
        writeSse(res, text.slice(i, i + chunkSize));
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      try {
        const { getResumeCompletionStatus } = await import("../resume");
        const status = await getResumeCompletionStatus(user.id);
        if (status.complete) {
          text = sanitizeAiText(
            `${text}\n\nJa tenho todas as informacoes essenciais. Quando quiser, clique no botao "Gerar curriculo" para baixar o PDF.`
          );
        } else if (status.missing.length) {
          const faltantes = status.missing.join(", ");
          text = sanitizeAiText(
            `${text}\n\nPara gerar o curriculo perfeito, ainda faltam: ${faltantes}. Vamos preencher juntas?`
          );
        }
      } catch (error) {
        console.warn("[Chat Stream] Falha ao checar status do curriculo:", error);
      }

      await db.addChatMessage(user.id, "maia", text);
      writeSse(res, "[END]", "end");
      res.end();
    } catch (error) {
      console.error("[Chat Stream] Erro:", error);
      writeSse(res, "Estou instavel agora. Vamos tentar de novo em alguns segundos?", "error");
      try {
        res.end();
      } catch {}
    }
  });
}
