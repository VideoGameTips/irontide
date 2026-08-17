// ===== 音频：配乐合成 + 音效 =====
//
// 从 index.html 抽出来。整段只有声明，没有一句在加载时执行的顶层语句——所以它在
// 主脚本之前加载是安全的，只是把这些函数更早地放进全局作用域。
//
// 运行时依赖 SFX（主音量 GainNode）和 weather/当前地图等游戏状态，但都只在函数体
// 内引用，等到真正播放时才求值，那时主脚本早已就位。和 js/terrain.js 一样是普通
// <script>，共享全局作用域，没有构建步骤。

// ===== MUSIC — a fully-synthesized, slowly-evolving naval score (no audio files) =====
const MUSIC={ctx:null,gain:null,on:true,playing:false,level:0.16,mode:'ending',barDur:3.4,nextTime:0,bar:0,timer:null,
  // A natural-minor "heroic lament": Am – F – C – G, looping with variation. [root MIDI, chord type]
  prog:[[57,'min'],[53,'maj'],[48,'maj'],[55,'maj']],
  scale:[57,59,60,62,64,65,67,69,71,72,74,76],profile:null};   // A-minor scale across two octaves (for the melody)
const MUSIC_PROFILES={
  default:{level:.20,barDur:5.6,prog:[[57,'min'],[53,'maj'],[48,'maj'],[55,'maj']],scale:[57,59,60,62,64,65,67,69,71,72,74,76],drone:.12,pad:.032,pulse:.06,shimmer:.33,melody:.18,perc:'none',cutoff:850},
  'Training Bay':{level:.17,barDur:6.4,prog:[[62,'maj'],[57,'min'],[55,'maj'],[60,'maj']],scale:[55,57,59,60,62,64,66,67,69,71,72,74],drone:.08,pad:.038,pulse:.035,shimmer:.48,melody:.16,perc:'soft',cutoff:1050},
  'The Landing':{level:.24,barDur:4.8,prog:[[50,'min'],[53,'maj'],[55,'maj'],[57,'min']],scale:[50,52,53,55,57,58,60,62,64,65,67,69],drone:.13,pad:.026,pulse:.13,shimmer:.12,melody:.08,perc:'march',cutoff:760},
  'Coastal Skirmish':{level:.22,barDur:4.25,prog:[[57,'min'],[55,'maj'],[53,'maj'],[52,'min']],scale:[52,53,55,57,59,60,62,64,65,67,69,71],drone:.1,pad:.025,pulse:.12,shimmer:.18,melody:.2,perc:'skirmish',cutoff:900},
  'Southhaven Shoals':{level:.23,barDur:5.2,prog:[[53,'maj'],[57,'min'],[60,'maj'],[55,'maj']],scale:[53,55,57,59,60,62,64,65,67,69,71,72],drone:.11,pad:.04,pulse:.095,shimmer:.36,melody:.38,perc:'heroic',cutoff:1150},
  'The Broken Reef':{level:.23,barDur:4.9,prog:[[56,'min'],[52,'min'],[51,'maj'],[55,'maj']],scale:[51,52,54,56,57,59,60,63,64,66,68,69],drone:.14,pad:.024,pulse:.1,shimmer:.16,melody:.12,perc:'reef',cutoff:680},
  'Iron Straits':{level:.25,barDur:4.55,prog:[[50,'min'],[49,'min'],[53,'maj'],[48,'maj']],scale:[48,50,51,53,55,56,58,60,62,63,65,67],drone:.17,pad:.022,pulse:.16,shimmer:.1,melody:.08,perc:'storm',cutoff:620},
  'Nightfall Passage':{level:.21,barDur:6.2,prog:[[45,'min'],[48,'maj'],[43,'min'],[47,'maj']],scale:[43,45,47,48,50,52,53,55,57,59,60,62],drone:.16,pad:.026,pulse:.055,shimmer:.2,melody:.06,perc:'stealth',cutoff:520},
  'Fogbound Marches':{level:.22,barDur:6.7,prog:[[46,'min'],[44,'min'],[49,'maj'],[43,'min']],scale:[43,44,46,48,49,51,53,55,56,58,60,61],drone:.18,pad:.018,pulse:.045,shimmer:.12,melody:.04,perc:'fog',cutoff:430},
  "Leviathan's Grave":{level:.25,barDur:6.0,prog:[[38,'min'],[41,'min'],[36,'min'],[43,'maj']],scale:[38,40,41,43,45,46,48,50,52,53,55,57],drone:.22,pad:.026,pulse:.13,shimmer:.08,melody:.1,perc:'boss',cutoff:520},
  'Dawn Patrol':{level:.21,barDur:6.1,prog:[[55,'maj'],[60,'maj'],[57,'min'],[62,'maj']],scale:[55,57,59,60,62,64,66,67,69,71,72,74],drone:.1,pad:.046,pulse:.06,shimmer:.5,melody:.42,perc:'soft',cutoff:1300},
  'The Gauntlet':{level:.25,barDur:3.7,prog:[[52,'min'],[50,'min'],[49,'maj'],[47,'min']],scale:[47,49,50,52,54,55,57,59,61,62,64,66],drone:.12,pad:.018,pulse:.18,shimmer:.1,melody:.08,perc:'urgent',cutoff:760},
  'Typhoon Run':{level:.26,barDur:3.95,prog:[[45,'min'],[48,'min'],[43,'min'],[50,'maj']],scale:[43,45,47,48,50,52,53,55,57,58,60,62],drone:.2,pad:.018,pulse:.2,shimmer:.08,melody:.04,perc:'storm',cutoff:560},
  'Blackwater Ambush':{level:.23,barDur:5.8,prog:[[49,'min'],[48,'maj'],[45,'min'],[52,'min']],scale:[45,47,48,49,52,53,55,57,59,60,61,64],drone:.17,pad:.018,pulse:.09,shimmer:.08,melody:.05,perc:'stealth',cutoff:460},
  'Island Hopping':{level:.24,barDur:4.8,prog:[[53,'maj'],[55,'maj'],[57,'min'],[60,'maj']],scale:[53,55,57,59,60,62,64,65,67,69,71,72],drone:.1,pad:.032,pulse:.14,shimmer:.22,melody:.24,perc:'march',cutoff:980},
  'Midnight Raid':{level:.22,barDur:5.4,prog:[[42,'min'],[45,'min'],[47,'maj'],[44,'min']],scale:[42,44,45,47,49,50,52,54,56,57,59,61],drone:.15,pad:.018,pulse:.075,shimmer:.16,melody:.05,perc:'stealth',cutoff:600},
  'The Iron Armada':{level:.26,barDur:4.7,prog:[[50,'min'],[53,'maj'],[57,'min'],[55,'maj']],scale:[50,52,53,55,57,58,60,62,64,65,67,69],drone:.15,pad:.036,pulse:.16,shimmer:.24,melody:.32,perc:'armada',cutoff:1100},
  'Shattered Coast':{level:.24,barDur:4.35,prog:[[51,'min'],[54,'min'],[50,'maj'],[56,'min']],scale:[50,51,53,54,56,57,59,61,62,64,65,67],drone:.13,pad:.02,pulse:.13,shimmer:.12,melody:.09,perc:'reef',cutoff:700},
  'Frozen Straits':{level:.22,barDur:6.5,prog:[[47,'min'],[50,'maj'],[45,'min'],[52,'maj']],scale:[45,47,49,50,52,54,56,57,59,61,62,64],drone:.17,pad:.03,pulse:.055,shimmer:.44,melody:.08,perc:'cold',cutoff:760},
  'The Reckoning':{level:.26,barDur:4.85,prog:[[57,'min'],[60,'maj'],[53,'maj'],[55,'maj']],scale:[53,55,57,59,60,62,64,65,67,69,71,72],drone:.14,pad:.038,pulse:.14,shimmer:.24,melody:.42,perc:'heroic',cutoff:1200},
  'Ghost Fleet':{level:.23,barDur:6.2,prog:[[44,'min'],[43,'min'],[47,'dim'],[42,'min']],scale:[42,44,45,47,48,50,51,53,54,56,57,59],drone:.19,pad:.016,pulse:.05,shimmer:.16,melody:.04,perc:'ghost',cutoff:420},
  'Volcano Bay':{level:.25,barDur:4.65,prog:[[48,'min'],[51,'maj'],[46,'min'],[43,'maj']],scale:[43,46,48,50,51,53,55,56,58,60,62,63],drone:.2,pad:.018,pulse:.17,shimmer:.08,melody:.07,perc:'volcano',cutoff:560},
  'Last Bastion':{level:.25,barDur:4.7,prog:[[45,'min'],[48,'maj'],[50,'min'],[43,'maj']],scale:[43,45,47,48,50,52,53,55,57,58,60,62],drone:.17,pad:.024,pulse:.17,shimmer:.1,melody:.1,perc:'siege',cutoff:700},
  'The Long Night':{level:.22,barDur:6.8,prog:[[40,'min'],[43,'min'],[38,'min'],[45,'min']],scale:[38,40,41,43,45,46,48,50,52,53,55,57],drone:.22,pad:.012,pulse:.06,shimmer:.06,melody:.02,perc:'night',cutoff:360},
  'Hurricane Alley':{level:.27,barDur:3.75,prog:[[43,'min'],[46,'min'],[48,'maj'],[41,'min']],scale:[41,43,44,46,48,49,51,53,55,56,58,60],drone:.2,pad:.016,pulse:.22,shimmer:.08,melody:.05,perc:'storm',cutoff:520},
  'Twin Leviathans':{level:.27,barDur:5.25,prog:[[38,'min'],[41,'min'],[38,'min'],[43,'maj']],scale:[38,40,41,43,45,46,48,50,52,53,55,57],drone:.24,pad:.026,pulse:.19,shimmer:.08,melody:.1,perc:'boss2',cutoff:540},
  'The Crucible':{level:.27,barDur:4.25,prog:[[50,'min'],[46,'min'],[53,'maj'],[43,'min']],scale:[43,45,46,48,50,51,53,55,57,58,60,62],drone:.19,pad:.022,pulse:.18,shimmer:.13,melody:.12,perc:'crucible',cutoff:720},
  'Steel Rain':{level:.27,barDur:3.9,prog:[[45,'min'],[43,'min'],[48,'maj'],[42,'min']],scale:[42,43,45,47,48,50,52,54,55,57,59,60],drone:.18,pad:.018,pulse:.21,shimmer:.08,melody:.05,perc:'artillery',cutoff:640},
  'Endless Horizon':{level:.22,barDur:7.2,prog:[[55,'maj'],[50,'min'],[53,'maj'],[48,'maj']],scale:[48,50,52,53,55,57,59,60,62,64,65,67],drone:.13,pad:.052,pulse:.045,shimmer:.42,melody:.28,perc:'wide',cutoff:1450},
  'The Final Blockade':{level:.27,barDur:4.9,prog:[[50,'min'],[53,'maj'],[48,'maj'],[55,'maj']],scale:[48,50,52,53,55,57,58,60,62,64,65,67],drone:.19,pad:.034,pulse:.18,shimmer:.18,melody:.2,perc:'blockade',cutoff:1000},
  'Ragnarök Reef':{level:.28,barDur:3.8,prog:[[38,'min'],[43,'min'],[41,'maj'],[36,'min']],scale:[36,38,40,41,43,45,46,48,50,51,53,55],drone:.25,pad:.018,pulse:.23,shimmer:.08,melody:.05,perc:'apoc',cutoff:520},
  'The Last Tide':{level:.29,barDur:5.15,prog:[[57,'min'],[53,'maj'],[48,'maj'],[55,'maj']],scale:[48,50,52,53,55,57,59,60,62,64,65,67,69,71,72],drone:.21,pad:.044,pulse:.2,shimmer:.25,melody:.5,perc:'final',cutoff:1300}
};
function musicProfileForCurrentMap(mode){
  if(mode!=='ambient') return MUSIC_PROFILES.default;
  const name=(window._MAP&&window._MAP.name)||'';
  return MUSIC_PROFILES[name]||MUSIC_PROFILES.default;
}
const _mtof=m=>440*Math.pow(2,(m-69)/12);
function _mvoice(freq,t0,dur,opt){   // one synth note → MUSIC.gain
  const ctx=MUSIC.ctx; if(!ctx) return; opt=opt||{};
  const o=ctx.createOscillator(); o.type=opt.type||'triangle'; o.frequency.value=freq; if(opt.detune)o.detune.value=opt.detune;
  const g=ctx.createGain(), peak=opt.gain||0.2, atk=opt.attack||0.4, rel=opt.release||0.8;
  g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(peak,t0+atk);
  g.gain.setTargetAtTime(0.0001,t0+Math.max(atk,dur-rel),rel*0.5);
  let node=o;
  if(opt.cutoff){ const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=opt.cutoff; f.Q.value=opt.q||0.6; o.connect(f); node=f; }
  node.connect(g); g.connect(MUSIC.gain);
  o.start(t0); o.stop(t0+dur+rel);
}
function _mnoise(t0,dur,opt){
  const ctx=MUSIC.ctx;if(!ctx||!SFX.noiseBuf)return;opt=opt||{};
  const s=ctx.createBufferSource();s.buffer=SFX.noiseBuf;
  const f=ctx.createBiquadFilter();f.type=opt.type||'bandpass';f.frequency.value=opt.freq||520;f.Q.value=opt.q||1.2;
  const g=ctx.createGain(),peak=opt.gain||.04;
  g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(peak,t0+.012);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
  s.connect(f);f.connect(g);g.connect(MUSIC.gain);s.start(t0);s.stop(t0+dur+.02);
}
function _scheduleAmbientPerc(t0,p,barDur){
  if(!p||p.perc==='none')return;
  const hit=(off,gain,freq,dur=.12,type='bandpass')=>_mnoise(t0+off,dur,{gain,freq,type,q:1.1});
  if(p.perc==='soft'){ hit(barDur*.5,.018,420,.18); return; }
  if(p.perc==='march'){ for(let i=0;i<4;i++){hit(i*barDur*.25,.045,i%2?760:180,.13,i%2?'bandpass':'lowpass');} return; }
  if(p.perc==='skirmish'){ for(let i=0;i<6;i++)if(i!==4)hit(i*barDur/6,.035+(i%3===0)*.02,i%2?900:240,.1,i%2?'bandpass':'lowpass'); return; }
  if(p.perc==='heroic'){ for(const off of[0,barDur*.5])hit(off,.05,210,.18,'lowpass'); if(MUSIC.bar%2===0)hit(barDur*.75,.026,980,.12); return; }
  if(p.perc==='reef'){ for(const off of[0,barDur*.31,barDur*.62,barDur*.84])hit(off,.032,520+Math.random()*500,.08); }
  if(p.perc==='storm'){ for(const off of[0,barDur*.28,barDur*.56,barDur*.82])hit(off,.055,120,.22,'lowpass'); if(Math.random()<.55)hit(barDur*(.18+Math.random()*.6),.04,1100,.08); return; }
  if(p.perc==='stealth'){ if(MUSIC.bar%2===0)_mvoice(_mtof(84),t0+barDur*.38,.18,{type:'sine',gain:.035,attack:.015,release:.22,cutoff:2600}); if(Math.random()<.45)hit(barDur*.72,.022,650,.07); return; }
  if(p.perc==='fog'){ _mvoice(_mtof(79),t0+barDur*.28,.35,{type:'sine',gain:.04,attack:.02,release:.45,cutoff:2200}); if(MUSIC.bar%3===0)_mvoice(_mtof(67),t0+barDur*.62,.45,{type:'sine',gain:.025,attack:.03,release:.55,cutoff:1800}); return; }
  if(p.perc==='boss'){ for(const off of[0,barDur*.5])hit(off,.075,95,.32,'lowpass'); if(MUSIC.bar%2===0)hit(barDur*.74,.045,180,.24,'lowpass'); return; }
  if(p.perc==='boss2'){ for(const off of[0,barDur*.25,barDur*.5,barDur*.75])hit(off,.066,90,.28,'lowpass'); return; }
  if(p.perc==='urgent'){ for(let i=0;i<8;i++)hit(i*barDur/8,.038+(i%4===0)*.025,i%2?950:170,.08,i%2?'bandpass':'lowpass'); return; }
  if(p.perc==='armada'){ for(const off of[0,barDur*.25,barDur*.5,barDur*.75])hit(off,.05,190,.18,'lowpass'); if(MUSIC.bar%2===0)_mvoice(_mtof(62),t0+barDur*.5,.55,{type:'triangle',gain:.04,attack:.08,release:.7,cutoff:900}); return; }
  if(p.perc==='cold'){ if(Math.random()<.7)_mvoice(_mtof(91),t0+barDur*(.2+Math.random()*.5),.65,{type:'sine',gain:.028,attack:.08,release:.9,cutoff:3400}); return; }
  if(p.perc==='ghost'){ _mvoice(_mtof(72),t0+barDur*.33,.7,{type:'sine',gain:.035,attack:.08,release:1.0,cutoff:1700}); if(MUSIC.bar%2===1)_mvoice(_mtof(60),t0+barDur*.7,.9,{type:'sine',gain:.026,attack:.1,release:1.1,cutoff:1000}); return; }
  if(p.perc==='volcano'){ for(const off of[0,barDur*.48])hit(off,.072,85,.34,'lowpass'); if(Math.random()<.55)hit(barDur*Math.random(),.04,380,.18,'bandpass'); return; }
  if(p.perc==='siege'){ for(const off of[0,barDur*.25,barDur*.5,barDur*.75])hit(off,.06,135,.22,'lowpass'); return; }
  if(p.perc==='night'){ if(MUSIC.bar%3===0)hit(barDur*.5,.025,240,.25,'lowpass'); return; }
  if(p.perc==='crucible'){ for(let i=0;i<7;i++)if(Math.random()<.82)hit(i*barDur/7,.038,i%2?760:130,.09,i%2?'bandpass':'lowpass'); return; }
  if(p.perc==='artillery'){ for(const off of[0,barDur*.22,barDur*.44,barDur*.66,barDur*.88])hit(off,.064,105,.2,'lowpass'); return; }
  if(p.perc==='wide'){ if(MUSIC.bar%2===0)hit(barDur*.5,.022,180,.22,'lowpass'); return; }
  if(p.perc==='blockade'){ for(const off of[0,barDur*.33,barDur*.66])hit(off,.062,125,.26,'lowpass'); if(MUSIC.bar%2===0)_mvoice(_mtof(69),t0+barDur*.34,.7,{type:'triangle',gain:.04,attack:.08,release:.8,cutoff:1200}); return; }
  if(p.perc==='apoc'){ for(let i=0;i<8;i++)hit(i*barDur/8,.058+(i%4===0)*.03,i%2?520:75,.16,i%2?'bandpass':'lowpass'); if(Math.random()<.5)hit(barDur*Math.random(),.045,1400,.08); return; }
  if(p.perc==='final'){ for(const off of[0,barDur*.25,barDur*.5,barDur*.75])hit(off,.06,145,.22,'lowpass'); _mvoice(_mtof(69),t0+barDur*.52,.8,{type:'triangle',gain:.048,attack:.08,release:.9,cutoff:1600}); }
}
function _scheduleBar(t0){
  if(MUSIC.mode==='ambient') return _scheduleAmbientBar(t0);   // subtle in-game bed
  const chord=MUSIC.prog[MUSIC.bar%MUSIC.prog.length], root=chord[0], ints=chord[1]==='min'?[0,3,7]:[0,4,7];
  const barDur=MUSIC.barDur;
  // sustained pad — the chord, one octave up, gently detuned for warmth
  ints.forEach((iv,i)=>{ _mvoice(_mtof(root+12+iv), t0, barDur, {type:'triangle', gain:0.075, attack:0.9, release:1.6, detune:(i-1)*4, cutoff:1400, q:0.5}); });
  // soft low pulse on the root — a heartbeat of momentum (two per bar)
  for(const off of [0, barDur*0.5]) _mvoice(_mtof(root-12), t0+off, 0.9, {type:'sine', gain:0.16, attack:0.02, release:0.6, cutoff:420});
  // sub bass drone
  _mvoice(_mtof(root-24), t0, barDur, {type:'sine', gain:0.1, attack:0.6, release:1.2, cutoff:200});
  // sparse solemn melody — a few chord/scale notes over most bars, resting sometimes
  if((MUSIC.bar%4)!==3 && Math.random()<0.82){
    const notes=1+Math.floor(Math.random()*3), start=Math.random()<0.5?0:barDur*0.5;
    for(let n=0;n<notes;n++){ const deg=MUSIC.scale[3+Math.floor(Math.random()*(MUSIC.scale.length-3))];
      const nt=t0+start+n*(barDur*0.5/notes)*(0.7+Math.random()*0.6);
      _mvoice(_mtof(deg+12), nt, 0.7, {type:'sine', gain:0.06+Math.random()*0.03, attack:0.05, release:0.55, cutoff:2600}); }
  }
  MUSIC.bar++;
}
// A quiet, evolving ambient bed for during play — low drone + airy pad + rare shimmer, NO melody
// so it sits under the sound FX. Slower, softer and far less busy than the end-of-battle score.
function _scheduleAmbientBar(t0){
  const p=MUSIC.profile||MUSIC_PROFILES.default, prog=p.prog||MUSIC.prog, scale=p.scale||MUSIC.scale;
  const chord=prog[MUSIC.bar%prog.length], root=chord[0], ints=chord[1]==='min'?[0,3,7]:[0,4,7];
  const barDur=MUSIC.barDur; _scheduleAmbientPerc(t0,p,barDur);
  // low sustained drone: root + fifth, slow swell
  _mvoice(_mtof(root-12),   t0, barDur, {type:'sine', gain:p.drone||0.12, attack:2.0, release:2.6, cutoff:250});
  _mvoice(_mtof(root-12+7), t0, barDur, {type:'sine', gain:(p.drone||0.12)*0.48, attack:2.2, release:2.6, cutoff:300});
  for(const off of [0,barDur*.5]) if(p.pulse) _mvoice(_mtof(root-24), t0+off, Math.min(1.1,barDur*.25), {type:'sine', gain:p.pulse, attack:0.025, release:0.55, cutoff:240});
  // faint airy chord pad, heavily filtered, entering at random offsets
  ints.forEach((iv,i)=>{ if(i===0||Math.random()<0.6) _mvoice(_mtof(root+iv), t0+Math.random()*0.8, barDur, {type:'triangle', gain:p.pad||0.032, attack:2.4, release:2.9, detune:(i-1)*5, cutoff:p.cutoff||850, q:0.4}); });
  // very sparse high shimmer — an occasional soft bell tone
  if(Math.random()<(p.shimmer||0.33)){ const deg=scale[6+Math.floor(Math.random()*(scale.length-6))];
    _mvoice(_mtof(deg+12), t0+barDur*0.3+Math.random()*barDur*0.4, 1.5, {type:'sine', gain:0.03, attack:0.35, release:1.3, cutoff:3000}); }
  if(Math.random()<(p.melody||0)){ const deg=scale[3+Math.floor(Math.random()*(scale.length-3))];
    _mvoice(_mtof(deg+12), t0+barDur*(0.12+Math.random()*0.65), .65, {type:'triangle', gain:.034, attack:.08, release:.7, cutoff:1800}); }
  MUSIC.bar++;
}
function _musicSched(){
  const ctx=MUSIC.ctx; if(!ctx||!MUSIC.playing) return;
  if(!SFX.on||!MUSIC.on||(SETTINGS.volume!=null&&SETTINGS.volume<=0)){ MUSIC.nextTime=Math.max(MUSIC.nextTime,ctx.currentTime+0.2); return; }   // muted: skip synthesis entirely
  while(MUSIC.nextTime < ctx.currentTime+0.6){ _scheduleBar(MUSIC.nextTime); MUSIC.nextTime+=MUSIC.barDur; }
}
function musicStop(){ MUSIC.playing=false; if(MUSIC.timer){ clearInterval(MUSIC.timer); MUSIC.timer=null; } }
// mode: 'ambient' = subtle in-game bed · 'ending' = the full naval score (win or defeat)
function musicPlay(mode){
  if(!SFX.ctx){ sfxInit(); if(SFX.ctx&&SFX.ctx.state==='suspended')SFX.ctx.resume(); }
  if(!SFX.ctx) return;
  musicStop(); MUSIC.bar=0; MUSIC.mode=mode;
  MUSIC.profile=musicProfileForCurrentMap(mode);
  MUSIC.level  = mode==='ambient' ? (MUSIC.profile.level||0.20) : 0.18;
  MUSIC.barDur = mode==='ambient' ? (MUSIC.profile.barDur||5.6)   : 3.4;
  MUSIC.ctx=SFX.ctx;
  if(!MUSIC.gain){ MUSIC.gain=MUSIC.ctx.createGain(); MUSIC.gain.connect(MUSIC.ctx.destination); }
  MUSIC.gain.gain.setTargetAtTime(((SFX.on&&MUSIC.on)?MUSIC.level:0)*(SETTINGS.volume!=null?SETTINGS.volume:1), MUSIC.ctx.currentTime, mode==='ambient'?1.6:0.35);
  MUSIC.playing=true; MUSIC.nextTime=MUSIC.ctx.currentTime+0.15;
  MUSIC.timer=setInterval(_musicSched, 200);
}
function musicStart(){ if(!MUSIC.playing) musicPlay('ambient'); }   // (kept for compatibility)
function playEndMusic(){ musicPlay('ending'); }                     // the score swells up when a battle ends — win or lose
function _dg(pos,maxD){ if(!pos||!camera) return 1; const d=camera.position.distanceTo(pos); return d>maxD?0:1-d/maxD; }
function _voice(t){ if(SFX.voices>14) return false; SFX.voices++; setTimeout(()=>{SFX.voices=Math.max(0,SFX.voices-1);}, t*1000); return true; }
function _noise(dur){ const s=SFX.ctx.createBufferSource(); s.buffer=SFX.noiseBuf; return s; }   // reuses the shared buffer
function weaponPersonality(w){
  w=w||{};const k=w.kind||'gun',d=w.dmg||12,cal=w.size||.5,n=(w.name||'').toLowerCase();
  if(w.nuclear||w.strategic)return {role:'strategic',tracer:0xfff3a6,trail:0.42,core:0xfffbda,flash:0xffe0a0,sound:'strategic'};
  if(/rail/.test(n)||d>=250)return {role:'rail',tracer:0x7ff0ff,trail:0.34,core:0xffffff,flash:0xa7f8ff,sound:'rail'};
  if(k==='missile')return {role:'missile',tracer:0xff6048,trail:0.30,core:0xfff0d0,flash:0xff7448,sound:'missile'};
  if(k==='torpedo')return {role:'torpedo',tracer:0x72d8ff,trail:0.16,core:0xdaf7ff,flash:0x72d8ff,sound:'torpedo'};
  if(k==='bomb')return {role:'mortar',tracer:0xffb25a,trail:0.31,core:0xffebc0,flash:0xff9b42,sound:'mortar'};
  if(k==='cannon'||d>=58||cal>=1.45)return {role:d>=115?'capital':'cannon',tracer:d>=115?0xff7d33:0xffb34d,trail:d>=115?.36:.29,core:0xfff0ca,flash:0xffa050,sound:d>=115?'capital':'cannon'};
  if(w.aa)return {role:'aa',tracer:0x79d8ff,trail:0.14,core:0xe8fbff,flash:0x8fe6ff,sound:'aa'};
  if(d>=28)return {role:'autocannon',tracer:0xffa14a,trail:0.17,core:0xfff2c0,flash:0xffbd5a,sound:'autocannon'};
  return {role:'mg',tracer:0xffdf78,trail:0.10,core:0xfff8d2,flash:0xffd66a,sound:'mg'};
}
function sfxFire(weapon,pos){
  if(!SFX.on||!SFX.ctx) return; const now=performance.now(); if(now-SFX.lastGun<26) return;   // global rate cap
  const w=typeof weapon==='string'?{kind:weapon}:weapon||{};
  const kind=w.kind||'gun', damage=w.dmg||12, caliber=w.size||0.5;
  const tone=weaponPersonality(w);
  const heavy=kind==='cannon'||damage>=58||caliber>=1.55, mid=kind==='missile'||kind==='bomb'||kind==='torpedo';
  const ctx=SFX.ctx, t0=ctx.currentTime;
  if(tone.sound==='rail'){
    const g0=_dg(pos,620)*0.62;if(g0<=0.02||!_voice(.36))return;SFX.lastGun=now;
    const snap=_noise(.028),hf=ctx.createBiquadFilter(),hg=ctx.createGain();hf.type='highpass';hf.frequency.value=3600;hg.gain.setValueAtTime(g0,t0);hg.gain.exponentialRampToValueAtTime(.001,t0+.028);snap.connect(hf);hf.connect(hg);hg.connect(SFX.master);snap.start(t0);snap.stop(t0+.03);
    const o=ctx.createOscillator(),og=ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(720,t0);o.frequency.exponentialRampToValueAtTime(90,t0+.2);og.gain.setValueAtTime(g0*.42,t0);og.gain.exponentialRampToValueAtTime(.001,t0+.24);o.connect(og);og.connect(SFX.master);o.start(t0);o.stop(t0+.25);return;
  }
  if(mid){ // missiles / torpedoes — a launch whoosh
    const dur=kind==='bomb'?0.18:kind==='torpedo'?0.28:0.24;
    const g0=_dg(pos,440)*(kind==='bomb'?0.22:0.34); if(g0<=0.02||!_voice(dur)) return; SFX.lastGun=now;
    const s=_noise(dur), f=ctx.createBiquadFilter(), g=ctx.createGain();
    f.type=kind==='bomb'?'lowpass':'bandpass'; f.frequency.setValueAtTime(kind==='torpedo'?210:kind==='bomb'?680:420,t0); f.frequency.exponentialRampToValueAtTime(kind==='torpedo'?620:kind==='bomb'?140:1500+Math.min(500,damage*6),t0+dur*.9);
    g.gain.setValueAtTime(g0,t0); g.gain.exponentialRampToValueAtTime(0.001,t0+dur);
    s.connect(f); f.connect(g); g.connect(SFX.master); s.start(); s.stop(t0+dur);
    if(kind==='missile'){ // ignition bite + rising booster, so missiles stop sounding like generic wind
      const crack=_noise(.055),cf=ctx.createBiquadFilter(),cg=ctx.createGain();cf.type='highpass';cf.frequency.value=1700;
      cg.gain.setValueAtTime(g0*.95,t0);cg.gain.exponentialRampToValueAtTime(.001,t0+.05);crack.connect(cf);cf.connect(cg);cg.connect(SFX.master);crack.start(t0);crack.stop(t0+.06);
      const o=ctx.createOscillator(),og=ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(90,t0+.02);o.frequency.exponentialRampToValueAtTime(310,t0+.22);
      og.gain.setValueAtTime(.0001,t0+.02);og.gain.exponentialRampToValueAtTime(g0*.28,t0+.055);og.gain.exponentialRampToValueAtTime(.001,t0+.24);
      o.connect(og);og.connect(SFX.master);o.start(t0+.02);o.stop(t0+.25);
    }
    return;
  }
  // gunfire = 10% SNAP · 80% BLAST · 10% RECOIL
  const aa=tone.role==='aa', mg=tone.role==='mg', auto=tone.role==='autocannon';
  const g0=_dg(pos,440)*(heavy?0.75:aa?0.3:mg?0.24:0.42); if(g0<=0.02||!_voice(heavy?0.4:mg?0.08:0.16)) return;
  SFX.lastGun=now; const dur=heavy?0.34:mg?0.07:auto?0.10:0.12;
  // --- SNAP: sharp opening transient ---
  { const s=_noise(0.02), f=ctx.createBiquadFilter(), g=ctx.createGain();
    f.type='highpass'; f.frequency.value=aa?3200:mg?4200:heavy?1250:Math.max(1700,3000-damage*26);
    g.gain.setValueAtTime(g0*0.55,t0); g.gain.exponentialRampToValueAtTime(0.001,t0+0.02);
    s.connect(f); f.connect(g); g.connect(SFX.master); s.start(t0); s.stop(t0+0.025); }
  // --- BLAST: full body, fast attack + downward filter sweep + low thump ---
  { const s=_noise(dur), f=ctx.createBiquadFilter(), g=ctx.createGain();
    f.type='lowpass'; f.frequency.setValueAtTime(aa?2600:mg?3200:heavy?1100+caliber*130:1800+Math.min(800,damage*22),t0); f.frequency.exponentialRampToValueAtTime(aa?900:mg?1200:heavy?140:360,t0+dur*0.8);
    g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(g0,t0+0.006); g.gain.exponentialRampToValueAtTime(0.001,t0+dur*0.85);
    s.connect(f); f.connect(g); g.connect(SFX.master); s.start(t0); s.stop(t0+dur);
    const o=ctx.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(heavy?Math.max(70,165-damage*.7):aa?380:mg?520:Math.max(150,290-damage*3),t0); o.frequency.exponentialRampToValueAtTime(heavy?38:aa?170:mg?220:80,t0+dur*0.7);
    const og=ctx.createGain(); og.gain.setValueAtTime(g0*(mg?0.35:0.85),t0); og.gain.exponentialRampToValueAtTime(0.001,t0+dur*0.8);
    o.connect(og); og.connect(SFX.master); o.start(t0); o.stop(t0+dur); }
  // --- RECOIL: brief mechanical tail ---
  { const rt=t0+dur*0.82, s=_noise(dur*0.25), f=ctx.createBiquadFilter(), g=ctx.createGain();
    f.type='bandpass'; f.frequency.value=heavy?300:520; f.Q.value=1.2;
    g.gain.setValueAtTime(0.0001,rt); g.gain.linearRampToValueAtTime(g0*0.3,rt+0.012); g.gain.exponentialRampToValueAtTime(0.001,rt+dur*0.22);
    s.connect(f); f.connect(g); g.connect(SFX.master); s.start(rt); s.stop(rt+dur*0.25); }
}
function sfxBoom(pos,scale){
  if(!SFX.on||!SFX.ctx) return; scale=scale||1; const g0=_dg(pos,820)*Math.min(1,0.45+scale*0.18); if(g0<=0.02||!_voice(0.6)) return;
  const ctx=SFX.ctx, dur=0.5+scale*0.12, t0=ctx.currentTime;
  const s=_noise(dur), f=ctx.createBiquadFilter(), g=ctx.createGain();
  f.type='lowpass'; f.frequency.setValueAtTime(900,t0); f.frequency.exponentialRampToValueAtTime(110,t0+dur);
  g.gain.setValueAtTime(g0,t0); g.gain.exponentialRampToValueAtTime(0.001,t0+dur);
  s.connect(f); f.connect(g); g.connect(SFX.master); s.start(); s.stop(t0+dur);
  const o=ctx.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(72,t0); o.frequency.exponentialRampToValueAtTime(26,t0+dur);
  const og=ctx.createGain(); og.gain.setValueAtTime(g0,t0); og.gain.exponentialRampToValueAtTime(0.001,t0+dur); o.connect(og); og.connect(SFX.master); o.start(); o.stop(t0+dur);
}
function sfxThunder(pos,scale=1){
  if(!SFX.on||!SFX.ctx) return; const g0=_dg(pos,1800)*Math.min(1,0.55+scale*.16); if(g0<=0.015||!_voice(1.8)) return;
  const ctx=SFX.ctx,t0=ctx.currentTime;
  // bright lightning crack
  { const s=_noise(.18),f=ctx.createBiquadFilter(),g=ctx.createGain();
    f.type='highpass';f.frequency.value=650;
    g.gain.setValueAtTime(g0*.45,t0);g.gain.exponentialRampToValueAtTime(.001,t0+.16);
    s.connect(f);f.connect(g);g.connect(SFX.master);s.start(t0);s.stop(t0+.18); }
  // rolling low thunder body
  { const dur=1.45+Math.random()*.55,s=_noise(dur),f=ctx.createBiquadFilter(),g=ctx.createGain();
    f.type='lowpass';f.frequency.setValueAtTime(360,t0+.04);f.frequency.exponentialRampToValueAtTime(65,t0+dur);
    g.gain.setValueAtTime(.0001,t0+.03);g.gain.exponentialRampToValueAtTime(g0*.9,t0+.18);g.gain.exponentialRampToValueAtTime(.001,t0+dur);
    s.connect(f);f.connect(g);g.connect(SFX.master);s.start(t0+.02);s.stop(t0+dur); }
  // sub-bass tail, felt more than heard
  { const o=ctx.createOscillator(),g=ctx.createGain(),dur=1.7;
    o.type='sine';o.frequency.setValueAtTime(48,t0+.05);o.frequency.exponentialRampToValueAtTime(24,t0+dur);
    g.gain.setValueAtTime(.0001,t0+.05);g.gain.exponentialRampToValueAtTime(g0*.55,t0+.22);g.gain.exponentialRampToValueAtTime(.001,t0+dur);
    o.connect(g);g.connect(SFX.master);o.start(t0+.05);o.stop(t0+dur); }
}
function sfxSplash(pos){
  if(!SFX.on||!SFX.ctx) return; const g0=_dg(pos,320)*0.16; if(g0<=0.02||!_voice(0.26)) return;
  const ctx=SFX.ctx, dur=0.24, t0=ctx.currentTime; const s=_noise(dur), f=ctx.createBiquadFilter(), g=ctx.createGain();
  f.type='bandpass'; f.frequency.setValueAtTime(2000,t0); f.frequency.exponentialRampToValueAtTime(500,t0+dur); f.Q.value=0.7;
  g.gain.setValueAtTime(g0,t0); g.gain.exponentialRampToValueAtTime(0.001,t0+dur);
  s.connect(f); f.connect(g); g.connect(SFX.master); s.start(); s.stop(t0+dur);
}
function sfxSonar(pos){
  if(!SFX.on||!SFX.ctx||!_voice(1.1))return;const ctx=SFX.ctx,t0=ctx.currentTime,g0=_dg(pos,1200)*0.42;if(g0<=.015)return;
  for(let i=0;i<3;i++){
    const t=t0+i*.34,o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();
    o.type='sine';o.frequency.setValueAtTime(i?620:520,t);o.frequency.exponentialRampToValueAtTime(i?430:360,t+.28);
    f.type='bandpass';f.frequency.value=i?610:500;f.Q.value=9;
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(g0*(i?0.18:0.34),t+.018);g.gain.exponentialRampToValueAtTime(.001,t+.42);
    o.connect(f);f.connect(g);g.connect(SFX.master);o.start(t);o.stop(t+.46);
  }
  const hull=_noise(.7),hf=ctx.createBiquadFilter(),hg=ctx.createGain();
  hf.type='lowpass';hf.frequency.setValueAtTime(180,t0);hf.frequency.exponentialRampToValueAtTime(55,t0+.65);
  hg.gain.setValueAtTime(g0*.08,t0+.05);hg.gain.exponentialRampToValueAtTime(.001,t0+.7);
  hull.connect(hf);hf.connect(hg);hg.connect(SFX.master);hull.start(t0);hull.stop(t0+.72);
}
function sfxAlarm(){ // police-siren style alert: urgent two-tone sweep for warnings/reinforcements
  if(!SFX.on||!SFX.ctx||!_voice(1.45)) return; const ctx=SFX.ctx, t0=ctx.currentTime, dur=1.25;
  const main=ctx.createOscillator(),alt=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();
  main.type='sawtooth';alt.type='triangle';f.type='bandpass';f.frequency.value=980;f.Q.value=2.2;
  g.gain.setValueAtTime(.0001,t0);g.gain.linearRampToValueAtTime(.22,t0+.04);g.gain.setTargetAtTime(.18,t0+.08,.12);g.gain.exponentialRampToValueAtTime(.001,t0+dur);
  const steps=[0,.28,.56,.84,1.12];
  steps.forEach((off,i)=>{const hi=i%2===0;main.frequency.linearRampToValueAtTime(hi?760:430,t0+off+.02);main.frequency.linearRampToValueAtTime(hi?430:760,t0+off+.26);alt.frequency.linearRampToValueAtTime(hi?960:540,t0+off+.02);alt.frequency.linearRampToValueAtTime(hi?540:960,t0+off+.26);});
  main.connect(f);alt.connect(f);f.connect(g);g.connect(SFX.master);main.start(t0);alt.start(t0);main.stop(t0+dur);alt.stop(t0+dur);
  const pulse=_noise(dur),pf=ctx.createBiquadFilter(),pg=ctx.createGain();
  pf.type='bandpass';pf.frequency.value=1350;pf.Q.value=.9;pg.gain.setValueAtTime(.065,t0);pg.gain.exponentialRampToValueAtTime(.001,t0+dur);
  pulse.connect(pf);pf.connect(pg);pg.connect(SFX.master);pulse.start(t0);pulse.stop(t0+dur);
}
function sfxClick(){ if(!SFX.on||!SFX.ctx||!_voice(0.08)) return; const ctx=SFX.ctx, t0=ctx.currentTime;
  const tick=_noise(.035),tf=ctx.createBiquadFilter(),tg=ctx.createGain();tf.type='bandpass';tf.frequency.value=1850;tf.Q.value=5;
  tg.gain.setValueAtTime(.09,t0);tg.gain.exponentialRampToValueAtTime(.001,t0+.032);tick.connect(tf);tf.connect(tg);tg.connect(SFX.master);tick.start(t0);tick.stop(t0+.04);
  const o=ctx.createOscillator(),g=ctx.createGain(); o.type='square'; o.frequency.setValueAtTime(210,t0+.012); o.frequency.exponentialRampToValueAtTime(85,t0+.075);
  g.gain.setValueAtTime(.0001,t0+.012);g.gain.linearRampToValueAtTime(.045,t0+.02);g.gain.exponentialRampToValueAtTime(.001,t0+.08); o.connect(g); g.connect(SFX.master); o.start(t0+.012); o.stop(t0+.085); }
function sfxEngine(){   // called each frame — picks the right continuous layer for what you're driving/flying
  if(!SFX.ctx||!SFX.gain) return;
  let rumble=0,rf=50, wind=0,wf=900, whine=0,whf=400, rotorNoise=0,rotorTone=0,rtf=58,rlf=11;
  if(phase==='play' && !gamePaused()){
    if(piloting){
      const def=piloting.plane.def, sp=Math.abs(piloting.speed||0), on=piloting.engineOn;
      if(def.heli){
        rotorNoise=on?0.024:0.006; rlf=(8.5+sp*0.045)*6;
        wind=0.003+sp*0.00008; wf=520+sp*3; rumble=on?0.012:0.004; rf=48+sp*0.2;
      } else if(def.shape==='jet'||def.jet){
        wind=(on?0.012:0.007)+sp*0.00016; wf=850+sp*5;
        whine=on?0.034:0.006; whf=300+sp*3.2; rumble=on?0.014:0.004; rf=68+sp*0.28;
      } else {
        wind=(on?0.008:0.005)+sp*0.00014; wf=720+sp*4.5;
        rumble=on?0.028:0.006; rf=62+sp*0.48; whine=on?0.008:0;
        whf=180+sp*1.2;
      }
    } else if(drivingTank){ rumble=0.045; rf=52+Math.abs(drivingTank.speed||0); }
    else if(driving){ rumble=0.027+Math.min(0.04,Math.abs(player.speed||0)*0.002); rf=42+Math.abs(player.speed||0)*0.7; }
    else { rumble=0.014; rf=40; }                                                                  // idle hum aboard
  }
  _ramp(SFX.gain.gain, rumble); _ramp(SFX.osc.frequency, rf);
  _ramp(SFX.windGain.gain, wind); _ramp(SFX.windFilt.frequency, wf);
  _ramp(SFX.whineGain.gain, whine); _ramp(SFX.whineOsc.frequency, whf);
  _ramp(SFX.rotorGain.gain, rotorNoise*0.36); _ramp(SFX.rotorDepth.gain, rotorNoise*0.36);
  // The tonal rotor layer sounded like an electronic whirr. Keep only filtered
  // rotor noise and its blade pulse, which reads as air and physical blades.
  _ramp(SFX.rotorToneGain.gain, 0); _ramp(SFX.rotorToneDepth.gain, 0);
  _ramp(SFX.rotorLFO.frequency, rlf);
  // Use the SAME test the visible rain uses. updateStormRain draws rain whenever weatherForce()
  // is >= 0.9 — storm, supercell AND tornado — while this asked for weather.type==='storm'
  // alone, so a supercell threw rain down the whole screen in complete silence.
  const storm=(phase==='play'&&typeof weatherForce==='function'&&weatherForce()>=0.9)?1:0;
  if(SFX.rainGain){
    const sea=(typeof weather==='object'&&weather.sea)?weather.sea:1;
    const target=storm?1:0, rate=storm?0.018:0.032;SFX.rainLevel+=(target-SFX.rainLevel)*rate;SFX.rainPhase+=0.016;
    const breathe=storm?(0.78+0.22*Math.sin(SFX.rainPhase*0.65)):1; // soft → loud → soft, never instant full rain
    const lvl=Math.max(0,Math.min(1,SFX.rainLevel))*breathe;
    _ramp(SFX.rainGain.gain, lvl*(0.03+Math.min(.025,sea*.007)));
    _ramp(SFX.rainLowGain.gain, lvl*(0.008+Math.min(.018,sea*.004)));
    _ramp(SFX.rainFilt.frequency, lvl?4200+lvl*1500+Math.random()*500:2600);
  }
  // Ocean ambience: present the whole time you are at sea, breathing on a slow swell, louder in
  // a heavy sea. The bow wash only opens up once the ship is actually making way, so speeding up
  // and slowing down is audible.
  if(SFX.seaGain){
    const seaState=(typeof weather==='object'&&weather.sea)?weather.sea:1;
    SFX.seaPhase+=0.016;
    const atSea=(phase==='play'&&!landCampaignMode)?1:0;
    const swell=0.72+0.28*Math.sin(SFX.seaPhase*0.21)+0.09*Math.sin(SFX.seaPhase*0.53);
    _ramp(SFX.seaGain.gain, atSea*swell*(0.016+Math.min(0.028,seaState*0.009)));
    _ramp(SFX.seaFilt.frequency, 430+seaState*90+swell*70);
    // Was min(1, speed/16), which saturates below every hull's cruising speed — so it sat pinned
    // at maximum whenever the ship was moving at all. Squared and referenced to a real turn of
    // speed, so idling whispers and only running flat out makes a wash you can hear.
    const rel=(atSea&&player&&!onFoot&&!piloting&&!drivingTank&&player.vel)?Math.min(1,player.vel.length()/24):0;
    _ramp(SFX.washGain.gain, atSea*rel*rel*0.012);
  }
}

