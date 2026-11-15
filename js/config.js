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
 * @property {number} IDLE_RESET_MS  tela final parada por esse tempo volta sozinha ao início
 * @property {string} SUPABASE_URL  projeto do ranking (público)
 * @property {string} SUPABASE_PUBLISHABLE_KEY  chave pública (publishable); quem protege é o RLS. A secreta nunca entra aqui
 * @property {number} API_TIMEOUT_MS  tempo máximo de cada chamada ao ranking
 * @property {number} MIN_MS_PER_MISSION  partida mais rápida que isso por missão não vai para o ranking (igual ao banco)
 * @property {number} QUEUE_MAX  partidas guardadas sem conexão (descarta a mais antiga)
 * @property {number} QUEUE_RETRY_MS  primeira espera para reenviar; dobra a cada falha
 * @property {number} QUEUE_RETRY_MAX_MS  espera máxima entre reenvios
 * @property {number} RANKING_LIMIT  linhas na tela de ranking (o banco aceita 1 a 50)
 * @property {number} RANKING_REFRESH_MS  atualização automática da tela de ranking
 * @property {number} RANKING_TV_LIMIT  linhas no modo telão
 * @property {number} RANKING_TV_REFRESH_MS  atualização automática do modo telão
 */
window.ChecaAi = window.ChecaAi || {};

/** @type {ChecaAiConfig} */
window.ChecaAi.config = {
  APP_VERSION: '0.6.3',
  MISSIONS_PER_LEVEL_IN_MATCH: 1,
  FEATURES: { simulator: true, missions: true, ranking: true },
  SIM_FANOUT: 3,
  SIM_CHECK_RATE: 0.1,
  SIM_VISUAL_ROUNDS: 5,
  SIM_TOTAL_ROUNDS: 10,
  SIM_PRESENTATION_ROUNDS: 8,
  SIM_ROUND_MS: 1200,
  SIM_COMPARE_CHECK_RATE: 0.3,
  IDLE_RESET_MS: 90000,
  SUPABASE_URL: 'https://uxbjmriuvfjzjxduimbo.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_KQb0z-q83Fyyn_KaqZYXiA_H-NoeUWw',
  API_TIMEOUT_MS: 8000,
  MIN_MS_PER_MISSION: 10000,
  QUEUE_MAX: 20,
  QUEUE_RETRY_MS: 30000,
  QUEUE_RETRY_MAX_MS: 300000,
  RANKING_LIMIT: 20,
  RANKING_REFRESH_MS: 15000,
  RANKING_TV_LIMIT: 10,
  RANKING_TV_REFRESH_MS: 10000
};
