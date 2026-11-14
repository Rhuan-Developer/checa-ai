# Banco do ranking — como aplicar

Projeto Supabase: `uxbjmriuvfjzjxduimbo` (produção, o único). Tudo é feito no painel, em **SQL Editor**.
Ordem: **migration → teste → site**. O site só passa a usar o ranking depois que o teste der OK.

## 1. Criar o ranking (migration)
1. Abra o painel do Supabase → projeto `uxbjmriuvfjzjxduimbo` → **SQL Editor** → **New query**.
2. Copie todo o conteúdo de `supabase/migrations/001_ranking.sql`, cole e clique em **Run**.
3. Deve aparecer **Success. No rows returned**. Se aparecer um aviso sobre "destructive operations", pode confirmar: ele só remove policies da tabela `ranking`, que não deve ter nenhuma.

Pode rodar de novo sem problema (não apaga pontuações).

## 2. Conferir (teste)
1. **New query** de novo. Copie todo o conteúdo de `supabase/tests/001_ranking_test.sql`, cole e clique em **Run**.
2. O resultado **certo é um erro** com a mensagem:
   `OK — 80 checagens conferem. Nada foi gravado.`
   O erro é proposital: ele desfaz tudo o que o teste inseriu. A tabela continua vazia.
3. Se a mensagem começar com **FALHOU:**, não libere o site. Copie a mensagem e mande para o Rhuan.
4. Se aparecer `permission denied to set role "anon"`, o teste não conseguiu agir como visitante: mande a mensagem também.

## 3. Partida real de verificação (depois de publicar a v0.5.0)
1. No celular ou notebook, abra o site publicado → **Começar investigação** → apelido `Teste Grasi` → jogue as 3 missões **devagar** (mais de 30 s no total; partida mais rápida não vai para o ranking).
2. No fim da partida deve aparecer **"Você está em 1º no ranking de hoje."** (ou outra posição, se já houver partidas). Toque em **Ver o ranking**: a linha `Teste Grasi` aparece destacada.
3. Confira no SQL Editor (só leitura):
   ```sql
   select nickname, score, correct_verdicts, duration_ms, played_on, hidden from public.ranking
   where played_on = (now() at time zone 'America/Sao_Paulo')::date;
   ```
4. Sem internet: ative o modo avião, jogue outra partida (`Teste Offline`) → "Pontuação salva. Vai pro ranking quando a internet voltar." → desative o modo avião e espere alguns segundos → a frase muda para a posição. A linha aparece **uma vez só** no ranking.
5. Modo telão: no ranking, toque no ícone da barra superior → top 10 em letras grandes; **Sair** ou Esc volta.
6. Oculte as linhas de teste (somem do ranking em até 15 s, não são apagadas):
   ```sql
   update public.ranking set hidden = true
   where nickname in ('Teste Grasi', 'Teste Offline') and played_on = (now() at time zone 'America/Sao_Paulo')::date;
   ```

## 4. Ocultar um apelido ofensivo (durante a mostra)
No SQL Editor, troque o apelido e rode:
```sql
update public.ranking set hidden = true
where nickname = 'APELIDO AQUI' and played_on = (now() at time zone 'America/Sao_Paulo')::date;
```
A linha some do ranking na próxima atualização da tela (não é apagada). Para mostrar de novo, rode o mesmo comando com `hidden = false`.

Para ver as pontuações de hoje (só leitura):
```sql
select nickname, score, duration_ms, created_at, hidden from public.ranking
where played_on = (now() at time zone 'America/Sao_Paulo')::date
order by score desc, duration_ms;
```

## 5. Emergência no dia (alguém forjando pontos pelo console)
Sem login, quem souber usar o console do navegador consegue mandar uma pontuação falsa. O banco já recusa tempo impossível (menos de 10 s por missão) e mais de 30 envios por minuto ou 3000 no dia, mas não sabe se a partida foi jogada de verdade.
- Placar suspeito: oculte a linha (comando do item 4, trocando o apelido).
- Enxurrada de envios: feche a gravação (o ranking continua aparecendo; as partidas novas ficam guardadas na fila do aparelho):
  ```sql
  revoke execute on function public.submit_score(uuid, text, integer, integer, integer, integer) from anon;
  ```
  Para reabrir:
  ```sql
  grant execute on function public.submit_score(uuid, text, integer, integer, integer, integer) to anon;
  ```

## 6. Desfazer (só se precisar)
`supabase/rollbacks/001_rollback.sql` **apaga a tabela e todas as pontuações**. Cole, clique em **Run**; deve aparecer **Success**. Pode rodar mais de uma vez.

## Regras (para quem mexer depois)
- Nunca editar uma migration já aplicada: mudança = migration nova (`002_...sql`) com rollback e teste.
- A chave `anon` é pública e vai no `js/config.js`. A chave `service_role` nunca entra no projeto.
- Apelido e pontuação são validados no site (`js/utils.js`, `js/scoring.js`) e no banco (`submit_score`): mudou um, muda o outro.
