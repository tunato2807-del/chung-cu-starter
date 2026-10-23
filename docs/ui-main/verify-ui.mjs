// Browser QA outside application dependencies. See verification.md for setup.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const { chromium } = await import(pathToFileURL(process.env.UI_QA_PLAYWRIGHT).href);
const origin = process.env.UI_QA_ORIGIN || 'http://127.0.0.1:5173';
const output = process.env.UI_QA_OUTPUT || '/tmp/chung-cu-main-ui-results';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.UI_QA_CHROMIUM, headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote', '--single-process'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const failures = [];
const errors = [];
const report = { widths: [], pages: 0, axeScans: 0, consoleErrors: [], checks: [] };
let simulatingFailure = false;
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error' && !simulatingFailure) report.consoleErrors.push(message.text());
});
page.on('response', response => {
  if (!simulatingFailure && response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
});
const h1 = () => page.locator('h1');
const search = () => page.getByRole('searchbox');
const nav = () => page.getByRole('navigation', { name: 'Chức năng' });
const checked = async label => {
  assert.equal(await h1().count(), 1);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${label}: overflow`);
};
async function axe(label) {
  await page.addScriptTag({ path: process.env.UI_QA_AXE });
  const result = await page.evaluate(async () => {
    const result = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } });
    return result.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) }));
  });
  assert.deepEqual(result, [], `${label}: accessibility`);
  report.axeScans++;
}
try {
  await page.goto(origin);
  await page.getByText('API đang hoạt động', { exact: true }).waitFor();
  assert.deepEqual(await (await page.request.get(`${origin}/api/health`)).json(), { data: { status: 'ok', database: 'not_configured' } });
  await page.getByText('Chưa cấu hình', { exact: true }).waitFor();
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await checked(`width ${width}`);
    await axe(`width ${width}`);
    await page.screenshot({ path: path.join(output, `overview-${width}.png`), fullPage: true });
    report.widths.push(width);
  }
  // Reset focus and exercise the skip link using only the keyboard.
  await page.goto(origin);
  await page.getByRole('link', { name: 'Đến nội dung chính' }).waitFor({ state: 'attached' });
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').textContent(), 'Đến nội dung chính');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'main-content');
  await page.locator('#preview-group').focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('aria-current'), 'page');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  assert.equal(await h1().textContent(), 'Phản ánh');
  assert.equal(await page.locator(':focus').evaluate(el => el.tagName), 'H1');
  report.checks.push('keyboard navigation and skip link');

  const groups = {
    'Ban quản lý': ['Tổng quan', 'Phản ánh', 'Căn hộ và cư trú', 'Vị trí và QR', 'Phí và hóa đơn', 'Thông báo', 'Nhân sự và tài khoản', 'Cấu hình'],
    'Cư dân': ['Trang chủ', 'Phản ánh', 'Hóa đơn', 'Thông báo', 'Tài khoản'],
    'Kỹ thuật viên': ['Công việc', 'Thông báo', 'Tài khoản'],
    'Khách': ['Quét QR', 'Gửi phản ánh', 'Tra cứu phản ánh'],
  };
  for (const [group, screens] of Object.entries(groups)) {
    await page.locator('#preview-group').selectOption(group);
    assert.equal(await h1().textContent(), screens[0]);
    assert.equal(await nav().getByRole('button').count(), screens.length);
    for (const screen of screens) {
      await nav().getByRole('button', { name: screen, exact: true }).click();
      assert.equal(await h1().textContent(), screen);
      assert.equal(await nav().locator('[aria-current="page"]').textContent(), screen);
      await checked(`${group}/${screen}`);
      await axe(`${group}/${screen}`);
      report.pages++;
    }
  }
  await page.locator('#preview-group').selectOption('Ban quản lý');
  await nav().getByRole('button', { name: 'Tổng quan', exact: true }).click();
  await search().fill('hoa don');
  assert.equal(await page.locator('.directory-list li').count(), 1);
  assert.equal(await search().evaluate(el => el === document.activeElement), true);
  await page.locator('.directory-list button').click();
  assert.equal(await h1().textContent(), 'Phí và hóa đơn');
  assert.equal(await search().inputValue(), '');
  await search().fill('PHẢN ÁNH');
  assert.equal(await page.locator('.directory-list li').count(), 1);
  await search().fill('khongtimthay');
  await page.getByRole('heading', { name: 'Chưa tìm thấy màn hình' }).waitFor();
  await axe('empty search');
  await page.locator('.empty-search').getByRole('button', { name: 'Xóa tìm kiếm' }).click();
  assert.equal(await search().inputValue(), '');
  assert.equal(await search().evaluate(el => el === document.activeElement), true);
  await search().fill('can ho');
  await page.locator('#preview-group').selectOption('Cư dân');
  assert.equal(await search().inputValue(), '');
  assert.equal(await h1().textContent(), 'Trang chủ');
  report.checks.push('search accents/case, empty/reset, group reset, same-page focus regression');

  await page.setViewportSize({ width: 320, height: 800 });
  assert.equal(await nav().isVisible(), false);
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await axe('mobile open menu');
  await checked('mobile open menu');
  await nav().getByRole('button', { name: 'Hóa đơn', exact: true }).click();
  assert.equal(await nav().isVisible(), false);
  assert.equal(await h1().textContent(), 'Hóa đơn');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator(':focus').getAttribute('aria-expanded'), 'false');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.locator('#preview-group').selectOption('Khách');
  assert.equal(await nav().isVisible(), false);
  assert.equal(await h1().textContent(), 'Quét QR');
  await page.screenshot({ path: path.join(output, 'module-320.png'), fullPage: true });
  await page.addStyleTag({ content: 'html { font-size: 200%; }' });
  await checked('200% text at 320');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await checked('200% text mobile menu');
  await page.reload();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  report.checks.push('mobile select/close/Escape/focus, text 200%');

  simulatingFailure = true;
  await page.route('**/api/health', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.reload();
  await page.getByText('Cần kiểm tra kết nối', { exact: true }).waitFor();
  await axe('API failure');
  await page.unroute('**/api/health');
  await page.getByRole('button', { name: 'Kiểm tra lại', exact: true }).click();
  await page.getByText('API đang hoạt động', { exact: true }).waitFor();
  await page.route('**/api/health', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":{"status":"down"}}' }));
  await page.getByRole('button', { name: 'Kiểm tra lại', exact: true }).click();
  await page.getByText('Phản hồi API không hợp lệ.', { exact: false }).waitFor();
  await page.unroute('**/api/health');
  await page.route('**/api/health', async route => {
    await new Promise(resolve => setTimeout(resolve, 6000));
    await route.abort().catch(() => {});
  });
  await page.getByRole('button', { name: 'Kiểm tra lại', exact: true }).click();
  await page.getByText('Đang kiểm tra API…', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Đang kiểm tra', exact: true }).isDisabled(), true);
  assert.equal(await page.locator('.loading-bar').evaluate(el => getComputedStyle(el).animationName), 'none');
  await page.getByText('API chưa phản hồi sau 5 giây.', { exact: false }).waitFor();
  await page.unroute('**/api/health');
  await page.getByRole('button', { name: 'Kiểm tra lại', exact: true }).click();
  await page.getByText('API đang hoạt động', { exact: true }).waitFor();
  simulatingFailure = false;
  report.checks.push('real health, HTTP failure/retry, malformed response, 5s timeout/retry, loading/reduced motion');
  assert.deepEqual(errors, [], 'JS page errors');
  assert.deepEqual(report.consoleErrors, [], 'unexpected console errors');
  assert.deepEqual(failures, [], 'unexpected HTTP errors');
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
