const { expect } = require('@playwright/test');

const DEFAULT_BASE_URL = 'https://spend-mhz-bufing-characteristics.trycloudflare.com';
const DEFAULT_LOGIN_PATH = '/login';
const DEFAULT_PORTFOLIO_PATH = '/portfolio';

function getBaseUrl(baseUrl) {
  return String(baseUrl || process.env.TEST_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
}

function getCredentials() {
  return {
    username: process.env.LOGIN_USERNAME || 'eagle_user1',
    password: process.env.LOGIN_PASSWORD || 'FD_hack@user1',
  };
}

async function ensureLoggedIn(page, options = {}) {
  const baseUrl = getBaseUrl(options.baseUrl);
  const loginPath = options.loginPath || DEFAULT_LOGIN_PATH;
  const { username, password } = getCredentials();
  const loggedInAnchor = page
    .getByRole('button', { name: /sign out/i })
    .or(page.getByRole('link', { name: /Study Portfolio|Protocol Search|Home/i }))
    .first();

  await page.goto(`${baseUrl}/home`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});

  if (await loggedInAnchor.isVisible().catch(() => false)) {
    return;
  }

  await page.goto(`${baseUrl}${loginPath}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});

  // Already authenticated sessions can be redirected to app shell immediately.
  if (await loggedInAnchor.isVisible().catch(() => false)) {
    return;
  }

  const usernameInput = page
    .getByLabel(/username|email/i)
    .or(page.getByPlaceholder(/enter your username|username|email/i))
    .or(page.locator('input[name*="user" i], input[name*="email" i], input[type="email"], input[type="text"]').first())
    .first();

  const passwordInput = page
    .getByLabel(/password/i)
    .or(page.getByPlaceholder(/password/i))
    .or(page.locator('input[type="password"], input[name*="pass" i]').first())
    .first();

  const signInButton = page
    .getByRole('button', { name: /sign in|log in|login/i })
    .or(page.locator('button[type="submit"]').first())
    .first();

  await expect(usernameInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(signInButton).toBeVisible();

  await usernameInput.fill(username);
  await passwordInput.fill(password);
  await signInButton.click();

  await Promise.race([
    page.waitForURL((url) => !/\/login\/?$/i.test(new URL(url).pathname), { timeout: 15_000 }).catch(() => {}),
    loggedInAnchor.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {}),
  ]);

  await page.waitForLoadState('networkidle').catch(() => {});

  if (await loggedInAnchor.isVisible().catch(() => false)) {
    return;
  }

  const stillOnLogin = /\/login\/?$/i.test(new URL(page.url()).pathname);
  const authError = page
    .getByText(/invalid|incorrect|failed|unauthorized|try again|not match|wrong credentials/i)
    .first();

  const hasAuthError = await authError.isVisible().catch(() => false);
  if (stillOnLogin && hasAuthError) {
    const body = await page.locator('body').innerText().catch(() => '');
    throw new Error(`Login failed at ${page.url()} :: ${body.slice(0, 300)}`);
  }

  await expect(loggedInAnchor).toBeVisible();
}

async function openStudyPortfolio(page, options = {}) {
  const baseUrl = getBaseUrl(options.baseUrl);
  const portfolioPath = options.portfolioPath || DEFAULT_PORTFOLIO_PATH;

  const studyPortfolioLink = page.getByRole('link', { name: /Study Portfolio/i }).first();

  if (await studyPortfolioLink.isVisible().catch(() => false)) {
    await studyPortfolioLink.click({ force: true });
    await page.waitForLoadState('networkidle').catch(() => {});
  } else {
    await page.goto(`${baseUrl}${portfolioPath}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
  }

  if (!/\/portfolio\/?$/i.test(new URL(page.url()).pathname)) {
    await page.goto(`${baseUrl}${portfolioPath}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
  }

  await expect(page).toHaveURL(/\/portfolio\/?$/i);
  await expect(page.getByRole('heading', { name: /Study Portfolio Dashboard|Portfolio Dashboard/i })).toBeVisible();
}

async function setupAuthenticatedStudyPortfolio(page, options = {}) {
  await ensureLoggedIn(page, options);
  await openStudyPortfolio(page, options);
}

module.exports = {
  ensureLoggedIn,
  openStudyPortfolio,
  setupAuthenticatedStudyPortfolio,
};
