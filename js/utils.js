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

  const NICKNAME_MIN = 2;
  const NICKNAME_MAX = 20;
  const NICKNAME_PATTERN = /^[\p{L}\p{N} ]+$/u;

  // Palavrões comuns, sem acento e em minúsculas. Fica interna; a regra é espelhada no banco na Fase 4.
  // Por palavra inteira (palavras curtas ou que aparecem dentro de palavras comuns, como "puta" em "computador").
  const BLOCKED_WORDS = ['cu', 'puta', 'puto', 'putaria', 'viado', 'viada', 'bosta', 'otario', 'otaria', 'idiota',
    'fdp', 'pqp', 'vsf', 'tnc', 'vtnc', 'foda', 'fodase', 'cuzao', 'babaca', 'imbecil', 'retardado', 'retardada',
    'cacete', 'corno', 'vagabunda', 'vagabundo', 'prostituta', 'nazista', 'estuprador'];
  // Por trecho colado (tira os espaços antes de comparar): só as mais graves e sem risco de aparecer em palavras comuns.
  const BLOCKED_PARTS = ['merda', 'porra', 'caralho', 'buceta', 'punheta', 'arrombad', 'xereca', 'piroca', 'fodase', 'foder'];

  /** Minúsculas e sem acento, para comparar. */
  function foldText(text) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  /**
   * Valida e normaliza o apelido do visitante.
   * Regra (a mesma será validada no banco na Fase 4): tira espaços das pontas e junta espaços repetidos;
   * 2 a 20 caracteres; só letras (com acento), números e espaço; sem palavras da lista de bloqueio
   * (comparação sem acento e sem diferença de maiúsculas, por palavra e por trecho colado nas mais graves).
   * @param {string} text
   * @returns {{ok: boolean, value: string, error: string}} value é o apelido normalizado; error vazio se ok
   */
  function validateNickname(text) {
    const value = String(text === undefined || text === null ? '' : text)
      .normalize('NFC').replace(/\s+/g, ' ').trim();
    const length = Array.from(value).length;
    if (length < NICKNAME_MIN || length > NICKNAME_MAX) {
      return { ok: false, value, error: 'Use de ' + NICKNAME_MIN + ' a ' + NICKNAME_MAX + ' caracteres.' };
    }
    if (!NICKNAME_PATTERN.test(value)) {
      return { ok: false, value, error: 'Só letras, números e espaço.' };
    }
    const folded = foldText(value);
    const blocked = folded.split(' ').some((w) => BLOCKED_WORDS.indexOf(w) !== -1) ||
      BLOCKED_PARTS.some((part) => folded.replace(/ /g, '').indexOf(part) !== -1);
    if (blocked) {
      return { ok: false, value, error: 'Escolha outro apelido.' };
    }
    return { ok: true, value, error: '' };
  }

  window.ChecaAi.utils = { todayISO, shuffle, pickRandom, validateNickname };
})();
