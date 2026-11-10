'use strict';

/**
 * Configuração do site. Única fonte da versão (APP_VERSION) e dos interruptores de funcionalidade.
 * @typedef {Object} ChecaAiConfig
 * @property {string} APP_VERSION  versão do app (a tag git é igual)
 * @property {number} MISSIONS_PER_LEVEL_IN_MATCH  missões sorteadas por nível em cada partida
 * @property {{simulator: boolean, missions: boolean, ranking: boolean}} FEATURES  telas desligadas não aparecem
 * @property {number} SIM_FANOUT  repasses por pessoa no simulador (ajuste 2 a 5)
 * @property {number} SIM_CHECK_RATE  fração que checa antes de repassar (ajuste 0 a 0.8, passo 0.1)
 * @property {number} SIM_VISUAL_ROUNDS  rodadas desenhadas na árvore
 * @property {number} SIM_TOTAL_ROUNDS  rodadas da comparação final (esperado)
 * @property {number} SIM_PRESENTATION_ROUNDS  última rodada mostrada na tela (árvore + visão de multidão)
 * @property {number} SIM_ROUND_MS  intervalo entre rodadas fora do modo apresentação
 * @property {number} SIM_COMPARE_CHECK_RATE  fração que checa na comparação final
 */
window.ChecaAi = window.ChecaAi || {};

/** @type {ChecaAiConfig} */
window.ChecaAi.config = {
  APP_VERSION: '0.3.1',
  MISSIONS_PER_LEVEL_IN_MATCH: 1,
  FEATURES: { simulator: true, missions: false, ranking: false },
  SIM_FANOUT: 3,
  SIM_CHECK_RATE: 0.1,
  SIM_VISUAL_ROUNDS: 5,
  SIM_TOTAL_ROUNDS: 10,
  SIM_PRESENTATION_ROUNDS: 8,
  SIM_ROUND_MS: 1200,
  SIM_COMPARE_CHECK_RATE: 0.3
};
