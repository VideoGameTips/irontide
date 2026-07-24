const { test, expect } = require('@playwright/test');

async function probe(page, { url = 'http://localhost:3000/', hasTouch = false } = {}) {
  await page.goto(url);
  await page.waitForFunction(() => typeof touchCapable === 'function');
  return page.evaluate(() => ({
    capable: touchCapable(),
    coarse: matchMedia('(pointer:coarse)').matches,
    fine: matchMedia('(pointer:fine)').matches,
    maxTouchPoints: navigator.maxTouchPoints,
    cls: document.body.className,
  }));
}

test('a mouse-driven desktop is not treated as touch, even in a narrow window', async ({ page }) => {
  await page.setViewportSize({ width: 700, height: 800 });   // narrower than the old 820 cutoff
  const r = await probe(page);
  expect(r.fine).toBe(true);
  expect(r.capable).toBe(false);          // used to be true purely because the window was narrow
});

test('a touchscreen laptop driven by a mouse keeps full resolution and mouse-look', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 10 });   // Surface / touchscreen Chromebook
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  const r = await probe(page);
  expect(r.maxTouchPoints).toBe(10);
  expect(r.fine).toBe(true);              // a real mouse is present
  expect(r.capable).toBe(false);          // the digitiser alone must not flip it
});

test('?touch=1 forces the controls on, and sets the CSS escape hatch', async ({ page }) => {
  const r = await probe(page, { url: 'http://localhost:3000/?touch=1' });
  expect(r.capable).toBe(true);
  expect(r.cls).toContain('touch-forced');   // the rule existed but nothing ever set this
  expect(r.cls).toContain('touch-ready');
});

test('?touch=0 forces it off', async ({ page }) => {
  const r = await probe(page, { url: 'http://localhost:3000/?touch=0' });
  expect(r.capable).toBe(false);
});
