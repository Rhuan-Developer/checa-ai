'use strict';

/**
 * Configuração do site. Única fonte da versão (APP_VERSION) e dos interruptores de funcionalidade.
 * @typedef {Object} ChecaAiConfig
 * @property {string} APP_VERSION  versão do app (a tag git é igual)
 * @property {number} MISSIONS_PER_LEVEL_IN_MATCH  missões sorteadas por nível em cada partida
 * @property {{simulator: boolean, missions: boolean, ranking: boolean}} FEATURES  telas desligadas não aparecem
 */
window.ChecaAi = window.ChecaAi || {};

/** @type {ChecaAiConfig} */
window.ChecaAi.config = {
  APP_VERSION: '0.2.0',
  MISSIONS_PER_LEVEL_IN_MATCH: 1,
  FEATURES: { simulator: true, missions: false, ranking: false }
};
