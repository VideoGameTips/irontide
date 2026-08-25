const { test, expect } = require('@playwright/test');

// Flipping a default is where you silently break a promise made to a real person.
// Three storage states, all three checked.
const CASES = [
  { name: 'never told (new player)', stored: null, wantConsent: null, wantHandshakeAttempt: true },
  { name: 'said no under opt-in',    stored: '0',  wantConsent: false, wantHandshakeAttempt: false },
  { name: 'said yes under opt-in',   stored: '1',  wantConsent: true,  wantHandshakeAttempt: true },
];

for (const c of CASES) {
  test(`existing state: ${c.name}`, async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForFunction(() => typeof LB !== 'undefined');
    const r = await page.evaluate((c) => {
      const b = document.getElementById('storyBtn'), s = document.getElementById('story');
      if (b && s && s.style.display === 'flex') b.click();
      localStorage.removeItem('ironTideLbConsent');
      if (c.stored !== null) localStorage.setItem('ironTideLbConsent', c.stored);
      lbLoad();

      // Did it even TRY to reach the server? No server here, so watch the call instead
      // of the result — that is the thing the default actually controls.
      // lbStartRun is async and the handshake fires AFTER an await, so the probe has to
      // outlive the synchronous part of startGame or it always reads false.
      window.__attempted = false;
      const realFetch = window.fetch;
      window.fetch = (u, o) => { if (String(u).includes('/run/start')) window.__attempted = true; return realFetch(u, o); };
      startGame('destroyer'); skipBanner();
      return new Promise(res => setTimeout(() => {
        window.fetch = realFetch;
        res({ consent: LB.consent, attempted: window.__attempted });
      }, 500));
    }, c);
    expect(r.consent).toBe(c.wantConsent);
    expect(r.attempted).toBe(c.wantHandshakeAttempt);
  });
}
