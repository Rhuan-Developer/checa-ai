'use strict';

(function () {
  window.ChecaAi = window.ChecaAi || {};
  const ChecaAi = window.ChecaAi;
  ChecaAi.screens = ChecaAi.screens || {};

  const HOME_ROUTE = '#/inicio';

  /** Tela do simulador (parte 1: só título e "Voltar"; a parte 2 completa a tela). */
  ChecaAi.screens.simulator = ChecaAi.screens.simulator || {
    id: 'simulator',
    route: '#/simulador',
    title: 'Como um boato se espalha',
    feature: 'simulator',

    mount(sectionEl) {
      sectionEl.textContent = '';

      const wrap = document.createElement('div');
      wrap.className = 'simulator';

      const h1 = document.createElement('h1');
      h1.tabIndex = -1;
      h1.textContent = 'Como um boato se espalha';

      const back = document.createElement('a');
      back.className = 'btn btn--secondary';
      back.href = HOME_ROUTE;
      back.textContent = 'Voltar';

      wrap.append(h1, back);
      sectionEl.appendChild(wrap);
      return h1;
    }
  };

  /** Telas ligadas, indexadas pela rota. */
  function getRoutes() {
    const features = ChecaAi.config.FEATURES;
    const routes = {};
    Object.keys(ChecaAi.screens).forEach((name) => {
      const screen = ChecaAi.screens[name];
      if (screen.feature && !features[screen.feature]) return;
      routes[screen.route] = screen;
    });
    return routes;
  }

  function showScreen(screen, isFirst) {
    const sections = document.querySelectorAll('[data-screen]');
    let target = null;
    sections.forEach((el) => {
      const isTarget = el.getAttribute('data-screen') === screen.id;
      el.hidden = !isTarget;
      if (isTarget) target = el;
    });
    if (!target) {
      throw new Error('Não existe <section data-screen="' + screen.id + '"> no index.html.');
    }
    const focusEl = screen.mount(target);
    document.title = screen.id === 'home' ? 'Checa Aí' : screen.title + ' · Checa Aí';
    if (focusEl && !isFirst) focusEl.focus();
    window.scrollTo(0, 0);
  }

  let firstRender = true;

  function onRouteChange() {
    try {
      const routes = getRoutes();
      const hash = window.location.hash;
      const screen = routes[hash];
      if (!screen) {
        // Hash vazio, desconhecido ou de funcionalidade desligada: volta ao início.
        if (hash !== HOME_ROUTE) {
          window.location.hash = HOME_ROUTE;
          return;
        }
        showScreen(routes[HOME_ROUTE], firstRender);
      } else {
        showScreen(screen, firstRender);
      }
      firstRender = false;
    } catch (err) {
      console.error('Erro ao abrir a tela:', err);
      const main = document.getElementById('main');
      if (main) {
        main.textContent = 'Não deu para abrir esta tela. Recarregue a página.';
      }
    }
  }

  function fillVersion() {
    const el = document.getElementById('app-version');
    if (el) el.textContent = 'v' + ChecaAi.config.APP_VERSION;
  }

  function start() {
    fillVersion();
    window.addEventListener('hashchange', onRouteChange);
    onRouteChange();
  }

  ChecaAi.app = { start };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
