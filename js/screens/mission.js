'use strict';

(function () {
  window.ChecaAi = window.ChecaAi || {};
  const ChecaAi = window.ChecaAi;
  ChecaAi.screens = ChecaAi.screens || {};

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /** Ferramentas de investigação: cada botão abre e fecha a sua pista. */
  function buildTools(mission) {
    const section = el('section', 'game-block');
    const heading = el('h2', 'game-block__title', 'Ferramentas de investigação');
    const list = el('ul', 'tools');
    mission.tools.forEach((tool, i) => {
      const item = el('li', 'tools__item');
      const button = el('button', 'tool-btn', tool.label);
      button.type = 'button';
      button.setAttribute('aria-expanded', 'false');
      const clueId = 'clue-' + mission.id + '-' + i;
      button.setAttribute('aria-controls', clueId);
      const clue = el('p', 'tools__clue', tool.clue);
      clue.id = clueId;
      clue.hidden = true;
      button.addEventListener('click', () => {
        const open = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', String(open));
        clue.hidden = !open;
      });
      item.append(button, clue);
      list.appendChild(item);
    });
    section.append(heading, list);
    return section;
  }

  /**
   * Sinais marcáveis, na ordem embaralhada da partida.
   * @param {Set<number>} marked índices marcados (alterado pelos botões)
   */
  function buildSignals(mission, order, marked) {
    const section = el('section', 'game-block');
    const heading = el('h2', 'game-block__title', 'O que é suspeito aqui?');
    const list = el('ul', 'signals');
    order.forEach((signalIndex) => {
      const item = el('li', 'signals__item');
      const button = el('button', 'toggle');
      button.type = 'button';
      button.setAttribute('aria-pressed', 'false');
      button.append(el('span', 'toggle__box'), el('span', 'toggle__text', mission.signals[signalIndex].text));
      button.addEventListener('click', () => {
        const on = !marked.has(signalIndex);
        if (on) marked.add(signalIndex); else marked.delete(signalIndex);
        button.setAttribute('aria-pressed', String(on));
      });
      item.appendChild(button);
      list.appendChild(item);
    });
    section.append(heading, list);
    return section;
  }

  /** Veredito: escolha única com botões de rádio nativos (setas e foco funcionam sozinhos). */
  function buildVerdict(onChange) {
    const fieldset = el('fieldset', 'game-block verdict');
    fieldset.appendChild(el('legend', 'game-block__title', 'Seu veredito'));
    const labels = ChecaAi.missions.VERDICT_LABELS;
    Object.keys(labels).forEach((key) => {
      const choice = el('label', 'choice');
      const radio = el('input', 'choice__input');
      radio.type = 'radio';
      radio.name = 'verdict';
      radio.value = key;
      radio.addEventListener('change', () => onChange(key));
      choice.append(radio, el('span', 'choice__dot'), el('span', 'choice__text', labels[key]));
      fieldset.appendChild(choice);
    });
    return fieldset;
  }

  /** Missão atual da partida: investigar, marcar os sinais e dar o veredito. */
  ChecaAi.screens.mission = {
    id: 'mission',
    route: '#/missao',
    title: 'Missão',
    feature: 'missions',

    /** Sem partida: início. Partida encerrada: fim. Missão já respondida (voltar do navegador): o resultado dela. */
    guard() {
      const match = ChecaAi.storage.getMatch();
      if (!match) return '#/inicio';
      if (match.finishedAt !== null) return '#/fim';
      if (match.answers[match.index]) return '#/resultado-missao';
      return null;
    },

    mount(sectionEl) {
      sectionEl.textContent = '';
      const match = ChecaAi.storage.getMatch();
      const mission = ChecaAi.missions.getMissionById(match.missionIds[match.index]);
      if (!mission) {
        console.error('Missão não encontrada:', match.missionIds[match.index]);
        sectionEl.textContent = 'Não deu para abrir esta missão. Volte ao início e comece de novo.';
        return null;
      }

      const root = el('div', 'game');
      const h1 = el('h1', 'game-title',
        'Missão ' + (match.index + 1) + ' de ' + match.missionIds.length + ' · ' + ChecaAi.missions.LEVEL_LABELS[mission.level]);
      h1.tabIndex = -1;

      const marked = new Set();
      let verdict = null;

      const submit = el('button', 'btn game-primary', 'Enviar veredito');
      submit.type = 'button';
      submit.disabled = true;
      const error = el('p', 'field__error');
      error.setAttribute('aria-live', 'polite');

      const order = ChecaAi.storage.getSignalOrder(mission.id, mission.signals.length);

      submit.addEventListener('click', () => {
        if (!verdict) return;
        try {
          const markedSignalIndexes = Array.from(marked).sort((a, b) => a - b);
          const score = ChecaAi.scoring.scoreMission(mission, { verdict, markedSignalIndexes });
          ChecaAi.storage.saveAnswer(mission.id, { verdict, markedSignalIndexes, score });
        } catch (err) {
          console.error('Não deu para registrar o veredito:', err);
          error.textContent = 'Não deu para registrar o veredito. Tente de novo.';
          return;
        }
        window.location.hash = '#/resultado-missao';
      });

      const side = el('div', 'layout-split__side game__col');
      side.append(ChecaAi.components.postCard.render(mission), buildTools(mission));

      const visual = el('div', 'layout-split__visual game__col');
      visual.append(
        buildSignals(mission, order, marked),
        buildVerdict((key) => {
          verdict = key;
          submit.disabled = false;
        }),
        submit,
        error
      );

      const split = el('div', 'layout-split');
      split.append(side, visual);
      root.append(h1, split);
      sectionEl.appendChild(root);
      return h1;
    }
  };
})();
