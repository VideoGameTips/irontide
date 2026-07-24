# Iron Tide — Reddit 发帖工具包(Reddit Posting Kit)


> **文件路径基准**：下面所有 `promo/...` 路径都相对于 **`/Users/longmao/projects/irontide/`**
> （不是仓库目录）。开始之前先执行一次，后面的路径就都能直接用：
>
> ```bash
> cd /Users/longmao/projects/irontide
> ```
>
> 物料在 `promo/`，文档在 `repo/docs/promo/`。物料不进版本库，用 `repo/tools/` 里的脚本重新生成。

> 适用游戏:**Iron Tide — Battleship Command**
> 试玩地址:https://game.boobank.com/irontide/ (免费、无需注册、无广告、无需安装)
> 开源:https://github.com/VideoGameTips/irontide
> 今天是 **2026-07-24(周五)**。本文所有日期均以此为起点。
>
> **三条铁律(每次发帖前默念):**
> 1. **隐私**:名字或 GitHub ID "VideoGameTips" 可以公开(署名自己的作品是应得的);**永远不提年龄、城市、学校、照片/语音、私人邮箱**——名字、年龄、城市这三样里任意两样同时出现就是危险组合。所有账号、所有帖子都由家长出面。
> 2. **诚实**:不编数字、不喊 "best/revolutionary"、不搞小号刷赞。联机模式只能标 "experimental" 或干脆不提。
> 3. **发帖前花 2 分钟重新看一遍该版块的现行规则**(本文的版规信息基于 2025 年存档快照核实,Reddit 规则随时会变)。

---

## 0. 时区换算(全文通用)

- 8 月美国东部是夏令时 **EDT = UTC-4**;北京 **UTC+8**。**两地相差 12 小时,北京在前**。
- 换算口诀:**美东上午 9:00 = 北京当天晚上 21:00**。
- 下文所有"最佳发帖时间"都给出两个时间,家长按北京时间操作即可。

---

## 1. 总时间线一览

| 日期 | 星期 | 动作 |
|---|---|---|
| 2026-07-24 ~ 07-31 | 五~五 | **养号周**(见第 2 节) |
| 2026-08-01 | 六 | 发 **r/playmygame**(北京 21:00 = 美东周六 9:00) |
| 2026-08-04 | 二 | 发 **r/WebGames**(北京 21:00 = 美东周二 9:00) |
| 2026-08-07 | 五 | 发 **r/IndieGaming**(北京 20:30 = 美东周五 8:30)——需要先录好视频 |
| 2026-08-08 或 08-29 | 六 | 发 **r/webdev Showoff Saturday**(条件见第 7 节:老账号 8/8,新账号最早 8/29) |

任意两个版块**不在同一天发**;r/IndieGaming 之后两周内不再在该版自我宣传。r/WebGames 三个月内**不可重发**,所以那一发必须一次做好。

---

## 2. 养号周计划(2026-07-24 周五 ~ 2026-07-31 周五)

**硬性门槛(为什么要养号):**
- r/WebGames:账号 **≥7 天** 且 **≥10 评论 karma**
- r/IndieGaming:账号 **≥1 周** 且有真实的参与历史(不能是只发广告的空号)
- r/webdev:约 **100 karma** + 账号 **30 天**(新号本周达不到,见第 7 节)

**目标:到 7/31,评论 karma ≥ 30~50(远超 10 的下限,留出安全余量)。**

### 每日任务(每天 20~30 分钟,用真实兴趣去评论,不要复制粘贴)

| 日期 | 做什么 |
|---|---|
| 7/24(五) | 确认/注册账号;完善头像和简介(简介可写 "Parent of a young game dev. We make browser games.");**今天不发任何链接**。加入 r/WebGames、r/playmygame、r/IndieGaming、r/webdev,通读各版规则并截图存档。 |
| 7/25(六) | r/WebGames:认真玩 2 个别人发的游戏,各留 2~3 句具体评论(说出你喜欢哪个机制、卡在哪里)。 |
| 7/26(日) | r/playmygame:给 2 个游戏写真反馈(结构:先说优点→再说一个具体问题→给一条建议)。顺手加入他们的 Discord。 |
| 7/27(一) | r/IndieGaming:在 2~3 个讨论帖/视频帖下留言(问开发者一个真问题最容易得 karma)。 |
| 7/28(二) | r/webdev + r/threejs 或 r/gamedev:回答 1~2 个你真的懂的问题(three.js、PWA、单文件游戏都是你们的强项)。 |
| 7/29(三) | 回到 r/WebGames 和 r/playmygame 各再评论 1~2 条;回复所有回复过你的人。 |
| 7/30(四) | 查一遍自己的 karma;若评论 karma < 30,今天补足。 |
| 7/31(五) | 收尾:确认账号满 7 天、karma 达标;录制/整理素材(截图 promo/assets/final/01-menu.png … 06-briefing.png、视频见第 6 节);把 4 个版块的规则再快速过一遍。 |

**养号禁忌:** 不发任何 Iron Tide 链接;不注册小号互赞(投票操纵=全站封号);不用一句话水评论("Nice!" 这种没有 karma 还招人烦);不碰政治/争议话题版块。

### 发帖前 2 分钟规则复查清单(每次发帖当天必做)

1. 打开该版块侧边栏 → Rules,逐条扫一遍(重点看:标题格式、必选 flair、链接政策、自我宣传频率)。
2. 看版块置顶帖有没有新公告(比如 "本周禁止 XX 类帖子")。
3. 翻当天首页前 20 帖,确认你的帖子格式和大家一致(link post 还是 text post、flair 长什么样)。
4. 搜索 "Iron Tide" 确认没有别人已发过(尤其 r/WebGames 的 3 个月重发限制)。

---

## 3. r/playmygame(约 13 万订阅)— 2026-08-01 周六

**定位:** 反馈请求帖(不是广告帖)。该版**要求**你当天也去给别人反馈。

- **发帖时间:** 北京 **8/1(六)21:00**(= 美东周六上午 9:00,周末玩家最多)
- **帖子类型:** Text post(正文里放链接;可用 Reddit 编辑器插入 2~3 张截图,选 promo/assets/ 里最有代表性的,比如战列舰主视角 + 世界地图 + 坦克登陆)
- **Link flair(必选):** 优先选 **`[PC] (Web)`**;若列表里没有这个,就选 **`[Web]`**。发帖界面点 "Add flair" 从下拉列表里选,不能自己编。
- **NSFW / Spoiler:** 都不勾。

**标题(二选一,复制即用):**

```text
[Web] Iron Tide — my kid's battleship action game (31-theater campaign, planes, tanks). Looking for honest feedback on difficulty and onboarding
```

```text
[Web] Iron Tide — free browser battleship game built by my kid. What would make you keep playing past the first theater?
```

**正文(复制即用):**

```text
Play (free, no account, no download, loads in seconds): https://game.boobank.com/irontide/

My kid (GitHub: VideoGameTips) designed and built this naval action game almost entirely solo — the gameplay, the campaign, the systems. I'm the parent; I do the maintenance (bug fixes, translations, onboarding, performance). It's all one open-source repo.

What's in it:
- A 31-theater world campaign with a rival boss, "Grand Marshal Varga", who taunts you over story radio dialogue
- You command a battleship, but you can also fly planes, drive amphibious tanks, and fight on foot
- Buy extra deck guns in the armory (Tab), bolt them on with F, and man one yourself with E
- 12 medals, 3-star ratings per theater, quick battle mode, sandbox maps, dynamic weather
- Procedural music that changes per theater, photo mode (L key), gamepad + touch support, English/Chinese
- Runs on desktop and mobile; it's a PWA so you can install it if you want (no install needed to play)
- There is also a very early experimental multiplayer mode — it's rough, judge the single-player

What we'd love feedback on:
1. Onboarding — did the first 5 minutes teach you enough, or were you lost?
2. Difficulty curve — where did it get too hard or too boring?
3. Performance — what device/browser, and did it stay smooth? (There's a quality setting if not.)
4. Controls — keyboard/mouse, gamepad, or touch: anything that felt wrong?

Source code (one repo — my kid's, and where I push my maintenance work too): https://github.com/VideoGameTips/irontide

Brutal honesty welcome. I'll pass every comment on (kindly worded or not — I'll translate the tone).
```

**发帖后立刻发的第一条评论(复制即用):**

```text
A few tips if you jump in: Tab opens the armory — buy a deck gun there, then F bolts it onto your deck and E lets you man it, and L is photo mode if you catch a nice storm. If anything breaks, tell me your device + browser and I'll get it fixed — issues also welcome at https://github.com/VideoGameTips/irontide/issues
```

**当天义务(版规要求):** 发完帖后 1 小时内,去玩 2~3 个别人的游戏并留下认真反馈(和养号周同样的三段式结构)。这不仅是规则,也是这个版的文化——礼尚往来的人帖子活得久。

---

## 4. r/WebGames(约 12.5 万订阅)— 2026-08-04 周二

**定位:** 直链游戏帖。规则要点:**标题必须以游戏名开头**;必须是**无需注册、无需下载**的游戏(Iron Tide 完全符合);**3 个月内不可重发**——只有一次机会,发之前把游戏线上版本检查一遍(加载、手机端、无报错)。

- **发帖时间:** 北京 **8/4(二)21:00**(= 美东周二上午 9:00;工作日上午摸鱼时段是网页游戏版的黄金时间)
- **帖子类型:** **Link post**,URL 填 `https://game.boobank.com/irontide/`
- **Flair:** 该版 flair 为体裁类(如 Action / Strategy 等),发帖时若有 **Action** 就选它;没有强制要求则可不选。以当天下拉列表为准。
- **NSFW / Spoiler:** 都不勾。

**标题(二选一,注意必须以 "Iron Tide" 开头):**

```text
Iron Tide — command a battleship, fly planes, drive amphibious tanks and fight on foot across a 31-theater campaign (free, no sign-up)
```

```text
Iron Tide — a browser naval action game my kid built with three.js: 31 theaters, a taunting rival boss, dynamic weather (free, no sign-up)
```

**发帖后立刻发的第一条评论(link post 没有正文,这条评论就是你的"正文",复制即用):**

```text
Dev's parent here. My kid (GitHub: VideoGameTips) designed and built this almost entirely solo; I handle the maintenance (bug fixes, i18n, performance). It's all one open-source repo: https://github.com/VideoGameTips/irontide

Quick orientation:
- Campaign: 31 theaters across a world map, with a rival boss (Grand Marshal Varga) who talks to you over story radio
- You're not stuck on the ship — you can fly planes, drive amphibious tanks, and fight on foot
- Tab opens the armory (buy a deck gun, then F mounts it, E mans it), L is photo mode
- Quick battle and sandbox modes if you don't want the campaign
- Works on mobile with touch controls, supports gamepads, has English/中文, and there's a quality setting if your machine struggles

Feedback and bug reports very welcome — include your device/browser and I'll pass everything on.
```

---

## 5. r/IndieGaming(约 40.6 万订阅)— 2026-08-07 周五

**定位:** **原生视频帖(v.redd.it)**——直接把 MP4 上传到 Reddit,不要贴 YouTube 链接。**不放商店链接**;试玩链接放在第一条评论里。**两周内该版只此一帖**。

- **发帖时间:** 北京 **8/7(五)20:30**(= 美东周五上午 8:30)
- **帖子类型:** Video post(上传 MP4)
- **Flair:** 发帖时从下拉列表选最贴近 **Video / Gameplay** 的那个(以当天列表为准)。
- **NSFW / Spoiler:** 都不勾。

### 视频拍摄清单(30~60 秒,发帖前录好)

用 OBS 或 QuickTime 录屏,1080p、尽量 60fps,直接用游戏自带的程序化音乐(无版权问题)。**按下面镜头顺序剪**:

| 时间 | 镜头 |
|---|---|
| 0–5s | 开门见山:战列舰在暴风雨中齐射(最强画面放最前) |
| 5–12s | 航行 + 天气动态变化(晴转雨/雾) |
| 12–20s | 从战舰起飞,驾驶飞机空战一小段 |
| 20–28s | 两栖坦克从海里开上滩头 |
| 28–35s | 下车步行作战片段 |
| 35–45s | 军械库(按 Tab)买炮 → 按 F 装到甲板 → 加装后齐射对比 |
| 45–55s | Grand Marshal Varga 的电台喊话 + Boss 战一个高光瞬间 |
| 55–60s | 世界地图拉远展示 31 个战区,最后一帧叠加文字:`Free in your browser — link in comments` |

剪辑要点:不加解说、不加第三方音乐;每个镜头 4~8 秒就切,别恋战;导出 MP4 (H.264)。

**标题(二选一):**

```text
My kid built this battleship game — you command the ship, but you can also fly the planes and drive the tanks. Free in the browser
```

```text
Iron Tide: a free browser naval action game my kid built with three.js — 31-theater campaign, boss battles, dynamic weather
```

**发帖后立刻发的第一条评论(视频帖没有正文,链接靠这条,复制即用):**

```text
Play it here (free, no account, no download): https://game.boobank.com/irontide/

Context: my kid (GitHub: VideoGameTips) designed and built the vast majority of this solo — gameplay, the 31-theater campaign, all the systems. I'm the parent and I handle the maintenance (bug fixes, translations, performance). Fully open source, one repo: https://github.com/VideoGameTips/irontide

It's built with three.js, runs on desktop and mobile (touch controls + gamepad support), has English/中文, procedural music that changes per theater, and a photo mode (L key). Happy to answer anything about how it was made.
```

---

## 6. r/webdev — Showoff Saturday(技术向变体,简版)

**定位:** 只能**周六**发,用 **Showoff Saturday** flair;必须**以技术细节开头**,像开发者对开发者说话,游戏只是载体。

- **门槛:** 约 100 karma + 账号 30 天。**两种情况:**
  - 家长已有 ≥30 天的老账号且 karma 够 → **2026-08-08(六)** 发,北京 **20:30**(= 美东周六 8:30)。
  - 用的是 7/24 新注册的号 → 最早满 30 天后的周六 = **2026-08-29(六)** 发。
- **帖子类型:** Text post;**Flair:必选 Showoff Saturday**。
- **NSFW / Spoiler:** 都不勾。

**标题(二选一):**

```text
Showoff Saturday: Iron Tide — a 3D battleship game that is essentially one ~800KB index.html (three.js, PWA, procedural audio)
```

```text
Showoff Saturday: a single-file three.js game with a distinct procedural music profile for every theater, adaptive quality, and offline PWA install — built by my kid
```

**正文(复制即用):**

```text
Live: https://game.boobank.com/irontide/ — free, no account, loads in seconds.

The technically interesting part: the whole game is essentially a single index.html (~800KB of HTML/JS) plus vendored libraries. three.js r128 for rendering, a manifest + service worker so it installs as a PWA and works like a native app, and it runs on both desktop and mobile.

Some things that were fun to get working in that constraint:
- Procedural music: 31 distinct audio profiles, one per campaign theater, generated at runtime — no audio files to download
- Adaptive quality: it monitors frame rate and steps effects (including bloom) up or down automatically, with a manual quality setting as override
- Input: keyboard/mouse, gamepad, and touch controls all from the same codebase
- i18n: full English/中文 switching
- Content-wise it's a 31-theater campaign where you command a battleship but can also fly planes, drive amphibious tanks, and fight on foot

Authorship, for transparency: my kid (GitHub: VideoGameTips) designed and built the vast majority of it solo. I'm the parent; I do the maintenance — bug fixes, i18n completion, onboarding, performance — with AI-assisted code review. It's all one open-source repo: https://github.com/VideoGameTips/irontide

Happy to answer questions about the single-file approach, the PWA setup, or what breaks first when an 800KB HTML file meets a mobile browser.
```

---

## 7. 回复剧本(Reply Playbook)— 6 类最常见评论的英文回复模板

发帖后**头 2~3 小时守在帖子下**,及时回复决定帖子命运。以下模板按需微调后使用。

**① 夸奖 / 点赞:**

```text
Thank you! I'll pass this straight to my kid — comments like this are exactly why we posted. If anything felt off while you played (difficulty, controls, performance), that feedback is just as welcome.
```

**② "这是 AI 做的吧?" / 质疑作者身份:**

```text
Fair question, so here's the honest breakdown: my kid (GitHub: VideoGameTips) designed and built the vast majority of the game solo — the gameplay, the 31-theater campaign, the systems. I'm the parent, and I do the maintenance — bug fixes, translation completion, onboarding, and performance work — and yes, I use AI-assisted code review for that maintenance work. It's one public repo, so you can check the commit history yourself: https://github.com/VideoGameTips/irontide
```

**③ Bug 反馈:**

```text
Thanks for reporting this — genuinely helpful. Could you tell me: (1) device and browser, (2) what you were doing when it happened, (3) whether it happens every time? If you're up for it, filing it at https://github.com/VideoGameTips/irontide/issues makes it easiest to track, but a reply here works too and I'll file it myself.
```

**④ "我家孩子也想学编程":**

```text
That's great to hear. What worked for us: start with something playable in the browser within a day (a single HTML file, no build tools), because seeing it run is what keeps a kid going. The three.js examples page is a goldmine to copy from and modify. Ship tiny versions early and let people play them — feedback from a real player beats any tutorial. Our game is open source if your kid wants to poke at real code: https://github.com/VideoGameTips/irontide
```

**⑤ 尖锐批评:**

```text
Appreciate you taking the time to say it straight — that's more useful to us than politeness. Could you point at the specific moment it lost you (first battle? a particular theater? controls?)? I'd rather fix the actual problem than guess. It's an ongoing project and criticism like this is how it gets better.
```

**⑥ 功能请求:**

```text
Good idea — I've logged it at https://github.com/VideoGameTips/irontide/issues so it doesn't get lost. Being honest about expectations: this is a family project maintained in spare time, so I can't promise timelines, and big items (for example, multiplayer is still very experimental) move slowly. But requests like this genuinely shape what we work on next.
```

---

## 8. 发帖日历(汇总)

| 日期 | 星期 | 版块 | 北京时间 | 美东时间 | 当天额外动作 |
|---|---|---|---|---|---|
| 7/24–7/31 | — | 养号周 | 每天 20~30 分钟 | — | 见第 2 节 |
| 8/1 | 六 | r/playmygame | 21:00 | Sat 9:00 AM | 发完 1 小时内给别人 2~3 条反馈(版规);守帖 2~3 小时 |
| 8/4 | 二 | r/WebGames | 21:00 | Tue 9:00 AM | 发帖前重测游戏线上版;守帖 2~3 小时 |
| 8/7 | 五 | r/IndieGaming | 20:30 | Fri 8:30 AM | 视频提前 1~2 天剪好;链接放第一条评论;此后两周该版不再自宣 |
| 8/8 | 六 | r/webdev(仅老账号) | 20:30 | Sat 8:30 AM | Showoff Saturday flair;技术内容打头 |
| 8/29 | 六 | r/webdev(新账号备选) | 20:30 | Sat 8:30 AM | 同上 |

其他提醒:**不发 r/incremental_games**(题材不符,发了会被删还伤账号)。每帖发出后,把链接记录在本地,不要短时间内在多处刷同一 URL。

---

## 9. 风险提示(中文,务必读完)

### 9.1 r/WebGames 的"画恐龙解封"传统

r/WebGames 版主有个著名的怪传统:**如果你被 ban 了,申诉时版主会要求你亲手画一只恐龙发过去,才给解封**。这不是段子,是他们多年来测试申诉者诚意(和幽默感)的方式。万一真被 ban:
- 别争辩、别甩规则条文,先老老实实道歉并说明情况;
- 版主提出画恐龙就认真画一只(手绘拍照即可;让孩子画一只反而更有诚意——照片里只拍画,别出现孩子本人,也别提年龄、城市、学校);
- 态度好 + 恐龙到位,解封概率很高。

### 9.2 Shadowban(影子封禁)风险

新账号 + 短期内发外链,是 Reddit 全站反垃圾系统最警惕的组合。被 shadowban 后你自己看一切正常,但别人看不到你的任何帖子和评论——最伤的是你可能几周都不知道。

**预防:**
- 严格执行第 2 节养号周,先评论后发链接;
- 同一个 URL 不要短期内发到多个版块(这也是本日历把 4 个帖子拉开 3~7 天的原因);
- 不删帖重发"刷时段"——删了再发同链接是典型垃圾行为特征;
- 不用短链接(bit.ly 之类),永远直接贴 `https://game.boobank.com/irontide/`;
- 绝不注册小号给自己点赞、也不叫亲友集中点赞(投票操纵会连坐封主号);
- 每次发帖之间保持正常的评论互动,让账号行为像个真人。

**自查方法(建议每次发帖后第二天做一次):**
- 退出登录(或开无痕窗口)访问 `https://www.reddit.com/user/你的用户名`——页面显示不存在即中招;
- 或在 r/ShadowBan 版发个测试帖,机器人会自动告诉你状态。

**中招了怎么办:** 去 https://www.reddit.com/appeals 提交申诉,如实说明是给孩子的开源游戏做宣传、无商业行为,通常几天内有结果。申诉期间停止一切发帖。

### 9.3 其他

- **r/WebGames 三个月不可重发**:那一帖是唯一机会,发之前务必用手机+电脑各完整测一遍游戏。
- **r/playmygame 的"当天互评"是硬规则**,不做会被删帖甚至警告。
- **r/IndieGaming 两周一帖**:8/7 发完后,8/21 前不要在该版再发任何 Iron Tide 内容(正常评论别人可以)。
- 所有帖子如被版主删除,先私信版主(modmail)礼貌询问原因,按要求改正后再问能否重发——不要直接原样重发。
