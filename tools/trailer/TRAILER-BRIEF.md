# Iron Tide 预告片制作 Brief

> 这份文档是给**执行方**（另一个 AI agent 或人）的完整工作说明。
> 目标：一支 20–25 秒的游戏预告片，替换掉第一次失败的那支。
>
> 交付物已有可运行的骨架，**不要从零开始**：`capture-shot.js`（采集）、`build-trailer.sh`（组装）、
> `check-quality.js`（自动质检）。
>
> **6 个镜头里的 01（开场）和 06（核爆爆点）已经拍通并通过质检**，剩下 02/03/04/05 照同样模式补完。
> 已完成的两个镜头是你的参照物：先跑一遍看效果，再动手写新的。

---

# 第一部分：给执行 agent 的 prompt

> 下面这段可以直接整块复制，作为交给执行模型的开场指令。

```
你要为一个叫 Iron Tide 的浏览器 3D 海战游戏做一支 20-25 秒的预告片。

游戏地址：https://game.boobank.com/irontide/
源码：index.html（单文件 835KB，用 Grep 定位，不要整个读）
工作目录：tools/trailer/

这里已经有一套跑通了的工具，你的工作是补完它，不是重写它：
  capture-shot.js    确定性逐帧采集（已跑通，01 号镜头已完成并通过质检）
  build-trailer.sh   组装成六个渠道规格（已跑通）
  check-quality.js   自动质检，10 项断言（已跑通，能正确抓出上一版的缺陷）

先读 TRAILER-BRIEF.md 全文，尤其是「第三部分：五个必须遵守的硬规则」和
「第五部分：上一次失败的量化诊断」——那些不是建议，是踩过的坑。

然后：
1. 跑 `node capture-shot.js --list` 看当前镜头清单
2. 跑 `node capture-shot.js 01-broadside` 和 `06-nuke`——这两个已经做好了，
   看它们的效果和代码，理解这套 rig 怎么用。**不要改这两个**，除非你能做得更好。
3. 按第四部分的分镜表补完 **02、03、04、05**。这几个的 stage() 里有 TODO 注释
   标出了需要你去源码里查的东西。04 号（坦克登陆）最难，预留最多时间。
4. 每拍完一个镜头，抽一帧看构图（Read 那个 PNG），不满意就调 camera 函数重拍。
   单个镜头 2 秒 ≈ 8 秒渲染（960x540 + GPU），迭代很便宜，多试几版构图。
5. 全部拍完后 `bash build-trailer.sh`，它会自动跑质检。
6. 质检必须全绿。全绿之后**你自己看一遍成片**——质检能证明技术没问题，
   不能证明好看。不好看就回到第 4 步。

约束：
- 启动浏览器**必须**带 `channel: 'chromium'`。少了它就是软件渲染，慢 8 倍还会被
  游戏的自适应画质关掉 bloom。脚本里有门禁会拦，但你自己也要知道为什么。
- 不要用 Playwright 的 recordVideo。它把 25fps 写死在源码里，没有配置项。
  上一版就是这么坏的，量化诊断在第二部分。
- 不要加 depth of field、motion blur、rack focus——这游戏的后处理只有 bloom，
  要不存在的效果只会浪费时间。
- 不要在开头放 logo 或标题卡。标题只在结尾出现 1.6 秒。
- 不要用旁白/语音。门户的预览视频是静音自动播放的，说出来的话等于没说。
  需要传达的信息必须是画面或屏幕上的短文字。
- 所有镜头必须是"玩家造成了某件事"的画面。纯风景镜头一律砍掉。
- 光照只用 tod 0.5（白天）或 tod 0.9（夜）。这游戏的天空是纯色，暖色黄昏会渲染成浑浊褐色。
```

---

# 第二部分：为什么第一版不行（两个层面都要修）

用户的评价是「有卡顿，也不够吸引人」。这是**两个独立的问题**，只修一个不会通过。

## 技术层面：卡顿

有**两个叠加的原因**，第二个是真正的根因，而且一行代码就能修。

### 根因 1：Playwright 的 `headless: true` 根本没有 GPU

这是最重要的发现。Playwright 1.49 之后，`headless: true` 启动的不是 Chromium 而是
`chromium_headless_shell`，**没有 GPU**，three.js 全靠 SwiftShader 软件光栅化。

实测对比（同一台 M4 Mac、同一个游戏、同一分辨率）：

| 启动方式 | WebGL renderer | 真实渲染帧率 |
|---|---|---|
| `chromium.launch({ headless: true })` | ANGLE (Google, **SwiftShader**) | **18 fps** |
| `chromium.launch({ headless: true, channel: 'chromium' })` | ANGLE (Apple, **Metal Renderer: Apple M4**) | **68 fps** |

加 `--use-angle=metal`、`--enable-gpu`、`--ignore-gpu-blocklist` 这些 flag **完全没用**——
唯一起作用的是 `channel: 'chromium'`（它指向真正的 Chromium 二进制而不是 headless shell）。

实际效果：同一个 2.2 秒镜头的渲染时间**从 63 秒降到 8 秒**。

`capture-shot.js` 现在有一道门禁：开拍前读 `UNMASKED_RENDERER_WEBGL`，
发现 SwiftShader 就直接报错退出，不会浪费十几分钟拍出一堆废帧。

### 根因 2：recordVideo 的 25fps 硬上限

量化诊断：

```bash
ffmpeg -i iron-tide-hero-45s.mp4 -vf mpdecimate -f null - 2>&1 | grep -oE 'frame=\s*[0-9]+' | tail -1
```

结果：**1490 帧里只有 240 帧是独立画面**，也就是有效帧率约 4.8fps，其余全是重复帧填充。
Playwright 的 `recordVideo` **把 25fps 和 1Mbit/s VP8 写死在源码里**，没有任何配置项
（维护者明确拒绝暴露）。它的帧对齐算法把每一帧的时间戳向下取整到 40ms 网格上：
落进同一格的帧被**直接丢弃**，空格则用**上一帧重复填充**。所以即使源是完美的 60fps，
输出也会是 1,1,2,1,1,2 这样不均匀的重复——本身就会抖。

再叠加根因 1 的软件渲染（真实约 5fps），每帧被复制四五次，就是我们看到的卡顿。

**顺带一个隐蔽后果**：游戏的 `updateAdaptiveQuality()` 检测到帧时间超过 30ms 持续 4 秒后，
会调用 `setGfxQuality(0)` **关掉 bloom**、降低 pixelRatio、并在屏幕上弹出「Performance mode」提示。
所以上一版极可能是在游戏最丑的画质模式下拍的，还可能拍进了性能警告浮层。

## 创作层面：不吸引人

上一版的主体是一个 14 秒的**慢速环绕**镜头。这个镜头同时犯了三个错，任何一个都足以让人划走：

1. **没有动词**。环绕展示的是"名词"（一艘船），不是"玩家能做什么"。观众看完不知道这是什么游戏。
2. **没有信息增量**。第 2 秒和第 12 秒传达的信息完全一样。
3. **恒速运动**。匀速环绕是程序化相机的视觉签名，真实镜头都有加减速。

Derek Lieu（业内最知名的独立游戏预告片剪辑师）明确点过这个模式：
"too many game trailers start with a series of shots where the camera slowly moves through
the environment"，观众无法判断类型，于是跳过。

---

# 第三部分：五个必须遵守的硬规则

这五条是研究了 Valve 的商店页指引、Derek Lieu 的预告片方法论、以及 CrazyGames/Poki 的
预览视频规范之后提炼的，**按重要性排序**。

## 规则 1：第一帧就必须是游戏，而且画面里正在发生事情

你没有 5 秒，你有**第 0 帧到第 2 秒**。Valve 自己的指引说在 Discovery Queue 里
"you may have less than 10 seconds to make an impression"；门户的预览视频是静音自动播放的，
**第一帧还会被抓成静态缩略图**。

所以：
- 不淡入。不放 logo。不放标题卡。不从菜单/UI 开始。
- 第一帧就要有：玩家的船 + 敌人 + 正在飞的曳光弹或正在爆的东西。
- `check-quality.js` 有一条断言专门守这个（测第一帧的亮度跨度）。上一版第一帧是**纯色 233**
  ——菜单加载时的空白帧，这是最糟的开场。

## 规则 2：信息顺序是「类型 → 钩子 → 内容」，永远不要反过来

- **类型**（0–2s）：这是一款海战游戏。用一个舰炮齐射的镜头说完。
- **钩子**（2–10s）：这游戏的特别之处是**你不只是指挥官，你可以离开舰桥**——
  自己往甲板上装炮、开飞机起飞、开坦克冲上海滩。这是别的海战游戏没有的。
- **内容**（最后）：31 个战区、29 艘战舰这些数字放最后，或者干脆不放。

绝对不要用"31 个战区！61 种飞机！"开场。观众还不知道这是什么游戏，数字对他没有意义。

## 规则 3：每个镜头都必须包含"玩家造成的状态变化"

这是最容易被违反的一条，因为拍风景比拍动作容易。判定标准很简单：
**这个镜头里有什么东西因为玩家的行为而改变了？** 答不上来就砍掉重拍。

具体到这个游戏，合格的状态变化：炮开火、敌舰被击中闪白、敌舰起火/下沉、
炮塔装到甲板上、飞机从甲板起飞、坦克从水里爬上沙滩、核爆。

不合格：船在海上开、镜头环绕船、日落很美、岛屿风景。

## 规则 4：HUD 保持开启（只留一个镜头例外）

反直觉但很关键：**HUD 是"这是真游戏"的证明**。门户和商店的用户能分辨营销渲染图和真实游戏画面，
而他们要看的是后者。Lieu 的 MVP 预告片配方明确要求 "raw gameplay footage with HUD/UI visible"。

`capture-shot.js` 的 `__cam({ hud: true })` 是默认。只在核爆那个镜头关掉 HUD 当纯视觉爆点。

**但要关掉这些干扰元素**（`__hideChrome()` 已经处理）：Claude 舰载 AI 的建议气泡
（`#claudeBubble`，会停在画面中左）、教学提示条、操作提示。

## 规则 5：镜头长度 0.7–2.0 秒，平均约 1.2 秒

网上常见的"每个镜头 3–5 秒"是给 90–180 秒 Steam 预告片的，**在 20 秒的片子里是错的**。
那条建议的理由是"人会拖动进度条，所以镜头要长到能被拖到中间还看得懂"——门户的自动播放循环里
不存在这个行为。

一支 22 秒的片子应该有 **10–14 个剪辑点**。`check-quality.js` 会断言至少 6 个剪辑、平均镜头短于 3 秒。

**剪在反应的峰值，不要等到结果落地。** Lieu 的说法是观众在
Read → React → Judge，最好的短片"cut off right after we react; there's no time for judgment"。
炮弹命中后闪白的那一瞬就切走，不要等船慢慢沉完。

---

# 第四部分：分镜表

总长 22 秒左右。结构用**因果接力 + 物理尺度递增**：每个镜头的结束动作动机化下一个镜头的开始，
同时每一刀都比上一刀更大，最后落在核爆上。

| # | 时长 | 内容 | 作用 | HUD | 状态 |
|---|---|---|---|---|---|
| 01 | 2.2s | 贴着自己战舰右舷向前推进，敌舰线已在开火，一艘中弹闪白/爆炸 | **类型**：一眼看出是海战。这是"oner"——一个不间断镜头里包含铺垫、冲突、结果 | 开 | ✅ **已完成并通过质检** |
| 02 | 1.6s | 甲板特写，一座炮塔被装上（Tab 军械库 → F 安装） | **钩子 1**：你能改装自己的船。这是最反常识的动词 | 开 | 需补完（TODO 在 stage 里） |
| 03 | 1.8s | 飞机从自己甲板起飞爬升，母舰留在画面里保持连续性 | **钩子 2**：你能离开这条船 | 开 | 需补完 |
| 04 | 2.0s | 两栖坦克从浅水爬上沙滩 | **钩子 3**：战线推到陆地。这是全游戏最出人意料的画面 | 开 | 需补完（**最难，预留时间**） |
| 05 | 2.4s | 低角度仰拍 Leviathan（148m 对你的 82m） | **威胁**：把体型差做成整个镜头的主题 | 开 | 需补完（TODO：怎么单独 spawn boss；记得 `__materialise()`） |
| 06 | 2.6s | 夜间，战略核弹命中，蘑菇云 + 冲击波环扫过海面 | **爆点**：在火球还在上升时切到标题卡 | **关** | ✅ **已完成并通过质检** |
| — | 1.6s | 标题卡（`../assets/final/cover-social-1280x720.png`） | 到这里观众才需要知道名字 | — | 组装脚本已处理 |

**如果时间只够做一半**：01 + 02 + 06 + 标题卡就已经是一支合格的 8 秒短片
（类型 + 钩子 + 爆点），比现在这支 48 秒的强得多。宁可短而完整。

## 每个镜头怎么摆位

`capture-shot.js` 里 `__placeEnemies()` 的**摆位规则**（上一版正是在这里翻的车）：

上一版把五艘敌舰放在很窄的方位扇形上、距离几乎相同、朝向全一致，渲染出来是
**地平线上一排均匀间隔的小灰块**——像调试场景，不像战斗。

正确做法：
- **距离要拉开**（80m–320m），让近处船体部分遮挡远处船体，这才有纵深
- **朝向各不相同**（给每个 spec 一个 `facing` 偏移），读起来是在机动而不是停着
- **开火时间错开**（`fireT` 递增），齐射才会重叠

## 相机语言对应到代码

| 电影术语 | 在这个 rig 里怎么写 | 注意 |
|---|---|---|
| dolly（推轨） | `camera(t)` 里让位置沿 `fwd`/`stbd` 线性移动 | **必须加 easing**：`window.easeOut(t/duration)` |
| orbit（环绕） | 位置绕 `player.pos` 转圈 | **慎用**。上一版死在这上面。只在有动作发生时用，且不超过 1.5 秒 |
| push in（推进） | 减小到目标的距离 | 配 `easeOut`，末端减速 |
| pan（摇） | 让 `look` 目标移动而 `pos` 不动 | |
| 焦段 | `__cam({ fov: N })` | 默认 40。**广角 72 是上一版敌舰变小点的原因**。想要压缩感用 35–45 |
| rack focus / 景深 / 运动模糊 | **做不到** | 后处理只有 bloom（`initPostFX` 里 AO 是硬关的）。别要 |

---

# 第五部分：技术方案（已验证）

## 采集：确定性逐帧，不要实时录制

核心思路是**把渲染速度从等式里拿掉**：夺走浏览器的渲染循环，手动按固定 dt 推进游戏自己的时钟，
渲染恰好一帧，截图，重复。页面渲染多慢都不影响输出——输出永远是完美的 60fps。

```js
window.requestAnimationFrame = () => 0;        // 让 loop() 不再自我调度
window.__step = (dt) => {
  t2 += dt;                                     // 游戏的虚拟时钟
  update(dt, t2);
  updateHUD();
  updateBanners(dt);
  if (composer && gfxQuality > 0) composer.render();
  else renderer.render(scene, camera);
};
```

**已实测**：132 帧的镜头经 `mpdecimate` 检验零重复帧（对比旧方案 1197 帧只有 277 独立）。

**渲染成本**（配上 `channel:'chromium'` 之后）：960×540 下 2.2 秒镜头约 **8 秒**渲染，
整支 22 秒的片子单次全量约 **1.5 分钟**。这个成本低到可以放心多迭代几版构图。
定稿时用 `W=1920 H=1080` 重跑一遍，想要抗锯齿再加 `SS=2`（2 倍超采样后由 ffmpeg 降采样，
对这种平面着色的细栏杆和曳光线提升明显，代价是每帧约 400ms）。

## 三个必须先关掉的东西

```js
// 0. 最重要的一条：启动时必须带 channel:'chromium'，否则没有 GPU
//    const browser = await chromium.launch({ headless: true, channel: 'chromium' });

// 1. 自适应画质——不关它会在慢渲染时自动关掉 bloom 并弹出性能提示
//    实测：软件渲染下 pixelRatio 已经被它降到 0.75，frameEMA 60.7ms
if (typeof setGfxQuality === 'function') setGfxQuality(2);
window.updateAdaptiveQuality = () => {};
renderer.setPixelRatio(1);

// 2. 广角镜头——72° 是敌舰变成小点的原因
camera.fov = 42; camera.updateProjectionMatrix();

// 3. 界面杂物——AI 气泡会停在画面中左
for (const id of ['claudeBubble','claudeMascot','tut','prompt']) {
  const el = document.getElementById(id); if (el) el.style.display = 'none';
}
```

**不要用 `togglePhotoMode()`** 进入自由相机——它会弹提示，并用 1400ms 的 `setTimeout` 隐藏 HUD，
在虚拟时钟下这个 timeout 可能永远不触发，也可能在镜头中间才触发。直接设 `photoMode = true`。

## 光照必须锁定，而且好看的值只有两个

`weather.tod` 会**自己走**（`dt/360`，一个完整昼夜约 6 分钟），天气类型还会重新随机，
所以一次性赋值撑不过一个镜头。用游戏自己的锁：

```js
window._MAP = Object.assign(window._MAP || {}, { weatherLock: true, weather: 'clear', tod: 0.5 });
weather.type = 'clear'; weather.tod = 0.5;
```

**这个游戏的天空是一整片纯色而不是渐变**，所以暖色黄昏渲染出来是浑浊的褐色，不是金色。
实测能用的只有两个值：

- `tod 0.50` — 最亮、视距最远。英雄镜头、需要当缩略图的镜头都用这个
- `tod 0.90` — 夜战：月光水面、星空，爆炸有东西可以 bloom

**要避开**：`0.16`（阴暗的黎明前，上一版误当成 golden hour 用了）、`0.25` / `0.75`（浑浊褐色）

## 四个游戏内部机制，不知道会白拍

这四条都是实际踩出来的，`capture-shot.js` 里的 `DIRECTOR` 块已经封装好了对应的 helper。

### 1. 远处的敌舰根本没有网格

`enemies` 数组里距离玩家超过约 4600 单位的船会被**卸载成点云代理**，`build === null`。
你把这样一条船摆进画面，得到的是**什么都没有**。必须调 `loadShipModel(ship)` 重建网格：

```js
window.__materialise(ship);      // 已封装：loadShipModel + 同步 group 位置/朝向
window.__freezeProxies();        // 并阻止代理系统在拍摄中途再把它卸载掉
```

`__placeEnemies()` 已经自动对每条船调用了这个。手工摆船时别忘了。

### 2. photoMode 给不了干净画面

它只设 `#hud{display:none}`。3D 的红/青三角目标标记还在场景里，
而 `updateFogOfWar()` **每一帧**都会把飞机标记重新显示出来。HUD-off 镜头需要：

```js
window.__hideMarkers();          // stub 掉 updateFogOfWar + 隐藏高于船体的标记
```

HUD-on 的游戏镜头**不要**调这个——那些标记是"这是真游戏"的一部分。

### 3. 爆炸半径会把玩家自己炸死，然后游戏回菜单

`blastAll(pos, 9999, 900, true, true)` 是全游戏最大的爆炸（战略核弹，
半径是原子无人机的 5 倍），但**半径 900 从任何可拍摄的距离都能覆盖到玩家**——
实测玩家被炸沉、战争结束、镜头后半段拍的是主菜单。

而且这个问题**帧唯一性检查抓不到**（菜单也在动）。所以 `capture-shot.js` 加了一条断言：
镜头结束时 `phase` 必须还是 `'play'`，否则报错退出。

正确做法是视觉和伤害分开：

```js
window.__strategicBlast(pos, 320);   // 放半径 900 的视觉，只击沉 320m 内的敌舰
```

### 4. fx 池有预算上限

爆炸特效走的是共享的 `fx` 数组。池子满了的时候大爆炸会被**吞掉**。
放大爆炸之前先清空：`while (fx.length) removeFxAt(0);`（`__strategicBlast` 里已经做了）。

### 5. 游戏自己的简报卡可以当标题卡

`#bannerCard` 是 `#hud` 的**子元素**，所以 photo mode 会把它一起藏掉。
把它 re-parent 到 `<body>` 就能在 HUD-off 的镜头里用游戏自己的简报卡样式做标题——
比外挂一张图更自然：

```js
window.__titleCard('OPERATION 31', 'THE LAST HARBOR');
```

### 6. 全局变量的作用域规则（写错了会静默失效）

- `let`/`const` 声明的（`photoMode`、`player`、`enemies`、`weather`、`camYaw`、`t2`…）
  **不在 `window` 上**。要写 `photoMode = true`，写 `window.photoMode = true` **什么都不会发生**。
- `function` 声明的（`updateAdaptiveQuality`、`flashPrompt`、`showBanner`、`loadShipModel`、
  `updateFogOfWar`…）**在 `window` 上**，所以可以 `window.xxx = () => {}` 打补丁，
  裸名调用会解析到你的替换版本。

## 一个致命陷阱：画面可能被弹窗完全遮住

`#story` 剧情弹窗**不会**被 `skipBanner()` 或 `skipTutorial()` 关掉，而 `showStory()` 还被战区简报复用，
所以它可能在拍摄中途重新出现。

调研过程中真的踩到了：一次采集 24 帧全部字节唯一（因为弹窗背后的游戏在微弱地动），
**帧唯一性检查通过了，但视频完全没用**——拍的全是弹窗。

**还有一个更隐蔽的**：`skipBanner()` 只能清掉**已经显示**的横幅。在 `startGame()` 之后
立刻调用它时，战区简报卡还在队列里没渲染，所以它会在稍后自己冒出来盖住画面——
上一版的简报卡截图就是这么来的。正确做法是在开战**之前**把源头 stub 掉：

```js
window.showBanner = () => {};      // 必须在 startGame() 之前
window.flashPrompt = () => {};     // 顺手把所有 toast 也关掉
```

所以 `capture-shot.js` 在开拍前会断言没有任何遮挡层，有就直接退出：

```js
const covering = await page.evaluate(() => { window.__hideChrome(); return window.__overlayClear(); });
if (covering.length) { /* abort with the list of covering elements */ }
```

**教训**：帧唯一性只能证明"画面在变"，不能证明"拍的是游戏"。两个都要查。

## 游戏的全局变量都在顶层作用域

`player`、`enemies`、`weather`、`photoMode`、`startGame`、`spawnEnemy`、`camera`、`renderer`、
`composer`、`t2`、`update` 全都是**裸的顶层绑定**，不在 `window` 上（唯一命名空间化的是 `window._MAP`）。
在 `page.evaluate()` 里直接写 `player.pos`，不要写 `window.player.pos`。

## 60fps 是必须的，因为特效只有 2–7 帧长

游戏的关键视觉效果是按 60fps 调的：炮口焰核心闪光 `life:0.09`（约 5 帧）、
命中闪白 `t=0.09`（约 5 帧）。上一版有效 4.8fps 时单帧长 208ms，
一次 90ms 的全船闪白会被采成"整艘船是纯白的"——那不是渲染 bug，是采样率太低。

---

# 第六部分：自动质检

```bash
node check-quality.js out/trailer-master-1080p.mp4
```

10 项断言，非零退出码表示不合格。它守的是：

| 断言 | 阈值 | 守的是什么 |
|---|---|---|
| 容器帧率 60 | ±0.5 | 采集和组装都得是 60 |
| **独立帧占比 ≥95%** | mpdecimate | **上一版的核心缺陷（当时只有 16%）** |
| 时长 15–30s | | 门户要 15–20s，YouTube 25–30s |
| 剪辑点 ≥6 | scdet | 单镜头长片=屏保 |
| 平均镜头 <3s | | 剪快一点 |
| **第一帧有内容** | 亮度跨度 >60 | 上一版第一帧是纯色 233 |
| 暗帧占比 <35% | 亮度 <24 | 夜景在自动播放缩略图里是一团泥 |
| 平均亮度 40–210 | | 过曝/过暗 |
| （采集侧）结束时 phase==='play' | capture-shot.js | 镜头没有中途回菜单 |
| （采集侧）无遮挡层 | capture-shot.js | 没拍成一整段弹窗 |
| （采集侧）GPU 不是 SwiftShader | capture-shot.js | 没在软件渲染下白拍 |
| 分辨率 1080p 或 720p | | 门户要求 |
| yuv420p | | 通用可播 |

**质检全绿之后必须自己看一遍。** 它能证明技术没问题，不能证明好看——
这是它做不到的事，也是唯一需要人（或有视觉判断的模型）的环节。

已验证质检有效：拿旧视频跑，正确报出 7 项失败并指出"只有 16% 独立帧"；
拿新镜头跑，相应项目通过。

---

# 第七部分：交付物与渠道规格

`bash build-trailer.sh` 一次生成全部：

| 文件 | 规格 | 给谁 |
|---|---|---|
| `trailer-master-1080p.mp4` | 1920×1080 60fps 含结尾标题卡 | itch.io、YouTube、Product Hunt |
| `cg-preview-landscape.mp4` | 1920×1080 **静音** ≤19.5s | CrazyGames（**必需**，横屏那条） |
| `cg-preview-portrait.mp4` | 720×1080 **静音** ≤19.5s | CrazyGames（**必需**，竖屏那条） |
| `reddit-clip.mp4` | 1080p 15s | Reddit 原生上传（短的完播率高） |
| `shorts-vertical.mp4` | 1080×1920 静音 | YouTube Shorts / TikTok（静音方便套热门原声） |
| `preview.gif` | 600px 7s | 论坛帖、README |

CrazyGames 的硬性要求（会被打回的那些）：**必须无声**、单条 ≤50MB、
长度别超 20 秒、首帧要能当封面、不要黑场/黑边、不要鼠标指针、不要 logo、不要促销文字。

---

# 附：文件清单

```
promo/trailer/
├── TRAILER-BRIEF.md      ← 这份文档
├── capture-shot.js       采集 rig（01 号镜头已完成，02-06 待补）
├── build-trailer.sh      组装成六个渠道规格
├── check-quality.js      10 项自动质检
├── frames/<shot>/        每个镜头的 PNG 序列（不进版本库）
└── out/                  成品（不进版本库）
```

参考资料（研究这份 brief 时的主要来源）：
Derek Lieu 的预告片方法论（derek-lieu.com，尤其是 "No Logo"、"The Editing Lessons of Vine"、
establishing shots 那几篇）、Valve 的 Steam 商店页素材指引、
CrazyGames 开发者文档的 Game covers / preview videos 章节、howtomarketagame.com。
