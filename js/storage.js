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
   * @property {string} clientId  identifica a partida (uso futuro: envio ao ranking)
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
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
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

  window.ChecaAi.storage = { startMatch, getMatch, getSignalOrder, saveAnswer, advance, finishMatch, clearMatch };
})();
