-- 001_ranking.sql — Ranking do dia do Checa Aí (Fase 4A)
-- Aplicar no SQL Editor do Supabase (projeto de produção). Pode rodar de novo sem quebrar.
-- Desfazer: supabase/rollbacks/001_rollback.sql. Testar: supabase/tests/001_ranking_test.sql.
--
-- Revisada pelo security-engineer em 14/11/2026 (aprovada com ressalvas; ressalvas aplicadas).
-- Acesso: o site NÃO lê nem grava a tabela. RLS ligado, nenhuma policy, nenhum privilégio para anon/authenticated.
-- Só duas funções (security definer) ficam abertas, e só para o papel anon:
--   submit_score(...)  grava uma partida validada
--   get_ranking(...)   lê o top do dia (São Paulo), sem client_id
--
-- Regras espelhadas no site (mudou um, muda o outro):
--   apelido   = js/utils.js validateNickname (espaços juntados, 2 a 20 caracteres, letras/números/espaço, listas de bloqueio)
--   pontuação = js/scoring.js (por missão: 20 por concluir + 100 se acertou + 0 a 80 de sinais; máximo 200)

begin;

-- ---------------------------------------------------------------- tabela
create table if not exists public.ranking (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null unique,  -- gerado no navegador por partida; reenvio da fila offline não duplica
  nickname          text not null check (char_length(btrim(nickname)) between 2 and 20),
  score             integer not null,
  missions_played   integer not null check (missions_played between 1 and 3),
  correct_verdicts  integer not null,
  duration_ms       integer not null check (duration_ms between 1000 and 3600000),
  played_on         date not null default ((now() at time zone 'America/Sao_Paulo')::date),
  created_at        timestamptz not null default now(),
  hidden            boolean not null default false, -- a Grasi oculta apelido ofensivo pelo SQL Editor
  constraint ranking_score_range check (score between 0 and missions_played * 200),
  constraint ranking_correct_range check (correct_verdicts between 0 and missions_played)
);

comment on table public.ranking is 'Checa Aí: partidas do ranking do dia. Acesso só pelas funções submit_score e get_ranking.';

-- Top do dia: filtra por data e visibilidade, ordena por pontos e tempo
create index if not exists ranking_created_at_idx on public.ranking (created_at);

create index if not exists ranking_day_order_idx
  on public.ranking (played_on, score desc, duration_ms, created_at)
  where not hidden;

-- ---------------------------------------------------------------- acesso à tabela
alter table public.ranking enable row level security;

-- Nenhuma policy: remove qualquer uma que tenha sido criada à mão
do $$
declare
  pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'ranking' loop
    execute format('drop policy %I on public.ranking', pol.policyname);
  end loop;
end
$$;

-- O Supabase concede tudo em tabelas novas para anon/authenticated por padrão: tira
revoke all on table public.ranking from public, anon, authenticated;

-- ---------------------------------------------------------------- submit_score
create or replace function public.submit_score(
  p_client_id         uuid,
  p_nickname          text,
  p_score             integer,
  p_missions_played   integer,
  p_correct_verdicts  integer,
  p_duration_ms       integer
) returns json
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  -- Mesmas listas do js/utils.js (sem acento, minúsculas)
  blocked_words constant text[] := array['cu', 'puta', 'puto', 'putaria', 'viado', 'viada', 'bosta', 'otario', 'otaria',
    'idiota', 'fdp', 'pqp', 'vsf', 'tnc', 'vtnc', 'foda', 'fodase', 'cuzao', 'babaca', 'imbecil', 'retardado', 'retardada',
    'cacete', 'corno', 'vagabunda', 'vagabundo', 'prostituta', 'nazista', 'estuprador'];
  blocked_parts constant text[] := array['merda', 'porra', 'caralho', 'buceta', 'punheta', 'arrombad', 'xereca', 'piroca',
    'fodase', 'foder'];
  v_nick     text;
  v_folded   text;
  v_inserted integer;
  v_row      public.ranking%rowtype;
  v_position integer;
  v_today    date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  -- Identificador da partida
  if p_client_id is null then
    return json_build_object('ok', false, 'error', 'invalid_client_id');
  end if;

  -- Apelido: corta entrada absurda antes de qualquer processamento
  if p_nickname is null or char_length(p_nickname) > 100 then
    return json_build_object('ok', false, 'error', 'invalid_nickname');
  end if;
  v_nick := btrim(regexp_replace(normalize(p_nickname, NFC), '\s+', ' ', 'g'), ' ');
  if char_length(v_nick) not between 2 and 20 then
    return json_build_object('ok', false, 'error', 'invalid_nickname');
  end if;
  -- Depois do NFC toda letra acentuada é um caractere só; marca combinante solta = acento empilhado (o site também recusa)
  if v_nick ~ '[\u0300-\u036f]' then
    return json_build_object('ok', false, 'error', 'invalid_nickname');
  end if;
  -- Sem acento e minúsculo; depois disso só pode sobrar a-z, 0-9 e espaço (rejeita controle, símbolos, emoji)
  v_folded := lower(regexp_replace(normalize(v_nick, NFD), '[\u0300-\u036f]', '', 'g'));
  if v_folded !~ '^[a-z0-9 ]+$' then
    return json_build_object('ok', false, 'error', 'invalid_nickname');
  end if;
  if string_to_array(v_folded, ' ') && blocked_words
     or exists (select 1 from unnest(blocked_parts) as part where strpos(replace(v_folded, ' ', ''), part) > 0) then
    return json_build_object('ok', false, 'error', 'blocked_nickname');
  end if;

  -- Números da partida
  if p_missions_played is null or p_missions_played not between 1 and 3 then
    return json_build_object('ok', false, 'error', 'invalid_missions');
  end if;
  if p_correct_verdicts is null or p_correct_verdicts not between 0 and p_missions_played then
    return json_build_object('ok', false, 'error', 'invalid_correct');
  end if;
  -- Teto (200 por missão) e coerência com os acertos (js/scoring.js):
  -- cada missão vale 20 por concluir + 100 se acertou + 0 a 80 de sinais
  if p_score is null
     or p_score > p_missions_played * 200
     or p_score < 20 * p_missions_played + 100 * p_correct_verdicts
     or p_score > 100 * p_missions_played + 100 * p_correct_verdicts then
    return json_build_object('ok', false, 'error', 'invalid_score');
  end if;
  -- Tempo plausível: pelo menos 10 s por missão (o site espelha na Fase 4B), no máximo 1 h
  if p_duration_ms is null or p_duration_ms < 10000 * p_missions_played or p_duration_ms > 3600000 then
    return json_build_object('ok', false, 'error', 'invalid_duration');
  end if;

  -- Teto global contra enxurrada pelo console (sem guardar IP). Reenvio de partida já gravada não conta.
  -- O site trata 'rate_limited' como erro temporário e mantém a partida na fila offline.
  if not exists (select 1 from public.ranking where client_id = p_client_id)
     and ((select count(*) from public.ranking where created_at > now() - interval '1 minute') >= 30
       or (select count(*) from public.ranking where played_on = v_today) >= 3000) then
    return json_build_object('ok', false, 'error', 'rate_limited');
  end if;

  insert into public.ranking (client_id, nickname, score, missions_played, correct_verdicts, duration_ms)
  values (p_client_id, v_nick, p_score, p_missions_played, p_correct_verdicts, p_duration_ms)
  on conflict (client_id) do nothing;
  get diagnostics v_inserted = row_count;

  -- Posição no ranking de hoje (mesma ordem do get_ranking); null se a linha é de outro dia ou está oculta
  select * into v_row from public.ranking where client_id = p_client_id;
  if v_row.played_on = v_today and not v_row.hidden then
    select count(*)::integer + 1 into v_position
    from public.ranking r
    where r.played_on = v_today
      and not r.hidden
      and (r.score > v_row.score
        or (r.score = v_row.score and r.duration_ms < v_row.duration_ms)
        or (r.score = v_row.score and r.duration_ms = v_row.duration_ms and r.created_at < v_row.created_at)
        or (r.score = v_row.score and r.duration_ms = v_row.duration_ms and r.created_at = v_row.created_at and r.id < v_row.id));
  end if;

  return json_build_object('ok', true, 'duplicate', v_inserted = 0, 'position', v_position);
exception
  when others then
    -- Detalhe só no log do servidor; o visitante recebe um código curto
    raise log 'submit_score falhou: % (%)', sqlerrm, sqlstate;
    return json_build_object('ok', false, 'error', 'server_error');
end;
$fn$;

comment on function public.submit_score(uuid, text, integer, integer, integer, integer)
  is 'Checa Aí: grava uma partida validada. Retorna {ok, duplicate, position} ou {ok:false, error}.';

-- ---------------------------------------------------------------- get_ranking
create or replace function public.get_ranking(p_limit integer default 20)
returns table (
  "position"        integer,
  nickname          text,
  score             integer,
  missions_played   integer,
  duration_ms       integer,
  correct_verdicts  integer
)
language sql
stable
security definer
set search_path = ''
as $fn$
  select
    (row_number() over (order by r.score desc, r.duration_ms asc, r.created_at asc, r.id asc))::integer,
    r.nickname,
    r.score,
    r.missions_played,
    r.duration_ms,
    r.correct_verdicts
  from public.ranking r
  where r.played_on = (now() at time zone 'America/Sao_Paulo')::date
    and not r.hidden
  order by r.score desc, r.duration_ms asc, r.created_at asc, r.id asc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$fn$;

comment on function public.get_ranking(integer)
  is 'Checa Aí: top do dia (America/Sao_Paulo), sem ocultos, 1 a 50 linhas (padrão 20).';

-- ---------------------------------------------------------------- execução das funções
-- O Supabase concede execute em funções novas para anon/authenticated por padrão: tira tudo e dá só para anon
revoke all on function public.submit_score(uuid, text, integer, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.get_ranking(integer) from public, anon, authenticated;
grant execute on function public.submit_score(uuid, text, integer, integer, integer, integer) to anon;
grant execute on function public.get_ranking(integer) to anon;

commit;
