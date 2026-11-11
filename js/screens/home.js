'use strict';

(function () {
  window.ChecaAi = window.ChecaAi || {};
  window.ChecaAi.screens = window.ChecaAi.screens || {};

  /**
   * Tela inicial. Convenção das telas: { id, route, title, feature, mount(sectionEl) }.
   * `feature` é a chave de config.FEATURES que liga a tela (null = sempre ligada).
   * mount() devolve o elemento que recebe o foco ao entrar na tela.
   */
  window.ChecaAi.screens.home = {
    id: 'home',
    route: '#/inicio',
    title: 'Checa Aí',
    feature: null,

    mount(sectionEl) {
      const features = window.ChecaAi.config.FEATURES;

      sectionEl.textContent = '';

      const wrap = document.createElement('div');
      wrap.className = 'home';

      const h1 = document.createElement('h1');
      h1.className = 'home__title';
      h1.tabIndex = -1;
      h1.textContent = 'Checa Aí';

      const tagline = document.createElement('p');
      tagline.className = 'home__tagline';
      tagline.textContent = 'Antes de compartilhar, checa aí.';

      const actions = document.createElement('div');
      actions.className = 'home__actions';

      if (features.missions) {
        const start = document.createElement('a');
        start.className = 'btn';
        start.href = '#/apelido';
        start.textContent = 'Começar investigação';
        actions.appendChild(start);
      }

      if (features.simulator) {
        const a = document.createElement('a');
        a.className = features.missions ? 'btn btn--secondary' : 'btn';
        a.href = '#/simulador';
        a.textContent = 'Como um boato se espalha';
        actions.appendChild(a);
      }

      wrap.append(h1, tagline, actions);
      sectionEl.appendChild(wrap);
      return h1;
    }
  };
})();
