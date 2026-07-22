/**
 * Importação editorial idempotente de conteúdo verificado do SINDQUIM.
 *
 * - cria itens inexistentes e sincroniza os já publicados;
 * - arquiva as quatro notícias demonstrativas, sem apagá-las;
 * - usa fotografias editoriais locais, com legenda, crédito e origem verificados;
 * - mantém mídia, fonte, data, empresa e cidade editáveis no Directus.
 */

import { existsSync, readFileSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const URL_BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8155';
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const SENHA = process.env.DIRECTUS_ADMIN_PASSWORD;
let token = '';

export const DIRETORIA_CONFIRMADA = [
  {
    nome: 'Herbert Passos Filho',
    cargo: 'Presidente',
    grupo: 'diretoria-executiva',
    descricao: 'Presidente reconduzido na gestão empossada em maio de 2025. Atua na representação dos trabalhadores químicos da Baixada Santista.',
    mandato_inicio: '2025-05-05',
    mandato_fim: null,
    fonte_nome: 'FEQUIMFAR — posse da diretoria do SINDQUIM',
    fonte_url: 'https://fequimfar.org.br/diretoria-do-sindicato-dos-quimicos-da-baixada-santista-toma-posse-em-santos/',
    ordem: 1,
  },
];

export const NOTICIAS_SINDQUIM = [
  {
    titulo: 'Encerramento da produção de resina epóxi da Olin no Guarujá repercute na cadeia química',
    slug: 'encerramento-producao-resina-epoxi-olin-guaruja',
    resumo: 'Documento do MDIC confirma o encerramento de uma linha de resinas epóxi no Guarujá e registra os reflexos da mudança sobre o abastecimento do setor.',
    conteudo: `<p>Uma nota técnica do Ministério do Desenvolvimento, Indústria, Comércio e Serviços registrou o encerramento da produção de determinadas resinas epóxi na unidade da Olin/Blue Cube no Guarujá.</p>
<h2>O que o documento informa</h2>
<p>A análise foi produzida durante um pedido de redução temporária do imposto de importação do insumo. O pleito não foi aprovado porque outras fabricantes demonstraram capacidade de produção nacional, mas o processo confirmou oficialmente a mudança ocorrida na unidade da região.</p>
<h2>Por que a pauta importa</h2>
<p>Alterações de capacidade industrial podem afetar cadeias de fornecimento, qualificação profissional e postos de trabalho. O portal acompanhará novos comunicados oficiais sem antecipar números de desligamentos que não constem nas fontes.</p>`,
    categoria: 'empregos-industria',
    empresa: 'Olin / Blue Cube', cidade: 'Guarujá', data_fato: '2026-06-23', publicado_em: '2026-06-23T15:00:00.000Z', fixado_banner: true,
    fonte_nome: 'MDIC/Camex — Nota Técnica SEI nº 1171/2026',
    fonte_url: 'https://www.gov.br/mdic/pt-br/assuntos/camex/outros-documentos/notas/deferimentos/238a-reuniao-ordinaria-do-comite-executivo-de-gestao-gecex/extrato-publico-da-nota-tecnica-sei-no-1171_2026_mdic-resinas-epoxidas.pdf/%40%40download/file',
  },
  {
    titulo: 'Petrobras aprova investimento de US$ 1,2 bilhão em combustíveis renováveis na RPBC',
    slug: 'petrobras-investimento-bioqav-diesel-renovavel-rpbc',
    resumo: 'Projeto de biorrefino em Cubatão prevê uma planta de BioQAV e diesel renovável, com obras planejadas a partir do fim de 2026.',
    conteudo: `<p>A Petrobras aprovou a decisão final de investimento do projeto RPBC Biorrefino, que será implantado na Refinaria Presidente Bernardes, em Cubatão.</p>
<h2>Investimento e capacidade</h2>
<p>Segundo a companhia, o investimento estimado é de aproximadamente US$ 1,2 bilhão. A nova planta terá capacidade de produzir até 15 mil barris por dia de bioquerosene de aviação e diesel renovável.</p>
<h2>Próximas etapas</h2>
<p>A empresa prevê avançar na contratação e iniciar as obras até o fim de 2026, com entrada em operação planejada para 2030. O acompanhamento sindical é importante para que desenvolvimento tecnológico, segurança e trabalho decente caminhem juntos.</p>`,
    categoria: 'sustentabilidade',
    empresa: 'Petrobras / RPBC', cidade: 'Cubatão', data_fato: '2026-06-19', publicado_em: '2026-06-19T15:00:00.000Z', fixado_banner: false,
    fonte_nome: 'Agência Petrobras',
    fonte_url: 'https://agencia.petrobras.com.br/w/negocio/petrobras-aprova-investimento-em-planta-de-bioqav-e-diesel-renov%C3%A1vel-na-rpbc',
  },
  {
    titulo: 'Empresas do polo participam da retomada do conselho de desenvolvimento de Cubatão',
    slug: 'empresas-polo-conselho-desenvolvimento-cubatao',
    resumo: 'Yara, Unipar, RTA Ambiental e outras empresas participaram da reativação de um espaço permanente de diálogo sobre emprego e desenvolvimento sustentável.',
    conteudo: `<p>A Prefeitura de Cubatão reativou o Conselho Municipal de Desenvolvimento Econômico e Social, reunindo poder público, empresas e organizações da sociedade civil.</p>
<h2>Participação do polo</h2>
<p>O encontro contou com representantes da Yara Brasil, Unipar Carbocloro, RTA Ambiental, Usiminas, VLI Logística e Cide/Ciesp. A pauta incluiu planejamento econômico, sustentabilidade e grandes projetos previstos para a região.</p>
<h2>Diálogo permanente</h2>
<p>Para os trabalhadores, o conselho pode abrir um canal relevante de acompanhamento das políticas industriais. Emprego, qualificação, segurança e qualidade de vida precisam fazer parte das decisões sobre o futuro do polo.</p>`,
    categoria: 'empregos-industria',
    empresa: 'Yara, Unipar, RTA Ambiental e empresas do polo', cidade: 'Cubatão', data_fato: '2026-05-29', publicado_em: '2026-05-29T15:00:00.000Z', fixado_banner: false,
    fonte_nome: 'Prefeitura de Cubatão',
    fonte_url: 'https://www.cubatao.sp.gov.br/prefeitura-de-cubatao-creativa-o-conselho-municipal-de-desenvolvimento-economico-e-social/',
  },
  {
    titulo: 'Semana da Indústria debate qualificação, empregos e futuro do polo de Cubatão',
    slug: 'semana-industria-qualificacao-empregos-polo-cubatao',
    resumo: 'Programação reuniu empresas, trabalhadores, poder público e entidades para discutir competitividade, formação profissional e sustentabilidade.',
    conteudo: `<p>A Semana da Indústria de Cubatão reuniu representantes dos trabalhadores, empresas, instituições de ensino e autoridades em uma programação voltada ao futuro industrial da cidade.</p>
<h2>Empresas e trabalhadores reconhecidos</h2>
<p>Representantes de Unipar, Petrobras e Yara foram reconhecidos por iniciativas ligadas aos Objetivos de Desenvolvimento Sustentável. Trabalhadores da Yara, Unipar, Petrocoque e Usiminas também participaram das homenagens.</p>
<h2>Presença sindical</h2>
<p>O presidente do SINDQUIM, Herbert Passos Filho, integrou a programação. O debate destacou a necessidade de aproximar formação profissional, inovação, segurança e geração de oportunidades.</p>`,
    categoria: 'empregos-industria',
    empresa: 'Yara, Unipar, Petrobras e Petrocoque', cidade: 'Cubatão', data_fato: '2026-05-26', publicado_em: '2026-05-26T15:00:00.000Z', fixado_banner: false,
    fonte_nome: 'Prefeitura de Cubatão',
    fonte_url: 'https://www.cubatao.sp.gov.br/semana-da-industria-em-cubatao-aborda-inovacao-qualificacao-profissional-desenvolvimento-sustentavel/',
  },
  {
    titulo: 'Mutirão do Emprego industrial de Cubatão atende mais de 2,4 mil pessoas',
    slug: 'mutirao-emprego-industrial-cubatao-balanco-2026',
    resumo: 'Balanço municipal registrou 4.254 candidaturas para 520 vagas, concentradas principalmente em ocupações do setor industrial.',
    conteudo: `<p>A primeira edição de 2026 do Mutirão do Emprego de Cubatão recebeu 2.441 pessoas e registrou 4.254 candidaturas para 520 vagas.</p>
<h2>Perfil das oportunidades</h2>
<p>Segundo a Prefeitura, a maior parte das vagas estava ligada à indústria, em funções como caldeiraria, montagem de andaimes e apoio operacional. A participação feminina chegou a 32% do público atendido.</p>
<h2>Balanço, não convocação</h2>
<p>Esta notícia registra uma ação já encerrada. Novas vagas e inscrições devem ser consultadas apenas nos canais oficiais responsáveis por cada processo seletivo.</p>`,
    categoria: 'qualificacao',
    empresa: 'Empresas do polo industrial', cidade: 'Cubatão', data_fato: '2026-04-30', publicado_em: '2026-05-04T15:00:00.000Z', fixado_banner: false,
    fonte_nome: 'Prefeitura de Cubatão',
    fonte_url: 'https://www.cubatao.sp.gov.br/mutirao-do-emprego-em-cubatao-atende-mais-de-2-mil-pessoas-e-reforca-integracao-entre-poder-publico-empresas-e-trabalhadores/',
  },
  {
    titulo: 'Transição tributária de 2026 busca fortalecer a indústria química e o Polo de Cubatão',
    slug: 'transicao-tributaria-industria-quimica-polo-cubatao-2026',
    resumo: 'Mudança federal reduz alíquotas durante a transição para o Presiq, política voltada à competitividade da indústria química e petroquímica.',
    conteudo: `<p>O Congresso aprovou uma transição tributária para a indústria química e petroquímica em 2026, antes da entrada em vigor do Programa Especial de Sustentabilidade da Indústria Química, prevista para 2027.</p>
<h2>Impacto regional</h2>
<p>A medida foi defendida por representantes de Cubatão, do SINDQUIM e de entidades empresariais como instrumento para recuperar competitividade e reduzir o risco de novas perdas industriais.</p>
<h2>Acompanhamento necessário</h2>
<p>Incentivos podem apoiar a atividade produtiva, mas seus resultados precisam ser acompanhados. Preservação de empregos, investimentos e condições adequadas de trabalho devem permanecer no centro do debate.</p>`,
    categoria: 'empregos-industria',
    empresa: 'Indústria química e petroquímica', cidade: 'Cubatão', data_fato: '2026-03-19', publicado_em: '2026-03-19T15:00:00.000Z', fixado_banner: false,
    fonte_nome: 'Senado Federal',
    fonte_url: 'https://www12.senado.leg.br/noticias/materias/2026/02/25/reducao-de-aliquotas-tributarias-para-industria-quimica-segue-para-sancao',
  },
  {
    titulo: 'SINDQUIM participa de articulação nacional após paralisação da Unigel em Cubatão',
    slug: 'sindquim-articulacao-paralisacao-unigel-cubatao',
    resumo: 'Comitiva levou ao Governo Federal preocupações sobre fechamento de fábricas, competitividade e perda de postos de trabalho no polo regional.',
    conteudo: `<p>O SINDQUIM participou de uma articulação em Brasília para discutir a crise da indústria química e seus efeitos sobre Cubatão.</p>
<h2>Preocupação com os empregos</h2>
<p>A mobilização ocorreu após a paralisação da unidade de estireno da Unigel. A Prefeitura de Cubatão informou cerca de 100 desligamentos associados ao episódio e defendeu medidas emergenciais para o setor.</p>
<h2>Agenda de longo prazo</h2>
<p>Além de respostas imediatas, trabalhadores e poder público discutiram políticas industriais capazes de melhorar a competitividade e preservar capacidade produtiva na região.</p>`,
    categoria: 'empregos-industria',
    empresa: 'Unigel', cidade: 'Cubatão', data_fato: '2026-02-03', publicado_em: '2026-02-03T15:00:00.000Z', fixado_banner: false,
    fonte_nome: 'Prefeitura de Cubatão e FEQUIMFAR',
    fonte_url: 'https://www.cubatao.sp.gov.br/alckmin-anuncia-r-2-bilhoes-para-a-industria-quimica-medida-beneficia-polo-de-cubatao/',
  },
  {
    titulo: 'Petrocoque amplia apoio a projetos sociais de Cubatão em 2026',
    slug: 'petrocoque-projetos-sociais-cubatao-2026',
    resumo: 'Empresa anunciou apoio a oito iniciativas de cultura, esporte, educação e inclusão por meio de leis de incentivo.',
    conteudo: `<p>A Petrocoque anunciou apoio a oito projetos sociais com atuação em Cubatão e na Baixada Santista.</p>
<h2>Áreas atendidas</h2>
<p>As iniciativas abrangem cultura, esporte, educação, inclusão e atendimento a crianças, jovens e idosos. Entre elas estão Oficinas Querô, Cubatão Sinfonia e atividades socioeducativas na Vila dos Pescadores.</p>
<h2>Informação atribuída à empresa</h2>
<p>Os dados foram divulgados pela comunicação da Petrocoque em publicação da Prefeitura. Resultados e cronogramas devem ser acompanhados nos canais oficiais dos projetos apoiados.</p>`,
    categoria: 'sustentabilidade',
    empresa: 'Petrocoque', cidade: 'Cubatão', data_fato: '2026-01-08', publicado_em: '2026-01-08T15:00:00.000Z', fixado_banner: false,
    fonte_nome: 'Prefeitura de Cubatão / Comunicação Petrocoque',
    fonte_url: 'https://www.cubatao.sp.gov.br/petrocoque-amplia-investimentos-sociais-em-cubatao-e-patrocina-oito-projetos-em-2026-por-leis-de-incentivo/',
  },
  {
    titulo: 'Unipar conclui modernização de mais de R$ 1 bilhão na fábrica de Cubatão',
    slug: 'unipar-modernizacao-fabrica-cubatao-2025',
    resumo: 'Projeto substituiu tecnologias antigas por células de membrana e, segundo a empresa, elevou a eficiência energética e ambiental da unidade.',
    conteudo: `<p>A Unipar anunciou a conclusão de uma modernização tecnológica de mais de R$ 1 bilhão em sua unidade de Cubatão.</p>
<h2>Mudança de tecnologia</h2>
<p>Segundo a companhia, a produção de cloro passou a usar integralmente células de membrana, substituindo processos com mercúrio e diafragma. A empresa atribui ao projeto redução de consumo de energia e de geração de resíduos.</p>
<h2>Trabalho na implantação</h2>
<p>A Unipar informou que a fase de implantação mobilizou mais de 1.200 empregos diretos e indiretos. Os indicadores apresentados nesta matéria são os divulgados pela própria companhia.</p>`,
    categoria: 'sustentabilidade',
    empresa: 'Unipar Carbocloro', cidade: 'Cubatão', data_fato: '2025-12-15', publicado_em: '2025-12-15T15:00:00.000Z', fixado_banner: false,
    fonte_nome: 'Unipar',
    fonte_url: 'https://unipar.com/us/news/with-an-investment-of-more-than-r-1-billion-unipar-carbocloro-raises-the-level-of-competitiveness-and-efficiency',
  },
  {
    titulo: 'Programa da Petrobras qualifica moradores para oportunidades industriais em Cubatão',
    slug: 'petrobras-qualificacao-oportunidades-industriais-cubatao',
    resumo: 'Autonomia e Renda Petrobras oferece cursos gratuitos e bolsas para moradores próximos às operações da empresa.',
    conteudo: `<p>O Programa Autonomia e Renda Petrobras, realizado em parceria com Institutos Federais, manteve turmas de qualificação profissional em Cubatão.</p>
<h2>Formação para a indústria</h2>
<p>No primeiro ano em São Paulo, 124 alunos concluíram cursos. A iniciativa oferece formação gratuita e bolsas-auxílio para pessoas que vivem próximas às operações da companhia.</p>
<h2>Resultado local</h2>
<p>A publicação municipal relata a contratação de uma ex-aluna por uma prestadora de serviços da Refinaria Presidente Bernardes. As turmas citadas são históricas; novas inscrições precisam ser confirmadas no canal oficial do programa.</p>`,
    categoria: 'qualificacao',
    empresa: 'Petrobras / RPBC e IFSP', cidade: 'Cubatão', data_fato: '2025-08-07', publicado_em: '2025-08-07T15:00:00.000Z', fixado_banner: false,
    fonte_nome: 'Prefeitura de Cubatão',
    fonte_url: 'https://www.cubatao.sp.gov.br/bons-resultados-do-programa-autonomia-e-renda-petrobras-em-seu-primeiro-ano-de-execucao/',
  },
  {
    titulo: 'Nova diretoria do SINDQUIM toma posse em Santos',
    slug: 'nova-diretoria-sindquim-posse-santos-2025',
    resumo: 'Gestão empossada em maio de 2025 reconduziu Herbert Passos Filho à presidência do Sindicato dos Químicos da Baixada Santista.',
    conteudo: `<p>A diretoria eleita do Sindicato dos Químicos da Baixada Santista tomou posse em cerimônia realizada em Santos no dia 5 de maio de 2025.</p>
<h2>Presidência reconduzida</h2>
<p>Herbert Passos Filho foi reconduzido à presidência. Na cerimônia, a nova gestão reafirmou o compromisso com a representação dos trabalhadores e trabalhadoras da categoria.</p>
<h2>Composição em atualização</h2>
<p>A fonte pública confirma o presidente, mas não apresenta a relação completa dos demais cargos. O portal exibirá novos nomes somente após receber uma lista oficial ou ata da entidade.</p>`,
    categoria: 'sindicato',
    empresa: 'SINDQUIM', cidade: 'Santos', data_fato: '2025-05-05', publicado_em: '2025-05-06T15:00:00.000Z', fixado_banner: false,
    fonte_nome: 'FEQUIMFAR',
    fonte_url: 'https://fequimfar.org.br/diretoria-do-sindicato-dos-quimicos-da-baixada-santista-toma-posse-em-santos/',
  },
  {
    titulo: 'Yara inicia em Cubatão produção de amônia com base renovável',
    slug: 'yara-cubatao-amonia-base-renovavel',
    resumo: 'Companhia informou que passou a usar biometano de resíduos da cana-de-açúcar como matéria-prima em parte da produção de amônia.',
    conteudo: `<p>A Yara informou que seu complexo industrial de Cubatão passou a produzir amônia utilizando biometano proveniente de resíduos da cana-de-açúcar.</p>
<h2>Substituição de matéria-prima</h2>
<p>O biometano substitui parte do gás natural fóssil usado no processo. Segundo a empresa, a mudança pode reduzir em até 75% as emissões associadas à matéria-prima.</p>
<h2>Transição industrial</h2>
<p>A iniciativa integra a busca por fertilizantes e insumos industriais de menor carbono. Os percentuais desta notícia são os divulgados pela Yara e devem ser acompanhados em seus relatórios oficiais.</p>`,
    categoria: 'sustentabilidade',
    empresa: 'Yara Brasil', cidade: 'Cubatão', data_fato: '2024-12-06', publicado_em: '2024-12-06T15:00:00.000Z', fixado_banner: false,
    fonte_nome: 'Yara International',
    fonte_url: 'https://www.yara.com/news-and-media/news/archive/2024/yara-starts-production-of-renewable-based-ammonia-in-brazil/',
  },
];

/**
 * Acervo editorial usado nas capas das notícias.
 *
 * Fotografias de terceiros permanecem acompanhadas de crédito e do endereço
 * de procedência. Quando a foto não retrata o fato noticiado, a legenda deixa
 * explícito que se trata de imagem ilustrativa.
 */
export const IMAGENS_NOTICIAS = {
  'encerramento-producao-resina-epoxi-olin-guaruja': {
    arquivo: 'assets/noticias/olin-guaruja-industria.jpg',
    titulo: 'Notícia — indústria química e resinas epóxi',
    alt: 'Instalações externas de uma indústria química, com silos e estruturas de produção.',
    legenda: 'Imagem ilustrativa de uma unidade industrial química; a fotografia não retrata a fábrica da Olin no Guarujá.',
    credito: 'Benoît Prieur / Wikimedia Commons — CC0',
    origem: 'https://commons.wikimedia.org/wiki/File:Usine_chimique_de_Balan_(2013).jpg',
  },
  'petrobras-investimento-bioqav-diesel-renovavel-rpbc': {
    arquivo: 'assets/noticias/petrobras-rpbc-biorrefino.jpg',
    titulo: 'Notícia — área industrial da RPBC',
    alt: 'Vista ampla da área industrial da Refinaria Presidente Bernardes, em Cubatão.',
    legenda: 'Refinaria Presidente Bernardes (RPBC), em Cubatão, onde será implantado o projeto de biorrefino.',
    credito: 'Petrobras — CC BY 4.0',
    origem: 'https://agencia.petrobras.com.br/w/negocio/petrobras-aprova-investimento-em-planta-de-bioqav-e-diesel-renov%C3%A1vel-na-rpbc',
  },
  'empresas-polo-conselho-desenvolvimento-cubatao': {
    arquivo: 'assets/noticias/conselho-desenvolvimento-cubatao.jpg',
    titulo: 'Notícia — Conselho de Desenvolvimento de Cubatão',
    alt: 'Representantes do poder público, empresas e sociedade civil reunidos em torno de uma mesa em Cubatão.',
    legenda: 'Reunião que marcou a retomada do Conselho Municipal de Desenvolvimento Econômico e Social de Cubatão.',
    credito: 'Willian Gomes / Secom Cubatão',
    origem: 'https://www.cubatao.sp.gov.br/prefeitura-de-cubatao-creativa-o-conselho-municipal-de-desenvolvimento-economico-e-social/',
  },
  'semana-industria-qualificacao-empregos-polo-cubatao': {
    arquivo: 'assets/noticias/semana-industria-cubatao.jpg',
    titulo: 'Notícia — Semana da Indústria de Cubatão',
    alt: 'Participantes sentados no palco durante painel da Semana da Indústria de Cubatão.',
    legenda: 'Painel da Semana da Indústria de Cubatão sobre desenvolvimento, qualificação e sustentabilidade.',
    credito: 'Thiego Barbosa / Secom Cubatão',
    origem: 'https://www.cubatao.sp.gov.br/semana-da-industria-em-cubatao-aborda-inovacao-qualificacao-profissional-desenvolvimento-sustentavel/',
  },
  'mutirao-emprego-industrial-cubatao-balanco-2026': {
    arquivo: 'assets/noticias/mutirao-emprego-cubatao.jpg',
    titulo: 'Notícia — Mutirão do Emprego de Cubatão',
    alt: 'Trabalhadores são atendidos em mesas com computadores durante o Mutirão do Emprego de Cubatão.',
    legenda: 'Atendimento ao público durante a primeira edição de 2026 do Mutirão do Emprego de Cubatão.',
    credito: 'Secom Cubatão',
    origem: 'https://www.cubatao.sp.gov.br/mutirao-do-emprego-em-cubatao-atende-mais-de-2-mil-pessoas-e-reforca-integracao-entre-poder-publico-empresas-e-trabalhadores/',
  },
  'transicao-tributaria-industria-quimica-polo-cubatao-2026': {
    arquivo: 'assets/noticias/transicao-tributaria-industria-quimica.jpg',
    titulo: 'Notícia — votação da transição tributária no Senado',
    alt: 'Plenário do Senado Federal durante sessão deliberativa.',
    legenda: 'Plenário do Senado durante a votação da transição tributária para a indústria química.',
    credito: 'Senado Federal',
    origem: 'https://www12.senado.leg.br/noticias/materias/2026/02/25/reducao-de-aliquotas-tributarias-para-industria-quimica-segue-para-sancao',
  },
  'sindquim-articulacao-paralisacao-unigel-cubatao': {
    arquivo: 'assets/noticias/sindquim-unigel-articulacao.jpg',
    titulo: 'Notícia — articulação pela indústria química',
    alt: 'Representantes políticos e sindicais analisam documentos durante reunião em Brasília.',
    legenda: 'Comitiva de Cubatão durante a articulação federal por medidas para a indústria química.',
    credito: 'Thiago Macedo / PMC e Júlio César Silva / MDIC',
    origem: 'https://www.cubatao.sp.gov.br/alckmin-anuncia-r-2-bilhoes-para-a-industria-quimica-medida-beneficia-polo-de-cubatao/',
  },
  'petrocoque-projetos-sociais-cubatao-2026': {
    arquivo: 'assets/noticias/petrocoque-projetos-sociais.jpg',
    titulo: 'Notícia — projetos sociais apoiados pela Petrocoque',
    alt: 'Jovens músicos tocam violino juntos em uma apresentação.',
    legenda: 'Atividade cultural entre os projetos sociais apoiados pela Petrocoque em Cubatão.',
    credito: 'Divulgação / Comunicação Petrocoque',
    origem: 'https://www.cubatao.sp.gov.br/petrocoque-amplia-investimentos-sociais-em-cubatao-e-patrocina-oito-projetos-em-2026-por-leis-de-incentivo/',
  },
  'unipar-modernizacao-fabrica-cubatao-2025': {
    arquivo: 'assets/noticias/unipar-modernizacao-cubatao.jpg',
    titulo: 'Notícia — vista histórica do polo de Cubatão',
    alt: 'Vista aérea histórica da cidade de Cubatão e de parte do polo industrial.',
    legenda: 'Vista aérea histórica de Cubatão e do polo industrial; imagem de contexto, anterior à modernização anunciada pela Unipar em 2025.',
    credito: 'Arquivo Público do Estado de São Paulo / Wikimedia Commons — domínio público',
    origem: 'https://commons.wikimedia.org/wiki/File:Vista_a%C3%A9rea_da_cidad_-_Avenida_9_de_Abril_-_Rio_Cubat%C3%A3o_-_(Polo_Industrial)_-_Cubat%C3%A3o,_SP.jpg',
  },
  'petrobras-qualificacao-oportunidades-industriais-cubatao': {
    arquivo: 'assets/noticias/petrobras-qualificacao-industrial.jpg',
    titulo: 'Notícia — qualificação para oportunidades industriais',
    alt: 'Grupo diverso de profissionais participa de uma atividade de capacitação dentro de uma indústria.',
    legenda: 'Imagem ilustrativa de qualificação profissional em ambiente industrial.',
    credito: 'Freepik, via Prefeitura de Cubatão',
    origem: 'https://www.cubatao.sp.gov.br/bons-resultados-do-programa-autonomia-e-renda-petrobras-em-seu-primeiro-ano-de-execucao/',
  },
  'nova-diretoria-sindquim-posse-santos-2025': {
    arquivo: 'assets/noticias/diretoria-sindquim-posse.jpg',
    titulo: 'Notícia — posse da diretoria do SINDQUIM',
    alt: 'Dois representantes sindicais se cumprimentam durante a cerimônia de posse da diretoria do SINDQUIM.',
    legenda: 'Cerimônia de posse da diretoria do Sindicato dos Químicos da Baixada Santista, realizada em Santos.',
    credito: 'FEQUIMFAR',
    origem: 'https://fequimfar.org.br/diretoria-do-sindicato-dos-quimicos-da-baixada-santista-toma-posse-em-santos/',
  },
  'yara-cubatao-amonia-base-renovavel': {
    arquivo: 'assets/noticias/yara-amonia-renovavel-cubatao.jpg',
    titulo: 'Notícia — planta da Yara em Cubatão',
    alt: 'Profissional da Yara observa equipamentos da unidade industrial de Cubatão.',
    legenda: 'Unidade industrial da Yara em Cubatão, onde a companhia iniciou a produção de amônia com biometano.',
    credito: 'Yara International',
    origem: 'https://www.yara.com/news-and-media/news/archive/2024/yara-starts-production-of-renewable-based-ammonia-in-brazil/',
  },
};

function validarConteudo() {
  const slugs = new Set();
  for (const noticia of NOTICIAS_SINDQUIM) {
    if (!noticia.titulo || !noticia.resumo || !noticia.conteudo) throw new Error(`Notícia incompleta: ${noticia.slug}`);
    if (!/^https:\/\//.test(noticia.fonte_url)) throw new Error(`Fonte sem HTTPS: ${noticia.slug}`);
    if (slugs.has(noticia.slug)) throw new Error(`Slug repetido: ${noticia.slug}`);
    slugs.add(noticia.slug);
    const imagem = IMAGENS_NOTICIAS[noticia.slug];
    if (!imagem) throw new Error(`Imagem editorial ausente: ${noticia.slug}`);
    if (!existsSync(resolve(new URL('..', import.meta.url).pathname, imagem.arquivo))) {
      throw new Error(`Arquivo de imagem ausente: ${imagem.arquivo}`);
    }
    if (!/^https:\/\//.test(imagem.origem)) throw new Error(`Origem da imagem sem HTTPS: ${noticia.slug}`);
  }
}

async function respostaJson(resposta, metodo, caminho) {
  const texto = await resposta.text();
  const json = texto ? JSON.parse(texto) : {};
  if (!resposta.ok) throw new Error(`${metodo} ${caminho} → ${resposta.status}: ${JSON.stringify(json.errors ?? json).slice(0, 500)}`);
  return json.data;
}

async function api(metodo, caminho, corpo) {
  const resposta = await fetch(`${URL_BASE}${caminho}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  return respostaJson(resposta, metodo, caminho);
}

async function apiFormulario(caminho, formData) {
  const resposta = await fetch(`${URL_BASE}${caminho}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
  return respostaJson(resposta, 'POST', caminho);
}

export async function criarSeAusente(clienteApi, colecao, campo, dados) {
  const valor = encodeURIComponent(dados[campo]);
  const existentes = await clienteApi('GET', `/items/${colecao}?filter[${campo}][_eq]=${valor}&limit=1&fields=id`);
  if (existentes[0]) return { item: existentes[0], criado: false };
  return { item: await clienteApi('POST', `/items/${colecao}`, dados), criado: true };
}

async function pastaPublica() {
  const nome = encodeURIComponent('Portal — mídia pública');
  const pastas = await api('GET', `/folders?filter[name][_eq]=${nome}&limit=1&fields=id`);
  if (!pastas[0]) throw new Error('Pasta pública não encontrada. Rode directus-schema.mjs primeiro.');
  return pastas[0].id;
}

async function enviarArquivoLocal(caminhoRelativo, titulo, pastaId) {
  const existentes = await api('GET', `/files?filter[title][_eq]=${encodeURIComponent(titulo)}&filter[folder][_eq]=${pastaId}&limit=1&fields=id`);
  if (existentes[0]) return existentes[0].id;
  const caminho = resolve(new URL('..', import.meta.url).pathname, caminhoRelativo);
  if (!existsSync(caminho)) throw new Error(`Arquivo local não encontrado: ${caminhoRelativo}`);
  const extensao = extname(caminho).toLowerCase();
  const tipo = extensao === '.png' ? 'image/png' : 'image/jpeg';
  const formData = new FormData();
  formData.append('title', titulo);
  formData.append('folder', pastaId);
  formData.append('file', new Blob([readFileSync(caminho)], { type: tipo }), basename(caminho));
  const arquivo = await apiFormulario('/files', formData);
  return arquivo.id;
}

async function arquivarNoticiasDemonstrativas() {
  const marcador = encodeURIComponent('[DEMONSTRAÇÃO]');
  const itens = await api('GET', `/items/posts?filter[titulo][_starts_with]=${marcador}&filter[status][_neq]=archived&limit=-1&fields=id,titulo`);
  for (const item of itens) await api('PATCH', `/items/posts/${item.id}`, { status: 'archived', fixado_banner: false });
  return itens.length;
}

async function limparConfiguracoesDemonstrativas() {
  const config = await api('GET', '/items/configuracoes');
  const mudancas = {};
  if (config?.telefone === '(00) 0000-0000') mudancas.telefone = null;
  if (config?.email?.endsWith('.invalid')) mudancas.email = null;
  if (config?.endereco?.startsWith('Endereço demonstrativo')) {
    mudancas.endereco = 'Avenida Senador Pinheiro Machado, 77, Marapé, Santos/SP, CEP 11075-001';
  }
  if (Object.keys(mudancas).length > 0) await api('PATCH', '/items/configuracoes', mudancas);
}

async function principal() {
  if (!EMAIL || !SENHA) throw new Error('Defina DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD.');
  validarConteudo();
  const login = await fetch(`${URL_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: SENHA }),
  });
  if (!login.ok) throw new Error(`Login no Directus falhou (${login.status}).`);
  token = (await login.json()).data.access_token;

  const pastaId = await pastaPublica();
  const categorias = {};
  for (const [nome, slug] of [
    ['Sindicato', 'sindicato'],
    ['Empregos e indústria', 'empregos-industria'],
    ['Qualificação', 'qualificacao'],
    ['Sustentabilidade', 'sustentabilidade'],
  ]) {
    const { item } = await criarSeAusente(api, 'categorias', 'slug', { nome, slug });
    categorias[slug] = item.id;
  }

  const arquivadas = await arquivarNoticiasDemonstrativas();
  let noticiasCriadas = 0;
  let noticiasAtualizadas = 0;
  for (const noticia of NOTICIAS_SINDQUIM) {
    const imagemEditorial = IMAGENS_NOTICIAS[noticia.slug];
    const imagemId = await enviarArquivoLocal(imagemEditorial.arquivo, imagemEditorial.titulo, pastaId);
    const dados = {
      ...noticia,
      status: 'published',
      categoria: categorias[noticia.categoria],
      imagem: imagemId,
      imagem_alt: imagemEditorial.alt,
      imagem_legenda: imagemEditorial.legenda,
      imagem_credito: imagemEditorial.credito,
      youtube_url: null,
      agendado_para: null,
    };
    const { item, criado } = await criarSeAusente(api, 'posts', 'slug', dados);
    if (criado) noticiasCriadas += 1;
    else {
      await api('PATCH', `/items/posts/${item.id}`, dados);
      noticiasAtualizadas += 1;
    }
  }

  let diretoresCriados = 0;
  for (const diretor of DIRETORIA_CONFIRMADA) {
    const { criado } = await criarSeAusente(api, 'diretores', 'nome', { ...diretor, status: 'published', foto: null });
    if (criado) diretoresCriados += 1;
  }

  await limparConfiguracoesDemonstrativas();
  console.log(`Conteúdo verificado importado: ${noticiasCriadas} notícia(s) criada(s), ${noticiasAtualizadas} atualizada(s), ${diretoresCriados} integrante(s); ${arquivadas} notícia(s) demonstrativa(s) arquivada(s).`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch((erro) => { console.error(erro.message); process.exit(1); });
}
