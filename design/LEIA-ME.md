# design/ — referência visual do Checa Aí (somente leitura)

Cópia do sistema de design do claude.ai (https://claude.ai/artifact/3Sa5GfoR2dgwrRduFtFGQ8), feita em 14/11/2026. É REFERÊNCIA: não é carregada pelo site e não substitui o código em css/ e js/. As regras e decisões estão em DESIGN.md (no Projeto) e na seção de design do PLANEJAMENTO.md.

Arquivos:
- tokens.json: FONTE DA VERDADE das cores, tipografia, espaços, raios e tamanhos (tema único "Noite").
- README.md: livro da marca (princípios, voz, cores, layout, fluxo).
- components/bundle.css: estilos de cada peça e tela (classes ca-*). Referência exata de tamanhos, espaços e estados.
- components/bundle.js: HTML de cada peça e tela (window.ChecaAi.parts / screens), com dados de exemplo. Referência de estrutura e ícones SVG.

Atenção (o que NÃO copiar do bundle):
1. O tokens.css do sistema original estava desatualizado (tema claro). Ignore-o; gere as variáveis a partir do tokens.json (Noite).
2. bundle.css começa com @import do Google Fonts. O site não pode depender de internet: a fonte Atkinson Hyperlegible vai em assets/fonts/ com @font-face local.
3. O bundle usa container queries e px. O site usa media queries por largura da janela e rem, com a escala fluida e o container que cresce (v0.4.2).
4. Os dados são exemplos (apelidos com sublinhado, "37 jogadores", "rapidez +30", simulador até a rodada 4). Não valem para o site: ver "Conflitos resolvidos" em DESIGN.md.
