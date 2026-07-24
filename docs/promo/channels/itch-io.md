# Iron Tide — itch.io 发布全套材料(Launch Kit)


> **文件路径基准**：下面所有 `promo/...` 路径都相对于 **`/Users/longmao/projects/irontide/`**
> （不是仓库目录）。开始之前先执行一次，后面的路径就都能直接用：
>
> ```bash
> cd /Users/longmao/projects/irontide
> ```
>
> 物料在 `promo/`，文档在 `repo/docs/promo/`。物料不进版本库，用 `repo/tools/` 里的脚本重新生成。

> 生成日期:2026-07-24(周五)。所有英文文案可直接整块复制粘贴;中文部分是给你看的操作说明。
> **隐私口径**（家里 2026-07-24 定的）：**名字可以公开**，孩子署名自己的作品是应得的。**不公开**：年龄、城市、学校、真人照片/录音，以及私人邮箱。所有平台账号由家长注册和发言（Reddit/HN/PH/Discord 本身也要求 13+ 或成年）。名字 + 年龄 + 城市这个组合才是真正危险的，任何两项别同时出现。

---

## 建议时间表

| 时间 | 做什么 |
|---|---|
| **今天 7/24(周五)** | 注册账号 → 新建项目 → 按第 2 节逐字段填完 → 存为 **Draft** → 用 Draft 预览页实测游戏能玩 |
| **7/25(周六)上午** | 把 `promo/assets/final/iron-tide-hero-45s.mp4` 传到 YouTube(公开或不公开均可)→ 链接填进 itch 页面。**不用自己录**,第 6 节的 shot list 只在你想重录时才需要 |
| **7/25(周六)下午** | Visibility 改为 **Public** 正式发布 → 立刻发第 4 节的首篇 devlog |
| **7/27(下周一)起** | 按第 7 节做发布后动作;开始逛 itch.io/jams 找合适的 game jam(itch 的流量引擎是 jam,不是首页) |

选周六发布的原因:itch 浏览流量周末最高,而且浏览器可玩的游戏(我们就是)互动率约为下载游戏的 3 倍——发布后头两天正是被"Fresh Games"栏目扫到的窗口期。

---

## 0. 发布前物料清单

确认以下文件已就位:

- `promo/assets/final/01-menu.png` … `final/06-briefing.png`(截图 6 张)
- `promo/builds/irontide-itch.zip`(网页版构建包)
- 封面图:需要一张 **630×500**(最低 315×250)的 PNG。从 screenshot 里裁一张最有戏剧性的,或进游戏按 **L** 开拍照模式专门取景一张再裁
- 视频:`promo/assets/final/iron-tide-hero-45s.mp4`(**已生成**,48 秒;短版和竖版同目录)

**检查 zip 结构(关键)**:`index.html` 必须在 zip 的**根目录**,不能套一层文件夹。同包应含 `vendor/`、`manifest.json`、`sw.js`、`icons/`。验证命令:

```
unzip -l promo/builds/irontide-itch.zip | head
```

第一列文件里应直接看到 `index.html`,而不是 `irontide/index.html`。

> 技术备注:itch 用 iframe + 独立 CDN 域名跑 HTML 游戏,PWA 的 service worker 在里面注册会失败——**这是正常的、无害的**,游戏照常运行。不用为 itch 单独改代码。

---

## 1. 账号设置(家长本人操作)

1. 打开 https://itch.io/register ,**用你自己(成年人)的身份注册**。itch 官方允许监护人账号发布未成年人的作品——这正是我们的合规路径,孩子本人不注册、不发言。
2. Username 填(它决定主页网址 `longmaolab.itch.io`,和 GitHub 一致最好):

```
longmaolab
```

3. 注册时勾选 "**I'm interested in distributing content on itch.io**"(开发者模式)。漏勾的话事后在 Settings → Publisher 里补开。
4. 去邮箱点验证链接(未验证邮箱无法把页面设为 Public)。
5. Settings → Profile,Display name 填 `longmaolab`,Bio 粘贴:

```
Parent-run account. I publish and maintain games built by my kid (GitHub: VideoGameTips). Everything here is free and open source: https://github.com/longmaolab
```

6. 建议顺手在 Settings → Two-factor authentication 开二步验证。

---

## 2. 新建项目 —— 逐字段填写

Dashboard → **Create new project**。下面按表单从上到下走一遍。

### 2.1 基本信息

**Title:**

```
Iron Tide
```

**Project URL**(slug,自动生成时改成这个):

```
irontide
```

最终页面地址将是 `https://longmaolab.itch.io/irontide`。

**Short description or tagline:**

```
Command a battleship — then fly the planes, drive the tanks, and storm the beach yourself. Free in your browser.
```

(备选 tagline 见第 5 节。)

**Classification:** `Games`(默认)

**Kind of project:** 选 **HTML** — "You have a ZIP or HTML file that will be played in the browser"

**Release status:** `Released`

### 2.2 定价

**Pricing:** 选 **No payments**。

理由:这是未成年人的作品,不收捐款就不用填税务与收款资料,账号最干净。以后想开捐赠随时可改。

### 2.3 Uploads(上传构建包)

1. 点 **Upload files**,选 `promo/builds/irontide-itch.zip`
2. 上传后**必须勾选**该文件旁的 "**This file will be played in the browser**"

### 2.4 Embed options(嵌入设置——三维全屏游戏的推荐值)

Iron Tide 是自适应窗口的 three.js 全屏游戏,画布会自动填满 iframe,所以:

| 设置项 | 推荐值 | 说明 |
|---|---|---|
| Embed in page / viewport | **宽 1280 × 高 720** | 16:9,桌面页内嵌大小合适;游戏会自动铺满 |
| **Fullscreen button** | ✅ 勾选 | 玩家一键进真全屏,体验最好 |
| **Mobile friendly** | ✅ 勾选 | 游戏有完整触屏控制(虚拟摇杆+情境按钮) |
| Orientation(勾了 Mobile friendly 后出现) | **Landscape** | 横屏游戏 |
| Automatically start on page load | ❌ 不勾 | 保留 "Run game" 按钮:省玩家流量,也避开浏览器音频自动播放限制 |
| Enable scrollbars | ❌ 不勾 | 全屏画布不需要滚动条 |

### 2.5 Details(详情)

**Description:** 粘贴第 3 节的完整英文描述。粘贴后在 itch 编辑器里把每个全大写标题行(如 `WHAT'S INSIDE`)选中,用工具栏设为 **Heading**,视觉立刻整齐。

**Genre:** `Action`

**Tags** —— 正好 10 个,按搜索流量选的。itch 的 tag 是逐个输入(有自动补全),按下面顺序一个个敲:

```
naval, war, 3d, battleships, tanks, flight, shooter, singleplayer, arcade, open-source
```

选择逻辑:`naval`/`battleships`/`war` 是精准品类词;`3d`/`shooter`/`arcade`/`singleplayer` 是大流量泛词;`tanks`/`flight` 覆盖游戏里"还能开坦克开飞机"的差异化搜索;`open-source` 在 itch 是真实存在的发现渠道。平台标签(HTML5/Web)由 "Kind of project = HTML" 自动带上,不占这 10 个名额。

**AI generation disclosure**(表单里问 "此项目是否包含 AI 生成内容"):

- 选 **Yes**
- 子选项只勾 **Code**(不勾 Graphics / Sound / Text & Dialog——游戏的画面、音乐、文本都不是 AI 生成的;音乐是程序化生成,不算 AI)

如实披露的依据:fork 的维护工作用了 AI 辅助代码审查。第 3 节描述末尾也有一句对应的透明声明,两处口径一致。

**App store links:** 全部留空。

### 2.6 Community 与 Visibility

**Community:** 选 **Comments**(轻量评论区即可,不开完整讨论版)。

**Visibility & access:** 先选 **Draft** 保存!

保存后点 "View page" 用草稿页实测:游戏能加载、能全屏、手机上开一次。都没问题后,周六再回到编辑页把 Visibility 改成 **Public**。

### 2.7 图片与视频

- **Cover image:** 上传 `promo/assets/final/cover-itch-titled-630x500.png`(**已生成**,带标题排版,尺寸正好是 itch 要求的 630×500)
- **Screenshots:** 依次上传 `promo/assets/final/01-menu.png` 到 `final/06-briefing.png`
- **Gameplay video or trailer:** 填周六上传的 YouTube 链接(见第 6 节)

---

## 3. 页面 Description(完整英文,整块复制)

```
COMMAND THE FLEET. THEN LEAVE THE BRIDGE.

Iron Tide is a free browser naval-action game where you don't just command a battleship — you live on it. Steer from the bridge, buy cannons in port and bolt them onto your own deck, man them yourself, take off in a plane, drive an amphibious tank onto the beach, or step ashore on foot. One battle, four ways to fight.

No account, no ads, no install. It loads in seconds, right here in your browser.

WHAT'S INSIDE

- A 31-theater world campaign, with a rival waiting at the end of it: Grand Marshal Varga, who talks to you over story radio dialogue
- Ship, plane, tank and on-foot combat in one seamless battle — the tanks are amphibious
- Mount extra cannons on your deck: buy them in the armory (Tab), place them with F, then man them yourself with E
- 12 medals, a 3-star rating on every theater, and a shareable battle report
- Quick battle mode and sandbox maps for when you just want a scrap
- Dynamic weather, and procedural music with a distinct profile for each of the 31 theaters
- Photo mode (press L) for screenshots, plus quality settings with adaptive bloom
- Gamepad support and full touch controls — plays on desktop and mobile
- Fully bilingual: English / 中文, switchable any time
- Single-player: a 31-theater campaign, a quick-battle mode, and 7 sandbox maps

CONTROLS

Ship: W/S throttle · A/D rudder · Mouse aim · Click to fire · R sonar · V drop mine · Z damage control
Deck & port: Tab shop · F place a bought cannon · E man / leave a deck gun · X scrap a gun · H harbor · B build
Plane: P board / bail out · W/S throttle · A/D turn · Mouse climbs and dives · Y sends a parked plane up with an AI pilot
Tank: E board · WASD drive · Mouse aim · Click fire · G switch land / water · E dismount
On foot: G go ashore / re-board your ship · WASD walk or swim · Click to fire · Q switch weapon
General: N strategic map · T first / third person · L photo mode · K settings · I graphics quality · J music · M sound · Enter opens the captain's chat (type /help) · Esc closes panels or skips the tutorial

Gamepad: left stick steers, right stick looks, triggers fire. On phones and tablets you get a virtual stick and context buttons.

The copy at game.boobank.com also installs to your home screen and plays offline; the build here runs in the page.

WHO MADE THIS

This game was designed and built almost entirely by my kid, solo, under the GitHub handle VideoGameTips: the gameplay, the 31-theater campaign, the ship / plane / tank / infantry systems — all of it. I'm the parent. I maintain a polished fork of the game (bug fixes, completing the English/中文 translation, onboarding, achievements, performance), with AI-assisted code review along the way, and I run this account because the developer is a minor.

Both versions are open source:
- Original, by the kid: https://github.com/VideoGameTips/irontide
- Polished fork (the build you're playing): https://github.com/longmaolab/irontide

The game also lives at https://game.boobank.com/irontide/ — same build, free either way.

If you play it, a comment here means a lot. Every single one gets read out at our dinner table.
```

> 粘贴后的小加工:`COMMAND THE FLEET...`、`WHAT'S INSIDE`、`CONTROLS`、`WHO MADE THIS` 四行设为 Heading;三个链接 itch 会自动识别,不用手动加。

---

## 4. 首篇 Devlog(发布当天就发)

发布后在项目页 → Devlog → **Create new post**。

**标题:**

```
Iron Tide is live — a battleship game where you can leave the bridge
```

**正文:**

```
Iron Tide is out today, free in your browser — no account, no install.

It's a naval-action game with an unusual promise: the battleship you command is a place, not a menu. You buy cannons in port and bolt them onto your own deck. You can man those guns yourself, take off in a plane, drive an amphibious tank onto the beach, or hop ashore on foot — all inside one battle. The campaign spans 31 theaters and ends with a rival, Grand Marshal Varga, who taunts you over the radio as you close in.

Full disclosure on who made it: my kid designed and built almost all of this solo (GitHub: VideoGameTips). I'm the parent — I maintain the polished fork this build comes from, and I run this account. Both repos are open source, links on the game page.

What I'd love from you: play ten minutes, then tell me the first moment that confused you. Onboarding feedback is the most valuable thing a small game can get.

Thanks for reading — see you on the water.
```

---

## 5. 备选 tagline(3 条)

Short description 想换口味时用,每条都只基于真实特性:

```
A 31-theater naval campaign where your battleship is also an airfield, a tank garage, and home.
```

```
Buy cannons in port, bolt them onto your deck, and hunt Grand Marshal Varga across 31 theaters.
```

```
Ship, plane, tank, boots — one battle, four ways to fight. Free in your browser, English/中文.
```

---

## 6. 视频 shot list(仅在你想重录时才需要 —— 成品已在 `promo/assets/final/`)

**录制参数**:浏览器窗口开 1920×1080(或全屏),游戏里按 **I** 把画质调到最高、按 **J** 确认音乐开着。Mac 用 QuickTime(文件 → 新建屏幕录制)或 Cmd+Shift+5。取景大量用 **L** 拍照模式(自由飞行相机:WASD 飞、Space/Shift 升降)。

| 秒数 | 镜头 | 怎么拍 |
|---|---|---|
| 0–5 | 战舰破浪,恶劣天气 | L 进拍照模式,从舰艏侧前方低角度环绕 |
| 5–14 | 舰桥视角冲锋开炮 | 正常驾驶,W 满舵门冲向敌舰,鼠标瞄准齐射 |
| 14–22 | 港口买炮 → 甲板装炮 → 亲手开炮 | Tab 开商店买一门炮,F 放置到甲板,E 上炮位开火 |
| 22–30 | 起飞舰载机 | P 上飞机,从甲板起飞,爬升后俯冲扫一个目标 |
| 30–38 | 两栖坦克冲滩 | E 上坦克,开下船、G 切换水陆,上岸开火 |
| 38–45 | 步兵登陆 | G 上岸,持枪走几步、开两枪 |
| 45–54 | 剧情感收尾 | 露一段 Varga 的电台对话字幕;N 打开战略地图扫一眼 31 个战区;闪一下勋章界面 |
| 54–60 | 结尾卡 | 静帧(拍照模式取一张英雄镜头),叠字:**Iron Tide — free in your browser** + `https://longmaolab.itch.io/irontide` |

**注意**:全程不要露出系统通知、书签栏、真名账号。剪辑用 CapCut/剪映即可,导出 MP4 1080p。传 YouTube(你现有 Google 账号,可见性选"公开"或"不公开列出"都行,itch 都能嵌),把链接填进项目页的 **Gameplay video or trailer** 字段。

---

## 7. 发布后 checklist

发布日(7/25 周六)当天:

- [ ] 确认页面上线:`https://longmaolab.itch.io/irontide` 无痕窗口打开,点 Run game 实际玩 2 分钟
- [ ] 手机浏览器开一次,确认触屏可玩、横屏提示正常
- [ ] 发第 4 节的 devlog
- [ ] 在自己的 itch 主页建一个公开 Collection(如 "Our games"),把 Iron Tide 加进去
- [ ] GitHub 两个仓库回链。fork 仓库 `longmaolab/irontide` 的 README「玩」小节里加一行:

```
**itch.io:https://longmaolab.itch.io/irontide**
```

- [ ] fork 仓库的 GitHub About(右上角齿轮)Website 字段保持 `https://game.boobank.com/irontide/` 不变,description 末尾可补 `| itch.io: longmaolab.itch.io/irontide`
- [ ] boobank 门户回链:在 `portal/index.html` 的 Iron Tide 卡片上加一个指向 itch 页面的链接(锚文本用 `Also on itch.io`),按 portal 现有卡片样式手改即可

下周起(7/27 周一开始,每周花 20 分钟):

- [ ] **回评论**——由你(家长)回复,语气代表全家;有人反馈 bug 就转成 GitHub issue
- [ ] **逛 itch.io/jams 找 jam**:优先找允许已发布作品(post-jam friendly)或主题贴合(naval / browser / HTML5 / open-source)的 jam。jam 是 itch 最大的被发现渠道;中位数游戏一生只有约 1.6k 次浏览,想超过这个数基本靠 jam 和外链,不靠首页
- [ ] 看一眼 itch Dashboard → Analytics(浏览 / 打开游戏次数),记录在案就好,不必焦虑数字
- [ ] 有实质更新(新战区调整、修 bug、新功能)就发一篇短 devlog——devlog 会重新出现在 feed 里,是免费的二次曝光

**不做的事(诚实红线)**:不注册小号顶帖、不刷评分、不在别人游戏评论区留链接、不编造下载量或媒体评价。这个页面最动人的资产就是"孩子独立做了游戏、家长认真维护"这个真实故事——它不需要任何注水。
