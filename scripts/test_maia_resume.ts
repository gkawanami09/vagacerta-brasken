import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import * as db from '../server/db';
import { addChatMessage, getChatMessages } from '../server/db';
import { getResumeCompletionStatus, generateResumePdf } from '../server/resume';

async function ensureUser() {
  const email = 'teste+maia@example.com';
  const existing = await db.getUserByEmail(email);
  if (existing) return existing.id as number;
  const passwordHash = await bcrypt.hash('SenhaSegura123!', 10);
  await db.createLocalUser({ name: 'Usuária Teste', email, passwordHash });
  const created = await db.getUserByEmail(email);
  if (!created) throw new Error('Falha ao criar usuária de teste');
  // Criar perfil mínimo
  try { await db.createUserProfile(created.id, { phone: '(11) 99999-9999', cpf: '12345678901', location: 'São Paulo, SP' }); } catch {}
  return created.id as number;
}

async function seedChat(userId: number) {
  const msgs = await getChatMessages(userId, 5);
  if (msgs.length > 0) return; // já tem histórico
  await addChatMessage(userId, 'user', 'Meu nome é Ana Maria Souza.');
  await addChatMessage(userId, 'maia', 'Certo, Ana. Qual seu email e telefone?');
  await addChatMessage(userId, 'user', 'Email: ana.souza@example.com, telefone (11) 98877-6655. Moro em São Paulo - SP.');
  await addChatMessage(userId, 'maia', 'Obrigada. Pode me contar seu resumo profissional e objetivo?');
  await addChatMessage(userId, 'user', 'Resumo: Desenvolvedora front-end com 3 anos. Objetivo: atuar como front-end pleno.');
  await addChatMessage(userId, 'maia', 'Liste habilidades e formação.');
  await addChatMessage(userId, 'user', 'Habilidades: React, TypeScript, CSS, Jest. Formação: Bacharel em Sistemas de Informação - USP (2019-2022).');
  await addChatMessage(userId, 'maia', 'Quais experiências recentes?');
  await addChatMessage(userId, 'user', 'Empresa: TechX (2022-2024), cargo: Desenvolvedora Front-end; responsabilidades: - Desenvolver componentes React - Escrever testes; resultados: - Reduziu tempo de build em 30%.');
}

async function main() {
  const userId = await ensureUser();
  await seedChat(userId);
  const status = await getResumeCompletionStatus(userId);
  if (!status.complete) {
    console.error('Faltam campos:', status.missing);
    process.exit(1);
  }
  const result = await generateResumePdf(userId, undefined, status.data);
  const abs = path.resolve(process.cwd(), result.path);
  if (!fs.existsSync(abs)) throw new Error('PDF não foi criado');
  const size = fs.statSync(abs).size;
  if (size < 1000) throw new Error('PDF muito pequeno, pode estar vazio');
  console.log('OK', { url: result.url, path: result.path, size });
}

main().catch(err => { console.error(err); process.exit(1); });
