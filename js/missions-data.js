'use strict';

(function () {
  window.ChecaAi = window.ChecaAi || {};

  /**
   * @typedef {Object} MissionFormat
   * @property {'group-chat'|'private-chat'|'social-post'|'link-post'|'document'} type
   * @property {string} header  nome do grupo, perfil ou órgão
   * @property {string} badge   selo curto da publicação ('' se não houver)
   *
   * @typedef {Object} MissionTool
   * @property {string} label  nome da ferramenta
   * @property {string} clue   pista revelada ao tocar
   *
   * @typedef {Object} MissionSignal
   * @property {string} text
   * @property {boolean} isSuspicious  true = sinal verdadeiro; false = isca
   *
   * @typedef {Object} Mission
   * @property {string} id  'F1', 'F2', 'M1', 'M2', 'D1', 'D2'
   * @property {'easy'|'medium'|'hard'} level
   * @property {string} title
   * @property {MissionFormat} format
   * @property {string} content  texto da publicação
   * @property {{alt: string}|null} image
   * @property {MissionTool[]} tools
   * @property {MissionSignal[]} signals
   * @property {'true'|'false'|'misleading'|'unproven'} verdict
   * @property {string} explanation  gabarito comentado
   * @property {string} howToProtect
   * @property {string} reference  fascículo do CERT.br
   */

  /** Rótulos dos vereditos, em português. */
  const VERDICT_LABELS = Object.freeze({
    true: 'Verdadeira',
    false: 'Falsa',
    misleading: 'Enganosa / fora de contexto',
    unproven: 'Sem provas suficientes'
  });

  /** Rótulos dos níveis, em português. */
  const LEVEL_LABELS = Object.freeze({
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil'
  });

  /** Ordem dos níveis em uma partida. */
  const LEVEL_ORDER = Object.freeze(['easy', 'medium', 'hard']);

  /** Congela o objeto e tudo que há dentro dele. */
  function deepFreeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.freeze(value);
      Object.keys(value).forEach((key) => deepFreeze(value[key]));
    }
    return value;
  }

  /** @type {Mission[]} */
  const MISSIONS = deepFreeze([
    {
      id: 'F1',
      level: 'easy',
      title: 'Aulas suspensas na semana que vem',
      format: { type: 'group-chat', header: 'Turma 1º Ano 🏫', badge: 'Encaminhada com frequência' },
      content: 'URGENTE!!! A Escola Estadual Monte Verde vai SUSPENDER as aulas a semana que vem inteira. Avisa todo mundo, compartilha antes que apaguem!!!',
      image: null,
      tools: [
        { label: 'Ir à fonte', clue: 'A mensagem não diz quem anunciou. Não há link, nome de diretor nem comunicado.' },
        { label: 'Site oficial da escola', clue: 'Nenhum aviso publicado. O último comunicado é de 15 dias atrás, sobre a feira de ciências.' },
        { label: 'Conferir a data', clue: '"Semana que vem" a partir de quando? A mensagem não tem data, e ninguém sabe quando foi escrita.' }
      ],
      signals: [
        { text: 'Pede para compartilhar com urgência ("antes que apaguem")', isSuspicious: true },
        { text: 'Não informa quem fez o anúncio (sem fonte)', isSuspicious: true },
        { text: 'Sem data: não dá para saber de qual semana fala', isSuspicious: true },
        { text: 'Foi enviada no grupo da turma, então é confiável', isSuspicious: false },
        { text: 'Está escrita em letras maiúsculas, então é oficial', isSuspicious: false }
      ],
      verdict: 'unproven',
      explanation: 'Ninguém confirmou nem desmentiu o anúncio. Não dá para dizer que é falso, mas também não há nenhuma prova de que seja verdade. Quando falta fonte e data, o certo é não repassar e esperar o canal oficial.',
      howToProtect: 'Na dúvida, não compartilhe. Procure o site ou o perfil oficial da escola, ou pergunte direto à secretaria.',
      reference: 'Boatos — "Tem cara de boato?", "Vá direto à fonte da notícia", "Ajude a combater os boatos".'
    },
    {
      id: 'F2',
      level: 'easy',
      title: 'A corrente do aplicativo pago',
      format: { type: 'private-chat', header: 'Conversa particular', badge: 'Encaminhada' },
      content: '⚠️ ATENÇÃO: a partir de segunda-feira o app de mensagens vai cobrar R$ 0,37 por mensagem enviada! Para continuar GRÁTIS, repasse este aviso para 10 contatos. Quem não repassar terá a conta apagada. Informação confirmada pelo dono do aplicativo!',
      image: null,
      tools: [
        { label: 'Site oficial do aplicativo', clue: 'A página de novidades não fala em cobrança. A ajuda diz que o app é gratuito.' },
        { label: 'Agência de checagem', clue: '"Checagem: FALSO. Essa corrente circula desde 2015 com pequenas mudanças no valor."' },
        { label: 'Ler com atenção', clue: 'O texto diz que foi "confirmado pelo dono", mas não informa nome, link nem onde isso foi dito.' }
      ],
      signals: [
        { text: 'Exige repassar para outras pessoas ("corrente")', isSuspicious: true },
        { text: 'Faz ameaça ("terá a conta apagada")', isSuspicious: true },
        { text: 'Cita uma autoridade sem mostrar onde ela disse isso', isSuspicious: true },
        { text: 'Tem um valor exato (R$ 0,37), então deve ser real', isSuspicious: false },
        { text: 'Usa emoji de alerta, então é um aviso oficial', isSuspicious: false }
      ],
      verdict: 'false',
      explanation: 'É uma corrente antiga. O site oficial não anuncia cobrança, e agências de checagem já classificaram a mensagem como falsa. Pedido de repasse com ameaça é sinal clássico de boato.',
      howToProtect: 'Não repasse correntes. Confira no canal oficial do serviço e em uma agência de checagem antes de acreditar.',
      reference: 'Boatos — "O que são boatos?" (correntes), "Consulte agências de checagem".'
    },
    {
      id: 'M1',
      level: 'medium',
      title: 'A enchente de hoje (que não era de hoje)',
      format: { type: 'social-post', header: '@noticias.da.aurora.ja', badge: '' },
      content: 'AGORA! Centro de Nova Aurora debaixo d\'água 😱 Evitem a Avenida Central! Compartilhem pra todo mundo saber!',
      image: { alt: 'Foto fictícia de uma rua alagada, com carros com água até a porta.' },
      tools: [
        { label: 'Buscar a imagem', clue: 'A mesma foto aparece num portal de notícias em março de 2019, numa reportagem sobre uma enchente em Rio Claro do Sul, outra cidade.' },
        { label: 'Conferir a data', clue: 'O post é de hoje, às 10h12. A foto é de mais de 5 anos atrás.' },
        { label: 'Defesa Civil de Nova Aurora (perfil oficial)', clue: '"Sem chuva forte nas últimas 24 horas. Nenhum ponto de alagamento registrado."' }
      ],
      signals: [
        { text: 'A foto é antiga e de outra cidade', isSuspicious: true },
        { text: 'Título alarmista ("AGORA!", "debaixo d\'água")', isSuspicious: true },
        { text: 'O perfil não é um veículo de notícias nem um órgão oficial', isSuspicious: true },
        { text: 'A foto foi montada em programa de edição', isSuspicious: false },
        { text: 'Tem muitas curtidas, então é verdade', isSuspicious: false }
      ],
      verdict: 'misleading',
      explanation: 'A foto é verdadeira, a enchente aconteceu, mas em 2019 e em outra cidade. Usar um conteúdo real com data ou local trocados também engana. Por isso não é "montagem": a imagem não foi editada, só tirada do contexto.',
      howToProtect: 'Busque a imagem para achar a primeira publicação. Confira a data do fato e se o local bate. Para emergências, siga a Defesa Civil.',
      reference: 'Boatos — "Confira a data da notícia e dos fatos", "Observe os detalhes de imagens e vídeos" (busque a versão original).'
    },
    {
      id: 'M2',
      level: 'medium',
      title: 'A pesquisa do celular na sala',
      format: { type: 'link-post', header: 'Saber Já!', badge: 'Link' },
      content: 'CIÊNCIA COMPROVA: celular na sala de aula derruba as notas dos alunos pela METADE! 📉 Leia a pesquisa completa →',
      image: null,
      tools: [
        { label: 'Ler o original', clue: 'A pesquisa existe e foi feita por uma universidade. Ela acompanhou 120 alunos e concluiu que quem usava o celular para assuntos fora da aula tirou, em média, 6% menos nas provas.' },
        { label: 'Conferir a data', clue: 'A pesquisa é de 2016. O post foi publicado esta semana.' },
        { label: 'Comparar com outras fontes', clue: 'Dois jornais conhecidos noticiaram a mesma pesquisa: "Uso do celular fora da aula tem relação com notas um pouco menores".' }
      ],
      signals: [
        { text: 'A manchete exagera o resultado (6% virou "metade")', isSuspicious: true },
        { text: 'Título sensacionalista em letras maiúsculas para atrair cliques', isSuspicious: true },
        { text: 'Apresenta uma pesquisa antiga como novidade', isSuspicious: true },
        { text: 'A pesquisa não existe', isSuspicious: false },
        { text: 'Todo site com a palavra "ciência" é confiável', isSuspicious: false }
      ],
      verdict: 'misleading',
      explanation: 'A pesquisa é real, mas a manchete distorce o resultado: a diferença foi de 6%, não de 50%, e o estudo é de 2016. Manchete caça-clique transforma um fato verdadeiro em informação enganosa.',
      howToProtect: 'Não se guie só pelo título. Abra a fonte original, compare números e datas e veja como veículos confiáveis noticiaram o assunto.',
      reference: 'Boatos — "Não se deixe levar pelo título da notícia", "Cheque os fatos em mais de uma fonte".'
    },
    {
      id: 'D1',
      level: 'hard',
      title: 'O comunicado oficial que não existia',
      format: { type: 'document', header: 'Prefeitura Municipal de Nova Aurora — Secretaria de Educação', badge: '' },
      content: 'OFÍCIO Nº 487/2026 — Comunicamos que, devido à reforma das escolas municipais, as provas finais estão ADIADAS para fevereiro de 2027. Nova Aurora, 31 de novembro de 2026. Secretária Municipal de Educação.',
      image: { alt: 'Imagem de um documento com brasão no alto, número de ofício e assinatura no final.' },
      tools: [
        { label: 'Site oficial da Prefeitura', clue: 'A lista de ofícios de 2026 vai até o nº 312. O nº 487 não existe.' },
        { label: 'Perfil oficial da Secretaria de Educação', clue: 'Post de ontem: "ATENÇÃO: circula um comunicado FALSO sobre adiamento das provas. O calendário está mantido."' },
        { label: 'Analisar a imagem', clue: 'O brasão tem cores diferentes do brasão do site oficial. A data é 31 de novembro, um dia que não existe. A assinatura não traz o nome da secretária.' }
      ],
      signals: [
        { text: 'Data impossível (novembro só tem 30 dias)', isSuspicious: true },
        { text: 'Número de ofício que não aparece no site oficial', isSuspicious: true },
        { text: 'Brasão diferente do oficial e assinatura sem nome', isSuspicious: true },
        { text: 'Tem brasão e número de ofício, então é oficial', isSuspicious: false },
        { text: 'Foi compartilhado por pais da escola, então é confiável', isSuspicious: false }
      ],
      verdict: 'false',
      explanation: 'A aparência oficial (brasão, número, assinatura) não prova nada. O documento tem erros (data impossível, número inexistente, brasão diferente) e a própria Secretaria desmentiu. É uma falsificação.',
      howToProtect: 'Documento "oficial" se confere no canal oficial: site e perfis verificados da instituição. Se ela desmentiu, ajude a avisar quem compartilhou.',
      reference: 'Boatos — "Vá direto à fonte da notícia", "Observe os detalhes de imagens e vídeos", "Oriente outras pessoas a não compartilharem boatos".'
    },
    {
      id: 'D2',
      level: 'hard',
      title: 'A ponte interditada',
      format: { type: 'group-chat', header: 'Família 👨‍👩‍👧', badge: 'Encaminhada' },
      content: 'Gente, a ponte do Rio Aurora na estrada pra Vila Serena tá INTERDITADA até sexta! Rachou a pilastra. Quem for viajar vai ter que dar a volta por Santa Luz. Passem pra frente!',
      image: { alt: 'Foto de uma ponte com cones e fita de isolamento na entrada.' },
      tools: [
        { label: 'Ir à fonte', clue: 'A mensagem não tem link, mas cita o local exato e um prazo ("até sexta").' },
        { label: 'Órgão oficial de estradas (site do DER Estadual, fictício)', clue: 'Aviso publicado ontem: "Ponte sobre o Rio Aurora (km 42) interditada para vistoria estrutural até sexta-feira. Desvio por Santa Luz."' },
        { label: 'Comparar com outras fontes', clue: 'A rádio local e o perfil oficial da Prefeitura repetem a informação, com a mesma data.' }
      ],
      signals: [
        { text: 'Mensagem encaminhada sem link para a fonte', isSuspicious: true },
        { text: 'Pede para "passar pra frente"', isSuspicious: true },
        { text: 'Fala de uma ponte, então só pode ser boato', isSuspicious: false },
        { text: 'A foto mostra cones, então foi montada', isSuspicious: false }
      ],
      verdict: 'true',
      explanation: 'A mensagem tinha cara de boato (encaminhada, sem fonte, pedindo repasse), mas a checagem confirmou: o órgão oficial de estradas, a Prefeitura e a rádio publicaram a mesma informação. Desconfiar é o primeiro passo; o veredito vem depois de checar.',
      howToProtect: 'Se for repassar algo verdadeiro, mande junto o link da fonte oficial. Assim quem recebe também consegue checar.',
      reference: 'Boatos — "Cheque os fatos em mais de uma fonte", "Informe-se com outras pessoas e meios de comunicação".'
    }
  ]);

  /**
   * Missões de um nível.
   * @param {'easy'|'medium'|'hard'} level
   * @returns {Mission[]}
   */
  function getMissionsByLevel(level) {
    return MISSIONS.filter((m) => m.level === level);
  }

  /**
   * Sorteia a partida: ChecaAi.config.MISSIONS_PER_LEVEL_IN_MATCH missões por nível,
   * na ordem fácil, médio, difícil.
   * @param {() => number} [random] padrão Math.random
   * @returns {Mission[]}
   */
  function drawMatch(random) {
    const perLevel = window.ChecaAi.config.MISSIONS_PER_LEVEL_IN_MATCH;
    const utils = window.ChecaAi.utils;
    const match = [];
    LEVEL_ORDER.forEach((level) => {
      const pool = getMissionsByLevel(level);
      if (pool.length < perLevel) {
        throw new Error('Sorteio impossível: o nível "' + level + '" tem ' + pool.length +
          ' missão(ões), mas a partida pede ' + perLevel + '. Cadastre mais missões em js/missions-data.js.');
      }
      utils.shuffle(pool, random).slice(0, perLevel).forEach((m) => match.push(m));
    });
    return match;
  }

  /**
   * Missões que o simulador pode usar como boato (veredito diferente de "verdadeira").
   * @returns {Mission[]}
   */
  function getShareableRumors() {
    return MISSIONS.filter((m) => m.verdict !== 'true');
  }

  window.ChecaAi.missions = {
    all: MISSIONS,
    VERDICT_LABELS,
    LEVEL_LABELS,
    LEVEL_ORDER,
    getMissionsByLevel,
    drawMatch,
    getShareableRumors
  };
})();
