'use strict';

(function () {
  window.ChecaAi = window.ChecaAi || {};
  const ChecaAi = window.ChecaAi;
  ChecaAi.screens = ChecaAi.screens || {};

  /** Classe da pílula de nível (theme/base.css) para cada nível da missão. */
  const LEVEL_CLASS = { easy: 'pill--facil', medium: 'pill--media', hard: 'pill--dificil' };

  /** Visual de cada veredito: ícone, cor (token do tema) e dica curta. O texto do rótulo vem de VERDICT_LABELS. */
  const VERDICT_UI = {
    true: { icon: 'check', tone: 'ok', title: 'Verdadeira', hint: 'Os fatos conferem' },
    false: { icon: 'x', tone: 'bad', title: 'Falsa', hint: 'Fato inventado' },
    misleading: { icon: 'wave', tone: 'warn', title: 'Enganosa', hint: 'Fora de contexto' },
    unproven: { icon: 'question', tone: 'unk', title: 'Sem provas suficientes', hint: 'Não dá para confirmar' }
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /** "mm:ss" de uma duração em ms. */
  function formatElapsed(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  /** Ícone da pista, escolhido pelo rótulo da ferramenta (os rótulos são texto livre de cada missão). */
  function toolIcon(label) {
    const text = label.toLowerCase();
    if (/data/.test(text)) return 'date';
    if (/outras fontes|comparar|ag[eê]ncia/.test(text)) return 'sources';
    if (/imagem|redor|aten[cç][aã]o/.test(text)) return 'context';
    if (/fonte|original|site|perfil|[oó]rg[aã]o|prefeitura|defesa/.test(text)) return 'origin';
    return 'search';
  }

  /** Pistas: botões com ícone; o resultado da pista aberta aparece na caixa abaixo (uma por vez). */
  function buildTools(mission) {
    const icon = ChecaAi.utils.icon;
    const section = el('section', 'block mission__tools-block');
    const headingId = 'tools-heading-' + mission.id;
    const heading = el('h2', 'block__title', 'Pistas');
    heading.id = headingId;

    const list = el('ul', 'clues');
    const out = el('div', 'clue-out');
    out.id = 'clue-out-' + mission.id;
    out.setAttribute('aria-live', 'polite');
    out.hidden = true;
    const outLabel = el('strong', 'kicker clue-out__label');
    const outText = el('p', 'clue-out__text');
    out.append(outLabel, outText);

    const buttons = [];
    mission.tools.forEach((tool) => {
      const item = el('li', 'clues__item');
      const button = el('button', 'clue');
      button.type = 'button';
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', out.id);
      button.append(icon(toolIcon(tool.label)), el('span', 'clue__label', tool.label));
      button.addEventListener('click', () => {
        const open = button.getAttribute('aria-expanded') !== 'true';
        buttons.forEach((b) => b.setAttribute('aria-expanded', 'false'));
        button.setAttribute('aria-expanded', String(open));
        out.hidden = !open;
        if (open) {
          outLabel.textContent = tool.label;
          outText.textContent = tool.clue;
        }
      });
      buttons.push(button);
      item.appendChild(button);
      list.appendChild(item);
    });

    section.append(heading, list, out);
    return section;
  }

  /**
   * Sinais marcáveis (caixas de seleção nativas, estilizadas pelo rótulo), na ordem embaralhada da partida.
   * @param {Set<number>} marked índices marcados (alterado pelas caixas)
   */
  function buildSignals(mission, order, marked) {
    const icon = ChecaAi.utils.icon;
    const section = el('section', 'block mission__signals-block');
    const heading = el('h2', 'block__title', 'Sinais suspeitos');
    heading.id = 'signals-heading-' + mission.id;
    const list = el('ul', 'signals');
    list.setAttribute('aria-labelledby', heading.id);
    order.forEach((signalIndex) => {
      const item = el('li', 'signals__item');
      const label = el('label', 'signal');
      const input = el('input', 'signal__input');
      input.type = 'checkbox';
      input.addEventListener('change', () => {
        if (input.checked) marked.add(signalIndex); else marked.delete(signalIndex);
      });
      const box = el('span', 'signal__box');
      box.appendChild(icon('check', 18));
      label.append(input, box, el('span', 'signal__text', mission.signals[signalIndex].text));
      item.appendChild(label);
      list.appendChild(item);
    });
    section.append(heading, list);
    return section;
  }

  /** Veredito: escolha única com botões de rádio nativos (setas e foco funcionam sozinhos). */
  function buildVerdict(mission, onChange) {
    const icon = ChecaAi.utils.icon;
    const section = el('section', 'block mission__verdict-block');
    const heading = el('h2', 'block__title', 'Seu veredito');
    heading.id = 'verdict-heading-' + mission.id;
    const group = el('div', 'verdicts');
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-labelledby', heading.id);
    Object.keys(ChecaAi.missions.VERDICT_LABELS).forEach((key) => {
      const ui = VERDICT_UI[key];
      const card = el('label', 'verdict verdict--' + ui.tone);
      const radio = el('input', 'verdict__input');
      radio.type = 'radio';
      radio.name = 'verdict';
      radio.value = key;
      radio.addEventListener('change', () => onChange(key));
      const iconWrap = el('span', 'verdict__icon');
      iconWrap.appendChild(icon(ui.icon, 22));
      card.append(radio, iconWrap, el('b', 'verdict__title', ui.title), el('small', 'verdict__hint', ui.hint), el('span', 'verdict__mark'));
      group.appendChild(card);
    });
    section.append(heading, group);
    return section;
  }

  /** Pontos já ganhos nas missões concluídas desta partida. */
  function pointsSoFar(match) {
    return match.answers.reduce((sum, a) => sum + (a && a.score && Number.isFinite(a.score.total) ? a.score.total : 0), 0);
  }

  /** Missão atual da partida: investigar, marcar os sinais e dar o veredito. */
  let cleanup = null;

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

    /** Tira da barra superior os pontos e para o relógio. */
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
      const mission = ChecaAi.missions.getMissionById(match.missionIds[match.index]);
      if (!mission) {
        console.error('Missão não encontrada:', match.missionIds[match.index]);
        sectionEl.textContent = 'Não deu para abrir esta missão. Volte ao início e comece de novo.';
        return null;
      }

      const root = el('div', 'mission');
      const total = match.missionIds.length;

      // Cabeçalho: sobretítulo, título, pílulas de nível e de tempo e a barra de passos.
      // O título não usa mission.title: alguns títulos já entregam a resposta ("... que não existia").
      const head = el('header', 'mission__head');
      const titles = el('div', 'mission__titles');
      titles.append(el('p', 'kicker', 'Missão ' + (match.index + 1) + ' de ' + total));
      const h1 = el('h1', 'mission__title', 'Investigue a publicação');
      h1.tabIndex = -1;
      titles.appendChild(h1);

      const meta = el('div', 'mission__meta');
      meta.appendChild(el('span', 'pill ' + (LEVEL_CLASS[mission.level] || ''), ChecaAi.missions.LEVEL_LABELS[mission.level]));
      const timer = el('span', 'pill');
      timer.setAttribute('role', 'timer');
      timer.setAttribute('aria-label', 'Tempo da partida');
      const timerText = document.createTextNode(formatElapsed(Date.now() - match.startedAt));
      timer.append(icon('clock', 20), timerText);
      meta.appendChild(timer);

      const steps = el('ol', 'steps');
      steps.setAttribute('aria-hidden', 'true');
      for (let n = 0; n < total; n++) {
        steps.appendChild(el('li', n < match.index ? 'is-done' : n === match.index ? 'is-now' : ''));
      }
      head.append(titles, meta, steps);

      // Pontos das missões já concluídas, na barra superior (a tela tira a pílula ao sair)
      const headerTools = document.getElementById('app-header-tools');
      const scorePill = el('span', 'pill');
      const points = pointsSoFar(match);
      scorePill.setAttribute('aria-label', points + ' pontos');
      scorePill.append(icon('trophy', 20), points + ' pts');
      if (headerTools) {
        headerTools.appendChild(scorePill);
      } else {
        console.warn('Faltou o #app-header-tools no index.html; os pontos não aparecem na barra.');
      }
      const tick = window.setInterval(() => {
        timerText.nodeValue = formatElapsed(Date.now() - match.startedAt);
      }, 1000);
      cleanup = () => {
        window.clearInterval(tick);
        scorePill.remove();
      };

      const marked = new Set();
      let verdict = null;

      const submit = el('button', 'btn btn--xl mission__submit', 'Confirmar veredito');
      submit.type = 'button';
      submit.disabled = true;
      const error = el('p', 'field__error mission__error');
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

      const post = el('div', 'mission__post');
      post.appendChild(ChecaAi.components.postCard.render(mission));

      const confirm = el('div', 'mission__confirm');
      confirm.append(error, submit);

      const tools = el('div', 'mission__tools');
      tools.append(
        buildTools(mission),
        buildSignals(mission, order, marked),
        buildVerdict(mission, (key) => {
          verdict = key;
          submit.disabled = false;
        }),
        confirm
      );

      const grid = el('div', 'mission__grid');
      grid.append(post, tools);
      root.append(head, grid);
      sectionEl.appendChild(root);
      return h1;
    }
  };
})();
