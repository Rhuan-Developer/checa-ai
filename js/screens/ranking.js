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
    const h1 = el('h1', 'ranking-title', 'Ranking de hoje');
    h1.tabIndex = -1;
    const updated = el('p', 'ranking-updated');
    head.append(h1, updated);

    const exitBtn = el('button', 'btn btn--secondary ranking-exit', 'Sair');
    exitBtn.type = 'button';
    exitBtn.hidden = true;

    const status = el('p', 'ranking-status');
    status.setAttribute('aria-live', 'polite');

    const table = el('table', 'ranking-table');
    const caption = el('caption', 'visually-hidden', 'Ranking de hoje');
    const thead = el('thead');
    const headRow = el('tr');
    const thPos = el('th', 'ranking-table__pos');
    thPos.scope = 'col';
    const posMark = el('span', null, '#');
    posMark.setAttribute('aria-hidden', 'true');
    thPos.append(posMark, el('span', 'visually-hidden', 'Posição'));
    headRow.appendChild(thPos);
    [['Apelido', 'ranking-table__nick'], ['Pontos', 'ranking-table__num'], ['Acertos', 'ranking-table__num'],
      ['Tempo', 'ranking-table__num']].forEach((c) => {
      const th = el('th', c[1], c[0]);
      th.scope = 'col';
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    const tbody = el('tbody');
    table.append(caption, thead, tbody);
    table.hidden = true;

    const actions = el('div', 'ranking-actions');
    const refreshBtn = el('button', 'btn', 'Atualizar');
    refreshBtn.type = 'button';
    const back = el('a', 'btn btn--secondary', 'Voltar');
    back.href = '#/inicio';
    actions.append(refreshBtn, back);

    wrap.append(head, exitBtn, status, table, actions);
    sectionEl.appendChild(wrap);

    // Modo telão: ícone na barra superior do app (mesmo lugar do "Modo apresentação" do simulador)
    const tvBtn = el('button', 'btn-icon');
    tvBtn.type = 'button';
    tvBtn.setAttribute('aria-label', 'Modo telão');
    tvBtn.title = 'Modo telão';
    tvBtn.innerHTML = '<svg class="btn-icon__svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#icon-tv"></use></svg>';
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
        if (isMe) {
          tr.className = 'is-me';
          tr.setAttribute('aria-current', 'true');
        }
        const nick = el('td', 'ranking-table__nick', row.nickname);
        if (isMe) nick.appendChild(el('span', 'visually-hidden', ' (você)'));
        tr.append(
          el('td', 'ranking-table__pos', row.position + 'º'),
          nick,
          el('td', 'ranking-table__num', String(row.score)),
          el('td', 'ranking-table__num', row.correctVerdicts + '/' + row.missionsPlayed),
          el('td', 'ranking-table__num', formatDuration(row.durationMs))
        );
        tbody.appendChild(tr);
      });
      table.hidden = rows.length === 0;

      // Linha de situação: carregando, vazio, sem conexão (uma frase)
      let text = '';
      if (!shown) {
        text = loading ? 'Carregando…' : 'Sem conexão.';
      } else if (offline) {
        text = 'Sem conexão.';
      } else if (!rows.length) {
        text = 'Ninguém jogou ainda hoje.';
      }
      status.textContent = text;
      status.hidden = !text;

      const time = shown ? ChecaAi.utils.formatClock(shown.fetchedAt, tv) : '';
      updated.textContent = shown ? (offline ? 'Lista das ' : 'Atualizado às ') + time : '';
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
