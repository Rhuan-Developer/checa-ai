'use strict';

(function () {
  window.ChecaAi = window.ChecaAi || {};
  const ChecaAi = window.ChecaAi;
  ChecaAi.screens = ChecaAi.screens || {};

  /** Marca de cada sinal: ícone + texto (nunca só cor). kind: ok | bad | neutral. */
  const OUTCOMES = Object.freeze({
    found: { kind: 'ok', icon: 'check', text: 'Você marcou. Certo!' },
    missed: { kind: 'bad', icon: 'x', text: 'Faltou marcar' },
    trap: { kind: 'bad', icon: 'x', text: 'Era isca. Você marcou.' },
    ok: { kind: 'neutral', icon: 'check', text: 'Não era sinal. Bem deixado de lado.' }
  });

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function block(title) {
    const section = el('section', 'block');
    section.appendChild(el('h2', 'block__title', title));
    return section;
  }

  function buildSignals(mission, score) {
    const icon = ChecaAi.utils.icon;
    const section = block('Sinais');
    const list = el('ul', 'review');
    score.perSignal.forEach((r) => {
      const o = OUTCOMES[r.outcome];
      const item = el('li');
      item.dataset.outcome = r.outcome;
      const mark = el('span', 'mark mark--' + o.kind);
      mark.appendChild(icon(o.icon, 16));
      const body = el('div', 'review__body');
      body.append(el('span', 'review__text', mission.signals[r.index].text), el('span', 'review__tag is-' + o.kind, o.text));
      item.append(mark, body);
      list.appendChild(item);
    });
    section.appendChild(list);
    return section;
  }

  function buildPoints(score) {
    const max = ChecaAi.scoring.SCORING.MISSION_MAX;
    const found = score.perSignal.filter((r) => r.outcome === 'found').length;
    const suspicious = score.perSignal.filter((r) => r.isSuspicious).length;
    const section = block('Pontos');
    const list = el('ul', 'points');
    [
      ['Veredito', score.verdictPoints],
      ['Sinais (' + found + ' de ' + suspicious + ')', score.signalPoints],
      ['Conclusão', score.completionPoints]
    ].forEach((row) => {
      const line = el('li');
      line.append(el('span', null, row[0]), el('b', null, '+' + row[1]));
      list.appendChild(line);
    });
    const total = el('p', 'total');
    total.append(el('strong', null, String(score.total)), el('span', null, 'de ' + max));
    const bar = el('div', 'bar');
    bar.setAttribute('aria-hidden', 'true');
    const fill = el('span');
    fill.style.width = Math.max(0, Math.min(100, (score.total / max) * 100)) + '%';
    bar.appendChild(fill);
    section.append(list, total, bar);
    return section;
  }

  /** Pontos acumulados da partida (inclui esta missão), para a pílula da barra superior. */
  function pointsSoFar(match) {
    return match.answers.reduce((sum, a) => sum + (a && a.score && Number.isFinite(a.score.total) ? a.score.total : 0), 0);
  }

  let cleanup = null;

  /** Resultado da missão que acabou de ser respondida. */
  ChecaAi.screens.missionResult = {
    id: 'mission-result',
    route: '#/resultado-missao',
    title: 'Resultado da missão',
    feature: 'missions',

    /** Sem partida: início. Missão atual ainda sem resposta: volta para ela (ou para o fim, se a partida acabou). */
    guard() {
      const match = ChecaAi.storage.getMatch();
      if (!match) return '#/inicio';
      if (!match.answers[match.index]) return match.finishedAt !== null ? '#/fim' : '#/missao';
      return null;
    },

    /** Tira da barra superior a pílula de pontos. */
    unmount() {
      if (cleanup) {
        cleanup();
        cleanup = null;
      }
    },

    mount(sectionEl) {
      if (cleanup) {
        cleanup();
        cleanup = null;
      }
      const icon = ChecaAi.utils.icon;
      sectionEl.textContent = '';
      const match = ChecaAi.storage.getMatch();
      const answer = match.answers[match.index];
      const mission = ChecaAi.missions.getMissionById(answer.missionId);
      const score = answer.score;
      const isLast = match.index === match.missionIds.length - 1;
      const labels = ChecaAi.missions.VERDICT_LABELS;

      // Pontos acumulados na barra superior (a tela tira a pílula ao sair)
      const points = pointsSoFar(match);
      const headerTools = document.getElementById('app-header-tools');
      const scorePill = el('span', 'pill');
      scorePill.setAttribute('aria-label', points + ' pontos');
      scorePill.append(icon('trophy', 20), points + ' pts');
      if (headerTools) headerTools.appendChild(scorePill);
      cleanup = () => scorePill.remove();

      const root = el('div', 'result');

      // Faixa de resultado: ícone, sobretítulo, título e veredito dado x correto
      const banner = el('div', 'result__banner result__banner--' + (score.verdictCorrect ? 'ok' : 'bad'));
      const bannerIcon = el('span', 'result__icon');
      bannerIcon.appendChild(icon(score.verdictCorrect ? 'check' : 'x', 34));
      const bannerBody = el('div', 'result__body');
      bannerBody.appendChild(el('p', 'kicker', 'Missão ' + (match.index + 1) + ' de ' + match.missionIds.length));
      const h1 = el('h1', 'result__title', score.verdictCorrect ? 'Acertou!' : 'Não foi dessa vez');
      h1.tabIndex = -1;
      const verdictLine = el('p');
      if (score.verdictCorrect) {
        verdictLine.append('É ', el('b', null, labels[mission.verdict]), '.');
      } else {
        verdictLine.append('Você marcou ', el('b', null, labels[answer.verdict]), '. O certo é ', el('b', null, labels[mission.verdict]), '.');
      }
      bannerBody.append(h1, verdictLine);
      banner.append(bannerIcon, bannerBody);

      const explanation = block('Gabarito comentado');
      explanation.appendChild(el('p', 'result__text', mission.explanation));
      const protect = block('Como se proteger');
      protect.appendChild(el('p', 'result__text', mission.howToProtect));
      protect.appendChild(el('p', 'result__reference', 'Cartilha do CERT.br: ' + mission.reference));

      const next = el('button', 'btn btn--xl');
      next.type = 'button';
      next.append(isLast ? 'Ver resultado final' : 'Próxima missão', icon('arrow'));
      next.addEventListener('click', () => {
        if (isLast) {
          if (!ChecaAi.storage.finishMatch()) {
            console.error('A partida não pôde ser encerrada: falta resposta em alguma missão.');
            window.location.hash = '#/missao';
            return;
          }
          window.location.hash = '#/fim';
        } else {
          ChecaAi.storage.advance();
          window.location.hash = '#/missao';
        }
      });

      // Duas colunas equilibradas: gabarito + sinais | proteção + pontos + botão
      const left = el('div', 'result__col');
      left.append(explanation, buildSignals(mission, score));
      const right = el('div', 'result__col');
      const actions = el('div', 'result__actions');
      actions.appendChild(next);
      right.append(protect, buildPoints(score), actions);
      const grid = el('div', 'result__grid');
      grid.append(left, right);

      root.append(banner, grid);
      sectionEl.appendChild(root);
      return h1;
    }
  };
})();
