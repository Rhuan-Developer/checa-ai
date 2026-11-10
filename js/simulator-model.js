'use strict';

(function () {
  window.ChecaAi = window.ChecaAi || {};

  /**
   * Modelo do simulador "Como um boato se espalha". Só funções puras: nada de DOM, nada de estado.
   * Todas aceitam `random` (devolve número em [0,1)) para teste; o padrão é Math.random.
   *
   * Regras: a rodada 0 é o celular do visitante, que compartilhou. Cada pessoa que compartilha
   * manda para `fanout` pessoas novas. Cada pessoa que recebe, com probabilidade `checkRate`,
   * checa e NÃO repassa (o ramo para); senão repassa.
   *
   * @typedef {Object} TreeNode
   * @property {number} id
   * @property {number|null} parentId  null na raiz
   * @property {number} round  0 = visitante; 1..N = quem recebeu naquela rodada
   * @property {'share'|'check'} action
   *
   * @typedef {Object} RoundRow
   * @property {number} round
   * @property {number} received  recebeu nesta rodada
   * @property {number} checked  dos que receberam, quantos checaram
   * @property {number} sharedTotal  repassaram, acumulado (não conta o visitante)
   * @property {number} receivedTotal  receberam, acumulado
   * @property {number} checkedTotal  checaram, acumulado
   * @property {number} shared  repassaram nesta rodada (received - checked)
   */

  /** Teto de nós desenhados na árvore. */
  const MAX_TREE_NODES = 400;

  /** Até esse tamanho a contagem de quem checa é exata (um sorteio por pessoa). */
  const EXACT_SAMPLE_LIMIT = 64;

  /**
   * Quantas rodadas cabem sob o teto de nós.
   * Decisão: o teto vale para o pior caso (ninguém checa, árvore cheia: 1 + f + f² + ...), por isso
   * `roundsDrawn` depende só de `fanout` e `maxRounds`, nunca do sorteio. Fanout 3 -> 5 rodadas
   * (364 nós); fanout 4 -> 4 (341); fanout 5 -> 3 (156); fanout 2 -> 5 (63). Rodada que não cabe
   * inteira não é desenhada (corta no último anel inteiro).
   * @param {number} fanout
   * @param {number} maxRounds
   * @returns {number}
   */
  function roundsThatFit(fanout, maxRounds) {
    let total = 1;
    let ring = 1;
    let rounds = 0;
    while (rounds < maxRounds) {
      ring *= fanout;
      if (total + ring > MAX_TREE_NODES) break;
      total += ring;
      rounds++;
    }
    return rounds;
  }

  /**
   * Monta a árvore de compartilhamentos para desenhar.
   * @param {{fanout: number, checkRate: number, maxRounds?: number, random?: () => number}} opts
   * @returns {{nodes: TreeNode[], roundsDrawn: number}}
   */
  function buildTree(opts) {
    const fanout = opts.fanout;
    const checkRate = opts.checkRate;
    const random = opts.random || Math.random;
    const maxRounds = opts.maxRounds === undefined ? 5 : opts.maxRounds;
    const roundsDrawn = roundsThatFit(fanout, maxRounds);

    /** @type {TreeNode[]} */
    const nodes = [{ id: 0, parentId: null, round: 0, action: 'share' }];
    let frontier = [nodes[0]];
    for (let round = 1; round <= roundsDrawn; round++) {
      const next = [];
      frontier.forEach((parent) => {
        for (let i = 0; i < fanout; i++) {
          const node = {
            id: nodes.length,
            parentId: parent.id,
            round,
            action: random() < checkRate ? 'check' : 'share'
          };
          nodes.push(node);
          if (node.action === 'share') next.push(node);
        }
      });
      frontier = next;
    }
    return { nodes, roundsDrawn };
  }

  /**
   * Posição angular de cada nó: o filho ocupa uma fatia da fatia do pai (a raiz tem 360°).
   * @param {TreeNode[]} nodes
   * @returns {Array<{angle: number, a0: number, a1: number}>} indexado pelo id do nó; ângulos em radianos
   */
  function layoutAngles(nodes) {
    const layout = new Array(nodes.length);
    const children = new Map();
    nodes.forEach((n) => {
      if (n.parentId === null) return;
      if (!children.has(n.parentId)) children.set(n.parentId, []);
      children.get(n.parentId).push(n.id);
    });
    layout[0] = { angle: 0, a0: -Math.PI / 2, a1: -Math.PI / 2 + 2 * Math.PI };
    // Os nós já estão em ordem de rodada, então o pai sempre vem antes do filho.
    nodes.forEach((n) => {
      const kids = children.get(n.id);
      if (!kids) return;
      const parent = layout[n.id];
      const slice = (parent.a1 - parent.a0) / kids.length;
      kids.forEach((childId, i) => {
        const a0 = parent.a0 + slice * i;
        layout[childId] = { angle: a0 + slice / 2, a0, a1: a0 + slice };
      });
    });
    return layout;
  }

  /**
   * Sorteia quantos de `n` pessoas checam, cada uma com probabilidade `p`.
   * Até EXACT_SAMPLE_LIMIT pessoas: um sorteio por pessoa (exato). Acima disso: aproximação normal
   * da binomial (média np, desvio sqrt(np(1-p)), Box-Muller), arredondada e limitada a [0, n].
   * Com n de milhões (fanout 5, 10 rodadas) isso custa um sorteio, não milhões.
   * @param {number} n
   * @param {number} p
   * @param {() => number} random
   * @returns {number} inteiro entre 0 e n
   */
  function sampleBinomial(n, p, random) {
    if (n <= 0 || p <= 0) return 0;
    if (p >= 1) return n;
    if (n <= EXACT_SAMPLE_LIMIT) {
      let count = 0;
      for (let i = 0; i < n; i++) {
        if (random() < p) count++;
      }
      return count;
    }
    const mean = n * p;
    const sd = Math.sqrt(n * p * (1 - p));
    const u1 = Math.max(random(), 1e-12);
    const u2 = random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.min(n, Math.max(0, Math.round(mean + sd * z)));
  }

  /**
   * Continua a contagem a partir de um estado (só números).
   * @param {{fanout: number, checkRate: number, fromRound: number, toRound: number, sharers: number,
   *   receivedTotal?: number, sharedTotal?: number, checkedTotal?: number, random?: () => number}} opts
   *   `sharers` = quantas pessoas repassaram na rodada `fromRound` (o visitante conta 1 na rodada 0)
   * @returns {RoundRow[]} uma linha para cada rodada de fromRound+1 até toRound
   */
  function continueRounds(opts) {
    const random = opts.random || Math.random;
    let sharers = opts.sharers;
    let receivedTotal = opts.receivedTotal || 0;
    let sharedTotal = opts.sharedTotal || 0;
    let checkedTotal = opts.checkedTotal || 0;
    const rows = [];
    for (let round = opts.fromRound + 1; round <= opts.toRound; round++) {
      const received = sharers * opts.fanout;
      const checked = sampleBinomial(received, opts.checkRate, random);
      const shared = received - checked;
      receivedTotal += received;
      sharedTotal += shared;
      checkedTotal += checked;
      rows.push({ round, received, checked, shared, sharedTotal, receivedTotal, checkedTotal });
      sharers = shared;
    }
    return rows;
  }

  /**
   * Simulação só com números, da rodada 1 até `rounds`.
   * @param {{fanout: number, checkRate: number, rounds?: number, random?: () => number}} opts
   * @returns {RoundRow[]}
   */
  function countRounds(opts) {
    return continueRounds({
      fanout: opts.fanout,
      checkRate: opts.checkRate,
      fromRound: 0,
      toRound: opts.rounds === undefined ? 10 : opts.rounds,
      sharers: 1,
      random: opts.random
    });
  }

  /**
   * Resume a árvore desenhada em linhas por rodada (mesmo formato de countRounds),
   * para o contador bater exatamente com o que está no canvas.
   * @param {TreeNode[]} nodes
   * @param {number} roundsDrawn
   * @returns {RoundRow[]}
   */
  function summarizeTree(nodes, roundsDrawn) {
    const rows = [];
    let receivedTotal = 0;
    let sharedTotal = 0;
    let checkedTotal = 0;
    for (let round = 1; round <= roundsDrawn; round++) {
      let received = 0;
      let checked = 0;
      nodes.forEach((n) => {
        if (n.round !== round) return;
        received++;
        if (n.action === 'check') checked++;
      });
      const shared = received - checked;
      receivedTotal += received;
      sharedTotal += shared;
      checkedTotal += checked;
      rows.push({ round, received, checked, shared, sharedTotal, receivedTotal, checkedTotal });
    }
    return rows;
  }

  /**
   * Simulação completa para a tela: árvore nas primeiras rodadas e, dali em diante, só números
   * que continuam de quem repassou na última rodada desenhada (uma fonte só, sem emendas).
   * A lista termina na primeira rodada em que ninguém repassa (o boato parou).
   * @param {{fanout: number, checkRate: number, visualRounds: number, totalRounds: number,
   *   random?: () => number}} opts
   * @returns {{nodes: TreeNode[], roundsDrawn: number, rows: RoundRow[], stoppedAt: number|null}}
   *   stoppedAt = rodada em que o boato parou, ou null se chegou ao fim
   */
  function buildSimulation(opts) {
    const tree = buildTree({
      fanout: opts.fanout,
      checkRate: opts.checkRate,
      maxRounds: opts.visualRounds,
      random: opts.random
    });
    let rows = summarizeTree(tree.nodes, tree.roundsDrawn);
    const last = rows[rows.length - 1];
    if (tree.roundsDrawn < opts.totalRounds && last.shared > 0) {
      rows = rows.concat(continueRounds({
        fanout: opts.fanout,
        checkRate: opts.checkRate,
        fromRound: tree.roundsDrawn,
        toRound: opts.totalRounds,
        sharers: last.shared,
        receivedTotal: last.receivedTotal,
        sharedTotal: last.sharedTotal,
        checkedTotal: last.checkedTotal,
        random: opts.random
      }));
    }
    let stoppedAt = null;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].shared === 0) {
        stoppedAt = rows[i].round;
        rows = rows.slice(0, i + 1);
        break;
      }
    }
    return { nodes: tree.nodes, roundsDrawn: tree.roundsDrawn, rows, stoppedAt };
  }

  /**
   * Total esperado de pessoas que receberam: soma de k=1..rounds de fanout^k * (1 - checkRate)^(k-1).
   * @param {{fanout: number, checkRate: number, rounds?: number}} opts
   * @returns {number} pode ser fracionário; a tela arredonda
   */
  function expectedReach(opts) {
    const rounds = opts.rounds === undefined ? 10 : opts.rounds;
    let total = 0;
    for (let k = 1; k <= rounds; k++) {
      total += Math.pow(opts.fanout, k) * Math.pow(1 - opts.checkRate, k - 1);
    }
    return total;
  }

  window.ChecaAi.simulatorModel = {
    MAX_TREE_NODES,
    roundsThatFit,
    buildTree,
    layoutAngles,
    sampleBinomial,
    continueRounds,
    countRounds,
    summarizeTree,
    buildSimulation,
    expectedReach
  };
})();
