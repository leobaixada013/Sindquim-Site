import path from 'node:path';
import { expect, test } from '@playwright/test';

const email = process.env.E2E_ADMIN_EMAIL;
const senha = process.env.E2E_ADMIN_PASSWORD;
const permitirMutacao = process.env.E2E_ALLOW_MUTATION === 'true';

test.describe('podcast editorial', () => {
  test.skip(!email || !senha || !permitirMutacao, 'Teste editorial exige credenciais e autorização explícita de mutação.');

  test('configura o canal, envia a arte e publica o próximo episódio', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-android', 'A mutação é executada uma única vez.');

    await page.goto('/admin/login');
    await page.getByLabel('Seu e-mail').fill(email as string);
    await page.getByLabel('Senha').fill(senha as string);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('heading', { name: 'O que você quer fazer?' })).toBeVisible();

    await page.goto('/admin/podcast');
    await expect(page.getByRole('heading', { name: 'Podcast Reação Química' })).toBeVisible();
    const layoutAdmin = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, pagina: document.documentElement.scrollWidth }));
    expect(layoutAdmin.pagina).toBeLessThanOrEqual(layoutAdmin.viewport + 1);
    await expect(page.locator('#podcast-imagem')).toBeHidden();
    const formularioCanal = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Canal e nome' }) });
    await formularioCanal.getByLabel('Mostrar o podcast no site').check();
    await formularioCanal.getByLabel('Nome exibido no site').fill('Podcast Reação Química');
    await formularioCanal.getByLabel('Link do canal no YouTube').fill('https://www.youtube.com/@ReaçãoQuímicaemDebate/streams');
    await formularioCanal.getByRole('button', { name: 'Salvar canal' }).click();
    await expect(page.locator('#feedback-podcast')).toContainText('Podcast configurado');
    await page.waitForTimeout(1_100);

    const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dataLocal = new Date(amanha.getTime() - amanha.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
    const formularioEpisodio = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Anuncie o próximo episódio' }) });
    await formularioEpisodio.getByLabel('Título do próximo episódio').fill('Reação Química — próximo encontro da categoria');
    await formularioEpisodio.getByLabel('Data e hora da estreia').fill(dataLocal);
    await formularioEpisodio.getByLabel('Resumo').fill('Teste editorial do card de programação do podcast.');
    await formularioEpisodio.getByLabel('Descreva o que aparece na arte').fill('Representantes do sindicato reunidos em evento institucional.');
    await page.locator('#podcast-imagem').setInputFiles(path.resolve(process.cwd(), '../assets/noticias/diretoria-sindquim-posse.jpg'));
    await formularioEpisodio.getByRole('button', { name: 'Publicar o anúncio' }).click();
    await expect(page.locator('#feedback-podcast')).toContainText('Próximo episódio publicado');

    await page.goto('/');
    await page.locator('.reveal').evaluateAll((elementos) => elementos.forEach((elemento) => elemento.classList.add('reveal--visivel')));
    const podcast = page.locator('#videos');
    await expect(podcast).toBeVisible();
    await expect(podcast.getByRole('heading', { name: 'Podcast Reação Química' })).toBeVisible();
    await expect(podcast.getByText('Reação Química — próximo encontro da categoria')).toBeVisible();
    await expect(podcast.locator('img:not([alt])')).toHaveCount(0);
    const medidas = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, pagina: document.documentElement.scrollWidth }));
    expect(medidas.pagina).toBeLessThanOrEqual(medidas.viewport + 1);
  });
});
