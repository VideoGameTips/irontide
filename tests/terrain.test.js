'use strict';
// Unit tests for js/terrain.js — pure island-geometry math, no browser/THREE renderer needed.
// Run with: node --test tests/   (Node's built-in test runner, zero extra dependencies)

const test = require('node:test');
const assert = require('node:assert/strict');

// Minimal THREE.Vector3 stand-in: terrain.js only ever constructs one and sets x/y/z on it.
class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  clone() { return new Vector3(this.x, this.y, this.z); }
  setY(y) { this.y = y; return this; }
}
global.THREE = { Vector3 };

const {
  islandLocal, islandWorld, islandNorm, insideIslandRange, islandEdgeDistance,
  islandEdgeMul, islandLayerNorm, islandSurfaceY, islandPoint, groundedCorrection,
} = require('../js/terrain.js');

// A big island (r>30, so it has all three terrain layers) with a non-zero rotation,
// matching the shapes buildIsland() actually produces.
const BIG_ISLAND = { pos: { x: 100, z: -200 }, r: 260, rx: 300, rz: 250, angle: 0.4, seed: 7.3 };
// A small island (r<=30) — the central jungle-mound layer must NOT apply here.
const SMALL_ISLAND = { pos: { x: 0, z: 0 }, r: 20, rx: 22, rz: 20, angle: 0, seed: 2.1 };

test('islandLocal: angle=0 is a plain translation (no rotation)', () => {
  const o = { pos: { x: 10, z: 5 }, angle: 0 };
  const q = islandLocal({ x: 13, z: 9 }, o);
  assert.equal(q.x, 3);
  assert.equal(q.z, 4);
});

test('islandLocal/islandWorld round-trip through a rotated island', () => {
  const o = BIG_ISLAND;
  const localPt = { x: 42, z: -17 };
  const world = islandWorld(o, localPt.x, localPt.z);
  const back = islandLocal(world, o);
  assert.ok(Math.abs(back.x - localPt.x) < 1e-9, `x round-trip: ${back.x} vs ${localPt.x}`);
  assert.ok(Math.abs(back.z - localPt.z) < 1e-9, `z round-trip: ${back.z} vs ${localPt.z}`);
});

test('islandNorm/insideIslandRange: center is inside, far away is not', () => {
  const o = BIG_ISLAND;
  assert.equal(islandNorm(o.pos, o), 0);
  assert.ok(insideIslandRange(o.pos, o));
  const farAway = { x: o.pos.x + 5000, z: o.pos.z + 5000 };
  assert.ok(!insideIslandRange(farAway, o));
});

test('insideIslandRange: pad widens the membership radius', () => {
  const o = { pos: { x: 0, z: 0 }, r: 100, rx: 100, rz: 100, angle: 0 };
  const justOutside = { x: 105, z: 0 };   // norm = 1.05, outside with pad=0
  assert.ok(!insideIslandRange(justOutside, o, 0));
  assert.ok(insideIslandRange(justOutside, o, 8));   // but within an 8-unit pad
});

test('islandEdgeDistance: negative deep inside, ~0 at the edge, positive outside', () => {
  const o = { pos: { x: 0, z: 0 }, r: 100, rx: 100, rz: 100, angle: 0 };
  assert.equal(islandEdgeDistance(o.pos, o), -100);           // dead center
  assert.ok(Math.abs(islandEdgeDistance({ x: 100, z: 0 }, o)) < 1e-6);   // exactly on the nominal edge
  assert.ok(islandEdgeDistance({ x: 150, z: 0 }, o) > 0);      // outside
});

test('islandEdgeMul: noise stays within its designed +/-18.5% envelope', () => {
  for (let seed = 0; seed < 20; seed += 0.37) {
    for (let a = 0; a < Math.PI * 2; a += 0.2) {
      const m = islandEdgeMul(a, seed);
      assert.ok(m >= 1 - 0.185 - 1e-9 && m <= 1 + 0.185 + 1e-9, `edge mul ${m} out of envelope (a=${a}, seed=${seed})`);
    }
  }
});

test('islandSurfaceY: layered heights on a big island (center -> mound -> table -> beach -> water)', () => {
  const o = BIG_ISLAND;
  assert.equal(islandSurfaceY(o.pos, o), 3.8);                                        // dead center: central mound
  assert.equal(islandSurfaceY(islandPoint(o, 0, 0.3, 0.7), o), 3.8);                  // well inside the mound radius
  assert.equal(islandSurfaceY(islandPoint(o, 0, 0.6, 0.7), o), 2.1);                  // between mound and beach: grass table
  assert.equal(islandSurfaceY(islandPoint(o, 0, 0.95, 0.7), o), 1.3);                 // near the outer edge: beach
  assert.equal(islandSurfaceY(islandPoint(o, 0, 1.3, 0.7), o), null);                 // clearly out at sea
});

test('islandSurfaceY: small islands (r<=30) have no central mound layer', () => {
  const o = SMALL_ISLAND;
  const center = islandSurfaceY(o.pos, o);
  assert.notEqual(center, 3.8, 'a small island must never report the tall mound height');
  assert.ok(center === 1.3 || center === 2.1, `expected beach or grass at center of a small island, got ${center}`);
});

test('regression: a point just past the nominal edge is NOT on the landmass, even within the old padded range', () => {
  // This is the exact shape of the spawnIsl bug from Wave A: islandOfPos(pos,i,8) (a padded
  // proximity check) would say "yes, near this island" for a shell fired from just offshore,
  // but islandSurfaceY (used for the exemption) must say "no, this is open water" —
  // otherwise a near-shore shot silently inherits an exemption it should never get.
  const o = { pos: { x: 0, z: 0 }, r: 260, rx: 260, rz: 260, angle: 0, seed: 0 };
  const justOutside = islandPoint(o, 0, 1.02, 0.7);   // 2% beyond the nominal radius — within an 8-unit pad for r=260
  assert.equal(islandSurfaceY(justOutside, o), null);
});

test('islandPoint: lands at the expected distance from the island center along an axis', () => {
  const o = { pos: { x: 0, z: 0 }, r: 100, rx: 100, rz: 100, angle: 0 };
  const p = islandPoint(o, 0, 0.5, 3);
  const d = Math.hypot(p.x - o.pos.x, p.z - o.pos.z);
  assert.ok(Math.abs(d - 50) < 1e-6, `expected distance 50, got ${d}`);
  assert.equal(p.y, 3);
});

// ---- groundedCorrection (keepOffIslands' pure core — Wave B ship-bow-grounding fix) ----

test('groundedCorrection: no obstacles nearby -> zero correction', () => {
  const o = { pos: { x: 1000, z: 1000 }, r: 100, rx: 100, rz: 100, angle: 0 };
  const r = groundedCorrection([{ x: 0, z: 0 }], [o], 4);
  assert.equal(r.grounded, false);
  assert.equal(r.dx, 0);
  assert.equal(r.dz, 0);
});

test('groundedCorrection: a single center sample matches the old single-point clamp exactly', () => {
  const o = { pos: { x: 0, z: 0 }, r: 100, rx: 100, rz: 100, angle: 0 };
  const start = { x: 50, z: 0 };   // well inside the r=100 island
  const r = groundedCorrection([start], [o], 4);
  assert.equal(r.grounded, true);
  const correctedX = start.x + r.dx, correctedZ = start.z + r.dz;
  // must land exactly on the padded boundary (r+margin=104) along the same ray from center
  assert.ok(Math.abs(Math.hypot(correctedX, correctedZ) - 104) < 1e-6);
});

test('groundedCorrection: bow sample grounds the ship even though its center is clear', () => {
  const o = { pos: { x: 100, z: 0 }, r: 30, rx: 30, rz: 30, angle: 0 };
  const center = { x: 0, z: 0 };                 // 100 units from the island center — nowhere near it
  const bow = { x: 75, z: 0 };                   // but the bow, 75 units out along the heading, is INSIDE the island (r=30 around x=100 means it spans 70-130)
  const r = groundedCorrection([center, bow], [o], 4);
  assert.equal(r.grounded, true, 'a submerged bow must ground the ship even though the hull center is in open water');
  assert.ok(r.dx < 0, 'correction should push back away from the island (negative x)');
});

test('groundedCorrection: clear samples produce no correction', () => {
  const o = { pos: { x: 100, z: 0 }, r: 30, rx: 30, rz: 30, angle: 0 };
  const center = { x: 0, z: 0 }, bow = { x: 20, z: 0 }, stern = { x: -20, z: 0 };   // all well clear of the island at x=100±34
  const r = groundedCorrection([center, bow, stern], [o], 4);
  assert.equal(r.grounded, false);
  assert.equal(r.dx, 0);
  assert.equal(r.dz, 0);
});
