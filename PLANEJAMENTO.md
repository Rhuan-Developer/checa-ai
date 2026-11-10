# Checa Aí — Planejamento Completo do Projeto

> Nome provisório. Trocar o nome = atualizar este arquivo, o `CLAUDE.md`, o `README.md` e o título do site.

---

## 1. Visão Geral

Recurso digital da **Estação 5 — Verdadeiro ou manipulado?** (Grupo 5, 1º INFO 1, tema: boatos e desinformação) da Mostra de Cibersegurança **CiberMissões 2026 — Você sabe se proteger?**, IFNMG Campus Arinos, disciplina de Sistemas Operacionais.

O visitante vira investigador digital: recebe uma publicação fictícia, usa ferramentas de investigação para achar pistas, marca o que é suspeito e dá o veredito. Ganha pontos pela qualidade da investigação, não só por acertar, e entra no ranking do dia. A missão da estação, segundo o guia do professor: **estimular a verificação de origem, data e contexto antes de compartilhar informações.**

**Slogan:** Antes de compartilhar, checa aí.
**Data da apresentação:** 27/11/2026. **Tudo pronto e congelado até 25/11**; 26/11 é o ensaio no estande.
**Plataforma inicial:** site no navegador que funciona **igualmente bem em notebook, tablet e celular** (mouse e toque; retrato e paisagem). Não se sabe se haverá tablets na mostra, então nenhum dispositivo é prioridade.
**Expansão futura:** duelo entre dois visitantes, certificado, painel de missões.
**Acesso:** sem login. O visitante digita só um apelido. Ranking público (apelido + pontos).

### Requisitos do professor (Guia CiberMissões 2026)
O site precisa atender a estes pontos; a banca vai olhar para eles.
| Requisito do guia | Como o Checa Aí atende |
|---|---|
| 3 desafios autorais, com níveis de dificuldade variados | 6 missões (2 fáceis, 2 médias, 2 difíceis); cada partida sorteia 1 de cada nível, em ordem fácil → médio → difícil. Expansão para 9 e 12 se der tempo |
| Situação-problema | A publicação fictícia de cada missão |
| Alternativas de resposta | Sinais suspeitos para marcar + 4 vereditos |
| Gabarito comentado | Tela de resultado: resposta certa + explicação de cada sinal |
| Orientações de segurança | Bloco "Como se proteger" em cada resultado + tela final de dicas |
| Fundamentado nas cartilhas | Cada missão cita o fascículo da Cartilha de Segurança para Internet do CERT.br (Boatos; Internet Segura; complemento Redes Sociais) |
| Conferir funcionamento nos tablets | Layout responsivo para notebook, tablet e celular; teste em cada um antes do dia 25 |
| Estudantes como mediadores | Partida curta (3 a 5 min) e tela de resultado que o mediador usa para explicar |
| Pequeno material explicativo | Fora do site (cartaz/folheto do grupo); o site tem a tela de dicas e o QR Code |

Cuidados de conteúdo: só situações fictícias marcadas como "Simulação"; nada de pessoas, empresas ou instituições reais acusadas; não invadir temas de outras estações (golpes e phishing = Estação 1; IA e deepfake = Grupo 5 da 1º INFO 2).
Critérios de avaliação e data oficial ainda não foram divulgados pelo professor: revisar este plano quando saírem.

---

## 2. Stack Tecnológica

| Tecnologia | Motivo |
|---|---|
| HTML + CSS + JavaScript puro | O grupo entende e explica para a banca; sem build, sem dependências |
| Scripts clássicos (sem `type="module"`) | No notebook, o `index.html` abre direto do pendrive (`file://`) se a internet ou o GitHub Pages falharem |
| Service worker (site instalável) | No tablet e no celular: depois de aberto uma vez com internet, o site continua abrindo sem internet |
| Supabase (Postgres + RLS) | Ranking online compartilhado entre notebook e celulares |
| `fetch` direto na API REST do Supabase | Nada de biblioteca por CDN: o jogo não depende de nada externo para abrir |
| GitHub Pages | Hospedagem grátis, publica a partir da `main` |

### Por que JavaScript puro e não React?
- O site tem poucas telas; React traria build e conceitos novos sem ganho proporcional, com 17 dias de prazo.
- Todo o grupo consegue ler e explicar o código na apresentação.

### Por que Supabase e não Firebase?
- Escolha da Grasi. RLS + função no banco permitem limitar o que qualquer um grava no ranking.

---

## 3. Arquitetura de Segurança

1. RLS ligado na tabela `ranking`, **sem nenhuma policy**: o site não lê nem grava a tabela direto.
2. Gravação só pela função `submit_score` (`security definer`), que valida apelido (2 a 20 caracteres, só letras, números e espaço) e limita a pontuação ao máximo possível da partida. Ninguém grava 999999 pelo console.
3. Leitura só pela função `get_ranking`, que devolve apelido, pontos e posição (nunca o `client_id`).
4. A chave `anon` do Supabase fica no `js/config.js` e vai para o git: ela é pública por design; quem protege é o RLS. A chave `service_role` **nunca** entra no projeto.
5. Validação dupla: no site para a experiência (mensagem de apelido inválido), no banco para segurança real.
6. Nenhum dado pessoal: só apelido. Sem e-mail, sem nome completo, sem foto.
7. Gabarito das missões fica no navegador. É aceitável para uma mostra: o teto de pontuação no banco limita o estrago de quem olhar o código.

---

## 4. Schema do Banco de Dados

### Fase 4 — Ranking
```sql
create table public.ranking (
  id                bigint generated always as identity primary key,
  client_id         uuid not null unique,          -- gerado no navegador por partida; evita duplicar envio da fila offline
  nickname          text not null check (char_length(nickname) between 2 and 20),
  score             integer not null check (score >= 0),
  missions_played   smallint not null check (missions_played between 1 and 6)  -- 3 por partida; folga para o futuro,
  correct_verdicts  smallint not null check (correct_verdicts between 0 and missions_played),
  duration_seconds  integer not null check (duration_seconds between 10 and 3600), -- desempate
  played_on         date not null default (now() at time zone 'America/Sao_Paulo')::date,
  created_at        timestamptz not null default now(),
  check (score <= missions_played * 200)
);
alter table public.ranking enable row level security;   -- sem policies
```
- `submit_score(p_client_id, p_nickname, p_score, p_missions_played, p_correct_verdicts, p_duration_seconds)` → valida, `insert ... on conflict (client_id) do nothing`, devolve a posição do dia. `grant execute` só para `anon`.
- `get_ranking(p_limit int default 10)` → top do dia (`played_on` = hoje em `America/Sao_Paulo`), ordenado por pontos desc, duração asc.
- Apagar apelido ofensivo: a Grasi apaga pelo painel do Supabase (sem tela de admin no MVP).

---

## 5. Estrutura de Pastas do Projeto
> ✅ = já existe · as demais entradas são planejadas (fase indicada no comentário)
```
checa-ai/
├── index.html                 # app de uma página só; telas são <section> trocadas pelo app.js (F1)
├── css/
│   ├── theme.css              # cores, fontes, espaçamentos — único lugar com cor (F1)
│   ├── base.css               # reset, tipografia, botões, cartões (F1)
│   └── screens.css            # estilos de cada tela (F1)
├── js/
│   ├── config.js              # URL e chave anon do Supabase, nº de missões por partida (F1/F2/F4)
│   ├── utils.js               # datas (fuso America/Sao_Paulo), validação de apelido (F1/F2)
│   ├── missions-data.js       # as missões (conteúdo + gabarito) (F1)
│   ├── scoring.js             # cálculo de pontos (F2)
│   ├── storage.js             # partida atual + fila offline no localStorage (F2/F4)
│   ├── api.js                 # chamadas REST ao Supabase: submit_score, get_ranking (F4)
│   ├── screens/
│   │   ├── home.js            # início (F1) + apelido (F2)
│   │   ├── mission.js         # investigação e veredito (F2)
│   │   ├── result.js          # resultado da missão e da partida (F2)
│   │   ├── ranking.js         # ranking + modo telão (F4)
│   │   └── simulator.js       # simulador viral (F1)
│   └── app.js                 # navegação entre telas, carregado por último (F1)
├── assets/
│   ├── images/                # imagens das missões (prints fictícios) (F3)
│   └── icons/                 # um único pacote de ícones (SVG) (F1)
├── cartilhas/                 # fascículos do CERT.br + baixar-cartilhas.bat (✅)
├── MISSOES.md                 # conteúdo das missões para revisão do grupo (F1)
├── supabase/
│   ├── migrations/            # 001_ranking.sql (F4)
│   ├── rollbacks/
│   └── tests/
├── CLAUDE.md · AGENTS.md · PLANEJAMENTO.md · IMPLEMENTADO.md · README.md
└── .claude/                   # agentes e settings
```
Scripts carregados em ordem no fim do `index.html`; cada arquivo pendura suas funções em um objeto global `window.ChecaAi` (sem variáveis globais soltas).

---

## 6. Telas e Fluxos (MVP)

### Início
- Nome, slogan, botões: **Começar investigação**, **Ranking**, **Simulador**.
- Ao começar: campo de apelido → partida com **3 missões sorteadas: 1 fácil, 1 média e 1 difícil**, nessa ordem (visita de 3 a 5 minutos; fila anda no estande).

### Missão (investigação)
- Publicação fictícia no estilo de mensagem de grupo / post, com selo "Simulação".
- **Ferramentas de investigação** (cada uma revela uma pista ao tocar): Ver fonte · Ver data · Comparar com outros sites · Analisar imagem (só as que a missão tiver).
- **"O que é suspeito aqui?"**: lista de sinais para marcar (alguns verdadeiros, outros iscas).
- **Veredito**: Verdadeira · Falsa · Enganosa / fora de contexto · Sem provas suficientes.

### Resultado da missão
- Acertou ou não, gabarito comentado, sinais certos e errados, **Como se proteger** (orientação de segurança), pontos da missão e o fascículo da Cartilha do CERT.br. Botão **Próxima missão**.

### Fim da partida
- Pontos totais, acertos, tempo, posição no ranking do dia. Se sem internet: "Pontuação salva. Vai pro ranking quando a internet voltar."
- Em seguida, "Antes de compartilhar": 4 a 5 dicas curtas da Cartilha do CERT.br (origem, data, contexto, canal oficial, não repassar na dúvida).

### Ranking
- Top 10 do dia. **Modo telão** (tela cheia, atualiza a cada 15 s) para deixar num monitor/notebook virado para o corredor.

### Simulador viral — "Como um boato se espalha"
- **Começa no celular do visitante:** chega um boato sorteado entre as missões que não são verdadeiras (cada vez um diferente). O visitante escolhe **Compartilhar** ou **Checar antes**.
  - Checar antes → "Você parou o boato aqui. 0 pessoas enganadas." + o gabarito curto da missão. Botão "E se eu tivesse compartilhado?".
  - Compartilhar → começa a animação.
- **Animação em árvore** (`<canvas>`): o primeiro celular manda para 3, cada um manda para mais 3 (1 → 3 → 9 → 27 → 81), rodada por rodada, com os celulares abrindo em círculo a partir do centro. Contador de pessoas alcançadas e de rodadas. Depois da 5ª rodada a árvore para de desenhar e só o contador continua ("na 10ª rodada: 29.524 pessoas").
- **Sempre diferente:** em cada rodada, algumas pessoas checam antes e não repassam (celular verde com ✓; aquele ramo para). Quem checa é sorteado, então cada simulação dá um resultado diferente.
- **Ajustes** (painel recolhível, para o mediador): repasses por pessoa (2 a 5, padrão 3) e % que checa antes (0 a 80, padrão 10).
- **Modo apresentação:** tela cheia, botões grandes e avanço de uma rodada por toque/clique, para o grupo explicar cada rodada no ritmo da fala. No modo normal as rodadas avançam sozinhas.
- **Comparação:** ao final, "Ninguém checou: X pessoas × 30% checaram: Y pessoas" — a mensagem central da estação.
- Ligação com a cartilha: "Ajude a combater os boatos — na dúvida, não compartilhe."

---

## 7. Roadmap de Desenvolvimento

Calendário (hoje: 10/11). Cada fase termina testada e com versão publicada no GitHub Pages.

| Fase | Datas | Versão |
|---|---|---|
| 0 — Setup | 10 a 11/11 | v0.1.x |
| 1 — Simulador viral (pronto para o grupo treinar a apresentação) | 12 a 14/11 | v0.2.0 (base) + v0.3.0 (simulador) |
| 2 — Núcleo do jogo (sem banco) | 15 a 19/11 | v0.4.0 |
| 3 — Conteúdo: 6 missões (escritas pelo Claude, revisadas pelo grupo) | revisão até 17/11 | v0.5.0 |
| 4 — Ranking online | 20 a 22/11 | v0.6.0 |
| 5 — Polimento e testes | 23 a 24/11 | v0.9.x |
| Congelamento | 25/11 — só correção de bug | v1.0.0 |
| Ensaio no estande | 26/11 | — |
| **Mostra** | **27/11** | — |

### Fase 1 — Simulador viral — ✅ Completo (v0.3.0)
**Objetivo:** simulador pronto primeiro, para o grupo treinar a apresentação em cima dele. Já entra com a base do site (tema, layout, tela de início e navegação).
- [x] 0. Setup (estrutura, docs, kit do Claude, git) — feito pelo setup
- [x] 1. Tema (`theme.css`), layout base responsivo, tela de início e navegação (`app.js`) — v0.2.0
- [x] 2. `missions-data.js` com as 6 missões do `MISSOES.md` (o simulador usa as mensagens delas) — v0.2.0
- [x] 3. Modelo por rodadas (função pura, testável): repasses por pessoa, % que checa, sorteio
- [x] 4. Tela do simulador: escolha Compartilhar/Checar, árvore animada no `<canvas>`, contador, ajustes, modo apresentação e comparação
- [x] 5. Publicado no GitHub Pages e testado no notebook, no tablet e no celular (tela cheia em tablet real ainda por testar)

### Fase 2 — Núcleo do jogo (sem banco)
**Objetivo:** uma partida completa funcionando offline, com 2 missões de exemplo.
#### Regras de negócio
- Partida = sorteio de 1 missão fácil + 1 média + 1 difícil, nessa ordem. O sorteio funciona com qualquer quantidade por nível (6 → 9 → 12 missões sem mudar código).
- Pontuação por missão (máx. 200):
  - Veredito correto: 100
  - Sinais suspeitos: 80 divididos igualmente entre os sinais verdadeiros da missão; cada isca marcada tira 20 (essa parte nunca fica negativa)
  - Concluir a missão: 20
- Desempate no ranking: menor tempo total.
- Apelido: 2 a 20 caracteres, letras (com acento), números e espaço; lista básica de palavras bloqueadas no site.
- Toda publicação mostra o selo "Simulação". Nenhuma missão acusa pessoa ou empresa real.
#### Checklist (ordem de implementação)
- [ ] 1. Apelido + início da partida + `storage.js` (partida atual)
- [ ] 2. Tela de missão: publicação, ferramentas, sinais, veredito (com as 6 missões de `MISSOES.md`)
- [ ] 3. `scoring.js` + resultado da missão + fim da partida
- [ ] 4. Teste: partida inteira no notebook e no celular, abrindo também pelo `file://`

### Fase 3 — Conteúdo: 6 missões
**Objetivo:** as 6 missões de `MISSOES.md` (escritas pelo Claude a partir dos fascículos Boatos e Redes Sociais do CERT.br) revisadas pelo grupo até 17/11. Mudança pedida pelo grupo = editar `MISSOES.md` e o `missions-data.js` juntos.
- Cada missão: situação-problema (texto e imagem fictícia), ferramentas com pistas, sinais (verdadeiros e iscas), veredito, gabarito comentado de até 3 linhas, orientação de segurança ("Como se proteger") e referência ao fascículo da Cartilha do CERT.br.
- Ficar no tema da estação: origem, data e contexto. Sem golpes/phishing nem IA (outras estações).
- Depois, se der tempo: 9 missões (3 por nível) e 12 (4 por nível), usando o banco de ideias do `MISSOES.md`.
- Fascículos em `cartilhas/` (baixados pelo `baixar-cartilhas.bat`).
- O grupo escreve num documento; o Claude Code converte para `missions-data.js`.
- [ ] Missões revisadas pelo grupo (ajustes anotados no `MISSOES.md`)
- [ ] Convertidas e testadas uma a uma

### Fase 4 — Ranking online
**Objetivo:** pontuação vai para o Supabase; ranking ao vivo; nada se perde sem internet.
- [ ] 1. Migration `001_ranking.sql` + rollback + teste (revisão do `security-engineer`) — a Grasi aplica
- [ ] 2. `api.js` + fila offline (reenvia ao abrir o site e a cada 30 s; `client_id` evita duplicar)
- [ ] 3. Tela de ranking + modo telão
- [ ] 4. Teste: dois navegadores, internet desligada e religada, tentativa de fraude pelo console

### Fase 5 — Polimento e testes
- [ ] QR Code do site para os cartazes
- [ ] Teste no notebook, em tablet e em celulares Android/iPhone (o guia pede teste nos tablets, se houver)
- [ ] Service worker: site abre sem internet no tablet e no celular depois do primeiro acesso
- [ ] Tela final "Antes de compartilhar": dicas da Cartilha do CERT.br
- [ ] Cópia do site no pendrive (contingência sem internet)
- [ ] Roteiro de apresentação para a banca (o que mostrar em 2 minutos)
- [ ] v1.0.0 e congelamento em 25/11

### Ideias / depois
- Duelo entre dois visitantes · certificado de investigador · painel para cadastrar missões · estatísticas dos erros mais comuns · modo Verdade ou IA.

---

## 8. Próximo Passo
Setup do projeto (Fase 0). Em seguida, Fase 1, etapa 1. A lista do que falta fica em "O Que Ainda Não Foi Implementado" no `IMPLEMENTADO.md`.

---

*Documento gerado em: 10/11/2026*
*Última atualização: 10/11/2026 — simulador vira Fase 1; ajuste ao Guia CiberMissões 2026; 6 missões com sorteio por nível; notebook, tablet e celular por igual; simulador em árvore*
