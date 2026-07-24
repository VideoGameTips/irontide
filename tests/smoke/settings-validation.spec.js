const { test, expect } = require('@playwright/test');
const GAME = 'http://localhost:3000/';

async function bootWith(page, blob) {
  await page.addInitScript(b => {
    try { localStorage.setItem('ironTideSettings', b); } catch (e) {}
  }, blob);
  await page.goto(GAME);
  await page.waitForFunction(() => typeof startGame === 'function');
  return page.evaluate(() => ({ SETTINGS: { ...SETTINGS }, gameSettings: { ...gameSettings } }));
}

test('corrupt settings fall back to defaults instead of poisoning the game', async ({ page }) => {
  const r = await bootWith(page, JSON.stringify({
    volume: 'loud', simpleHud: {}, contentFilter: 'yes',
    combatFeedback: 1, damageNumbers: null, cameraShake: 'on', pauseInArmory: [],
    evilExtraKey: 'should be ignored',
  }));
  expect(r.SETTINGS.volume).toBe(1);            // 'loud' rejected
  expect(r.SETTINGS.simpleHud).toBe(null);      // {} rejected
  expect(r.SETTINGS.contentFilter).toBe(false); // 'yes' rejected
  expect(r.gameSettings.combatFeedback).toBe(true);   // 1 rejected
  expect(r.gameSettings.damageNumbers).toBe(false);   // null rejected
  expect(r.gameSettings.cameraShake).toBe(true);      // 'on' rejected
  expect(r.gameSettings.pauseInArmory).toBe(false);   // [] rejected
  expect('evilExtraKey' in r.SETTINGS).toBe(false);
});

test('valid settings still round-trip, and volume is clamped', async ({ page }) => {
  const r = await bootWith(page, JSON.stringify({
    volume: 0.42, simpleHud: true, contentFilter: true, pauseInArmory: true, cameraShake: false,
  }));
  expect(r.SETTINGS.volume).toBeCloseTo(0.42);
  expect(r.SETTINGS.simpleHud).toBe(true);
  expect(r.SETTINGS.contentFilter).toBe(true);
  expect(r.gameSettings.pauseInArmory).toBe(true);
  expect(r.gameSettings.cameraShake).toBe(false);

  const clamped = await bootWith(page, JSON.stringify({ volume: 99 }));
  expect(clamped.SETTINGS.volume).toBe(1);
});

test('garbage that is not even an object is survived', async ({ page }) => {
  for (const junk of ['not json at all', '[1,2,3]', 'null', '"a string"']) {
    const r = await bootWith(page, junk);
    expect(r.SETTINGS.volume).toBe(1);
    expect(r.gameSettings.cameraShake).toBe(true);
  }
});

test('a save written now carries the version stamp', async ({ page }) => {
  await bootWith(page, '{}');
  const stamped = await page.evaluate(() => {
    SETTINGS.volume = 0.5; saveSettings();
    return JSON.parse(localStorage.getItem('ironTideSettings'));
  });
  expect(stamped.sv).toBe(1);
  expect(stamped.volume).toBe(0.5);
});
