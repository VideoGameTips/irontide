// ===== ISLAND TERRAIN GEOMETRY — pure functions, no game state =====
// Extracted from index.html so this math is independently unit-testable (see tests/terrain.test.js)
// and so Wave-B terrain work (ship grounding, plane/tank collision) has one clear home.
//
// Every function here takes plain data: a pos {x,z} and an island shape
// {pos:{x,z}, rx, rz, angle, r, seed}. In the browser this file loads after
// vendor/three.min.js (for THREE.Vector3) and before the main inline <script>;
// tests load it in Node with a minimal THREE.Vector3 stub instead.

function islandLocal(pos,o){
  const dx=pos.x-o.pos.x,dz=pos.z-o.pos.z,a=o.angle||0,c=Math.cos(a),s=Math.sin(a);
  return {x:c*dx-s*dz,z:s*dx+c*dz};
}
function islandWorld(o,x,z){
  const a=o.angle||0,c=Math.cos(a),s=Math.sin(a);
  return new THREE.Vector3(o.pos.x+c*x+s*z,o.pos.y||0,o.pos.z-s*x+c*z);
}
function islandNorm(pos,o,pad=0){
  const q=islandLocal(pos,o),rx=(o.rx||o.r)+pad,rz=(o.rz||o.r)+pad;
  return Math.hypot(q.x/rx,q.z/rz);
}
function insideIslandRange(pos,o,pad=0){ return islandNorm(pos,o,pad)<1; }
function islandEdgeDistance(pos,o){
  const q=islandLocal(pos,o),d=Math.hypot(q.x,q.z); if(d<0.001)return -Math.min(o.rx||o.r,o.rz||o.r);
  const n=islandNorm(pos,o); return d-d/n;
}
// analytic terrain height — mirrors islandGeometry()'s edge-noise layers (beach/grass/mound) without touching a mesh
function islandEdgeMul(a,seed){ return 1+Math.sin(a*3+seed)*0.105+Math.sin(a*5-seed*1.7)*0.055+Math.sin(a*7+seed*0.4)*0.025; }
function islandLayerNorm(q,o,mul,seedOff){
  const rx=(o.rx||o.r)*mul, rz=(o.rz||o.r)*mul, seed=o.seed||0;
  const a=Math.atan2(q.z/rz,q.x/rx), edge=islandEdgeMul(a,seed+seedOff);
  return Math.hypot(q.x/(rx*edge),q.z/(rz*edge));
}
function islandSurfaceY(pos,o){    // null = open water at this (x,z); otherwise the terrain top height there
  if(!o) return null;
  const q=islandLocal(pos,o);
  if(o.r>30 && islandLayerNorm(q,o,0.43,0.5)<1) return 3.8;   // central jungle mound
  if(islandLayerNorm(q,o,0.84,0.15)<1) return 2.1;            // grass table
  if(islandLayerNorm(q,o,1,0)<1) return 1.3;                  // beach
  return null;
}
function islandPoint(o,a,f=1,y=0){
  const p=islandWorld(o,Math.cos(a)*(o.rx||o.r)*f,Math.sin(a)*(o.rz||o.r)*f); p.y=y; return p;
}

// Node test harness support: when required as a CommonJS module, export the same
// functions instead of relying on them leaking onto a global (browser <script> tags
// have no module system, so this block is a no-op there).
if(typeof module!=='undefined' && module.exports){
  module.exports={ islandLocal, islandWorld, islandNorm, insideIslandRange, islandEdgeDistance,
    islandEdgeMul, islandLayerNorm, islandSurfaceY, islandPoint };
}
