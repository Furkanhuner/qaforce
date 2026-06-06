/** @istqb
 * level: integration
 * type: functional
 * technique: [EP, BVA]
 * risk: high
 * requirement: REQ-AUTH-002
 */
import { expect, test } from '@playwright/test';

test.describe('Login API — POST /api/login', () => {
  // EP: valid partition — correct credentials
  test('returns 200 and token for valid credentials', async ({ request }) => {
    const response = await request.post('/api/login', {
      data: { email: 'test@example.com', password: 'password123' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json() as { success: boolean; token: string };
    expect(body.success).toBe(true);
    expect(body.token).toBeTruthy();
  });

  // EP: invalid partition — wrong credentials
  test('returns 401 for invalid credentials (EP: invalid partition)', async ({ request }) => {
    const response = await request.post('/api/login', {
      data: { email: 'wrong@example.com', password: 'wrongpassword' },
    });
    expect(response.status()).toBe(401);
    const body = await response.json() as { error: string };
    expect(body.error).toContain('Invalid');
  });

  // BVA: boundary at 0 chars — missing password
  test('returns 400 when password is missing (BVA: boundary 0 chars)', async ({ request }) => {
    const response = await request.post('/api/login', {
      data: { email: 'test@example.com', password: '' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json() as { error: string };
    expect(body.error).toContain('required');
  });
});
