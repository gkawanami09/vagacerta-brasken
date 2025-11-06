export function sanitizeAiText(input: string): string {
  let s = String(input ?? "");
  // Normaliza UTF-8/NFC e remove caracteres inválidos
  try { s = s.normalize('NFC'); } catch {}
  s = s.replace(/[\uFFFD\u0000]/g, '');

  // Remover marcas de Markdown comuns
  s = s.replace(/\*\*(.*?)\*\*/g, "$1"); // **negrito**
  s = s.replace(/\*(.*?)\*/g, "$1"); // *itálico*
  s = s.replace(/`{1,3}([^`]+)`{1,3}/g, "$1"); // `codigo`

  // Normalizar espaços e quebras de linha
  s = s.replace(/[\t ]+/g, " ");
  s = s.replace(/\s*\n\s*/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");

  // Espaço após pontuação e remoção de espaços antes da pontuação
  s = s.replace(/\s+([,.!?;:])/g, "$1");
  s = s.replace(/([,.!?;:])(?!\s|\n)/g, "$1 ");

  // Limpeza final
  s = s.replace(/\s{2,}/g, " ");
  return s.trim();
}
