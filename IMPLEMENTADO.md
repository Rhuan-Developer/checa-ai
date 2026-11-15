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

## Correções de zoom/escala e do modo apresentação (v0.4.2)

**Status:** ✅ v0.4.2 na `fix/zoom-e-apresentacao`, mesclada na `main` e publicada no GitHub Pages. O visual não mudou (mesmas cores, estrutura, componentes e telas); só tamanhos, escala e a posição de dois botões. Sem banco.

### Regras
- O zoom do navegador tem efeito visível: o layout funciona de 320 a ~3000 px CSS de largura (zoom de 50% a 200%)
- Celular e tablet (até ~1500 px CSS) ficam com `rem` = 16 px, como antes; no desktop o tamanho base ficou um pouco menor (1366: 18,5 → 16 px; 1920: 21,6 → 16,8 px)
- O container cresce com a largura da tela, sem teto fixo nem degrau em 1600 px

### Fluxo / Telas
- Simulador: botão "Modo apresentação" (ícone) na mesma linha do título, no canto extremo direito; em tela estreita o título quebra linha e o ícone continua visível
- Modo apresentação: "Sair" fixo no canto superior direito, dentro da área segura (`env(safe-area-inset-*)`), com faixa reservada no topo — não colide com título/chip no celular, com ou sem Fullscreen API
- Canvas e visão de multidão se redimensionam com a janela e com a troca de zoom (devicePixelRatio), sem borrar
- Foto da S4 segue pendente: a mensagem mostra o quadro com a descrição

### Arquivos e funções
- `css/theme.css`: `--root-size: clamp(16px, 0.2vw + 13px, 24px)`; `--content-max: max(75rem, 82vw)`; `--panel-max: max(56rem, 46vw)`; `--compare-max: max(72rem, 62vw)`; bloco `@media (min-width: 1600px)` removido; novas `--exit-width` (4.5rem) e `--exit-row` (`calc(var(--touch-min) + var(--space-3))`)
- `css/screens.css`: padding lateral de header, main e footer = `max(var(--gutter), env(safe-area-inset-left/right, 0px))`
- `css/simulator.css`: `.sim-top` sem quebra (título `flex: 1; min-width: 0`, ferramentas `flex: none`); "Sair" `position: fixed` com área segura; `.sim-top` reserva `--exit-row` no modo apresentação; passos centralizados usam `justify-content: safe center`
- `js/screens/simulator.js`: `resizeCanvas()` mede o próprio canvas (antes media o pai, com borda: bitmap 2 px maior); `watchDpr()`/`onDprChange()` escutam `matchMedia('(resolution: Xdppx)')`, refazem tamanho e desenho e se re-armam; listener removido no `destroy()`
- `index.html`: viewport com `viewport-fit=cover`
- `js/config.js`: `APP_VERSION` 0.4.2
- `docs/capturas/v0.4.2/`: 19 capturas (simulador em 360, 1366@100%, 1920@100%, 1920@80%, 2400 CSS; multidão; início e missão em 1920@80% e 1366@100%; modo apresentação em 360, 390, 768 e 844×390)

### Decisões técnicas
- `--root-size` com parte fixa dominante (13 px, que escala com o zoom) e só 0.2vw de parte fluida: o zoom não é mais anulado. Medido em 1920: `rem` físico 14,2 px a 80%, 16,8 px a 100%, 20,1 px a 125% (antes 19,4 / 21,6 / 24,3)
- Faixa reservada (`--exit-row`) no topo do modo apresentação em vez de só `padding-right`: colisão impossível por construção (custa ~56 px de altura em paisagem)
- `--panel-max` e `--compare-max` também crescem com vw, para o texto central não ficar estreito em 2400/3000 px
- Em 844×390 o modo apresentação rola (já acontecia antes)

### Roteiro de teste
1. Edge/Chrome no notebook: zoom 80%, 100%, 110%, 125%, 150% → o conteúdo diminui/aumenta, sem margens vazias enormes nem rolagem horizontal
2. Simulador em 360 px → título quebra linha e o ícone de apresentação continua à direita, sem sobrepor
3. Modo apresentação no celular (retrato e paisagem) → "Sair" no canto superior direito, sem sobrepor título/chip; avançar por toque; sair
4. Mudar o zoom com a simulação aberta → canvas redesenha nítido
5. Testes da v0.4.1 (scoring 200 nas 9, apelido, `drawMatch`, fluxo do jogo, simulador 88.572 × 4.546) continuam passando
6. Pendente: aparelho físico (notch real), Safari, Firefox, Edge real, tela cheia real e o evento real de troca de zoom (o headless não dispara)

**Arquivos:** `css/theme.css`, `css/screens.css`, `css/simulator.css`, `js/screens/simulator.js`, `index.html`, `js/config.js`, `docs/capturas/v0.4.2/*`

---

## Simulador: botão de apresentação na barra, coluna larga e mensagem compacta no celular (B-03, v0.4.3)

**Status:** ✅ v0.4.3 na `fix/simulador-cabecalho-escala`, mesclada na `main` e publicada no GitHub Pages. O visual não mudou (mesmas cores, componentes e conteúdo); só posição e tamanhos. Sem banco.

### Regras
- O botão "Modo apresentação" (ícone) fica na barra superior do app, no extremo direito, na linha do "Checa Aí"; aparece só no simulador (nas outras telas a barra só tem a marca)
- Tela inicial do simulador (mensagem) usa a largura toda do container: 82% da tela em 1366, 77% em 1920, 78% em 2400 (antes 66%, 49%, 46%)
- Celular (< 600 px): mensagem compacta; em 390×844 título, mensagem e os dois botões cabem na primeira tela com a mensagem mais alta (S2, documento). Quando não cabem (360×640 com a S2), "Compartilhar" e "Checar antes" ficam grudados no rodapé da tela até a rolagem chegar neles
- Modo apresentação inalterado: "Sair" fixo no canto superior direito como na v0.4.2

### Arquivos e funções
- `index.html`: `<div class="app-header__tools" id="app-header-tools">` dentro do `.app-header__inner` (vazio fora do simulador)
- `css/screens.css`: `.app-header__inner` com `justify-content: space-between`; `.app-header__tools`
- `js/screens/simulator.js` (`createSession`): o `presentBtn` vai para `#app-header-tools` (sem o espaço, volta para o lado do título com aviso no console); `destroy()` remove o botão da barra. O "Sair" continua no `.sim-top__tools`, dentro do `.simulator` (é ele que entra em tela cheia)
- `css/theme.css`: `--sim-center-max: 100%` (largura da tela inicial do simulador)
- `css/simulator.css`: `.sim-stage--center` usa `--sim-center-max` (antes `--panel-max`); bloco `@media (max-width: 599px)` só para `.simulator:not(.simulator--presenting) .sim-stage--center`: gap `--space-3`, `.post-card` padding `--space-3 --space-4` e gap `--space-2`, `.post-doc` padding `--space-3` e gap `--space-2`, logo do documento até 3.25rem de altura, foto até 35vh, quadro "Imagem fictícia" com 5rem mínimos, `.sim-actions` `position: sticky; bottom: 0` com fundo `--bg` e área segura
- `js/config.js`: `APP_VERSION` 0.4.3
- `docs/capturas/v0.4.3/`: 24 capturas (simulador inicial, rodando, apresentação na mensagem e apresentação rodando) em 360×640, 390×844, 768×1024, 1366×768, 1920×1080 e 2400×1200, por emulação de dispositivo (CDP `Emulation.setDeviceMetricsOverride`; abaixo de 1024 px com toque e DPR 2)

### Medidas (S2, a mensagem mais alta)
| Tamanho | Antes | Depois |
|---|---|---|
| 390×844 | cartão 581 px; botões de 785 a 885 (abaixo da dobra) | cartão 493 px; botões de 667 a 767 |
| 360×640 | botões de 780 a 880 | botões grudados no rodapé (532 a 632) |
| 1366×768 | coluna 896 px | coluna 1124 px |
| 1920×1080 | coluna 943 px | coluna 1473 px |
| 2400×1200 | coluna 1104 px | coluna 1861 px |
| Ícone de apresentação | y = 81 a 112 (linha do título) | y = 6 a 9, na barra, alinhado à direita do container |

### Decisões técnicas
- "~75–80% da largura" foi lido como da tela: 80% do container daria 899 px em 1366 (o mesmo de antes). A coluna usa o container todo, que já ocupa 77–82% da tela no desktop; assim fica alinhada ao título da página e ao passo dividido. Com 80vw ficava 16 px recuada em 1366
- As mensagens do simulador têm no máximo ~100 caracteres: a linha longa no cartão largo não atrapalha a leitura; o documento fictício continua com 44rem no máximo, centralizado
- Botões grudados por `position: sticky` (não `fixed`) em todo celular: não fazem nada quando cabem (390×844) e grudam no rodapé quando não cabem (360×640), sem esconder o "Ajustes" nem o rodapé
- Compactação só na tela inicial do simulador: o `.post-card` das missões não mudou
- O ícone mora no `index.html` e é preenchido pelo simulador, em vez de o `app.js` conhecer o botão: a tela continua dona dos próprios controles

### Roteiro de teste
1. `#/simulador` em 360, 390, 768, 1366, 1920 e 2400 px → ícone na barra superior à direita, sem sobrepor "Checa Aí"; sem rolagem horizontal; alvos ≥ 44 px
2. Ir para `#/inicio` e para o jogo → barra só com "Checa Aí"
3. 390×844 com a S2 → "Compartilhar" e "Checar antes" visíveis sem rolar; 360×640 → botões grudados no rodapé
4. 1366 e 2400 → mensagem larga, alinhada ao título; "Compartilhar" → layout dividido igual à v0.4.2
5. Ícone → modo apresentação; "Sair" no canto superior direito; ao sair, o foco volta ao ícone da barra
6. Testes (por CDP, `file://`): `scoreMission` 200 nas 9, veredito errado = 20, só iscas = 0, apelido, `drawMatch` 300× (ordem, as 9, nunca 3 vereditos iguais), `countRounds` 3/9/27/81/243, `expectedReach` 88.572 e 4.546, fluxo completo do jogo em 390×844 e 1366×768 → todos passam, console sem erros
7. Pendente: aparelho físico, Safari, Firefox e tela cheia real (o headless recusa a tela cheia; o app cai no modo ampliado, como previsto)

**Arquivos:** `index.html`, `css/theme.css`, `css/screens.css`, `css/simulator.css`, `js/screens/simulator.js`, `js/config.js`, `docs/capturas/v0.4.3/*`

---

## Ranking online — banco de dados (Fase 4A)

**Status:** ✅ SQL escrito e revisado pelo `security-engineer` (aprovado com ressalvas; ressalvas aplicadas) na `feat/ranking-online`. **Aplicado pela Grasi no Supabase** (teste: "OK — 80 checagens conferem"). Publicado junto com a 4B na v0.5.0.

### Regras
- Tabela `public.ranking` com RLS ligado e **nenhuma policy**; sem privilégio para `anon`, `authenticated` nem `PUBLIC` (o Supabase concede tudo por padrão; a migration revoga)
- Só duas funções `security definer` com `search_path = ''`, `execute` só para `anon`:
  - `submit_score(p_client_id uuid, p_nickname text, p_score int, p_missions_played int, p_correct_verdicts int, p_duration_ms int)` → `{ok:true, duplicate, position}` ou `{ok:false, error}`
  - `get_ranking(p_limit int default 20)` → `position, nickname, score, missions_played, duration_ms, correct_verdicts` de hoje (São Paulo), sem ocultos, 1 a 50 linhas; ordem pontos desc, tempo asc, horário asc
- Códigos de erro: `invalid_client_id`, `invalid_nickname`, `blocked_nickname`, `invalid_missions`, `invalid_correct`, `invalid_score`, `invalid_duration` (definitivos: a partida sai da fila) e `rate_limited`, `server_error` (temporários: a partida fica na fila). Nenhuma mensagem interna do banco vaza
- Apelido igual ao `validateNickname` do site: NFC, espaços juntados, 2 a 20 caracteres, mesmas duas listas de bloqueio (palavra inteira e trecho colado, sem acento). Diferença: o banco só aceita letras que viram a–z sem acento (todo o português), 0–9 e espaço; recusa marca combinante solta (acento empilhado), cirílico, grego e emoji. O site aceita qualquer `\p{L}\p{N}` → alinhar na 4B
- Pontuação coerente com o `scoring.js`: `20×missões + 100×acertos ≤ pontos ≤ 100×missões + 100×acertos` (teto 200 por missão)
- Tempo plausível: pelo menos 10 s por missão (30 s na partida de 3), no máximo 1 h
- Teto global contra enxurrada (sem IP): 30 partidas novas por minuto e 3000 por dia → `rate_limited`; reenvio de partida já gravada não conta
- `client_id` repetido (reenvio da fila offline) não duplica nem altera; devolve a mesma posição
- Apelido ofensivo: `hidden = true` pelo SQL Editor (a linha some do ranking, não é apagada)

### Arquivos
- `supabase/migrations/001_ranking.sql`: tabela, índices (`ranking_created_at_idx` e `ranking_day_order_idx`, parcial `where not hidden`), RLS, remoção de qualquer policy, revokes, as duas funções e os grants. Idempotente
- `supabase/rollbacks/001_rollback.sql`: apaga as funções e a tabela (`if exists`)
- `supabase/tests/001_ranking_test.sql`: um bloco `do $$` com 80 checagens que termina em "OK — 80 checagens conferem. Nada foi gravado." (RLS e zero policy; `anon`/`authenticated` sem nenhum privilégio na tabela; select/insert/update/delete reais como `anon` negados; definer, `search_path`, `execute` só `anon`, nada para `PUBLIC`/`authenticated`, nenhum `client_id` exposto, nenhuma outra função do `public` executável por `anon`; gravação válida, apelido normalizado, data de São Paulo, posição; reenvio; 25 rejeições com o código certo e nada gravado; `get_ranking` com ordem e desempates, sem ocultos, sem ontem, teto 50, mínimo 1, padrão 20; `rate_limited` e reenvio liberado)
- `supabase/LEIA-ME.md`: passo a passo da Grasi (migration, teste, ocultar apelido, emergência, rollback)
- `PLANEJAMENTO.md`: schema da Fase 4 atualizado

### Decisões técnicas
- Pedido × PLANEJAMENTO (decidido com o Rhuan em 14/11): `id uuid`, `duration_ms`, `missions_played` 1 a 3, coluna `hidden` (em vez de apagar), `get_ranking` padrão 20 e teto 50 vêm do pedido; `correct_verdicts` e `position` no retorno vêm do PLANEJAMENTO; apelido espelha o site; rollback em `supabase/rollbacks/001_rollback.sql` (CLAUDE.md)
- `authenticated` sem `execute`: o site não tem login
- `search_path = ''` (sugestão do `security-engineer`): `unnest` e `&&` são polimórficos; uma sobrecarga criada em `public` poderia ganhar a resolução dentro da função definer
- Faixa de acentos escrita como `\u0300-\u036f` (antes eram caracteres literais, que um copiar-colar estraga)
- Tempo mínimo de 10 s por missão (o `security-engineer` sugeriu 15 s): menor perda para quem joga rápido de verdade; conferir com a Grasi jogando
- Validação local antes de entregar: Postgres 16 em WebAssembly (PGlite, só no scratchpad, fora do projeto) com `anon`/`authenticated` e os default privileges do Supabase simulados → migration 2× + teste OK 2×, rollback 2×; testes de mutação (sem revoke, `authenticated` com execute, `get_ranking` com ocultos, policy aberta) fazem o teste falhar
- Rodar o teste em produção durante a mostra é seguro (só linhas novas com uuid aleatório, `lock_timeout` 3 s); ele supõe que ninguém fez 600 pontos em ≤ 30,2 s hoje e que não houve 30 envios no último minuto

### Riscos que o SQL não resolve (mostra de 1 dia)
- Sem login, quem souber usar o console consegue mandar uma partida forjada plausível (ex.: 600 pontos em 45 s). O banco barra o absurdo (pontos incoerentes, tempo impossível, enxurrada), não a mentira bem feita. Mitigação: a Grasi acompanha o ranking e oculta linhas suspeitas; em último caso, fecha a gravação (`revoke execute ... from anon`, `supabase/LEIA-ME.md` item 4) e as partidas ficam na fila do aparelho
- O teto global pode ser esgotado de propósito, travando envios legítimos por alguns minutos; com a fila offline, nada se perde

### Para a Fase 4B (site)
- `api.js`: tratar `invalid_*`/`blocked_nickname` como definitivos e `rate_limited`, `server_error`, erro de rede e "permission denied" (gravação fechada) como temporários
- Alinhar `validateNickname` ao banco: depois da dobra, só `a-z0-9 `; recusar marca `\u0300-\u036f` solta; trocar a faixa literal do `foldText` por `\u0300-\u036f`
- Não enviar partida com menos de 10 s por missão (ou avisar)
- Fim da partida: mostrar `position` do retorno

### Roteiro de teste (Grasi, no SQL Editor)
1. Rodar `001_ranking.sql` → "Success"
2. Rodar `001_ranking_test.sql` → erro "OK — 80 checagens conferem. Nada foi gravado."
3. Opcional: rodar a migration de novo → "Success"; repetir o teste → mesmo OK

**Arquivos:** `supabase/migrations/001_ranking.sql`, `supabase/rollbacks/001_rollback.sql`, `supabase/tests/001_ranking_test.sql`, `supabase/LEIA-ME.md`, `PLANEJAMENTO.md`

---

## Ranking online — app (Fase 4B, v0.5.0)

**Status:** ✅ v0.5.0 na `feat/ranking-online`, mesclada na `main` e publicada no GitHub Pages. SQL da 4A aplicado pela Grasi (teste "OK — 80 checagens"). Revisão do `security-engineer`: aprovada com ressalvas; ressalvas aplicadas. **Falta: a partida real de verificação da Grasi** (roteiro abaixo).

### Fluxo / Telas
- Início: "Começar investigação", **"Ranking"** e "Como um boato se espalha"
- Fim da partida: a partida entra na fila uma vez (pelo `clientId` da partida) e uma linha mostra a situação: "Enviando para o ranking…" → "Você está em Nº no ranking de hoje." (ou "Pontuação enviada ao ranking." sem posição); sem conexão ou falha temporária: "Pontuação salva. Vai pro ranking quando a internet voltar."; recusada ou rápida demais: nada. Botão "Ver o ranking"
- `#/ranking`: "Ranking de hoje", "Atualizado às HH:MM", tabela (posição, apelido, pontos, acertos, tempo; top 20), destaque da última partida do aparelho (enviada nos últimos 10 min), "Atualizar" e "Voltar"; atualiza sozinho a cada 15 s (só com a aba visível). Vazio: "Ninguém jogou ainda hoje." Sem conexão: "Sem conexão." + "Tentar de novo", com a última lista de hoje guardada ("Lista das HH:MM")
- Modo telão: ícone na barra superior (mesmo lugar do "Modo apresentação" do simulador); top 10, letras em `vh`/`vw` (47 px em 1920×1080, 53 px em 2400×1200; 10 linhas cabem sem rolar de 360×640 a 3840×2160 CSS), relógio "Atualizado às HH:MM:SS", atualiza a cada 10 s, "Sair" fixo no canto com faixa reservada, Esc sai (com ou sem Fullscreen API)
- Jogo e simulador seguem 100% sem internet; só o ranking usa a rede

### Regras
- Envio só se a partida respeita o banco: UUID, apelido válido, 1 a 3 missões, acertos 0 a missões, pontos coerentes com os acertos (`scoring.js`), **pelo menos 10 s por missão** e no máximo 1 h. Fora disso não envia e não mostra nada
- Erros: definitivos (`invalid_*`, `blocked_nickname`, HTTP 400/422) saem da fila; temporários (`rate_limited`, `server_error`, código desconhecido, corpo inválido, HTTP 401/403 = gravação fechada, 404, 429, 5xx, rede, tempo esgotado de 8 s) ficam. Rede/limite/gravação fechada esperam sem limite; os outros saem depois de 8 tentativas (não prendem as partidas seguintes)
- Reenvio: ao abrir o app, ao voltar a conexão (`online`) e enquanto houver fila: 30 s, 60 s, 120 s, 240 s, 300 s… (±25% de variação); para na primeira falha temporária
- Fila: até 20 partidas (descarta a mais antiga), só apelido + pontos/acertos/tempo/data/UUID; partida de outro dia é descartada sem envio
- Apelido (site = banco): NFC; só espaço/tab/quebra ASCII viram espaço (NBSP e espaços Unicode são recusados); 2 a 20 caracteres; sem acento solto; sem acento só `a-z0-9` e espaço (grego, cirílico, ß, º, ², emoji recusados); mesmas duas listas de bloqueio
- Segurança: apelidos sempre por `textContent`; linhas da rede e do localStorage conferidas (`sanitizeRow`/`sanitizeCachedRow`); `fetch` com `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`, `cache: 'no-store'`; só a chave publishable no código

### Arquivos e funções
- `js/config.js`: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `FEATURES.ranking: true`, `API_TIMEOUT_MS` (8 s), `MIN_MS_PER_MISSION` (10 s), `QUEUE_MAX` (20), `QUEUE_RETRY_MS` (30 s), `QUEUE_RETRY_MAX_MS` (5 min), `RANKING_LIMIT` (20), `RANKING_REFRESH_MS` (15 s), `RANKING_TV_LIMIT` (10), `RANKING_TV_REFRESH_MS` (10 s); `APP_VERSION` 0.5.0
- `js/api.js` (novo): `classifySubmit`, `classifyFailure`, `prepareEntry`, `retryDelay`, `sanitizeRow`, `sanitizeCachedRow` (puras); `submitScore`, `getRanking` (fetch com `AbortController`); fila: `flush`, `recordMatch`, `onChange`, `startSync`
- `js/storage.js`: `randomId` sempre UUID (fallback v4 com `Math.random`); `isUuid`, `newId`; fila (`getQueue`, `enqueueScore`, `removeQueued`, `updateQueued`), situação dos envios (`getResult`, `getResults`, `setResult`, até 20) e última lista (`getLastRanking`, `setLastRanking`) no localStorage, sempre relido (duas abas); memória só se o armazenamento falhar
- `js/utils.js`: `validateNickname` alinhado ao banco; `formatClock` (hora de São Paulo)
- `js/screens/ranking.js` (novo), `js/screens/match-end.js` (`rankStatusText`), `js/screens/home.js` (botão Ranking), `js/app.js` (`startSync` no início)
- `index.html`: `css/ranking.css`, `js/api.js`, `js/screens/ranking.js`, `<section data-screen="ranking">`, símbolo `icon-tv` (também em `assets/icons/icons.svg`)
- `css/ranking.css` (novo), `css/game.css` (`.end-rank`)
- `docs/capturas/v0.5.0/`: 29 capturas (início, fim da partida com posição, ranking com destaque e modo telão em 360×640, 390×844, 768×1024, 1366×768, 1920×1080 e 2400×1200; ranking vazio, sem conexão e fim sem conexão em 390×844; telão com zoom 50% e 200% em 1920×1080)

### Decisões técnicas
- `client_id` = `clientId` da partida (já existia, guardado no sessionStorage): recarregar a tela de fim não gera outro envio
- Destaque "você" pela chave apelido+pontos+tempo (o `get_ranking` não devolve `client_id`) e só da última partida do aparelho nos últimos 10 min (tablet compartilhado)
- 401/403 são temporários: é o que o PostgREST devolve quando a Grasi fecha a gravação (`revoke execute`), e a partida tem de esperar
- Telão com letras em `vh`/`vw`: ocupa a tela em qualquer zoom (50% a 200%) sem rolar; o tamanho físico não muda com o zoom, de propósito
- Tela: top 20; telão: top 10 (a lista é buscada uma vez com 20 linhas)
- Testes sem gravar em produção: Chrome headless com a rede do Supabase interceptada (CDP `Fetch`); `submit_score` sempre respondido por um servidor simulado; só `get_ranking` real (leitura)

### Revisão de segurança (security-engineer, 14/11/2026): aprovada com ressalvas, todas aplicadas
1. Erro persistente do servidor no primeiro item prendia as partidas seguintes até a virada do dia → limite de 8 tentativas para erros que não são de rede
2. Duas abas sobrescreviam a fila uma da outra (cópia em memória) → localStorage sempre relido; memória só se ele falhar
3. Lista guardada no localStorage desenhada sem conferência (cache adulterado travava a tela) → `sanitizeCachedRow`
4. Destaque "você" em todas as partidas do aparelho → só a mais recente
5. `\s` do JS (inclui NBSP) diferente do banco → só espaços ASCII
6. Espera sem variação → ±25%
- Para a Fase 5: o service worker não pode interceptar nem guardar `*/rest/v1/*` (`if (url.origin !== location.origin) return;`)

### Roteiro de teste
1. Automático (110 checagens, todas ok): classificação definitivo × temporário; espera crescente; `prepareEntry` (30 s envia, 29,999 s não, > 1 h não, pontos incoerentes, id não UUID); fila (limite 20, sem dados pessoais, outro dia descartado, duas abas, item preso sai no limite, `rate_limited` nunca descarta); sem conexão → volta → envia uma vez com posição; recarregar não reenvia; `rate_limited`/401/`server_error`/rede/8 s ficam na fila e depois enviam sem duplicar; definitivo sai sem aviso; rápida demais não envia; ranking com XSS (`<img onerror>`, `<script>`) vira texto; destaque; 15 s; sem conexão com e sem lista guardada; lista adulterada; vazio; telão (top 10, 10 s, Esc, "Sair" sem sobrepor); barra vazia fora do ranking; jogo e simulador sem internet; `get_ranking` real; testes antigos (9 missões = 200, drawMatch, modelo do simulador)
2. Banco real, só leitura: `get_ranking` → 200 `[]`; GET em `/rest/v1/ranking` → 401 `permission denied for table ranking`; sem chave → 401
3. Telas: sem rolagem horizontal e sem alvo < 44 px nos 6 tamanhos; simulador igual à v0.4.3
4. **Pendente (Grasi):** partida real de verificação (roteiro em `supabase/LEIA-ME.md`, item "Partida real de verificação"); aparelho físico, Safari, Firefox, tela cheia real e Wi-Fi caindo de verdade

**Arquivos:** `js/api.js`, `js/screens/ranking.js`, `css/ranking.css`, `js/storage.js`, `js/utils.js`, `js/config.js`, `js/app.js`, `js/screens/match-end.js`, `js/screens/home.js`, `css/game.css`, `index.html`, `assets/icons/icons.svg`, `PLANEJAMENTO.md`, `supabase/LEIA-ME.md`, `docs/capturas/v0.5.0/*`

---

<!-- MODELO DE SEÇÃO — copiar para cada funcionalidade nova
## Redesign 1/5 — Fundação do design (v0.6.0)

**Status:** ✅ v0.6.0 na `feat/redesign-fundacao`. Só base visual: cores, fonte, escala, breakpoints, barra superior, botões. Lógica, pontuação, banco, textos e layout interno das telas não mudaram. Decisões do redesign: `design/DECISOES.md`.

### Fluxo / Telas
- Todas as telas já na paleta Noite (azul-noite + amarelo marca-texto), com a fonte Atkinson Hyperlegible; layout interno ainda o antigo (etapas 0.6.1 a 0.6.4)
- Barra superior: 64px, fundo `surface`, borda inferior 2px `line`, fixa no topo; logo "Checa" + "Aí" em amarelo (`index.html`: `<b>Aí</b>`); `#app-header-tools` com ícone de telinha (simulador) e de telão (ranking) no novo botão de ícone 44×44

### Arquivos e funções
- `assets/fonts/`: Atkinson Hyperlegible 400 e 700, latin e latin-ext (woff2), `LICENSE-OFL.txt`. Veio de `@fontsource/atkinson-hyperlegible` (npm só no scratchpad, nada no projeto)
- `css/theme.css`: reescrito a partir de `design/tokens.json` (Noite): cores, escala de texto (`--fs-*`/`--lh-*`, em rem; display/título maiores em 700 e 1100), espaço 4/8/12/16/24/32/48/64, raios 6/12/20/pill, `--touch-min` 44, `--control-h` 52, `--control-xl` 64, `--topbar-h` 64, foco 3px/3px
- `css/base.css`: `@font-face` local (`../assets/fonts/`, `font-display: swap`); h1/h2/h3/body pela escala; `tabular-nums` nos placares; anel de foco global; `.btn` (principal), `--secondary`, `--quiet`, `--xl`, desabilitado; `.btn-icon`; `.pill` (+ `--facil/--media/--dificil`, ainda sem uso nas telas); `.card`
- `css/screens.css`: barra superior sticky, logo, título da home em `--fs-display`
- `css/game.css`: bordas de controles em `line-strong` (3,5:1), foco com os tokens; bolinha do veredito sem `box-shadow` (anel interno com `outline` negativo)
- Breakpoints 600/1024 viraram **700/1100** em todos os `@media` (`css/*.css`) e em `SPLIT_QUERY` de `js/screens/simulator.js` (precisa ser igual ao CSS); 1600 do telão mantido
- `js/config.js`: `APP_VERSION` 0.6.0

### Decisões técnicas
- Fonte local (file:// sem internet); sem `@import` do Google Fonts
- Escala fluida da v0.4.2 mantida (`--root-size`, container que cresce): px do design viraram rem
- `--lh-body` e `--lh-body-lg` **sem unidade** (1,5556 / 1,5238): com altura fixa em rem o texto maior que herda (contadores do simulador) ficava com linhas sobrepostas
- `--space-5/6/7` agora são os valores fixos do design (1,5 / 2 / 3 rem); antes eram fluidos (clamp). Diferença pequena; a `--gutter` continua fluida
- `--font-3xl` (alias) é fluido `clamp(3rem, 13vw, 4,5rem)`: "187 de 600" não cabia em 360px com 72px fixos
- Largura total do `.btn` abaixo de 700px; `.app-header__tools .btn` sempre automática
- Pontuação do design ("rapidez até 40") NÃO implementada: vale `scoring.js` (100 + 80 + 20; máx. 200)

### Aliases temporários (remover nas etapas 0.6.1 a 0.6.4, quando nenhuma tela usar o nome antigo)
`--bg`→`--paper` · `--border`→`--line` · `--text`→`--ink` · `--text-muted`→`--ink-muted` · `--accent`→`--primary` · `--on-accent`→`--on-primary` · `--verdict-true/false/misleading/unproven`→`--ok/--bad/--warn/--unk` · `--radius`→`--radius-sm` · `--font-sm/md/lg/xl/2xl/3xl`→`--fs-small/body/body-lg/title-2/title-1/big-number` · `--touch-lg`→`--control-xl` · `--header-height`→`--topbar-h` · `--line-height`. Atenção: `js/screens/simulator.js` lê `--verdict-false`, `--verdict-true`, `--accent`, `--text-muted`, `--bg`, `--surface`, `--text` para o canvas (por isso os aliases ficam até a etapa 0.6.4)

### Problemas visuais encontrados (lista para as etapas 0.6.1 a 0.6.4)
1. ✅ (v0.6.1) Missão: legenda "Seu veredito" encostada na primeira opção (o foco cobre a legenda)
2. ✅ (v0.6.1) Missão e resultado: listas e blocos ainda no layout antigo (sem os componentes do design: pistas como cartões, vereditos em 4 colunas no tablet, pílulas de nível/pontos, faixa SIMULAÇÃO)
3. ✅ (v0.6.1) Barra superior sem os pontos da missão e sem pílula de nível (`.pill` criada, não usada)
4. ✅ (v0.6.1) `tabular-nums` na Atkinson troca os algarismos por uma variante larga com zero cortado: nos números grandes do fim da partida parece fonte monoespaçada; avaliar nas etapas 0.6.2 e 0.6.3
5. ✅ (v0.6.3) Telão: "Sair" pequeno no canto; tokens `stage-*` ainda não usados (usa `--bg`/`--text`); linhas ainda sem o raio e a faixa do design
6. ✅ (v0.6.4) Simulador: "Sair" do modo apresentação pequeno; título "Como um boato se espalha" pequeno diante do design; canvas com borda fina
7. ✅ (v0.6.3) Ranking: sem a linha "Você" em `highlight-soft` e sem pódio amarelo (design)
8. ✅ (v0.6.2) Fim da partida: números de 72px em coluna única no celular, sem as pílulas de acertos/tempo
9. ✅ (v0.6.3) Abaixo de ~200px de largura CSS (celular a 200% de zoom) ainda há rolagem horizontal: ranking (já existia na v0.5.0), seletor do simulador e, novo, 5px na barra do simulador

### Roteiro de teste
1. Abrir `index.html` por `file://` e por `http://127.0.0.1`: fonte Atkinson nos dois (`document.fonts` com 400 e 700 carregadas)
2. Capturas de todas as telas em 360×640, 390×844, 768×1024, 1366×768, 1920×1080, 2400×1200: `docs/capturas/v0.6.0/` (60 imagens) e `contraste.md`
3. Contraste dos tokens (script): todos os pares de texto ≥ 4,5:1; bordas de controle e foco ≥ 3:1 (menor: `line-strong`/`surface` 3,53:1)
4. `grep` em `css/`: zero `gradient`, `box-shadow`, `text-shadow`, hex ou `rgb()` fora do `theme.css`
5. Zoom 50% a 200% em 6 tamanhos × início, apelido, ranking, simulador: sem rolagem horizontal (exceto a limitação 9); alvos ≥ 44px nos botões visíveis
6. Regressão: 9 missões = 200, veredito certo + só iscas = 120, apelido, `drawMatch` 300×, 88.572 × 4.546, classificação do envio, fila (sem duplicar, limite 20, sem dado pessoal), XSS do ranking vira texto, console sem erros

## Redesign 2/5 — Início, Apelido e Missão (v0.6.1)

**Status:** ✅ v0.6.1 na `feat/redesign-telas-1`. Só aparência e estrutura de HTML/CSS das três telas e da publicação simulada. Lógica, pontuação, banco, conteúdo das missões e as outras telas não mudaram.

### Fluxo / Telas
- **Início:** sobretítulo "CiberMissões 2026", título "Checa **Aí**" (display 56/88/104, "Aí" em `highlight`), chamada, 3 botões (Começar investigação grande; Como um boato se espalha e Ranking secundários, com ícone), arte de publicação com carimbo ENGANOSA (tablet em diante à direita; no celular menor, abaixo), pílulas "3 missões / 600 pontos / 4 vereditos" e o aviso de simulação
- **Apelido:** Voltar discreto, título, "Ele aparece no ranking do dia.", campo de 60px (22px bold, borda `line-strong`, erro em `bad`), ajuda "2 a 20 caracteres" com contador n/20; com erro, ícone X + a mensagem que `validateNickname` devolve; botão Continuar grande. Cartão (`surface`, borda `line`, `radius-lg`) a partir de 700px; coluna máx. 37,5rem
- **Missão:** sobretítulo "MISSÃO n DE 3", título, pílula de nível (Fácil ok / Médio warn / Difícil bad), pílula de tempo (mm:ss da partida, atualiza a cada 1 s) e barra de 3 passos. **Pontos acumulados** (pílula com troféu) na barra superior, só das missões já concluídas; sai da barra ao deixar a tela. Corpo: celular 1 coluna; tablet 2 colunas nas ferramentas (pistas | sinais; veredito e botão na largura toda); notebook (≥ 1100) publicação fixa (`sticky`) à esquerda e Pistas, Sinais e Veredito à direita
  - Pistas: botões com ícone (um por vez; clicar de novo fecha), resultado em caixa `info-bg` com o rótulo em sobretítulo. Duas por linha só a partir de 1100px (os rótulos são longos); abaixo, uma por linha
  - Sinais: caixas de seleção **nativas** (`<input type="checkbox">` escondido só visualmente, dentro do `<label>`); marcado = `highlight-soft` com borda `highlight`; linha de 52px
  - Veredito: rádios **nativos** dentro de cartões (ícone redondo na cor do veredito, título, dica); 2 colunas no celular, 4 no tablet, 2 no notebook; selecionado = borda 3px e fundo do veredito
  - "Confirmar veredito" grande, `sticky` no fim da tela; desabilitado até escolher o veredito
- **Publicação simulada:** avatar com iniciais, nome, subtítulo (o "badge" da missão), etiqueta SIMULAÇÃO em `highlight`, texto 20px, mídia (foto com crédito, documento HTML/CSS com logo e assinatura da F3, quadro "Imagem fictícia") com faixa SIMULAÇÃO (topo na foto e no quadro; diagonal no documento). Texto sem mídia: a etiqueta do cabeçalho é a marca

### Arquivos e funções
- `js/screens/home.js`, `nickname.js`, `mission.js`: reescritos (mesmas rotas, mesmo `guard()`/`mount()`; `mission.js` ganhou `unmount()` que para o relógio e tira a pílula de pontos)
- `js/components/post-card.js`: cabeçalho novo (`initials()`), faixa `buildTopBand()`; todos os tipos de mídia mantidos. É usado também pelo simulador (que herda o visual novo)
- `js/utils.js`: `ChecaAi.utils.icon(name, size)` devolve `<svg class="icon"><use href="#icon-…"></svg>`
- `assets/icons/icons.svg` e a cópia inline do `index.html`: 17 ícones novos (search, check, x, wave, question, origin, date, context, sources, clock, exit, share, tree, trophy, arrow, back, repeat), traços do `bundle.js`. Os de "sair", "compartilhar" e "repetir" ainda não são usados
- `css/base.css`: `.icon`, `.kicker`, `.block`; `css/components.css`: publicação; `css/screens.css`: início; `css/game.css`: apelido e missão (as regras antigas de `.tool-btn`, `.toggle`, `.choice`, `.verdict` etc. saíram; `.game-block`, `.game-title`, `.game-primary`, `.result-signals`, `.tips` ficam para as etapas 3 e 4)
- `js/config.js`: `APP_VERSION` 0.6.1

### Decisões técnicas
- **O título da missão não é `mission.title`:** alguns títulos entregam a resposta ("A enchente de hoje (que não era de hoje)", "O comunicado oficial que não existia"). O `h1` é "Investigue a publicação"
- Sem contagens no rodapé da publicação nem @usuário/data: o conteúdo das missões não tem esses campos e não foi inventado (o "badge" faz o papel de subtítulo)
- O ícone de cada pista sai de uma busca no rótulo da ferramenta (`toolIcon`), porque os rótulos são texto livre por missão
- Veredito e sinais usam `role="radiogroup"`/lista com `aria-labelledby` no título em vez de `<fieldset><legend>` (o `legend` era a causa da legenda encostada na primeira opção)
- Foco: o anel de 3px é desenhado no `<label>` via `:has(input:focus-visible)` (o `<input>` fica escondido)
- Botão do formulário de apelido passou a "Continuar" (como no design); antes "Começar"
- Números grandes sem `tabular-nums` (`.stat__value` saiu da regra); só tabelas e contadores pequenos usam
- `.verdicts` e `.clues` com `minmax(0, 1fr)` e uma coluna abaixo de 360px: com `1fr` o texto "suficientes" estourava a tela em celular com zoom

### Aliases do `theme.css`
Removidos (ninguém mais usa): `--header-height`, `--line-height`. Continuam (usados pelas telas de resultado, fim, ranking, telão e simulador; o canvas do simulador lê `--verdict-*`, `--accent`, `--text`, `--text-muted`, `--bg`): `--bg`, `--border`, `--text`, `--text-muted`, `--accent`, `--on-accent`, `--verdict-true/false/misleading/unproven`, `--radius`, `--font-sm/md/lg/xl/2xl/3xl`, `--touch-lg`

### Problemas visuais da v0.6.0
Resolvidos nesta etapa: **1** (legenda "Seu veredito"), **2** (missão: pistas, sinais e veredito no layout do design; o resultado fica para a etapa 3), **3** (pontos e nível/tempo no cabeçalho da missão), **4** (números grandes sem `tabular-nums`). Seguem: 5 (telão), 6 (simulador), 7 (ranking), 8 (fim da partida), 9 (viewports de ~180px)

### Roteiro de teste
1. Capturas em 360×640, 390×844, 768×1024, 1366×768, 1920×1080 e 2400×1200 em `docs/capturas/v0.6.1/`: início; apelido (vazio, válido, erro); missões F3 (documento com logo), M1 (foto) e D2 (sem mídia) recém-abertas (botão desabilitado), com pista aberta, com sinais marcados e com veredito marcado; mais capturas só da janela (botão fixo) e a mensagem do simulador
2. Teclado: Tab percorre pistas, sinais, veredito e o botão; Espaço marca o sinal; setas trocam o veredito; Enter abre/fecha a pista; foco de 3px em todos
3. Alvos ≥ 44px nas 3 telas; sem rolagem horizontal de 50% a 200% de zoom (6 tamanhos × 5 telas/missões, exceto viewport < 200px)
4. Fluxo completo pela interface em 390×844 e 1366×768 (início → apelido → 3 missões → fim com 600); recarregar na missão 2 mantém a partida; pontos da missão 1 aparecem na barra
5. Regressão (9 missões = 200, drawMatch, apelido, 88.572 × 4.546, fila offline, XSS do ranking): passam; console sem erros

## Redesign 3/5 — Início (ajuste), Resultado da missão e Fim da partida (v0.6.2)

**Status:** ✅ v0.6.2 na `feat/redesign-telas-2`. Só aparência e estrutura de DOM/CSS. `scoring.js`, `api.js`, `storage.js`, banco e RPCs não mudaram. Feito pelo `feature-developer`; verificado e fechado pela sessão principal.

### Fluxo / Telas
- **Início:** sobretítulo "Mostra de Informática" e chamada "Investigue publicações, encontre os sinais e dê seu veredito." (como no design); padding vertical do topo alinhado ao design a partir de 700px
- **Resultado da missão:** faixa com ícone, "Missão n de 3", "Acertou!" / "Não foi dessa vez" e "É X" ou "Você marcou X. O certo é Y."; cartões: Gabarito comentado e Sinais (esquerda) | Como se proteger (com a referência do CERT.br), Pontos e botão (direita) no notebook, uma coluna no celular. Cada sinal com ícone + texto ("Você marcou. Certo!", "Faltou marcar", "Era isca. Você marcou.", "Não era sinal. Bem deixado de lado."). Pontos: Veredito, Sinais (n de m), Conclusão e total "n de 200" com barra — só o que o `scoring.js` calcula (100 + 80, isca marcada tira 20, + 20). Pílula de pontos acumulados na barra superior (`unmount()` tira). Botão "Próxima missão" ou "Ver resultado final". A publicação não aparece (o design não a mostra aqui)
- **Fim da partida:** "Partida concluída" + "Fim da partida" + apelido; cartão do placar "n de 600" com barra; cartão amarelo "Você está em Nº" **só** quando o envio devolve `state === 'sent'` com posição real (quando aparece, a frase "Você está em Nº no ranking de hoje." some para não repetir); "Suas missões" (título, nível, Acertou/Errou, pontos), Acertos e Tempo; dicas "Antes de compartilhar"; ações Ver o ranking, Jogar de novo e Ver o simulador. Estados do envio e fila offline como antes
- **Missão (pendências da v0.6.1):** com altura < 700px o "Confirmar veredito" deixa de ser fixo e flui no fim da página; no notebook a coluna das ferramentas ficou mais compacta (paddings/gaps; página da missão em 1366×768: 1520 → 1399px)

### Arquivos e funções
- `js/screens/home.js` (textos); `js/screens/mission-result.js` (reescrito, com `unmount()`); `js/screens/match-end.js` (reescrito; mantidos `recordMatch`, `onChange`, `rankStatusText`, `formatDuration`)
- `css/game.css`: saíram as regras de `game-*`, `result-*`, `verdict-box`, `stat*`, `end-*`, `.tag`; entraram `.result*`, `.end*`, `.mark`, `.bar`, `.review`, `.points`, `.total`, `.scorecard`, `.placecard`, `.mlist`, `.mstats`, `.tips`
- `css/theme.css`: novo `--mid-max` (largura das telas de resultado e fim); `css/base.css`: `.layout-center` removido (órfão); `css/screens.css`: ajustes do início e regra para telas < 300px
- `js/config.js`: `APP_VERSION` 0.6.2

### Diferenças que sobraram do início em relação ao design
- Largura máxima segue o container do projeto (`--content-max`, sem teto de 1280px): decisão 3 do `design/DECISOES.md` (zoom e telão)
- Padding vertical do `app-main` (compartilhado com as outras telas): 2rem no celular (design 1,5rem)
- Escala em rem fluido em vez de px (mesma decisão). Comparação feita por CSS regra a regra e por capturas; o `S.inicio` do design **não** foi renderizado lado a lado (usa Google Fonts e container queries)

### Decisões técnicas
- O título de cada missão aparece no fim da partida (só depois de respondida); no resultado da missão não aparece
- Grades de resultado e fim com `minmax(0, 1fr)`: a coluna implícita `auto` crescia pelo conteúdo e estourava telas estreitas (bug do primeiro teste)
- Abaixo de 300px a pílula de pontos perde o ícone e a marca encolhe (a barra passava da tela em ~240px)
- Números grandes sem `tabular-nums`

### Aliases do `theme.css`
Removidos nesta etapa: `--on-accent`, `--verdict-misleading`, `--verdict-unproven`. **Sobram** (usados por `simulator.css`, `ranking.css`, `components.css` e pelo canvas do simulador, que lê `--verdict-false/true`, `--accent`, `--text-muted`, `--bg`, `--surface`, `--text`): `--bg`, `--border`, `--text`, `--text-muted`, `--accent`, `--verdict-true`, `--verdict-false`, `--radius`, `--font-sm/md/lg/xl/2xl/3xl`, `--touch-lg`. Saem nas etapas 0.6.3 (ranking) e 0.6.4 (simulador)

### Problemas visuais da v0.6.0
Resolvido nesta etapa: **8** (fim da partida). Seguem: 5 (telão), 6 (simulador), 7 (ranking), 9 (viewports < 200px)

### Roteiro de teste
1. Capturas em 360×640, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080 e 2400×1200 em `docs/capturas/v0.6.2/`: início; resultado (acerto e erro) de F3, M1 e D2; fim com posição e offline; missão M1 (janela)
2. Fluxo completo pela interface em 390×844 e 1366×768 até o fim com 600 pontos, console limpo; Tab, Espaço, setas e Enter com foco de 3px; alvos ≥ 44px; zoom 50–200% em 7 telas sem rolagem horizontal (exceto viewport < 200px)
3. `grep`: zero `gradient`, `box-shadow`, `text-shadow` e zero cor fora do `theme.css`
4. Regressão: 162 ok e 2 falhas conhecidas (ranking a 200% de zoom em viewport de ~190px); o teste "veredito errado" agora confere 100 (a expectativa antiga estava errada, o `scoring.js` está certo)

## Redesign 4/5 — Ranking e Telão (v0.6.3)

**Status:** ✅ v0.6.3 na `feat/redesign-telas-3`. Só apresentação. `api.js`, fila offline, `scoring.js`, `storage.js`, banco e RPCs não mudaram. O `feature-developer` refez ranking e telão e parou no limite de uso da conta; a sessão principal terminou (cartão do fim, conferência dos aliases) e verificou tudo.

### Fluxo / Telas
- **Ranking (#/ranking):** logo + "Ranking do dia" (título novo), pílula "Atualizado às hh:mm" com ícone de relógio; lista de 20 em linhas (cartões `surface`, borda `line`): posição em círculo (os 3 primeiros em `highlight`, os demais em `surface-alt`; o número sempre visível), apelido, pontos e, a partir de 700px, acertos ("3 de 3") e tempo; no celular acertos e tempo descem para uma linha abaixo do apelido. Linha do jogador em `highlight-soft` com borda `highlight` e etiqueta "Você". Botões grandes "Atualizar" e "Voltar". Estados carregando, vazio, erro/offline e lista guardada como antes (mensagem + "Tentar de novo")
- **Telão:** `stage`/`stage-ink`/`stage-muted`, título grande, relógio "Atualizado às hh:mm:ss", top 10 em linhas grandes (a linha 1 em amarelo cheio), botão "Sair" com ícone e 64px, sem rolagem em 1366×768, 1920×1080 e 2400×1200 (testado com apelido de 20 letras largas). Em 390×844 as 10 linhas rolam (celular não é o uso do telão)
- **Fim da partida:** o cartão amarelo "Você está em Nº" tem o conteúdo centralizado na vertical (antes ficava com um vazio no meio); continua só com posição real do envio

### Arquivos e funções
- `js/screens/ranking.js` (só DOM: `ranking-pos`, `ranking-name`, `ranking-you`, `ranking-sub`, colunas `ranking-col-x`; mesma lógica de busca, cache, atualização e destaque), `css/ranking.css` (reescrito), `css/components.css`, `css/screens.css` e `css/theme.css` (aliases trocados por tokens), `css/game.css` (`.placecard`)
- `js/config.js`: `APP_VERSION` 0.6.3

### Decisões técnicas
- **Pódio:** o design não define ouro/prata/bronze; os 3 primeiros usam o mesmo `highlight` (como o `is-top` do design) e o número da posição fica visível. Não foi criado token novo
- Sem dados inventados: nada de "N jogadores"; só o que `get_ranking` devolve
- Apelido sempre por `textContent` (testado com `<img onerror>`, `<script>`, `&amp;` e aspas: vira texto, `window.__xss` indefinido)
- Pontuação e tempo em colunas com `tabular-nums` (contadores de tabela); destaques grandes sem

### Aliases do `theme.css`
Todos os usos fora do simulador foram trocados por tokens do design. **Sobram** (só `css/simulator.css` e o canvas de `js/screens/simulator.js` usam): `--bg`, `--border`, `--text`, `--text-muted`, `--accent`, `--verdict-true`, `--verdict-false`, `--radius`, `--font-sm/md/lg/xl/2xl/3xl`, `--touch-lg`. Saem na etapa 0.6.4

### Problemas visuais da v0.6.0
Resolvidos nesta etapa: **5** (telão), **7** (ranking), **9** (rolagem horizontal em viewport de ~190px: o teste de regressão não tem mais falhas). Resta o **6** (simulador, etapa 0.6.4)

### Roteiro de teste
1. Rede do Supabase simulada (nada gravado): lista cheia, vazia, 1 jogador, empate, apelido longo, apelido com caracteres especiais, erro 500, offline (abort), lista guardada e linha do jogador ("Você")
2. Capturas em `docs/capturas/v0.6.3/` (celular, tablet, notebook; telão em 1366×768, 1920×1080 e 2400×1200; fim da partida com posição)
3. `verify.js` 270 ok; `tests.js` 164 ok, 0 falhas (as 2 falhas de rolagem do ranking a ~190px da v0.6.2 foram corrigidas)
4. `grep`: zero `gradient`, `box-shadow`, `text-shadow` e zero cor fora do `theme.css`

## Redesign 5/5 — Simulador e limpeza final do theme.css (v0.6.4)

**Status:** ✅ v0.6.4 na `feat/redesign-telas-4`. Só aparência. `simulator-model.js`, `simulator-rumors.js`, `scoring.js`, `api.js`, banco e RPCs não mudaram. Feito pelo `feature-developer`; verificado e fechado pela sessão principal. **Redesign concluído.**

### Fluxo / Telas
- **Simulador (#/simulador):** sobretítulo "Simulador" acima do título; passos com a publicação simulada (componente da v0.6.1), botões de ação `btn--xl` (64px): Compartilhar, Checar antes, "E se eu tivesse compartilhado?", Próxima rodada / Ver comparação, Nova simulação; contadores em 3 caixas (Rodada, Receberam, Checaram) com os mesmos valores de antes; canvas em quadro de 2px com raio `lg`; legenda; comparação final com barras proporcionais ("Ninguém checou" 88.572 em `bad`, "30% checaram" 4.546 em `ok`)
- **Canvas:** lê só tokens do design — você = `ink`, repassou = `primary`, checou = `ok` com marca de check (não só cor), linhas = `line-strong`, fundo = `surface`; rótulos de 12 a 24px (antes 10 a 20)
- Botões fixos no rodapé do celular só com altura ≥ 700px (abaixo fluem no fim da página); com `prefers-reduced-motion` o simulador não usa `requestAnimationFrame` nem fade e avança a rodada
- **Publicação simulada:** o cabeçalho passou a quebrar linha (`flex-wrap`): a etiqueta SIMULAÇÃO desce para baixo do nome quando não cabe, em vez de partir o @usuário no meio da palavra (corrige o caso "@aurora.urge/nte" no celular)

### Arquivos e funções
- `css/simulator.css` (aliases trocados por tokens; contadores, comparação, botões), `css/theme.css`, `css/components.css` (cabeçalho da publicação), `js/screens/simulator.js` (cores do canvas, kicker, botões, contadores, comparação)
- `css/theme.css`: removido o bloco de aliases; novo `--sim-value-size` (número da comparação no modo apresentação, no lugar de `--font-3xl`)
- `js/config.js`: `APP_VERSION` 0.6.4

### Diferenças restantes em relação ao design (justificadas)
- O projeto mantém o canvas de celulares (o design tem moldura de celular e árvore em SVG)
- Sem segmento "Ninguém checou / 30% checaram" nem contador "Compartilharam": o simulador do projeto não tem modo; o cenário fica em Ajustes
- Sem a frase "N vezes menos gente...": o app não explica
- O `h1` segue "Como um boato se espalha" em todos os passos, com `h2` por passo (estrutura de acessibilidade existente); o design usa "Chegou no seu celular" como título

### Decisões técnicas
- Cores do canvas seguem o design: o "repassou" deixou de ser vermelho e passou a `primary` (amarelo), e quem checou ganha marca de check
- Ajustes: o campo com `min-width: 12rem` estourava a tela em ~190px (36px de rolagem horizontal); agora `min(12rem, 100%)`

### Aliases do `theme.css`
**Removidos todos** os temporários: `--bg`, `--border`, `--text`, `--text-muted`, `--accent`, `--verdict-true/false/misleading/unproven`, `--radius`, `--font-sm/md/lg/xl/2xl/3xl`, `--touch-lg`, `--on-accent`, `--header-height`, `--line-height`. `grep` em `css/`, `js/` e `index.html`: zero usos. O `theme.css` tem só os tokens do design e os de layout do projeto (`--root-size`, `--content-max`, `--panel-max`, `--mid-max`, `--compare-max`, `--sim-*`, `--canvas-*`, `--split-*`, `--exit-*`, `--fade-ms`, `--doc-*`)

### Problemas visuais da v0.6.0
Resolvido nesta etapa: **6** (simulador). **A lista dos 9 problemas está fechada.**

### Revisão final do redesign (inconsistências entre telas)
- Tamanho do `h1`: início usa `display`; apelido, resultado e fim usam `title-1`; missão e simulador usam `title-2` — igual ao design (título de tela × título de missão/simulador), então não foi alterado
- Apelido: o "Voltar" (`btn--quiet`) fica um pouco recuado em relação à margem lateral, por causa do padding do botão (início e ranking não têm esse botão)
- Bloco "Ajustes" do simulador usa borda `line` e raio `md`; os `.block` das outras telas usam raio `lg`
- Cartão do placar do fim da partida ainda tem espaço vazio no meio no notebook (não pedido)
- Telão no celular: as 10 linhas rolam e o número encosta na borda direita (o telão é para projetor)
- Pódio do ranking: os 3 primeiros em `highlight`, sem ouro/prata/bronze (o design não define)

### Roteiro de teste
1. Capturas em `docs/capturas/v0.6.4/` (início, apelido, missões F3/M1/D2, resultado, fim, ranking, telão e simulador em vários passos, em 360×640, 390×844, 768×1024, 1366×768, 1920×1080 e 2400×1200)
2. Simulador: passos A, B, C (árvore e multidão até a rodada 8), D, Nova simulação e modo apresentação (Enter avança, Esc/Sair), sem rolagem horizontal de 190px a 2400px, botões de 64px, console limpo, comparação 88.572 e 4.546, `prefers-reduced-motion`
3. `verify.js` 270 ok; `tests.js` 164 ok, 0 falhas; verificação do simulador 124 ok
4. `grep`: zero `gradient`, `box-shadow`, `text-shadow`, zero cor fora do `theme.css`; contraste conforme `docs/capturas/v0.6.0/contraste.md` (nenhuma falha)

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
| `001_ranking.sql` | Tabela `ranking` (RLS sem policy, sem privilégio para anon/authenticated), índices, `submit_score` e `get_ranking`. Aplicada pela Grasi (teste OK — 80 checagens) |

### Funções RPC
| Função | O quê |
|---|---|
| `submit_score(p_client_id, p_nickname, p_score, p_missions_played, p_correct_verdicts, p_duration_ms)` | Valida e grava uma partida; `{ok, duplicate, position}` ou `{ok:false, error}`; só `anon` |
| `get_ranking(p_limit default 20)` | Top do dia (São Paulo), sem ocultos, 1 a 50; só `anon` |

---

## Constantes e Tema
- **Desde a v0.6.0** o `css/theme.css` segue o `design/tokens.json` (tema Noite) e tem aliases temporários dos nomes antigos: ver a seção "Redesign 1/5" acima. Os valores de cores/breakpoints (600/1024) citados mais abaixo são anteriores a ela
- `js/config.js`: `APP_VERSION` ('0.4.2', único lugar da versão), `MISSIONS_PER_LEVEL_IN_MATCH` (1), `FEATURES` (`simulator` ligado; `missions` e `ranking` desligados), `SIM_FANOUT` 3, `SIM_CHECK_RATE` 0.1, `SIM_VISUAL_ROUNDS` 5, `SIM_TOTAL_ROUNDS` 10, `SIM_ROUND_MS` 1200, `SIM_COMPARE_CHECK_RATE` 0.3
- `css/theme.css` — cores: `--bg #0F1B2D`, `--surface #17263D`, `--border #2A3B55`, `--text #F2F5F9`, `--text-muted #A9B6C8`, `--accent #3DA5FF`, `--on-accent #0F1B2D`; vereditos: `--verdict-true #3FB27F`, `--verdict-false #E5534B`, `--verdict-misleading #E9A23B`, `--verdict-unproven #8A9BB0`
- `css/theme.css` — medidas: fonte `system-ui`, `--font-sm` a `--font-2xl`, `--space-1` a `--space-7`, `--radius` 6px, `--touch-min` 44px, `--content-max` 960px, `--text-max` 60ch, `--touch-lg` 64px, `--canvas-max-height` 58vh
- Layout (v0.3.1, revisto na v0.4.2) — breakpoints (media query não aceita `var()`; repetir os números, documentados no topo do `theme.css`): celular < 600px (1 coluna); tablet 600–1023px (1 coluna larga, 2 em paisagem); notebook ≥ 1024px (container centralizado). Sem breakpoint de 1600px desde a v0.4.2: o container cresce continuamente. Divisão em colunas: `(min-width: 1024px), (min-width: 600px) and (orientation: landscape)`. Faixa validada: 320 a ~3000 px CSS (zoom 50% a 200%)
- Layout — tipografia fluida: `--root-size` = `clamp(16px, 0.2vw + 13px, 24px)` no `html` (v0.4.2; antes `clamp(16px, 0.55vw + 11px, 30px)`, que anulava o zoom). 16 px até ~1500 px CSS, ~16,8 px a 1920, ~17,8 px a 2400, ~19 px a 3000. `--font-lg/xl/2xl/3xl` com `clamp()`; `--font-sm` e `--font-md` fixos. Espaçamentos `--space-5/6/7` fluidos; `--gutter` (margem lateral)
- Layout — medidas: `--header-height`, `--content-max` (`max(75rem, 82vw)` desde a v0.4.2), `--panel-max` (`max(56rem, 46vw)`), `--compare-max` (`max(72rem, 62vw)`), `--sim-center-max` (100%, v0.4.3), `--split-cols` (5fr/7fr), `--split-cols-present` (2fr/3fr), `--canvas-min-height`, `--sim-chrome` (15rem), `--fade-ms` (220ms), `--exit-width` (4.5rem) e `--exit-row` (`calc(var(--touch-min) + var(--space-3))`) do "Sair" no modo apresentação. Header, main e footer: padding lateral `max(var(--gutter), env(safe-area-inset-*))`; viewport com `viewport-fit=cover`
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
| B-01. A página não acompanha o zoom do navegador; em 100% no notebook parece grande demais (v0.4.2) | `--root-size` dependia muito de vw (`0.55vw + 11px`, teto 30px); como o vw CSS = largura física / zoom, o zoom era parcialmente anulado (1920: `rem` físico 19,4 px a 80% e 24,3 px a 125% — razão 1,26 para um zoom de 1,56); container com teto fixo (88rem) deixava margens vazias (2130 de 2400 px CSS a 80%); canvas não reagia à troca de DPR e era dimensionado pelo pai com borda (bitmap 2 px maior) | `--root-size: clamp(16px, 0.2vw + 13px, 24px)`; containers `max(Xrem, N vw)`; breakpoint de 1600px removido; `resizeCanvas()` pelo próprio canvas e `watchDpr()` |
| B-02. No modo apresentação em tela baixa/celular o "Sair" sobrepunha o título/chip (v0.4.2) | "Sair" no fluxo do topo e conteúdo centralizado (`justify-content: center`) transbordando para cima | "Sair" `position: fixed` na área segura, faixa reservada `--exit-row` e `justify-content: safe center`; vale também para o fallback sem Fullscreen API |
| B-03. Simulador: ícone de apresentação fora da barra superior; mensagem inicial estreita no desktop; botões abaixo da dobra no celular (v0.4.3) | Ícone no `.sim-top` (linha do título); `.sim-stage--center` limitado a `--panel-max` (`max(56rem, 46vw)` = 896 px em 1366); cartão da S2 com 581 px no celular por padding/gaps largos e logo sem altura máxima | Ícone em `#app-header-tools`; coluna com `--sim-center-max: 100%`; cartão compacto e `.sim-actions` sticky no celular |

---

## O Que Ainda Não Foi Implementado
Itens do roadmap pendentes (detalhes no `PLANEJAMENTO.md`):
- [x] Fase 1 — Simulador viral + base do site — ✅ Completo (v0.3.0)
- [x] Fase 2 — Jogo das missões (apelido, investigação, veredito, pontuação, resultado) — ✅ Completo (v0.4.0)
- [ ] Foto livre para a mensagem S4 do simulador (fila em rodoviária; hoje mostra o quadro com a descrição)
- [ ] Fase 3 — Revisão das 9 missões pelo grupo — até 17/11
- [x] Fase 4 — Ranking online (Supabase) — ✅ v0.5.0
  - [x] 4A — SQL (migration, rollback, teste, revisão do `security-engineer`) — aplicado pela Grasi
  - [x] 4B — `api.js`, fila offline, telas de ranking e modo telão
  - [ ] Partida real de verificação pela Grasi (roteiro em `supabase/LEIA-ME.md`)
- [ ] Redesign "Noite" em 5 etapas: 0.6.0 fundação ✅ · 0.6.1 início/apelido/missão ✅ · 0.6.2 resultado e fim ✅ · 0.6.3 ranking e telão ✅ · 0.6.4 simulador ✅ (redesign concluído)
- [ ] Fase 5 — Testes em notebook/tablet/celular, service worker, QR Code, tela de dicas — até 24/11
- [ ] v1.0.0 e congelamento — 25/11

---

*Última atualização: 14/11/2026 (v0.5.0 — ranking online: envio com fila offline, tela de ranking e modo telão)*
