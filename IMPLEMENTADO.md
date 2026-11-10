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

## Base do site e dados das missões (Fase 1 — parte 1, v0.2.0)

**Status:** ✅ v0.2.0 na `feat/fase-1-simulador`. Sem merge na `main` (sai junto com o simulador, v0.3.0). Sem banco, sem revisão do `security-engineer`.

### Regras
- Partida = `drawMatch()` sorteia 1 fácil + 1 média + 1 difícil, nessa ordem; funciona com qualquer quantidade por nível e dá erro claro se um nível tiver menos missões que o pedido
- `getShareableRumors()` = missões com veredito diferente de `true` (o simulador usa)
- Features desligadas em `config.FEATURES` não aparecem na tela inicial e a rota cai em `#/inicio`

### Fluxo / Telas
- Início (`#/inicio`): nome, slogan "Antes de compartilhar, checa aí." e botão "Como um boato se espalha" (só com `FEATURES.simulator`)
- Simulador (`#/simulador`): só o título e "Voltar" (tela provisória; a parte 2 completa)
- Rodapé em todas as telas: "Simulação educativa · CiberMissões 2026" + versão

### Arquivos e funções
- `index.html`: cabeçalho, `<section data-screen="home|simulator">`, rodapé, scripts clássicos na ordem config, utils, missions-data, screens/home, app
- `css/theme.css` (cores e medidas), `css/base.css` (reset, `.btn` 44 px, `.card`, foco visível, `.visually-hidden`), `css/screens.css`
- `js/config.js`: `ChecaAi.config` (`APP_VERSION`, `MISSIONS_PER_LEVEL_IN_MATCH`, `FEATURES`)
- `js/utils.js`: `todayISO` (America/Sao_Paulo via `Intl`), `shuffle` (Fisher-Yates, não muta), `pickRandom`; ambos aceitam `random` opcional
- `js/missions-data.js`: 6 missões congeladas (F1, F2, M1, M2, D1, D2) em `ChecaAi.missions`: `all`, `getMissionsByLevel`, `drawMatch`, `getShareableRumors`, `VERDICT_LABELS`, `LEVEL_LABELS`, `LEVEL_ORDER`
- `js/screens/home.js`, `js/app.js`: navegação por hash; telas registradas em `ChecaAi.screens.<nome> = { id, route, title, feature, mount(sectionEl) }`

### Decisões técnicas
- `--on-accent: #0F1B2D` no tema: texto branco sobre `--accent` não passa no contraste AA
- Headers e badges que o `MISSOES.md` não trazia: F2 "Conversa particular" / "Encaminhada"; M1 sem selo; M2 selo "Link"; D1 sem selo; D2 "Família 👨‍👩‍👧" / "Encaminhada". Badge vazio = sem selo. Se o grupo quiser outro texto, mudar `MISSOES.md` e `missions-data.js` juntos
- Imagens das missões ainda não existem: `image.alt` descreve a foto fictícia e a tela mostrará um quadro com a descrição
- Tela do simulador provisória dentro do `app.js` (`||=`): na parte 2, criar `js/screens/simulator.js`, carregar antes do `app.js` e remover o bloco provisório
- Erro ao montar tela: `console.error` + mensagem curta na `<main>`

### Roteiro de teste
1. Abrir `index.html` pelo `file://` e pelo GitHub Pages → início com slogan e um botão; console sem erros
2. Tocar em "Como um boato se espalha" → `#/simulador` com título e "Voltar"; hash desconhecido → `#/inicio`
3. 375×812, 768×1024 (retrato e paisagem) e 1366×768 → sem rolagem horizontal, botões ≥ 44 px
4. Console: `ChecaAi.missions.drawMatch()` várias vezes → 3 missões, easy/medium/hard em ordem, combinações variando

**Arquivos:** `index.html`, `css/theme.css`, `css/base.css`, `css/screens.css`, `js/config.js`, `js/utils.js`, `js/missions-data.js`, `js/screens/home.js`, `js/app.js`

---

## Simulador viral (Fase 1 — parte 2, v0.3.0)

> A continuação só numérica depois da árvore foi substituída pela visão de multidão na v0.3.1 (ver seção abaixo).

**Status:** ✅ v0.3.0 na `feat/fase-1-simulador`, mesclada na `main` e publicada no GitHub Pages. Sem banco, sem revisão do `security-engineer`.

### Regras
- Rodada 0 = celular do visitante, que compartilhou. Quem compartilha manda para `fanout` pessoas novas; quem recebe checa com probabilidade `checkRate` e NÃO repassa (o ramo para)
- Padrões em `config.js`: `SIM_FANOUT` 3 (ajuste 2 a 5), `SIM_CHECK_RATE` 0.1 (ajuste 0 a 0.8), `SIM_VISUAL_ROUNDS` 5, `SIM_TOTAL_ROUNDS` 10, `SIM_ROUND_MS` 1200, `SIM_COMPARE_CHECK_RATE` 0.3
- Comparação final: `expectedReach` = soma de `fanout^k × (1 − checkRate)^(k−1)`; fanout 3 sem ninguém checar em 10 rodadas = 88.572

### Fluxo / Telas
- `#/simulador`, 4 passos: boato sorteado entre as missões não verdadeiras (nunca repete o anterior) com selo "Simulação" → Compartilhar ou Checar antes → árvore animada no `<canvas>` com contadores em `aria-live` → comparação "Ninguém checou × 30% checaram" com "Na dúvida, não compartilhe." e referência ao fascículo Boatos
- Checar antes: "Você parou o boato aqui." + "0 pessoas enganadas" + gabarito da missão + "E se eu tivesse compartilhado?"
- Painel de ajustes (repasses por pessoa, % que checa): vale na próxima simulação
- Modo apresentação: tela cheia (com fallback de só ampliar), avanço manual por clique no canvas, Espaço, → ou botão "Próxima rodada"; sai por "Sair" ou Esc
- `prefers-reduced-motion`: sem animação de crescimento

### Arquivos e funções
- `js/simulator-model.js` (`ChecaAi.simulatorModel`, funções puras com `random` opcional): `buildTree`, `layoutAngles`, `sampleBinomial`, `continueRounds`, `countRounds`, `summarizeTree`, `buildSimulation`, `expectedReach`, `roundsThatFit`
- `js/screens/simulator.js`: tela do simulador (monta, desenha, limpa timers e listeners no `unmount`)
- `css/simulator.css`; `css/theme.css` ganhou `--touch-lg` (64px) e `--canvas-max-height` (58vh)
- `js/app.js`: placeholder removido; gancho opcional `screen.unmount()` chamado antes de trocar de tela
- `js/config.js`: constantes `SIM_*` e `APP_VERSION` 0.3.0

### Decisões técnicas
- Teto de 400 nós pelo pior caso (ninguém checa): `roundsDrawn` = 5 (fanout 2 ou 3), 4 (fanout 4), 3 (fanout 5); corta no último anel inteiro que cabe — a árvore não depende do sorteio
- Números das rodadas visuais vêm da própria árvore; depois dela, `continueRounds` parte de quem repassou na última rodada desenhada
- Binomial: sorteio pessoa a pessoa até 64; acima disso aproximação normal (Box-Muller) limitada a [0, n]
- Boato que morre cedo: a lista termina na primeira rodada sem repasse e a tela diz "O boato parou na rodada N."
- Fim das rodadas mostra "Ver comparação" (não pula sozinho)
- Visitante desenhado em `--accent`; legenda curta (Você, Repassou, Checou antes)
- Tela cheia não funciona no iPhone (Safari): vale o fallback de ampliar a tela

### Roteiro de teste
1. Abrir pelo `file://` e pelo GitHub Pages → `#/simulador` mostra um boato com selo "Simulação"
2. Checar antes → "0 pessoas enganadas" + gabarito; "E se eu tivesse compartilhado?" abre a árvore
3. Compartilhar → rodadas de 1,2 s; depois da 5ª só números até a 10ª; "Ver comparação" → duas colunas
4. Ajustes (fanout 5, 50%) → a próxima simulação muda; "Nova simulação" 3 vezes → boatos diferentes em sequência
5. Modo apresentação: clique no canvas, Espaço, → e "Próxima rodada" avançam; Esc sai
6. 375×812, 768×1024 (retrato e paisagem) e 1366×768 → árvore inteira, sem rolagem horizontal, alvos ≥ 44 px
7. Console: `simulatorModel.countRounds({ fanout: 3, checkRate: 0, rounds: 5 })` → received 3, 9, 27, 81, 243; `expectedReach({ fanout: 3, checkRate: 0, rounds: 10 })` → 88572
8. Pendente: testar a tela cheia de verdade no Chrome normal e no tablet (o headless recusa `requestFullscreen` sem gesto)

### Roteiro para a apresentação (modo apresentação)
1. Abra o simulador, ajuste "Repasses por pessoa" e "% que checa antes" se quiser e toque em "Modo apresentação"
2. Leia o boato em voz alta e pergunte: "Quem compartilharia?". Toque em "Compartilhar"
3. Cada toque no canvas, Espaço ou → abre uma rodada. Narre: "1 pessoa mandou para 3, que mandaram para 9, 27, 81…". Aponte os celulares verdes com ✓: "esses checaram, o ramo parou"
4. Depois da 5ª rodada a árvore para e só os números continuam. Avance até a 10ª e leia "Se continuasse: na 10ª rodada, N pessoas"
5. Toque em "Ver comparação": "Ninguém checou" contra "30% checaram". Feche com "Na dúvida, não compartilhe." e a cartilha do CERT.br. "Nova simulação" para outro boato, "Sair" para voltar

**Arquivos:** `js/simulator-model.js`, `js/screens/simulator.js`, `css/simulator.css`, `css/theme.css`, `js/app.js`, `js/config.js`, `index.html`

---

## Layout responsivo e simulador: visão de multidão (v0.3.1)

**Status:** ✅ v0.3.1 na `fix/layout-simulador`, mesclada na `main` e publicada no GitHub Pages. Sem banco, sem revisão do `security-engineer`.

### Regras
- A árvore desenha as primeiras rodadas (3 a 5, conforme o fanout, teto de 400 nós). Depois dela entra a **visão de multidão**: a árvore encolhe para o centro e cada rodada vira um anel de pontos (`--verdict-false` = repassou; `--verdict-true` = checou, proporcional ao sorteio da rodada)
- Cada ponto = `ceil(received / 720)` pessoas (máx. 720 pontos por anel); legenda "Cada ponto = N pessoas" e rótulo do anel "Rodada 6 · 729 pessoas"
- A tela termina na rodada `SIM_PRESENTATION_ROUNDS` (8) ou antes ("O boato parou na rodada N."). A comparação continua calculada para `SIM_TOTAL_ROUNDS` (10) e se chama "Se continuasse até a 10ª rodada"
- Vale nos dois modos; no modo apresentação cada clique, Espaço ou → gera um anel novo

### Fluxo / Telas
- Simulador no notebook: `.layout-split` com mensagem, contadores e botão à esquerda e canvas à direita, sem rolar em 1366×768 e 1920×1080. No celular: título, contadores compactos, canvas, legenda, botão; depois de "Compartilhar" o canvas entra na tela
- Modo apresentação em tela cheia: notebook/projetor com painel à esquerda (rodada e contadores em fonte grande, botão grande) e canvas na altura toda; retrato com canvas em cima e painel embaixo
- Nova simulação: fade de 220 ms, rolagem ao topo, mensagem grande e centralizada; o modo apresentação continua ligado
- Mensagem do boato mostra o quadro "Imagem fictícia" com o `alt` nas missões com `image` (M1, D1, D2)
- Sem animação com `prefers-reduced-motion` (encolher da árvore, fade e rolagem)

### Arquivos e funções
- `css/theme.css`, `css/base.css`, `css/screens.css`: sistema de layout global (ver "Constantes e Tema")
- `css/simulator.css`: reescrito (passos centrados, grade de 2 colunas na árvore, apresentação, quadro da imagem, fade)
- `js/simulator-model.js`: `personsPerDot`, `crowdRing` (→ perDot, dots, checkedDots, sharedDots), `MAX_CROWD_DOTS` (720)
- `js/screens/simulator.js`: multidão, fim na rodada 8, quadro da imagem, fade, rolagem
- `js/config.js`: `SIM_PRESENTATION_ROUNDS` 8, `APP_VERSION` 0.3.1
- `docs/capturas/v0.3.1/`: 6 capturas (rodada 8 e comparação em 375×812, 768×1024 e 1920×1080); fora do site

### Decisões técnicas
- `--root-size` fluido faz o `rem` escalar com a tela (16 px no celular, ~18 px no notebook, ~22 px no telão); alvos de toque continuam em px (≥ 44 px)
- Cada anel tem o seu "cada ponto = N"; a legenda mostra o do anel de fora. Um N único para todos os anéis é uma mudança pequena no `crowdInfo`
- `phoneSize` mínimo de 4 px (era 5) para a árvore caber quando encolhe
- Em apresentação o título fica oculto e só "Sair" aparece no topo
- Só M1, D1 e D2 têm `image`; F1, F2 e M2 estão com `image: null` e não mostram quadro

### Roteiro de teste
1. Notebook 1366×768 e 1920×1080 (file:// e Live Server) → sem coluna estreita, sem rolagem horizontal; simulador sem rolagem vertical
2. Compartilhar → árvore até a última rodada dela; a rodada seguinte encolhe a árvore e abre o primeiro anel; cada rodada muda o desenho até a 8ª; "Ver comparação" → "Se continuasse até a 10ª rodada"
3. Modo apresentação: clique no canvas, Espaço e → geram um anel novo cada; "Nova simulação" 3 vezes seguidas mantém o modo ligado
4. Fanout 5 e 80% checando → o boato pode parar cedo ("O boato parou na rodada N.")
5. 375×812, 390×844, 768×1024 e 2560×1440 → alvos ≥ 44 px
6. Pendente: tela cheia de verdade no Chrome comum e no tablet (o headless recusa `requestFullscreen`; o fallback foi testado)

**Arquivos:** `css/theme.css`, `css/base.css`, `css/screens.css`, `css/simulator.css`, `js/simulator-model.js`, `js/screens/simulator.js`, `js/config.js`, `docs/capturas/v0.3.1/*`

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
- `js/config.js`: `APP_VERSION` ('0.3.1', único lugar da versão), `MISSIONS_PER_LEVEL_IN_MATCH` (1), `FEATURES` (`simulator` ligado; `missions` e `ranking` desligados), `SIM_FANOUT` 3, `SIM_CHECK_RATE` 0.1, `SIM_VISUAL_ROUNDS` 5, `SIM_TOTAL_ROUNDS` 10, `SIM_ROUND_MS` 1200, `SIM_COMPARE_CHECK_RATE` 0.3
- `css/theme.css` — cores: `--bg #0F1B2D`, `--surface #17263D`, `--border #2A3B55`, `--text #F2F5F9`, `--text-muted #A9B6C8`, `--accent #3DA5FF`, `--on-accent #0F1B2D`; vereditos: `--verdict-true #3FB27F`, `--verdict-false #E5534B`, `--verdict-misleading #E9A23B`, `--verdict-unproven #8A9BB0`
- `css/theme.css` — medidas: fonte `system-ui`, `--font-sm` a `--font-2xl`, `--space-1` a `--space-7`, `--radius` 6px, `--touch-min` 44px, `--content-max` 960px, `--text-max` 60ch, `--touch-lg` 64px, `--canvas-max-height` 58vh
- Layout (v0.3.1) — breakpoints (media query não aceita `var()`; repetir os números, documentados no topo do `theme.css`): celular < 600px (1 coluna); tablet 600–1023px (1 coluna larga, 2 em paisagem); notebook ≥ 1024px (container centralizado); telão ≥ 1600px (`--content-max` sobe para 88rem). Divisão em colunas: `(min-width: 1024px), (min-width: 600px) and (orientation: landscape)`
- Layout — tipografia fluida: `--root-size` = `clamp(16px, 0.55vw + 11px, 30px)` no `html` (todo `rem` escala); `--font-lg/xl/2xl/3xl` com `clamp()`; `--font-sm` e `--font-md` fixos. Espaçamentos `--space-5/6/7` fluidos; `--gutter` (margem lateral)
- Layout — medidas: `--header-height`, `--content-max` (75rem; 88rem a partir de 1600px; antes era 960px), `--panel-max` (56rem), `--compare-max` (72rem), `--split-cols` (5fr/7fr), `--split-cols-present` (2fr/3fr), `--canvas-min-height`, `--sim-chrome` (15rem), `--fade-ms` (220ms)
- Layout — classes globais (`base.css`): `.layout-center` (coluna centralizada até `--panel-max`) e `.layout-split` (1 coluna que vira 2 nas condições acima; filhos usam `grid-area` ou `.layout-split__side` / `__visual`). Header, main e footer usam `--gutter` e `--content-max`. **Telas novas (Fase 2) devem usar essas classes e variáveis, nunca largura fixa em px**
- `js/config.js`: `SIM_PRESENTATION_ROUNDS` 8 (última rodada mostrada na tela); `SIM_TOTAL_ROUNDS` 10 é só a rodada da comparação

---

## Bugs Corrigidos
| Bug | Causa | Fix |
|---|---|---|
| A. Site vira coluna estreita à esquerda no computador | `.app-main`/`.home` limitados a 960px e a `.home` a 60ch, alinhados à esquerda, sem grade de colunas | Sistema de layout (container fluido centralizado, `.layout-split`, `clamp()`) — v0.3.1 |
| B. A partir da 5ª rodada só os números subiam | `SIM_VISUAL_ROUNDS` desenha a árvore só até a rodada 5 (3 com fanout 5); as seguintes só atualizavam o contador | Visão de multidão: anéis de pontos até a rodada 8, nos dois modos — v0.3.1 |
| C. "Nova simulação" era corte brusco e a tela cheia no computador tinha cara de tablet | Passo A era um cartão pequeno à esquerda, sem transição; apresentação usava coluna única | Fade de 220 ms, rolagem ao topo, mensagem grande e centralizada; apresentação em 2 colunas no notebook — v0.3.1 |
| D. Quadro da imagem fictícia não aparecia no simulador | `simulator.js` nunca renderizava `rumor.image` | `buildMessage()` mostra `<figure class="sim-image">` com "Imagem fictícia" e o `alt` — v0.3.1 |

---

## O Que Ainda Não Foi Implementado
Itens do roadmap pendentes (detalhes no `PLANEJAMENTO.md`):
- [x] Fase 1 — Simulador viral + base do site — ✅ Completo (v0.3.0)
- [ ] Fase 2 — Jogo das missões (apelido, investigação, veredito, pontuação, resultado) — até 19/11
- [ ] Fase 3 — Revisão das 6 missões pelo grupo — até 17/11
- [ ] Fase 4 — Ranking online (Supabase) — até 22/11
- [ ] Fase 5 — Testes em notebook/tablet/celular, service worker, QR Code, tela de dicas — até 24/11
- [ ] v1.0.0 e congelamento — 25/11

---

*Última atualização: 10/11/2026 (v0.3.1 — layout e visão de multidão)*
