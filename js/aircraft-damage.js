// ===== 飞机部件损伤 =====
//
// 每个部件 0 完好 / 1 受损 / 2 严重 / 3 摧毁，以及由此派生的操控惩罚与简报文案。
// 段内两个常量表都是纯字面量，其余是函数，加载时不执行任何主脚本的代码。

// ===== AIRCRAFT COMPONENT DAMAGE — each part: 0 ok · 1 damaged · 2 critical · 3 destroyed (−1 = not fitted) =====
const PART_NAME={ wingL:'Left wing', wingR:'Right wing', engL:'Engine', engR:'Right engine', tail:'Tail', elev:'Elevators', ailer:'Ailerons', fuel:'Fuel tank', weap:'Weapons', gear:'Landing gear', rotor:'Rotor' };
const PART_STATE=['','damaged','CRITICAL','DESTROYED'];
function initPlaneParts(def){
  if(def.heli) return { rotor:0, tail:0, engL:0, fuel:0, weap:0, gear:0 };
  const twin = def.shape==='attack'||def.shape==='heavyprop'||def.shape==='heavyjet';   // multi-engine aircraft use left/right engine banks
  return { wingL:0, wingR:0, engL:0, engR: twin?0:-1, tail:0, elev:0, ailer:0, fuel:0, weap:0, gear:0 };
}
function partLabel(P,k){ return (k==='engL' && P.parts.engR!==undefined && P.parts.engR>=0)?'Left engine':PART_NAME[k]; }
function enginePartHealth(P){ const pr=P.parts; const e=[]; if(pr.engL>=0)e.push(pr.engL); if(pr.engR>=0)e.push(pr.engR);
  if(!e.length) return 1; return 1 - (e.reduce((a,b)=>a+b,0)/e.length)/3; }
function damagePlanePart(P){
  const pr=P.parts, keys=Object.keys(pr).filter(k=>pr[k]>=0&&pr[k]<3); if(!keys.length) return;
  const k=keys[Math.floor(Math.random()*keys.length)]; pr[k]++;
  flashPrompt('⚠ '+partLabel(P,k)+' '+PART_STATE[pr[k]]);
  if(pr[k]===3){
    if(!['fuel'].includes(k)) spawnPlanePartDebris(P,k);
    if(k==='rotor'){ crashPlane('Main rotor failed — going down!'); return; }
    if(k==='wingL'||k==='wingR'){ debrisBurst(P.pos.clone(),6); flashPrompt('💥 '+partLabel(P,k)+' torn off!'); }
    if(k==='tail'||k==='engL'||k==='engR'||k==='gear'||k==='elev'||k==='ailer') flashPrompt('💥 '+partLabel(P,k)+' broke away!');
    if(k==='weap'){ flashPrompt('Weapons knocked out!'); }
  }
}
function partSummary(P){ const pr=P.parts, s=[]; for(const k in pr){ if(pr[k]>0) s.push((isZh()?trName(PART_NAME[k]):PART_NAME[k].split(' ')[0])+(pr[k]>=3?'✖':pr[k]>=2?'‼':'!')); } return s.length?'  ·  🔧 '+s.join(' '):''; }
function debrisBurst(pos,n){ for(let i=0;i<n;i++){ const d=mkBox(0.45,0.45,0.45,SILVER(0x6a7078)); d.position.copy(pos); scene.add(d);
  fx.push({mesh:d,life:1.1,fade:true,grav:true,vel:new THREE.Vector3((Math.random()-0.5)*16,Math.random()*9,(Math.random()-0.5)*16)}); } }
function smokeTrailAt(pos,scale=.8){
  if(!scene||fx.length>MAX_FX-5)return;
  const sm=_spr(smokeTex(),false);sm.material.color.setHex(0x262626);sm.scale.setScalar(scale*(0.8+Math.random()*0.7));
  sm.position.copy(pos).add(new THREE.Vector3((Math.random()-.5)*.7,(Math.random()-.5)*.35,(Math.random()-.5)*.7));scene.add(sm);
  fx.push({mesh:sm,life:1.1+Math.random()*.8,max:1.9,op:.42,fade:true,grow:true,growRate:1.8,
    vel:new THREE.Vector3((Math.random()-.5)*1.2,1.1+Math.random()*1.8,(Math.random()-.5)*1.2),srot:(Math.random()-.5)*.8});
}
function pushSmokingDebris(obj,pos,quat,vel,life=4.2){
  if(!obj||!scene)return;obj.position.copy(pos);if(quat)obj.quaternion.copy(quat);scene.add(obj);
  fx.push({mesh:obj,life,max:life,op:1,grav:true,spin:3+Math.random()*6,smoke:true,smokeScale:.75+Math.random()*.45,
    vel:vel||new THREE.Vector3((Math.random()-.5)*8,3+Math.random()*5,(Math.random()-.5)*8)});
}
function detachObjectAsSmokingDebris(root,obj,vel){
  if(!root||!obj||obj.userData.detached)return false;obj.userData.detached=true;
  const wp=obj.getWorldPosition(new THREE.Vector3()),wq=obj.getWorldQuaternion(new THREE.Quaternion());
  if(obj.parent)obj.parent.remove(obj);pushSmokingDebris(obj,wp,wq,vel);burnFx(wp.clone(),.85,.25,1);return true;
}
function spawnPlanePartDebris(P,k){
  if(!P||!P.plane||!P.plane.group||!P.parts)return;
  P._detachedParts=P._detachedParts||{};if(P._detachedParts[k])return;P._detachedParts[k]=true;
  const g=P.plane.group,meta=g.userData.airMeta||{span:7,length:5},span=meta.span,length=meta.length;
  const side=k==='wingL'||k==='engL'?-1:k==='wingR'||k==='engR'?1:0;
  const root=g,ud=g.userData;
  if(k==='wingL'&&ud.wingL&&ud.wingL!==ud.wingR&&detachObjectAsSmokingDebris(root,ud.wingL,new THREE.Vector3(-8,5,-2)))return;
  if(k==='wingR'&&ud.wingR&&ud.wingR!==ud.wingL&&detachObjectAsSmokingDebris(root,ud.wingR,new THREE.Vector3(8,5,-2)))return;
  if(k==='rotor'&&ud.rotor&&detachObjectAsSmokingDebris(root,ud.rotor,new THREE.Vector3(0,7,-3)))return;
  if(k==='tail'&&ud.trotor&&detachObjectAsSmokingDebris(root,ud.trotor,new THREE.Vector3((Math.random()-.5)*6,4,-9)))return;
  if(k==='gear'&&ud.gearVisuals&&ud.gearVisuals.length){ud.gearVisuals.forEach((q,i)=>detachObjectAsSmokingDebris(root,q,new THREE.Vector3((i-1)*4,3,1)));return;}
  const mat=surfaceMaterial(0x3f464b,'metal',.9,.15),chunk=new THREE.Group();
  if(k==='wingL'||k==='wingR'){
    const w=aircraftHalfWing(side||1,Math.max(1.6,span*.22),Math.max(.7,length*.16),.08,Math.max(.35,length*.12),.08,mat);
    w.position.set(0,0,0);chunk.add(w);
  }else if(k==='tail'||k==='elev'||k==='ailer'){
    const slab=mkBox(Math.max(.9,span*.16),.12,Math.max(.5,length*.12),mat);slab.rotation.y=(Math.random()-.5)*.7;chunk.add(slab);
  }else{
    const pod=aircraftFuselage(Math.max(.9,length*.16),.2,mat,.9);chunk.add(pod);
  }
  const off=new THREE.Vector3(side*span*.32,.15,k==='tail'||k==='elev'?-length*.42:k==='gear'?.15:-length*.05);
  const wp=g.localToWorld(off.clone()),wq=g.getWorldQuaternion(new THREE.Quaternion());
  pushSmokingDebris(chunk,wp,wq,new THREE.Vector3(side*(6+Math.random()*5),4+Math.random()*4,(Math.random()-.5)*7));
  burnFx(wp.clone(),.85,.25,1);
}
function planeSmoke(P,dt){ const pr=P.parts;applyPlaneDamageVisual(P);
  const burning = pr.fuel>=2 || pr.engL>=2 || (pr.engR>=0&&pr.engR>=2) || (pr.rotor!==undefined&&pr.rotor>=2) || pr.wingL>=3 || pr.wingR>=3;
  if(burning && Math.random()<dt*11){ const c=Math.random()<0.4?0xff6a20:0x2a2a2a;
    const sm=new THREE.Mesh(new THREE.SphereGeometry(0.5+Math.random()*0.5,6,6), new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.7}));
    sm.position.copy(P.pos).add(new THREE.Vector3((Math.random()-0.5)*2,0,(Math.random()-0.5)*2)); scene.add(sm);
    fx.push({mesh:sm,life:0.8,fade:true,grow:true,growRate:3,vel:new THREE.Vector3((Math.random()-0.5)*3,2+Math.random()*3,(Math.random()-0.5)*3)}); }
}
function hurtPlayerPlane(dmg){ // you, flying, took flak/cannon fire
  if(!piloting||piloting.phase==='takeoff') return;
  piloting.hp-=pDmg(dmg); boom(piloting.pos.clone(),0.5);
  if(Math.random()<0.045*DIFF().playerDmg){ crashPlane('Cockpit hit — pilot down!'); return; }     // rare fatal pilot hit
  if(Math.random()<Math.min(0.92,dmg/28)) damagePlanePart(piloting);              // bigger hits cripple a component
  if(!piloting) return;                                                           // a part-hit may have already crashed us
  if(piloting.hp<=0) crashPlane('Your aircraft was shot down!');
  else flashPrompt('Hit! '+Math.max(0,Math.ceil(piloting.hp/piloting.maxhp*100))+'%'+partSummary(piloting));
}
function crashPlane(msg){ // destroyed (ocean ditch / hit the sea / kamikaze)
  if(!piloting||!piloting.plane) return;
  if(piloting.crashing)return;piloting.crashing=true;
  if(piloting.plane.def.uav){ returnFromUAV(true,msg||'UAV destroyed'); return; }
  const pa=piloting.plane;
  blastAll(piloting.pos.clone().setY(1.5), 40, 13); splashAt(piloting.pos.clone().setY(0.5),2.5);
  pa.removed=true;destroyObject3D(pa.group); pa.group=null; pa.spot.taken=false;
  const i=planes.indexOf(pa); if(i>=0) planes.splice(i,1);
  piloting=null;
  showRespawnMenu((msg||'Aircraft lost!')+' You did not bail out — choose another ship or restart from harbor.');
}
function returnFromUAV(destroyed,msg){
  const P=piloting,pa=P&&P.plane;if(!pa)return;
  if(destroyed){
    if(pa.removed){piloting=null;fpv=false;mouseDownFire=false;return;}pa.removed=true;
    splashAt(P.pos.clone().setY(.5),.75);destroyObject3D(pa.group);pa.group=null;pa.spot.taken=false;
    const i=planes.indexOf(pa);if(i>=0)planes.splice(i,1);
  }else{
    if(P.returning)return;
    if(playerShipLost||player.hp<=0){ returnFromUAV(true,T('Ship lost — UAV ditched','母舰已沉——无人机弃置')); return; }   // no deck to return to
    P.returning=true;P.phase='uavreturn';mouseDownFire=false;
    flashPrompt((msg||'UAV recalled')+' — autopilot returning to ship.');return;
  }
  piloting=null;fpv=false;mouseDownFire=false;camPitch.v=.04;
  flashPrompt((msg||'UAV link ended')+' — captain safely back aboard.');updateMode();
}
function dockUAV(){
  const P=piloting,pa=P&&P.plane;if(!pa)return;
  player.build.group.attach(pa.group);pa.group.position.copy(pa.spot.pos);pa.group.rotation.set(0,parkYaw(pa.spot),0);pa.parked=true;setPlaneGearVisual(pa,true);
  piloting=null;fpv=false;mouseDownFire=false;camPitch.v=.04;flashPrompt('UAV recovered — captain safely back aboard.');updateMode();
}
function startDrive(){
  driving=true; camYaw.v=player.heading||0; camPitch.v=-0.06;   // slight downward tilt keeps the bridge roof out of the first view
  const cv=document.getElementById('c'); if(document.pointerLockElement!==cv) try{const _pl=cv.requestPointerLock(); if(_pl&&_pl.catch)_pl.catch(()=>{});}catch(e){}
  updateMode();
}
function stopDrive(){
  driving=false; player.throttle=0;
  walkPos.copy(player.helm); walkPos.y=deckEyeY();
  updateMode();
}
function updatePilot(dt){
  const P=piloting, def=P.plane.def, pa=P.plane, deckY=deckTopWorldY();
  P.heading=camYaw.v;   // so enemy flak can lead your aircraft
  if(P.fire>0 && P.phase!=='takeoff'){                                    // your aircraft is ablaze — get out
    P.hp-=P.fire*(P.maxhp||120)*0.04*dt; burnFx(P.pos,1.2,dt,P.fire+0.5);
    P._fireT=(P._fireT||0)+dt; if(P._fireT>5){ P._fireT=0; P.fire--; }
    if(P.hp<=0){ crashPlane('Burning aircraft went down!'); return; }
    if(Math.random()<dt*1.1) flashPrompt(keyPrompt('🔥 YOUR AIRCRAFT IS ON FIRE — press P to bail out!','🔥 YOUR AIRCRAFT IS ON FIRE — tap Bail to jump!','🔥 你的飞机着火了——快点「跳伞」！')); }
  // ---------- TAKEOFF ----------
  // ---- TAXI: you drive the aircraft on deck before you fly it ---------------------------
  // W/S throttle, A/D steer. Q rotates once you have speed AND are lined up on the runway.
  // Anything on deck that is not flat — turrets, parked aircraft, deck tanks, the island —
  // wrecks you, and rolling off the side flips you into the sea.
  if(P.phase==='taxi'){
    const dp=deckPlan;
    const g=player.build.group;
    const lp = P.deckLocal || (P.deckLocal = g.worldToLocal(P.pos.clone()));
    let steer=(keys['KeyD']?1:0)-(keys['KeyA']?1:0);   // A=port, D=starboard, matching the helm
    let thr=(keys['KeyW']?1:0)-(keys['KeyS']?1:0);
    let autoQ=false;
    // AUTO TAKEOFF (settings): the deck crew drives you out to the strip and rotates for you.
    // The taxi is a real skill with a real failure mode, and not everyone wants to practise it
    // every single sortie. Touching any control hands the aircraft straight back — you are never
    // locked out of your own plane — and it stays manual for the rest of that roll.
    if(gameSettings.autoTakeoff && dp && !P.manualTaxi){
      if(steer||thr||keys['KeyQ']) P.manualTaxi=true;
      else {
        const alignedX = Math.abs(lp.x-dp.runX) < dp.runHalfW*0.5;
        // Aim at a point a short way ahead ON the centreline, not at the far end of the strip.
        // Aiming at runZ1 makes the correction ~2 degrees, so the aircraft creeps across the deck
        // while still level with the parked row — and drives into whatever is ranged ahead of it.
        const want = alignedX ? 0 : Math.atan2(dp.runX-lp.x, Math.max(8, Math.min(22, dp.runZ1-lp.z)));
        const err = want-(P.taxiYaw||0);
        steer = err>0.03 ? 1 : err<-0.03 ? -1 : 0;
        thr = 1;
        autoQ = alignedX && P.speed > def.maxSpeed*0.28 &&
                lp.z > dp.runZ0 + (dp.runZ1-dp.runZ0)*0.45;
        if(!P._autoSaid){ P._autoSaid=true;
          flashPrompt(T('🛫 Auto takeoff — hands off, or touch a control to fly it yourself',
                        '🛫 自动起飞中——不用管，想自己开就按一下方向键'),'ok'); }
      }
    }
    // Nosewheel authority: nothing when stopped, full at walking pace, then tapering off as you
    // build toward rotation speed. Without the taper you can crank a hard turn at 35 m/s, and on
    // a 7-metre sponson a single tap of D throws you into the sea before you can let go. Signed,
    // so reversing steers like a car backing up — and damped, because backing an aircraft around
    // is a slow manoeuvre, not a handbrake turn.
    const v=Math.abs(P.speed);
    const bite=Math.min(1, v/8) * (v>10 ? Math.max(0.3, 10/v) : 1) * Math.sign(P.speed||1) * (P.speed<0 ? 0.5 : 1);
    P.taxiYaw=(P.taxiYaw==null?0:P.taxiYaw)+steer*dt*2.6*bite;   // deck turns are tight; you must be able to swing 90° in the width of the deck
    // S is a brake first and a reverse gear second: it stops you quickly, then walks you
    // backwards at tug speed. A deck is a small place and boxing yourself into a corner with
    // no way out but a crash is not a puzzle, it is a dead end.
    const TAXI_REV=6;
    if(thr>0)      P.speed += 14*dt;                       // gentler spool-up: a deck is a short place to change your mind
    else if(thr<0) P.speed -= (P.speed>0 ? 30 : 10)*dt;
    else           P.speed -= Math.sign(P.speed)*Math.min(Math.abs(P.speed), 16*dt);   // coast to a stop from either direction
    P.speed=Math.max(-TAXI_REV, Math.min(def.maxSpeed*0.55, P.speed));
    // move in DECK-LOCAL space so the ship can steer under you
    lp.x += Math.sin(P.taxiYaw)*P.speed*dt;
    lp.z += Math.cos(P.taxiYaw)*P.speed*dt;
    lp.y = dp ? dp.y+1.0 : lp.y;
    P.pos.copy(g.localToWorld(lp.clone()));
    const yawW=(player.heading||0)+P.taxiYaw;
    pa.group.position.copy(P.pos);
    pa.group.quaternion.setFromEuler(new THREE.Euler(0, yawW, 0,'YXZ'));
    camYaw.v=yawW; camPitch.v=0.03; spinProp(pa,dt);
    // --- hit something solid? ---
    const hit=deckObstacleAt(lp, pa);
    if(hit){ crashOnDeck(P, pa, hit); return; }
    // --- rolled off the edge? ---
    // Real flight decks are rimmed with catch netting, and it is what makes a narrow strip
    // survivable: wander off the side at taxi speed and you are simply stopped and pushed back
    // aboard, slightly bent. Do it with the throttle open and the netting won't hold you.
    if(dp && (!overDeck(lp) && lp.z<=dp.runZ1)){
      // Still under rotation speed (0.26 x maxSpeed = 25 for a fighter), so you can never net
      // your way out of a genuine overrun — but a straight roll from the ranged row reaches the
      // outboard edge at ~20 m/s, and at any lower cutoff simply holding W killed the aircraft,
      // which is the one input a player who has just read "W forward" will actually give.
      if(Math.abs(P.speed) < 22 && P.lastOnDeck){
        lp.copy(P.lastOnDeck); P.speed=0;
        // point her back at the strip too, or holding W just walks off the same edge again
        P.taxiYaw = Math.atan2(dp.runX-lp.x, Math.max(6, dp.runZ1-lp.z));
        P.pos.copy(g.localToWorld(lp.clone())); pa.group.position.copy(P.pos);
        flashPrompt(T('🕸 Caught the deck netting — back aboard, take it slower',
                      '🕸 挂到甲板防护网上了——退回甲板，慢一点'),'bad');
        return;
      }
      crashOnDeck(P, pa, 'edge'); return;
    }
    P.lastOnDeck = (P.lastOnDeck || new THREE.Vector3()).copy(lp);
    // Running off the BOW is different from going over the side. At flying speed she staggers
    // into the air anyway — an ugly unassisted takeoff, which is what really happens and what
    // stops a missed Q from being an instant kill. Below rotation speed nothing holds her up.
    if(dp && lp.z>dp.runZ1){
      if(P.speed >= def.maxSpeed*0.26){ P.phase='takeoff'; P.taxiT=0; P.rotateYaw=yawW;
        flashPrompt(T('Off the bow — she flies!','冲出舰艏——总算飞起来了！'),'ok'); }
      else crashOnDeck(P, pa, 'edge');
      return;
    }
    // --- Q to rotate ---
    const onRunway = dp && Math.abs(lp.x-dp.runX) < dp.runHalfW+0.6;
    const runwayLeft = dp ? (dp.runZ1 - lp.z) : 999;
    if((keys['KeyQ']||autoQ) && !P._qHeld){
      P._qHeld=true;
      const vmin=def.maxSpeed*0.26;
      if(!onRunway) flashPrompt(T('Line up on the runway first','先把飞机开到跑道上'),'bad');
      else if(P.speed<vmin) flashPrompt(T('Too slow to rotate — more throttle','速度不够——加大油门'),'bad');
      else { P.phase='takeoff'; P.taxiT=0; P.rotateYaw=yawW; flashPrompt(T('Rotate!','拉起！'),'ok'); }
    }
    if(!keys['KeyQ'] && !autoQ) P._qHeld=false;
    // running out of deck at speed with no rotation = over the bow
    if(dp && lp.z>dp.runZ1 && P.speed>2){ crashOnDeck(P, pa, 'edge'); return; }
    return;
  }
  if(P.phase==='takeoff'){
    if(def.heli){ // helicopters lift straight up
      camYaw.v=player.heading||0; camPitch.v=0; P.pos.y+=20*dt;
      pa.group.position.copy(P.pos); pa.group.quaternion.setFromEuler(new THREE.Euler(0,player.heading||0,0,'YXZ'));setAircraftControlSurfaces(pa.group,0,0);spinProp(pa,dt);
      if(P.pos.y>deckY+15){ P.phase='fly';setPlaneGearVisual(pa,false);flashPrompt('Airborne — you have control.'); updateMode(); }
      return;
    }
    camYaw.v=player.heading||0;
    P.taxiT+=dt; P.speed=Math.min(def.maxSpeed, P.speed+50*dt);
    const fwd=new THREE.Vector3(Math.sin(player.heading||0),0,Math.cos(player.heading||0));
    P.pos.add(fwd.multiplyScalar(P.speed*dt));
    let pv=0;
    if(P.taxiT<0.7){ P.pos.y=deckY+1.0; camPitch.v=0.04; }            // ground roll
    else { P.pos.y+=24*dt; pv=0.28; camPitch.v=Math.min(0.2,camPitch.v+dt*0.25); } // rotate
    pa.group.position.copy(P.pos);
    pa.group.quaternion.setFromEuler(new THREE.Euler(-pv, player.heading||0, 0, 'YXZ'));setAircraftControlSurfaces(pa.group,0,pv);
    spinProp(pa,dt);
    if(P.pos.y>deckY+18){ P.phase='fly';camPitch.v=0.12;setPlaneGearVisual(pa,false);flashPrompt('Airborne — you have control.'); updateMode(); }
    return;
  }
  if(P.phase==='uavreturn'){
    planeEngine(P, def, dt);
    if(P.fuel<=0){ returnFromUAV(true,'UAV battery depleted before recovery'); return; }
    const target=player.build.group.localToWorld(P.plane.spot.pos.clone()).setY(deckY+8);
    const to=target.clone().sub(P.pos),dist=to.length(),dir=to.normalize();
    P.speed=Math.min(110,Math.max(42,P.speed+(110-P.speed)*dt*1.3));P.pos.addScaledVector(dir,Math.min(dist,P.speed*dt));
    const yaw=Math.atan2(dir.x,dir.z);camYaw.v=yaw;P.lastYaw=yaw;P.roll=THREE.MathUtils.lerp(P.roll,0,dt*3);
    pa.group.position.copy(P.pos);pa.group.quaternion.setFromEuler(new THREE.Euler(0,yaw,P.roll,'YXZ'));spinProp(pa,dt);
    if(dist<3){dockUAV();return;} return;
  }
  // ---------- LANDING: descend; safe only OVER the ship, else ditch ----------
  // ---------- LANDING: a real deck recovery, no auto-return ------------------------------
  // You fly it down yourself. Touch the deck and it becomes a rollout: the aircraft glides on
  // for a distance set by the speed you brought in, and anything solid in that path wrecks it.
  // Stop safely and it STAYS where it stopped — that is where you'll board it next time.
  if(P.phase==='landing'){
    if(keys['KeyA']) camYaw.v+=def.turn*0.7*dt; if(keys['KeyD']) camYaw.v-=def.turn*0.7*dt;
    const yaw=camYaw.v;
    // gear and flaps down: she flies a slow, steep approach, and S bleeds even more
    const vApp=def.speed*0.55;
    if(keys['KeyW']) P.speed=Math.min(def.maxSpeed*0.6, P.speed+18*dt);
    else if(keys['KeyS']) P.speed=Math.max(def.speed*0.28, P.speed-26*dt);
    else P.speed += (vApp-P.speed)*Math.min(1,dt*1.2);
    P.pos.add(new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)).multiplyScalar(P.speed*dt));
    P.pos.y-=26*dt;
    P.roll=THREE.MathUtils.lerp(P.roll,0,0.1);
    pa.group.position.copy(P.pos); pa.group.quaternion.setFromEuler(new THREE.Euler(0.1,yaw,P.roll,'YXZ'));setAircraftControlSurfaces(pa.group,P.roll,-.1);spinProp(pa,dt);
    const local=player.build.group.worldToLocal(P.pos.clone());
    const overShip = overDeck(local);
    if(P.pos.y<=deckY+1.3 && overShip){
      // touchdown → roll out under your own momentum, in deck-local space
      P.deckLocal=local.clone(); P.deckLocal.y=(deckPlan?deckPlan.y:0)+1.0;
      P.taxiYaw=yaw-(player.heading||0);
      setPlaneGearVisual(pa,true);
      // A helicopter does not roll out. It has already come down vertically, so the moment the
      // wheels touch it is simply down — hand it straight to the taxi-home crew.
      if(def.heli){ P.speed=0; parkWhereItStopped(P, pa); return; }
      P.phase='rollout';
      // Arrestor wires: catching one is what makes a deck landing survivable at all. Touch down
      // in the wire zone (the aft third of the runway) and the hook takes most of your speed;
      // land long, past the wires, and you are relying on brakes alone — usually not enough.
      const dp=deckPlan;
      const inWires = dp && local.z < dp.runZ0 + (dp.runZ1-dp.runZ0)*0.42;
      if(inWires){ P.speed*=0.18; flashPrompt(T('🪝 Wire caught — brake with S','🪝 挂上拦阻索——按 S 刹车'),'ok'); }
      else { P.speed*=0.72; flashPrompt(T('Landed long — no wire! Brake!','着陆过远——没挂上索！快刹车！'),'bad'); }
      return;
    }
    if(planeTerrainCollision(P)) return;
    if(P.pos.y<=0.8){ ditchInOcean(P); return; }
    return;
  }
  // ---------- TAXI HOME: the deck crew walks her back to her box ------------------------
  if(P.phase==='taxihome'){
    const g=player.build.group, dp=deckPlan, sp=P.homeSpot;
    if(!sp || !dp){ stowPlaneAt(P, pa, sp||pa.spot); return; }
    const lp=P.deckLocal;
    const dx=sp.pos.x-lp.x, dz=sp.pos.z-lp.z, d=Math.hypot(dx,dz);
    if(d<1.2){ stowPlaneAt(P, pa, sp);
      flashPrompt(T('✈️ Stowed — she is ready to go again','✈️ 已归位——随时可以再起飞'),'ok'); return; }
    const want=Math.atan2(dx,dz);
    let err=want-(P.taxiYaw||0); while(err>Math.PI)err-=2*Math.PI; while(err<-Math.PI)err+=2*Math.PI;
    P.taxiYaw=(P.taxiYaw||0)+Math.max(-2.2*dt, Math.min(2.2*dt, err));
    P.speed=Math.min(7, Math.min(d*1.6, P.speed+9*dt));      // walking pace, easing off as she arrives
    lp.x+=Math.sin(P.taxiYaw)*P.speed*dt; lp.z+=Math.cos(P.taxiYaw)*P.speed*dt; lp.y=dp.y+1.0;
    P.pos.copy(g.localToWorld(lp.clone()));
    const yawW=(player.heading||0)+P.taxiYaw;
    pa.group.position.copy(P.pos);
    pa.group.quaternion.setFromEuler(new THREE.Euler(0, yawW, 0,'YXZ'));
    camYaw.v=yawW; camPitch.v=0.03; spinProp(pa,dt);
    return;
  }
  // ---------- ROLLOUT: the landing is not over until you stop ----------------------------
  if(P.phase==='rollout'){
    const g=player.build.group, dp=deckPlan;
    const steer=(keys['KeyD']?1:0)-(keys['KeyA']?1:0);
    const rollFrac=Math.min(1,P.speed/8);
    P.taxiYaw=(P.taxiYaw||0)+steer*dt*1.1*rollFrac;
    const brake=keys['KeyS']?34:14;                     // S brakes hard; otherwise friction alone
    P.speed=Math.max(0, P.speed - brake*dt);
    const lp=P.deckLocal;
    lp.x+=Math.sin(P.taxiYaw)*P.speed*dt; lp.z+=Math.cos(P.taxiYaw)*P.speed*dt;
    if(dp) lp.y=dp.y+1.0;
    P.pos.copy(g.localToWorld(lp.clone()));
    const yawW=(player.heading||0)+P.taxiYaw;
    pa.group.position.copy(P.pos); pa.group.quaternion.setFromEuler(new THREE.Euler(0,yawW,0,'YXZ'));
    camYaw.v=yawW; camPitch.v=0.03; spinProp(pa,dt);
    const hit=deckObstacleAt(lp,pa);
    if(hit){ crashOnDeck(P,pa,hit); return; }
    if(!overDeck(lp)){ crashOnDeck(P,pa,'edge'); return; }
    if(P.speed<=0.4){ parkWhereItStopped(P,pa); return; }   // stopped safely — it stays here
    return;
  }
  // ---------- HELI FLY: hover — throttle = forward, mouse pitch = climb/descend ----------
  if(def.heli){
    planeEngine(P, def, dt);
    const storm=weatherForce();
    const pr=P.parts, rH=1-(pr.rotor/3), heH=1-((pr.engL>=0?pr.engL:0)/3), tCtl=1-(pr.tail/3)*0.7;
    if(keys['KeyA']) camYaw.v+=def.turn*tCtl*(1-storm*0.16)*dt; if(keys['KeyD']) camYaw.v-=def.turn*tCtl*(1-storm*0.16)*dt;
    if(pr.tail>=2) camYaw.v += (pr.tail-1)*0.9*dt;   // tail-rotor loss → the airframe spins
    if(P.engineOn){ if(keys['KeyW']) P.speed=Math.min(def.maxSpeed*(1-storm*0.12),P.speed+30*dt);
      else if(keys['KeyS']) P.speed=Math.max(-def.maxSpeed*0.3,P.speed-30*dt);
      else P.speed*=(1-Math.min(1,dt*0.9)); }              // ease into a hover when hands off
    else P.speed*=(1-Math.min(1,dt*0.5));
    const yaw=camYaw.v, pitch=Math.max(-1.0,Math.min(1.0,camPitch.v));
    P.pos.add(new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)).multiplyScalar(P.speed*dt));
    if(storm) P.pos.add(weatherWind((def.flyingFortress?1.0:1.9)*dt));
    if(P.engineOn){ P.pos.y += Math.sin(pitch)*(def.climb||18)*rH*heH*dt;            // rotor/engine damage = less lift
      if(pr.rotor>=1||pr.engL>=1) P.pos.y -= (pr.rotor+(pr.engL>=0?pr.engL:0))*1.6*dt; }   // sag from reduced lift
    else P.pos.y -= 17*dt;                                          // dead engine — autorotation descent
    const yawRate=yaw-P.lastYaw; P.lastYaw=yaw;
    P.roll=THREE.MathUtils.lerp(P.roll, Math.max(-0.6,Math.min(0.6,yawRate*18)), 0.12);
    const lean=Math.max(-0.3,Math.min(0.3, P.speed/def.maxSpeed*0.3));
    pa.group.position.copy(P.pos);
    pa.group.quaternion.setFromEuler(new THREE.Euler(lean, yaw, P.roll, 'YXZ'));
    spinProp(pa,dt); planeSmoke(P,dt);
    if(playerKamikaze(P)) return;
    if(planeTerrainCollision(P))return;
    if(P.pos.y<1.5){ crashPlane('Crashed into the sea — aircraft destroyed!'); return; }
    if(Math.hypot(P.pos.x,P.pos.z)>6200){ P.pos.x*=0.99; P.pos.z*=0.99; }
    const hdir=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
    if(P.gunCd>0)P.gunCd-=dt; if(P.bombCd>0)P.bombCd-=dt;
    if(mouseDownFire&&def.guns&&pr.weap<3&&P.gunCd<=0&&consumePlaneGun(pa)){P.gunCd=def.guns.cd;const muz=P.pos.clone().add(hdir.clone().multiplyScalar(2.5));
      const gdir=reticleAim(muz,700).sub(muz).normalize();spawnShell(def.guns,muz,gdir,0,null);muzzleFlash(muz,.42,weaponPersonality(def.guns).flash);}
    if(keys['Space'] && def.bomb && pr.weap<3 && P.plane.bombsLeft>0 && P.bombCd<=0){ P.bombCd=0.6; dropBomb(P); }
    return;
  }
  // ---------- FLY: full control (component damage shapes the handling) ----------
  planeEngine(P, def, dt);
  const storm=weatherForce(), mass=def.shape==='heavyprop'||def.shape==='heavyjet'||def.shape==='wing'?0.65:def.scale&&def.scale>1.4?0.75:1;
  const pr=P.parts;
  const eH=enginePartHealth(P);                 if(eH<=0.05) P.engineOn=false;     // engines shot out → dead stick
  const tailCtl=1-(pr.tail/3)*0.8, elevCtl=1-(pr.elev/3)*0.7, ailerCtl=1-(pr.ailer/3)*0.6;
  const wingDmg=(pr.wingL+pr.wingR)/6;                                              // 0..1 lift loss
  const asym=((pr.wingL-pr.wingR)+(pr.engR>=0?(pr.engL-pr.engR):0))*0.05;           // pull toward the damaged side
  const wingOff = pr.wingL>=3||pr.wingR>=3;
  const turnAuth=def.turn*tailCtl*(1-storm*0.18*mass);   // rudder weakened by tail damage and storm gusts
  // ADVANCED FLYING (settings) — the default model can't roll: P.roll is derived from how fast
  // you're yawing and springs back to level, so it's decoration. Here the bank is a real state
  // you own. A/D roll and it STAYS rolled until you roll back, which is the whole point: a bank
  // that self-levels can never come round through 360.
  const advFly=!!gameSettings.advancedFlight;
  if(advFly){
    const rollRate=def.turn*1.7*(0.5+0.5*ailerCtl);                                 // ailerons slow the roll
    const rollL=keys['KeyA']||keys['ArrowLeft'], rollR=keys['KeyD']||keys['ArrowRight'];
    if(rollL) P.roll+=rollRate*dt;
    if(rollR) P.roll-=rollRate*dt;
    while(P.roll> Math.PI) P.roll-=Math.PI*2;                                       // wrap, so full 360s are legal
    while(P.roll<-Math.PI) P.roll+=Math.PI*2;
    // Hands off the stick, she rolls herself level. Holding the key is what carries you round —
    // the roll accumulates without a clamp for as long as you hold it, so a full barrel roll is
    // still one held key. What you don't get is being stranded upside down because you let go.
    if(!rollL && !rollR) P.roll += (0-P.roll)*Math.min(1, dt*2.2);
    P.roll += asym*0.6*dt;                                                          // a damaged wing still drags you over
    // Elevator on the arrows, resolved in the AIRCRAFT's frame rather than the world's. Level,
    // pulling back climbs. Banked ninety degrees, the same pull carves a flat turn. Inverted, it
    // pulls you down. That decomposition is what makes a roll fly the way it looks.
    let el=0; if(keys['ArrowUp'])el+=1; if(keys['ArrowDown'])el-=1;
    if(el){ camPitch.v += el*Math.cos(P.roll)*def.turn*1.25*elevCtl*dt;
            camYaw.v   += el*Math.sin(P.roll)*turnAuth*2.0*dt; }
    camYaw.v += Math.sin(P.roll)*turnAuth*0.9*dt;                                   // a held bank keeps turning, hands off
  } else {
    if(keys['KeyA']) camYaw.v+=turnAuth*dt;
    if(keys['KeyD']) camYaw.v-=turnAuth*dt;
  }
  camYaw.v += asym*dt;                                                              // asymmetric yaw pull
  if(pr.tail>=2) camYaw.v += Math.sin(t2*11)*0.7*(pr.tail-1)*dt;                    // unstable tail → wobble
  const pCap=advFly?1.35:1.1;                                                       // a bit more elevator once you're flying it properly
  const pitch=Math.max(-pCap,Math.min(pCap,camPitch.v))*elevCtl, yaw=camYaw.v;      // elevators limit pitch authority
  const dir=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
  if(P.engineOn){
    const mx=planeMaxSpeed(P,def)*(0.45+0.55*eH)*(1-storm*0.10*mass);              // payload/fuel, engine health and weather set available thrust
    if(keys['KeyW']) P.speed=Math.min(mx,P.speed+34*eH*dt);
    if(keys['KeyS']) P.speed=Math.max(def.speed*0.45,P.speed-34*dt);
    P.pos.add(dir.clone().multiplyScalar(P.speed*dt));
    if(wingDmg>0) P.pos.y -= wingDmg*16*dt;                                         // reduced lift → sink
  } else { // DEAD ENGINE — heavy gravity, glides forward but CANNOT climb
    P.speed=Math.max(def.speed*0.4, P.speed-16*dt);
    P.pos.x+=Math.sin(yaw)*P.speed*dt; P.pos.z+=Math.cos(yaw)*P.speed*dt;
    P.pos.y -= 28*dt + Math.max(0,-Math.sin(pitch))*P.speed*dt;
  }
  if(storm) P.pos.add(weatherWind((2.25*mass)*(0.45+Math.max(0,1-P.pos.y/120))*dt));
  const yawRate=yaw-P.lastYaw; P.lastYaw=yaw;
  if(advFly){
    // the bank is the pilot's, so don't overwrite it — a torn wing still throws you over though
    if(wingOff){ P.roll+=(pr.wingL>=3?-1:1)*2.4*dt; P.pos.y-=30*dt; }
  } else {
    let rollT=Math.max(-0.9,Math.min(0.9,yawRate*22)) + asym*4;                     // forced roll toward the bad side
    if(wingOff){ rollT=(pr.wingL>=3?-1:1)*1.5; P.pos.y-=30*dt; }                    // torn wing → violent roll + falling
    P.roll=THREE.MathUtils.lerp(P.roll, rollT, 0.12*(0.5+0.5*ailerCtl));           // ailerons slow the roll response
  }
  pa.group.position.copy(P.pos);
  pa.group.quaternion.setFromEuler(new THREE.Euler(-pitch, yaw, P.roll, 'YXZ')); // nose up when climbing
  setAircraftControlSurfaces(pa.group,P.roll,pitch);
  spinProp(pa,dt); planeSmoke(P,dt);
  if(playerKamikaze(P)) return;
  if(planeTerrainCollision(P))return;
  if(P.pos.y<2){ crashPlane('Flew into the sea — aircraft destroyed!'); return; }
  if(Math.hypot(P.pos.x,P.pos.z)>6200){ P.pos.x*=0.99; P.pos.z*=0.99; }
  // weapons (a destroyed weapons system can't fire)
  if(P.gunCd>0)P.gunCd-=dt; if(P.bombCd>0)P.bombCd-=dt;
  if(mouseDownFire&&def.guns&&pr.weap<3&&P.gunCd<=0&&consumePlaneGun(pa)){P.gunCd=def.guns.cd;const muzzle=P.pos.clone().add(dir.clone().multiplyScalar(3));
    const gdir=reticleAim(muzzle,700).sub(muzzle).normalize();spawnShell(def.guns,muzzle,gdir,0,null);muzzleFlash(muzzle,.45,weaponPersonality(def.guns).flash);}
  if(keys['Space'] && def.bomb && pr.weap<3 && P.plane.bombsLeft>0 && P.bombCd<=0){ P.bombCd=0.7; dropBomb(P); }
}
function dropBomb(P){
  const def=P.plane.def, w=def.bomb; P.plane.bombsLeft--;
  if(def.strategicBomb)flashPrompt(def===PLANES.tu95v?'☢ TSAR BOMBA RELEASED — CLEAR THE BLAST AREA!':'☢ STRATEGIC WEAPON RELEASED — CLEAR THE BLAST AREA!');
  const yaw=camYaw.v, pitch=Math.max(-1.1,Math.min(1.1,camPitch.v));
  const fwd=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
  const from=P.pos.clone().add(new THREE.Vector3(0,-0.8,0));
  if(w.kind==='missile'){ const d=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)); spawnShell(w,from,d,0,P.plane); } // homing
  else if(w.kind==='torpedo'){ spawnShell(w,from,fwd.clone(),0,null); }      // torpedo skims the surface
  else { const vel=fwd.clone().multiplyScalar(P.speed*0.6); vel.y=-3; spawnShell(w,from,fwd.clone(),0,null,false,vel); } // bomb falls with momentum
}

