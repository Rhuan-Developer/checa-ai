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
  let stopRankWatch = null;

  /**
   * Texto curto da situação do envio ao ranking ('' = não mostra nada).
   * @param {Object|null} result SendResult (storage.js)
   * @param {Object|null} queued item da fila, se ainda estiver nela
   * @param {boolean} online navigator.onLine
   * @returns {string}
   */
  function rankStatusText(result, queued, online) {
    if (!result) return '';
    if (result.state === 'sent') {
      return result.position ? 'Você está em ' + result.position + 'º no ranking de hoje.' : 'Pontuação enviada ao ranking.';
    }
    if (result.state === 'pending') {
      return !online || (queued && queued.attempts > 0)
        ? 'Pontuação salva. Vai pro ranking quando a internet voltar.'
        : 'Enviando para o ranking…';
    }
    return ''; // recusada ou não enviada (ex.: partida rápida demais): sem aviso
  }

  function stopRank() {
    if (stopRankWatch) stopRankWatch();
    stopRankWatch = null;
  }

  function teardown() {
    stopIdle();
    stopRank();
  }

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

      const icon = ChecaAi.utils.icon;
      const labels = ChecaAi.missions.LEVEL_LABELS;
      const root = el('div', 'end');

      const head = el('header', 'end__head');
      head.appendChild(el('p', 'kicker', 'Partida concluída'));
      const h1 = el('h1', 'end__title', 'Fim da partida');
      h1.tabIndex = -1;
      head.append(h1, el('p', 'end__player', match.nickname));

      const grid = el('div', 'end__grid');

      // Placar: total de 600 e barra
      const scoreCard = el('section', 'scorecard');
      scoreCard.appendChild(el('p', 'kicker', 'Pontuação'));
      const big = el('p', 'bignum');
      big.append(String(total.total), el('small', null, ' de ' + total.maxTotal));
      const bar = el('div', 'bar');
      bar.setAttribute('aria-hidden', 'true');
      const fill = el('span');
      fill.style.width = (total.maxTotal > 0 ? Math.max(0, Math.min(100, (total.total / total.maxTotal) * 100)) : 0) + '%';
      bar.appendChild(fill);
      scoreCard.append(big, bar);

      // Posição: só aparece quando o envio devolveu a posição real
      const placeCard = el('section', 'placecard');
      placeCard.hidden = true;
      placeCard.appendChild(el('p', 'kicker', 'Ranking do dia'));
      const place = el('p', 'place', 'Você está em');
      const placeNumber = el('strong', null, '');
      place.appendChild(placeNumber);
      placeCard.appendChild(place);

      // Ranking do dia: entra na fila uma vez (pelo clientId da partida) e mostra a situação do envio
      const rankStatus = el('p', 'end__rank');
      rankStatus.setAttribute('aria-live', 'polite');
      if (ChecaAi.config.FEATURES.ranking && ChecaAi.api) {
        const render = () => {
          const result = ChecaAi.storage.getResult(match.clientId);
          const queued = ChecaAi.storage.getQueue().find((q) => q.clientId === match.clientId) || null;
          const hasPosition = !!(result && result.state === 'sent' && result.position);
          placeNumber.textContent = hasPosition ? result.position + 'º' : '';
          placeCard.hidden = !hasPosition;
          grid.classList.toggle('end__grid--place', hasPosition);
          // Com a posição no cartão, a frase "Você está em Nº" seria repetição
          const text = hasPosition ? '' : rankStatusText(result, queued, navigator.onLine !== false);
          rankStatus.textContent = text;
          rankStatus.hidden = !text;
          rankStatus.dataset.state = result ? result.state : '';
        };
        try {
          ChecaAi.api.recordMatch(match);
        } catch (err) {
          console.error('Não deu para guardar a partida para o ranking.', err);
        }
        stopRank();
        const off = ChecaAi.api.onChange(render);
        const onNet = () => render();
        window.addEventListener('online', onNet);
        window.addEventListener('offline', onNet);
        stopRankWatch = () => {
          off();
          window.removeEventListener('online', onNet);
          window.removeEventListener('offline', onNet);
        };
        render();
      } else {
        rankStatus.hidden = true;
      }

      // Suas missões: nível, resultado e pontos de cada uma; depois acertos e tempo
      const missions = el('section', 'block end__missions');
      missions.appendChild(el('h2', 'block__title', 'Suas missões'));
      const list = el('ul', 'mlist');
      match.answers.forEach((a) => {
        const mission = ChecaAi.missions.getMissionById(a.missionId);
        const ok = !!a.score.verdictCorrect;
        const item = el('li');
        const mark = el('span', 'mark mark--' + (ok ? 'ok' : 'bad'));
        mark.appendChild(icon(ok ? 'check' : 'x', 16));
        const info = el('div');
        info.append(el('b', null, mission ? mission.title : a.missionId), el('small', null, (mission ? labels[mission.level] + ' · ' : '') + (ok ? 'Acertou' : 'Errou')));
        item.append(mark, info, el('b', null, String(a.score.total)));
        list.appendChild(item);
      });
      const stats = el('dl', 'mstats');
      [['Acertos', total.correctVerdicts + ' de ' + total.missions], ['Tempo', formatDuration(match.finishedAt - match.startedAt)]].forEach((row) => {
        const box = el('div');
        box.append(el('dt', 'label', row[0]), el('dd', null, row[1]));
        stats.appendChild(box);
      });
      missions.append(list, stats);

      grid.append(scoreCard, placeCard, missions);

      const tips = el('section', 'block');
      tips.appendChild(el('h2', 'block__title', 'Antes de compartilhar'));
      const tipList = el('ol', 'tips');
      TIPS.forEach((tip) => {
        const item = el('li', 'tips__item');
        if (tip[1]) {
          item.append(el('strong', null, tip[0] + ': '), document.createTextNode(tip[1]));
        } else {
          item.appendChild(el('strong', null, tip[0] + '.'));
        }
        tipList.appendChild(item);
      });
      tips.appendChild(tipList);

      const actions = el('div', 'end__actions');
      if (ChecaAi.config.FEATURES.ranking) {
        const rank = el('a', 'btn btn--xl');
        rank.href = '#/ranking';
        rank.append(icon('trophy'), 'Ver o ranking');
        actions.append(rank);
      }
      const again = el('button', 'btn btn--secondary btn--xl');
      again.type = 'button';
      again.append(icon('repeat'), 'Jogar de novo');
      again.addEventListener('click', () => {
        ChecaAi.storage.clearMatch();
        window.location.hash = '#/apelido';
      });
      actions.append(again);
      if (ChecaAi.config.FEATURES.simulator) {
        const sim = el('a', 'btn btn--secondary btn--xl');
        sim.href = '#/simulador';
        sim.append(icon('tree'), 'Ver o simulador');
        actions.append(sim);
      }

      root.append(head, grid, rankStatus, tips, actions);
      sectionEl.appendChild(root);

      startIdle();
      return h1;
    },

    unmount: teardown
  };

  ChecaAi.screens.matchEnd.formatDuration = formatDuration;
  ChecaAi.screens.matchEnd.rankStatusText = rankStatusText;
})();
