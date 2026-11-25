import { expect, test } from '@playwright/test';

test('shows a successful server connection', async ({ page }) => {
  await page.route('**/api/health', (route) => route.fulfill({ json: { status: 'ok' } }));
  await page.goto('/connection');
  await expect(page.getByRole('heading', { name: '대체역사 시뮬레이터' })).toBeVisible();
  await page.getByRole('button', { name: '서버 연결 확인' }).click();
  await expect(page.getByRole('status')).toHaveText('서버에 연결되었습니다.');
});

test('reports an unavailable server', async ({ page }) => {
  await page.route('**/api/health', (route) => route.fulfill({ status: 503 }));
  await page.goto('/connection');
  await page.getByRole('button', { name: '서버 연결 확인' }).click();
  await expect(page.getByRole('status')).toHaveText('서버에 연결할 수 없습니다.');
});
