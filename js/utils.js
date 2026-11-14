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
  // Igual ao banco (submit_score): depois de tirar os acentos só pode sobrar a-z, 0-9 e espaço.
  // Aceita todo o português (á, ç, õ...); recusa outras escritas (grego, cirílico), símbolos e emoji.
  const NICKNAME_FOLDED_PATTERN = /^[a-z0-9 ]+$/;
  // Só espaço, tab e quebras ASCII viram espaço (como no banco); espaço Unicode (ex.: NBSP) é recusado
  const ASCII_SPACES = new RegExp('[' + [32, 9, 10, 11, 12, 13].map((c) => String.fromCharCode(c)).join('') + ']+', 'g');
  // Acentos combinantes U+0300 a U+036F (montado por código para não depender de caractere invisível no arquivo)
  const COMBINING_MARKS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
  const HAS_COMBINING_MARK = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']');

  // Palavrões comuns, sem acento e em minúsculas. Fica interna; a regra é espelhada no banco na Fase 4.
  // Por palavra inteira (palavras curtas ou que aparecem dentro de palavras comuns, como "puta" em "computador").
  const BLOCKED_WORDS = ['cu', 'puta', 'puto', 'putaria', 'viado', 'viada', 'bosta', 'otario', 'otaria', 'idiota',
    'fdp', 'pqp', 'vsf', 'tnc', 'vtnc', 'foda', 'fodase', 'cuzao', 'babaca', 'imbecil', 'retardado', 'retardada',
    'cacete', 'corno', 'vagabunda', 'vagabundo', 'prostituta', 'nazista', 'estuprador'];
  // Por trecho colado (tira os espaços antes de comparar): só as mais graves e sem risco de aparecer em palavras comuns.
  const BLOCKED_PARTS = ['merda', 'porra', 'caralho', 'buceta', 'punheta', 'arrombad', 'xereca', 'piroca', 'fodase', 'foder'];

  /** Minúsculas e sem acento, para comparar. */
  function foldText(text) {
    return text.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase();
  }

  /**
   * Valida e normaliza o apelido do visitante.
   * Regra igual à do banco (submit_score, supabase/migrations/001_ranking.sql; mudou um, muda o outro):
   * NFC, tira espaços das pontas e junta espaços repetidos; 2 a 20 caracteres; sem acento solto (empilhado);
   * sem acento, só a-z, 0-9 e espaço; sem palavras da lista de bloqueio
   * (comparação sem acento e sem diferença de maiúsculas, por palavra e por trecho colado nas mais graves).
   * @param {string} text
   * @returns {{ok: boolean, value: string, error: string}} value é o apelido normalizado; error vazio se ok
   */
  function validateNickname(text) {
    const value = String(text === undefined || text === null ? '' : text)
      .normalize('NFC').replace(ASCII_SPACES, ' ').trim();
    const length = Array.from(value).length;
    if (length < NICKNAME_MIN || length > NICKNAME_MAX) {
      return { ok: false, value, error: 'Use de ' + NICKNAME_MIN + ' a ' + NICKNAME_MAX + ' caracteres.' };
    }
    const folded = foldText(value);
    if (HAS_COMBINING_MARK.test(value) || !NICKNAME_FOLDED_PATTERN.test(folded)) {
      return { ok: false, value, error: 'Só letras, números e espaço.' };
    }
    const blocked = folded.split(' ').some((w) => BLOCKED_WORDS.indexOf(w) !== -1) ||
      BLOCKED_PARTS.some((part) => folded.replace(/ /g, '').indexOf(part) !== -1);
    if (blocked) {
      return { ok: false, value, error: 'Escolha outro apelido.' };
    }
    return { ok: true, value, error: '' };
  }

  /**
   * Hora no fuso America/Sao_Paulo (ex.: "14:05" ou "14:05:09").
   * @param {Date|number} [date] padrão: agora
   * @param {boolean} [withSeconds]
   * @returns {string}
   */
  function formatClock(date, withSeconds) {
    const d = date === undefined ? new Date() : new Date(date);
    const opts = { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
    if (withSeconds) opts.second = '2-digit';
    return new Intl.DateTimeFormat('pt-BR', opts).format(d);
  }

  window.ChecaAi.utils = { todayISO, shuffle, pickRandom, validateNickname, formatClock };
})();
