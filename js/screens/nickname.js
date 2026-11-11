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

  /**
   * Apelido do visitante. O campo sempre começa vazio: nunca se reaproveita o apelido de uma partida anterior.
   * Ao começar: sorteia as missões, cria a partida e vai para a primeira missão.
   */
  ChecaAi.screens.nickname = {
    id: 'nickname',
    route: '#/apelido',
    title: 'Apelido',
    feature: 'missions',

    mount(sectionEl) {
      sectionEl.textContent = '';

      const form = el('form', 'game-panel layout-center nickname');
      form.noValidate = true;

      const h1 = el('h1', 'game-title', 'Seu apelido');
      h1.tabIndex = -1;

      const label = el('label', 'field__label', 'Seu apelido de investigador');
      label.htmlFor = 'nickname-input';

      const input = el('input', 'field__input');
      input.id = 'nickname-input';
      input.type = 'text';
      input.name = 'nickname';
      input.maxLength = 20;
      input.autocomplete = 'off';
      input.autocapitalize = 'words';
      input.spellcheck = false;
      input.setAttribute('aria-describedby', 'nickname-error');

      const error = el('p', 'field__error');
      error.id = 'nickname-error';
      error.setAttribute('aria-live', 'polite');

      const submit = el('button', 'btn game-primary', 'Começar');
      submit.type = 'submit';

      form.append(h1, label, input, error, submit);

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const result = ChecaAi.utils.validateNickname(input.value);
        if (!result.ok) {
          error.textContent = result.error;
          input.setAttribute('aria-invalid', 'true');
          input.focus();
          return;
        }
        try {
          const missions = ChecaAi.missions.drawMatch();
          ChecaAi.storage.startMatch(result.value, missions.map((m) => m.id));
        } catch (err) {
          console.error('Não deu para montar a partida:', err);
          error.textContent = 'Não deu para começar. Recarregue a página e tente de novo.';
          return;
        }
        window.location.hash = '#/missao';
      });

      input.addEventListener('input', () => {
        error.textContent = '';
        input.removeAttribute('aria-invalid');
      });

      sectionEl.appendChild(form);
      return input;
    }
  };
})();
