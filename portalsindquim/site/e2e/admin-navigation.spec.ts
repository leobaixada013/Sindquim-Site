import { expect, test } from '@playwright/test';

const email = process.env.E2E_ADMIN_EMAIL;
const senha = process.env.E2E_ADMIN_PASSWORD;

test.describe('navegação autenticada do painel', () => {
  test.skip(!email || !senha, 'Credenciais E2E do painel não configuradas.');

  test('Benefícios e Página Jurídico permanecem na sessão do portal', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Seu e-mail').fill(email!);
    await page.getByLabel('Senha').fill(senha!);
    await Promise.all([
      page.waitForURL(/\/admin\/?$/),
      page.getByRole('button', { name: 'Entrar' }).click(),
    ]);

    const navegacao = page.getByRole('navigation', { name: 'Navegação administrativa' });
    await navegacao.getByRole('link', { name: 'Benefícios' }).click();
    await expect(page).toHaveURL(/\/admin\/beneficios$/);
    await expect(page.getByRole('heading', { name: 'Benefícios', level: 1 })).toBeVisible();
    await expect(page).not.toHaveURL(/\/admin\/login/);

    await page.getByRole('navigation', { name: 'Navegação administrativa' })
      .getByRole('link', { name: 'Página Jurídico' }).click();
    await expect(page).toHaveURL(/\/admin\/pagina-juridico$/);
    await expect(page.getByRole('heading', { name: 'Página Jurídico', level: 1 })).toBeVisible();
    await expect(page).not.toHaveURL(/\/admin\/login/);
  });
});
