// ===== LEADERBOARD CALLSIGNS — the only "name" the leaderboard ever stores =====
//
// WHY A WORDLIST INSTEAD OF A NAME BOX
// This is a children's game. A free-text nickname field would mean (a) storing something
// a kid might type their real name into, and (b) running a profanity filter forever.
// Picking two words out of fixed lists makes both problems structurally impossible:
// the server stores two array indexes, so the set of names that CAN exist is exactly
// the 48 x 40 grid below. There is no input to sanitize because there is no input.
//
// Loaded in the browser by a <script> tag (no module system — same arrangement as
// js/terrain.js) and required directly by server-leaderboard/, so both sides read the
// SAME file. If they ever diverged, index 12 would mean one word to the client and a
// different word to the server; tests/lb-drift.test.js exists to make sure they can't.

var CALLSIGN_ADJ = [
  { en: 'Brave',     zh: '勇敢' }, { en: 'Swift',     zh: '迅捷' },
  { en: 'Iron',      zh: '钢铁' }, { en: 'Silent',    zh: '沉默' },
  { en: 'Golden',    zh: '金色' }, { en: 'Storm',     zh: '风暴' },
  { en: 'Deep',      zh: '深海' }, { en: 'Bright',    zh: '明亮' },
  { en: 'Bold',      zh: '大胆' }, { en: 'Steady',    zh: '沉稳' },
  { en: 'Fearless',  zh: '无畏' }, { en: 'Clever',    zh: '机灵' },
  { en: 'Mighty',    zh: '强大' }, { en: 'Nimble',    zh: '敏捷' },
  { en: 'Noble',     zh: '高贵' }, { en: 'Shining',   zh: '闪耀' },
  { en: 'Thunder',   zh: '雷霆' }, { en: 'Frost',     zh: '霜寒' },
  { en: 'Crimson',   zh: '绯红' }, { en: 'Azure',     zh: '蔚蓝' },
  { en: 'Emerald',   zh: '翠绿' }, { en: 'Silver',    zh: '白银' },
  { en: 'Northern',  zh: '北境' }, { en: 'Southern',  zh: '南疆' },
  { en: 'Eastern',   zh: '东海' }, { en: 'Western',   zh: '西洋' },
  { en: 'Ancient',   zh: '远古' }, { en: 'Lucky',     zh: '幸运' },
  { en: 'Wandering', zh: '漂泊' }, { en: 'Roaring',   zh: '咆哮' },
  { en: 'Gentle',    zh: '温和' }, { en: 'Sharp',     zh: '锋利' },
  { en: 'Loyal',     zh: '忠诚' }, { en: 'Restless',  zh: '不息' },
  { en: 'Patient',   zh: '耐心' }, { en: 'Rapid',     zh: '湍急' },
  { en: 'Quiet',     zh: '安静' }, { en: 'Radiant',   zh: '璀璨' },
  { en: 'Stalwart',  zh: '坚毅' }, { en: 'Tidal',     zh: '潮汐' },
  { en: 'Polar',     zh: '极地' }, { en: 'Jade',      zh: '碧玉' },
  { en: 'Misty',     zh: '迷雾' }, { en: 'Shadow',    zh: '暗影' },
  { en: 'Amber',     zh: '琥珀' }, { en: 'Granite',   zh: '花岗' },
  { en: 'Sunlit',    zh: '阳光' }, { en: 'Moonlit',   zh: '月光' },
];

var CALLSIGN_NOUN = [
  { en: 'Gull',      zh: '海鸥' }, { en: 'Whale',     zh: '巨鲸' },
  { en: 'Anchor',    zh: '船锚' }, { en: 'Compass',   zh: '罗盘' },
  { en: 'Harbor',    zh: '港湾' }, { en: 'Tide',      zh: '浪潮' },
  { en: 'Reef',      zh: '暗礁' }, { en: 'Wave',      zh: '浪涛' },
  { en: 'Current',   zh: '洋流' }, { en: 'Lantern',   zh: '桅灯' },
  { en: 'Keel',      zh: '龙骨' }, { en: 'Mast',      zh: '桅杆' },
  { en: 'Sail',      zh: '风帆' }, { en: 'Helm',      zh: '舵轮' },
  { en: 'Beacon',    zh: '灯塔' }, { en: 'Dolphin',   zh: '海豚' },
  { en: 'Albatross', zh: '信天翁' }, { en: 'Petrel',  zh: '海燕' },
  { en: 'Marlin',    zh: '旗鱼' }, { en: 'Kraken',    zh: '海怪' },
  { en: 'Narwhal',   zh: '独角鲸' }, { en: 'Orca',    zh: '虎鲸' },
  { en: 'Seal',      zh: '海豹' }, { en: 'Otter',     zh: '海獭' },
  { en: 'Crab',      zh: '螃蟹' }, { en: 'Starfish',  zh: '海星' },
  { en: 'Coral',     zh: '珊瑚' }, { en: 'Pearl',     zh: '珍珠' },
  { en: 'Conch',     zh: '海螺' }, { en: 'Trident',   zh: '三叉戟' },
  { en: 'Spyglass',  zh: '望远镜' }, { en: 'Prow',    zh: '船艏' },
  { en: 'Rudder',    zh: '尾舵' }, { en: 'Voyage',    zh: '航程' },
  { en: 'Horizon',   zh: '天际' }, { en: 'Monsoon',   zh: '季风' },
  { en: 'Typhoon',   zh: '台风' }, { en: 'Squall',    zh: '骤风' },
  { en: 'Cutter',    zh: '快艇' }, { en: 'Fjord',     zh: '峡湾' },
];

// Is this pair one the wordlist can actually produce? The server calls this on every
// submission — it is the whole reason a bad word can never reach the board.
function callsignValid(a, b) {
  return Number.isInteger(a) && Number.isInteger(b) &&
         a >= 0 && a < CALLSIGN_ADJ.length &&
         b >= 0 && b < CALLSIGN_NOUN.length;
}

function randomCallsign() {
  return { a: Math.floor(Math.random() * CALLSIGN_ADJ.length),
           b: Math.floor(Math.random() * CALLSIGN_NOUN.length) };
}

// 1920 pairs is plenty of variety but nowhere near collision-proof once a few dozen
// captains show up, so the board also shows a short tag derived from the player's own
// random id. FNV-1a because it has to produce the same 4 characters in the browser and
// in Node without pulling in a crypto dependency on either side.
function callsignTag(playerId) {
  var h = 0x811c9dc5;
  var s = String(playerId || '');
  for (var i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return ('000' + h.toString(16).toUpperCase()).slice(-4);
}

function callsignText(a, b, zh, playerId) {
  if (!callsignValid(a, b)) return zh ? '无名舰长' : 'Unknown Captain';
  var adj = CALLSIGN_ADJ[a], noun = CALLSIGN_NOUN[b];
  var name = zh ? (adj.zh + '的' + noun.zh) : (adj.en + ' ' + noun.en);
  return playerId ? (name + ' #' + callsignTag(playerId)) : name;
}

// Node test harness + leaderboard server support; a no-op inside a browser <script>.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CALLSIGN_ADJ, CALLSIGN_NOUN, callsignValid, randomCallsign, callsignTag, callsignText };
}
