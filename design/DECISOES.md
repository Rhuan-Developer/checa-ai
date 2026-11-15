# Decisões do redesign (valem para as etapas 0.6.0 a 0.6.4)

Fonte visual: `design/` (somente leitura). Onde o design e o site divergem, vale o que está aqui.

1. **Pontuação:** o design mostra "rapidez até 40" e pontos de exemplo. Não implementar. Vale `js/scoring.js` (veredito 100 + sinais 80 + conclusão 20; máx. 200; desempate por menor tempo): o banco valida com essas regras.
2. **Fonte:** Atkinson Hyperlegible em `assets/fonts/` (woff2, 400 e 700, latin e latin-ext, licença OFL), `@font-face` local, `font-display: swap`. O site abre por `file://`: nada de Google Fonts em runtime. Fallback: system-ui, -apple-system, "Segoe UI", sans-serif.
3. **Unidades e layout:** px do design viram rem; mantém a escala fluida e o zoom da v0.4.2 (raiz fluida, container que cresce, sem teto de 1280px). Media queries por largura da janela em 700, 1100 e 1600 (telão). Sem container queries.
4. **Apelidos de exemplo** do design (sublinhado/hífen) não valem: o banco só aceita letras, números e espaço.
5. **"37 jogadores"** não existe (o `get_ranking` não devolve o total). Não mostrar.
6. **Simulador:** só a aparência segue o design. A lógica fica (árvore até a rodada 5, multidão até a 8, comparação 88.572 × 4.546, modo apresentação). Ícone de telinha na barra superior à direita.
7. **Funcionalidades existentes permanecem:** fila offline, estados de envio, ranking com acertos e tempo, telão com atualização automática, fallback de tela cheia.
8. **Variáveis** vêm de `design/tokens.json` (tema único "Noite"); o `tokens.css` do sistema original (tema claro) é ignorado.

Decisões da etapa 0.6.0 tomadas sem consulta: ver "Decisões técnicas" da seção v0.6.0 do `IMPLEMENTADO.md`.

Pódio do ranking (v0.6.3): o design não define ouro/prata/bronze; os 3 primeiros usam `highlight` e o número da posição fica sempre visível.
