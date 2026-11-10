# Checa Aí — O Que Já Foi Implementado

> **Regra:** toda vez que uma funcionalidade nova for implementada, adicionada ou corrigida, este arquivo deve ser atualizado imediatamente. Isso vale para o Claude e para qualquer outro colaborador.

---

## Como está organizado

Cada seção lista o que foi implementado, quais arquivos foram criados/modificados e observações técnicas relevantes para não repetir decisões ou bugs já resolvidos. Seções por funcionalidade, na ordem em que foram feitas; no fim: Banco de dados, Constantes/Tema, Bugs Corrigidos e O Que Ainda Não Foi Implementado.

---

## Setup do projeto (v0.1.0)
**Status:** ✅ 10/11/2026
- Planejamento (`PLANEJAMENTO.md`), conteúdo das 6 missões (`MISSOES.md`), regras (`CLAUDE.md`, `AGENTS.md`), `README.md`, git e repositório público `checa-ai` no GitHub
- `cartilhas/baixar-cartilhas.bat` baixa os fascículos Boatos, Redes Sociais e Internet Segura do CERT.br
**Arquivos:** `PLANEJAMENTO.md`, `MISSOES.md`, `CLAUDE.md`, `AGENTS.md`, `README.md`, `IMPLEMENTADO.md`, `.gitignore`, `.gitattributes`, `cartilhas/baixar-cartilhas.bat`
- Kit do Claude (v0.1.1): .claude/settings.json, agentes feature-developer, bug-fixer e security-engineer; skill security-audit em ~/.claude/skills; codebase-memory conectado (indexar no fim da Fase 1); Supabase MCP somente leitura na Fase 4.

---

<!-- MODELO DE SEÇÃO — copiar para cada funcionalidade nova
## {{Nome da funcionalidade}} ({{Fase X — etapa Y}}, vX.Y.Z)

**Status:** ✅ vX.Y.Z na `{{branch}}`. {{publicado no GitHub Pages? migration aplicada em que data?}} {{revisada pelo security-engineer?}}

### Regras
- {{regra como ficou de verdade}}

### Fluxo / Telas
- {{...}}

### Banco (migration NNN)
| RPC / tabela | O quê |
|---|---|
- Rollback: `supabase/rollbacks/NNN_rollback.sql`. Teste: `supabase/tests/{{x}}.sql` ("OK — N checagens conferem. Nada foi gravado.")

### Arquivos e funções
- {{arquivo}}: {{o que faz}}

### Decisões técnicas
- {{decisão}} — {{por quê}}

### Roteiro de teste
1. {{passo}} → {{resultado esperado}} (notebook, tablet e celular)

**Arquivos:** {{lista}}
-->

---

## Banco de Dados
### Migrations
| Arquivo | Conteúdo |
|---|---|

### Funções RPC
| Função | O quê |
|---|---|

---

## Constantes e Tema
- (ainda não criado)

---

## Bugs Corrigidos
| Bug | Causa | Fix |
|---|---|---|

---

## O Que Ainda Não Foi Implementado
Itens do roadmap pendentes (detalhes no `PLANEJAMENTO.md`):
- [ ] Fase 1 — Simulador viral + base do site (tema, layout, início, navegação, `missions-data.js`) — até 14/11
- [ ] Fase 2 — Jogo das missões (apelido, investigação, veredito, pontuação, resultado) — até 19/11
- [ ] Fase 3 — Revisão das 6 missões pelo grupo — até 17/11
- [ ] Fase 4 — Ranking online (Supabase) — até 22/11
- [ ] Fase 5 — Testes em notebook/tablet/celular, service worker, QR Code, tela de dicas — até 24/11
- [ ] v1.0.0 e congelamento — 25/11

---

*Última atualização: 10/11/2026 (setup)*
