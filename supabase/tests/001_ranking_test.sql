-- 001_ranking_test.sql — Confere a migration 001_ranking.sql em PRODUÇÃO sem gravar nada.
-- Como usar: colar no SQL Editor do Supabase e clicar em Run.
-- Resultado esperado: um ERRO com a mensagem "OK — N checagens conferem. Nada foi gravado."
--   (o erro é proposital: ele desfaz tudo o que o teste inseriu).
-- Qualquer outra mensagem começando com "FALHOU:" diz qual regra não confere.
-- Sem DDL; só linhas de teste (apelidos "Teste ..."); lock_timeout curto.
-- Supõe que ninguém fez 600 pontos em 30,2 s ou menos hoje (as linhas de teste ocupam o topo)
-- e que não houve 30 envios reais no último minuto (teto contra enxurrada).

do $$
declare
  n          integer := 0;
  v_today    date := (now() at time zone 'America/Sao_Paulo')::date;
  r          json;
  cnt        integer;
  txt        text;
  fn         record;
  t          record;
  rid        uuid;
  rejected   uuid[] := '{}';
  id_ana     uuid := gen_random_uuid();
  id_bia     uuid := gen_random_uuid();
  id_cau     uuid := gen_random_uuid();
  id_dani    uuid := gen_random_uuid();
  id_edu     uuid := gen_random_uuid();
  id_joao    uuid := gen_random_uuid();
begin
  set local lock_timeout = '3s';

  -- ============================================================ 1. Tabela fechada
  if not coalesce((select relrowsecurity from pg_class where oid = 'public.ranking'::regclass), false) then
    raise exception 'FALHOU: RLS desligado em public.ranking';
  end if;
  n := n + 1;

  select count(*) into cnt from pg_policies where schemaname = 'public' and tablename = 'ranking';
  if cnt <> 0 then
    raise exception 'FALHOU: public.ranking tem % policy(s); deveria ter zero', cnt;
  end if;
  n := n + 1;

  for t in
    select rl.role_name, pv.priv
    from (values ('anon'), ('authenticated')) as rl(role_name)
    cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) as pv(priv)
  loop
    if has_table_privilege(t.role_name, 'public.ranking', t.priv) then
      raise exception 'FALHOU: % tem % em public.ranking', t.role_name, t.priv;
    end if;
    n := n + 1;
  end loop;

  -- Tentativas reais como anon (cada uma tem que dar "permission denied")
  begin
    set local role anon;
    perform 1 from public.ranking limit 1;
    raise exception 'FALHOU: anon leu public.ranking direto';
  exception when insufficient_privilege then
    n := n + 1;
  end;

  begin
    set local role anon;
    insert into public.ranking (client_id, nickname, score, missions_played, correct_verdicts, duration_ms)
    values (gen_random_uuid(), 'Teste Anon', 600, 3, 3, 1000);
    raise exception 'FALHOU: anon gravou em public.ranking direto';
  exception when insufficient_privilege then
    n := n + 1;
  end;

  begin
    set local role anon;
    update public.ranking set hidden = false where false;
    raise exception 'FALHOU: anon alterou public.ranking direto';
  exception when insufficient_privilege then
    n := n + 1;
  end;

  begin
    set local role anon;
    delete from public.ranking where false;
    raise exception 'FALHOU: anon apagou em public.ranking direto';
  exception when insufficient_privilege then
    n := n + 1;
  end;

  -- ============================================================ 2. Funções
  cnt := 0;
  for fn in
    select p.oid, p.proname, p.prosecdef, p.proconfig, p.proacl, p.proargnames
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
    where ns.nspname = 'public' and p.proname in ('submit_score', 'get_ranking')
  loop
    cnt := cnt + 1;
    if not fn.prosecdef then
      raise exception 'FALHOU: % não é security definer', fn.proname;
    end if;
    n := n + 1;
    if fn.proconfig is null or not (fn.proconfig @> array['search_path=""']) then
      raise exception 'FALHOU: % sem search_path fixo (%)', fn.proname, fn.proconfig;
    end if;
    n := n + 1;
    if not has_function_privilege('anon', fn.oid, 'EXECUTE') then
      raise exception 'FALHOU: anon não executa %', fn.proname;
    end if;
    n := n + 1;
    if has_function_privilege('authenticated', fn.oid, 'EXECUTE') then
      raise exception 'FALHOU: authenticated executa % (só anon deveria)', fn.proname;
    end if;
    n := n + 1;
    -- proacl nulo = execute para PUBLIC (padrão do Postgres)
    if fn.proacl is null or exists (
      select 1 from aclexplode(fn.proacl) a where a.grantee = 0 and a.privilege_type = 'EXECUTE'
    ) then
      raise exception 'FALHOU: PUBLIC executa %', fn.proname;
    end if;
    n := n + 1;
    if 'client_id' = any(coalesce(fn.proargnames, '{}')) then
      raise exception 'FALHOU: % expõe client_id', fn.proname;
    end if;
    n := n + 1;
  end loop;
  if cnt <> 2 then
    raise exception 'FALHOU: esperava 2 funções (submit_score e get_ranking), achei %', cnt;
  end if;
  n := n + 1;

  -- anon não executa nenhuma outra função do schema public (fora as de extensões)
  select count(*), string_agg(p.proname, ', ') into cnt, txt
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
  where ns.nspname = 'public'
    and p.proname not in ('submit_score', 'get_ranking')
    and has_function_privilege('anon', p.oid, 'EXECUTE')
    and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e');
  if cnt <> 0 then
    raise exception 'FALHOU: anon executa outras funções do schema public: %', txt;
  end if;
  n := n + 1;

  -- ============================================================ 3. submit_score
  -- Ana: inserida direto (dono da tabela), 1 minuto antes, para testar o desempate por horário
  insert into public.ranking (client_id, nickname, score, missions_played, correct_verdicts, duration_ms, created_at)
  values (id_ana, 'Teste Ana', 600, 3, 3, 30000, now() - interval '1 minute');

  set local role anon;
  r := public.submit_score(id_bia, '  Teste   Bia ', 600, 3, 3, 30000);
  reset role;
  if not coalesce((r->>'ok')::boolean, false) or coalesce((r->>'duplicate')::boolean, true) then
    raise exception 'FALHOU: submit_score válido não gravou: %', r;
  end if;
  n := n + 1;
  if (r->>'position')::integer is distinct from 2 then
    raise exception 'FALHOU: posição da Bia deveria ser 2 (Ana empata e chegou antes): %', r;
  end if;
  n := n + 1;
  select count(*) into cnt from public.ranking
  where client_id = id_bia and nickname = 'Teste Bia' and played_on = v_today and not hidden;
  if cnt <> 1 then
    raise exception 'FALHOU: linha da Bia não ficou como esperado (apelido normalizado, data de hoje em São Paulo)';
  end if;
  n := n + 1;

  -- Mesmo client_id de novo (reenvio da fila offline): não duplica nem altera
  set local role anon;
  r := public.submit_score(id_bia, 'Teste Bia', 300, 3, 1, 50000);
  reset role;
  if not coalesce((r->>'ok')::boolean, false) or not coalesce((r->>'duplicate')::boolean, false)
     or (r->>'position')::integer is distinct from 2 then
    raise exception 'FALHOU: reenvio deveria dar ok, duplicate=true e a mesma posição: %', r;
  end if;
  n := n + 1;
  select count(*) into cnt from public.ranking where client_id = id_bia and score = 600;
  if cnt <> 1 or (select count(*) from public.ranking where client_id = id_bia) <> 1 then
    raise exception 'FALHOU: reenvio duplicou ou alterou a linha';
  end if;
  n := n + 1;

  set local role anon;
  r := public.submit_score(id_cau, 'Teste Cau', 600, 3, 3, 30200);
  reset role;
  if (r->>'position')::integer is distinct from 3 then
    raise exception 'FALHOU: Cau (mesmos pontos, mais lento) deveria ficar em 3º: %', r;
  end if;
  n := n + 1;

  -- Apelido com acento e "puta" dentro de palavra comum: aceito
  set local role anon;
  r := public.submit_score(id_joao, 'João Computador', 60, 3, 0, 40000);
  reset role;
  if not coalesce((r->>'ok')::boolean, false) then
    raise exception 'FALHOU: "João Computador" deveria ser aceito: %', r;
  end if;
  n := n + 1;

  -- Rejeições: código curto esperado e nada gravado
  set local role anon;
  for t in
    select * from (values
      ('pontos acima de missões x 200',      'Teste Rej', 601, 3, 3, 1000, 'invalid_score'),
      ('pontos incoerentes com os acertos',  'Teste Rej', 600, 3, 2, 1000, 'invalid_score'),
      ('pontos abaixo do mínimo da partida', 'Teste Rej', 10, 3, 0, 1000, 'invalid_score'),
      ('pontos negativos',                   'Teste Rej', -1, 1, 0, 1000, 'invalid_score'),
      ('apelido curto',                      'A', 60, 3, 0, 1000, 'invalid_nickname'),
      ('apelido longo (21)',                 'Abcdefghijklmnopqrstu', 60, 3, 0, 1000, 'invalid_nickname'),
      ('apelido vazio',                      '', 60, 3, 0, 1000, 'invalid_nickname'),
      ('apelido só espaços',                 '     ', 60, 3, 0, 1000, 'invalid_nickname'),
      ('apelido com caractere de controle',  'Ana' || chr(7) || 'Bia', 60, 3, 0, 1000, 'invalid_nickname'),
      ('apelido com símbolos',               'Ana <b>', 60, 3, 0, 1000, 'invalid_nickname'),
      ('apelido com acentos empilhados',     'Ab' || repeat(chr(769), 10), 60, 3, 0, 1000, 'invalid_nickname'),
      ('apelido com letra cirílica',         chr(1040) || 'na', 60, 3, 0, 1000, 'invalid_nickname'),
      ('apelido com emoji',                  'Ana ' || chr(128512), 60, 3, 0, 1000, 'invalid_nickname'),
      ('apelido gigante',                    repeat('a', 5000), 60, 3, 0, 1000, 'invalid_nickname'),
      ('palavrão (palavra)',                 'Seu Cu', 60, 3, 0, 1000, 'blocked_nickname'),
      ('palavrão (trecho)',                  'Supermerda', 60, 3, 0, 1000, 'blocked_nickname'),
      ('palavrão com espaços',               'P o r r a', 60, 3, 0, 1000, 'blocked_nickname'),
      ('palavrão com acento e maiúscula',    'PÚTÃ', 60, 3, 0, 1000, 'blocked_nickname'),
      ('missões 0',                          'Teste Rej', 0, 0, 0, 1000, 'invalid_missions'),
      ('missões 4',                          'Teste Rej', 80, 4, 0, 1000, 'invalid_missions'),
      ('acertos acima das missões',          'Teste Rej', 600, 3, 4, 1000, 'invalid_correct'),
      ('tempo de 1 s',                       'Teste Rej', 60, 3, 0, 1000, 'invalid_duration'),
      ('tempo abaixo de 10 s por missão',    'Teste Rej', 60, 3, 0, 29999, 'invalid_duration'),
      ('tempo acima de 1 h',                 'Teste Rej', 60, 3, 0, 3600001, 'invalid_duration')
    ) as v(label, nick, score, m, c, dur, expected)
  loop
    rid := gen_random_uuid();
    rejected := rejected || rid;
    r := public.submit_score(rid, t.nick, t.score, t.m, t.c, t.dur);
    if coalesce((r->>'ok')::boolean, true) or r->>'error' is distinct from t.expected then
      raise exception 'FALHOU: % deveria dar %: %', t.label, t.expected, r;
    end if;
    n := n + 1;
  end loop;

  rid := gen_random_uuid();
  rejected := rejected || rid;
  r := public.submit_score(rid, null, 60, 3, 0, 1000);
  if r->>'error' is distinct from 'invalid_nickname' then
    raise exception 'FALHOU: apelido nulo deveria dar invalid_nickname: %', r;
  end if;
  n := n + 1;
  r := public.submit_score(null, 'Teste Rej', 60, 3, 0, 1000);
  if r->>'error' is distinct from 'invalid_client_id' then
    raise exception 'FALHOU: client_id nulo deveria dar invalid_client_id: %', r;
  end if;
  n := n + 1;
  r := public.submit_score(gen_random_uuid(), 'Teste Rej', null, 3, 0, 1000);
  if r->>'error' is distinct from 'invalid_score' then
    raise exception 'FALHOU: pontos nulos deveriam dar invalid_score: %', r;
  end if;
  n := n + 1;
  reset role;

  select count(*) into cnt from public.ranking where client_id = any(rejected) or nickname = 'Teste Rej';
  if cnt <> 0 then
    raise exception 'FALHOU: % envio(s) rejeitado(s) foram gravados', cnt;
  end if;
  n := n + 1;

  -- ============================================================ 4. get_ranking
  -- Dani: oculta. Edu: ontem. Os dois teriam 600 pontos em 30 s (topo) se aparecessem.
  set local role anon;
  r := public.submit_score(id_dani, 'Teste Dani', 600, 3, 3, 30000);
  reset role;
  update public.ranking set hidden = true where client_id = id_dani;
  insert into public.ranking (client_id, nickname, score, missions_played, correct_verdicts, duration_ms, played_on)
  values (id_edu, 'Teste Edu', 600, 3, 3, 30000, v_today - 1);
  -- 55 linhas de hoje, para provar o teto de 50
  insert into public.ranking (client_id, nickname, score, missions_played, correct_verdicts, duration_ms)
  select gen_random_uuid(), 'Teste Lote ' || g, 60, 3, 0, 60000 + g from generate_series(1, 55) as g;

  set local role anon;

  select string_agg(g.nickname, ',' order by g."position") into txt from public.get_ranking(3) g;
  if txt is distinct from 'Teste Ana,Teste Bia,Teste Cau' then
    raise exception 'FALHOU: ordem (pontos desc, tempo asc, horário asc) errada: %', txt;
  end if;
  n := n + 1;

  if exists (select 1 from public.get_ranking(50) g where g.nickname = 'Teste Dani') then
    raise exception 'FALHOU: get_ranking mostrou linha oculta';
  end if;
  n := n + 1;

  if exists (select 1 from public.get_ranking(50) g where g.nickname = 'Teste Edu') then
    raise exception 'FALHOU: get_ranking mostrou linha de ontem';
  end if;
  n := n + 1;

  select count(*) into cnt from public.get_ranking(1000);
  if cnt <> 50 then
    raise exception 'FALHOU: get_ranking(1000) deveria trazer 50, trouxe %', cnt;
  end if;
  n := n + 1;

  select count(*) into cnt from public.get_ranking(0);
  if cnt <> 1 then
    raise exception 'FALHOU: get_ranking(0) deveria trazer 1, trouxe %', cnt;
  end if;
  n := n + 1;

  select count(*) into cnt from public.get_ranking(-5);
  if cnt <> 1 then
    raise exception 'FALHOU: get_ranking(-5) deveria trazer 1, trouxe %', cnt;
  end if;
  n := n + 1;

  select count(*) into cnt from public.get_ranking();
  if cnt <> 20 then
    raise exception 'FALHOU: get_ranking() deveria trazer 20 (padrão), trouxe %', cnt;
  end if;
  n := n + 1;

  select count(*) into cnt from public.get_ranking(null);
  if cnt <> 20 then
    raise exception 'FALHOU: get_ranking(null) deveria trazer 20, trouxe %', cnt;
  end if;
  n := n + 1;

  -- Posições 1..N seguidas e pontos nunca sobem
  select count(*) into cnt
  from (
    select g."position", g.score,
           row_number() over (order by g."position") as rn,
           lag(g.score) over (order by g."position") as prev_score
    from public.get_ranking(50) g
  ) x
  where x."position" <> x.rn or x.score > coalesce(x.prev_score, x.score);
  if cnt <> 0 then
    raise exception 'FALHOU: posições fora de sequência ou pontos fora de ordem em % linha(s)', cnt;
  end if;
  n := n + 1;

  reset role;

  -- ============================================================ 5. Teto contra enxurrada
  -- O lote acima criou 55 linhas neste minuto: partida nova é recusada, reenvio de partida gravada não
  set local role anon;
  r := public.submit_score(gen_random_uuid(), 'Teste Rate', 60, 3, 0, 40000);
  if r->>'error' is distinct from 'rate_limited' then
    raise exception 'FALHOU: 31º envio no mesmo minuto deveria dar rate_limited: %', r;
  end if;
  n := n + 1;
  r := public.submit_score(id_bia, 'Teste Bia', 600, 3, 3, 30000);
  if not coalesce((r->>'duplicate')::boolean, false) then
    raise exception 'FALHOU: reenvio de partida já gravada não pode ser barrado pelo teto: %', r;
  end if;
  n := n + 1;
  reset role;

  -- ============================================================ fim: desfaz tudo
  raise exception 'OK — % checagens conferem. Nada foi gravado.', n;
end
$$;
