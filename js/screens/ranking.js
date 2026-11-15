'use strict';

(function () {
  window.ChecaAi = window.ChecaAi || {};
  const ChecaAi = window.ChecaAi;
  ChecaAi.screens = ChecaAi.screens || {};

  /*
   * Ranking do dia (#/ranking) e modo telão.
   * Apelidos vêm de outras pessoas: tudo entra por textContent, nunca por innerHTML.
   */

  /** Sessão ativa da tela (só uma por vez). */
  let active = null;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  /** Só a partida mais recente do aparelho, enviada há pouco, é destacada (tablet compartilhado na mostra). */
  const RECENT_MS = 10 * 60 * 1000;

  /**
   * Chave "apelido|pontos|tempo" da última partida deste aparelho gravada nos últimos minutos.
   * @returns {Set<string>}
   */
  function myRowKeys() {
    const today = ChecaAi.utils.todayISO();
    const results = ChecaAi.storage.getResults();
    const now = Date.now();
    let best = null;
    Object.keys(results).forEach((id) => {
      const r = results[id];
      if (r && r.state === 'sent' && r.playedOn === today && now - r.updatedAt < RECENT_MS &&
          (!best || r.updatedAt > best.updatedAt)) best = r;
    });
    const keys = new Set();
    if (best) keys.add(best.nickname + '|' + best.score + '|' + best.durationMs);
    return keys;
  }

  function rowKey(row) {
    return row.nickname + '|' + row.score + '|' + row.durationMs;
  }

  function createSession(sectionEl) {
    const cfg = ChecaAi.config;
    const formatDuration = ChecaAi.screens.matchEnd.formatDuration;

    let destroyed = false;
    let tv = false;
    let fsActive = false;
    let timer = null;
    let requestSeq = 0;
    let loading = false;
    /** @type {{rows: Object[], fetchedAt: number, live: boolean}|null} */
    let shown = null;

    // Estrutura fixa
    sectionEl.textContent = '';
    const wrap = el('div', 'ranking');
    const head = el('div', 'ranking-head');
    const titleBox = el('div', 'ranking-titlebox');
    const logo = el('span', 'app-brand ranking-logo');
    logo.append('Checa ', el('b', null, 'Aí'));
    const h1 = el('h1', 'ranking-title', 'Ranking do dia');
    h1.tabIndex = -1;
    titleBox.append(logo, h1);

    const side = el('div', 'ranking-side');
    const updated = el('p', 'ranking-updated');
    const updatedLabel = el('span', 'ranking-updated__label');
    const updatedTime = el('strong', 'ranking-updated__time');
    updated.append(ChecaAi.utils.icon('clock'), el('span', 'ranking-updated__text'));
    const updatedText = updated.lastChild;
    updatedText.append(updatedLabel, updatedTime);

    const exitBtn = el('button', 'btn ranking-exit');
    exitBtn.type = 'button';
    exitBtn.append(ChecaAi.utils.icon('exit', 28), 'Sair');
    exitBtn.hidden = true;
    side.append(updated, exitBtn);
    head.append(titleBox, side);

    const status = el('p', 'ranking-status');
    status.setAttribute('aria-live', 'polite');

    const table = el('table', 'ranking-table');
    const caption = el('caption', 'visually-hidden', 'Ranking do dia');
    const thead = el('thead');
    const headRow = el('tr');
    [['Pos.', 'ranking-table__pos'], ['Apelido', 'ranking-table__nick'], ['Pontos', 'ranking-table__num'],
      ['Acertos', 'ranking-table__num ranking-col-x'], ['Tempo', 'ranking-table__num ranking-col-x']].forEach((c) => {
      const th = el('th', c[1], c[0]);
      th.scope = 'col';
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    const tbody = el('tbody');
    table.append(caption, thead, tbody);
    table.hidden = true;

    const actions = el('div', 'ranking-actions');
    const refreshBtn = el('button', 'btn btn--xl', 'Atualizar');
    refreshBtn.type = 'button';
    const back = el('a', 'btn btn--secondary btn--xl', 'Voltar');
    back.href = '#/inicio';
    actions.append(refreshBtn, back);

    wrap.append(head, status, table, actions);
    sectionEl.appendChild(wrap);

    // Modo telão: ícone na barra superior do app (mesmo lugar do "Modo apresentação" do simulador)
    const tvBtn = el('button', 'btn-icon');
    tvBtn.type = 'button';
    tvBtn.setAttribute('aria-label', 'Modo telão');
    tvBtn.title = 'Modo telão';
    tvBtn.appendChild(ChecaAi.utils.icon('tv'));
    const headerTools = document.getElementById('app-header-tools');
    if (headerTools) {
      headerTools.appendChild(tvBtn);
    } else {
      console.warn('Faltou o #app-header-tools no index.html; o botão do modo telão ficou ao lado do título.');
      head.appendChild(tvBtn);
    }

    /* ---------- desenho ---------- */

    function render() {
      const offline = !!shown && !shown.live && !loading;
      const rows = shown ? shown.rows.slice(0, tv ? cfg.RANKING_TV_LIMIT : cfg.RANKING_LIMIT) : [];
      const mine = myRowKeys();

      tbody.textContent = '';
      rows.forEach((row) => {
        const tr = el('tr');
        const isMe = mine.has(rowKey(row));
        const cls = [];
        if (row.position <= 3) cls.push('is-top');
        if (row.position === 1) cls.push('is-first');
        if (isMe) {
          cls.push('is-me');
          tr.setAttribute('aria-current', 'true');
        }
        tr.className = cls.join(' ');
        const hits = row.correctVerdicts + ' de ' + row.missionsPlayed;
        const time = formatDuration(row.durationMs);
        const posCell = el('td', 'ranking-table__pos');
        posCell.appendChild(el('span', 'ranking-pos', String(row.position)));
        const nick = el('td', 'ranking-table__nick');
        const name = el('b', 'ranking-name', row.nickname);
        nick.appendChild(name);
        if (isMe) nick.appendChild(el('span', 'ranking-you', 'Você'));
        nick.appendChild(el('span', 'ranking-sub', hits + ' · ' + time));
        tr.append(
          posCell,
          nick,
          el('td', 'ranking-table__num ranking-score', String(row.score)),
          el('td', 'ranking-table__num ranking-col-x ranking-dim', hits),
          el('td', 'ranking-table__num ranking-col-x ranking-dim', time)
        );
        tbody.appendChild(tr);
      });
      table.hidden = rows.length === 0;

      // Situação: carregando, vazio, sem conexão (uma frase; o botão "Tentar de novo" fica nas ações)
      let text = '';
      if (!shown) {
        text = loading ? 'Carregando…' : 'Não deu para carregar o ranking. Confira a internet e tente de novo.';
      } else if (offline) {
        text = 'Sem conexão. Esta é a última lista guardada.';
      } else if (!rows.length) {
        text = 'Ninguém jogou ainda hoje.';
      }
      status.textContent = text;
      status.hidden = !text;
      status.classList.toggle('is-error', !!text && !loading && (!shown || offline));

      updatedLabel.textContent = shown ? (offline ? 'Lista das ' : 'Atualizado às ') : '';
      updatedTime.textContent = shown ? ChecaAi.utils.formatClock(shown.fetchedAt, tv) : '';
      updated.hidden = !shown;

      refreshBtn.textContent = !shown || offline ? 'Tentar de novo' : 'Atualizar';
      refreshBtn.disabled = loading;
    }

    /* ---------- dados ---------- */

    function useCache() {
      const last = ChecaAi.storage.getLastRanking();
      if (last && last.playedOn === ChecaAi.utils.todayISO()) {
        shown = { rows: last.rows.map(ChecaAi.api.sanitizeCachedRow).filter(Boolean), fetchedAt: last.fetchedAt, live: false };
      }
    }

    function load() {
      const seq = ++requestSeq;
      loading = true;
      render();
      return ChecaAi.api.getRanking(cfg.RANKING_LIMIT).then((res) => {
        if (destroyed || seq !== requestSeq) return;
        loading = false;
        if (res.ok) {
          const now = Date.now();
          shown = { rows: res.rows, fetchedAt: now, live: true };
          ChecaAi.storage.setLastRanking({ playedOn: ChecaAi.utils.todayISO(), fetchedAt: now, rows: res.rows });
        } else {
          console.warn('Não deu para atualizar o ranking (' + res.code + '); mostrando a última lista guardada.');
          if (shown) shown.live = false;
          else useCache();
        }
        render();
      });
    }

    function schedule() {
      if (timer !== null) window.clearInterval(timer);
      timer = window.setInterval(() => {
        if (!document.hidden && !loading) load();
      }, tv ? cfg.RANKING_TV_REFRESH_MS : cfg.RANKING_REFRESH_MS);
    }

    function onVisible() {
      if (!document.hidden && !loading) load();
    }

    /* ---------- modo telão ---------- */

    function setTvUi() {
      wrap.classList.toggle('ranking--tv', tv);
      tvBtn.hidden = tv;
      exitBtn.hidden = !tv;
      render();
      schedule();
    }

    function enterTv() {
      if (tv || destroyed) return;
      tv = true;
      setTvUi();
      load();
      const request = wrap.requestFullscreen || wrap.webkitRequestFullscreen;
      if (request) {
        try {
          Promise.resolve(request.call(wrap)).then(() => {
            if (destroyed || !tv) leaveFullscreen();
            else fsActive = true;
          }).catch((err) => {
            console.warn('Tela cheia indisponível; o ranking foi apenas ampliado.', err);
          });
        } catch (err) {
          console.warn('Tela cheia indisponível; o ranking foi apenas ampliado.', err);
        }
      }
      exitBtn.focus();
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

    function exitTv() {
      if (!tv) return;
      tv = false;
      fsActive = false;
      leaveFullscreen();
      setTvUi();
      tvBtn.focus();
    }

    function onFullscreenChange() {
      if (tv && fsActive && !fullscreenElement()) exitTv(); // Esc do navegador
    }

    function onKeyDown(e) {
      if (tv && e.key === 'Escape' && !fullscreenElement()) exitTv(); // fallback sem tela cheia
    }

    tvBtn.addEventListener('click', enterTv);
    exitBtn.addEventListener('click', exitTv);
    refreshBtn.addEventListener('click', () => load());
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onVisible);
    const stopWatch = ChecaAi.api.onChange(render); // partida enviada: atualiza o destaque

    function destroy() {
      destroyed = true;
      if (timer !== null) window.clearInterval(timer);
      timer = null;
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onVisible);
      stopWatch();
      if (tv) leaveFullscreen();
      tv = false;
      wrap.classList.remove('ranking--tv');
      tvBtn.remove();
    }

    // Primeira tela: a última lista de hoje (se houver) enquanto a nova chega
    useCache();
    load();
    schedule();
    return { destroy, focusEl: h1 };
  }

  function teardown() {
    if (active) {
      active.destroy();
      active = null;
    }
  }

  /** Tela do ranking. Convenção: { id, route, title, feature, mount(sectionEl), unmount() }. */
  ChecaAi.screens.ranking = {
    id: 'ranking',
    route: '#/ranking',
    title: 'Ranking de hoje',
    feature: 'ranking',

    mount(sectionEl) {
      teardown();
      active = createSession(sectionEl);
      return active.focusEl;
    },

    unmount: teardown
  };
})();
