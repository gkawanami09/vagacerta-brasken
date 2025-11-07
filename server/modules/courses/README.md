# Módulo de Cursos

Endpoints REST (todos com `Authorization: Bearer <accessToken>`):

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/courses/recommendations?q=react&limit=5` | Recomenda cursos reais levando em conta currículo, área-alvo, habilidades e (opcionalmente) uma vaga (`jobId`). |
| `GET` | `/courses/:id` | Detalhe completo do curso (resumo, habilidades, carga horária e link real). |
| `POST` | `/courses/:id/save` | Salva o curso para a usuária autenticada. |
| `DELETE` | `/courses/:id/save` | Remove o curso salvo. |
| `GET` | `/courses/saved` | Lista os cursos salvos pela usuária. |
| `POST` | `/courses/sync` | (Admin) força uma sincronização manual. Envie `{ "terms": ["react", "typescript"] }` para definir as buscas. |

## Variáveis / Configurações

- `COURSES_CACHE_TTL_MS` (opcional): tempo em milissegundos para manter buscas em cache na memória. Padrão: 15 minutos.
- As buscas usam fontes públicas (Udemy, Coursera e Alura) via HTTP, sem depender da API de afiliados.

## Exemplos rápidos

```bash
# Recomendações personalizadas (usuária autenticada)
curl -H "Authorization: Bearer <TOKEN>" \
     "http://localhost:3000/courses/recommendations?q=front-end&limit=5"

# Detalhes de um curso específico
curl "http://localhost:3000/courses/udemy:3c6a4a7f98b72c7c8b0f9391a8e21d6e8eb3f5a5"

# Salvar curso
curl -X POST -H "Authorization: Bearer <TOKEN>" \
     "http://localhost:3000/courses/udemy:3c6a4a7f98b72c7c8b0f9391a8e21d6e8eb3f5a5/save"

# Listar cursos salvos
curl -H "Authorization: Bearer <TOKEN>" \
     "http://localhost:3000/courses/saved"

# Sincronização manual (admin)
curl -X POST -H "Authorization: Bearer <TOKEN_ADMIN>" \
     -H "Content-Type: application/json" \
     -d '{ "terms": ["react", "gestao de projetos"] }' \
     http://localhost:3000/courses/sync
```

Quando um currículo é gerado, a MAIA envia automaticamente um resumo dos três principais cursos recomendados e orienta a usuária a abrir o relatório para mais detalhes.
