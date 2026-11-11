'use strict';

(function () {
  window.ChecaAi = window.ChecaAi || {};
  const ChecaAi = window.ChecaAi;
  ChecaAi.components = ChecaAi.components || {};

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /** Quadro "Imagem fictícia" com a descrição (usado quando não há foto ou ela não carrega). */
  function buildPlaceholder(alt) {
    const frame = el('figure', 'post-card__placeholder');
    frame.append(el('span', 'post-card__placeholder-label', 'Imagem fictícia'), el('figcaption', 'post-card__placeholder-alt', alt));
    return frame;
  }

  /**
   * Foto real: <img> responsivo com crédito. Se a imagem não carregar, vira o quadro "Imagem fictícia".
   * @param {{src: string, alt: string, credit?: string, width?: number, height?: number}} image
   */
  function buildPhoto(image) {
    const figure = el('figure', 'post-card__photo');
    const img = el('img', 'post-card__img');
    img.alt = image.alt || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    if (image.width) img.width = image.width;
    if (image.height) img.height = image.height;
    figure.appendChild(img);
    if (image.credit) figure.appendChild(el('figcaption', 'post-card__credit', image.credit));
    img.addEventListener('error', () => {
      figure.replaceWith(buildPlaceholder(image.alt || ''));
    }, { once: true });
    img.src = image.src;
    return figure;
  }

  /** Brasão inventado (escudo genérico); cores vêm de --doc-crest-* no theme.css. */
  function buildCrest() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 64 72');
    svg.setAttribute('class', 'post-doc__crest');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    function shape(tag, attrs, fill, stroke) {
      const node = document.createElementNS(SVG_NS, tag);
      Object.keys(attrs).forEach((k) => node.setAttribute(k, attrs[k]));
      node.style.fill = fill;
      node.style.stroke = stroke || 'none';
      if (stroke) node.style.strokeWidth = '2';
      svg.appendChild(node);
    }
    shape('path', { d: 'M8 6 H56 V36 C56 54 44 64 32 69 C20 64 8 54 8 36 Z' }, 'var(--doc-crest-a)', 'var(--doc-crest-b)');
    shape('path', { d: 'M9 42 L32 30 L55 42 V50 L32 38 L9 50 Z' }, 'var(--doc-crest-c)');
    shape('circle', { cx: 32, cy: 21, r: 8 }, 'var(--doc-crest-b)');
    shape('path', { d: 'M24 56 H40 L32 63 Z' }, 'var(--doc-crest-b)');
    return svg;
  }

  /** Faixa diagonal "SIMULAÇÃO": estilos essenciais inline, para existir mesmo sem o CSS do componente. */
  function buildSimulationBand() {
    const band = el('span', 'post-doc__band', 'SIMULAÇÃO');
    band.setAttribute('aria-hidden', 'true');
    band.style.position = 'absolute';
    band.style.left = '-10%';
    band.style.top = '50%';
    band.style.width = '120%';
    band.style.transform = 'translateY(-50%) rotate(-20deg)';
    band.style.pointerEvents = 'none';
    band.style.zIndex = '2';
    return band;
  }

  /**
   * Documento desenhado em HTML/CSS (ofício ou comunicado).
   * @param {Object} doc  mídia da missão com kind 'document'
   */
  function buildDocument(doc) {
    const root = el('div', 'post-doc');
    root.setAttribute('role', 'img');
    root.setAttribute('aria-label', doc.alt || doc.number);
    root.style.position = 'relative';
    root.style.overflow = 'hidden';

    const head = el('div', 'post-doc__head');
    const brand = doc.brand || {};
    const orgEl = el('p', 'post-doc__org', doc.orgLine);
    if (brand.type === 'crest') {
      head.appendChild(buildCrest());
    } else if (brand.type === 'logo' && brand.src) {
      const logo = el('img', 'post-doc__logo');
      logo.alt = brand.alt || '';
      logo.decoding = 'async';
      // O logo já traz o nome da instituição: com logo, a linha é a curta; se o logo falhar, volta a completa.
      logo.addEventListener('error', () => {
        logo.remove();
        orgEl.textContent = doc.orgLine;
      }, { once: true });
      if (doc.orgLineWithLogo) orgEl.textContent = doc.orgLineWithLogo;
      logo.src = brand.src;
      head.appendChild(logo);
    }
    head.appendChild(orgEl);
    if (doc.subtitle) head.appendChild(el('p', 'post-doc__subtitle', doc.subtitle));
    root.appendChild(head);

    root.appendChild(el('p', 'post-doc__number', doc.number));
    root.appendChild(el('p', 'post-doc__body', doc.body));
    root.appendChild(el('p', 'post-doc__place', doc.place + ', ' + doc.date + '.'));

    const sign = el('div', 'post-doc__sign');
    const signature = doc.signature || {};
    if (signature.name) {
      sign.appendChild(el('p', 'post-doc__signature', signature.name));
    } else {
      sign.appendChild(el('span', 'post-doc__sign-line'));
    }
    sign.appendChild(el('p', 'post-doc__role', signature.role || ''));
    root.appendChild(sign);

    root.appendChild(buildSimulationBand());
    return root;
  }

  /**
   * Mensagem fictícia (cabeçalho, selo "Simulação", texto e mídia da missão).
   * Mídia: { kind: 'photo' } foto real com crédito; { kind: 'document' } documento desenhado
   * (no lugar do texto, que fica só para leitor de tela); outro formato ou sem kind: quadro "Imagem fictícia".
   * @param {Object} mission
   * @param {{ariaLabel?: string}} [options]
   * @returns {HTMLElement}
   */
  function render(mission, options) {
    const opts = options || {};
    const card = el('article', 'post-card');
    card.setAttribute('aria-label', opts.ariaLabel || 'Mensagem recebida');

    const top = el('div', 'post-card__top');
    top.append(el('span', 'post-card__header', mission.format.header), el('span', 'post-card__stamp', 'Simulação'));
    card.appendChild(top);
    if (mission.format.badge) card.appendChild(el('p', 'post-card__badge', mission.format.badge));

    const media = mission.image;
    if (media && media.kind === 'document') {
      // Missões: o texto repete o documento e fica só para leitor de tela.
      // Com showContentWithDocument (simulador), o texto é a mensagem que vem acima do documento.
      card.appendChild(el('p', mission.showContentWithDocument ? 'post-card__content' : 'visually-hidden', mission.content));
      card.appendChild(buildDocument(media));
    } else {
      card.appendChild(el('p', 'post-card__content', mission.content));
      if (media && media.kind === 'photo') {
        card.appendChild(buildPhoto(media));
      } else if (media) {
        card.appendChild(buildPlaceholder(media.alt || ''));
      }
    }
    return card;
  }

  ChecaAi.components.postCard = { render };
})();
