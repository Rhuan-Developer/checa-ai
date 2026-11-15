# Checa Aí

Jogo educativo sobre boatos e desinformação para a mostra escolar de Informática. O visitante investiga publicações fictícias, marca sinais suspeitos, dá um veredito e disputa o ranking do dia. Nome provisório.

## Princípios

- **O app não explica.** Nada de telas de instrução. Cada tela tem um título curto, uma ação principal e o resto é interface.
- **Tudo é simulação.** Toda publicação, perfil, documento e mensagem é fictício e leva a etiqueta ou faixa `SIMULAÇÃO` (fundo `highlight`, texto `on-highlight`). Sem logos, marcas, pessoas ou órgãos reais; cidades e portais inventados levam "(fictício)".
- **Cor lisa, sem degradê, sem emoji decorativo.** Formas planas com borda de 2px. Nenhuma sombra.
- **Legível de longe.** Texto corrido nunca abaixo de 18px; ajuda e legendas no mínimo 15px; tudo em contraste AA.

## Voz e textos

Frases curtas, verbo na frente, português do dia a dia. Botões dizem o que acontece: "Começar investigação", "Confirmar veredito", "Próxima missão", "Jogar de novo".

| Use | Evite |
| --- | --- |
| Acertou! | Parabéns, você acertou o veredito desta missão! |
| Use pelo menos 2 caracteres | Apelido inválido |
| Você está em 4º | Sua posição atual no ranking é 4 |

## Cores

Tema único **Noite**, nascido do telão: tudo sobre azul-noite, com o amarelo marca-texto como única cor de destaque.

- `paper` (azul-noite) é o fundo; `surface` e `surface-alt` para cartões, campos e linhas; `ink` (quase branco) para texto.
- `highlight` / `primary` (amarelo marca-texto) é a cor da marca: o "Aí" do logo, a ação principal, a faixa SIMULAÇÃO, o pódio, "Você está em Nº". Texto sobre ele sempre `on-highlight` / `on-primary` (azul-noite, 11:1).
- `highlight-soft` com borda `highlight` marca o que é seu: sua linha no ranking, sinais marcados.
- Vereditos em tons claros para brilhar no escuro: **Verdadeira** `ok` + check, **Falsa** `bad` + X, **Enganosa** `warn` + onda, **Sem provas suficientes** `unk` + interrogação. Ícone sempre em `on-primary`. A cor nunca vem sozinha: sempre ícone e texto.
- `stage` / `stage-ink` / `stage-muted` / `stage-line` são os valores originais do telão.

## Tipografia

Atkinson Hyperlegible (Google Fonts, 400 e 700), feita para leitura fácil: diferencia I, l e 1, O e 0. Números de placar usam `font-variant-numeric: tabular-nums`.

## Layout e tamanhos

O app responde à **largura do próprio app** (container queries em `.ca-app`):

| Faixa | Largura do app | Layout |
| --- | --- | --- |
| Celular | até 699px | uma coluna, botões em largura total |
| Tablet | 700 a 1099px | blocos lado a lado, vereditos em 4 colunas |
| Notebook | 1100px ou mais | duas colunas: publicação fixa à esquerda, ferramentas à direita |
| Telão | 1920 × 1080 | tela própria (`stage`), linhas de 46px |

Barra superior de `topbar-h` (64px) com "Checa Aí" à esquerda e, à direita, só o necessário: pontos na missão, ícone de telinha no simulador, "Telão" no ranking. Alvo mínimo de toque `touch-min` (44px); botões `control-h` (52px); ação principal da tela 64px.

## Fluxo

1. **Início** → Começar investigação · Como um boato se espalha · Ranking
2. **Apelido** (2 a 20 caracteres)
3. **Missão** ×3 (fácil, média, difícil): publicação, pistas (origem, data, contexto, outras fontes), sinais suspeitos, veredito, confirmar
4. **Resultado da missão**: veredito certo/errado, sinais, pontos (máx. 200 = veredito 100 + sinais até 60 + rapidez até 40)
5. **Fim da partida**: pontos (máx. 600), acertos, "Você está em Nº", Ver o ranking / Jogar de novo
6. **Ranking do dia**: posição, apelido, pontos, acertos, tempo; sua linha em `highlight-soft` com borda `highlight` e a etiqueta "Você"
7. **Telão**: top 10, relógio de atualização, Sair
8. **Simulador**: mensagem no celular → Compartilhar / Checar antes → árvore por rodadas (1 → 3 → 9…), contadores, comparação "Ninguém checou" × "30% checaram"; ícone de telinha abre o modo apresentação com Sair

As telas no grupo **Telas** são interativas: troque estado e dispositivo na barra acima de cada uma.

## Para quem vai programar

Carregue `tokens.css`, `components/bundle.css` e `components/bundle.js`. Envolva o app em `<div class="ca-app">`. `window.ChecaAi.parts` gera cada peça em HTML e `ChecaAi.wire(el)` liga os cliques (veredito, sinais, pistas, apelido). As classes começam com `ca-`.

## Não fazer

- Degradês, sombras, emoji, ilustração com rosto.
- Cor como único sinal de certo/errado.
- Botão abaixo de 44px ou texto abaixo de 15px.
- Publicação sem a marca SIMULAÇÃO.
