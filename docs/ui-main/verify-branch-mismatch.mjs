import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const { chromium } = await import(pathToFileURL(process.env.UI_QA_PLAYWRIGHT).href);
const origin = process.env.UI_QA_ORIGIN || 'http://127.0.0.1:5173';
const output = process.env.UI_QA_OUTPUT || '/tmp/chung-cu-ui-mismatch';
const expectBroken = process.env.UI_EXPECT_BROKEN === '1';
const browser = await chromium.launch({ executablePath: process.env.UI_QA_CHROMIUM,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote', '--single-process'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  // A small reproduction of the business branch's real navigation shape.
  await page.route('**/src/app/navigation.js*', route => route.fulfill({
    contentType: 'application/javascript',
    body: 'export const navigation = { QUAN_TRI_VIEN: [{title: "Điều hành", items: [["/quan-tri", "Tổng quan", "dashboard"]]}] };',
  }));
  await page.goto(origin);
  if (expectBroken) {
    await page.waitForFunction(() => !document.querySelector('#root')?.textContent && document.querySelector('vite-error-overlay') === null);
    await page.waitForEvent('pageerror', { timeout: 5000 }).catch(() => {});
    assert.ok(errors.some(message => /undefined.*filter|filter.*undefined/.test(message)), JSON.stringify(errors));
    assert.equal(await page.locator('#root').textContent(), '');
  } else {
    await page.getByRole('heading', { name: 'Không khớp phiên bản giao diện' }).waitFor();
    assert.match(await page.getByRole('link', { name: 'Mở hướng dẫn khôi phục bản nghiệp vụ' }).getAttribute('href'), /khoi-phuc-ban-nghiep-vu-vscode/);
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
    assert.deepEqual(errors, []);
    await page.unroute('**/src/app/navigation.js*');
    await page.goto(origin);
    await page.getByRole('heading', { name: 'Tổng quan', exact: true }).waitFor();
    assert.equal(await page.getByRole('navigation', { name: 'Chức năng', exact: true }).getByRole('button').count(), 8);
  }
  await mkdir(output, { recursive: true });
  const report = { mode: expectBroken ? 'reproduced-original-failure' : 'fixed-and-compatible-preview-passes', errors };
  await writeFile(path.join(output, expectBroken ? 'before.json' : 'after.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
