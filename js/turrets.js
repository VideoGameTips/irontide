// ===== 炮塔部件与外观 =====
//
// 从 index.html 抽出来的一整节：各类炮塔的几何构建与皮肤。段内只有一个 `_smoothSkins={}`
// 缓存和一堆函数，没有任何在加载时调用主脚本的初始化——这是它能安全前置加载的原因。
// 普通 <script>，共享全局作用域，无构建步骤（同 js/terrain.js）。

// ===== TURRET PARTS ==================================================================
// Every gun and cannon in the game used to come out of one branch: a box with N cylinders
// through it. A 16-inch Mk 7 and an M2 Browning were the same mesh at different scales.
// These are the pieces real naval mounts are actually made of, so the archetypes below can be
// assembled from them instead of re-describing a box each time.
//
// Budget: measured at 139 turret meshes across a 42-ship battle whose scene holds ~10,500, so
// turrets were 1.3% of it. That headroom is why these can be detailed without an LOD split —
// the player's gun and the AI's are the same model, which is one less thing to drift.

// A gun barrel is not a tube: it is thick at the breech, tapers toward the muzzle, and wears a
// reinforcing band at the lip. Returned lying along +Z, root at the origin.
function navalGunBarrel(len, rBreech, rMuzzle, mat, jacket){
  const b=new THREE.Group();
  // ONE lathed profile instead of a stack of cylinders — a real gun outline in a single mesh:
  // breech swell, a step down to the chase, a long taper, the reinforcing band at the muzzle and
  // the counterbore at the lip. This is both better looking AND cheaper than the tube+ring it
  // replaces, which is what paid for the extra detail everywhere else in this pass.
  const P=(r,t)=>new THREE.Vector2(Math.max(0.0001,r), t*len);
  const geo=new THREE.LatheGeometry([
    P(0,0), P(rBreech*1.42,0), P(rBreech*1.42,0.085), P(rBreech*1.08,0.125),
    P(rBreech,0.17), P(rMuzzle*1.04,0.855), P(rMuzzle*1.34,0.885), P(rMuzzle*1.34,0.945),
    P(rMuzzle*1.03,0.96), P(rMuzzle*1.03,1.0), P(rMuzzle*0.60,1.0)
  ], 18);
  geo.rotateX(Math.PI/2);            // lathe spins around +Y; the gun points down +Z
  geo.computeVertexNormals();
  const tube=new THREE.Mesh(geo, mat); tube.castShadow=true; b.add(tube);
  // a water-cooling jacket is what makes a light automatic weapon read as one at a glance
  if(jacket){ const jk=mkCyl(rBreech*1.30, rBreech*1.30, len*0.40, GUNSTEEL(0x7f878f), 14);
    jk.rotation.x=Math.PI/2; jk.position.z=len*0.32; b.add(jk); }
  return b;
}
// The canvas bloomer sealing the slot where a barrel leaves the turret face. Small, and the
// single most recognisable detail on a WWII naval turret.
function blastBag(r, mat){ const c=mkCyl(r*1.05, r*1.75, r*2.2, mat, 14); c.rotation.x=Math.PI/2; return c; }
// A gunhouse profile drawn side-on and extruded across the beam: near-vertical front plate, a
// sloped upper face, a flat roof and a raked back. That silhouette is the whole difference
// between "turret" and "crate".
function turretHouse(w, h, d, mat){
  const s=new THREE.Shape();
  s.moveTo(-d*0.50, 0);      s.lineTo( d*0.50, 0);
  s.lineTo( d*0.50, h*0.52); s.lineTo( d*0.17, h);
  s.lineTo(-d*0.32, h);      s.lineTo(-d*0.50, h*0.60);
  s.closePath();
  const geo=new THREE.ExtrudeGeometry(s,{depth:w,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:h*0.03,bevelThickness:h*0.03});
  geo.rotateY(Math.PI/2); geo.translate(w*0.5,0,0); geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,mat); mesh.castShadow=mesh.receiveShadow=true; return mesh;
}
// The armoured drum a turret turns on. Real mounts sit ON something.
function barbette(r, h, mat){
  const g=new THREE.Group();
  const drum=mkCyl(r, r*1.06, h, mat, 20); drum.position.y=h*0.5; g.add(drum);
  // With shadows disabled, a hard 90-degree top edge reads as nothing at all. A chamfer gives
  // the barbette one lit rim, which is what tells you it is a cylinder and not a flat disc.
  const rim=mkCyl(r*0.93, r*1.03, h*0.17, mat, 20); rim.position.y=h*0.955; g.add(rim);
  return g;
}
// Open light-AA mounts have a curved splinter shield rather than a roof.
function gunShield(r, h, thick, mat){
  const geo=new THREE.CylinderGeometry(r, r, h, 22, 1, true, -Math.PI*0.31, Math.PI*0.62);
  const mesh=new THREE.Mesh(geo, mat); mesh.material.side=THREE.DoubleSide;
  mesh.castShadow=mesh.receiveShadow=true; return mesh;
}
// A missile is an ogive nose, a parallel body and a tail of fins — three meshes, lathed, so the
// nose is actually pointed rather than a cylinder with a cone stuck on it.
function missileRound(len, r, bodyMat, finMat){
  const g=new THREE.Group();
  const P=(rr,t)=>new THREE.Vector2(Math.max(0.0001,rr), t*len);
  const geo=new THREE.LatheGeometry([
    P(0,0), P(r*0.30,0.03), P(r*0.62,0.08), P(r*0.88,0.15), P(r,0.24),
    P(r,0.86), P(r*0.94,0.95), P(r*0.72,1.0), P(0,1.0)
  ], 14);
  geo.rotateX(-Math.PI/2);            // nose down +Z
  geo.computeVertexNormals();
  const body=new THREE.Mesh(geo, bodyMat); body.castShadow=true; g.add(body);
  for(let i=0;i<2;i++){ const fin=mkBox(i?r*0.28:r*3.0, i?r*3.0:r*0.28, len*0.16, finMat);
    fin.position.z=len*0.08; g.add(fin); }
  return g;
}
// A torpedo tube is a smooth pressure tube with a heavy breech door at the back and a muzzle
// ring at the front. Five of these side by side is a quintuple bank, which is what the game's
// "Quint Torpedo" has always claimed to be while drawing two.
function torpedoTube(len, r, mat){
  const g=new THREE.Group();
  const tube=mkCyl(r, r*1.04, len, mat, 16); tube.rotation.x=Math.PI/2; tube.position.z=len*0.5; g.add(tube);
  const muzzle=mkCyl(r*1.16, r*1.16, len*0.05, mat, 16); muzzle.rotation.x=Math.PI/2; muzzle.position.z=len*0.975; g.add(muzzle);
  const breech=mkCyl(r*1.22, r*1.22, len*0.10, mat, 16); breech.rotation.x=Math.PI/2; breech.position.z=len*0.05; g.add(breech);
  return g;
}
// Roof furniture: sighting hoods and a hatch. Cheap, and it stops a roof reading as a lid.
function turretRoofKit(g, w, d, y, sz, mat){
  for(const sx of [-1,1]){ const hood=mkCyl(0.16*sz,0.19*sz,0.20*sz,mat,8);
    hood.position.set(sx*w*0.33, y+0.09*sz, d*0.06); g.add(hood); }
  const hatch=mkCyl(0.20*sz,0.20*sz,0.06*sz,SILVER(0x6d757d),10); hatch.position.set(0,y+0.03*sz,-d*0.22); g.add(hatch);
}
// Which mount a weapon actually is. Derived, so 29 weapons do not need 29 tags — only the ones
// that are genuinely their own thing (railgun, beam, plasma gatling, rocket rack, Phalanx) carry
// an explicit gfx. Everything else falls out of what the weapon IS: every light AA gun in this
// game is an open shielded mount in reality, and a heavy cannon is a turret with a barbette.
function turretArchetype(def){
  if(def.gfx) return def.gfx;
  if(def.kind==='torpedo') return 'torpedo';
  if(def.kind==='bomb')    return 'mortar';
  // A SAM rides a trainable twin-arm launcher; an anti-ship round lives sealed in a canister
  // and never comes out until it is flying. Same kind, completely different object.
  if(def.kind==='missile') return def.aa ? 'armlaunch' : 'canister';
  if(def.aa)               return 'openaa';
  if(def.kind==='cannon')  return (def.size||1)>=1.3 ? 'capital' : 'dual';
  return 'dual';
}
function buildTurret(def){
  const g=new THREE.Group(); const sz=def.size||1; const m=SILVER(def.col);
  const arch=turretArchetype(def);
  // Light open mounts need a waist-high pedestal. Without it, half-scale guns such
  // as the M2 sit almost flush with the deck and disappear below the walking POV.
  // The pedestal shrinks smoothly as the weapon gets larger, so every gun remains
  // seated on its actual deck/terrain surface rather than being floated upward.
  const pedestalH=arch==='openaa'&&sz<0.9 ? Math.max(0,(0.92-sz)*1.6) : 0;
  if(pedestalH>0){
    const foot=mkCyl(0.62*sz,0.78*sz,0.12*sz,m);foot.position.y=0.06*sz;g.add(foot);
    const post=mkCyl(0.25*sz,0.38*sz,pedestalH,m);post.position.y=0.12*sz+pedestalH*0.5;g.add(post);
    const collar=mkCyl(0.42*sz,0.32*sz,0.14*sz,m);collar.position.y=pedestalH+0.1*sz;g.add(collar);
  }
  // Turrets and open AA bring their own footing — a barbette and a training ring respectively —
  // so only the mounts that don't get the old generic drum under them.
  const OWN_FOOTING=['capital','dual','openaa','torpedo','canister','abl','armlaunch','mortar'];
  if(OWN_FOOTING.indexOf(arch)<0){
    const base=mkCyl(0.7*sz,0.85*sz,0.4*sz,m); base.position.y=pedestalH+0.2*sz; g.add(base);
  }
  const yawG=new THREE.Group(); yawG.position.y=pedestalH+0.4*sz; g.add(yawG); g.userData.yawG=yawG;
  g.userData.pedestalH=pedestalH;
  let housing, pitchG=new THREE.Group();
  if(arch==='torpedo'){
    // A trainable tube BANK, not a box with two pipes. def.tubes says how many: the game has
    // always called one of these a "Quint Torpedo" while drawing two.
    const n=def.tubes||3, tl=2.5*sz, tr=0.19*sz;
    const ring=mkCyl(0.62*sz,0.72*sz,0.20*sz,ARMOURPLATE(def.col),18); ring.position.y=0.10*sz; yawG.add(ring);
    const bed=mkBox(n*0.44*sz+0.2*sz,0.16*sz,tl*0.72,ARMOURPLATE(def.col)); bed.position.set(0,0.30*sz,tl*0.30); yawG.add(bed);
    for(let i=0;i<n;i++){
      const t=torpedoTube(tl, tr, GUNSTEEL(0x8a939b));
      t.position.set((i-(n-1)/2)*0.44*sz, 0.46*sz, 0.05*sz); yawG.add(t);
    }
    // the sighting/training station a torpedoman actually stands at
    const stand=mkBox(0.30*sz,0.42*sz,0.22*sz,GUNSTEEL(0x5c646c)); stand.position.set(0,0.62*sz,-0.52*sz); yawG.add(stand);
    g.userData.barrelLen=tl+0.1*sz;
  } else if(arch==='canister'){
    // The classic anti-ship look: four sealed canisters in an angled frame, fixed elevation.
    // Harpoon and Kh-35 both leave the ship this way — they are shipped, stored and fired from
    // the same box, which is why there is no barrel and no breech to see.
    const ring=mkCyl(0.58*sz,0.68*sz,0.18*sz,ARMOURPLATE(def.col),18); ring.position.y=0.09*sz; yawG.add(ring);
    yawG.add(pitchG); pitchG.position.set(0,0.34*sz,0); pitchG.rotation.x=-0.55;   // canted up, fixed
    const frame=mkBox(1.15*sz,0.10*sz,1.5*sz,GUNSTEEL(0x5f676f)); frame.position.z=0.6*sz; pitchG.add(frame);
    for(let i=0;i<4;i++){
      const cx=((i%2)-0.5)*0.56*sz, cy=(Math.floor(i/2)-0.5)*0.52*sz+0.34*sz;
      const can=mkBox(0.50*sz,0.46*sz,1.55*sz,ARMOURPLATE(0x9aa3ab)); can.position.set(cx,cy,0.66*sz); pitchG.add(can);
      const cap=mkBox(0.44*sz,0.40*sz,0.06*sz,GUNSTEEL(0x2c3238)); cap.position.set(cx,cy,1.45*sz); pitchG.add(cap);
    }
    g.userData.barrelLen=1.7*sz;
  } else if(arch==='abl'){
    // Armoured box launcher: a slab that lies flat and hinges up to shoot. Tomahawk's whole
    // silhouette is that it does NOT look like a gun.
    const ring=mkCyl(0.60*sz,0.70*sz,0.18*sz,ARMOURPLATE(def.col),18); ring.position.y=0.09*sz; yawG.add(ring);
    yawG.add(pitchG); pitchG.position.set(0,0.30*sz,-0.55*sz); pitchG.rotation.x=-0.62;
    const box=mkBox(1.25*sz,0.85*sz,2.2*sz,ARMOURPLATE(def.col)); box.position.z=1.05*sz; pitchG.add(box);
    const lid=mkBox(1.30*sz,0.09*sz,2.24*sz,GUNSTEEL(0x6f7880)); lid.position.set(0,0.47*sz,1.05*sz); pitchG.add(lid);
    for(const sx of [-1,1]){ const hinge=mkCyl(0.09*sz,0.09*sz,0.28*sz,GUNSTEEL(0x4e565e),10);
      hinge.rotation.z=Math.PI/2; hinge.position.set(sx*0.62*sz,0.44*sz,0.05*sz); pitchG.add(hinge); }
    g.userData.barrelLen=2.3*sz;
  } else if(arch==='armlaunch'){
    // Trainable twin-arm launcher over a magazine drum — the standard SAM mount, and you can see
    // the two rounds sitting on the rails waiting to go.
    const drum=mkCyl(0.66*sz,0.76*sz,0.46*sz,ARMOURPLATE(def.col),18); drum.position.y=0.23*sz; yawG.add(drum);
    yawG.add(pitchG); pitchG.position.set(0,0.62*sz,0); pitchG.rotation.x=-0.42;
    const yoke=mkBox(0.95*sz,0.20*sz,0.55*sz,GUNSTEEL(0x5f676f)); pitchG.add(yoke);
    for(const sx of [-1,1]){
      const rail=mkBox(0.10*sz,0.10*sz,1.5*sz,GUNSTEEL(0x7b848c)); rail.position.set(sx*0.30*sz,0.06*sz,0.75*sz); pitchG.add(rail);
      const rnd=missileRound(1.45*sz, 0.115*sz, ARMOURPLATE(0xcfd6dc), GUNSTEEL(0x3c434a));
      rnd.position.set(sx*0.30*sz, 0.21*sz, 0.12*sz); pitchG.add(rnd);
    }
    g.userData.barrelLen=1.7*sz;
  } else if(arch==='mortar'){
    // Baseplate, bipod and a banded tube at a fixed steep angle. A mortar is not a turret.
    const plate=mkCyl(0.72*sz,0.78*sz,0.12*sz,ARMOURPLATE(def.col),16); plate.position.y=0.06*sz; yawG.add(plate);
    yawG.add(pitchG); pitchG.position.set(0,0.18*sz,-0.28*sz); pitchG.rotation.x=-0.95;
    const tube=mkCyl(0.24*sz,0.30*sz,1.7*sz,GUNSTEEL(0x808991),16); tube.rotation.x=Math.PI/2; tube.position.z=0.85*sz; pitchG.add(tube);
    for(let i=0;i<2;i++){ const band=mkCyl(0.33*sz,0.33*sz,0.09*sz,GUNSTEEL(0x5a626a),16);
      band.rotation.x=Math.PI/2; band.position.z=(0.45+i*0.6)*sz; pitchG.add(band); }
    for(const sx of [-1,1]){ const leg=mkBox(0.07*sz,0.90*sz,0.07*sz,GUNSTEEL(0x6b737b));
      leg.position.set(sx*0.34*sz,0.38*sz,0.30*sz); leg.rotation.z=sx*0.30; yawG.add(leg); }
    g.userData.barrelLen=1.8*sz;
  } else if(def.gfx==='ciws'){ // Phalanx — white radome + 6-barrel gatling
    const dome=new THREE.Mesh(new THREE.SphereGeometry(0.7*sz,18,14,0,Math.PI*2,0,Math.PI*0.55), GUNSTEEL(0xeef1f4)); dome.position.y=0.62*sz; yawG.add(dome);
    const collar=mkCyl(0.52*sz,0.62*sz,0.26*sz,SILVER(0xdfe4e8),12); collar.position.y=0.13*sz; yawG.add(collar);
    yawG.add(pitchG); pitchG.position.set(0,0.42*sz,0.45*sz);
    const drum=mkCyl(0.2*sz,0.22*sz,0.55*sz,GUNSTEEL(0x3a4048),16); drum.rotation.x=Math.PI/2; drum.position.z=0.4*sz; pitchG.add(drum);
    for(let i=0;i<6;i++){ const b=mkCyl(0.04*sz,0.04*sz,0.9*sz,GUNSTEEL(0x6a7078),10); b.rotation.x=Math.PI/2; b.position.set(Math.cos(i/6*6.28)*0.1*sz,Math.sin(i/6*6.28)*0.1*sz,0.95*sz); pitchG.add(b); }
    g.userData.barrelLen=1.3*sz;
  } else if(arch==='openaa'){
    // Light automatic AA is an OPEN mount: a curved splinter shield, a gunner's seat behind it,
    // a magazine drum and jacketed barrels. Enclosing these in a box was what made an Oerlikon
    // and a 16-inch battery read as the same object.
    const shield=gunShield(0.74*sz, 0.72*sz, 0.05*sz, GUNSTEEL(0x99a2ab)); shield.position.set(0,0.56*sz,0.30*sz); yawG.add(shield);
    const ring=mkCyl(0.5*sz,0.56*sz,0.14*sz,m,12); ring.position.y=0.07*sz; yawG.add(ring);
    const seat=mkBox(0.34*sz,0.08*sz,0.34*sz,SILVER(0x4d545b)); seat.position.set(0,0.44*sz,-0.42*sz); yawG.add(seat);
    const backrest=mkBox(0.34*sz,0.34*sz,0.07*sz,SILVER(0x4d545b)); backrest.position.set(0,0.62*sz,-0.58*sz); yawG.add(backrest);
    yawG.add(pitchG); pitchG.position.set(0,0.62*sz,0.22*sz);
    const cradle=mkBox(0.40*sz,0.26*sz,0.52*sz,SILVER(0x5c646c)); pitchG.add(cradle);
    const nb=def.barrels||1, bl=1.55*sz;
    for(let i=0;i<nb;i++){
      const br=navalGunBarrel(bl, 0.075*sz, 0.05*sz, GUNSTEEL(0x8f979f), true);
      br.position.set((i-(nb-1)/2)*0.26*sz, (nb>2&&i>1?0.2*sz:0), 0.2*sz); pitchG.add(br);
    }
    const mag=mkCyl(0.24*sz,0.24*sz,0.16*sz,SILVER(0x3f464d),10); mag.position.set(0.22*sz,0.24*sz,0.05*sz); pitchG.add(mag);
    g.userData.barrelLen=bl+0.2*sz;
  } else if(arch==='rocket'){
    // A rail rack, not a gun: rows of open rails with the rockets still sitting on them.
    const frame=mkBox(1.5*sz,0.28*sz,0.7*sz,m); frame.position.y=0.3*sz; yawG.add(frame);
    yawG.add(pitchG); pitchG.position.set(0,0.5*sz,0); pitchG.rotation.x=-0.30;
    for(let r=0;r<2;r++) for(let c=0;c<4;c++){
      const rail=mkBox(0.09*sz,0.06*sz,2.3*sz,SILVER(0x6e767e));
      rail.position.set((c-1.5)*0.34*sz, r*0.30*sz, 0.9*sz); pitchG.add(rail);
      const rk=mkCyl(0.10*sz,0.10*sz,1.5*sz,SILVER(0x8a7f66),8); rk.rotation.x=Math.PI/2;
      rk.position.set((c-1.5)*0.34*sz, r*0.30*sz+0.11*sz, 0.85*sz); pitchG.add(rk);
    }
    g.userData.barrelLen=2.2*sz;
  } else if(arch==='rail'){
    // Twin accelerator rails with the capacitor bank stacked behind them, glowing between shots.
    const glow=new THREE.MeshStandardMaterial({color:0x1d5f78,emissive:0x35b6e8,emissiveIntensity:1.0,roughness:.3});
    const body=turretHouse(1.15*sz,0.72*sz,1.35*sz,ARMOURPLATE(def.col)); body.position.set(-0.575*sz,0.06*sz,0); yawG.add(body);
    for(const sx of [-1,1]){ const cap=mkCyl(0.20*sz,0.20*sz,0.8*sz,SILVER(0x39414a),10);
      cap.rotation.z=Math.PI/2; cap.position.set(sx*0.42*sz,0.5*sz,-0.5*sz); yawG.add(cap); }
    yawG.add(pitchG); pitchG.position.set(0,0.66*sz,0.4*sz);
    for(const sx of [-1,1]){ const rail=mkBox(0.13*sz,0.16*sz,3.0*sz,SILVER(0xb9c2ca));
      rail.position.set(sx*0.17*sz,0,1.4*sz); pitchG.add(rail); }
    for(let i=0;i<4;i++){ const ring=mkCyl(0.30*sz,0.30*sz,0.07*sz,glow,10);
      ring.rotation.x=Math.PI/2; ring.position.z=(0.5+i*0.72)*sz; pitchG.add(ring); }
    g.userData.barrelLen=3.0*sz;
  } else if(arch==='beam'){
    // One heavy emitter tube inside focusing coils — no breech, no barrels, no recoil.
    const glow=new THREE.MeshStandardMaterial({color:0x1f6b82,emissive:0x46c9ef,emissiveIntensity:1.1,roughness:.25});
    const body=turretHouse(1.2*sz,0.78*sz,1.3*sz,ARMOURPLATE(def.col)); body.position.set(-0.6*sz,0.06*sz,0); yawG.add(body);
    yawG.add(pitchG); pitchG.position.set(0,0.72*sz,0.35*sz);
    const emitter=mkCyl(0.22*sz,0.30*sz,2.4*sz,GUNSTEEL(0x757f88),18); emitter.rotation.x=Math.PI/2; emitter.position.z=1.2*sz; pitchG.add(emitter);
    for(let i=0;i<3;i++){ const coil=mkCyl(0.40*sz,0.40*sz,0.14*sz,glow,12);
      coil.rotation.x=Math.PI/2; coil.position.z=(0.55+i*0.75)*sz; pitchG.add(coil); }
    const lens=mkCyl(0.19*sz,0.19*sz,0.10*sz,glow,12); lens.rotation.x=Math.PI/2; lens.position.z=2.4*sz; pitchG.add(lens);
    g.userData.barrelLen=2.5*sz;
  } else if(arch==='gatling'){
    // Republic plasma: a spun barrel cluster in a charged cage, in their own electric cyan.
    const glow=new THREE.MeshStandardMaterial({color:0x21707f,emissive:0x4fd4ec,emissiveIntensity:1.05,roughness:.25});
    const body=mkCyl(0.62*sz,0.74*sz,0.52*sz,m,12); body.position.y=0.26*sz; yawG.add(body);
    const yoke=mkBox(1.0*sz,0.5*sz,0.34*sz,SILVER(0x525a62)); yoke.position.set(0,0.62*sz,-0.1*sz); yawG.add(yoke);
    yawG.add(pitchG); pitchG.position.set(0,0.66*sz,0.2*sz);
    const hub=mkCyl(0.26*sz,0.30*sz,0.5*sz,GUNSTEEL(0x3e454c),16); hub.rotation.x=Math.PI/2; hub.position.z=0.25*sz; pitchG.add(hub);
    for(let i=0;i<6;i++){ const a=i/6*6.2832;
      const br=mkCyl(0.055*sz,0.055*sz,1.5*sz,GUNSTEEL(0x8f979f),12); br.rotation.x=Math.PI/2;
      br.position.set(Math.cos(a)*0.16*sz, Math.sin(a)*0.16*sz, 1.05*sz); pitchG.add(br); }
    for(let i=0;i<2;i++){ const coil=mkCyl(0.30*sz,0.30*sz,0.10*sz,glow,10);
      coil.rotation.x=Math.PI/2; coil.position.z=(0.62+i*0.62)*sz; pitchG.add(coil); }
    g.userData.barrelLen=1.9*sz;
  } else { // capital main battery, or an enclosed dual-purpose mount
    const cap=arch==='capital';
    const hw=(cap?1.55:1.05)*sz, hh=(cap?0.95:0.68)*sz, hd=(cap?1.85:1.25)*sz;
    g.add(barbette((cap?0.92:0.66)*sz, pedestalH+0.40*sz, ARMOURPLATE(0x6d757d)));
    const house=turretHouse(hw,hh,hd,ARMOURPLATE(def.col)); house.position.set(-hw*0.5,0.04*sz,0); yawG.add(house);
    turretRoofKit(yawG,hw,hd,hh+0.04*sz,sz,SILVER(0x6d757d));
    // The rangefinder arms out of the turret cheeks are the signature of a main battery.
    if(cap) for(const sx of [-1,1]){
      const arm=mkBox(0.55*sz,0.24*sz,0.30*sz,SILVER(0x5f676f));
      arm.position.set(sx*(hw*0.5+0.24*sz), hh*0.72, -hd*0.16); yawG.add(arm);
      const eye=mkCyl(0.09*sz,0.09*sz,0.10*sz,SILVER(0x1d2830),8);
      eye.rotation.z=Math.PI/2; eye.position.set(sx*(hw*0.5+0.52*sz), hh*0.72, -hd*0.16); yawG.add(eye);
    }
    // A crew has to get up there. Three rungs up the back plate, which is also the one thing that
    // gives the turret a human scale next to a sailor standing on the deck.
    if(cap) for(let i=0;i<3;i++){
      const rung=mkBox(0.34*sz,0.05*sz,0.05*sz,GUNSTEEL(0x878f97));
      rung.position.set(0, hh*(0.26+i*0.24), -hd*0.52); yawG.add(rung);
    }
    yawG.add(pitchG); pitchG.position.set(0, hh*0.56, hd*0.30);
    const nb=def.barrels||1, bl=(cap?3.1:2.0)*sz, spread=(cap?0.46:0.34)*sz;
    for(let i=0;i<nb;i++){
      const x=(i-(nb-1)/2)*spread;
      const br=navalGunBarrel(bl, (cap?0.17:0.115)*sz, (cap?0.12:0.085)*sz, GUNSTEEL(0x9aa0a8), false);
      br.position.set(x,0,0.16*sz); pitchG.add(br);
      const bag=blastBag((cap?0.19:0.13)*sz, turretMat(0x8b8578,'paint',0.95,0.02,true)); bag.position.set(x,0,0.10*sz); pitchG.add(bag);
      // muzzle blast burns the paint off the last foot of a gun; a scorched collar is the
      // cheapest way to say "this has been fired" without a texture per barrel
      const soot=mkCyl((cap?0.135:0.095)*sz,(cap?0.145:0.10)*sz,bl*0.10,GUNSTEEL(0x2f3438),14);
      soot.rotation.x=Math.PI/2; soot.position.set(x,0,0.16*sz+bl*0.93); pitchG.add(soot);
    }
    g.userData.barrelLen=bl+0.2*sz;
  }
  g.userData.pitchG=pitchG; g.userData.def=def;
  return g;
}

function aircraftSkin(col){
  const m=surfaceMaterial(col,'paint',.66,.08);m.envMapIntensity=.7;return m;   // matte painted airframe, not glossy semi-metal
}
// The smooth twin of whatever skin it is handed, cached by colour. A wing or a fin is folded
// panel and stays flat-shaded; a fuselage is a compound curve and must not be. Cloning keeps the
// paint map, roughness, metalness and envMapIntensity and flips one flag.
const _smoothSkins={};
function smoothSkinOf(mat){
  if(!mat||!mat.color||mat.flatShading===false) return mat;
  const k=mat.color.getHex()+':'+mat.roughness+':'+mat.metalness;
  if(!_smoothSkins[k]){ const m=mat.clone(); m.flatShading=false; _smoothSkins[k]=m; }
  return _smoothSkins[k];
}
function aircraftFuselage(length,radius,mat,slender=1,facets=0){
  const L=length/2,r=radius,pts=[
    new THREE.Vector2(.018,-L),new THREE.Vector2(r*.28,-L*.88),new THREE.Vector2(r*.72,-L*.6),
    new THREE.Vector2(r*.98,-L*.22),new THREE.Vector2(r,L*.18),new THREE.Vector2(r*.76,L*.58),
    new THREE.Vector2(r*.36,L*.86),new THREE.Vector2(.012,L)
  ];
  pts.forEach(p=>p.x*=slender);
  // facets>0 = a deliberately angular body: few lathe segments, hard chines, and the FLAT skin
  // kept. A stealth fighter is folded plate, not a curve — smoothing it is the wrong answer.
  const geo=new THREE.LatheGeometry(pts,facets||22);geo.rotateX(Math.PI/2);geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,facets?mat:smoothSkinOf(mat));mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}
function taperAircraftWing(geo,halfSpan,secondary=null){
  // Main wings and the smaller horizontal tailplane each taper against their
  // own span. Keep only a microscopic edge at the tip to avoid WebGL flicker.
  const pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){
    const localSpan=secondary&&pos.getZ(i)<=secondary.startZ?secondary.halfSpan:halfSpan;
    const u=Math.min(1,Math.abs(pos.getX(i))/Math.max(0.001,localSpan));
    const section=Math.max(0.001,Math.pow(Math.max(0,1-u*u),0.72));
    pos.setY(i,pos.getY(i)*section);
  }
  pos.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();
  return geo;
}
function aircraftHalfWing(side,halfSpan,root,tip,sweep,thick,mat){
  const s=new THREE.Shape(),x=side*halfSpan;
  s.moveTo(0,root*.5);s.lineTo(x,tip*.5-sweep);s.lineTo(x,-tip*.5-sweep);s.lineTo(0,-root*.5);s.closePath();
  const geo=new THREE.ExtrudeGeometry(s,{depth:thick,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:Math.min(.07,thick*.32),bevelThickness:Math.min(.05,thick*.25)});
  geo.rotateX(Math.PI/2);geo.translate(0,thick*.5,0);taperAircraftWing(geo,halfSpan);
  const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}
function aircraftWingSet(g,span,root,tip,sweep,thick,mat,z=0,y=0){
  const left=new THREE.Group(),right=new THREE.Group();
  left.position.set(0,y,z);right.position.copy(left.position);
  left.add(aircraftHalfWing(-1,span/2,root,tip,sweep,thick,mat));right.add(aircraftHalfWing(1,span/2,root,tip,sweep,thick,mat));
  g.add(left,right);g.userData.wingL=g.userData.wingL||left;g.userData.wingR=g.userData.wingR||right;
  return [left,right];
}
function aircraftUnifiedAirframe(g,opt,mat){
  const span=opt.span,length=opt.length,fw=opt.fuselageWidth||.38,wingZ=opt.wingZ||0,
    root=opt.root||2,tip=opt.tip||.7,sweep=opt.sweep||0,tailSpan=opt.tailSpan||span*.38,
    tailZ=opt.tailZ==null?-length*.39:opt.tailZ,tailRoot=opt.tailRoot||length*.16,
    tailTip=opt.tailTip||tailRoot*.48,tailSweep=opt.tailSweep||0,thick=opt.thick||.18;
  const right=[
    [0,length*.54],[fw*.34,length*.48],[fw*.84,length*.31],
    [fw,wingZ+root*.5],[span*.5,wingZ+tip*.5-sweep],[span*.5,wingZ-tip*.5-sweep],[fw*.92,wingZ-root*.5],
    [fw*.58,tailZ+tailRoot*.5],[tailSpan*.5,tailZ+tailTip*.5-tailSweep],[tailSpan*.5,tailZ-tailTip*.5-tailSweep],
    [fw*.32,tailZ-tailRoot*.5],[0,-length*.53]
  ];
  const sh=new THREE.Shape();sh.moveTo(right[0][0],right[0][1]);for(let i=1;i<right.length;i++)sh.lineTo(right[i][0],right[i][1]);
  for(let i=right.length-2;i>=1;i--)sh.lineTo(-right[i][0],right[i][1]);sh.closePath();
  const geo=new THREE.ExtrudeGeometry(sh,{depth:thick,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:Math.min(.06,thick*.25),bevelThickness:Math.min(.045,thick*.2)});
  const tailStart=(wingZ-root*.5+tailZ+tailRoot*.5)*.5;
  geo.rotateX(Math.PI/2);geo.translate(0,thick*.5,0);
  taperAircraftWing(geo,span*.5,{halfSpan:tailSpan*.5,startZ:tailStart});
  const body=new THREE.Mesh(geo,mat);body.castShadow=true;body.receiveShadow=true;g.add(body);
  g.userData.wingL=body;g.userData.wingR=body;g.userData.unifiedAirframe=body;return body;
}
function aircraftFin(mat,height,root,tip,sweep,thick=.1){
  const f=aircraftHalfWing(1,height,root,tip,sweep,thick,mat);f.rotation.z=Math.PI/2;return f;
}
function aircraftCanopy(g,x,y,z,sx,sy,sz,glass){
  const c=new THREE.Mesh(new THREE.SphereGeometry(1,24,14),glass);c.scale.set(sx,sy,sz);c.position.set(x,y,z);c.castShadow=true;g.add(c);
  const frame=mkBox(sx*2.05,.045,.055,SILVER(0x20272d));frame.position.set(x,y+sy*.45,z);g.add(frame);
  const cross=mkBox(.045,.055,sz*1.5,SILVER(0x20272d));cross.position.set(x,y+sy*.08,z);g.add(cross);
  return c;
}
function aircraftPropeller(radius,blades,dark,contra=false){
  const pg=new THREE.Group(),sets=contra?2:1;
  for(let set=0;set<sets;set++){const rotor=new THREE.Group();rotor.position.z=set*.12;
    for(let i=0;i<blades;i++){const a=i*Math.PI*2/blades,bs=new THREE.Shape();bs.moveTo(-.055,0);bs.quadraticCurveTo(-.11,radius*.45,-.06,radius*.9);
      bs.quadraticCurveTo(.03,radius,.08,radius*.88);bs.quadraticCurveTo(.12,radius*.4,.055,0);bs.closePath();
      const bg=new THREE.ExtrudeGeometry(bs,{depth:.045,bevelEnabled:true,bevelSegments:2,bevelSize:.018,bevelThickness:.012}),blade=new THREE.Mesh(bg,dark);
      blade.position.z=-.022;blade.rotation.z=a;rotor.add(blade);}
    rotor.rotation.z=set*Math.PI/blades;pg.add(rotor);}
  const hub=new THREE.Mesh(new THREE.SphereGeometry(radius*.15,14,10),SILVER(0xb5bbc0));hub.scale.z=1.45;pg.add(hub);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(radius,32),new THREE.MeshBasicMaterial({color:0x82909a,transparent:true,opacity:.08,side:THREE.DoubleSide,depthWrite:false}));
  pg.add(disc);return pg;
}
// Nothing in the game had wheels. Aircraft spend a lot of their life PARKED on your deck, a few
// metres from where you stand, and an aeroplane resting on its belly is the sort of thing you
// notice immediately without being able to say why. Struts fold up into the wing in flight.
function aircraftLandingGear(g,span,length,shape,mat){
  if(shape==='heli'||shape==='quad') return;      // skids and legs already come with those bodies
  const strutM=SILVER(0x9aa2aa), tyreM=surfaceMaterial(0x1c2024,'paint',.95,.02);
  const legs=[];
  const leg=(x,z,drop,r)=>{
    const pivot=new THREE.Group(); pivot.position.set(x,-.06,z); g.add(pivot);
    const strut=mkCyl(.045,.055,drop,strutM,8); strut.position.y=-drop*.5; pivot.add(strut);
    const hub=mkCyl(.05,.05,r*.55,strutM,8); hub.rotation.z=Math.PI/2; hub.position.y=-drop; pivot.add(hub);
    const tyre=new THREE.Mesh(new THREE.TorusGeometry(r,r*.42,7,14), tyreM);
    tyre.rotation.y=Math.PI/2; tyre.position.y=-drop; pivot.add(tyre);
    legs.push(pivot); return pivot;
  };
  const heavy=shape==='heavyjet'||shape==='heavyprop';
  const mainX=Math.min(span*.20, heavy?2.4:1.35), drop=heavy?.95:.72, r=heavy?.26:.19;
  for(const sx of [-1,1]) leg(sx*mainX, -length*.06, drop, r);
  leg(0, shape==='wing'?length*.22:length*.34, drop*.92, r*.78);      // nose leg
  g.userData.gear=legs;
}
// Down when the wheels have any business being down — parked, taxiing, taking off, landing, or
// simply close enough to the deck that they would be. Folded outward and up otherwise.
function setAircraftGear(group, down){
  const legs=group.userData.gear; if(!legs) return;
  const t=group.userData._gearT==null ? (down?1:0) : group.userData._gearT;
  const want=down?1:0, now=t+(want-t)*0.14;                 // eases, so it never snaps
  group.userData._gearT=now;
  for(const l of legs){ l.rotation.x=(1-now)*1.35; l.visible=now>0.02; }
}
function addAircraftControlSurfaces(g,span,length,shape,dark){
  const ailerons=[],elevators=[];
  if(shape!=='heli'&&shape!=='wing'){
    for(const sx of[-1,1]){const a=mkBox(Math.max(.8,span*.16),.055,Math.max(.22,length*.055),dark);
      a.position.set(sx*span*.34,.02,-length*.055);g.add(a);ailerons.push(a);
      const e=mkBox(Math.max(.55,span*.08),.055,Math.max(.2,length*.045),dark);e.position.set(sx*span*.11,.12,-length*.39);g.add(e);elevators.push(e);}
  }else if(shape==='wing'){
    for(const sx of[-1,1]){const a=mkBox(span*.2,.055,length*.08,dark);a.position.set(sx*span*.31,-.02,-length*.24);a.rotation.y=-sx*.16;g.add(a);ailerons.push(a);}
  }
  g.userData.ailerons=ailerons;g.userData.elevators=elevators;
}
function addPlaneSilhouetteAccents(g,span,length,shape,lineM,shadowM,dark){
  // Flat semi-pixel fighter readability: one aircraft silhouette, then crisp
  // panel cuts, intake/nozzle marks and knife-like wing tips on top.
  const nose=new THREE.Mesh(new THREE.ConeGeometry(.16,.92,6),lineM);
  nose.rotation.x=Math.PI/2;nose.position.set(0,.12,length*.56);nose.scale.x=.62;g.add(nose);
  const centerCut=mkBox(.05,.05,Math.max(1.05,length*.28),lineM);centerCut.position.set(0,.56,length*.18);g.add(centerCut);
  const spine=mkBox(.08,.06,Math.max(1.35,length*.34),shadowM);spine.position.set(0,.6,-length*.12);g.add(spine);
  const belly=mkBox(Math.min(1.25,span*.16),.055,Math.max(1.2,length*.28),shadowM);belly.position.set(0,-.32,-length*.05);g.add(belly);
  for(const sx of[-1,1]){
    const leading=mkBox(Math.max(1.35,span*.36),.042,.055,lineM);leading.position.set(sx*span*.26,.11,length*.02);leading.rotation.y=-sx*.36;g.add(leading);
    const trailing=mkBox(Math.max(1.15,span*.3),.042,.05,shadowM);trailing.position.set(sx*span*.24,.08,-length*.16);trailing.rotation.y=sx*.22;g.add(trailing);
    const tip=new THREE.Mesh(new THREE.ConeGeometry(.075,.62,4),lineM);
    tip.rotation.set(Math.PI/2,0,-sx*Math.PI/2);tip.position.set(sx*span*.505,.08,-length*.08);tip.scale.y=.18;g.add(tip);
    const tailLine=mkBox(Math.max(.68,span*.12),.045,.05,lineM);tailLine.position.set(sx*span*.13,.18,-length*.42);tailLine.rotation.y=-sx*.18;g.add(tailLine);
    const hardpoint=mkBox(.16,.18,.36,shadowM);hardpoint.position.set(sx*Math.min(span*.28,2.7),-.18,-length*.04);g.add(hardpoint);
    if(shape==='jet'||shape==='heavyjet'){
      const intakeSlash=mkBox(.08,.32,.72,shadowM);intakeSlash.position.set(sx*Math.min(.72,span*.08),-.08,length*.12);intakeSlash.rotation.y=-sx*.28;g.add(intakeSlash);
      const nozzleStripe=mkBox(.12,.28,.34,lineM);nozzleStripe.position.set(sx*Math.min(.5,span*.06),.02,-length*.5);g.add(nozzleStripe);
    }
  }
  if(shape==='jet'||shape==='heavyjet'){
    const wingRoot=mkBox(Math.min(span*.34,3.4),.055,.18,shadowM);wingRoot.position.set(0,.04,-length*.02);g.add(wingRoot);
  }
}
function addAircraftGraphicDetails(g,def,shape){
  const meta=g.userData.airMeta||{span:7,length:5},span=meta.span,length=meta.length,dark=aircraftSkin(0x242a30);
  const lineM=SILVER(0xd6dde2),shadowM=surfaceMaterial(0x171c21,'metal',.84,.28);
  if(shape!=='heli'){
    addPlaneSilhouetteAccents(g,span,length,shape,lineM,shadowM,dark);
  }else{
    const fortress=!!def.flyingFortress, cockpitZ=fortress?2.35:1.55;
    const chinPlate=mkBox(fortress?1.6:.95,.18,.18,shadowM);chinPlate.position.set(0,-.35,cockpitZ+.8);g.add(chinPlate);
    const glassLine=mkBox(fortress?1.7:.98,.055,.08,lineM);glassLine.position.set(0,.72,cockpitZ+.18);g.add(glassLine);
    for(const sx of[-1,1]){
      const cheek=mkBox(fortress?.24:.16,fortress?1.05:.76,.12,shadowM);cheek.position.set(sx*(fortress?.9:.52),.18,cockpitZ+.12);cheek.rotation.z=-sx*.16;g.add(cheek);
      const pylon=mkBox(fortress?2.25:1.55,.13,.18,shadowM);pylon.position.set(sx*(fortress?1.45:1.05),-.38,.18);g.add(pylon);
      const rail=mkBox(fortress?1.9:1.25,.08,.08,lineM);rail.position.set(sx*(fortress?1.45:1.05),-.5,.62);g.add(rail);
      if(def.bomb){
        const pod=mkBox(fortress?.72:.46,fortress?.42:.28,fortress?1.35:.86,shadowM);pod.position.set(sx*(fortress?2.18:1.35),-.62,.18);g.add(pod);
        for(let r=0;r<2;r++)for(let c=0;c<2;c++){const tube=mkCyl(fortress?.09:.06,fortress?.09:.06,fortress?.78:.48,lineM,8);tube.rotation.x=Math.PI/2;tube.position.set(sx*(fortress?2.18:1.35)+(c-.5)*(fortress?.22:.14),-.62+(r-.5)*(fortress?.18:.12),.68);g.add(tube);}
      }
    }
    const guns=Math.min(fortress?8:2,def.gunCount||1);
    for(let i=0;i<guns;i++){const x=(i-(guns-1)/2)*(fortress?.18:.12),bar=mkCyl(fortress?.035:.026,fortress?.045:.034,fortress?1.15:.72,shadowM,8);
      bar.rotation.x=Math.PI/2;bar.position.set(x,-.82,cockpitZ+.88);g.add(bar);
    }
  }
  if(shape!=='heli'){
    const gearVisuals=[],wheelMat=new THREE.MeshStandardMaterial({color:0x121416,roughness:.9});
    const gearLeg=(x,z,h,r)=>{const q=new THREE.Group(),strut=mkCyl(.035,.05,h,SILVER(0xaeb5ba),10);strut.position.y=-h*.45;q.add(strut);
      const wheel=new THREE.Mesh(new THREE.TorusGeometry(r,r*.42,8,14),wheelMat);wheel.rotation.y=Math.PI/2;wheel.position.y=-h;q.add(wheel);
      q.position.set(x,-.12,z);g.add(q);gearVisuals.push(q);};
    gearLeg(-Math.min(span*.22,2.3),-.3,.65,.16);gearLeg(Math.min(span*.22,2.3),-.3,.65,.16);gearLeg(0,length*.27,.58,.14);
    g.userData.gearVisuals=gearVisuals;
  }
  for(const sx of[-1,1]){const lamp=new THREE.Mesh(new THREE.SphereGeometry(.1,10,8),new THREE.MeshBasicMaterial({color:sx>0?0x44ff77:0xff3e48}));
    lamp.position.set(sx*span*.49,.05,-.05);g.add(lamp);}
  const tailLamp=new THREE.Mesh(new THREE.SphereGeometry(.075,8,6),new THREE.MeshBasicMaterial({color:0xf5f7ff}));tailLamp.position.set(0,.12,-length*.51);g.add(tailLamp);
  if(shape==='heavyprop'){
    const glass=new THREE.MeshPhysicalMaterial({color:0x1a3545,metalness:.2,roughness:.08,transparent:true,opacity:.88});
    for(const z of[-length*.18,length*.18]){const turret=new THREE.Mesh(new THREE.SphereGeometry(.38,16,10),glass);turret.scale.y=.62;turret.position.set(0,.72,z);g.add(turret);}
    for(const sx of[-1,1]){const blister=new THREE.Mesh(new THREE.SphereGeometry(.32,14,9),glass);blister.scale.set(.42,.72,1.1);blister.position.set(sx*.62,.02,-.8);g.add(blister);}
  }
  if(def.strategicBomb){for(const sx of[-1,1]){const stripe=mkBox(.16,.055,2.2,new THREE.MeshBasicMaterial({color:0xffd52d}));stripe.position.set(sx*.48,-.72,0);g.add(stripe);}}
  if(def.faction){
    const fc=def.faction==='Mackenzian Empire IV'?0x8c2638:def.faction==='Pincurchin Republic'?0x37a8d4:def.faction==='Arcian Union'?0xd33a31:0xf1c84a;
    const band=mkBox(Math.min(span*.6,5.2),.055,.42,new THREE.MeshStandardMaterial({color:fc,metalness:.15,roughness:.5}));band.position.set(0,.2,-length*.28);g.add(band);
  }
  addAircraftControlSurfaces(g,span,length,shape,dark);
}
function setAircraftControlSurfaces(group,roll,pitch){
  if(!group)return;const r=Math.max(-.42,Math.min(.42,roll||0))*.55,p=Math.max(-.35,Math.min(.35,pitch||0))*.5;
  (group.userData.ailerons||[]).forEach((a,i)=>a.rotation.x=(i?1:-1)*r);
  (group.userData.elevators||[]).forEach(e=>e.rotation.x=-p);
}
function addAircraftInterior(g,def,shape,length){
  const heavy=shape==='heavyprop'||shape==='heavyjet',heli=shape==='heli',z=heli?(def.flyingFortress?2.65:1.78):(heavy?4.35:1.55),
    width=heli?(def.flyingFortress?1.8:.95):(heavy?1.25:.82),dark=surfaceMaterial(0x171d21,'metal',.6,.35);
  const panel=navalBlock(width,.42,.16,dark,.9);panel.position.set(0,heli?.08:.2,z);panel.rotation.x=-.12;g.add(panel);
  const cols=[0x66d9ff,0x8cff7a,0xffc95c];
  for(let i=0;i<3;i++){const lamp=new THREE.Mesh(new THREE.CircleGeometry(.085,12),new THREE.MeshBasicMaterial({color:cols[i],transparent:true,opacity:.9,side:THREE.DoubleSide}));
    lamp.rotation.y=Math.PI;lamp.position.set((i-1)*width*.25,heli?.12:.24,z-.086);g.add(lamp);}
  const hud=new THREE.Mesh(new THREE.PlaneGeometry(width*.48,.38),new THREE.MeshBasicMaterial({color:0x5de2b2,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false}));
  hud.rotation.y=Math.PI;hud.position.set(0,heli?.53:.62,z+.12);g.add(hud);
  for(const sx of[-1,1]){const frame=mkBox(.055,.8,.055,dark);frame.position.set(sx*width*.48,heli?.48:.55,z+.02);frame.rotation.z=-sx*.22;g.add(frame);}
  g.userData.cockpitPanel=panel;
}
