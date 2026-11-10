# Checa Aí

> Antes de compartilhar, checa aí.

Site interativo da **Estação 5 — Verdadeiro ou manipulado?** (boatos e desinformação) da Mostra de Cibersegurança **CiberMissões 2026**, IFNMG Campus Arinos, 1º INFO 1, Grupo 5. Nome provisório.

## O que tem
- **Missões de investigação:** o visitante recebe uma publicação fictícia, usa ferramentas para achar pistas, marca o que é suspeito e dá o veredito. Cada partida sorteia 1 missão fácil, 1 média e 1 difícil.
- **Simulador viral:** mostra, rodada a rodada, como um boato se espalha de um celular para milhares de pessoas, e o que muda quando alguém checa antes.
- **Ranking do dia:** apelido e pontuação.

Todo o conteúdo é fictício e baseado na Cartilha de Segurança para Internet do CERT.br (fascículos Boatos e Redes Sociais).

## Stack
HTML, CSS e JavaScript puros (sem build). Supabase (Postgres + RLS) para o ranking. Publicado no GitHub Pages.

## Como rodar
- Abra o `index.html` no navegador (funciona direto do disco ou de um pendrive).
- Ou acesse o site publicado no GitHub Pages.

## Configuração
`js/config.js` guarda a URL do Supabase e a chave `anon` (pública; a proteção é feita pelo RLS e pelas funções do banco). A chave `service_role` nunca entra no projeto.

## Publicação
Todo push na `main` publica no GitHub Pages.

## Versionamento
MAJOR.MINOR.PATCH, com tag git igual à versão (`APP_VERSION` em `js/config.js`). A v1.0.0 é a versão da mostra (25/11/2026).

## Próximas fases
1. Simulador viral · 2. Jogo das missões · 3. Revisão das missões · 4. Ranking online · 5. Testes e acabamento. Detalhes em `PLANEJAMENTO.md`.
