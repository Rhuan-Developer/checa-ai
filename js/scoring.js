'use strict';

(function () {
  window.ChecaAi = window.ChecaAi || {};

  /**
   * Pontuação de uma missão (máximo 200).
   * @typedef {Object} ScoringRules
   * @property {number} VERDICT_POINTS  veredito certo
   * @property {number} SIGNALS_POINTS  total dividido entre os sinais suspeitos
   * @property {number} TRAP_PENALTY  desconto por isca marcada
   * @property {number} COMPLETION_POINTS  concluir a missão
   * @property {number} MISSION_MAX
   *
   * @typedef {Object} SignalResult
   * @property {number} index  posição do sinal na missão (ordem de missions-data.js)
   * @property {boolean} isSuspicious
   * @property {boolean} marked
   * @property {'found'|'missed'|'trap'|'ok'} outcome  found = suspeito marcado; missed = suspeito não marcado;
   *   trap = isca marcada; ok = isca não marcada
   *
   * @typedef {Object} MissionScore
   * @property {boolean} verdictCorrect
   * @property {number} verdictPoints  100 ou 0
   * @property {number} signalPoints  0 a 80
   * @property {number} completionPoints  20
   * @property {number} total  0 a 200
   * @property {SignalResult[]} perSignal
   *
   * @typedef {Object} MatchScore
   * @property {number} total
   * @property {number} maxTotal  200 por missão
   * @property {number} correctVerdicts
   * @property {number} missions
   */

  /** @type {Readonly<ScoringRules>} */
  const SCORING = Object.freeze({
    VERDICT_POINTS: 100,
    SIGNALS_POINTS: 80,
    TRAP_PENALTY: 20,
    COMPLETION_POINTS: 20,
    MISSION_MAX: 200
  });

  const VERDICTS = ['true', 'false', 'misleading', 'unproven'];

  /**
   * Pontos de cada sinal suspeito. Os 80 pontos são divididos igualmente; o resto da divisão vai
   * de 1 em 1 para os primeiros suspeitos, na ordem em que aparecem na missão.
   * Ex.: 3 suspeitos -> [27, 27, 26]; 2 -> [40, 40]; 4 -> [20, 20, 20, 20]. A soma é sempre 80.
   * @param {number} suspiciousCount
   * @returns {number[]}
   */
  function splitSignalPoints(suspiciousCount) {
    if (!Number.isInteger(suspiciousCount) || suspiciousCount <= 0) return [];
    const base = Math.floor(SCORING.SIGNALS_POINTS / suspiciousCount);
    const rest = SCORING.SIGNALS_POINTS % suspiciousCount;
    const parts = [];
    for (let k = 0; k < suspiciousCount; k++) parts.push(base + (k < rest ? 1 : 0));
    return parts;
  }

  /**
   * Calcula a pontuação de uma missão. Função pura.
   * Índices fora da faixa, repetidos ou que não são inteiros são ignorados.
   * @param {{verdict: string, signals: {isSuspicious: boolean}[]}} mission
   * @param {{verdict: string, markedSignalIndexes?: number[]}} answer
   * @returns {MissionScore}
   */
  function scoreMission(mission, answer) {
    if (!mission || !Array.isArray(mission.signals)) {
      throw new Error('scoreMission: missão inválida (sem lista de sinais).');
    }
    if (!answer || VERDICTS.indexOf(answer.verdict) === -1) {
      throw new Error('scoreMission: veredito desconhecido. Use um de: ' + VERDICTS.join(', ') + '.');
    }
    const marked = new Set();
    const rawIndexes = Array.isArray(answer.markedSignalIndexes) ? answer.markedSignalIndexes : [];
    rawIndexes.forEach((i) => {
      if (Number.isInteger(i) && i >= 0 && i < mission.signals.length) marked.add(i);
    });

    const suspiciousCount = mission.signals.filter((s) => s.isSuspicious).length;
    const parts = splitSignalPoints(suspiciousCount);
    let suspiciousRank = 0;
    let earned = 0;
    let penalty = 0;

    const perSignal = mission.signals.map((signal, index) => {
      const isMarked = marked.has(index);
      let outcome;
      if (signal.isSuspicious) {
        if (isMarked) earned += parts[suspiciousRank];
        suspiciousRank++;
        outcome = isMarked ? 'found' : 'missed';
      } else {
        if (isMarked) penalty += SCORING.TRAP_PENALTY;
        outcome = isMarked ? 'trap' : 'ok';
      }
      return { index, isSuspicious: !!signal.isSuspicious, marked: isMarked, outcome };
    });

    const verdictCorrect = answer.verdict === mission.verdict;
    const verdictPoints = verdictCorrect ? SCORING.VERDICT_POINTS : 0;
    const signalPoints = Math.max(0, earned - penalty);
    const completionPoints = SCORING.COMPLETION_POINTS;
    return {
      verdictCorrect,
      verdictPoints,
      signalPoints,
      completionPoints,
      total: verdictPoints + signalPoints + completionPoints,
      perSignal
    };
  }

  /**
   * Soma as missões de uma partida. Função pura.
   * @param {MissionScore[]} results
   * @returns {MatchScore}
   */
  function scoreMatch(results) {
    if (!Array.isArray(results)) {
      throw new Error('scoreMatch: esperava uma lista de resultados de missão.');
    }
    return {
      total: results.reduce((sum, r) => sum + r.total, 0),
      maxTotal: SCORING.MISSION_MAX * results.length,
      correctVerdicts: results.filter((r) => r.verdictCorrect).length,
      missions: results.length
    };
  }

  window.ChecaAi.scoring = { SCORING, splitSignalPoints, scoreMission, scoreMatch };
})();
