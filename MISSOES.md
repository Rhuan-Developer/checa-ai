# Checa Aí — Missões (v1: 6 missões)

> Conteúdo das missões, para o grupo revisar e para o Claude Code converter em `js/missions-data.js`.
> Base: Cartilha de Segurança para Internet do CERT.br — fascículo **Boatos** (jul/2024) e fascículo **Redes Sociais**. Os PDFs ficam em `cartilhas/`.
> Tudo é **fictício e marcado como "Simulação"**: a cidade (Nova Aurora), as escolas, os órgãos, os perfis e os sites são inventados.
> Tema da estação: **origem, data e contexto**. Sem golpes/phishing (Estação 1) e sem IA/deepfake (Grupo 5 da outra turma).

## Como a partida funciona
- 6 missões: 2 fáceis, 2 médias, 2 difíceis.
- Cada partida sorteia **1 fácil + 1 média + 1 difícil**, nessa ordem. Assim, cada visitante pega uma combinação diferente.
- Para crescer depois: 9 missões (3 de cada nível), depois 12 (4 de cada). O sorteio continua igual.
- Vereditos possíveis em todas as missões: **Verdadeira · Falsa · Enganosa / fora de contexto · Sem provas suficientes**.
- As 6 missões usam os 4 vereditos, para o visitante não achar que "tudo é mentira".

| # | Nível | Missão | Veredito |
|---|---|---|---|
| F1 | Fácil | Aulas suspensas na semana que vem | Sem provas suficientes |
| F2 | Fácil | A corrente do aplicativo pago | Falsa |
| M1 | Médio | A enchente de hoje (que não era de hoje) | Enganosa / fora de contexto |
| M2 | Médio | A pesquisa do celular na sala | Enganosa / fora de contexto |
| D1 | Difícil | O comunicado oficial que não existia | Falsa |
| D2 | Difícil | A ponte interditada | Verdadeira |

Formato de cada missão: **publicação** (o que o visitante vê) → **ferramentas** (cada uma revela uma pista ao tocar) → **"O que é suspeito aqui?"** (sinais; ✅ = sinal verdadeiro, ❌ = isca) → **veredito** → **gabarito comentado** → **Como se proteger** → **referência da cartilha**.

---

## F1 · Fácil — Aulas suspensas na semana que vem
**Formato:** mensagem em grupo de aplicativo ("Turma 1º Ano 🏫"), marcada como *Encaminhada com frequência*.

**Publicação:**
> URGENTE!!! A Escola Estadual Monte Verde vai SUSPENDER as aulas a semana que vem inteira. Avisa todo mundo, compartilha antes que apaguem!!!

**Ferramentas:**
- **Ir à fonte** → A mensagem não diz quem anunciou. Não há link, nome de diretor nem comunicado.
- **Site oficial da escola** → Nenhum aviso publicado. O último comunicado é de 15 dias atrás, sobre a feira de ciências.
- **Conferir a data** → "Semana que vem" a partir de quando? A mensagem não tem data, e ninguém sabe quando foi escrita.

**O que é suspeito aqui?**
- ✅ Pede para compartilhar com urgência ("antes que apaguem")
- ✅ Não informa quem fez o anúncio (sem fonte)
- ✅ Sem data: não dá para saber de qual semana fala
- ❌ Foi enviada no grupo da turma, então é confiável
- ❌ Está escrita em letras maiúsculas, então é oficial

**Veredito:** Sem provas suficientes

**Gabarito comentado:** Ninguém confirmou nem desmentiu o anúncio. Não dá para dizer que é falso, mas também não há nenhuma prova de que seja verdade. Quando falta fonte e data, o certo é não repassar e esperar o canal oficial.

**Como se proteger:** Na dúvida, não compartilhe. Procure o site ou o perfil oficial da escola, ou pergunte direto à secretaria.

**Cartilha:** Boatos — "Tem cara de boato?", "Vá direto à fonte da notícia", "Ajude a combater os boatos".

---

## F2 · Fácil — A corrente do aplicativo pago
**Formato:** mensagem encaminhada em conversa particular.

**Publicação:**
> ⚠️ ATENÇÃO: a partir de segunda-feira o app de mensagens vai cobrar R$ 0,37 por mensagem enviada! Para continuar GRÁTIS, repasse este aviso para 10 contatos. Quem não repassar terá a conta apagada. Informação confirmada pelo dono do aplicativo!

**Ferramentas:**
- **Site oficial do aplicativo** → A página de novidades não fala em cobrança. A ajuda diz que o app é gratuito.
- **Agência de checagem** → "Checagem: FALSO. Essa corrente circula desde 2015 com pequenas mudanças no valor."
- **Ler com atenção** → O texto diz que foi "confirmado pelo dono", mas não informa nome, link nem onde isso foi dito.

**O que é suspeito aqui?**
- ✅ Exige repassar para outras pessoas ("corrente")
- ✅ Faz ameaça ("terá a conta apagada")
- ✅ Cita uma autoridade sem mostrar onde ela disse isso
- ❌ Tem um valor exato (R$ 0,37), então deve ser real
- ❌ Usa emoji de alerta, então é um aviso oficial

**Veredito:** Falsa

**Gabarito comentado:** É uma corrente antiga. O site oficial não anuncia cobrança, e agências de checagem já classificaram a mensagem como falsa. Pedido de repasse com ameaça é sinal clássico de boato.

**Como se proteger:** Não repasse correntes. Confira no canal oficial do serviço e em uma agência de checagem antes de acreditar.

**Cartilha:** Boatos — "O que são boatos?" (correntes), "Consulte agências de checagem".

---

## M1 · Médio — A enchente de hoje (que não era de hoje)
**Formato:** post de rede social de um perfil comum (@noticias.da.aurora.ja), com foto de rua alagada, carros com água até a porta.

**Publicação:**
> AGORA! Centro de Nova Aurora debaixo d'água 😱 Evitem a Avenida Central! Compartilhem pra todo mundo saber!

**Ferramentas:**
- **Buscar a imagem** → A mesma foto aparece num portal de notícias em março de 2019, numa reportagem sobre uma enchente em **Rio Claro do Sul**, outra cidade.
- **Conferir a data** → O post é de hoje, às 10h12. A foto é de mais de 5 anos atrás.
- **Defesa Civil de Nova Aurora (perfil oficial)** → "Sem chuva forte nas últimas 24 horas. Nenhum ponto de alagamento registrado."

**O que é suspeito aqui?**
- ✅ A foto é antiga e de outra cidade
- ✅ Título alarmista ("AGORA!", "debaixo d'água")
- ✅ O perfil não é um veículo de notícias nem um órgão oficial
- ❌ A foto foi montada em programa de edição
- ❌ Tem muitas curtidas, então é verdade

**Veredito:** Enganosa / fora de contexto

**Gabarito comentado:** A foto é verdadeira, a enchente aconteceu, mas em 2019 e em outra cidade. Usar um conteúdo real com data ou local trocados também engana. Por isso não é "montagem": a imagem não foi editada, só tirada do contexto.

**Como se proteger:** Busque a imagem para achar a primeira publicação. Confira a data do fato e se o local bate. Para emergências, siga a Defesa Civil.

**Cartilha:** Boatos — "Confira a data da notícia e dos fatos", "Observe os detalhes de imagens e vídeos" (busque a versão original).

---

## M2 · Médio — A pesquisa do celular na sala
**Formato:** post com manchete e link, publicado pelo site "Saber Já!".

**Publicação:**
> CIÊNCIA COMPROVA: celular na sala de aula derruba as notas dos alunos pela METADE! 📉 Leia a pesquisa completa →

**Ferramentas:**
- **Ler o original** → A pesquisa existe e foi feita por uma universidade. Ela acompanhou 120 alunos e concluiu que quem usava o celular para assuntos fora da aula tirou, em média, **6% menos** nas provas.
- **Conferir a data** → A pesquisa é de 2016. O post foi publicado esta semana.
- **Comparar com outras fontes** → Dois jornais conhecidos noticiaram a mesma pesquisa: "Uso do celular fora da aula tem relação com notas um pouco menores".

**O que é suspeito aqui?**
- ✅ A manchete exagera o resultado (6% virou "metade")
- ✅ Título sensacionalista em letras maiúsculas para atrair cliques
- ✅ Apresenta uma pesquisa antiga como novidade
- ❌ A pesquisa não existe
- ❌ Todo site com a palavra "ciência" é confiável

**Veredito:** Enganosa / fora de contexto

**Gabarito comentado:** A pesquisa é real, mas a manchete distorce o resultado: a diferença foi de 6%, não de 50%, e o estudo é de 2016. Manchete caça-clique transforma um fato verdadeiro em informação enganosa.

**Como se proteger:** Não se guie só pelo título. Abra a fonte original, compare números e datas e veja como veículos confiáveis noticiaram o assunto.

**Cartilha:** Boatos — "Não se deixe levar pelo título da notícia", "Cheque os fatos em mais de uma fonte".

---

## D1 · Difícil — O comunicado oficial que não existia
**Formato:** imagem de um documento com brasão, cabeçalho "Prefeitura Municipal de Nova Aurora — Secretaria de Educação", número de ofício e assinatura. Circulando no grupo de pais.

**Publicação (texto do documento):**
> OFÍCIO Nº 487/2026 — Comunicamos que, devido à reforma das escolas municipais, as provas finais estão ADIADAS para fevereiro de 2027. Nova Aurora, 31 de novembro de 2026. Secretária Municipal de Educação.

**Ferramentas:**
- **Site oficial da Prefeitura** → A lista de ofícios de 2026 vai até o nº 312. O nº 487 não existe.
- **Perfil oficial da Secretaria de Educação** → Post de ontem: "ATENÇÃO: circula um comunicado FALSO sobre adiamento das provas. O calendário está mantido."
- **Analisar a imagem** → O brasão tem cores diferentes do brasão do site oficial. A data é **31 de novembro**, um dia que não existe. A assinatura não traz o nome da secretária.

**O que é suspeito aqui?**
- ✅ Data impossível (novembro só tem 30 dias)
- ✅ Número de ofício que não aparece no site oficial
- ✅ Brasão diferente do oficial e assinatura sem nome
- ❌ Tem brasão e número de ofício, então é oficial
- ❌ Foi compartilhado por pais da escola, então é confiável

**Veredito:** Falsa

**Gabarito comentado:** A aparência oficial (brasão, número, assinatura) não prova nada. O documento tem erros (data impossível, número inexistente, brasão diferente) e a própria Secretaria desmentiu. É uma falsificação.

**Como se proteger:** Documento "oficial" se confere no canal oficial: site e perfis verificados da instituição. Se ela desmentiu, ajude a avisar quem compartilhou.

**Cartilha:** Boatos — "Vá direto à fonte da notícia", "Observe os detalhes de imagens e vídeos", "Oriente outras pessoas a não compartilharem boatos".

---

## D2 · Difícil — A ponte interditada
**Formato:** mensagem encaminhada no grupo da família, com foto de uma ponte com cones e fita.

**Publicação:**
> Gente, a ponte do Rio Aurora na estrada pra Vila Serena tá INTERDITADA até sexta! Rachou a pilastra. Quem for viajar vai ter que dar a volta por Santa Luz. Passem pra frente!

**Ferramentas:**
- **Ir à fonte** → A mensagem não tem link, mas cita o local exato e um prazo ("até sexta").
- **Órgão oficial de estradas (site do DER Estadual, fictício)** → Aviso publicado ontem: "Ponte sobre o Rio Aurora (km 42) interditada para vistoria estrutural até sexta-feira. Desvio por Santa Luz."
- **Comparar com outras fontes** → A rádio local e o perfil oficial da Prefeitura repetem a informação, com a mesma data.

**O que é suspeito aqui?**
- ✅ Mensagem encaminhada sem link para a fonte
- ✅ Pede para "passar pra frente"
- ❌ Fala de uma ponte, então só pode ser boato
- ❌ A foto mostra cones, então foi montada

**Veredito:** Verdadeira

**Gabarito comentado:** A mensagem tinha cara de boato (encaminhada, sem fonte, pedindo repasse), mas a checagem confirmou: o órgão oficial de estradas, a Prefeitura e a rádio publicaram a mesma informação. Desconfiar é o primeiro passo; o veredito vem depois de checar.

**Como se proteger:** Se for repassar algo verdadeiro, mande junto o link da fonte oficial. Assim quem recebe também consegue checar.

**Cartilha:** Boatos — "Cheque os fatos em mais de uma fonte", "Informe-se com outras pessoas e meios de comunicação".

---

## Dicas finais ("Antes de compartilhar") — tela do fim da partida
Baseadas no fascículo Boatos (CERT.br):
1. **Origem:** quem publicou? É o perfil ou o site oficial?
2. **Data:** quando isso aconteceu? A foto é de agora?
3. **Contexto:** o local, os números e a manchete batem com o original?
4. **Outras fontes:** veículos confiáveis e agências de checagem falam a mesma coisa?
5. **Na dúvida, não compartilhe.**

## Banco de ideias para as próximas missões (9 e 12)
- **Fácil — Sátira levada a sério:** post de um perfil de humor, compartilhado como notícia. Veredito: Falsa. Cartilha: "Outras fontes de informações falsas".
- **Fácil — Lenda urbana da escola:** "Quem usar o bebedouro do 2º andar…". Veredito: Falsa (lenda urbana).
- **Médio — Vídeo antigo de briga "hoje na escola":** veredito Enganosa. Conferir a data e o uniforme.
- **Médio — Perfil falso de professor:** perfil recém-criado com foto copiada anunciando "prova cancelada". Veredito: Falsa. Cartilha: Redes Sociais (perfis falsos) e Boatos ("Denuncie contas falsas").
- **Difícil — Print de conversa editado:** print com horário e bateria incoerentes. Veredito: Falsa.
- **Difícil — Notícia verdadeira com a data certa, mas em outro país:** veredito Enganosa (contexto de local).
