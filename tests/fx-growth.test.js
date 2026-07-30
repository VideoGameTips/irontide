const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Effect sprites grow with `scale.multiplyScalar(1 + dt*growRate)` — COMPOUND. That is harmless
// for a puff that lives a second and catastrophic for one that lives ten: a ship-smoke sprite at
// growRate 2.4 over 6.4 s reaches e^15.4, about 4.7 MILLION times its original size, and a single
// one of those covers the whole screen. It looked like "the smoke blocks too much view".
// Any effect whose unbounded growth exceeds a sane multiple must declare a maxScale ceiling.
test('no growing effect can run away in scale', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const offenders = [];
  for (const m of src.matchAll(/fx\.push\(\{[^}]*?grow:true[^}]*?\}\)/gs)) {
    const body = m[0];
    const gr = body.match(/growRate:([0-9.]+)(?:\s*\+\s*Math\.random\(\)\s*\*\s*([0-9.]+))?/);
    const lf = body.match(/life:([0-9.]+)(?:\s*\+\s*Math\.random\(\)\s*\*\s*([0-9.]+))?/);
    if (!gr || !lf) continue;
    const rate = parseFloat(gr[1]) + (gr[2] ? parseFloat(gr[2]) : 0);
    const life = parseFloat(lf[1]) + (lf[2] ? parseFloat(lf[2]) : 0);
    const mult = Math.exp(rate * life);
    if (mult > 400 && !/maxScale/.test(body)) {
      offenders.push(`life ${life}s x growRate ${rate} = ${Math.round(mult).toLocaleString()}x, no maxScale`);
    }
  }
  assert.deepStrictEqual(offenders, [], 'runaway growth:\n  ' + offenders.join('\n  '));
});
