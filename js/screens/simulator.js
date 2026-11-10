'use strict';

(function () {
  window.ChecaAi = window.ChecaAi || {};
  const ChecaAi = window.ChecaAi;
  ChecaAi.screens = ChecaAi.screens || {};

  const HOME_ROUTE = '#/inicio';
  const FIRST_ROUND_DELAY_MS = 700;
  const GROW_MS = 600; // crescimento do anel novo da árvore
  const CROWD_MS = 500; // encolher a visão e abrir o anel novo da multidão
  const SPLIT_QUERY = '(min-width: 1024px), (min-width: 600px) and (orientation: landscape)'; // igual ao theme.css
  const PHONE_RATIO = 0.6; // largura / altura do celular desenhado

  const numberFormat = new Intl.NumberFormat('pt-BR');

  /** Ajustes valem para a próxima simulação; ficam enquanto a página estiver aberta. */
  const settings = {
    fanout: ChecaAi.config.SIM_FANOUT,
    checkPct: Math.round(ChecaAi.config.SIM_CHECK_RATE * 100)
  };

  /** Id do último boato mostrado, para não repetir em sequência. */
  let lastRumorId = null;

  /** Sessão ativa da tela (só uma por vez). */
  let activeSession = null;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function fmt(n) {
    return numberFormat.format(n);
  }

  function pickRumor() {
    const pool = ChecaAi.missions.getShareableRumors();
    if (!pool.length) {
      throw new Error('Não há missões que sirvam de boato. Confira js/missions-data.js.');
    }
    const choices = pool.length > 1 ? pool.filter((m) => m.id !== lastRumorId) : pool;
    const rumor = ChecaAi.utils.pickRandom(choices);
    lastRumorId = rumor.id;
    return rumor;
  }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  /** Lê as cores do theme.css (relê a cada desenho). */
  function readColors() {
    const style = getComputedStyle(document.documentElement);
    const get = (name) => style.getPropertyValue(name).trim();
    return {
      shared: get('--verdict-false'),
      checked: get('--verdict-true'),
      you: get('--accent'),
      line: get('--text-muted'),
      mark: get('--bg'),
      surface: get('--surface'),
      text: get('--text'),
      textMuted: get('--text-muted')
    };
  }

  function phonePath(ctx, cx, cy, w, h) {
    const r = Math.min(w, h) * 0.2;
    const x = cx - w / 2;
    const y = cy - h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /**
   * Uma sessão = uma visita à tela. Guarda estado, timers e listeners para limpar tudo em destroy().
   * @param {HTMLElement} sectionEl
   */
  function createSession(sectionEl) {
    const model = ChecaAi.simulatorModel;
    const config = ChecaAi.config;

    let destroyed = false;
    let step = 'a';
    let rumor = null;
    let sim = null; // { nodes, roundsDrawn, rows, stoppedAt, fanout, layout }
    let round = 0;
    let presenting = false;
    let fsActive = false;
    let timer = null;
    let raf = null;
    let anim = null; // { round, start, t }
    let canvas = null;
    let ctx = null;
    let resizeObserver = null;
    let counterEls = null;
    let noteEl = null;
    let crowdLegendEl = null;
    let nextBtn = null;

    // Estrutura fixa da tela
    sectionEl.textContent = '';
    const wrap = el('div', 'simulator');
    const top = el('div', 'sim-top');
    const h1 = el('h1', 'sim-top__title', 'Como um boato se espalha');
    h1.tabIndex = -1;
    const toolbar = el('div', 'sim-top__tools');
    const presentBtn = el('button', 'btn btn--secondary', 'Modo apresentação');
    presentBtn.type = 'button';
    const exitBtn = el('button', 'btn btn--secondary', 'Sair');
    exitBtn.type = 'button';
    exitBtn.hidden = true;
    toolbar.append(presentBtn, exitBtn);
    top.append(h1, toolbar);
    const stage = el('div', 'sim-stage');
    wrap.append(top, stage);
    sectionEl.appendChild(wrap);

    /* ---------- utilidades ---------- */

    function stopRun() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
      anim = null;
    }

    function clearStage() {
      stopRun();
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      canvas = null;
      ctx = null;
      counterEls = null;
      noteEl = null;
      crowdLegendEl = null;
      nextBtn = null;
      stage.textContent = '';
      stage.className = 'sim-stage';
    }

    /** Mostra o passo novo com um fade curto (sem animação se o visitante pediu menos movimento). */
    function enter(modifier, quiet) {
      stage.className = 'sim-stage ' + modifier;
      if (quiet || prefersReducedMotion()) return;
      void stage.offsetWidth;
      stage.classList.add('sim-stage--enter');
    }

    function scrollToTop() {
      wrap.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }

    function heading(text) {
      const h2 = el('h2', 'sim-title', text);
      h2.tabIndex = -1;
      return h2;
    }

    function backLink() {
      const a = el('a', 'btn btn--secondary', 'Voltar');
      a.href = HOME_ROUTE;
      return a;
    }

    function buildSettings() {
      const details = el('details', 'sim-settings');
      details.appendChild(el('summary', 'sim-settings__summary', 'Ajustes'));
      const body = el('div', 'sim-settings__body');

      const fanoutId = 'sim-fanout';
      const fanoutField = el('div', 'sim-field');
      const fanoutLabel = el('label', null, 'Repasses por pessoa');
      fanoutLabel.htmlFor = fanoutId;
      const fanoutSelect = el('select', 'sim-select');
      fanoutSelect.id = fanoutId;
      for (let n = 2; n <= 5; n++) {
        const o = el('option', null, String(n));
        o.value = String(n);
        fanoutSelect.appendChild(o);
      }
      fanoutSelect.value = String(settings.fanout);
      fanoutSelect.addEventListener('change', () => {
        settings.fanout = Number(fanoutSelect.value);
      });
      fanoutField.append(fanoutLabel, fanoutSelect);

      const checkId = 'sim-check';
      const checkField = el('div', 'sim-field');
      const checkLabel = el('label', null, '% que checa antes');
      checkLabel.htmlFor = checkId;
      const checkSelect = el('select', 'sim-select');
      checkSelect.id = checkId;
      for (let p = 0; p <= 80; p += 10) {
        const o = el('option', null, p + '%');
        o.value = String(p);
        checkSelect.appendChild(o);
      }
      checkSelect.value = String(settings.checkPct);
      checkSelect.addEventListener('change', () => {
        settings.checkPct = Number(checkSelect.value);
      });
      checkField.append(checkLabel, checkSelect);

      body.append(fanoutField, checkField);
      details.appendChild(body);
      return details;
    }

    function focusHeading(h2) {
      h2.focus({ preventScroll: true });
    }

    /* ---------- passo a: chegou no celular ---------- */

    /** Cartão da mensagem fictícia, com o quadro da imagem quando a missão tem `image`. */
    function buildMessage(r) {
      const msg = el('article', 'sim-msg');
      msg.setAttribute('aria-label', 'Mensagem recebida');
      const msgTop = el('div', 'sim-msg__top');
      msgTop.append(el('span', 'sim-msg__header', r.format.header), el('span', 'sim-stamp', 'Simulação'));
      msg.appendChild(msgTop);
      if (r.format.badge) msg.appendChild(el('p', 'sim-msg__badge', r.format.badge));
      msg.appendChild(el('p', 'sim-msg__content', r.content));
      if (r.image) {
        const figure = el('figure', 'sim-image');
        figure.append(el('span', 'sim-image__label', 'Imagem fictícia'), el('figcaption', 'sim-image__alt', r.image.alt));
        msg.appendChild(figure);
      }
      return msg;
    }

    function renderStepA(initial) {
      clearStage();
      step = 'a';
      rumor = pickRumor();

      const h2 = heading('Chegou no seu celular');

      const msg = buildMessage(rumor);

      const actions = el('div', 'sim-actions');
      const share = el('button', 'btn', 'Compartilhar');
      share.type = 'button';
      share.addEventListener('click', () => renderStepC());
      const check = el('button', 'btn btn--secondary', 'Checar antes');
      check.type = 'button';
      check.addEventListener('click', () => renderStepB());
      actions.append(share, check);

      stage.append(h2, msg, actions, buildSettings());
      enter('sim-stage--center', initial);
      if (!initial) {
        focusHeading(h2);
        scrollToTop();
      }
    }

    /* ---------- passo b: checou antes ---------- */

    function renderStepB() {
      clearStage();
      step = 'b';
      const h2 = heading('Você parou o boato aqui.');
      const zero = el('p', 'sim-big', '0 pessoas enganadas');
      const why = el('p', 'sim-text', rumor.explanation);
      const actions = el('div', 'sim-actions');
      const what = el('button', 'btn', 'E se eu tivesse compartilhado?');
      what.type = 'button';
      what.addEventListener('click', () => renderStepC());
      actions.append(what, backLink());
      stage.append(h2, zero, why, actions);
      enter('sim-stage--center');
      focusHeading(h2);
    }

    /* ---------- passo c: árvore e multidão ---------- */

    function renderStepC() {
      clearStage();
      step = 'c';
      round = 0;
      sim = model.buildSimulation({
        fanout: settings.fanout,
        checkRate: settings.checkPct / 100,
        visualRounds: config.SIM_VISUAL_ROUNDS,
        totalRounds: config.SIM_TOTAL_ROUNDS
      });
      sim.fanout = settings.fanout;
      sim.layout = model.layoutAngles(sim.nodes);
      sim.crowd = new Map();
      // A tela termina na rodada de apresentação, ou antes se o boato parar.
      sim.lastRound = Math.max(1, Math.min(config.SIM_PRESENTATION_ROUNDS, sim.rows.length));

      const h2 = heading('Você compartilhou');

      const counters = el('div', 'sim-counters');
      counters.setAttribute('aria-live', 'polite');
      counters.setAttribute('aria-atomic', 'true');
      const roundEl = el('span', 'sim-counters__round');
      const receivedEl = el('span');
      const checkedEl = el('span', 'sim-counters__checked');
      counters.append(roundEl, receivedEl, checkedEl);
      counterEls = { roundEl, receivedEl, checkedEl };

      const canvasWrap = el('div', 'sim-canvas-wrap');
      canvas = el('canvas', 'sim-canvas');
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'Árvore de pessoas que receberam o boato');
      canvas.addEventListener('click', () => {
        if (presenting) advance();
      });
      canvasWrap.appendChild(canvas);
      ctx = canvas.getContext('2d');

      const legend = el('ul', 'sim-legend');
      [['sim-swatch--you', 'Você'], ['sim-swatch--shared', 'Repassou'], ['sim-swatch--checked', 'Checou antes']].forEach((item) => {
        const li = el('li');
        li.append(el('span', 'sim-swatch ' + item[0]), document.createTextNode(item[1]));
        legend.appendChild(li);
      });
      crowdLegendEl = el('li');
      crowdLegendEl.append(el('span', 'sim-swatch sim-swatch--dot sim-swatch--shared'), document.createTextNode(''));
      crowdLegendEl.hidden = true;
      legend.appendChild(crowdLegendEl);

      noteEl = el('p', 'sim-note');

      nextBtn = el('button', 'btn sim-next', 'Próxima rodada');
      nextBtn.type = 'button';
      nextBtn.addEventListener('click', () => advance());

      stage.append(h2, counters, canvasWrap, legend, noteEl, nextBtn);
      enter('sim-stage--run layout-split');

      if (typeof ResizeObserver === 'function') {
        resizeObserver = new ResizeObserver(() => {
          resizeCanvas();
          draw();
        });
        resizeObserver.observe(canvasWrap);
      }
      resizeCanvas();
      updateCounters();
      draw();
      if (presenting) {
        nextBtn.focus({ preventScroll: true });
      } else {
        focusHeading(h2);
        // Celular (1 coluna): leva o canvas para a tela depois de compartilhar.
        if (!window.matchMedia(SPLIT_QUERY).matches) {
          canvasWrap.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
        }
      }
      schedule();
    }

    function resizeCanvas() {
      if (!canvas) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.dataset.cssWidth = String(w);
      canvas.dataset.cssHeight = String(h);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function finished() {
      return round >= sim.lastRound;
    }

    /** Dados do anel da multidão de uma rodada (calculados uma vez, para o desenho não "tremer"). */
    function crowdInfo(k) {
      let info = sim.crowd.get(k);
      if (!info) {
        const row = sim.rows[k - 1];
        const ring = model.crowdRing({ received: row.received, checked: row.checked });
        const kinds = [];
        for (let i = 0; i < ring.dots; i++) kinds.push(i < ring.checkedDots ? 1 : 0);
        info = { ring, kinds: ChecaAi.utils.shuffle(kinds), offset: Math.random() * Math.PI * 2, received: row.received };
        sim.crowd.set(k, info);
      }
      return info;
    }

    function updateCounters() {
      const row = round === 0 ? null : sim.rows[round - 1];
      const received = row ? row.receivedTotal : 0;
      const checked = row ? row.checkedTotal : 0;
      counterEls.roundEl.textContent = 'Rodada ' + round;
      counterEls.receivedEl.textContent = received === 1 ? '1 pessoa recebeu' : fmt(received) + ' pessoas receberam';
      counterEls.checkedEl.textContent = checked === 1 ? '1 checou' : fmt(checked) + ' checaram';

      const crowdNow = round > sim.roundsDrawn;
      crowdLegendEl.hidden = !crowdNow;
      if (crowdNow) {
        const per = crowdInfo(round).ring.perDot;
        crowdLegendEl.lastChild.textContent = 'Cada ponto = ' + fmt(per) + (per === 1 ? ' pessoa' : ' pessoas');
        canvas.setAttribute('aria-label', 'Multidão que recebeu o boato, em anéis por rodada');
      } else {
        canvas.setAttribute('aria-label', 'Árvore de pessoas que receberam o boato');
      }

      let note = '';
      if (finished() && sim.stoppedAt !== null && sim.stoppedAt === sim.lastRound) {
        note = 'O boato parou na rodada ' + sim.stoppedAt + '.';
      }
      noteEl.textContent = note;
      noteEl.hidden = note === '';

      nextBtn.textContent = finished() ? 'Ver comparação' : 'Próxima rodada';
      nextBtn.hidden = !(presenting || finished());
    }

    function schedule() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (step !== 'c' || presenting || finished() || destroyed) return;
      const delay = round === 0 ? FIRST_ROUND_DELAY_MS : config.SIM_ROUND_MS;
      timer = setTimeout(() => {
        timer = null;
        advance();
      }, delay);
    }

    function advance() {
      if (destroyed || step !== 'c') return;
      if (finished()) {
        renderStepD();
        return;
      }
      round++;
      updateCounters();
      if (!prefersReducedMotion()) {
        startAnimation(round, round <= sim.roundsDrawn ? GROW_MS : CROWD_MS);
      } else {
        anim = null;
        draw();
      }
      schedule();
    }

    function startAnimation(k, duration) {
      if (raf !== null) cancelAnimationFrame(raf);
      anim = { round: k, start: null, t: 0 };
      draw();
      const frame = (now) => {
        raf = null;
        if (destroyed || !anim || anim.round !== k) return;
        if (anim.start === null) anim.start = now;
        anim.t = Math.min(1, (now - anim.start) / duration);
        if (anim.t >= 1) anim = null;
        draw();
        if (anim) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }

    function draw() {
      if (!canvas || !ctx || !sim) return;
      const w = Number(canvas.dataset.cssWidth);
      const h = Number(canvas.dataset.cssHeight);
      const colors = readColors();
      ctx.clearRect(0, 0, w, h);

      const rings = sim.roundsDrawn;
      const shown = Math.min(round, rings);
      const crowdShown = Math.max(0, round - rings);
      const eased = anim ? 1 - Math.pow(1 - anim.t, 3) : 1;
      const growing = anim && anim.round <= rings ? eased : 1; // anel novo da árvore
      const crowdE = anim && anim.round > rings ? eased : 1; // anel novo da multidão
      // A visão encolhe para caber o anel novo: de `rings` (só árvore) até rings + crowdShown.
      const viewRings = rings + (crowdShown === 0 ? 0 : crowdShown - 1 + crowdE);

      const cx = w / 2;
      const cy = h / 2;
      const margin = crowdShown > 0 ? 16 : 10;
      const maxR = Math.max(20, Math.min(w, h) / 2 - margin);
      const ringStep = maxR / viewRings;
      const baseH = Math.min(ringStep * 0.62, 56);

      function ringRadius(k) {
        return ringStep * k;
      }

      function phoneSize(k) {
        if (k === 0) return { w: baseH * PHONE_RATIO * 1.4, h: baseH * 1.4 };
        const arc = (2 * Math.PI * ringRadius(k)) / Math.pow(sim.fanout, k);
        const ph = Math.max(4, Math.min(baseH, (arc * 0.85) / PHONE_RATIO));
        return { w: ph * PHONE_RATIO, h: ph };
      }

      function position(node) {
        if (node.round === 0) return { x: cx, y: cy };
        let r = ringRadius(node.round);
        if (node.round === shown && growing < 1) {
          const from = ringRadius(node.round - 1);
          r = from + (r - from) * eased;
        }
        const a = sim.layout[node.id].angle;
        return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
      }

      const visible = sim.nodes.filter((n) => n.round <= shown);
      const pos = new Map();
      visible.forEach((n) => pos.set(n.id, position(n)));

      // linhas do pai ao filho
      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.line;
      visible.forEach((n) => {
        if (n.parentId === null) return;
        const p = pos.get(n.parentId);
        const c = pos.get(n.id);
        ctx.globalAlpha = (n.round === shown ? growing : 1) * 0.6;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
      });

      // celulares
      visible.forEach((n) => {
        const p = pos.get(n.id);
        const size = phoneSize(n.round);
        ctx.globalAlpha = n.round === shown ? Math.max(growing, 0.15) : 1;
        ctx.fillStyle = n.round === 0 ? colors.you : (n.action === 'check' ? colors.checked : colors.shared);
        phonePath(ctx, p.x, p.y, size.w, size.h);
        ctx.fill();
        if (n.action === 'check' && size.w >= 8) {
          ctx.strokeStyle = colors.mark;
          ctx.lineWidth = Math.max(1.5, size.w * 0.16);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(p.x - size.w * 0.26, p.y + size.h * 0.02);
          ctx.lineTo(p.x - size.w * 0.06, p.y + size.h * 0.14);
          ctx.lineTo(p.x + size.w * 0.28, p.y - size.h * 0.12);
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;

      // multidão: um anel de pontos por rodada depois da árvore
      for (let j = 1; j <= crowdShown; j++) {
        const k = rings + j;
        const info = crowdInfo(k);
        const n = info.kinds.length;
        if (n === 0) continue;
        const r = ringRadius(k);
        const dotR = Math.max(0.9, Math.min(ringStep * 0.34, ((2 * Math.PI * r) / n) * 0.42));
        ctx.globalAlpha = j === crowdShown ? crowdE : 1;
        for (let i = 0; i < n; i++) {
          const a = info.offset + (2 * Math.PI * i) / n;
          ctx.fillStyle = info.kinds[i] === 1 ? colors.checked : colors.shared;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, dotR, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // rótulos dos anéis ("Rodada 6 · 729 pessoas"), no alto de cada anel
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let j = 1; j <= crowdShown; j++) {
        const k = rings + j;
        const last = j === crowdShown;
        const fontPx = Math.max(10, Math.min(ringStep * 0.5, 20));
        const pillH = fontPx + 6;
        if (!last && ringStep < pillH) continue;
        const info = crowdInfo(k);
        ctx.font = (last ? '700 ' : '400 ') + fontPx + 'px ' + getComputedStyle(document.body).fontFamily;
        const label = 'Rodada ' + k + ' · ' + fmt(info.received) + (info.received === 1 ? ' pessoa' : ' pessoas');
        const pillW = Math.min(w - 4, ctx.measureText(label).width + 12);
        const y = cy - ringRadius(k);
        ctx.globalAlpha = last ? Math.max(crowdE, 0.15) : 1;
        ctx.fillStyle = colors.surface;
        ctx.fillRect(cx - pillW / 2, y - pillH / 2, pillW, pillH);
        ctx.fillStyle = last ? colors.text : colors.textMuted;
        ctx.fillText(label, cx, y, pillW - 6);
      }
      ctx.globalAlpha = 1;
    }

    /* ---------- passo d: comparação ---------- */

    function renderStepD() {
      clearStage();
      step = 'd';
      const total = config.SIM_TOTAL_ROUNDS;
      const none = Math.round(model.expectedReach({ fanout: sim.fanout, checkRate: 0, rounds: total }));
      const rate = config.SIM_COMPARE_CHECK_RATE;
      const some = Math.round(model.expectedReach({ fanout: sim.fanout, checkRate: rate, rounds: total }));

      const h2 = heading('Se continuasse até a ' + fmt(total) + 'ª rodada');

      const compare = el('div', 'sim-compare');
      [['Ninguém checou', none, 'sim-compare__col--bad'],
        [Math.round(rate * 100) + '% checaram', some, 'sim-compare__col--good']].forEach((c) => {
        const col = el('div', 'sim-compare__col ' + c[2]);
        col.append(el('p', 'sim-compare__label', c[0]), el('p', 'sim-compare__value', fmt(c[1])), el('p', 'sim-compare__unit', 'pessoas'));
        compare.appendChild(col);
      });

      const rule = el('p', 'sim-big', 'Na dúvida, não compartilhe.');
      const ref = el('p', 'sim-ref', 'Cartilha de Segurança para Internet (CERT.br) — fascículo Boatos');

      const actions = el('div', 'sim-actions');
      const again = el('button', 'btn', 'Nova simulação');
      again.type = 'button';
      again.addEventListener('click', () => renderStepA(false));
      actions.append(again, backLink());

      stage.append(h2, compare, rule, ref, actions, buildSettings());
      enter('sim-stage--wide');
      focusHeading(h2);
      scrollToTop();
    }

    /* ---------- modo apresentação ---------- */

    function setPresentingUi() {
      wrap.classList.toggle('simulator--presenting', presenting);
      presentBtn.hidden = presenting;
      exitBtn.hidden = !presenting;
      if (step === 'c' && counterEls) updateCounters();
    }

    function enterPresentation() {
      if (presenting || destroyed) return;
      presenting = true;
      setPresentingUi();
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      const request = wrap.requestFullscreen || wrap.webkitRequestFullscreen;
      if (request) {
        try {
          Promise.resolve(request.call(wrap)).then(() => {
            if (destroyed || !presenting) {
              leaveFullscreen();
            } else {
              fsActive = true;
            }
          }).catch((err) => {
            console.warn('Tela cheia indisponível; a tela foi apenas ampliada.', err);
          });
        } catch (err) {
          console.warn('Tela cheia indisponível; a tela foi apenas ampliada.', err);
        }
      }
      if (step === 'c' && nextBtn) nextBtn.focus();
    }

    function leaveFullscreen() {
      if (!fullscreenElement()) return;
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (!exit) return;
      try {
        Promise.resolve(exit.call(document)).catch((err) => {
          console.warn('Não deu para sair da tela cheia.', err);
        });
      } catch (err) {
        console.warn('Não deu para sair da tela cheia.', err);
      }
    }

    function exitPresentation() {
      if (!presenting) return;
      presenting = false;
      fsActive = false;
      leaveFullscreen();
      setPresentingUi();
      if (step === 'c') schedule();
      presentBtn.focus();
    }

    function onFullscreenChange() {
      // Esc (ou o navegador) tirou da tela cheia: sai do modo apresentação.
      if (presenting && fsActive && !fullscreenElement()) exitPresentation();
    }

    function onKeyDown(e) {
      if (!presenting || step !== 'c') return;
      if (e.key === ' ' || e.key === 'Spacebar') {
        if (e.target && e.target.closest && e.target.closest('button, a, select, input, summary')) return;
        e.preventDefault();
        advance();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        advance();
      }
    }

    presentBtn.addEventListener('click', enterPresentation);
    exitBtn.addEventListener('click', exitPresentation);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    function destroy() {
      destroyed = true;
      stopRun();
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      if (presenting) leaveFullscreen();
      presenting = false;
      wrap.classList.remove('simulator--presenting');
    }

    renderStepA(true);
    return { destroy, focusEl: h1 };
  }

  function teardown() {
    if (activeSession) {
      activeSession.destroy();
      activeSession = null;
    }
  }

  /** Tela do simulador. Convenção: { id, route, title, feature, mount(sectionEl), unmount() }. */
  ChecaAi.screens.simulator = {
    id: 'simulator',
    route: '#/simulador',
    title: 'Como um boato se espalha',
    feature: 'simulator',

    mount(sectionEl) {
      teardown();
      activeSession = createSession(sectionEl);
      return activeSession.focusEl;
    },

    unmount: teardown
  };
})();
