/** @istqb
 * level: system
 * type: functional
 * technique: [BVA, EP]
 * risk: high
 * requirement: REQ-AUTH-001
 */
import { expect, test } from '@playwright/test';

test.describe('Login — authentication flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // EP: valid partition — correct credentials
  test('allows login with valid email and password', async ({ page }) => {
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('status')).toContainText('Welcome');
  });

  // BVA: boundary at 0 chars — empty password
  test('shows error when password is empty (BVA: boundary 0 chars)', async ({ page }) => {
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('required');
  });

  // EP: invalid partition — wrong credentials
  test('shows error for invalid credentials (EP: invalid partition)', async ({ page }) => {
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toContainText('Invalid');
  });
});
