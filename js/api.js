'use strict';

(function () {
  window.ChecaAi = window.ChecaAi || {};
  const ChecaAi = window.ChecaAi;

  /*
   * Ranking online: chamadas ao Supabase (REST, só fetch), regras de envio iguais às do banco e fila offline.
   * Banco: supabase/migrations/001_ranking.sql (submit_score e get_ranking). Mudou uma regra lá, muda aqui.
   *
   * Resultado de um envio (classify*):
   *   { kind: 'sent', position, duplicate }  gravado (ou já estava gravado: reenvio da fila)
   *   { kind: 'rejected', code }            definitivo: o banco recusou os dados; sai da fila e não repete
   *   { kind: 'retry', code }               temporário: rede, tempo esgotado, limite, servidor, gravação fechada
   */

  /** Códigos do submit_score que nunca vão mudar reenviando os mesmos dados. */
  const DEFINITIVE_CODES = Object.freeze(['invalid_client_id', 'invalid_nickname', 'blocked_nickname',
    'invalid_missions', 'invalid_correct', 'invalid_score', 'invalid_duration']);

  /** Falhas de rede/limite: esperam sem limite (a fila de outro dia é descartada). As demais param depois de N tentativas. */
  const NETWORK_CODES = Object.freeze(['offline', 'timeout', 'network', 'rate_limited', 'closed']);
  const MAX_SERVER_ATTEMPTS = 8;

  const MAX_DURATION_MS = 3600000; // igual ao banco
  const MAX_MISSIONS = 3; // igual ao banco
  const MISSION_MAX = 200; // scoring.js
  const COMPLETION_POINTS = 20; // scoring.js
  const VERDICT_POINTS = 100; // scoring.js

  /* ---------- regras (puras, testáveis no console) ---------- */

  /**
   * Classifica a resposta HTTP do submit_score.
   * @param {number} status código HTTP
   * @param {*} body JSON já lido (ou null)
   * @returns {{kind: 'sent'|'rejected'|'retry', code?: string, position?: number|null, duplicate?: boolean}}
   */
  function classifySubmit(status, body) {
    if (status >= 200 && status < 300) {
      if (body && typeof body === 'object' && body.ok === true) {
        const position = Number.isInteger(body.position) && body.position > 0 ? body.position : null;
        return { kind: 'sent', position, duplicate: body.duplicate === true };
      }
      if (body && typeof body === 'object' && body.ok === false && typeof body.error === 'string') {
        return DEFINITIVE_CODES.indexOf(body.error) !== -1
          ? { kind: 'rejected', code: body.error }
          : { kind: 'retry', code: body.error }; // rate_limited, server_error e código desconhecido
      }
      return { kind: 'retry', code: 'bad_response' };
    }
    if (status === 400 || status === 422) return { kind: 'rejected', code: 'bad_request' }; // parâmetro que o banco não aceita
    if (status === 401 || status === 403) return { kind: 'retry', code: 'closed' }; // gravação fechada (revoke) ou chave
    return { kind: 'retry', code: 'http_' + status };
  }

  /**
   * Classifica uma falha de fetch (sem resposta HTTP).
   * @param {*} err
   * @returns {{kind: 'retry', code: string}}
   */
  function classifyFailure(err) {
    if (err && err.name === 'AbortError') return { kind: 'retry', code: 'timeout' };
    if (err && err.code === 'offline') return { kind: 'retry', code: 'offline' };
    return { kind: 'retry', code: 'network' };
  }

  /**
   * Monta o envio de uma partida encerrada, com as mesmas regras do banco.
   * @param {Object} match partida de storage.js (finishedAt preenchido)
   * @param {string} [playedOn] AAAA-MM-DD; padrão: hoje em São Paulo
   * @returns {{ok: true, entry: Object} | {ok: false, reason: string}}
   *   reason: 'not_finished' | 'bad_id' | 'bad_nickname' | 'too_fast' | 'too_slow' | 'bad_score'
   */
  function prepareEntry(match, playedOn) {
    if (!match || match.finishedAt === null || !Array.isArray(match.answers) || !match.answers.every(Boolean)) {
      return { ok: false, reason: 'not_finished' };
    }
    if (!ChecaAi.storage.isUuid(match.clientId)) return { ok: false, reason: 'bad_id' };
    const nick = ChecaAi.utils.validateNickname(match.nickname);
    if (!nick.ok) return { ok: false, reason: 'bad_nickname' };

    const total = ChecaAi.scoring.scoreMatch(match.answers.map((a) => a.score));
    const m = total.missions;
    const c = total.correctVerdicts;
    const s = total.total;
    const durationMs = Math.round(match.finishedAt - match.startedAt);
    if (!Number.isInteger(m) || m < 1 || m > MAX_MISSIONS || !Number.isInteger(c) || c < 0 || c > m ||
        !Number.isInteger(s) || s > MISSION_MAX * m ||
        s < COMPLETION_POINTS * m + VERDICT_POINTS * c || s > (MISSION_MAX - VERDICT_POINTS) * m + VERDICT_POINTS * c) {
      return { ok: false, reason: 'bad_score' };
    }
    if (!Number.isFinite(durationMs) || durationMs < ChecaAi.config.MIN_MS_PER_MISSION * m) return { ok: false, reason: 'too_fast' };
    if (durationMs > MAX_DURATION_MS) return { ok: false, reason: 'too_slow' };

    return {
      ok: true,
      entry: {
        clientId: match.clientId,
        nickname: nick.value,
        score: s,
        missionsPlayed: m,
        correctVerdicts: c,
        durationMs,
        playedOn: playedOn || ChecaAi.utils.todayISO(),
        attempts: 0
      }
    };
  }

  /**
   * Espera antes do próximo reenvio: QUEUE_RETRY_MS, dobrando a cada falha seguida, até QUEUE_RETRY_MAX_MS,
   * com variação de 75% a 125% (vários aparelhos que voltam juntos não reenviam no mesmo instante).
   * @param {number} failures falhas seguidas (>= 1)
   * @param {() => number} [random] padrão Math.random
   * @returns {number} ms
   */
  function retryDelay(failures, random) {
    const cfg = ChecaAi.config;
    const n = Math.max(1, Math.min(failures, 16));
    const base = Math.min(cfg.QUEUE_RETRY_MAX_MS, cfg.QUEUE_RETRY_MS * Math.pow(2, n - 1));
    const rnd = random || Math.random;
    return Math.round(base * (0.75 + rnd() * 0.5));
  }

  /**
   * Linha do ranking vinda da rede, só com campos esperados e tipos certos (o resto é descartado).
   * @param {*} row
   * @returns {{position: number, nickname: string, score: number, missionsPlayed: number, correctVerdicts: number, durationMs: number}|null}
   */
  function sanitizeRow(row) {
    if (!row || typeof row !== 'object') return null;
    const out = {
      position: row.position,
      nickname: typeof row.nickname === 'string' ? row.nickname.slice(0, 40) : '',
      score: row.score,
      missionsPlayed: row.missions_played,
      correctVerdicts: row.correct_verdicts,
      durationMs: row.duration_ms
    };
    const ints = [out.position, out.score, out.missionsPlayed, out.correctVerdicts, out.durationMs];
    return out.nickname && ints.every(Number.isInteger) ? out : null;
  }

  /**
   * Linha guardada no localStorage (já no formato de sanitizeRow), conferida de novo: o armazenamento pode ter sido mexido.
   * @param {*} row
   * @returns {Object|null}
   */
  function sanitizeCachedRow(row) {
    if (!row || typeof row !== 'object') return null;
    return sanitizeRow({
      position: row.position, nickname: row.nickname, score: row.score,
      missions_played: row.missionsPlayed, correct_verdicts: row.correctVerdicts, duration_ms: row.durationMs
    });
  }

  /* ---------- rede ---------- */

  /**
   * POST numa RPC do Supabase, com tempo máximo. Lança erro se não houver resposta HTTP.
   * @param {string} name
   * @param {Object} payload
   * @returns {Promise<{status: number, body: *}>}
   */
  function rpc(name, payload) {
    const cfg = ChecaAi.config;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      const offline = new Error('Sem conexão.');
      offline.code = 'offline';
      return Promise.reject(offline);
    }
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? window.setTimeout(() => controller.abort(), cfg.API_TIMEOUT_MS) : null;
    return window.fetch(cfg.SUPABASE_URL + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: {
        apikey: cfg.SUPABASE_PUBLISHABLE_KEY,
        Authorization: 'Bearer ' + cfg.SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined,
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    }).then((res) => res.text().then((text) => {
      let body = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch (err) {
        console.warn('Resposta do ranking fora do formato esperado.', err);
      }
      return { status: res.status, body };
    })).finally(() => {
      if (timer !== null) window.clearTimeout(timer);
    });
  }

  /**
   * Envia uma partida ao ranking. Nunca rejeita: devolve a classificação.
   * @param {Object} entry item da fila (QueuedScore)
   * @returns {Promise<{kind: string, code?: string, position?: number|null, duplicate?: boolean}>}
   */
  function submitScore(entry) {
    return rpc('submit_score', {
      p_client_id: entry.clientId,
      p_nickname: entry.nickname,
      p_score: entry.score,
      p_missions_played: entry.missionsPlayed,
      p_correct_verdicts: entry.correctVerdicts,
      p_duration_ms: entry.durationMs
    }).then((r) => classifySubmit(r.status, r.body), (err) => classifyFailure(err));
  }

  /**
   * Top do dia. Nunca rejeita.
   * @param {number} [limit]
   * @returns {Promise<{ok: true, rows: Object[]} | {ok: false, code: string}>}
   */
  function getRanking(limit) {
    const n = Math.max(1, Math.min(50, Math.round(Number(limit) || ChecaAi.config.RANKING_LIMIT)));
    return rpc('get_ranking', { p_limit: n }).then((r) => {
      if (r.status >= 200 && r.status < 300 && Array.isArray(r.body)) {
        return { ok: true, rows: r.body.map(sanitizeRow).filter(Boolean) };
      }
      return { ok: false, code: 'http_' + r.status };
    }, (err) => ({ ok: false, code: classifyFailure(err).code }));
  }

  /* ---------- fila offline ---------- */

  const listeners = [];
  let flushing = null;
  let retryTimer = null;
  let failures = 0;
  let started = false;

  function notify() {
    listeners.slice().forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Erro ao atualizar a tela com o envio do ranking.', err);
      }
    });
  }

  /**
   * Avisa quando a situação de algum envio mudar.
   * @param {() => void} fn
   * @returns {() => void} cancela o aviso
   */
  function onChange(fn) {
    listeners.push(fn);
    return () => {
      const i = listeners.indexOf(fn);
      if (i !== -1) listeners.splice(i, 1);
    };
  }

  function clearRetry() {
    if (retryTimer !== null) window.clearTimeout(retryTimer);
    retryTimer = null;
  }

  function scheduleRetry() {
    clearRetry();
    if (!ChecaAi.storage.getQueue().length) {
      failures = 0;
      return;
    }
    retryTimer = window.setTimeout(() => {
      retryTimer = null;
      flush();
    }, retryDelay(Math.max(1, failures)));
  }

  /**
   * Tenta enviar a fila (mais antiga primeiro). Para na primeira falha temporária e agenda o próximo envio.
   * Chamadas simultâneas compartilham o mesmo envio.
   * @returns {Promise<void>}
   */
  function flush() {
    if (flushing) return flushing;
    clearRetry();
    const storage = ChecaAi.storage;
    const today = ChecaAi.utils.todayISO();

    flushing = (async () => {
      for (const item of storage.getQueue()) {
        if (item.playedOn !== today) {
          // Partida de outro dia: não entra no ranking de hoje
          storage.removeQueued(item.clientId);
          storage.setResult(item.clientId, { state: 'rejected', position: null });
          notify();
          continue;
        }
        const result = await submitScore(item);
        if (result.kind === 'sent') {
          storage.removeQueued(item.clientId);
          storage.setResult(item.clientId, { state: 'sent', position: result.position });
          failures = 0;
          notify();
        } else if (result.kind === 'rejected') {
          console.warn('O ranking recusou uma partida (' + result.code + '); ela saiu da fila.');
          storage.removeQueued(item.clientId);
          storage.setResult(item.clientId, { state: 'rejected', position: null });
          notify();
        } else {
          const attempts = item.attempts + 1;
          if (NETWORK_CODES.indexOf(result.code) === -1 && attempts >= MAX_SERVER_ATTEMPTS) {
            // Erro persistente do servidor com esta partida: sai da fila para não prender as seguintes
            console.warn('O ranking falhou ' + attempts + ' vezes com uma partida (' + result.code + '); ela saiu da fila.');
            storage.removeQueued(item.clientId);
            storage.setResult(item.clientId, { state: 'rejected', position: null });
            notify();
            continue;
          }
          storage.updateQueued(item.clientId, { attempts });
          failures += 1;
          notify();
          break;
        }
      }
    })().catch((err) => {
      console.error('Erro ao enviar a fila do ranking; tento de novo depois.', err);
      failures += 1;
    }).finally(() => {
      flushing = null;
      scheduleRetry();
    });
    return flushing;
  }

  /**
   * Partida encerrada: entra na fila uma única vez (pelo clientId) e o envio começa.
   * Partida que o banco recusaria (rápida demais, pontos incoerentes) não é enviada, sem aviso.
   * @param {Object} match
   * @returns {Object} SendResult atual
   */
  function recordMatch(match) {
    const storage = ChecaAi.storage;
    const existing = match && storage.getResult(match.clientId);
    if (existing) {
      if (existing.state === 'pending') flush();
      return existing;
    }
    const prepared = prepareEntry(match);
    if (!prepared.ok) {
      return storage.setResult(match && match.clientId ? match.clientId : 'sem-id', {
        state: 'skipped', position: null, reason: prepared.reason
      });
    }
    const e = prepared.entry;
    storage.enqueueScore(e, ChecaAi.config.QUEUE_MAX);
    const result = storage.setResult(e.clientId, {
      state: 'pending', position: null, nickname: e.nickname, score: e.score, durationMs: e.durationMs, playedOn: e.playedOn
    });
    flush();
    return result;
  }

  /** Começa o reenvio automático: agora, ao voltar a conexão e com espera crescente enquanto houver fila. */
  function startSync() {
    if (started) return;
    started = true;
    window.addEventListener('online', () => {
      failures = 0;
      flush();
    });
    if (ChecaAi.storage.getQueue().length) flush();
  }

  ChecaAi.api = {
    DEFINITIVE_CODES,
    NETWORK_CODES,
    MAX_SERVER_ATTEMPTS,
    classifySubmit,
    classifyFailure,
    prepareEntry,
    retryDelay,
    sanitizeRow,
    sanitizeCachedRow,
    submitScore,
    getRanking,
    flush,
    recordMatch,
    onChange,
    startSync
  };
})();
