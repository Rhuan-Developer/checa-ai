# AGENTS.md — Checa Aí

- Stack: HTML5 + CSS + JavaScript (ES2020) puro, sem framework, sem build, sem pacotes npm. Não introduzir React, Vite, TypeScript, Tailwind nem bibliotecas por CDN.
- Scripts clássicos (sem `type="module"`): o `index.html` precisa funcionar aberto direto do disco (`file://`).
- Referência de APIs do navegador: MDN (https://developer.mozilla.org/pt-BR/). Use só recursos suportados nas versões atuais de Chrome, Safari (iOS) e Firefox.
- Supabase: acessar só pela API REST/RPC com `fetch` (https://supabase.com/docs/guides/api). Chamar RPC = `POST {SUPABASE_URL}/rest/v1/rpc/<funcao>` com os cabeçalhos `apikey` e `Authorization: Bearer <anon key>`.
- Regras do projeto: `CLAUDE.md`. Plano: `PLANEJAMENTO.md`. Conteúdo das missões: `MISSOES.md`.
