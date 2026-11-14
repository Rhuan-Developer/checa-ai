'use strict';

(function () {
  window.ChecaAi = window.ChecaAi || {};

  /**
   * Resposta a uma missão.
   * @typedef {Object} MissionAnswer
   * @property {string} missionId
   * @property {string} verdict  'true' | 'false' | 'misleading' | 'unproven'
   * @property {number[]} markedSignalIndexes  índices (ordem de missions-data.js) dos sinais marcados
   * @property {Object} score  resultado de ChecaAi.scoring.scoreMission
   * @property {number} answeredAt  ms (Date.now())
   *
   * Partida atual (fica na sessionStorage: sobrevive a recarregar a página, some ao fechar a aba).
   * @typedef {Object} Match
   * @property {string} clientId  UUID da partida; vira o client_id do ranking (reenviar não duplica)
   * @property {string} nickname
   * @property {string[]} missionIds  fácil, média e difícil, nessa ordem
   * @property {number} index  missão atual (0 a missionIds.length - 1)
   * @property {(MissionAnswer|null)[]} answers  uma posição por missão
   * @property {Object<string, number[]>} signalOrders  ordem embaralhada dos sinais por missão (fixa na partida)
   * @property {number} startedAt  ms
   * @property {number|null} finishedAt  ms
   */

  const STORAGE_KEY = 'checaai.match';

  /** Cópia em memória: a partida segue mesmo se o navegador bloquear o armazenamento. */
  let memoryMatch = null;

  function randomId() {
    const c = window.crypto;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
    if (c && typeof c.getRandomValues === 'function') {
      const b = c.getRandomValues(new Uint8Array(16));
      b[6] = (b[6] & 0x0f) | 0x40;
      b[8] = (b[8] & 0x3f) | 0x80;
      const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
      return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
    }
    // Último recurso (navegador sem crypto): UUID v4 com Math.random, para o banco aceitar o client_id
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
      const r = Math.floor(Math.random() * 16);
      return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  /** @param {string} id @returns {boolean} */
  function isUuid(id) {
    return typeof id === 'string' && UUID_PATTERN.test(id);
  }

  function isValidMatch(m) {
    return !!m && typeof m === 'object' &&
      typeof m.clientId === 'string' &&
      typeof m.nickname === 'string' &&
      Array.isArray(m.missionIds) && m.missionIds.length > 0 &&
      Array.isArray(m.answers) && m.answers.length === m.missionIds.length &&
      Number.isInteger(m.index) && m.index >= 0 && m.index < m.missionIds.length &&
      !!m.signalOrders && typeof m.signalOrders === 'object' &&
      typeof m.startedAt === 'number';
  }

  function persist(match) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(match));
    } catch (err) {
      console.warn('Não deu para guardar a partida no navegador; ela continua só nesta página.', err);
    }
  }

  function load() {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (isValidMatch(parsed)) return parsed;
      console.warn('A partida guardada estava incompleta e foi descartada.');
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('Não deu para ler a partida guardada no navegador.', err);
    }
    return null;
  }

  /**
   * Começa uma partida nova (descarta a anterior). O apelido é o que o visitante acabou de digitar;
   * nunca se reaproveita o de outra pessoa.
   * @param {string} nickname já validado
   * @param {string[]} missionIds
   * @returns {Match}
   */
  function startMatch(nickname, missionIds) {
    if (!Array.isArray(missionIds) || !missionIds.length) {
      throw new Error('startMatch: a partida precisa de pelo menos uma missão.');
    }
    memoryMatch = {
      clientId: randomId(),
      nickname: String(nickname),
      missionIds: missionIds.slice(),
      index: 0,
      answers: missionIds.map(() => null),
      signalOrders: {},
      startedAt: Date.now(),
      finishedAt: null
    };
    persist(memoryMatch);
    return memoryMatch;
  }

  /** @returns {Match|null} partida atual, ou null se não houver */
  function getMatch() {
    if (!memoryMatch) memoryMatch = load();
    return memoryMatch;
  }

  /**
   * Ordem embaralhada dos sinais de uma missão; criada na primeira vez e depois sempre a mesma.
   * @param {string} missionId
   * @param {number} count quantidade de sinais
   * @param {() => number} [random]
   * @returns {number[]}
   */
  function getSignalOrder(missionId, count, random) {
    const match = getMatch();
    const saved = match && match.signalOrders[missionId];
    const valid = Array.isArray(saved) && saved.length === count &&
      saved.slice().sort((a, b) => a - b).every((v, i) => v === i);
    if (valid) return saved.slice();
    const base = [];
    for (let i = 0; i < count; i++) base.push(i);
    const order = window.ChecaAi.utils.shuffle(base, random);
    if (match) {
      match.signalOrders[missionId] = order;
      persist(match);
    }
    return order.slice();
  }

  /**
   * Guarda a resposta de uma missão. Se a missão já tem resposta, não grava de novo e devolve a existente.
   * @param {string} missionId
   * @param {{verdict: string, markedSignalIndexes: number[], score: Object}} data
   * @returns {MissionAnswer|null} a resposta guardada (ou a existente); null se não há partida ou a missão não é dela
   */
  function saveAnswer(missionId, data) {
    const match = getMatch();
    if (!match) return null;
    const i = match.missionIds.indexOf(missionId);
    if (i === -1) return null;
    if (match.answers[i]) return match.answers[i];
    match.answers[i] = {
      missionId,
      verdict: data.verdict,
      markedSignalIndexes: data.markedSignalIndexes.slice(),
      score: data.score,
      answeredAt: Date.now()
    };
    persist(match);
    return match.answers[i];
  }

  /**
   * Vai para a próxima missão (só se a atual já foi respondida e existe uma próxima).
   * @returns {number} índice atual depois da chamada
   */
  function advance() {
    const match = getMatch();
    if (!match) return -1;
    if (match.answers[match.index] && match.index < match.missionIds.length - 1) {
      match.index += 1;
      persist(match);
    }
    return match.index;
  }

  /**
   * Encerra a partida (só se todas as missões foram respondidas). Chamar de novo não muda o horário.
   * @returns {Match|null} a partida; null se não há partida ou ainda falta missão
   */
  function finishMatch() {
    const match = getMatch();
    if (!match || !match.answers.every(Boolean)) return null;
    if (match.finishedAt === null) {
      match.finishedAt = Date.now();
      persist(match);
    }
    return match;
  }

  /** Apaga a partida atual. */
  function clearMatch() {
    memoryMatch = null;
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('Não deu para apagar a partida guardada no navegador.', err);
    }
  }

  /* ---------- ranking: fila offline, resultado dos envios e última lista (localStorage) ---------- */

  /**
   * Partida esperando envio ao ranking. Só o apelido identifica a pessoa.
   * @typedef {Object} QueuedScore
   * @property {string} clientId  UUID da partida
   * @property {string} nickname
   * @property {number} score
   * @property {number} missionsPlayed
   * @property {number} correctVerdicts
   * @property {number} durationMs
   * @property {string} playedOn  AAAA-MM-DD (São Paulo); de outro dia não é enviada
   * @property {number} attempts  tentativas que falharam por motivo temporário
   *
   * Situação do envio de uma partida, para a tela de fim e o destaque no ranking.
   * @typedef {Object} SendResult
   * @property {'pending'|'sent'|'rejected'|'skipped'} state
   * @property {number|null} position  posição do dia devolvida pelo banco
   * @property {string} nickname
   * @property {number} score
   * @property {number} durationMs
   * @property {string} playedOn
   * @property {number} updatedAt  ms
   */

  const QUEUE_KEY = 'checaai.rankingQueue';
  const RESULTS_KEY = 'checaai.rankingResults';
  const LAST_RANKING_KEY = 'checaai.rankingLast';
  const RESULTS_MAX = 20;

  /*
   * Lê sempre o localStorage (duas abas no mesmo aparelho veem a mesma fila). A cópia em memória só vale
   * se o navegador bloquear o armazenamento: aí tudo segue funcionando, sem guardar.
   */
  const memory = {};
  let storageBroken = false;

  function readLocal(key, fallback) {
    if (!storageBroken) {
      let raw = null;
      try {
        raw = window.localStorage.getItem(key);
      } catch (err) {
        storageBroken = true;
        console.warn('Não deu para ler o ranking guardado no navegador; seguindo sem ele.', err);
      }
      if (!storageBroken) {
        let value = fallback;
        try {
          if (raw) value = JSON.parse(raw);
        } catch (err) {
          console.warn('O ranking guardado no navegador estava corrompido e foi ignorado.', err);
        }
        memory[key] = value;
        return value;
      }
    }
    return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : fallback;
  }

  function writeLocal(key, value) {
    memory[key] = value;
    if (storageBroken) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      storageBroken = true;
      console.warn('Não deu para guardar o ranking no navegador; ele fica só nesta página.', err);
    }
  }

  function isQueuedScore(q) {
    return !!q && typeof q === 'object' && isUuid(q.clientId) && typeof q.nickname === 'string' &&
      [q.score, q.missionsPlayed, q.correctVerdicts, q.durationMs, q.attempts].every(Number.isInteger) &&
      typeof q.playedOn === 'string';
  }

  /** @returns {QueuedScore[]} fila (mais antiga primeiro) */
  function getQueue() {
    const q = readLocal(QUEUE_KEY, []);
    return Array.isArray(q) ? q.filter(isQueuedScore) : [];
  }

  /**
   * Põe a partida na fila (se o mesmo clientId já está nela, não duplica). Limite: descarta a mais antiga.
   * @param {QueuedScore} item
   * @param {number} max
   * @returns {QueuedScore[]} fila nova
   */
  function enqueueScore(item, max) {
    if (!isQueuedScore(item)) throw new Error('enqueueScore: partida incompleta para o ranking.');
    const queue = getQueue().filter((q) => q.clientId !== item.clientId);
    queue.push(item);
    while (queue.length > max) queue.shift();
    writeLocal(QUEUE_KEY, queue);
    return queue;
  }

  /** @param {string} clientId */
  function removeQueued(clientId) {
    writeLocal(QUEUE_KEY, getQueue().filter((q) => q.clientId !== clientId));
  }

  /** @param {string} clientId @param {Partial<QueuedScore>} patch */
  function updateQueued(clientId, patch) {
    writeLocal(QUEUE_KEY, getQueue().map((q) => (q.clientId === clientId ? Object.assign({}, q, patch) : q)));
  }

  /** @returns {Object<string, SendResult>} */
  function getResults() {
    const r = readLocal(RESULTS_KEY, {});
    return r && typeof r === 'object' && !Array.isArray(r) ? r : {};
  }

  /** @param {string} clientId @returns {SendResult|null} */
  function getResult(clientId) {
    return getResults()[clientId] || null;
  }

  /**
   * Registra a situação do envio de uma partida (guarda só as RESULTS_MAX mais recentes).
   * @param {string} clientId
   * @param {Partial<SendResult>} patch
   * @returns {SendResult}
   */
  function setResult(clientId, patch) {
    const all = getResults();
    const next = Object.assign({ state: 'pending', position: null }, all[clientId], patch, { updatedAt: Date.now() });
    all[clientId] = next;
    const ids = Object.keys(all).sort((a, b) => all[b].updatedAt - all[a].updatedAt);
    const kept = {};
    ids.slice(0, RESULTS_MAX).forEach((id) => { kept[id] = all[id]; });
    writeLocal(RESULTS_KEY, kept);
    return next;
  }

  /**
   * Última lista do ranking que chegou (reserva para quando a conexão cair).
   * @returns {{playedOn: string, fetchedAt: number, rows: Object[]}|null}
   */
  function getLastRanking() {
    const v = readLocal(LAST_RANKING_KEY, null);
    return v && Array.isArray(v.rows) && typeof v.fetchedAt === 'number' && typeof v.playedOn === 'string' ? v : null;
  }

  /** @param {{playedOn: string, fetchedAt: number, rows: Object[]}} value */
  function setLastRanking(value) {
    writeLocal(LAST_RANKING_KEY, value);
  }

  window.ChecaAi.storage = {
    startMatch, getMatch, getSignalOrder, saveAnswer, advance, finishMatch, clearMatch,
    isUuid, newId: randomId,
    getQueue, enqueueScore, removeQueued, updateQueued,
    getResult, getResults, setResult, getLastRanking, setLastRanking
  };
})();
