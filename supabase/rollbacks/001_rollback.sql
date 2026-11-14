-- 001_rollback.sql — Desfaz supabase/migrations/001_ranking.sql
-- ATENÇÃO: apaga a tabela public.ranking e TODAS as pontuações gravadas. Use só se precisar desfazer a migration.
-- Pode rodar mais de uma vez (não dá erro se já não existir).

begin;

drop function if exists public.submit_score(uuid, text, integer, integer, integer, integer);
drop function if exists public.get_ranking(integer);
drop table if exists public.ranking;

commit;
