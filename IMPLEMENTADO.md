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
- Jogo (v0.4.0) — `css/theme.css`: `--border-width-strong` (2px), `--mark-size` (1.5rem); `js/config.js`: `IDLE_RESET_MS` 90000 (tela final parada volta ao início); `FEATURES.missions` ligado; pontuação em `ChecaAi.scoring.SCORING`
- Documentos (v0.3.2) — `css/theme.css`: `--doc-paper`, `--doc-ink`, `--doc-ink-muted`, `--doc-border`, `--doc-crest-a/b/c` (papel e brasão inventado dos documentos fictícios; únicas cores fora da paleta do tema)
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

## Conteúdo e imagens (Fase 2 — parte A, v0.3.2)

**Status:** ✅ v0.3.2 na `feat/conteudo-imagens`, mesclada na `main` e publicada no GitHub Pages. Sem banco, sem revisão do `security-engineer`.

### Regras
- Agora são 7 missões (3 fáceis, 2 médias, 2 difíceis); `drawMatch` e `getShareableRumors` não precisaram mudar (F3 entra sozinha no sorteio fácil e no simulador)
- `mission.image` é `{ kind: 'photo', src, alt, credit, width, height }`, `{ kind: 'document', brand, orgLine, subtitle?, number, body, place, date, signature, alt }` ou `null`. Mídia sem `kind` (formato antigo `{ alt }`) cai no quadro "Imagem fictícia"
- Foto que não carrega (evento `error`) vira o quadro "Imagem fictícia" com o `alt`; logo que não carrega some e o cabeçalho fica só em texto

### Fluxo / Telas
- Mensagem do boato (simulador) vem do componente compartilhado; a Fase 2B reusa nas missões
- Documentos (D1 e F3) desenhados em HTML/CSS com faixa diagonal "SIMULAÇÃO" de ponta a ponta, sempre visível
- M1 e D2 com foto real e crédito visível abaixo
- Modo apresentação: botão só com ícone (canto superior direito, 44×44, `--text-muted`, `aria-label` e `title` "Modo apresentação"); dentro do modo, "Sair" continua texto
- Favicon novo

### Arquivos e funções
- `js/components/post-card.js`: `ChecaAi.components.postCard.render(mission, { ariaLabel })` → `<article class="post-card">` (cabeçalho, selo "Simulação", selo da publicação, texto, mídia). Carregado depois de `missions-data.js`
- `css/components.css`: `.post-card*` e `.post-doc*` (sem depender de classe do simulador)
- Documento: `div role="img"` com `aria-label` = `alt`; o `content` da missão fica só para leitor de tela. Faixa SIMULAÇÃO dentro do componente (posição, rotação, z-index e `pointer-events:none` inline no JS; `aria-hidden`; `clamp(2.6rem, 12cqw, 5rem)`, opacidade 0,42, `--verdict-false`). Assinatura em fonte cursiva do sistema só quando há nome; sem nome, linha e cargo
- `theme.css`: `--doc-paper`, `--doc-ink`, `--doc-ink-muted`, `--doc-border`, `--doc-crest-a/b/c`
- `assets/icons/icons.svg` (pacote; hoje só `icon-present`) com cópia idêntica inline no `index.html` (`<use>` externo não funciona por `file://`; mudou um, muda o outro); `assets/icons/favicon.svg`
- `assets/images/missoes/m1-enchente.jpg`, `d2-ponte.jpg` e `CREDITOS.md`; `assets/images/marcas/ifnmg-arinos.png` (logo da F3)
- `simulator.css`: blocos `.sim-msg*`, `.sim-stamp` e `.sim-image*` removidos (agora no `components.css`)
- `docs/capturas/v0.3.2/`: capturas de F3, D1, M1, D2 e do topo do simulador (375×812, 768×1024, 1920×1080)

### Decisões técnicas
- D1: `document` com brasão inventado em SVG inline (escudo verde, sol dourado, faixa vinho; cores `--doc-crest-*`, diferentes do tema), "OFÍCIO Nº 487/2026", assinatura só com o cargo (como diz a missão)
- F3: `document` com o logo do IFNMG Campus Arinos (PNG 672×112, já traz texto MEC/IFNMG, então a `orgLine` repete o nome), "COMUNICADO Nº 058/2026", assinatura fictícia "Marta Regina Fontoura — Coordenadora de Ensino"
- M1: foto de Don Becker (USGS), domínio público, "Sunken cars on flooded street in Cedar Rapids Iowa" (EUA, 2008) — https://commons.wikimedia.org/wiki/File:Sunken_cars_on_flooded_street_in_Cedar_Rapids_Iowa.jpg (1200×798, 159 KB). Tem um grafite pequeno na caçamba de uma picape
- D2: foto de Les Hull, CC BY-SA 2.0, via Geograph, "Wark Bridge (closed for repairs)" — https://commons.wikimedia.org/wiki/File:Wark_Bridge_(closed_for_repairs)_-_geograph.org.uk_-_3458307.jpg (1066×800, 102 KB). As placas estão em inglês ("ROAD CLOSED"); trocar a foto se incomodar na mostra
- Só existe o ícone `icon-present` no pacote; o `container-type`/`cqw` da faixa exige Chrome 105+, Safari 16+ e Firefox 110+ (em navegador antigo a faixa cai em 2,4rem, mas aparece)

### Roteiro de teste
1. Abrir `#/simulador` pelo `file://` e por http em 375×812, 768×1024 e 1920×1080
2. No console, trocar o `.post-card` por `ChecaAi.components.postCard.render(ChecaAi.missions.all.find(m => m.id === 'F3'))` e repetir para D1, M1, D2, F1, F2 e M2 → logo/brasão, faixa SIMULAÇÃO, foto com crédito, sem rolagem horizontal
3. Trocar `image.src` por um arquivo inexistente numa cópia da missão → quadro "Imagem fictícia" com o `alt`
4. Rodar a tela várias vezes até sortear a F3; compartilhar, passar as rodadas e ver a comparação
5. Modo apresentação pelo ícone e "Sair"
6. `ChecaAi.missions.drawMatch()` 100 vezes → sempre 1 fácil, 1 média, 1 difícil
7. Pendente: Safari/iOS, Firefox, toque em tablet real e tela cheia de verdade (só Chrome headless foi testado)

**Arquivos:** `index.html`, `css/theme.css`, `css/base.css`, `css/components.css`, `css/simulator.css`, `js/components/post-card.js`, `js/missions-data.js`, `js/screens/simulator.js`, `js/config.js`, `MISSOES.md`, `assets/icons/*`, `assets/images/missoes/*`, `assets/images/marcas/ifnmg-arinos.png`, `docs/capturas/v0.3.2/*`

---

## Jogo das missões (Fase 2, v0.4.0)

**Status:** ✅ v0.4.0 na `feat/fase-2-jogo`, mesclada na `main` e publicada no GitHub Pages. Sem banco (ranking é a Fase 4), sem revisão do `security-engineer`. O visual será redesenhado depois (Canva); esta versão é função + layout responsivo.

### Regras
- **Pontuação (máx. 200 por missão, 600 por partida):** veredito certo 100; sinais até 80; conclusão 20 (sempre). Constantes em `ChecaAi.scoring.SCORING`: `VERDICT_POINTS` 100, `SIGNALS_POINTS` 80, `TRAP_PENALTY` 20, `COMPLETION_POINTS` 20, `MISSION_MAX` 200
- Os 80 pontos dos sinais dividem-se igualmente entre os sinais suspeitos; o resto da divisão vai de 1 em 1 para os primeiros suspeitos, na ordem de `missions-data.js` (3 suspeitos = 27+27+26; 2 = 40+40); marcar todos dá sempre 80 (`splitSignalPoints(n)`)
- Cada isca marcada tira 20; a parte dos sinais nunca fica abaixo de 0
- Resultado por sinal: `found` (suspeito marcado), `missed` (suspeito não marcado), `trap` (isca marcada), `ok` (isca não marcada)
- Entradas inválidas: índices fora da faixa, duplicados ou não inteiros são ignorados; veredito desconhecido lança erro claro
- `scoreMatch` → `{ total, maxTotal (200 × nº de missões), correctVerdicts, missions }`
- **Apelido** (`ChecaAi.utils.validateNickname(text)` → `{ ok, value, error }`; **a mesma regra vai para o banco na Fase 4**): tira espaços das pontas e colapsa os repetidos; normaliza em NFC; 2 a 20 caracteres (por code point); só `/^[\p{L}\p{N} ]+$/u` (letras com acento, números e espaço; emoji, símbolos e `_` recusados); lista curta de palavrões comuns em português (interna ao `utils.js`), comparada sem acento e sem diferença de maiúsculas, por palavra inteira (para não bloquear palavras comuns) e, só para as mais graves, também por trecho colado; não trata leet. Mensagens: "Use de 2 a 20 caracteres.", "Só letras, números e espaço.", "Escolha outro apelido."
- O apelido do visitante anterior nunca é guardado nem preenchido

### Fluxo / Telas
- Início: "Começar investigação" (só com `FEATURES.missions`) e o simulador como botão secundário
- `#/apelido`: campo sempre vazio, erro inline em `aria-live`; "Começar" sorteia `drawMatch()`, cria a partida e vai para `#/missao`
- `#/missao`: "Missão N de 3 · nível"; post-card com mídia; ferramentas em botões (`aria-expanded`/`aria-controls`); sinais como botões `aria-pressed` em ordem embaralhada guardada na partida; veredito com 4 rádios nativos num `fieldset` (sem cores de veredito); "Enviar veredito" desabilitado até escolher. No notebook (`.layout-split`): post-card e ferramentas à esquerda, sinais e veredito à direita
- `#/resultado-missao`: "Acertou"/"Errou" e o veredito certo na cor `--verdict-*`; cada sinal com Suspeito/Isca, Marcado/Não marcado e o resultado em palavras (Você achou, Você não viu, Caiu na isca, Evitou a isca), além da borda colorida; gabarito comentado, "Como se proteger", cartilha, pontos detalhados e total "N de 200"; "Próxima missão" ou "Ver resultado final"
- `#/fim`: apelido, "X de 600", "N de 3", tempo mm:ss; "Antes de compartilhar" com as 5 dicas do `MISSOES.md`; "Jogar de novo" (apelido vazio) e "Ver o simulador"; espaço comentado no código para a posição no ranking (Fase 4). Parada por `IDLE_RESET_MS` (90 s; o timer reinicia com `pointerdown`, `keydown` ou `scroll`) volta a `#/inicio` e limpa a partida
- Rotas protegidas: sem partida, `#/missao`, `#/resultado-missao` e `#/fim` voltam a `#/inicio`; recarregar no meio continua de onde parou; voltar do navegador não duplica resposta

### Arquivos e funções
- `js/scoring.js`: `SCORING`, `splitSignalPoints`, `scoreMission`, `scoreMatch`
- `js/storage.js`: `startMatch`, `getMatch`, `getSignalOrder`, `saveAnswer`, `advance`, `finishMatch`, `clearMatch`
- `js/utils.js`: `validateNickname`
- `js/missions-data.js`: `getMissionById`; ajustes de conteúdo (ver "Bugs Corrigidos")
- `js/screens/nickname.js`, `mission.js`, `mission-result.js`, `match-end.js`; `home.js` com o botão principal
- `js/app.js`: suporte a `guard()` opcional nas telas
- `css/game.css`; `css/theme.css` ganhou `--border-width-strong` (2px) e `--mark-size` (1.5rem)
- `js/config.js`: `FEATURES.missions` true, `IDLE_RESET_MS` 90000, `APP_VERSION` 0.4.0
- `CLAUDE.md`: regra de instituição real reescrita (IFNMG Campus Arinos só na F3, com nome e assinatura inventados e selo SIMULAÇÃO)

### Decisões técnicas
- Partida em `sessionStorage` (chave `checaai.match`) com cópia em memória; se o storage falhar, a partida segue só em memória e o erro vai para `console.warn`. Formato: `clientId` (`crypto.randomUUID` com fallback), `nickname`, `missionIds`, `index`, `answers[]` (`{ missionId, verdict, markedSignalIndexes, score, answeredAt }`), `signalOrders`, `startedAt`/`finishedAt` em ms
- `saveAnswer` ignora missão já respondida e devolve a resposta existente; `finishMatch` só encerra com todas respondidas
- Veredito com rádios nativos (teclado e leitor de tela sem código extra)
- `guard()` nas telas faz `location.replace` (não empilha histórico). Com partida em andamento, `#/resultado-missao` sem resposta e `#/fim` sem partida concluída vão para `#/missao` (para não perder a partida ao usar o voltar); sem partida nenhuma vão para `#/inicio`; `#/missao` com a partida encerrada vai para `#/fim`
- Valores de seleção, ferramentas abertas e sinais marcados não são guardados ao recarregar; só missão, ordem dos sinais e respostas enviadas
- `game.css` tem poucos valores geométricos soltos (porcentagens do desenho da marca de seleção, `0.22` do rádio, `min-width: 16rem` do botão principal)

### Roteiro de teste
1. Console: `ChecaAi.scoring` (as 7 missões dão 200 com veredito certo e todos os suspeitos; veredito errado sem nada = 20; só iscas = sinais 0) e `ChecaAi.utils.validateNickname('  Ana   Paula ')` → "Ana Paula"
2. Jogar 3 partidas seguidas → combinações diferentes; recarregar na missão 2 → continua, com os sinais na mesma ordem
3. Abrir `#/fim`, `#/missao` e `#/resultado-missao` sem partida → volta ao início; botão voltar no resultado não duplica resposta
4. Deixar a tela final parada (90 s) → volta ao início e limpa a partida; "Jogar de novo" → apelido vazio
5. F3: com o logo, cabeçalho "Campus Arinos · Coordenação de Ensino"; sem o logo, texto completo
6. 375×812, 768×1024, 1024×768, 1366×768 e 1920×1080 → sem rolagem horizontal, alvos ≥ 44 px
7. Pendente: aparelho real (toque), Safari e Firefox, falha do `sessionStorage` (só relido o código), inspeção visual do 768×1024 e do 1024×768

**Arquivos:** `js/scoring.js`, `js/storage.js`, `js/utils.js`, `js/missions-data.js`, `js/app.js`, `js/config.js`, `js/components/post-card.js`, `js/screens/{home,nickname,mission,mission-result,match-end}.js`, `css/game.css`, `css/theme.css`, `index.html`, `MISSOES.md`, `CLAUDE.md`, `assets/images/missoes/CREDITOS.md`, `docs/capturas/v0.4.0/*`

---

## Simulador com mensagens próprias e 9 missões (v0.4.1)

**Status:** ✅ v0.4.1 na `feat/conteudo-v0.4.1`, mesclada na `main` e publicada no GitHub Pages. Sem banco, sem revisão do `security-engineer`.

**Motivo:** o simulador sorteava as missões do jogo e o "Checar antes" mostrava o gabarito; quem passava pelo simulador e depois jogava já sabia a resposta.

### Regras
- O simulador usa só 5 mensagens próprias (S1 a S5, em `js/simulator-rumors.js`; fonte no `MISSOES.md`, seção "Mensagens do simulador"). Elas não repetem nenhuma missão do jogo
- O sorteio nunca repete a mensagem anterior (`pickNext(previousId, random)`, função pura)
- "Checar antes": "Você parou o boato aqui.", "0 pessoas enganadas", o `checkResult` da mensagem (1 linha) e "Na dúvida, não compartilhe."; nenhum gabarito de missão. "E se eu tivesse compartilhado?" continua
- 9 missões, 3 por nível. Missões novas: M3 "A multa do lixo" (médio, Verdadeira) e D3 "A escola que vai fechar" (difícil, Sem provas suficientes). D2 trocou a isca "A foto mostra cones, então foi montada" por "Fala em pilastra rachada, então é exagero para assustar"
- Balanceamento: Verdadeira M3, D2 · Falsa F2, F3, D1 · Enganosa M1, M2 · Sem provas F1, D3. Pela distribuição por nível, nenhuma partida tem os 3 vereditos iguais. Ao chegar a 12, manter ~20% verdadeiras, ~35% falsas, ~20% enganosas, ~20% sem provas

### Fluxo / Telas
- Simulador (passo A): mensagem de `simulatorRumors`. S2 mostra "Gente, olha isso que saiu agora!" acima do documento do IFNMG (logo, faixa SIMULAÇÃO, "Campus Arinos · Coordenação de Ensino", mesmo fallback da F3). S4 mostra o quadro "Imagem fictícia" com a descrição (sem foto; ver Decisões)

### Arquivos e funções
- `js/simulator-rumors.js` (novo): `ChecaAi.simulatorRumors = { all, pickNext(previousId, random) }`, dados congelados
- `js/screens/simulator.js`: sorteia de `simulatorRumors`; "Checar antes" com `checkResult`
- `js/components/post-card.js`: flag opcional `showContentWithDocument` no item (só a S2 usa): o texto fica visível acima do documento; sem a flag (F3, D1) continua só para leitor de tela. Mídia `{ kind: 'placeholder', alt }` mostra o quadro "Imagem fictícia" sem tentar carregar arquivo
- `js/missions-data.js`: M3 e D3; isca nova da D2; **`getShareableRumors` removida** (só o simulador usava; conferido com Grep e codebase-memory)
- `index.html`: carrega `simulator-rumors.js` depois de `post-card.js`
- `MISSOES.md`: 9 missões, M3, D3, isca da D2, "Balanceamento dos vereditos", "Mensagens do simulador"; formato da D2 passou a "sem imagem"
- `js/config.js`: `APP_VERSION` 0.4.1

### Decisões técnicas
- **Foto da S4 não encontrada.** Nenhuma foto livre do Commons atendeu "fila longa, sem rostos em primeiro plano, sem texto em outro idioma" (descartadas: Ryde bus station — ônibus ingleses com texto; Mizue Station — placas em japonês; Retiro, Buenos Aires e fila em San José — rostos em primeiro plano; Terminal Tietê nº 53, CC0 — saguão cheio, não fila, com rostos). A S4 usa `kind: 'placeholder'` (sem 404 no console); quando houver foto, trocar por `kind: 'photo'` com `credit` e criar `assets/images/simulador/CREDITOS.md`
- `format.type` das mensagens: S1, S2 e S5 `group-chat`; S3 `private-chat`; S4 `social-post` (só descritivo)
- Sem mudança de CSS nem de banco

### Roteiro de teste
1. `#/simulador` e "Nova simulação" várias vezes → as 5 mensagens aparecem, nunca a mesma em sequência
2. S2 → logo, faixa SIMULAÇÃO, "Campus Arinos · Coordenação de Ensino" e "Gente, olha isso que saiu agora!" acima do documento
3. "Checar antes" em cada mensagem → só o `checkResult` e as frases, sem texto de missão
4. Simulação até a rodada 8 e comparação 88.572 × 4.546 (repasses 3)
5. Console: `ChecaAi.missions.all.length` → 9; `scoreMission` dá 200 nas 9; `drawMatch()` 300 vezes → 1 por nível, em ordem, as 9 aparecem, nunca 3 vereditos iguais
6. Jogar M3 e D3 do começo ao resultado; F3 e D1 sem texto visível acima do documento
7. 375×812 e 1920×1080 → sem rolagem horizontal, alvos ≥ 44 px, console limpo
8. Pendente: foto da S4; aparelho real, Safari e Firefox

**Arquivos:** `js/simulator-rumors.js`, `js/screens/simulator.js`, `js/components/post-card.js`, `js/missions-data.js`, `index.html`, `js/config.js`, `MISSOES.md`

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
- `js/config.js`: `APP_VERSION` ('0.4.1', único lugar da versão), `MISSIONS_PER_LEVEL_IN_MATCH` (1), `FEATURES` (`simulator` ligado; `missions` e `ranking` desligados), `SIM_FANOUT` 3, `SIM_CHECK_RATE` 0.1, `SIM_VISUAL_ROUNDS` 5, `SIM_TOTAL_ROUNDS` 10, `SIM_ROUND_MS` 1200, `SIM_COMPARE_CHECK_RATE` 0.3
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
| D2 com foto contradizia o veredito "Verdadeira" (v0.4.0) | A foto de ponte interditada (placas em inglês) foi usada numa missão cujo veredito é Verdadeira | D2 voltou a `image: null`; `d2-ponte.jpg` fica no repositório e o `CREDITOS.md` marca "NÃO USADA no site (arquivo mantido)" |
| M1 incoerente com a foto real (v0.4.0) | O texto falava de 2019 e "Rio Claro do Sul", mas a foto é de Cedar Rapids (EUA), 2008 | Pistas "Buscar a imagem" e "Conferir a data", gabarito e o sinal ("antiga e de outro país") reescritos em `MISSOES.md` e `missions-data.js`; `alt` ajustado |
| F3 repetia o nome da instituição ao lado do logo (v0.4.0) | A linha de texto completa aparecia junto do logo, que já traz o nome | Campo `orgLineWithLogo` ("Campus Arinos · Coordenação de Ensino") usado quando há logo; se o logo falha (evento `error`), o componente restaura a linha completa |

---

## O Que Ainda Não Foi Implementado
Itens do roadmap pendentes (detalhes no `PLANEJAMENTO.md`):
- [x] Fase 1 — Simulador viral + base do site — ✅ Completo (v0.3.0)
- [x] Fase 2 — Jogo das missões (apelido, investigação, veredito, pontuação, resultado) — ✅ Completo (v0.4.0)
- [ ] Foto livre para a mensagem S4 do simulador (fila em rodoviária; hoje mostra o quadro com a descrição)
- [ ] Fase 3 — Revisão das 9 missões pelo grupo — até 17/11
- [ ] Fase 4 — Ranking online (Supabase) — até 22/11
- [ ] Fase 5 — Testes em notebook/tablet/celular, service worker, QR Code, tela de dicas — até 24/11
- [ ] v1.0.0 e congelamento — 25/11

---

*Última atualização: 10/11/2026 (v0.4.1 — simulador com mensagens próprias e 9 missões)*
