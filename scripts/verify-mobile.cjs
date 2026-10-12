'use strict';
// Disposable synthetic profiles and an ephemeral loopback server only.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const cp = require('node:child_process');
const {shop} = require('../test/fixtures/shop.cjs');
const engines = require('@playwright/test');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const browserName = process.env.XL_MOBILE_BROWSER || 'chromium';
const output = path.resolve(process.env.XL_MOBILE_REPORT || `test-results/mobile/${browserName}.json`);
const required = ['new-purchase', 'prev-bills', 'items', 'parties', 'payments'];
const allRoutes = ['sales-list', ...required, 'purchase-list', 'pur-bulk', 'pur-pay', 'txn-log', 'excel-connect', 'audit-log', 'learn', 'github-guide'];
const results = [];
let browser, server, origin;

async function ready(page) {
  await page.waitForFunction(() => window.XLAppReady === true && typeof nav === 'function');
}
async function raw(page) {
  return page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith('shop4_') || k.startsWith('v8_')).sort().map(k => [k, localStorage.getItem(k)])));
}
async function home(page) {
  await page.locator('.mn-item[data-mpg="dashboard"]').tap();
  await page.locator('#page-dashboard').waitFor({state: 'visible'});
}
async function run(id, width, body, touch = true) {
  let context;
  const started = Date.now();
  try {
    context = await browser.newContext({viewport: {width, height: 844}, hasTouch: touch, timezoneId: 'Asia/Kolkata'});
    await context.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    page.on('dialog', dialog => dialog.accept());
    await page.goto(origin);
    await ready(page);
    await page.evaluate(data => {
      localStorage.clear();
      for (const [key, value] of Object.entries(data)) localStorage.setItem('shop4_' + key, JSON.stringify(value));
    }, shop(2));
    await page.reload();
    await ready(page);
    const observations = await body(page);
    results.push({id, width, status: 'PASS', observations, duration_ms: Date.now() - started});
    console.log('PASS ' + id);
  } catch (error) {
    const status = error.code === 'ERR_ASSERTION' ? 'FAIL' : 'HARNESS_ERROR';
    results.push({id, width, status, error: error.message, duration_ms: Date.now() - started});
    console.log(status + ' ' + id + ': ' + error.message);
  } finally {
    await context?.close();
  }
}
async function requireShortcuts(page) {
  assert.equal(await page.locator('.mobile-workflows').isVisible(), true, 'Home must expose mobile workflow shortcuts.');
}
async function main() {
  server = http.createServer((request, response) => {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(source);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  browser = await engines[browserName].launch({headless: true});
  await run('mobile-real-touch-routes-390', 390, async page => {
    await requireShortcuts(page);
    const before = await raw(page), reached = [];
    for (const route of allRoutes) {
      const button = page.locator(`.mobile-workflows button[data-mobile-workflow="${route}"]`);
      assert.equal(await button.isVisible(), true, 'Discoverable route: ' + route);
      const bounds = await button.boundingBox();
      assert.ok(bounds.height >= 44 && bounds.width >= 44, 'Touch target: ' + route);
      await button.tap();
      assert.equal(await page.locator('#page-' + route).isVisible(), true, 'Touch opened route: ' + route);
      reached.push(route);
      await home(page);
    }
    assert.deepEqual(await raw(page), before, 'Navigation must preserve business records.');
    return {reached, touch_targets_minimum_px: 44, business_bytes_preserved: true};
  });
  await run('mobile-payment-in-and-out-390', 390, async page => {
    await requireShortcuts(page);
    await page.locator('.mobile-workflows button[data-mobile-action="payment-in"]').tap();
    assert.equal(await page.locator('#standalone-pay-modal').isVisible(), true);
    await page.waitForFunction(() => document.activeElement?.id === 'spa-inv-select');
    await page.locator('#spa-inv-select').selectOption('s0');
    await page.locator('#spa-amount').fill('5');
    await page.locator('#standalone-pay-modal button[onclick="saveStandalonePayment()"]').tap();
    await page.waitForFunction(() => !XLStore.isBusy());
    const invoice = await page.evaluate(() => getInvoices().find(i => i.id === 's0'));
    assert.equal(invoice.paid, 25);
    assert.equal(invoice.balance, 75);
    await page.locator('.mobile-workflows button[data-mobile-action="payment-out"]').tap();
    assert.equal(await page.locator('#pay-out-modal').isVisible(), true);
    await page.waitForFunction(() => document.activeElement?.id === 'pout-party');
    await page.locator('#pout-party').fill('Synthetic Supplier');
    await page.locator('#ac-pout-party .ac-item').first().tap();
    await page.locator('#pout-amount').fill('10');
    await page.locator('#pay-out-modal button[onclick="savePoutPayment()"]').tap();
    await page.waitForFunction(() => !XLStore.isBusy());
    const purchase = await page.evaluate(() => getPurchases().find(p => p.id === 'u1'));
    assert.equal(purchase.paid, 30);
    assert.equal(purchase.balance, 470);
    return {invoice_paid: invoice.paid, invoice_due: invoice.balance, purchase_paid: purchase.paid, purchase_due: purchase.balance};
  });
  await run('mobile-keyboard-navigation-390', 390, async page => {
    await requireShortcuts(page);
    const before = await raw(page);
    const purchase = page.locator('.mobile-workflows button[data-mobile-workflow="new-purchase"]');
    await purchase.focus();
    await purchase.press('Enter');
    assert.equal(await page.locator('#page-new-purchase').isVisible(), true);
    const homeButton = page.locator('.mn-item[data-mpg="dashboard"]');
    assert.equal(await homeButton.evaluate(node => node.tagName), 'BUTTON');
    await homeButton.focus();
    await homeButton.press('Enter');
    assert.equal(await homeButton.getAttribute('aria-current'), 'page');
    const items = page.locator('.mobile-workflows button[data-mobile-workflow="items"]');
    await items.focus();
    await items.press('Space');
    assert.equal(await page.locator('#page-items').isVisible(), true);
    assert.deepEqual(await raw(page), before);
    return {enter_route: 'new-purchase', space_route: 'items', primary_controls: 'native buttons', business_bytes_preserved: true};
  }, false);
  await run('mobile-navigation-layout-320', 320, async page => {
    await requireShortcuts(page);
    const layout = await page.locator('.mobile-workflows').evaluate(panel => {
      const controls = [...panel.querySelectorAll('button')].map(button => {
        const bounds = button.getBoundingClientRect();
        return {label: button.textContent.trim(), left: bounds.left, right: bounds.right, width: bounds.width, height: bounds.height};
      });
      return {viewport: innerWidth, panel_width: panel.clientWidth, panel_scroll_width: panel.scrollWidth, controls};
    });
    assert.ok(layout.panel_scroll_width <= layout.panel_width, 'Shortcut panel must not overflow horizontally.');
    for (const control of layout.controls) assert.ok(control.left >= 0 && control.right <= layout.viewport && control.height >= 44, 'Visible touch target within viewport: ' + control.label);
    await page.locator('.mobile-workflows button[data-mobile-workflow="payments"]').tap();
    assert.equal(await page.locator('#page-payments').isVisible(), true);
    return layout;
  });
  await run('desktop-navigation-1366', 1366, async page => {
    assert.equal(await page.locator('.mobile-workflows').isVisible(), false, 'Shortcuts are mobile-only.');
    assert.equal(await page.locator('.mnav').isVisible(), false);
    for (const route of required) {
      const link = page.locator(`a.nl[data-pg="${route}"]`);
      assert.equal(await link.isVisible(), true);
      await link.click();
      assert.equal(await page.locator('#page-' + route).isVisible(), true);
    }
    return {desktop_sidebar_preserved: true, reached: required};
  }, false);
}
main().catch(error => results.push({id: 'runner', status: 'HARNESS_ERROR', error: error.message})).finally(async () => {
  await browser?.close();
  await new Promise(resolve => server ? server.close(resolve) : resolve());
  const summary = {pass: results.filter(r => r.status === 'PASS').length, fail: results.filter(r => r.status === 'FAIL').length, harness_errors: results.filter(r => r.status === 'HARNESS_ERROR').length};
  fs.mkdirSync(path.dirname(output), {recursive: true});
  fs.writeFileSync(output, JSON.stringify({browser: browserName, source_sha256: crypto.createHash('sha256').update(source).digest('hex'), tested_commit: cp.execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(), synthetic_only: true, summary, results}, null, 2) + '\n');
  console.log('Mobile gate: ' + JSON.stringify(summary));
  process.exitCode = summary.harness_errors ? 2 : summary.fail ? 1 : 0;
});
