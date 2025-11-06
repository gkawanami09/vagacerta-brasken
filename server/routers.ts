import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { isStrongPassword, getPasswordStrengthError } from "@shared/password";
import { sdk } from "./_core/sdk";
import { sanitizeAiText } from "./_core/text";
import { searchAdzunaJobs } from "./_core/adzuna";
import { generateResumePdf, getResumeCompletionStatus } from "./resume";

const MAIA_SYSTEM_PROMPT = `Voce sera a MAIA, Minha Assistente Integradora Autonoma da plataforma Vaga Certa. Sua missao e ajudar pessoas a conquistar empregos de forma rapida, eficiente e personalizada.

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
- Quando todas as informacoes necessarias estiverem coletadas, peca para a usuaria clicar no botao "Gerar curriculo" (ou "Gerar PDF") para produzir o documento.
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

export const appRouter = router({
  system: systemRouter,

  // ===== AUTH =====
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    updateAccount: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).optional(),
          email: z.string().min(1).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Banco de dados nao configurado (DATABASE_URL)",
          });
        }

        const updates: { name?: string; email?: string } = {};

        if (typeof input.name === "string") {
          updates.name = input.name.trim();
        }

        if (typeof input.email === "string") {
          const email = input.email.trim().toLowerCase();
          const basicEmailRegex = /.+@.+\..+/;
          if (!basicEmailRegex.test(email)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Email invalido",
            });
          }
          const existing = await db.getUserByEmail(email);
          if (existing && existing.id !== ctx.user?.id) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Email ja cadastrado",
            });
          }
          updates.email = email;
        }

        if (!updates.name && !updates.email) {
          return { success: true } as const;
        }

        await db.updateUserAccount(ctx.user!.id, updates);
        return { success: true } as const;
      }),

    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Nome e obrigatorio"),
          email: z.string().min(1),
          phone: z.string().min(1),
          cpf: z.string().min(1),
          password: z
            .string()
            .superRefine((value, ctx) => {
              if (!isStrongPassword(value)) {
                ctx.addIssue({
                  code: "custom",
                  message:
                    getPasswordStrengthError(value) ?? "Senha fraca",
                });
              }
            }),
          confirmPassword: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Banco de dados nao configurado (DATABASE_URL)",
          });
        }

        const emailNorm = input.email.trim().toLowerCase();
        const emailRegex = /.+@.+\..+/;
        if (!emailRegex.test(emailNorm)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email invalido",
          });
        }

        const existingByEmail = await db.getUserByEmail(emailNorm);
        if (existingByEmail) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email ja cadastrado",
          });
        }

        const digits = (value: string) => value.replace(/\D/g, "");
        const phoneDigits = digits(input.phone ?? "");
        if (phoneDigits.length < 10 || phoneDigits.length > 11) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Telefone invalido",
          });
        }

        const cpfDigits = digits(input.cpf ?? "");
        if (cpfDigits.length !== 11) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "CPF invalido",
          });
        }

        try {
          const cpfExists = await db.getUserProfileByCpf(cpfDigits);
          if (cpfExists) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "CPF ja cadastrado",
            });
          }
        } catch (error) {
          console.warn("[Auth] Falha ao verificar CPF:", error);
        }

        if (input.confirmPassword !== input.password) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "As senhas nao coincidem",
          });
        }

        const passwordHash = await bcrypt.hash(input.password, 10);
        await db.createLocalUser({
          name: input.name,
          email: emailNorm,
          passwordHash,
        });

        try {
          const created = await db.getUserByEmail(emailNorm);
          if (created) {
            await db.createUserProfile(created.id, {
              phone: input.phone,
              cpf: cpfDigits,
            });
          }
        } catch (error) {
          console.warn("[Auth] Falha ao criar perfil:", error);
        }

        const token = await sdk.createSessionToken(`local:${emailNorm}`, {
          name: input.name,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        return { success: true } as const;
      }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email("Email invalido"),
          password: z.string().min(1, "Senha obrigatoria"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Banco de dados nao configurado (DATABASE_URL)",
          });
        }

        const email = input.email.trim().toLowerCase();
        const user = await db.getUserByEmail(email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha invalidos",
          });
        }

        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha invalidos",
          });
        }

        const token = await sdk.createSessionToken(user.openId, {
          name: user.name ?? "",
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        return { success: true } as const;
      }),
  }),

  // ===== JOBS =====
  jobs: router({
    list: publicProcedure
      .input(
        z
          .object({
            limit: z.number().default(20),
            offset: z.number().default(0),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return await db.getJobs(input?.limit ?? 20, input?.offset ?? 0);
      }),

    search: publicProcedure
      .input(
        z.object({
          query: z.string().min(1),
          limit: z.number().default(20),
          location: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        try {
          const external = await searchAdzunaJobs({
            query: input.query,
            resultsPerPage: input.limit,
            location: input.location,
          });

          return external.map((job) => ({
            id: job.id,
            title: job.title,
            company: job.company,
            description: job.description,
            requirements: null,
            responsibilities: null,
            benefits: null,
            location: job.location,
            salary_min: job.salary_min ?? undefined,
            salary_max: job.salary_max ?? undefined,
            contract_type: undefined,
            modality: job.modality ?? undefined,
            compatibility: job.compatibility,
            company_logo: undefined,
            company_description: undefined,
            selection_process: undefined,
            external_url: job.external_url,
          }));
        } catch (error) {
          console.warn("[Jobs] Falha ao buscar na Adzuna:", error);
          return await db.searchJobs(input.query, input.limit);
        }
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => db.getJobById(input.id)),
  }),

  // ===== SAVED JOBS =====
  savedJobs: router({
    list: protectedProcedure.query(async ({ ctx }) =>
      db.getSavedJobs(ctx.user.id)
    ),

    save: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .mutation(async ({ input, ctx }) => db.saveJob(ctx.user.id, input.jobId)),

    remove: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .mutation(async ({ input, ctx }) =>
        db.removeSavedJob(ctx.user.id, input.jobId)
      ),
  }),

  // ===== COURSES =====
  courses: router({
    list: publicProcedure
      .input(
        z
          .object({
            limit: z.number().default(20),
            offset: z.number().default(0),
          })
          .optional()
      )
      .query(async ({ input }) =>
        db.getCourses(input?.limit ?? 20, input?.offset ?? 0)
      ),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => db.getCourseById(input.id)),

    getRecommended: publicProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(async ({ input }) =>
        db.getRecommendedCourses(input?.limit ?? 10)
      ),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          skills: z.string().optional(),
          duration_hours: z.number().optional(),
          price: z.number().default(0),
          is_free: z.boolean().default(true),
          certification: z.boolean().default(false),
          provider: z.string().optional(),
          thumbnail: z.string().optional(),
          external_url: z.string().optional(),
          recommended_for_user: z.boolean().default(false),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Somente administradores podem criar cursos",
          });
        }
        return await db.createCourse(input);
      }),
  }),

  // ===== RESUMES =====
  resumes: router({
    list: protectedProcedure.query(async ({ ctx }) =>
      db.getSubmittedResumes(ctx.user.id)
    ),

    submit: protectedProcedure
      .input(z.object({ jobId: z.number(), resumeUrl: z.string() }))
      .mutation(async ({ input, ctx }) =>
        db.submitResume(ctx.user.id, input.jobId, input.resumeUrl)
      ),

    generate: protectedProcedure
      .input(z.object({ jobId: z.number().optional() }).optional())
      .mutation(async ({ input, ctx }) => {
        let job: { title?: string; company?: string; description?: string; requirements?: string } | undefined;
        if (input?.jobId) {
          const dbJob = await db.getJobById(input.jobId);
          if (dbJob) {
            job = {
              title: dbJob.title ?? undefined,
              company: dbJob.company ?? undefined,
              description: dbJob.description ?? undefined,
              requirements: dbJob.requirements ?? undefined,
            };
          }
        }

        const status = await getResumeCompletionStatus(ctx.user.id);
        if (!status.complete) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Faltam informacoes para gerar o curriculo: ${status.missing.join(", ")}`,
          });
        }

        const result = await generateResumePdf(ctx.user.id, { job }, status.data);
        await db.submitResume(ctx.user.id, input?.jobId ?? 0, result.url, "generated");
        return { url: result.url, fileName: result.filename } as const;
      }),

    uploadResume: protectedProcedure
      .input(z.object({ file: z.string(), fileName: z.string() }))
      .mutation(async ({ input, ctx }) => {
        try {
          const buffer = Buffer.from(input.file, "base64");
          const key = `resumes/${ctx.user.id}/${Date.now()}-${input.fileName}`;
          const result = await storagePut(key, buffer, "application/pdf");
          return result;
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to upload resume: ${error}`,
          });
        }
      }),
  }),

  // ===== CHAT (MAIA) =====
  chat: router({
    getMessages: protectedProcedure.query(async ({ ctx }) =>
      db.getChatMessages(ctx.user.id)
    ),

    sendMessage: protectedProcedure
      .input(
        z.object({
          content: z.string(),
          attachmentUrl: z.string().optional(),
          attachmentType: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const message = input.content.trim();

        // Always store user message first
        await db.addChatMessage(
          ctx.user.id,
          "user",
          message,
          input.attachmentUrl,
          input.attachmentType
        );

        // Handle explicit generate command by guiding the user
        if (wantsPdfGeneration(message)) {
          const status = await getResumeCompletionStatus(ctx.user.id);
          if (!status.complete) {
            const missing = status.missing.join(", ");
            const resp =
              missing.length > 0
                ? `Ainda faltam informacoes para gerar o curriculo: ${missing}. Posso te ajudar a preencher agora. Qual delas voce prefere informar primeiro?`
                : "Quase tudo pronto! Conte-me mais alguns detalhes para que eu finalize o curriculo.";
            await db.addChatMessage(ctx.user.id, "maia", resp);
            return { userMessage: message, aiResponse: resp };
          }

          const prompt =
            'Perfeito! Ja tenho tudo que preciso. Clique no botao "Gerar curriculo" para baixar o PDF quando quiser.';
          await db.addChatMessage(ctx.user.id, "maia", prompt);
          return { userMessage: message, aiResponse: prompt };
        }

        // Build context and call LLM
        const history = await db.getChatMessages(ctx.user.id, 10);
        const llmMessages = history.map((entry) => ({
          role: entry.sender === "user" ? "user" : ("assistant" as const),
          content: String(entry.content),
        }));

        llmMessages.unshift({ role: "system", content: MAIA_SYSTEM_PROMPT });

        try {
          const response = await invokeLLM({ messages: llmMessages });
          let aiContent = sanitizeAiText(
            String(response.choices?.[0]?.message?.content ?? "")
          );

          // Append guidance based on resume completion status
          const status = await getResumeCompletionStatus(ctx.user.id);
          if (status.complete) {
            aiContent = sanitizeAiText(
              `${aiContent}\n\nJa reuni todas as informacoes essenciais. Quando quiser transformar em PDF, clique no botao "Gerar curriculo".`
            );
          } else if (status.missing.length) {
            aiContent = sanitizeAiText(
              `${aiContent}\n\nPara gerar seu curriculo perfeito, ainda faltam: ${status.missing.join(", ")}. Vamos preencher juntas?`
            );
          }

          await db.addChatMessage(ctx.user.id, "maia", aiContent);
          return { userMessage: message, aiResponse: aiContent };
        } catch (error: any) {
          console.error("[Chat] LLM Error:", error);
          const fallback =
            "Desculpe, tive uma oscilacao agora. Vamos tentar novamente em instantes.";
          await db.addChatMessage(ctx.user.id, "maia", fallback);
          return { userMessage: message, aiResponse: fallback };
        }
      }),
  }),

  // ===== USER PROFILE =====
  userProfile: router({
    get: protectedProcedure.query(async ({ ctx }) =>
      db.getUserProfile(ctx.user.id)
    ),

    update: protectedProcedure
      .input(
        z.object({
          phone: z.string().optional(),
          cpf: z.string().optional(),
          location: z.string().optional(),
          work_modality: z.string().optional(),
          salary_expectation: z.number().optional(),
          areas_of_interest: z.string().optional(),
          notification_whatsapp: z.boolean().optional(),
          notification_push: z.boolean().optional(),
          notification_email: z.boolean().optional(),
          notification_frequency: z.string().optional(),
          resume_url: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (input.cpf) {
          const digits = input.cpf.replace(/\D/g, "");
          if (digits.length !== 11) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "CPF invalido",
            });
          }
          const found = await db.getUserProfileByCpf(digits);
          if (found && found.user_id !== ctx.user.id) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "CPF ja cadastrado",
            });
          }
          input.cpf = digits;
        }

        const existing = await db.getUserProfile(ctx.user.id);
        if (existing) {
          return await db.updateUserProfile(ctx.user.id, input);
        }
        return await db.createUserProfile(ctx.user.id, input);
      }),
  }),

  // ===== STATISTICS & REPORTS =====
  statistics: router({
    getUserStats: protectedProcedure.query(async ({ ctx }) =>
      db.getUserStatistics(ctx.user.id)
    ),

    getReportData: protectedProcedure
      .input(z.object({ days: z.number().default(30) }).optional())
      .query(async ({ ctx, input }) => {
        const stats = await db.getUserStatistics(ctx.user.id);
        const resumeCount = await db.getSubmittedResumeCount(
          ctx.user.id,
          input?.days ?? 30
        );
        const recommendedCourses = await db.getRecommendedCourses(5);

        return {
          compatibility: Math.floor(Math.random() * 40) + 60,
          resumesSubmitted: resumeCount,
          recommendedCourses,
          stats,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
