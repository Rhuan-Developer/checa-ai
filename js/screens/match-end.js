'use strict';

(function () {
  window.ChecaAi = window.ChecaAi || {};
  const ChecaAi = window.ChecaAi;
  ChecaAi.screens = ChecaAi.screens || {};

  /** Dicas finais (MISSOES.md, "Antes de compartilhar"). Origem, data, contexto, outras fontes, dúvida. */
  const TIPS = Object.freeze([
    ['Origem', 'quem publicou? É o perfil ou o site oficial?'],
    ['Data', 'quando isso aconteceu? A foto é de agora?'],
    ['Contexto', 'o local, os números e a manchete batem com o original?'],
    ['Outras fontes', 'veículos confiáveis e agências de checagem falam a mesma coisa?'],
    ['Na dúvida, não compartilhe', '']
  ]);

  const IDLE_EVENTS = ['pointerdown', 'keydown', 'scroll'];

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /** Tempo em mm:ss (milissegundos de entrada). */
  function formatDuration(ms) {
    const total = Math.max(0, Math.round(ms / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
  }

  let idleTimer = null;
  let idleHandler = null;

  function stopIdle() {
    if (idleTimer !== null) window.clearTimeout(idleTimer);
    idleTimer = null;
    if (idleHandler) {
      IDLE_EVENTS.forEach((name) => window.removeEventListener(name, idleHandler, true));
      idleHandler = null;
    }
  }

  /** Parada pelo tempo de IDLE_RESET_MS: apaga a partida e volta ao início (estande: próximo visitante). */
  function startIdle() {
    stopIdle();
    const ms = ChecaAi.config.IDLE_RESET_MS;
    idleHandler = () => {
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        stopIdle();
        ChecaAi.storage.clearMatch();
        window.location.hash = '#/inicio';
      }, ms);
    };
    IDLE_EVENTS.forEach((name) => window.addEventListener(name, idleHandler, true));
    idleHandler();
  }

  function stat(label, value) {
    const box = el('div', 'stat');
    box.append(el('dt', 'stat__label', label), el('dd', 'stat__value', value));
    return box;
  }

  /** Fim da partida: pontos, acertos, tempo e dicas "Antes de compartilhar". */
  ChecaAi.screens.matchEnd = {
    id: 'match-end',
    route: '#/fim',
    title: 'Fim da partida',
    feature: 'missions',

    /** Sem partida: início. Partida ainda em andamento: volta para a missão. */
    guard() {
      const match = ChecaAi.storage.getMatch();
      if (!match) return '#/inicio';
      if (match.finishedAt === null) return '#/missao';
      return null;
    },

    mount(sectionEl) {
      sectionEl.textContent = '';
      const match = ChecaAi.storage.getMatch();
      const results = match.answers.map((a) => a.score);
      const total = ChecaAi.scoring.scoreMatch(results);

      const root = el('div', 'game');
      const h1 = el('h1', 'game-title', 'Fim da partida');
      h1.tabIndex = -1;

      const player = el('p', 'end-player', match.nickname);

      const stats = el('dl', 'stats');
      stats.append(
        stat('Pontos', total.total + ' de ' + total.maxTotal),
        stat('Acertos', total.correctVerdicts + ' de ' + total.missions),
        stat('Tempo', formatDuration(match.finishedAt - match.startedAt))
      );

      // Fase 4: posição no ranking do dia entra aqui (ex.: stat('Posição', '3º')).

      const tips = el('section', 'game-block');
      tips.appendChild(el('h2', 'game-block__title', 'Antes de compartilhar'));
      const list = el('ol', 'tips');
      TIPS.forEach((tip) => {
        const item = el('li', 'tips__item');
        if (tip[1]) {
          item.append(el('strong', null, tip[0] + ': '), document.createTextNode(tip[1]));
        } else {
          item.appendChild(el('strong', null, tip[0] + '.'));
        }
        list.appendChild(item);
      });
      tips.appendChild(list);

      const again = el('button', 'btn game-primary', 'Jogar de novo');
      again.type = 'button';
      again.addEventListener('click', () => {
        ChecaAi.storage.clearMatch();
        window.location.hash = '#/apelido';
      });
      const sim = el('a', 'btn btn--secondary game-primary', 'Ver o simulador');
      sim.href = '#/simulador';
      const actions = el('div', 'game-actions');
      actions.append(again);
      if (ChecaAi.config.FEATURES.simulator) actions.append(sim);

      const side = el('div', 'layout-split__side game__col');
      side.append(player, stats, actions);
      const visual = el('div', 'layout-split__visual game__col');
      visual.append(tips);

      const split = el('div', 'layout-split');
      split.append(side, visual);
      root.append(h1, split);
      sectionEl.appendChild(root);

      startIdle();
      return h1;
    },

    unmount: stopIdle
  };

  ChecaAi.screens.matchEnd.formatDuration = formatDuration;
})();
