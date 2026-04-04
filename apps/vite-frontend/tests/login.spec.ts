import {type Page, expect, test} from '@playwright/test';

const user = {
  id: 'user-1',
  email: 'user@example.com',
  role: 'USER',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

async function mockAuthApi(page: Page): Promise<void> {
  let isAuthenticated = false;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = request.url();

    if (request.method() === 'GET' && url.endsWith('/users/me')) {
      await route.fulfill({
        status: isAuthenticated ? 200 : 401,
        contentType: 'application/json',
        body: JSON.stringify(isAuthenticated ? user : {message: 'Unauthorized', statusCode: 401}),
      });
      return;
    }

    if (request.method() === 'POST' && url.endsWith('/auth/login')) {
      const body = request.postDataJSON() as {email?: string; password?: string};

      if (body.email === user.email && body.password === 'password123') {
        isAuthenticated = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({user, accessToken: 'valid-token'}),
        });
        return;
      }

      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({message: 'Invalid credentials', statusCode: 401}),
      });
      return;
    }

    if (request.method() === 'POST' && url.endsWith('/auth/register')) {
      isAuthenticated = true;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({user, accessToken: 'registered-token'}),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({message: `Unhandled API request: ${request.method()} ${url}`}),
    });
  });
}

test.beforeEach(async ({page}) => {
  await mockAuthApi(page);
});

test('renders the locale-aware login page', async ({page}) => {
  await page.goto('/en/login');

  await expect(page.getByRole('heading', {name: 'Sign In'})).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password', {exact: true})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Sign In'})).toBeVisible();
});

test('renders the locale-aware register page', async ({page}) => {
  await page.goto('/en/register');

  await expect(page.getByRole('heading', {name: 'Sign Up'})).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password', {exact: true})).toBeVisible();
  await expect(page.getByLabel('Confirm Password')).toBeVisible();
  await expect(page.getByRole('button', {name: 'Sign Up'})).toBeVisible();
});

test('redirects unauthenticated users from the protected locale root to login', async ({page}) => {
  await page.goto('/en');

  await expect(page).toHaveURL(/\/en\/login$/u);
  await expect(page.getByRole('heading', {name: 'Sign In'})).toBeVisible();
});

test('signs in successfully and lands on the locale home route', async ({page}) => {
  await page.goto('/en/login');

  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', {exact: true}).fill('password123');
  await page.getByRole('button', {name: 'Sign In'}).click();

  await expect(page).toHaveURL(/\/en$/u);
  await expect(page.getByRole('heading', {name: 'Welcome to Vite - NestJS - Turbo Boilerplate'})).toBeVisible();
});

test('shows a toast when login fails with unauthorized credentials', async ({page}) => {
  await page.goto('/en/login');

  await page.getByLabel('Email').fill('invalid@example.com');
  await page.getByLabel('Password', {exact: true}).fill('password123');
  await page.getByRole('button', {name: 'Sign In'}).click();

  await expect(page.getByText('Invalid email or password.')).toBeVisible();
});
