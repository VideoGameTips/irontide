const { test, expect } = require('@playwright/test');

// WHY THIS TEST WAITS ON THE AUDIO CLOCK RATHER THAN ON WALL TIME
// _ramp() drives every ambience gain with setTargetAtTime(v, now, 0.15) — an exponential
// approach measured in AudioContext time, not in wall time. A headless browser has no audio
// device, so its audio clock crawls: measured here, 400 ms of wall time advanced
// ctx.currentTime by 0.07 s. The original fixed 150 ms sleep therefore read the gain before
// the ramp had moved at all and saw a flat 0, failing on a perfectly healthy sea.
//
// So: drive the frames, then wait until the AUDIO clock has actually advanced far enough for
// the ramp to have gone somewhere, with a wall-clock deadline so a truly suspended context
// fails loudly instead of hanging.
const RAMP_TAU = 0.15;
const SETTLE_AUDIO_SECS = RAMP_TAU * 1.7;   // ~81% of the way to target — enough to compare

test('the sea is audible, rises with sea state, and the bow wash follows speed', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(async ({ settleSecs }) => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    sfxResume();
    startGame('battleship'); skipBanner();
    if (!SFX.seaGain) return { built: false };

    // Wait for `secs` of AUDIO time to pass. Returns how much actually did, so the test can
    // tell "the sea is silent" apart from "the clock never moved".
    const audioAdvance = async (secs) => {
      const t0 = SFX.ctx.currentTime, deadline = Date.now() + 10000;
      while (SFX.ctx.currentTime - t0 < secs && Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 40));
      }
      return SFX.ctx.currentTime - t0;
    };
    let advanced = Infinity;
    const settle = async (n) => {
      for(let i=0;i<n;i++){ t2+=0.05; update(0.05,t2); sfxEngine(); }
      advanced = Math.min(advanced, await audioAdvance(settleSecs));
    };
    const read = () => ({ sea: SFX.seaGain.gain.value, wash: SFX.washGain.gain.value });

    weather.sea = 1; keys['KeyW']=0; await settle(40);
    const calmStopped = read();
    keys['KeyW']=1; await settle(60);
    const calmUnderway = read();
    weather.sea = 3; await settle(40);
    const heavy = read();
    keys['KeyW']=0;
    return { built: true, ctxState: SFX.ctx.state, advanced, calmStopped, calmUnderway, heavy };
  }, { settleSecs: SETTLE_AUDIO_SECS });

  expect(r.built).toBe(true);
  // If this fails the browser gave us no audio clock at all, and every gain below is a zero
  // that means nothing — say so rather than reporting a silent ocean.
  expect(r.advanced, `the audio clock barely moved (ctx ${r.ctxState}) — nothing below is measurable`)
    .toBeGreaterThanOrEqual(SETTLE_AUDIO_SECS);
  expect(r.calmStopped.sea).toBeGreaterThan(0);                   // the sea is always there
  expect(r.calmStopped.wash).toBeLessThan(r.calmUnderway.wash);   // bow wash opens up with way on
  expect(r.heavy.sea).toBeGreaterThan(r.calmUnderway.sea);        // heavier sea, louder swell
});
