'use strict';

(function () {
  window.ChecaAi = window.ChecaAi || {};

  /**
   * Mensagem do simulador ("Como um boato se espalha"). Mesmo formato que o post-card aceita
   * (cabeçalho, selo, texto e mídia), mais o que a checagem encontra. Não repete as missões do jogo,
   * para o simulador não entregar o gabarito.
   * @typedef {Object} SimulatorRumor
   * @property {string} id  'S1'... 'S5'
   * @property {{type: string, header: string, badge: string}} format
   * @property {string} content  texto da mensagem
   * @property {Object|null} image  mídia no formato das missões (null = sem mídia)
   * @property {boolean} [showContentWithDocument]  true = o texto aparece acima do documento (post-card)
   * @property {string} checkResult  uma linha: o que a checagem encontrou
   */

  /** Congela o objeto e tudo que há dentro dele. */
  function deepFreeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.freeze(value);
      Object.keys(value).forEach((key) => deepFreeze(value[key]));
    }
    return value;
  }

  /** @type {SimulatorRumor[]} */
  const RUMORS = deepFreeze([
    {
      id: 'S1',
      format: { type: 'group-chat', header: 'Moradores do Bairro Centro', badge: 'Encaminhada com frequência' },
      content: 'Vai faltar água em Nova Aurora a semana TODA a partir de amanhã! Encham os baldes e repassem!',
      image: null,
      checkResult: 'O site da companhia de água fala só em manutenção de 4 horas, no sábado, em uma rua.'
    },
    {
      id: 'S2',
      format: { type: 'group-chat', header: 'Turma 1º Ano', badge: 'Encaminhada' },
      content: 'Gente, olha isso que saiu agora!',
      showContentWithDocument: true,
      image: {
        kind: 'document',
        brand: { type: 'logo', src: 'assets/images/marcas/ifnmg-arinos.png', alt: 'Logo do IFNMG Campus Arinos' },
        orgLine: 'Instituto Federal do Norte de Minas Gerais — Campus Arinos · Coordenação de Ensino',
        orgLineWithLogo: 'Campus Arinos · Coordenação de Ensino',
        number: 'COMUNICADO Nº 061/2026',
        body: 'Informamos que, a partir de segunda-feira, o uso do uniforme passa a ser OPCIONAL em todas as atividades do campus, inclusive aulas práticas e laboratórios.',
        place: 'Arinos',
        date: '30 de novembro de 2026',
        signature: { name: 'Marta Regina Fontoura', role: 'Coordenadora de Ensino' },
        alt: 'Comunicado nº 061/2026 do IFNMG Campus Arinos, com o logo da instituição, avisando que o uso do uniforme passa a ser opcional, assinado por Marta Regina Fontoura, Coordenadora de Ensino.'
      },
      checkResult: 'O comunicado nº 061 não existe no site oficial do campus. O uso do uniforme continua obrigatório.'
    },
    {
      id: 'S3',
      format: { type: 'private-chat', header: 'Conversa particular', badge: 'Encaminhada com frequência' },
      content: 'Feriado extra: segunda-feira será ponto facultativo em todo o estado! Compartilhe!',
      image: null,
      checkResult: 'O Diário Oficial não publicou nada. A mensagem é de 2019 e volta todo ano.'
    },
    {
      id: 'S4',
      format: { type: 'social-post', header: '@aurora.urgente', badge: '' },
      content: 'Olha a fila que tá AGORA na rodoviária! Ninguém tá conseguindo embarcar!!',
      // Sem foto com licença livre adequada até agora: o post-card mostra o quadro com a descrição.
      // Quando houver, troque por { kind: 'photo', src: 'assets/images/simulador/s4-fila.jpg', alt, credit, width, height }
      // e registre o crédito em assets/images/simulador/CREDITOS.md.
      image: {
        kind: 'placeholder',
        alt: 'Foto de uma fila longa em uma rodoviária'
      },
      checkResult: 'A foto é de um feriado de 2021, em outra cidade.'
    },
    {
      id: 'S5',
      format: { type: 'group-chat', header: 'Pais da Escola Monte Verde', badge: 'Encaminhada' },
      content: 'Ônibus escolar NÃO vai rodar amanhã por falta de combustível. Avisem todo mundo!',
      image: null,
      checkResult: 'A Secretaria de Transporte publicou hoje que o transporte funciona normalmente.'
    }
  ]);

  /**
   * Sorteia a próxima mensagem, nunca a anterior (se houver mais de uma).
   * @param {string|null} [previousId] id da última mensagem mostrada
   * @param {() => number} [random] devolve número em [0,1); padrão Math.random
   * @returns {SimulatorRumor}
   */
  function pickNext(previousId, random) {
    if (!RUMORS.length) {
      throw new Error('Não há mensagens para o simulador. Confira js/simulator-rumors.js.');
    }
    const choices = RUMORS.length > 1 ? RUMORS.filter((r) => r.id !== previousId) : RUMORS;
    return window.ChecaAi.utils.pickRandom(choices, random);
  }

  window.ChecaAi.simulatorRumors = { all: RUMORS, pickNext };
})();
