/* Checa Aí — peças e telas em HTML puro (sem React). window.ChecaAi */
(function () {
  'use strict';

  var P = {
    lupa: '<circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="2.5"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
    tela: '<rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 20h8M12 16v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    check: '<path d="M5 12.5 10 17.5 19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    x: '<path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    onda: '<path d="M3.5 13c2.2-4 5-4 8.5-1.5S18.3 15 20.5 11" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    q: '<path d="M8.8 9a3.3 3.3 0 1 1 4.9 2.9c-1.1.6-1.7 1.3-1.7 2.6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="18.5" r="1.6" fill="currentColor"/>',
    origem: '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="2"/><path d="M3.5 12h17M12 3.5c3.2 3 3.2 14 0 17M12 3.5c-3.2 3-3.2 14 0 17" stroke="currentColor" stroke-width="2"/>',
    data: '<rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" stroke-width="2"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    contexto: '<rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="10" r="2" fill="currentColor"/><path d="M4 18l5-5 4 4 3-3 5 5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    fontes: '<path d="M5 3.5h10l4 4V20.5H5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8.5 11h7M8.5 15h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    relogio: '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3.2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    sair: '<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    compart: '<circle cx="6" cy="12" r="2.6" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="5.5" r="2.6" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="18.5" r="2.6" stroke="currentColor" stroke-width="2"/><path d="M8.3 10.8 15.7 6.8M8.3 13.2l7.4 4" stroke="currentColor" stroke-width="2"/>',
    arvore: '<circle cx="12" cy="4.5" r="2.3" fill="currentColor"/><circle cx="5" cy="12" r="2.3" fill="currentColor"/><circle cx="12" cy="12" r="2.3" fill="currentColor"/><circle cx="19" cy="12" r="2.3" fill="currentColor"/><path d="M12 6.5 5 10M12 6.5V10M12 6.5l7 3.5M5 14v4M19 14v4" stroke="currentColor" stroke-width="1.8"/><circle cx="5" cy="19.5" r="1.8" fill="currentColor"/><circle cx="19" cy="19.5" r="1.8" fill="currentColor"/>',
    trofeu: '<path d="M7 4h10v5a5 5 0 0 1-10 0z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v3M8 20.5h8M9.5 17h5v3.5h-5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    seta: '<path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    voltar: '<path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    repetir: '<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  function ic(n, s) { s = s || 24; return '<svg class="ca-ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" aria-hidden="true">' + P[n] + '</svg>'; }

  /* ---------- Dados fictícios ---------- */
  var V = [
    { id: 'verdadeira', label: 'Verdadeira', hint: 'Os fatos conferem', ic: 'check', c: 'ok' },
    { id: 'falsa', label: 'Falsa', hint: 'Fato inventado', ic: 'x', c: 'bad' },
    { id: 'enganosa', label: 'Enganosa', hint: 'Fora de contexto', ic: 'onda', c: 'warn' },
    { id: 'semprovas', label: 'Sem provas suficientes', hint: 'Não dá para confirmar', ic: 'q', c: 'unk' }
  ];
  var CLUES = [
    { id: 'origem', label: 'Origem', ic: 'origem', txt: 'A mesma foto aparece em um portal de notícias (fictício) em 14/03/2019.' },
    { id: 'data', label: 'Data', ic: 'data', txt: 'O post é de ontem, 21:47. A foto é cinco anos mais antiga.' },
    { id: 'contexto', label: 'Contexto', ic: 'contexto', txt: 'Ontem choveu 4 mm na cidade, segundo o boletim do tempo (fictício). Pouco para alagar.' },
    { id: 'fontes', label: 'Outras fontes', ic: 'fontes', txt: 'Nenhum jornal local noticiou alagamento ontem.' }
  ];
  var SIGNALS = [
    { t: 'Foto antiga ou de outro lugar', ok: true },
    { t: 'Pede para compartilhar com pressa', ok: true },
    { t: 'Muitas maiúsculas e exclamações', ok: true },
    { t: 'Não cita nenhuma fonte', ok: true },
    { t: 'Foi publicada à noite', ok: false }
  ];
  var RANK = [
    ['Lupa_Rápida', 590, 3, '2:58'], ['Detetive7B', 575, 3, '3:10'], ['FatoOuFake', 560, 3, '3:41'],
    ['Coruja_9A', 485, 2, '3:42'], ['ProfDeHistória', 470, 2, '2:49'], ['Pixel_8A', 455, 2, '3:15'],
    ['Checadora', 430, 2, '4:02'], ['Zé_do_Wi-Fi', 410, 2, '3:33'], ['Turma9C', 395, 2, '4:20'],
    ['Byte_Curioso', 380, 1, '2:41'], ['NãoCaioMais', 350, 1, '3:05'], ['Sabiá_7A', 330, 1, '3:57']
  ];

  /* ---------- Peças ---------- */
  function topbar(right) {
    return '<header class="ca-topbar"><a class="ca-logo" href="#" aria-label="Checa Aí, início">Checa<b>Aí</b></a><div class="ca-topbar-right">' + (right || '') + '</div></header>';
  }
  function scorePill(p) { return '<span class="ca-pill" aria-label="' + p + ' pontos">' + ic('trofeu', 20) + p + ' pts</span>'; }
  function screenBtn() { return '<button type="button" class="ca-iconbtn" data-sim="present" aria-label="Modo apresentação">' + ic('tela', 22) + '</button>'; }

  function floodSvg() {
    var w = '';
    [[10, 60, 80, 130], [172, 40, 90, 150], [330, 55, 64, 135]].forEach(function (b) {
      for (var y = b[1] + 14; y < 150; y += 26) for (var x = b[0] + 10; x < b[0] + b[2] - 14; x += 22) w += '<rect x="' + x + '" y="' + y + '" width="12" height="14" class="i-win"/>';
    });
    return '<svg viewBox="0 0 400 240" role="img" aria-label="Foto simulada de uma rua alagada">' +
      '<style>.i-sky{fill:var(--illu-sky)}.i-win{fill:var(--highlight)}.i-b1{fill:var(--illu-building)}.i-b2{fill:var(--illu-building-2)}.i-water{fill:var(--illu-water)}.i-car{fill:var(--bad)}.i-wave{stroke:var(--ink-muted);stroke-width:3;stroke-linecap:round;fill:none}</style>' +
      '<rect width="400" height="240" class="i-sky"/>' +
      '<rect x="10" y="60" width="80" height="130" class="i-b2"/><rect x="96" y="90" width="70" height="100" class="i-b1"/><rect x="172" y="40" width="90" height="150" class="i-b2"/><rect x="268" y="80" width="56" height="110" class="i-b1"/><rect x="330" y="55" width="64" height="135" class="i-b2"/>' + w +
      '<rect x="118" y="146" width="78" height="26" rx="8" class="i-car"/>' +
      '<rect x="0" y="162" width="400" height="78" class="i-water"/>' +
      '<path d="M20 186h50M150 200h60M260 184h80M60 220h70M250 222h50" class="i-wave"/></svg>';
  }

  function post() {
    return '<article class="ca-post" aria-label="Publicação simulada">' +
      '<header class="ca-post-head"><span class="ca-avatar">AC</span><div class="ca-post-who"><strong>Alerta Cidade 24h</strong><span class="ca-handle">@alertacidade24h · ontem, 21:47</span></div><span class="ca-sim-tag">Simulação</span></header>' +
      '<p class="ca-post-text">Olha como ficou o Centro depois da chuva de ontem!!! NINGUÉM avisou. Compartilhe antes que apaguem!</p>' +
      '<figure class="ca-post-media"><div class="ca-sim-band">SIMULAÇÃO</div>' + floodSvg() + '</figure>' +
      '<footer class="ca-post-foot"><span>12,4 mil compartilhamentos</span><span>3,1 mil comentários</span></footer></article>';
  }
  function postDoc() {
    return '<article class="ca-post" aria-label="Publicação simulada com documento">' +
      '<header class="ca-post-head"><span class="ca-avatar" style="background:var(--ok)">FV</span><div class="ca-post-who"><strong>Fala, Vila</strong><span class="ca-handle">@falavila · hoje, 08:15</span></div><span class="ca-sim-tag">Simulação</span></header>' +
      '<p class="ca-post-text">Vazou o comunicado: provas canceladas na semana que vem.</p>' +
      '<div class="ca-doc"><div class="ca-sim-band">SIMULAÇÃO</div><span class="ca-doc-org">Secretaria de Educação de Vila Esperança (fictícia)</span><span class="ca-doc-title">Comunicado nº 027</span><span class="ca-doc-line" style="width:100%"></span><span class="ca-doc-line" style="width:92%"></span><span class="ca-doc-line" style="width:96%"></span><span class="ca-doc-line" style="width:60%"></span><span class="ca-doc-sign">Assinatura ilegível</span></div>' +
      '<footer class="ca-post-foot"><span>8,9 mil compartilhamentos</span><span>1,2 mil comentários</span></footer></article>';
  }

  function clueText(id) { var c = CLUES.filter(function (x) { return x.id === id; })[0]; return '<strong>' + c.label + '</strong>' + c.txt; }
  function clues(open) {
    return '<div class="ca-clues">' + CLUES.map(function (c) {
      return '<button type="button" class="ca-clue" aria-pressed="' + (open === c.id) + '" data-clue="' + c.id + '">' + ic(c.ic) + '<span>' + c.label + '</span></button>';
    }).join('') + '</div><div class="ca-clue-out" data-clue-out aria-live="polite"' + (open ? '' : ' hidden') + '>' + (open ? clueText(open) : '') + '</div>';
  }
  function signals(checked) {
    checked = checked || [];
    return '<div class="ca-signals" role="group" aria-label="Sinais suspeitos">' + SIGNALS.map(function (s, i) {
      return '<button type="button" role="checkbox" class="ca-check" data-toggle aria-checked="' + (checked.indexOf(i) > -1) + '"><span class="ca-check-box">' + ic('check', 18) + '</span>' + s.t + '</button>';
    }).join('') + '</div>';
  }
  function verdicts(sel) {
    return '<div class="ca-verdicts" role="radiogroup" aria-label="Veredito" data-group>' + V.map(function (v) {
      return '<button type="button" role="radio" class="ca-verdict ca-verdict--' + v.c + '" aria-checked="' + (sel === v.id) + '" data-pick="' + v.id + '"><span class="ca-verdict-ic">' + ic(v.ic, 22) + '</span><b>' + v.label + '</b><small>' + v.hint + '</small></button>';
    }).join('') + '</div>';
  }
  function steps(now) {
    return '<ol class="ca-steps" aria-label="Missão ' + now + ' de 3">' + [1, 2, 3].map(function (n) { return '<li class="' + (n < now ? 'is-done' : n === now ? 'is-now' : '') + '"></li>'; }).join('') + '</ol>';
  }
  function level(l) { var m = { facil: 'Fácil', media: 'Média', dificil: 'Difícil' }; return '<span class="ca-pill ca-level--' + l + '">' + m[l] + '</span>'; }
  function timer(t) { return '<span class="ca-pill">' + ic('relogio', 20) + t + '</span>'; }

  function rankTable(me, n) {
    var rows = RANK.slice(0, n || RANK.length).map(function (r, i) {
      var cls = (i < 3 ? 'is-top ' : '') + (i === me ? 'is-me' : '');
      return '<tr class="' + cls + '"><td><span class="ca-pos">' + (i + 1) + 'º</span></td>' +
        '<td class="ca-name"><b>' + r[0] + '</b>' + (i === me ? '<span class="ca-you">Você</span>' : '') + '<span class="ca-sub">' + r[2] + ' de 3 acertos · ' + r[3] + '</span></td>' +
        '<td class="num"><b>' + r[1] + '</b></td><td class="num ca-col-x">' + r[2] + ' de 3</td><td class="num ca-col-x">' + r[3] + '</td></tr>';
    }).join('');
    return '<table class="ca-table"><thead><tr><th>Pos.</th><th>Apelido</th><th class="num">Pontos</th><th class="num ca-col-x">Acertos</th><th class="num ca-col-x">Tempo</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  /* Árvore de compartilhamentos */
  function simLevels(mode, rounds) {
    var L = [[{ p: -1, c: false }]];
    for (var k = 1; k <= rounds; k++) {
      var prev = L[k - 1], cur = [];
      prev.forEach(function (nd, i) { if (!nd.c) for (var j = 0; j < 3; j++) cur.push({ p: i, c: false }); });
      if (mode) { var cnt = Math.round(cur.length * mode / 100); for (var t = 0; t < cnt; t++) cur[Math.floor((t + 0.5) * cur.length / cnt)].c = true; }
      L.push(cur);
    }
    return L;
  }
  function simCount(mode, rounds) {
    var L = simLevels(mode, rounds), rec = 0, chk = 0, sh = 0;
    L.forEach(function (lv, k) { rec += lv.length; lv.forEach(function (n) { if (n.c) chk++; else if (k < rounds) sh++; }); });
    return { rec: rec, chk: chk, sh: sh };
  }
  function tree(mode, rounds) {
    var W = 1000, H = 400, L = simLevels(mode, rounds), R = [18, 13, 9, 6, 4], pos = [], e = '', n = '';
    L.forEach(function (lv, k) {
      var y = 34 + k * 82;
      pos[k] = lv.map(function (_, i) { return [(i + 0.5) * W / lv.length, y]; });
      lv.forEach(function (nd, i) {
        var p = pos[k][i];
        if (k > 0) { var q = pos[k - 1][nd.p]; e += '<line class="t-edge" x1="' + q[0].toFixed(1) + '" y1="' + q[1] + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1] + '"/>'; }
        n += '<circle class="' + (k === 0 ? 't-you' : nd.c ? 't-check' : 't-share') + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1] + '" r="' + R[k] + '"/>';
      });
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Árvore de compartilhamentos, rodada ' + rounds + '">' + e + n + '<text class="t-label" x="' + (W / 2 + 28) + '" y="42">Você</text></svg>';
  }
  function treeBlock(st) {
    return '<div class="ca-tree">' + tree(st.mode, st.round) + '<div class="ca-legend"><span><i class="ca-dot-you"></i>Você</span><span><i class="ca-dot-share"></i>Compartilhou</span><span><i class="ca-dot-check"></i>Checou e parou</span></div></div>';
  }
  function counters(st) {
    var c = simCount(st.mode, st.round);
    return '<div class="ca-counters"><div class="ca-counter"><span>Rodada</span><strong>' + st.round + '</strong></div><div class="ca-counter"><span>Receberam</span><strong>' + c.rec + '</strong></div><div class="ca-counter"><span>Compartilharam</span><strong>' + c.sh + '</strong></div><div class="ca-counter is-check"><span>Checaram</span><strong>' + c.chk + '</strong></div></div>';
  }
  function modeSeg(mode) {
    return '<div class="ca-seg" role="group" aria-label="Cenário"><button type="button" data-sim="mode" data-val="0" aria-pressed="' + (mode === 0) + '">Ninguém checou</button><button type="button" data-sim="mode" data-val="30" aria-pressed="' + (mode === 30) + '">30% checaram</button></div>';
  }
  function compare() {
    var a = simCount(0, 6).rec, b = simCount(30, 6).rec, f = function (x) { return x.toLocaleString('pt-BR'); };
    return '<section class="ca-block"><h2 class="ca-h3">Depois de 6 rodadas</h2><div class="ca-cmp">' +
      '<div class="ca-cmp-row"><div class="ca-cmp-top"><span>Ninguém checou</span><b>' + f(a) + ' pessoas</b></div><div class="ca-bar ca-bar--bad"><span style="width:100%"></span></div></div>' +
      '<div class="ca-cmp-row"><div class="ca-cmp-top"><span>30% checaram</span><b>' + f(b) + ' pessoas</b></div><div class="ca-bar ca-bar--ok"><span style="width:' + (b / a * 100).toFixed(1) + '%"></span></div></div>' +
      '<p class="ca-cmp-note">' + Math.round(a / b) + ' vezes menos gente recebeu o boato.</p></div></section>';
  }
  function simControls(st) {
    return '<button type="button" class="ca-btn ca-btn--primary" data-sim="next"' + (st.round >= 4 ? ' disabled' : '') + '>Próxima rodada' + ic('seta') + '</button><button type="button" class="ca-btn ca-btn--secondary" data-sim="reset">' + ic('repetir') + 'Recomeçar</button>';
  }

  /* ---------- Telas ---------- */
  var S = {};
  S.inicio = function () {
    return topbar('') + '<main class="ca-main ca-home"><section class="ca-hero"><div class="ca-hero-text">' +
      '<p class="ca-kicker">Mostra de Informática</p><h1 class="ca-display ca-brand">Checa <b>Aí</b></h1>' +
      '<p class="ca-lead">Investigue publicações, encontre os sinais e dê seu veredito.</p>' +
      '<div class="ca-actions"><button type="button" class="ca-btn ca-btn--primary ca-btn--xl">' + ic('lupa') + 'Começar investigação</button>' +
      '<button type="button" class="ca-btn ca-btn--secondary">' + ic('arvore') + 'Como um boato se espalha</button>' +
      '<button type="button" class="ca-btn ca-btn--secondary">' + ic('trofeu') + 'Ranking</button></div></div>' +
      '<div class="ca-art" aria-hidden="true"><div class="ca-art-card is-back"></div><div class="ca-art-card"><div class="ca-art-row"><span class="ca-art-av"></span><span class="ca-art-line" style="width:45%"></span></div><span class="ca-art-line" style="width:100%"></span><span class="ca-art-line" style="width:70%"></span><div class="ca-art-img">' + floodSvg() + '</div></div><span class="ca-stamp">ENGANOSA</span></div>' +
      '</section><ul class="ca-facts"><li><strong>3</strong>missões</li><li><strong>600</strong>pontos</li><li><strong>4</strong>vereditos</li></ul>' +
      '<p class="ca-foot">Todas as publicações são fictícias e marcadas como simulação.</p></main>';
  };
  S.apelido = function (st) {
    var err = st && st.err, v = err ? 'C' : 'Coruja_9A';
    return topbar('') + '<main class="ca-main ca-narrow"><div class="ca-nick">' +
      '<button type="button" class="ca-btn ca-btn--quiet ca-back">' + ic('voltar', 20) + 'Voltar</button>' +
      '<h1 class="ca-h1">Escolha seu apelido</h1><p class="ca-muted" style="margin-top:8px">Ele aparece no ranking do dia.</p>' +
      '<label class="ca-field"><span class="ca-label">Apelido</span><input class="ca-input' + (err ? ' is-error' : '') + '" data-nick maxlength="20" autocomplete="off" value="' + v + '" aria-describedby="nick-help">' +
      '<span class="ca-help' + (err ? ' is-error' : '') + '" id="nick-help"><span class="ca-help-msg">' + (err ? ic('x', 16) + 'Use pelo menos 2 caracteres' : '2 a 20 caracteres') + '</span><span class="ca-count">' + v.length + '/20</span></span></label>' +
      '<button type="button" class="ca-btn ca-btn--primary ca-btn--xl" data-nick-go style="width:100%"' + (err ? ' disabled' : '') + '>Continuar' + ic('seta') + '</button></div></main>';
  };
  S.missao = function (st) {
    var sel = st && st.sel;
    return topbar(scorePill(190)) + '<main class="ca-main">' +
      '<div class="ca-mhead"><div><p class="ca-kicker">Missão 2 de 3</p><h1 class="ca-h2">A rua alagada</h1></div><div class="ca-mmeta">' + level('media') + timer('01:12') + '</div>' + steps(2) + '</div>' +
      '<div class="ca-mgrid"><div class="ca-mpost">' + post() + '</div><div class="ca-mtools">' +
      '<section class="ca-block"><h2 class="ca-h3">Pistas</h2>' + clues('origem') + '</section>' +
      '<section class="ca-block"><h2 class="ca-h3">Sinais suspeitos</h2>' + signals(sel ? [0, 1, 2] : [0, 1]) + '</section>' +
      '<section class="ca-block ca-span"><h2 class="ca-h3">Seu veredito</h2>' + verdicts(sel) + '</section>' +
      '<div class="ca-confirm ca-span"><button type="button" class="ca-btn ca-btn--primary ca-btn--xl" data-confirm' + (sel ? '' : ' disabled') + '>Confirmar veredito</button></div>' +
      '</div></div></main>';
  };
  S.resultado = function (st) {
    var bad = st && st.bad;
    var rev = SIGNALS.map(function (s, i) {
      var marked = i < 3, k, tag;
      if (s.ok && marked) { k = 'ok'; tag = 'Você marcou. Certo!'; }
      else if (s.ok && !marked) { k = 'bad'; tag = 'Faltou marcar'; }
      else { k = 'neutral'; tag = 'Não era sinal. Bem deixado de lado.'; }
      return '<li><span class="ca-mark ca-mark--' + k + '">' + ic(k === 'bad' ? 'x' : k === 'ok' ? 'check' : 'check', 16) + '</span><div>' + s.t + '<span class="ca-review-tag is-' + k + '">' + tag + '</span></div></li>';
    }).join('');
    var pv = bad ? 0 : 100, total = pv + 45 + 30;
    return topbar(scorePill(190 + total)) + '<main class="ca-main ca-mid">' +
      '<div class="ca-result ca-result--' + (bad ? 'bad' : 'ok') + '"><span class="ca-result-ic">' + ic(bad ? 'x' : 'check', 34) + '</span><div class="ca-result-body"><p class="ca-kicker">Missão 2 de 3</p><h1 class="ca-h1">' + (bad ? 'Não foi dessa vez' : 'Acertou!') + '</h1>' +
      '<p>' + (bad ? 'Você marcou <b>Falsa</b>. O certo é <b>Enganosa</b>: a foto é real, mas é de março de 2019.' : 'É <b>Enganosa</b>: a foto é real, mas é de março de 2019.') + '</p></div></div>' +
      '<div class="ca-rgrid"><section class="ca-block"><h2 class="ca-h3">Sinais</h2><ul class="ca-review">' + rev + '</ul></section>' +
      '<section class="ca-block"><h2 class="ca-h3">Pontos</h2><ul class="ca-points"><li><span>Veredito</span><b>+' + pv + '</b></li><li><span>Sinais (3 de 4)</span><b>+45</b></li><li><span>Rapidez</span><b>+30</b></li></ul>' +
      '<div class="ca-total"><strong>' + total + '</strong><span>/ 200</span></div><div class="ca-bar"><span style="width:' + total / 2 + '%"></span></div></section></div>' +
      '<div class="ca-actions"><button type="button" class="ca-btn ca-btn--primary ca-btn--xl">Próxima missão' + ic('seta') + '</button></div></main>';
  };
  S.fim = function () {
    var ms = [['facil', 'Fácil', 'O print do diretor', true, 190], ['media', 'Média', 'A rua alagada', true, 175], ['dificil', 'Difícil', 'O comunicado vazado', false, 120]];
    return topbar('') + '<main class="ca-main"><p class="ca-kicker">Partida concluída</p><h1 class="ca-h1">Fim da partida</h1><div class="ca-final">' +
      '<section class="ca-scorecard"><p class="ca-kicker">Pontuação</p><p class="ca-bignum">485<small> / 600</small></p><div class="ca-bar"><span style="width:80.8%"></span></div></section>' +
      '<section class="ca-placecard"><p class="ca-kicker">Ranking do dia</p><p class="ca-place">Você está em<strong>4º</strong></p><p>de 37 jogadores</p></section>' +
      '<section class="ca-block ca-span"><h2 class="ca-h3">Suas missões</h2><ul class="ca-mlist">' + ms.map(function (m) {
        return '<li><span class="ca-mark ca-mark--' + (m[3] ? 'ok' : 'bad') + '">' + ic(m[3] ? 'check' : 'x', 16) + '</span><div><b>' + m[2] + '</b><small>' + m[1] + '</small></div><b>' + m[4] + '</b></li>';
      }).join('') + '</ul><div class="ca-mstats"><div><span class="ca-label ca-muted">Acertos</span><strong>2 de 3</strong></div><div><span class="ca-label ca-muted">Tempo</span><strong>3:42</strong></div></div></section></div>' +
      '<div class="ca-actions"><button type="button" class="ca-btn ca-btn--primary ca-btn--xl">' + ic('trofeu') + 'Ver o ranking</button><button type="button" class="ca-btn ca-btn--secondary ca-btn--xl">' + ic('repetir') + 'Jogar de novo</button></div></main>';
  };
  S.ranking = function () {
    return topbar('<button type="button" class="ca-btn ca-btn--quiet" aria-label="Modo telão">' + ic('tela', 22) + 'Telão</button>') +
      '<main class="ca-main ca-mid"><div class="ca-rank-head"><div><p class="ca-kicker">Sábado, 14 de novembro</p><h1 class="ca-h1">Ranking do dia</h1></div><span class="ca-pill">37 jogadores</span></div>' +
      rankTable(3) + '<p class="ca-foot" style="margin:12px 0 24px">Empate: quem fez em menos tempo fica na frente.</p>' +
      '<div class="ca-actions"><button type="button" class="ca-btn ca-btn--primary ca-btn--xl">' + ic('repetir') + 'Jogar de novo</button><button type="button" class="ca-btn ca-btn--secondary ca-btn--xl">Início</button></div></main>';
  };
  S.telao = function () {
    var rows = RANK.slice(0, 10).map(function (r, i) {
      return '<div class="ca-srow' + (i < 3 ? ' is-top' : '') + (i === 0 ? ' is-first' : '') + '"><span class="ca-spos">' + (i + 1) + '</span><span>' + r[0] + '</span><span class="num">' + r[1] + '</span><span class="num dim">' + r[2] + ' de 3</span><span class="num dim">' + r[3] + '</span></div>';
    }).join('');
    return '<div class="ca-stage"><div class="ca-stage-top"><div><span class="ca-logo">Checa<b>Aí</b></span><h1 class="ca-stage-title">Ranking do dia</h1></div>' +
      '<div class="ca-stage-side"><div class="ca-clock">' + ic('relogio', 44) + '<div>Atualizado às<strong>14:32</strong>próxima em 12 s</div></div><button type="button" class="ca-btn ca-btn--stage">' + ic('sair', 28) + 'Sair</button></div></div>' +
      '<div class="ca-stage-list"><div class="ca-srow ca-srow--head"><span>Pos.</span><span>Apelido</span><span class="num">Pontos</span><span class="num">Acertos</span><span class="num">Tempo</span></div>' + rows + '</div></div>';
  };
  S.simulador = function (st) {
    if (st.phase === 'msg') {
      return topbar(screenBtn()) + '<main class="ca-main ca-mid"><div class="ca-sim-intro"><p class="ca-kicker">Simulador</p><h1 class="ca-h1">Chegou no seu celular</h1></div>' +
        '<div class="ca-phone"><div class="ca-phone-screen"><div class="ca-phone-top"><span class="ca-avatar">9A</span><div><b>Grupo da Turma 9A</b><br><span class="ca-handle">32 participantes</span></div></div>' +
        '<div class="ca-bubble"><span class="ca-sim-tag">Simulação</span><span class="ca-bubble-fwd">Encaminhada com frequência</span><p>URGENTE!!! Amanhã não vai ter aula, vai faltar água na cidade toda. Repassa pra todo mundo!!</p><span class="ca-bubble-time">07:42</span></div></div></div>' +
        '<div class="ca-actions ca-actions--center"><button type="button" class="ca-btn ca-btn--primary ca-btn--xl" data-sim="share">' + ic('compart') + 'Compartilhar</button><button type="button" class="ca-btn ca-btn--secondary ca-btn--xl" data-sim="check">' + ic('lupa') + 'Checar antes</button></div></main>';
    }
    if (st.phase === 'present') {
      return '<div class="ca-present"><div class="ca-present-top"><h1 class="ca-h1">Como um boato se espalha</h1><button type="button" class="ca-btn ca-btn--secondary" data-sim="exit" style="width:auto">' + ic('sair') + 'Sair</button></div>' +
        '<div class="ca-sim-grid">' + treeBlock(st) + counters(st) + '</div>' +
        '<div class="ca-present-bottom">' + modeSeg(st.mode) + '<div class="ca-actions">' + simControls(st) + '</div></div></div>';
    }
    return topbar(screenBtn()) + '<main class="ca-main"><div class="ca-sim-head"><div><p class="ca-kicker">Simulador</p><h1 class="ca-h2">Como um boato se espalha</h1></div>' + modeSeg(st.mode) + '</div>' +
      (st.checked ? '<div class="ca-note"><span class="ca-mark ca-mark--ok">' + ic('check', 16) + '</span>Você checou: a corrente parou em você.</div>' : '') +
      '<div class="ca-sim-grid">' + treeBlock(st) + counters(st) + '</div>' +
      '<div class="ca-actions ca-sim-controls">' + simControls(st) + '</div>' + compare() + '</main>';
  };
  function simAct(st, act, val) {
    if (act === 'share') { st.phase = 'tree'; st.round = 1; st.mode = 0; st.checked = false; }
    else if (act === 'check') { st.phase = 'tree'; st.round = 1; st.mode = 30; st.checked = true; }
    else if (act === 'next') st.round = Math.min(4, st.round + 1);
    else if (act === 'reset') { st.phase = 'msg'; st.round = 1; st.checked = false; }
    else if (act === 'mode') st.mode = +val;
    else if (act === 'present') st.phase = 'present';
    else if (act === 'exit') st.phase = 'tree';
  }

  /* ---------- Interações ---------- */
  function wire(app, ctx) {
    app.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || !app.contains(b)) return;
      if (b.dataset.pick) {
        b.closest('[data-group]').querySelectorAll('[data-pick]').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
        var c = app.querySelector('[data-confirm]'); if (c) c.disabled = false;
      } else if (b.hasAttribute('data-toggle')) {
        b.setAttribute('aria-checked', String(b.getAttribute('aria-checked') !== 'true'));
      } else if (b.dataset.clue) {
        app.querySelectorAll('[data-clue]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        var o = app.querySelector('[data-clue-out]'); o.hidden = false; o.innerHTML = clueText(b.dataset.clue);
      } else if (b.dataset.sim && ctx && ctx.sim) {
        ctx.sim(b.dataset.sim, b.dataset.val);
      }
    });
    app.addEventListener('input', function (e) {
      var t = e.target; if (!t.matches || !t.matches('[data-nick]')) return;
      var n = t.value.trim().length, bad = n < 2, h = app.querySelector('.ca-help');
      t.classList.toggle('is-error', bad); h.classList.toggle('is-error', bad);
      h.querySelector('.ca-help-msg').innerHTML = bad ? ic('x', 16) + 'Use pelo menos 2 caracteres' : '2 a 20 caracteres';
      h.querySelector('.ca-count').textContent = t.value.length + '/20';
      var g = app.querySelector('[data-nick-go]'); if (g) g.disabled = bad;
    });
  }

  /* ---------- Visualizador de dispositivos ---------- */
  var SIZES = [
    { id: 'cel', label: 'Celular', w: 390, h: 844, phone: true },
    { id: 'tab', label: 'Tablet', w: 820, h: 1180 },
    { id: 'note', label: 'Notebook', w: 1440, h: 900 }
  ];
  var TELAO = [{ id: 'telao', label: 'Telão', w: 1920, h: 1080, fixed: true }];
  var DEFS = {
    inicio: { render: S.inicio, states: [{ label: 'Padrão', st: {} }] },
    apelido: { render: S.apelido, states: [{ label: 'Válido', st: {} }, { label: 'Erro', st: { err: true } }] },
    missao: { render: S.missao, states: [{ label: 'Investigando', st: {} }, { label: 'Veredito marcado', st: { sel: 'enganosa' } }] },
    resultado: { render: S.resultado, states: [{ label: 'Acerto', st: {} }, { label: 'Erro', st: { bad: true } }] },
    fim: { render: S.fim, states: [{ label: 'Padrão', st: {} }] },
    ranking: { render: S.ranking, states: [{ label: 'Padrão', st: {} }] },
    telao: { render: S.telao, states: [{ label: 'Top 10', st: {} }], sizes: TELAO },
    simulador: { render: S.simulador, states: [
      { label: 'Mensagem', st: { phase: 'msg', round: 1, mode: 0 } },
      { label: 'Árvore', st: { phase: 'tree', round: 3, mode: 0 } },
      { label: '30% checaram', st: { phase: 'tree', round: 4, mode: 30 } },
      { label: 'Apresentação', st: { phase: 'present', round: 4, mode: 0 }, fixed: true, sizes: SIZES.concat(TELAO) }
    ] }
  };

  function mount(root, name) {
    var def = DEFS[name], sel = { s: 0, z: 'all' };
    root.classList.add('ca-dv');
    function seg(items, cur, key) {
      return '<div class="ca-dv-seg" role="group">' + items.map(function (it) { return '<button type="button" data-' + key + '="' + it[0] + '" aria-pressed="' + (String(it[0]) === String(cur)) + '">' + it[1] + '</button>'; }).join('') + '</div>';
    }
    function draw() {
      var state = def.states[sel.s], sizes = state.sizes || def.sizes || SIZES;
      if (sel.z !== 'all' && !sizes.some(function (z) { return z.id === sel.z; })) sel.z = 'all';
      var bar = (def.states.length > 1 ? seg(def.states.map(function (s, i) { return [i, s.label]; }), sel.s, 'dvs') : '') +
        (sizes.length > 1 ? seg([['all', 'Todos']].concat(sizes.map(function (z) { return [z.id, z.label]; })), sel.z, 'dvz') : '');
      root.innerHTML = (bar ? '<div class="ca-dv-bar">' + bar + '</div>' : '') + '<div class="ca-dv-stage"><div class="ca-dv-row"></div></div>';
      var row = root.querySelector('.ca-dv-row');
      sizes.filter(function (z) { return sel.z === 'all' || z.id === sel.z; }).forEach(function (z) {
        var fixed = z.fixed || state.fixed, fig = document.createElement('figure');
        fig.className = 'ca-dv-fig';
        fig.innerHTML = '<figcaption class="ca-dv-cap">' + z.label + ' · ' + z.w + ' px</figcaption><div class="ca-dv-screen' + (z.phone ? ' is-phone' : '') + (fixed ? ' is-fixed' : '') + '" style="width:' + z.w + 'px;' + (fixed ? 'height' : 'min-height') + ':' + z.h + 'px"><div class="ca-app"></div></div>';
        row.appendChild(fig);
        var app = fig.querySelector('.ca-app'), st = JSON.parse(JSON.stringify(state.st));
        app.innerHTML = def.render(st);
        wire(app, { sim: function (a, v) { simAct(st, a, v); app.innerHTML = def.render(st); fit(); } });
      });
      fit();
    }
    function fit() {
      var stage = root.querySelector('.ca-dv-stage'), row = root.querySelector('.ca-dv-row'); if (!row) return;
      row.style.transform = 'none';
      var s = Math.min(1, stage.clientWidth / row.scrollWidth);
      row.style.transform = 'scale(' + s + ')';
      stage.style.height = Math.ceil(row.offsetHeight * s) + 'px';
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-dvs],[data-dvz]'); if (!b) return;
      if (b.dataset.dvs != null) sel.s = +b.dataset.dvs; else sel.z = b.dataset.dvz;
      draw();
    });
    draw();
    if (window.ResizeObserver) { var lw = 0; new ResizeObserver(function () { if (root.clientWidth !== lw) { lw = root.clientWidth; fit(); } }).observe(root); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }

  window.ChecaAi = {
    icon: ic, wire: wire, mount: mount, screens: S,
    parts: { topbar: topbar, scorePill: scorePill, post: post, postDoc: postDoc, clues: clues, signals: signals, verdicts: verdicts, steps: steps, level: level, timer: timer, rankTable: rankTable, tree: tree, treeBlock: treeBlock, counters: counters, modeSeg: modeSeg, compare: compare, simAct: simAct },
    data: { verdicts: V, clues: CLUES, signals: SIGNALS, ranking: RANK }
  };
})();
