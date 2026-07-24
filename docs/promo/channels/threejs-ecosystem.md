# Iron Tide × three.js 生态发布包(r/threejs + discourse.threejs.org)


> **文件路径基准**：下面所有 `promo/...` 路径都相对于 **`/Users/longmao/projects/irontide/`**
> （不是仓库目录）。开始之前先执行一次，后面的路径就都能直接用：
>
> ```bash
> cd /Users/longmao/projects/irontide
> ```
>
> 物料在 `promo/`，文档在 `repo/docs/promo/`。物料不进版本库，用 `repo/tools/` 里的脚本重新生成。

本文档是一份**可直接复制粘贴**的发布材料。所有要贴到平台上的内容都是英文、放在代码块里(一键复制);操作说明是中文。

**隐私红线(每次发帖前默念一遍):**
- 永远不提孩子的真实姓名、年龄、城市、学校,不出现人脸。
- 只用「my kid」或 GitHub ID「VideoGameTips」指代孩子。
- 所有账号、所有帖子都由家长(你)出面。

**诚实红线:** 不编数字、不吹「best / revolutionary」、多人模式只能标注 experimental 或干脆不提。

---

## 0. 时间表(今天是 2026-07-24 周五)

| 时间 | 动作 |
|---|---|
| 今天(周五 7/24) | 视频已生成(`promo/assets/final/iron-tide-clip-20s.mp4`);注册 discourse.threejs.org 账号并浏览 10–15 分钟(提升新号信任等级,减少链接限制) |
| 今天或明天(7/24–7/25) | 提交 Discourse Showcase 帖。新用户首帖要过人工审核,周末可能慢,**预期 1–3 天才出现**,不要重复提交 |
| 下周二 7/28 北京时间 21:00–23:00(= 美东周二上午 9–11 点) | 发 r/threejs 帖。该版块受众集中在欧美工作日白天,周二上午是稳妥档 |
| 之后一周 | 每天看一次两边的回复,用第 4 节的模板回应 |

顺序上先发 Discourse 的原因:它有审核延迟,先提交让两个帖子上线时间接近;两边内容不同,不算刷屏。

---

## 1. 通用素材:30 秒视频录制

r/threejs 的展示视频(原生上传)效果最好,历史区间大约 15–107 个赞。Discourse 帖以截图为主,视频可选。

### 录制参数
- 浏览器全屏(Chrome),分辨率 1920×1080。
- Mac 录屏:`Cmd+Shift+5` 选「录制整个屏幕」,或用 OBS 录 60fps。
- **游戏声音打开**——音乐是 WebAudio 实时生成的,这本身就是卖点,标题里可以写 sound on。
- 游戏内画质设置调到最高档再录。
- 剪映/CapCut 里剪到 30 秒左右,导出 MP4(H.264, 1080p)。Reddit 原生上传上限很宽,但 30 秒内完播率最好。

### 30 秒分镜(shot list)
| 秒 | 画面 |
|---|---|
| 0–5 | 战列舰在海上,主炮齐射命中敌舰(最抓人的一幕放最前) |
| 5–10 | 动态天气下的海战(雨/雾),爆炸 + bloom 效果 |
| 10–15 | 切换到飞机,起飞、俯冲攻击 |
| 15–20 | 两栖坦克从海里开上岛滩,再切一个下车步战镜头 |
| 20–25 | 按 L 进照相模式,定格环绕一圈(黄昏 bloom 场景最好看) |
| 25–30 | 世界战役地图拉远,露出 31 个战区,最后 1–2 秒定格在游戏标题画面 |

不用每个都完美,凑齐「舰、机、坦、步、照相模式、地图」六个元素即可。

---

## 2. r/threejs 发帖(2026-07-28 周二,北京时间 21:00–23:00)

r/threejs(约 3.4 万订阅)没有严格的自我宣传限制,技术钩子最有效。

### 发帖步骤
1. 登录 Reddit(家长账号),进入 r/threejs,点 Create Post。
2. 选 **Images & Video** 标签页,上传剪好的 MP4。
3. 缩略图选主炮齐射那一帧。
4. 标题从下面两个里选一个(推荐 A,技术钩子在最前)。
5. 如果版块有 flair 可选,选 Showcase/Demo 类;没有就跳过。
6. **发布后立刻**发一条一楼评论,内容用下面的「一楼评论」代码块。(如果发帖界面允许视频帖带正文,就把同样内容贴进正文,一楼评论仍然发,方便别人引用。)

### 标题(二选一)

标题 A(技术钩子优先,推荐):

```
A 31-theater battleship campaign in a single ~800 KB index.html — three.js r128, no bundler, procedural WebAudio music, PWA [sound on]
```

标题 B(故事 + 技术):

```
My kid built a battleship campaign game in one index.html with three.js r128 — I maintain the polished fork. Here's 30 seconds of it [sound on]
```

### 一楼评论(发布后立刻贴)

````
Play (free, no account, no install, loads in seconds): https://game.boobank.com/irontide/

**Iron Tide** is a WWII-style naval campaign: you command a battleship across a 31-theater world campaign, and you can also fly planes, drive amphibious tanks, and fight on foot. There's a rival boss ("Grand Marshal Varga") with story radio dialogue, deck-mountable extra cannons, medals, 3-star theater ratings, quick battle and sandbox modes, dynamic weather, and a photo mode (L key).

Some tech notes, since this is r/threejs:

- **Single-file architecture.** Essentially the whole game lives in one ~800 KB `index.html` — no bundler, no framework, no build step. `three.min.js` (r128) and the official bloom example passes (EffectComposer / UnrealBloomPass etc.) are vendored locally.
- **Analytic island terrain.** Islands are rotated ellipses with sine-harmonic edge noise. The same pure functions generate the terrain mesh *and* answer height queries (`islandSurfaceY(pos, island)` → height or `null` for open water), so ship grounding, tank/plane collision and infantry walking never need a raycast. That math is extracted into its own file with Node unit tests.
- **Procedural music.** No audio files: each of the 31 theaters has its own music profile (scale + chord progression) synthesized live with WebAudio oscillators.
- **Adaptive quality.** A per-frame monitor scales quality (including toggling bloom) to hold frame rate; there are manual quality settings too.
- **PWA + inputs.** Installable (manifest + service worker), runs on desktop and mobile, with keyboard/mouse, gamepad, and touch controls. Bilingual English/中文.

Honest credit: the vast majority of the game — gameplay, campaign, systems — was designed and built solo by my kid (GitHub: VideoGameTips). I maintain a polished fork (bug fixes, i18n completion, onboarding, achievements, performance), with AI-assisted code review.

- Original repo (the kid's): https://github.com/VideoGameTips/irontide
- Polished fork (what's deployed): https://github.com/longmaolab/irontide

Happy to answer questions — and for deep engine questions I may relay them to the repo issues.
````

### 发完之后
- 前 2 小时尽量守着回复评论(Reddit 前几小时的互动决定帖子走势)。
- 不要请任何人去点赞,不要用小号,一切自然流量。

---

## 3. discourse.threejs.org Showcase 发帖(今天或明天提交)

背景:Showcase 分类的帖子**先审核后展示**;被展示的项目会进入 threejs.org 首页的候选池(首页约每半年刷新一次)。典型帖子 30–170 次浏览——这里图的不是流量,是进入 three.js 官方视野。

### 注册与准备
1. 打开 https://discourse.threejs.org → Sign Up。用户名建议 `longmaolab`(和 GitHub 一致,增加可信度),邮箱用你常用邮箱。
2. 注册后**先浏览 10–15 分钟**,点开几个 Showcase 帖读一读。Discourse 对全新账号有链接数量限制,浏览可以升到基础信任等级。
3. 如果发帖时提示「new users can only put N links in a post」:先删掉原始仓库那条链接发出去,等帖子过审后再用回复补上。

### 发帖表单字段
| 字段 | 填写值 |
|---|---|
| Category | **Showcase** |
| Title | 用下面的标题代码块 |
| Tags(可选) | `game`(如果输入时没有这个 tag 联想,留空即可,不要新造 tag) |
| 正文 | 用下面的正文代码块,然后把 `promo/assets/final/01-menu.png`、`final/02-combat-hud.png`、`final/03-broadside.png` 直接拖进编辑器的对应位置(正文里有 `[拖入截图]` 中文占位标记,贴完记得删掉占位行);30 秒 MP4 也可以试着直接拖入,若提示不支持就只留截图 |

### 标题

```
Iron Tide — a 31-theater battleship campaign in a single ~800 KB index.html (r128, no bundler)
```

### 正文(这是三个渠道里技术含量最高的一篇)

````
**Play (free, no account, no install):** https://game.boobank.com/irontide/

Iron Tide is a WWII-style naval campaign game: command a battleship through a 31-theater world campaign, fly planes, drive amphibious tanks, fight on foot, and mount extra cannons on your deck. There's a rival boss with story radio dialogue, medals and 3-star theater ratings, quick battle and sandbox modes, dynamic weather, a photo mode, and bilingual English/中文 UI.

[拖入截图 final/01-menu.png]

**Who made it (honest credit):** the vast majority of the game — gameplay, the whole campaign, the systems — was designed and built solo by my kid (GitHub: [VideoGameTips](https://github.com/VideoGameTips/irontide)). I'm the parent; I maintain a polished fork (bug fixes, i18n completion, onboarding, achievements, performance), with AI-assisted code review. This post is about the tech, because I think some of it is genuinely interesting.

## Architecture: one HTML file, no bundler

Essentially the entire game is a single ~800 KB `index.html`. `three.min.js` (r128) and the official example post-processing passes (EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, and their shaders) are vendored locally — no npm, no build step, and you can View Source the whole game. (There is one network fallback: if the local three.js hasn't defined `window.THREE` after ~2s, the page injects the cdnjs copy of r128 rather than showing a dead canvas. Normal loads never hit it.)

One deliberate exception: the island terrain math is extracted into a small `js/terrain.js` of pure functions, so it can be unit-tested in Node with a minimal `THREE.Vector3` stub.

## Analytic terrain height instead of raycasting

Islands are rotated ellipses with layered sine-harmonic edge noise. The same pure functions both generate the terrain mesh and answer "how high is the ground at (x, z)?" analytically:

```js
// null = open water at this (x,z); otherwise the terrain top height there
function islandSurfaceY(pos, o){
  if(!o) return null;
  const q = islandLocal(pos, o);                                    // rotate into island space
  if(o.r > 30 && islandLayerNorm(q, o, 0.43, 0.5) < 1) return 3.8;  // central jungle mound
  if(islandLayerNorm(q, o, 0.84, 0.15) < 1) return 2.1;             // grass table
  if(islandLayerNorm(q, o, 1.00, 0.00) < 1) return 1.3;             // beach
  return null;
}
```

`islandLayerNorm` evaluates the same edge-noise harmonics the mesh generator uses, so ship grounding, amphibious tank landings, plane crashes and infantry walking all query terrain height in O(1) per island — no raycasts against geometry anywhere in the movement code.

## Procedural per-theater music (no audio files)

There are zero music files. Each of the 31 campaign theaters has its own profile in a `MUSIC_PROFILES` table — scale plus chord progression — and the soundtrack is synthesized live from WebAudio oscillators. Battle vs. ambient states switch profiles. It keeps the whole game tiny and gives every theater its own mood.

## Adaptive quality + bloom

Bloom uses the vendored r128 `UnrealBloomPass`. A per-frame `updateAdaptiveQuality(rawDt)` watches the frame time and steps the quality level (including toggling bloom) to hold frame rate on weaker devices; there are manual quality settings too. That's what lets the same single file run on desktop and mid-range phones.

## Platform bits

- **PWA:** manifest + service worker, installable, loads in seconds.
- **Input:** keyboard/mouse, gamepad, and touch controls.
- **i18n:** English/中文 handled at the string boundary with a `t()` wrapper — a few hundred call sites, so the game logic never branches on language.

[拖入截图 final/02-combat-hud.png]
[拖入截图 final/03-broadside.png]

## Links

- Play: https://game.boobank.com/irontide/
- Original repo (the kid's): https://github.com/VideoGameTips/irontide
- Polished fork (what's deployed): https://github.com/longmaolab/irontide

Feedback very welcome — especially on the adaptive-quality approach, and from anyone who has migrated a large single-file r128 project to a current three.js release: advice appreciated, it's on the fork's roadmap.
````

### 审核期望
- 提交后帖子可能显示「pending review / awaiting approval」,**等 1–3 天**,周末更慢。
- 不要因为没出现就重发;想催的话可以在 3 天后礼貌地私信版主(站内 message 给 @mrdoob 以外的活跃版主,或发到 meta 类目问一句)。
- 过审后如果有人回复,当天回应最好。

---

## 4. 发帖后:英文回复模板

你能答的就自己答;答不了的技术问题,统一转到 fork 仓库的 issues。以下模板按场景取用。

**场景 1:太深的引擎/代码问题,答不上来**

```
Great question — that part is deeper in the engine than I can speak to off the top of my head. Would you mind opening an issue at https://github.com/longmaolab/irontide/issues? I'll dig into it there and reply with actual code references.
```

**场景 2:有人问「真的是小孩做的吗?」**

```
Fair question, and I want to be precise: the game itself — gameplay, the 31-theater campaign, the systems — was designed and built solo by my kid (GitHub: VideoGameTips; the original repo's history is public). What I did as the parent is the polished fork: bug fixes, finishing the i18n, onboarding, achievements, and performance work, with AI-assisted code review. So the game is the kid's; the polish pass is mine. For privacy reasons I won't share anything identifying about them.
```

**场景 3:有人问多人模式**

```
There is a very early multiplayer prototype in the codebase, but it's experimental — I don't want to oversell it. The shipped game is the single-player campaign, quick battle, and sandbox modes.
```

**场景 4:有人问为什么用 r128 这么老的版本**

```
Honest answer: r128 is what the game was originally built on, and the single-file no-bundler architecture made "just keep the vendored lib" the path of least resistance. Migrating to a current release is on the fork's roadmap — if you've done a large r128 → modern migration, I'd genuinely love pointers.
```

**场景 5:有人报 bug**

```
Thanks for the report! Could you file it at https://github.com/longmaolab/irontide/issues with your device/browser and what happened? That's the fork where fixes land, and I'll follow up there.
```

**场景 6:单纯的夸奖/鼓励**

```
Thank you — I'll pass that along to the kid. Comments like this are exactly why I posted.
```

隐私提醒:任何人追问孩子的年龄、地区、上什么学,一律用场景 2 模板最后那句挡回去,不解释更多。

---

## 5. 未来冲击 threejs.org 首页的加分项

首页项目从 Showcase 里选,约每半年刷新一次。现在发帖就是「入池」,以下是能提高被选中概率的事(按性价比排序):

1. **升级 three.js 版本。** 首页倾向展示技术上「现在时」的项目,r128 是 2021 年的版本。把 fork 迁到近期 release 是最大的单项加分,而且正好可以在论坛帖里更新进展(「we migrated from r128 to rXXX, here's what broke」这种跟帖本身就很受欢迎)。
2. **保持论坛帖活跃。** 版主选项目时会看帖子:及时回复、贴更新截图、发 changelog 式跟帖。一个持续更新的帖子比一个发完就沉的帖子显眼得多。
3. **首屏 10 秒的观感。** 评审者只会点开玩几十秒:确保加载快、默认画质在普通电脑上就好看、手机打开不翻车、console 里没有报错刷屏。
4. **一张高质量预览图。** 首页是缩略图墙,准备一张构图干净的横版截图(黄昏 bloom 海战那种),同时设置好页面的 Open Graph 预览图。
5. **持续的公开开发痕迹。** 仓库有规律的 commit、issue 有回应、README 里有截图和清晰的 tech 段落——版主核实项目时看的就是这些。
6. **别做的事:** 不要刷数据、不要反复发新帖顶曝光、不要私信轰炸版主。这个社区很小,口碑就是一切。
