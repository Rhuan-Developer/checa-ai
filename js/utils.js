'use strict';

(function () {
  window.ChecaAi = window.ChecaAi || {};

  const TIME_ZONE = 'America/Sao_Paulo';

  /**
   * Data do dia (AAAA-MM-DD) no fuso America/Sao_Paulo.
   * @param {Date} [date] padrão: agora
   * @returns {string}
   */
  function todayISO(date) {
    const d = date || new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(d);
    const get = (type) => parts.find((p) => p.type === type).value;
    return get('year') + '-' + get('month') + '-' + get('day');
  }

  /**
   * Embaralha (Fisher-Yates) sem alterar a entrada.
   * @template T
   * @param {T[]} array
   * @param {() => number} [random] devolve número em [0,1); padrão Math.random
   * @returns {T[]} cópia embaralhada
   */
  function shuffle(array, random) {
    const rnd = random || Math.random;
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  /**
   * Sorteia um item da lista.
   * @template T
   * @param {T[]} array
   * @param {() => number} [random]
   * @returns {T|undefined} undefined se a lista estiver vazia
   */
  function pickRandom(array, random) {
    if (!array.length) return undefined;
    const rnd = random || Math.random;
    return array[Math.floor(rnd() * array.length)];
  }

  window.ChecaAi.utils = { todayISO, shuffle, pickRandom };
})();
