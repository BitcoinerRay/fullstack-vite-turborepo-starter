import {expect, test} from '@playwright/test';

test('renders the locale-aware login page', async ({page}) => {
  await page.goto('/en/login');

  await expect(page.getByRole('heading', {name: 'Sign In'})).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', {name: 'Sign In'})).toBeVisible();
});
