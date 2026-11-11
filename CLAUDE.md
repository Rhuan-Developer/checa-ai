# Checa Aí — Instruções para o Claude

Site interativo da Estação 5 ("Verdadeiro ou manipulado?", boatos e desinformação) da mostra CiberMissões 2026 do IFNMG Campus Arinos: o visitante investiga publicações fictícias, dá o veredito, ganha pontos e entra no ranking; um simulador mostra como um boato se espalha. Apresentação em 27/11/2026, congelamento em 25/11. Contexto completo em `PLANEJAMENTO.md`; o que já existe em `IMPLEMENTADO.md`; conteúdo das missões em `MISSOES.md`.

## Antes de qualquer tarefa
- Ler a seção ligada à tarefa no `PLANEJAMENTO.md` e no `IMPLEMENTADO.md` (com Grep; nunca ler inteiros) e o `AGENTS.md`
- Mapear quem usa o que vai mudar antes de editar
- Tarefa com vários arquivos: mostrar o plano antes

## Stack
- HTML + CSS + JavaScript puro, sem framework, sem build, sem dependências npm
- Scripts clássicos (sem `type="module"`), carregados em ordem no fim do `index.html`; cada arquivo pendura suas funções em `window.ChecaAi` (nenhuma variável global solta). O `index.html` precisa abrir direto pelo `file://`
- Supabase só para o ranking, via `fetch` na API REST (nada de supabase-js nem CDN)
- Service worker para abrir sem internet no tablet/celular (Fase 5)
- Hospedagem: GitHub Pages a partir da `main`

## Estrutura
- `index.html` — app de uma página; cada tela é uma `<section>` trocada pelo `js/app.js`
- `css/` — `theme.css` (único lugar com cores e medidas), `base.css`, `screens.css`
- `js/` — `config.js`, `utils.js`, `missions-data.js`, `scoring.js`, `storage.js`, `api.js`, `screens/*.js`, `app.js` (por último)
- `assets/` — `images/` (imagens fictícias das missões), `icons/` (um único pacote de ícones SVG)
- `supabase/` — `migrations/`, `rollbacks/`, `tests/`
- `cartilhas/` — fascículos do CERT.br (fonte do conteúdo); `MISSOES.md` — conteúdo das missões

## Regras gerais
- `'use strict'` em todo arquivo JS; JSDoc nos tipos principais (missão, partida, resultado). Sem `var`
- Nomes no código em inglês; textos para o usuário em português
- Funções e variáveis em camelCase; constantes em UPPER_SNAKE_CASE
- Lógica fora das telas: `screens/*.js` só monta a tela e chama `scoring.js`, `storage.js`, `api.js`, `utils.js`
- Funções de regra (pontuação, sorteio, modelo do simulador) são puras e testáveis no console
- Erro sempre tratado: nunca `catch` vazio; a mensagem diz o que houve e, se der, o que resolve
- Datas: fuso `America/Sao_Paulo`, só pelo utilitário de datas do `utils.js`. Nunca `toISOString()` para montar a data do dia nem `new Date('AAAA-MM-DD')`. No banco, "hoje" é `(now() at time zone 'America/Sao_Paulo')::date`, nunca `current_date`
- Segredos nunca no código nem em log. A chave `anon` do Supabase é pública e fica no `config.js`; a `service_role` nunca entra no projeto
- Nenhum dado pessoal: o visitante informa só um apelido
- Responsivo: notebook, tablet e celular funcionam igualmente bem (mouse e toque, retrato e paisagem). Alvos de toque com pelo menos 44 px. Testar nos três tamanhos antes de entregar
- Acessível: `<button>` para ações, rótulos nos campos, foco visível, contraste AA

## Conteúdo das missões
- Fonte da verdade: `MISSOES.md`. Mudou uma missão = muda `MISSOES.md` e `js/missions-data.js` juntos
- Tudo fictício e marcado "Simulação"; nada de pessoas ou empresas reais; instituição real só com autorização do professor: IFNMG Campus Arinos, na F3, sempre com nome e assinatura inventados e selo SIMULAÇÃO
- Tema da estação: origem, data e contexto. Sem golpes/phishing (Estação 1) e sem IA/deepfake (outra turma)
- Toda missão tem: nível, publicação, ferramentas com pistas, sinais (verdadeiros e iscas), veredito, gabarito comentado, "Como se proteger" e referência ao fascículo do CERT.br
- Partida = sorteio de 1 fácil + 1 média + 1 difícil, nessa ordem; o sorteio tem que funcionar com qualquer quantidade por nível

## Mudanças com cuidado
- Antes de editar, mapear quem usa o que vai mudar (MCP `codebase-memory` ou busca)
- Correção cirúrgica: menor diff que resolve. Não renomear, não reorganizar, não "aproveitar para melhorar"
- Nunca remover função ou propriedade de `window.ChecaAi` só porque parece sem uso
- Problema fora do escopo: citar em uma linha no fim, não corrigir junto

## Banco de dados (Supabase)
- Um projeto só (produção); não há projeto de dev. Por isso todo teste roda no padrão abaixo, que não grava nada
- RLS ligado em TODAS as tabelas. A tabela `ranking` não tem policy: o site só usa as RPCs `submit_score` e `get_ranking`
- Funções `security definer`: `search_path` fixo, validação de todos os parâmetros dentro da função, `revoke`/`grant` explícitos (`execute` só para `anon`)
- Schema só por migration versionada em `supabase/migrations/NNN_nome.sql`. Nunca editar migration existente: mudança = migration nova
- Toda migration tem rollback em `supabase/rollbacks/NNN_rollback.sql` (só se precisar desfazer)
- Toda migration que mexe em regra ou acesso tem teste em `supabase/tests/<assunto>.sql`, feito para rodar em produção:
  - um único bloco `do $$ ... $$` que confere cada regra e termina SEMPRE em erro, desfazendo tudo
  - a mensagem final é o resultado: "OK — N checagens conferem. Nada foi gravado."
  - sem DDL, `lock_timeout` curto, só linhas de teste
  - sempre provar que o `anon` não lê nem grava a tabela direto e que a RPC recusa pontuação acima do máximo
- Regra que existe no site e no banco (validação de apelido, pontuação máxima): mudou um, muda o outro
- O Claude NUNCA aplica nada no banco. Entrega a ordem de aplicação (migration → teste → site) e a Grasi aplica
- Qualquer mudança em RLS, RPC ou acesso passa pelo `security-engineer` antes de aplicar
- Consultas de diagnóstico para a Grasi rodar: sempre somente leitura

## Textos da UI — o app não explica
- Nada de parágrafo explicativo em tela (exceção: gabarito comentado e "Como se proteger", que são o conteúdo da missão — máximo 3 linhas)
- No máximo uma linha curta de instrução, e só quando necessária
- Confirmações: uma frase
- Não repetir o que a tela já diz
- Erros dizem o que houve e, se couber, o que resolve
- Termos técnicos nunca aparecem para o visitante

## Visual — parece feito à mão, não por IA
- Sem degradê: cores lisas, todas do `theme.css`
- Sem efeitos chamativos: brilho, sombra exagerada, animação que só enfeita (a animação do simulador é conteúdo, não enfeite)
- Sem emoji decorativo na interface (exceção: emojis dentro das publicações fictícias, que imitam mensagens reais). Ícones de um único pacote
- Na dúvida, o mais simples: fundo liso, borda fina ou nenhuma, um peso de fonte a mais para destacar

## Registro de implementações — OBRIGATÓRIO
Toda funcionalidade implementada, corrigida ou alterada atualiza o `IMPLEMENTADO.md` antes de encerrar o trabalho: telas e fluxos, funções/arquivos, bugs (causa + fix), mudanças de banco, decisões técnicas. Não atualizar = trabalho incompleto. O `PLANEJAMENTO.md` muda quando o plano muda.

## Versionamento — a cada commit relevante
- MAJOR.MINOR.PATCH. PATCH = correção; MINOR = funcionalidade nova; MAJOR = quebra (1.0.0 = versão da mostra)
- A versão fica em um lugar só: `APP_VERSION` no `js/config.js` (aparece discreta no rodapé). A tag git é igual a ela
- Commit: `feat|fix|chore|docs: descrição — vX.Y.Z`. Tag anotada: `git tag -a vX.Y.Z -m "Versão X.Y.Z — resumo"`. Push da branch e da tag
- `main` = o que está publicado no GitHub Pages. Trabalho arriscado ou em partes vai em `feat/<nome>` ou `fix/<nome>`; merge na `main` só com a parte testada
- A partir de 25/11 (congelamento): só `fix`, direto da `main`

## Prioridade atual
Ver "O Que Ainda Não Foi Implementado" no `IMPLEMENTADO.md`.

## Contexto do código — MCP codebase-memory (vale para toda sessão e todo agente)
O projeto está indexado no MCP codebase-memory. Para economizar tokens:
- Antes de explorar o código: `get_architecture` (visão geral), `search_graph` (achar símbolo), `get_code_snippet` (ler só a função), `trace_path` (quem chama/é chamado), `detect_changes` (impacto da mudança)
- Abrir arquivo inteiro só para editar
- `IMPLEMENTADO.md`, `PLANEJAMENTO.md` e `MISSOES.md` são grandes: Grep na seção, nunca ler inteiros
- Se o MCP não responder, seguir com Grep/Glob
- Depois de mudanças grandes, reindexar

## Supabase MCP
Somente leitura. Usar para consultar schema e conferir migrations; nunca para escrever.

## Agentes
Agentes em `.claude/agents/`: `feature-developer` (sonnet), `bug-fixer` (sonnet), `security-engineer` (opus). Equipe de agentes desligada: cada agente roda sozinho como subagent.
- Tela ou funcionalidade nova → `feature-developer`
- Algo quebrado ou estranho → `bug-fixer`
- Migration, RLS, RPC, chave do Supabase ou qualquer coisa de acesso → revisão do `security-engineer` antes de entregar
- Só a sessão principal chama agentes; cada agente faz só a tarefa passada e termina
- Só a sessão principal edita `IMPLEMENTADO.md`, `PLANEJAMENTO.md`, `CLAUDE.md`, `AGENTS.md`, `MISSOES.md` e `js/config.js`, e faz commit/tag/push, usando os resumos dos agentes

## Trabalho interrompido
Se for parar no meio, criar `HANDOFF.md` (branch, feito, falta, hipóteses, próximos passos). Primeira linha: "ARQUIVO TEMPORÁRIO: apagar no commit que fechar a versão X.Y.Z".
