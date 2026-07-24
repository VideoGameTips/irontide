# Iron Tide — CrazyGames Basic Launch 提交套件


> **文件路径基准**：下面所有 `promo/...` 路径都相对于 **`/Users/longmao/projects/irontide/`**
> （不是仓库目录）。开始之前先执行一次，后面的路径就都能直接用：
>
> ```bash
> cd /Users/longmao/projects/irontide
> ```
>
> 物料在 `promo/`，文档在 `repo/docs/promo/`。物料不进版本库，用 `repo/tools/` 里的脚本重新生成。

> 生成日期:2026-07-24(周五)。所有需要粘贴到平台的文字都在代码块里(英文),直接整块复制即可。
> 隐私口径:全程用家长账号操作。**名字可以公开**;**不公开**年龄、城市、学校、照片/语音、私人邮箱。署名用 `longmaolab`(家长)和 GitHub handle `VideoGameTips`(孩子)。

---

## 0. 一页速览

| 事项 | 内容 |
|---|---|
| 平台 | developer.crazygames.com(开放注册,免费,**非独占**——自家 game.boobank.com 照常运营) |
| 提交类型 | **Basic Launch**(SDK 可选、无需广告接入;通过 QA 后进入约两周的限量测试) |
| 提交身份 | **单机游戏**(联机是实验性的,且 CrazyGames 对多人游戏有额外要求——专用构建里隐藏联机入口) |
| 构建体积 | 实测约 **1.4MB / 11 个文件**,远低于 250MB/1500 文件上限;低于 20MB → 有资格出现在**移动端首页** |
| 官方硬指标 | 初始下载 ≤50MB;进入 gameplay ≤20 秒(Iron Tide 秒级加载,轻松达标) |
| 封面(必需) | 3 张:16:9(1920×1080)、2:3(800×1200)、1:1(800×800),图上只能有游戏名 |
| 视频 | **必需**——横屏 + 竖屏两条预览视频。已生成好:`promo/assets/final/cg-preview-landscape-1920x1080.mp4`(1920×1080)和 `cg-preview-portrait-720x1080.mp4`(720×1080),各 18 秒、**无音轨**、无鼠标指针、无 logo、无促销文字 |

**建议时间表**(今天 2026-07-24 周五):

| 日期 | 做什么 |
|---|---|
| 7/25(六) | 跑 §1.1 构建脚本 + §1.2–1.5 自检;手机真机测触屏 |
| 7/26(日) | 做 3 张封面(§1.6);注册开发者账号(§2.1) |
| **7/27(一)** | **填表提交**(§2.2–2.3)——工作日提交,QA 响应更快 |
| 之后 | QA 反馈通常几个工作日到两周,以后台消息为准;若在 8 月初获批,两周测试大约 8 月中旬结束,届时看数据(§5) |

---

## 1. 提交前技术清单

### 1.1 生成 CrazyGames 专用构建(一键脚本)

**不要**直接上传 `promo/builds/irontide-portal-singleplayer.zip`——那是通用 Web 包。CrazyGames 包需要 4 处改动:

1. **隐藏主菜单 MULTIPLAYER 按钮**(以单机身份提交;多人游戏会触发"即时匹配 + 邀请链接"等额外 UX 审核要求)
2. **去掉 service worker 注册**(`index.html` 约 10497–10499 行)——游戏托管在 CrazyGames 的 CDN 上,SW 缓存会导致以后更新版本时玩家拿到旧包,而且在 iframe/跨域环境下没有收益,只有风险
3. **去掉 PWA manifest 链接**(第 7 行)——iframe 里不需要,避免无意义的安装提示与 404
4. **战报 PNG 水印去掉自家域名**(约 8560 行的 `game.boobank.com/irontide`)——平台不允许把玩家往站外导流

CrazyGames 专用的构建包**已经做进标准构建脚本**了，不用手工存 shell 脚本：

```bash
cd /Users/longmao/projects/irontide/repo
node tools/build-portal.js
node tools/verify-portal-build.js
```

产出 `promo/builds/irontide-crazygames.zip`。它在单机版的基础上又去掉了三样 CrazyGames 会介意的东西：

- **战报 PNG 的站外域名水印**（`⚓ IRON TIDE · game.boobank.com/irontide` → `⚓ IRON TIDE`）——平台不允许把玩家导流到站外
- **PWA manifest 链接**——iframe 里装不上，留着只会产生无意义的安装提示和 404
- **Open Graph 标签**——指向我们自己的域名，在嵌入场景里没有意义

提交时用 `irontide-crazygames.zip`，**不要**用 `irontide-itch.zip`（那份保留了水印和 OG 标签，是给 itch.io 的）。

> 脚本里每处替换都有 `assert`,如果上游 `index.html` 以后改了这些行,脚本会报错而不是静默漏改——重新提交新版本前重跑一遍即可。

### 1.2 构建自检清单(逐项打勾)

- [ ] `index.html` 位于 **zip 根目录**(CrazyGames 要求)
- [ ] zip 总大小约 1.4MB、约 11 个文件(上限 250MB / 1500 文件;<20MB 才有移动端首页资格——达标)
- [ ] 所有资源引用均为**相对路径**(`vendor/…`、`js/…`、`icons/…`——已确认,官方明确禁止绝对路径)
- [ ] 主菜单**看不到** 🌐 MULTIPLAYER 按钮
- [ ] `vendor/three.min.js` 在包内(代码里有 cdnjs 兜底,只在本地文件缺失约 2 秒后才触发;文件在包内就永远不会发起该外部请求)
- [ ] 包内**没有** `sw.js` 和 `manifest.json`
- [ ] DevTools Application 面板确认没有 service worker 注册
- [ ] 首次打开无红色报错(Console 干净)

### 1.3 iframe 本地测试(CrazyGames 就是用 iframe 嵌你的游戏)

存为 `promo/builds/iframe-test.html`:

```html
<!doctype html><meta charset="utf-8"><title>iframe test</title>
<style>body{margin:0;background:#111}iframe{width:100vw;height:100vh;border:0}</style>
<iframe src=".stage/irontide-crazygames/index.html"
        allow="fullscreen; autoplay; gamepad; pointer-lock"></iframe>
```

然后:

```bash
cd /Users/longmao/projects/irontide/promo/builds && python3 -m http.server 8080
# 浏览器打开 http://localhost:8080/iframe-test.html
```

在 **iframe 内**逐项验证:

- [ ] 菜单立即出现,点开始能进入战斗
- [ ] **指针锁定**正常(登岸步战 / 炮位瞄准时鼠标不会跑出 iframe)
- [ ] 存档(localStorage)正常写入、刷新后还在(跨域 iframe 下存档与自家站是隔离的,属正常现象)
- [ ] 声音在**第一次点击后**正常响起(浏览器 autoplay 策略;不能一加载就有声)
- [ ] 手柄在 iframe 里可用
- [ ] Tab 商店、F 装炮、L 拍照模式都正常
- [ ] 非中文浏览器下默认显示英文界面

最后一道保险:游戏上传到开发者后台后,**先用后台自带的预览工具**在他们的真实环境里跑一遍,再点提交。

### 1.4 真机触屏测试(勾选 mobile 前必做)

- [ ] Chrome DevTools 设备模式先过一遍(横屏 iPhone/Android 尺寸)
- [ ] **真机**横屏实测:虚拟摇杆、开火、上炮位/开飞机/上坦克按钮都可用
- [ ] 无双击放大、无长按弹出系统菜单(代码里已有 `touch-action:none` / `user-select:none`,真机确认即可)
- [ ] 帧率可玩(游戏自带画质档位 + 自适应画质,低端机会自动降档)
- [ ] **如果真机测试不满意:提交时不勾 mobile,先只上 desktop**——移动端 QA 更严,desktop 先过审、mobile 以后加,比一起被拒好

### 1.5 首屏加载与外部请求

- [ ] DevTools Network 面板 + "Fast 3G"节流:从打开到主菜单 **<10 秒**(官方 QA 红线是进入 gameplay ≤20 秒;1.4MB 的包即使 3G 也只要几秒)
- [ ] Network 面板确认**零外部请求**:没有对 `game.boobank.com`、GitHub、统计服务的任何请求;唯一允许出现的是 cdnjs 兜底(正常情况下不该触发,见 §1.2)
- [ ] Performance 面板开 4× CPU 节流跑一场战斗(官方要求在 4GB 内存的 Chromebook 上流畅)

### 1.6 封面图(必需 3 张,**已生成**)

官方规则:必须 3 张——16:9(1920×1080)、2:3(800×1200)、1:1(800×800);图上**只能出现游戏名**(不准写 "New / Play now" 之类的促销文字);不要边框、不要 logo、不要模糊;不要直接用原始截图,要有海报感;三张视觉风格必须一致。

三张都已按这个规则做好(只叠游戏名、压暗四周做出海报感、同一套排版):

```
promo/assets/final/cover-cg-landscape-1920x1080.png   # 16:9  白天舷侧齐射
promo/assets/final/cover-cg-portrait-800x1200.png     # 2:3   夜战月光
promo/assets/final/cover-cg-square-800x800.png        # 1:1   追尾视角对轰
```

想重做:`node tools/render-covers.js`(排版和规格都在脚本里,改文案改脚本即可)。

⚠️ 注意别传错文件:`promo/assets/final/` 里还有 `cover-itch-titled-*`、`cover-social-*` 等,那几张**带 tagline 文字**,是给 itch.io 和社交分享用的,传给 CrazyGames 会因为"封面上有额外文字"被打回。

---

## 2. 提交流程逐步指南

### 2.1 注册开发者账号(约 5 分钟)

1. 打开 `https://developer.crazygames.com`,点 Sign up
2. 用家长邮箱 `etcchainroot@gmail.com` 注册(**家长注册、家长操作**)
3. 开发者/工作室名填:

```
longmaolab
```

4. 资料里不填孩子的年龄、城市、学校、照片/语音和私人邮箱(名字与 GitHub handle 可以公开,见 §3.4);如有个人网站字段,可填 `https://longmaolab.github.io`

### 2.2 表单字段对照表

> 后台表单措辞可能与下表略有出入,按语义对应填写即可。所有值直接复制。

| 字段 | 填什么 |
|---|---|
| Game name | `Iron Tide` |
| Slug / URL(如有) | `iron-tide` |
| Category | `Action`(理由:海战+载具+步战的动作游戏。若下拉有 Shooting 也可作次选。**不要选 .io 或 Multiplayer**——我们以单机身份提交) |
| Tags | 在标签选择器里挑最接近的:`battleship` `naval` `war` `ship` `3d` `tank` `airplane` `open world` `military` `singleplayer`(能选几个选几个,优先前面的) |
| Description | 复制 §3.1 |
| Controls | 复制 §3.2 |
| Supported devices | Desktop ✔;Mobile 仅在 §1.4 真机测试通过后勾选 |
| Orientation(如有) | `Landscape` |
| Multiplayer? | `No`(本次提交为单机构建,联机入口已移除) |
| Ads / In-app purchases | `No` / `No` |
| 年龄/内容问卷 | 按 §3.3 的事实回答:风格化军事战斗,无血腥、无脏话、无性内容、无赌博 |
| SDK integration | Basic Launch 可选——**首次提交先不接**,保持零外部依赖;Full Launch 时再接(§5) |
| Build | 上传 `promo/builds/irontide-crazygames.zip`(已剥离 service worker、隐藏联机入口、去掉站外水印与 manifest;iframe 内 11 项检查全绿) |
| Covers | 上传 §1.6 的三张图 |
| Video | 上传两条:`promo/assets/final/cg-preview-landscape-1920x1080.mp4` + `cg-preview-portrait-720x1080.mp4`(均已生成) |

### 2.3 上传与提交

1. Dashboard → **Submit / Add game**,按 §2.2 逐项填写
2. 上传 zip 后,**先用后台预览工具完整玩一局**(教程 → 第一场战斗 → 进港商店),确认与本地 iframe 测试一致
3. 检查三张封面显示无裁切
4. 点 Submit for review
5. 记录提交日期,之后留意后台消息(QA 反馈都在提交条目的消息线程里)

---

## 3. 英文文案总汇

### 3.1 游戏描述(Description 字段)

```
Command your own battleship in Iron Tide, a 3D naval action game that runs entirely in your browser.

Fight through a 31-theater world campaign against rival commander Grand Marshal Varga, who taunts you over the radio as the war unfolds. Between battles, dock in port to upgrade your ship and mount extra cannons anywhere on your deck.

You are never stuck at the helm: walk the deck, man the turrets yourself, take off in planes, drive amphibious tanks onto the beach, or grab a rifle and fight on foot to capture islands.

Also includes quick battles, sandbox maps, dynamic weather, procedural music that changes with every theater, 12 medals with 3-star theater ratings, a photo mode, adjustable graphics quality, and full gamepad and touch support. Playable in English and Chinese.
```

### 3.2 操作说明(Controls 字段)

```
Mouse + keyboard (gamepad and touch supported)

ON DECK
- WASD: walk, Mouse: look
- E: take the helm / man a turret / board a plane
- F: install a purchased cannon on your deck
- G: go ashore / return to ship
- Tab: armory (shop), H: harbor upgrades, N: world map
- R: sonar, V: drop mine, Z: damage control

AT THE HELM: W/S throttle, A/D rudder, T camera, E step away
TURRETS: Mouse aim, Left-click fire, E exit
PLANES: W/S throttle, A/D turn, Mouse pitch, Click guns, Space bombs, P parachute, E land
TANKS: W/S drive, A/D steer, Mouse aim, Click fire, E dismount
ON FOOT: WASD walk/swim, Click rifle, B build defenses, E board a tank
PHOTO MODE: L
```

### 3.3 内容分级/年龄问卷答复(按问卷勾选,如需文字说明用这段)

```
Iron Tide contains stylized military combat between ships, aircraft and tanks. There is no blood or gore, no profanity, no sexual content, no gambling and no drug references; destroyed vehicles sink or are removed and human injury is never depicted.

Two content notes so the rating is accurate. The game includes historically-named nuclear-capable aircraft and a one-way atomic strike drone whose blast clears a wide radius, and a small number of aircraft described as kamikaze airframes that damage a target by flying into it. These are abstract vehicle explosions with no human depiction. The game ships with a "Kid-safe (no nukes)" toggle in its settings panel that removes the nuclear payload aircraft and the missile silo structure; it is off by default, and we are happy to ship the portal build with it on by default if you prefer.
```

### 3.4 给审核/原创性问题的补充说明(如被问到出处、作者或原创性)

```
Iron Tide is an original, open-source game. It was designed and built by a young developer in our family (GitHub handle: VideoGameTips), who wrote the great majority of it solo — the gameplay, the 31-theater campaign, and the ship, plane, tank and infantry systems. I am the parent and handle maintenance — bug fixes, full English/Chinese localization, onboarding, achievements, and performance work, with AI-assisted code review. All code and assets are our own original work; the only third-party library is three.js (MIT license), bundled in the build. We hold all rights and are happy to verify ownership via our GitHub repository: https://github.com/VideoGameTips/irontide
```

---

## 4. QA 审核什么、常见拒绝原因与应对(中文)

**每一份提交都会被人工 QA,拒绝是常态,不是终点。** 被拒后可修改重交,消息线程里会写明原因。

### QA 会检查的点

1. **能不能玩**:上传的包在他们环境(iframe)里能否加载、进入 gameplay 是否 ≤20 秒、有无黑屏/报错
2. **质量线**(官方 quality 指南):有可跳过的新手引导、操作有提示、画面清晰无压缩瑕疵、音量一致、响应跟手
3. **移动端**(若勾选):触屏完整可玩、无双击放大、低端机不卡死
4. **内容**:分级问卷与实际内容一致;无版权素材、无山寨知名 IP、游戏名不与已有游戏混淆
5. **封面**:3 张齐全、尺寸对、只有游戏名、无边框、非原始截图
6. **导流**:游戏内不能有指向其它站点的链接/二维码/水印(§1.1 第 4 处改动就是为这条)

### 常见拒绝原因 → 应对

| 拒绝原因 | 应对 |
|---|---|
| "Quality below our bar" / 太简陋 | Iron Tide 系统深度足够,更可能是**第一印象**问题:确认默认画质在低端机不糊、菜单直接可玩、教程正常触发;针对反馈点改进后重交 |
| 移动端体验问题 | 修复后重交;短期修不好就**去掉 mobile 勾选**,以 desktop-only 重交,mobile 以后补 |
| 封面不合规(纯截图/多余文字/带边框) | 按 §1.6 重做,只保留 `IRON TIDE` 字样 |
| iframe 内黑屏/功能异常 | 用后台预览工具复现,对照 §1.3 逐项排查(十有八九是指针锁定或外部请求) |
| 与已有游戏相似/名称混淆 | 说明原创性(用 §3.4),附 GitHub 仓库 https://github.com/VideoGameTips/irontide 佐证开发历史 |
| 加载太慢 | 1.4MB 的包几乎不可能中招;若中招先查是否误触发了 cdnjs 兜底 |

### 重交流程

1. 按反馈修复 → 重跑 §1.1 脚本 → 后台上传新 zip
2. 在同一消息线程回复(模板):

```
Hi CrazyGames team,

Thank you for the review. We have addressed the feedback:

- [issue 1]: [what we changed]
- [issue 2]: [what we changed]

A new build has been uploaded. Please let us know if anything else needs attention.

Best regards,
longmaolab
```

3. 语气始终专业、就事论事;每轮只围绕反馈点改,不夹带大改动

---

## 5. 现实预期与 Full Launch 时机(中文)

### Basic Launch 到底给什么

- 通过 QA 后进入**约两周的限量测试**:游戏对部分真实玩家可见,平台记录数据
- **没有收入**——Basic Launch 阶段广告等变现是关闭的;这一步的价值是**真实玩家数据和曝光**,不是钱
- **非独占**:game.boobank.com、itch 等其它渠道完全不受影响

### 平台看的三个 KPI(官方口径)

| 指标 | 官方参考线 | Iron Tide 的形势 |
|---|---|---|
| 平均游玩时长 | 成功作品常见 10 分钟以上 | 有利:31 战区 campaign + 港口养成天然拉时长 |
| 次日留存 | 强势作品约 10–15% | 中性:取决于前几战的钩子(存档、三星、奖章都在帮忙) |
| 转化率(玩满 1 分钟) | 头部作品 80% 以上;加载 <10 秒、包 <20MB 加分 | 有利:1.4MB 秒开 + 可跳过教程;风险在系统多、上手信息量大 |

官方原话的意思是:这些 KPI 是"指南针,不是判决书"。两周测试更像一次免费的公开测试。

### 什么时候考虑 Full Launch / 接 SDK

- **触发条件**:两周测试 KPI 亮眼,或收到 CrazyGames 主动邀请
- **Full Launch 要求**:SDK 必接(初始化 + gameplay start/stop 事件 + 广告位事件);内容不超过 PEGI-12(无血腥、无粗口;但**必须如实申报**核打击载具与神风机——见 3.3,隐瞒被审出来比如实申报麻烦得多);初始下载 ≤50MB(1.4MB,符合);快速进入 gameplay(菜单即达,符合)
- **工作量预估**:单文件架构下接 SDK 大约百行以内的改动,放在 CrazyGames 专用构建里做,只改构建脚本、不影响仓库里的主版本
- **Full Launch 之后**才有广告分成——但先让数据说话,再决定投不投这份工

### 心态(写给你们俩)

上架 CrazyGames 本身就是一个正经的里程碑——一个孩子独立设计并写出主体、家长打磨细节的开源游戏,通过了商业平台的人工审核,被世界各地的真实玩家玩到。两周的数据无论好坏,都只是下一轮打磨的输入,不定义这个作品的价值。把 QA 反馈和玩家数据当成免费的专业陪练,一轮一轮改就是了。
