import { expect, test, type Page } from '@playwright/test';

const ROTAS_PUBLICAS = [
  '/',
  '/noticias',
  '/beneficios',
  '/juridico',
  '/diretoria',
  '/filie-se',
  '/contato',
] as const;

async function esperarPagina(page: Page, rota: string) {
  const resposta = await page.goto(rota, { waitUntil: 'domcontentloaded' });
  expect(resposta?.status(), `${rota} deve responder sem erro`).toBeLessThan(400);
  await expect(page.locator('main#conteudo')).toBeVisible();
}

async function esperarFontes(page: Page) {
  await page.evaluate(async () => {
    if ('fonts' in document) await document.fonts.ready;
  });
}

async function esperarRevelacoes(page: Page) {
  await page.locator('.reveal').evaluateAll((elementos) => {
    for (const elemento of elementos) elemento.classList.add('reveal--visivel');
  });
}

async function medirLayout(page: Page) {
  return page.evaluate(() => ({
    larguraViewport: document.documentElement.clientWidth,
    larguraDocumento: document.documentElement.scrollWidth,
    fonteCorpo: Number.parseFloat(getComputedStyle(document.body).fontSize),
  }));
}

test.describe('experiência mobile do portal', () => {
  test('todas as rotas principais têm reflow, leitura e estrutura básica corretos', async ({ page }) => {
    const errosDaPagina: string[] = [];
    const errosDoConsole: string[] = [];

    page.on('pageerror', (erro) => errosDaPagina.push(erro.message));
    page.on('console', (mensagem) => {
      if (mensagem.type() === 'error') {
        const origem = mensagem.location().url;
        if (origem.startsWith('https://static.cloudflareinsights.com/beacon.min.js/')) return;
        errosDoConsole.push(origem ? `${origem}: ${mensagem.text()}` : mensagem.text());
      }
    });

    for (const rota of ROTAS_PUBLICAS) {
      await test.step(rota, async () => {
        await esperarPagina(page, rota);
        await esperarFontes(page);
        await esperarRevelacoes(page);

        await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
        await expect(page.locator('main#conteudo h1')).toHaveCount(1);
        await expect(page.locator('main#conteudo h1')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Ir para o conteúdo' })).toHaveAttribute('href', '#conteudo');
        await expect(page.locator('img:not([alt])')).toHaveCount(0);

        const layout = await medirLayout(page);
        expect(
          layout.larguraDocumento,
          `${rota} não pode criar rolagem horizontal`,
        ).toBeLessThanOrEqual(layout.larguraViewport + 1);
        expect(layout.fonteCorpo, `${rota} deve manter texto-base legível`).toBeGreaterThanOrEqual(16);
      });
    }

    expect(errosDaPagina, 'erros JavaScript não tratados').toEqual([]);
    expect(errosDoConsole, 'erros registrados no console').toEqual([]);
  });

  test('menu móvel é claro, tocável e não exibe Avisos', async ({ page }) => {
    await esperarPagina(page, '/');

    const botao = page.locator('.menu-toggle');
    const menu = page.locator('#menu-principal');

    await expect(botao).toBeVisible();
    await expect(page.locator('.topbar').locator('.menu-toggle')).toHaveCount(1);
    await expect(page.locator('.mainnav').locator('.menu-toggle')).toHaveCount(0);
    await expect(botao).toHaveAttribute('aria-expanded', 'false');
    await expect(botao).toHaveAttribute('aria-label', 'Abrir menu principal');
    await expect(menu).toHaveAttribute('hidden', '');
    await expect(menu).toBeHidden();

    const caixaBotao = await botao.boundingBox();
    expect(caixaBotao?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(caixaBotao?.height ?? 0).toBeGreaterThanOrEqual(44);

    await botao.click();
    await expect(botao).toHaveAttribute('aria-expanded', 'true');
    await expect(botao).toHaveAttribute('aria-label', 'Fechar menu principal');
    await expect(menu).not.toHaveAttribute('hidden', '');
    await expect(menu).toBeVisible();

    const textos = await menu.locator('a').allTextContents();
    const itensMenu = textos.map((texto) => texto.trim());
    expect(itensMenu).toEqual([
      'Início',
      'Notícias',
      'Benefícios',
      'Jurídico',
      'Diretoria',
      'Filie-se',
      'Contato',
    ]);
    expect(itensMenu).not.toContain('Podcast');
    expect(textos).not.toContain('Avisos');

    const alvos = await menu.locator('a').evaluateAll((links) =>
      links.map((link) => {
        const caixa = link.getBoundingClientRect();
        return { largura: caixa.width, altura: caixa.height };
      }),
    );
    for (const alvo of alvos) {
      expect(alvo.largura).toBeGreaterThanOrEqual(44);
      expect(alvo.altura).toBeGreaterThanOrEqual(44);
    }
  });

  test('cabeçalho oferece busca e redes sociais acessíveis', async ({ page }) => {
    await esperarPagina(page, '/');

    const busca = page.getByRole('search').first();
    await expect(busca.getByRole('searchbox', { name: 'Buscar no site' })).toBeVisible();
    await expect(busca.getByRole('button', { name: 'Buscar' })).toBeVisible();

    const redes = page.getByRole('navigation', { name: 'Redes sociais' });
    await expect(redes.getByRole('link', { name: 'YouTube' })).toBeVisible();
    await expect(redes.getByRole('link', { name: 'Instagram' })).toHaveClass(/social-links__instagram/);
    await expect(redes.getByRole('link', { name: 'YouTube' })).toHaveClass(/social-links__youtube/);
    await expect(page.locator('.topbar a[href^="tel:"]')).toHaveCount(0);
    await expect(page.locator('.topbar a[href^="mailto:"]')).toHaveCount(0);
  });

  test('contato prioriza canais diretos, mapa e não exibe formulários removidos', async ({ page }) => {
    await esperarPagina(page, '/contato');

    await expect(page.getByRole('heading', { name: 'Fale com o sindicato', level: 1 })).toBeVisible();
    await expect(page.locator('.contact-hero__eyebrow svg')).toBeVisible();
    await expect(page.locator('form[action="/api/contato"]')).toHaveCount(0);
    await expect(page.getByText('Envie uma mensagem', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Sede do Sindquim', level: 2 })).toBeVisible();
    await expect(page.locator('.contact-location iframe')).toHaveAttribute('title', /Mapa da sede do Sindquim/);

    const rodape = page.locator('footer.footer');
    await expect(rodape.getByText('Receba as novidades', { exact: true })).toHaveCount(0);
    await expect(rodape.locator('form[action="/api/newsletter"]')).toHaveCount(0);
  });

  test('busca encontra notícias sem depender de acentos', async ({ page }) => {
    await esperarPagina(page, '/buscar?q=quimica');
    await expect(page.getByRole('heading', { name: 'Busca', level: 1 })).toBeVisible();
    await expect(page.locator('.busca-resultados li').first()).toBeVisible();
    await expect(page).toHaveURL(/\/buscar\?q=quimica/);
  });

  test('atalho de teclado leva ao conteúdo principal', async ({ page }, testInfo) => {
    await esperarPagina(page, '/');
    const atalho = page.getByRole('link', { name: 'Ir para o conteúdo' });

    if (testInfo.project.name === 'mobile-iphone') {
      // O Safari móvel só percorre links com Tab quando o acesso completo ao
      // teclado está habilitado no dispositivo. Ainda validamos foco e ação.
      await atalho.focus();
    } else {
      await page.keyboard.press('Tab');
    }
    await expect(atalho).toBeFocused();
    await expect(atalho).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#conteudo$/);
  });

  test('campos e ações mantêm tamanho confortável no celular', async ({ page }) => {
    for (const rota of ['/contato', '/filie-se', '/juridico'] as const) {
      await test.step(rota, async () => {
        await esperarPagina(page, rota);
        const medidas = await page.locator('input, textarea, select, button.button').evaluateAll((elementos) =>
          elementos
            .filter((elemento) => {
              const estilo = getComputedStyle(elemento);
              const caixa = elemento.getBoundingClientRect();
              return !elemento.closest('[aria-hidden="true"]')
                && estilo.display !== 'none'
                && estilo.visibility !== 'hidden'
                && estilo.opacity !== '0'
                && caixa.width > 0
                && caixa.height > 0;
            })
            .map((elemento) => {
              const estilo = getComputedStyle(elemento);
              const caixa = elemento.getBoundingClientRect();
              const tipo = elemento.getAttribute('type');
              const caixaDeToque = tipo === 'checkbox' || tipo === 'radio'
                ? elemento.closest('label')?.getBoundingClientRect() ?? caixa
                : caixa;
              return {
                etiqueta: elemento.getAttribute('aria-label') || elemento.getAttribute('name') || elemento.tagName,
                fonte: Number.parseFloat(estilo.fontSize),
                altura: caixaDeToque.height,
              };
            }),
        );

        expect(medidas.length).toBeGreaterThan(0);
        for (const medida of medidas) {
          expect(medida.fonte, `${rota}: ${medida.etiqueta} não deve provocar zoom no iOS`).toBeGreaterThanOrEqual(16);
          expect(medida.altura, `${rota}: ${medida.etiqueta} precisa ser fácil de tocar`).toBeGreaterThanOrEqual(44);
        }
      });
    }
  });

  test('lista e detalhe de notícia permanecem navegáveis no celular', async ({ page }) => {
    await esperarPagina(page, '/noticias');
    await esperarRevelacoes(page);

    const linksDeMateria = page.locator('article h3 a');
    const total = await linksDeMateria.count();
    expect(total).toBeGreaterThan(0);

    const primeiraMateria = await linksDeMateria.nth(0).getAttribute('href');
    expect(primeiraMateria).toMatch(/^\/noticias\/.+/);

    const capas = page.locator('.lista-noticias article img.post-image');
    await expect(capas).toHaveCount(total);
    await expect(page.locator('.lista-noticias .post-image--placeholder')).toHaveCount(0);
    const urlsDasCapas = await capas.evaluateAll((imagens) => imagens.map((imagem) => (imagem as HTMLImageElement).src));

    const proximaPagina = page.getByRole('link', { name: 'Próxima' });
    if (await proximaPagina.count()) {
      await proximaPagina.click();
      await esperarRevelacoes(page);
      const capasDaPaginaSeguinte = page.locator('.lista-noticias article img.post-image');
      await expect(page.locator('.lista-noticias .post-image--placeholder')).toHaveCount(0);
      urlsDasCapas.push(
        ...await capasDaPaginaSeguinte.evaluateAll((imagens) => imagens.map((imagem) => (imagem as HTMLImageElement).src)),
      );
    }

    expect(urlsDasCapas.length).toBeGreaterThanOrEqual(12);
    expect(new Set(urlsDasCapas).size, 'cada matéria deve ter uma capa própria').toBe(urlsDasCapas.length);

    await page.goto(primeiraMateria!);
    await esperarFontes(page);
    await expect(page).toHaveURL(/\/noticias\/.+/);
    await expect(page.locator('article h1')).toBeVisible();
    await expect(page.locator('.artigo-capa-wrap .artigo-capa')).toBeVisible();
    await expect(page.locator('.artigo-capa-wrap figcaption')).toContainText('Crédito:');

    const layout = await medirLayout(page);
    const salientes = await page.locator('body *').evaluateAll((elementos) =>
      elementos
        .map((elemento) => {
          const caixa = elemento.getBoundingClientRect();
          return {
            elemento: `${elemento.tagName.toLowerCase()}.${elemento.className}`,
            esquerda: caixa.left,
            direita: caixa.right,
          };
        })
        .filter(({ esquerda, direita }) => direita > document.documentElement.clientWidth + 1 || esquerda < -1)
        .slice(0, 8),
    );
    expect(
      layout.larguraDocumento,
      `detalhe não pode criar rolagem horizontal: ${JSON.stringify(salientes)}`,
    ).toBeLessThanOrEqual(layout.larguraViewport + 1);
    const fonte = page.locator('.fontes-noticia');
    await expect(fonte.getByRole('heading', { name: 'Fonte da matéria' })).toBeVisible();
    await expect(fonte.locator('a[target="_blank"]')).toBeVisible();
  });

  test('notícia em destaque mantém contraste sobre qualquer fotografia', async ({ page }) => {
    await esperarPagina(page, '/');
    await esperarRevelacoes(page);

    const destaque = page.locator('.featured-post');
    await expect(destaque).toBeVisible();
    await expect(destaque.locator('.post-image')).toBeVisible();
    await expect(destaque.locator('.post-body h3')).toBeVisible();

    const estilos = await destaque.evaluate((elemento) => {
      const corpo = elemento.querySelector<HTMLElement>('.post-body')!;
      const titulo = elemento.querySelector<HTMLElement>('.post-body h3 a')!;
      const camada = getComputedStyle(elemento, '::after');
      const caixa = elemento.getBoundingClientRect();
      return {
        altura: caixa.height,
        fundoDaCamada: camada.backgroundImage,
        posicaoDaCamada: camada.position,
        camadaAcimaDaFoto: Number.parseInt(camada.zIndex, 10),
        corpoAcimaDaCamada: Number.parseInt(getComputedStyle(corpo).zIndex, 10),
        corDoTitulo: getComputedStyle(titulo).color,
        sombraDoTexto: getComputedStyle(corpo).textShadow,
      };
    });

    // WebKit pode representar os 440px declarados como 439,9999px.
    expect(estilos.altura).toBeGreaterThanOrEqual(439.5);
    expect(estilos.fundoDaCamada).toContain('linear-gradient');
    expect(estilos.posicaoDaCamada).toBe('absolute');
    expect(estilos.camadaAcimaDaFoto).toBeGreaterThanOrEqual(1);
    expect(estilos.corpoAcimaDaCamada).toBeGreaterThan(estilos.camadaAcimaDaFoto);
    expect(estilos.corDoTitulo).toBe('rgb(255, 255, 255)');
    expect(estilos.sombraDoTexto).not.toBe('none');
  });

  test('conteúdo continua disponível com redução de movimento', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await esperarPagina(page, '/');

    const revelacoes = page.locator('.reveal');
    const total = await revelacoes.count();
    expect(total).toBeGreaterThan(0);
    const opacidades = await revelacoes.evaluateAll((elementos) =>
      elementos.map((elemento) => getComputedStyle(elemento).opacity),
    );
    expect(opacidades.every((opacidade) => opacidade === '1')).toBe(true);
  });
});
