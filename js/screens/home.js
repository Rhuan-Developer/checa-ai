'use strict';

(function () {
  window.ChecaAi = window.ChecaAi || {};
  window.ChecaAi.screens = window.ChecaAi.screens || {};

  /** Ilustração da publicação (cores lisas, só tokens; as classes .art-* estão em screens.css). Markup fixo, sem dado de usuário. */
  function buildArt() {
    const art = document.createElement('div');
    art.className = 'home__art';
    art.setAttribute('aria-hidden', 'true');
    let windows = '';
    [[10, 60, 80], [172, 40, 90], [330, 55, 64]].forEach((b) => {
      for (let y = b[1] + 14; y < 150; y += 26) {
        for (let x = b[0] + 10; x < b[0] + b[2] - 14; x += 22) {
          windows += '<rect x="' + x + '" y="' + y + '" width="12" height="14" class="art-win"/>';
        }
      }
    });
    art.innerHTML =
      '<div class="home__art-card home__art-card--back"></div>' +
      '<div class="home__art-card">' +
        '<div class="home__art-row"><span class="home__art-avatar"></span><span class="home__art-line" style="width:45%"></span></div>' +
        '<span class="home__art-line" style="width:100%"></span>' +
        '<span class="home__art-line" style="width:70%"></span>' +
        '<div class="home__art-photo"><svg viewBox="0 0 400 240" focusable="false">' +
          '<rect width="400" height="240" class="art-sky"/>' +
          '<rect x="10" y="60" width="80" height="130" class="art-b2"/><rect x="96" y="90" width="70" height="100" class="art-b1"/>' +
          '<rect x="172" y="40" width="90" height="150" class="art-b2"/><rect x="268" y="80" width="56" height="110" class="art-b1"/>' +
          '<rect x="330" y="55" width="64" height="135" class="art-b2"/>' + windows +
          '<rect x="118" y="146" width="78" height="26" rx="8" class="art-car"/>' +
          '<rect x="0" y="162" width="400" height="78" class="art-water"/>' +
          '<path d="M20 186h50M150 200h60M260 184h80M60 220h70M250 222h50" class="art-wave"/>' +
        '</svg></div>' +
      '</div>' +
      '<span class="home__art-stamp">ENGANOSA</span>';
    return art;
  }

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
      const icon = window.ChecaAi.utils.icon;

      sectionEl.textContent = '';

      const wrap = document.createElement('div');
      wrap.className = 'home';

      const hero = document.createElement('div');
      hero.className = 'home__hero';

      const text = document.createElement('div');
      text.className = 'home__text';

      const kicker = document.createElement('p');
      kicker.className = 'kicker';
      kicker.textContent = 'CiberMissões 2026';

      const h1 = document.createElement('h1');
      h1.className = 'home__title';
      h1.tabIndex = -1;
      h1.append('Checa ');
      const mark = document.createElement('b');
      mark.textContent = 'Aí';
      h1.appendChild(mark);

      const tagline = document.createElement('p');
      tagline.className = 'home__tagline';
      tagline.textContent = 'Antes de compartilhar, checa aí.';

      const actions = document.createElement('div');
      actions.className = 'home__actions';

      function addAction(href, className, label, iconName) {
        const a = document.createElement('a');
        a.className = className;
        a.href = href;
        a.append(icon(iconName), label);
        actions.appendChild(a);
      }

      if (features.missions) addAction('#/apelido', 'btn btn--xl', 'Começar investigação', 'search');
      if (features.simulator) addAction('#/simulador', features.missions ? 'btn btn--secondary' : 'btn', 'Como um boato se espalha', 'tree');
      if (features.ranking) addAction('#/ranking', 'btn btn--secondary', 'Ranking', 'trophy');

      text.append(kicker, h1, tagline, actions);
      hero.append(text, buildArt());
      wrap.appendChild(hero);

      if (features.missions) {
        const facts = document.createElement('ul');
        facts.className = 'home__facts';
        [['3', 'missões'], ['600', 'pontos'], ['4', 'vereditos']].forEach((f) => {
          const li = document.createElement('li');
          const strong = document.createElement('strong');
          strong.textContent = f[0];
          li.append(strong, f[1]);
          facts.appendChild(li);
        });
        wrap.appendChild(facts);
      }

      const foot = document.createElement('p');
      foot.className = 'home__foot';
      foot.textContent = 'Todas as publicações são fictícias e marcadas como simulação.';
      wrap.appendChild(foot);

      sectionEl.appendChild(wrap);
      return h1;
    }
  };
})();
