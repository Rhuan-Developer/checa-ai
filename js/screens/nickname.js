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

      const icon = ChecaAi.utils.icon;
      const HELP = '2 a 20 caracteres';

      const form = el('form', 'nickname');
      form.noValidate = true;

      const card = el('div', 'nickname__card');

      const back = el('a', 'btn btn--quiet nickname__back');
      back.href = '#/inicio';
      back.append(icon('back'), 'Voltar');

      const h1 = el('h1', 'nickname__title', 'Escolha seu apelido');
      h1.tabIndex = -1;
      const lead = el('p', 'nickname__lead', 'Ele aparece no ranking do dia.');

      const field = el('div', 'nickname__field');
      const label = el('label', 'field__label', 'Apelido');
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

      // Linha de ajuda: "2 a 20 caracteres" e o contador; com erro, vira ícone X + a mensagem da validação
      const help = el('div', 'field__help');
      const error = el('p', 'field__error');
      error.id = 'nickname-error';
      error.setAttribute('aria-live', 'polite');
      const count = el('span', 'field__count', '0/20');
      help.append(error, count);

      function showHelp() {
        error.textContent = HELP;
        help.classList.remove('is-error');
        input.removeAttribute('aria-invalid');
      }
      function showError(message) {
        error.textContent = '';
        error.append(icon('x', 16), message);
        help.classList.add('is-error');
        input.setAttribute('aria-invalid', 'true');
      }
      showHelp();

      field.append(label, input, help);

      const submit = el('button', 'btn btn--xl nickname__submit');
      submit.type = 'submit';
      submit.append('Continuar', icon('arrow'));

      card.append(back, h1, lead, field, submit);
      form.appendChild(card);

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const result = ChecaAi.utils.validateNickname(input.value);
        if (!result.ok) {
          showError(result.error);
          input.focus();
          return;
        }
        try {
          const missions = ChecaAi.missions.drawMatch();
          ChecaAi.storage.startMatch(result.value, missions.map((m) => m.id));
        } catch (err) {
          console.error('Não deu para montar a partida:', err);
          showError('Não deu para começar. Recarregue a página e tente de novo.');
          return;
        }
        window.location.hash = '#/missao';
      });

      input.addEventListener('input', () => {
        count.textContent = Array.from(input.value).length + '/20';
        if (help.classList.contains('is-error')) showHelp();
      });

      sectionEl.appendChild(form);
      return input;
    }
  };
})();
