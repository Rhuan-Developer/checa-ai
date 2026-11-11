'use strict';

(function () {
  window.ChecaAi = window.ChecaAi || {};
  const ChecaAi = window.ChecaAi;
  ChecaAi.screens = ChecaAi.screens || {};

  const OUTCOME_LABELS = Object.freeze({
    found: 'Você achou',
    missed: 'Você não viu',
    trap: 'Caiu na isca',
    ok: 'Evitou a isca'
  });

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function block(title, className) {
    const section = el('section', 'game-block' + (className ? ' ' + className : ''));
    section.appendChild(el('h2', 'game-block__title', title));
    return section;
  }

  function buildSignals(mission, score) {
    const section = block('Os sinais');
    const list = el('ul', 'result-signals');
    score.perSignal.forEach((r) => {
      const item = el('li', 'result-signals__item');
      item.dataset.outcome = r.outcome;
      item.appendChild(el('p', 'result-signals__text', mission.signals[r.index].text));
      const meta = el('p', 'result-signals__meta');
      meta.append(
        el('span', 'tag', r.isSuspicious ? 'Suspeito' : 'Isca'),
        el('span', 'tag', r.marked ? 'Marcado' : 'Não marcado'),
        el('span', 'result-signals__outcome', OUTCOME_LABELS[r.outcome])
      );
      item.appendChild(meta);
      list.appendChild(item);
    });
    section.appendChild(list);
    return section;
  }

  function buildPoints(score) {
    const section = block('Pontos da missão');
    const list = el('dl', 'points');
    [
      ['Veredito', score.verdictPoints],
      ['Sinais', score.signalPoints],
      ['Conclusão', score.completionPoints]
    ].forEach((row) => {
      const line = el('div', 'points__row');
      line.append(el('dt', null, row[0]), el('dd', null, String(row[1])));
      list.appendChild(line);
    });
    const total = el('div', 'points__row points__row--total');
    total.append(
      el('dt', null, 'Total da missão'),
      el('dd', null, score.total + ' de ' + ChecaAi.scoring.SCORING.MISSION_MAX)
    );
    list.appendChild(total);
    section.appendChild(list);
    return section;
  }

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

    mount(sectionEl) {
      sectionEl.textContent = '';
      const match = ChecaAi.storage.getMatch();
      const answer = match.answers[match.index];
      const mission = ChecaAi.missions.getMissionById(answer.missionId);
      const score = answer.score;
      const isLast = match.index === match.missionIds.length - 1;

      const root = el('div', 'game');
      const h1 = el('h1', 'game-title', score.verdictCorrect ? 'Acertou' : 'Errou');
      h1.tabIndex = -1;

      const verdictBox = el('p', 'verdict-box');
      verdictBox.dataset.verdict = mission.verdict;
      verdictBox.append(
        el('span', 'verdict-box__intro', 'Veredito certo: '),
        el('span', 'verdict-box__label', ChecaAi.missions.VERDICT_LABELS[mission.verdict])
      );
      const yours = el('p', 'result-yours', 'Seu veredito: ' + ChecaAi.missions.VERDICT_LABELS[answer.verdict]);

      const explanation = block('Gabarito comentado');
      explanation.appendChild(el('p', 'game-text', mission.explanation));
      const protect = block('Como se proteger');
      protect.appendChild(el('p', 'game-text', mission.howToProtect));
      const reference = el('p', 'result-reference', 'Cartilha do CERT.br: ' + mission.reference);

      const next = el('button', 'btn game-primary', isLast ? 'Ver resultado final' : 'Próxima missão');
      next.type = 'button';
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

      const side = el('div', 'layout-split__side game__col');
      side.append(verdictBox, yours, explanation, protect, reference);
      const visual = el('div', 'layout-split__visual game__col');
      visual.append(buildSignals(mission, score), buildPoints(score), next);

      const split = el('div', 'layout-split');
      split.append(side, visual);
      root.append(h1, split);
      sectionEl.appendChild(root);
      return h1;
    }
  };
})();
