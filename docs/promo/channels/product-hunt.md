# Iron Tide — Product Hunt 发布全套(复制即用)


> **文件路径基准**：下面所有 `promo/...` 路径都相对于 **`/Users/longmao/projects/irontide/`**
> （不是仓库目录）。开始之前先执行一次，后面的路径就都能直接用：
>
> ```bash
> cd /Users/longmao/projects/irontide
> ```
>
> 物料在 `promo/`，文档在 `repo/docs/promo/`。物料不进版本库，用 `repo/tools/` 里的脚本重新生成。

> 使用说明:所有「操作步骤」用中文写给你看;所有**要粘贴到 Product Hunt 页面上的文字都是英文**,放在代码块里,点一下复制即可。
> 今天是 **2026-07-24(周五)**。本文所有日期都已换算成星期和北京时间。

---

## 0. 一页速览

| 事项 | 结论 |
|---|---|
| 建议发布日 | **2026-08-23(周日,太平洋时间)**,即北京时间 **8月16日(周日)15:01 上线** |
| 备选日 | 2026-08-17(周一 PT)= 北京时间周一 15:01;若 Reddit/HN 档期顺延,则改 08-23(周日)/08-24(周一) |
| 预热 | **7月26日(周日)前**建好产品页并排期到 8/23;PH 已取消 Coming Soon 页面,改用产品自带的 Product Forum 帖预热 |
| 谁来发 | 家长本人账号,自己 hunt 自己(2025-26 年约 60% 都是自发,完全正常) |
| 孩子的身份 | 名字或 GitHub ID「VideoGameTips」都可以;**不出现年龄、城市、学校、照片**。PH 规定 16 岁以下不能注册,**不要给孩子建账号** |
| 核心认知 | PH 现在是编辑精选制,只有约 10% 产品被 feature;没被选中≈几乎没流量。把这次当作**给孩子的一日鼓励活动 + 一条永久反链**,不是流量豪赌 |
| 素材位置 | 截图 `promo/assets/final/01-menu.png … 06-briefing.png`;视频**已生成好**:`promo/assets/final/iron-tide-hero-45s.mp4`(48 秒全片)、`iron-tide-clip-20s.mp4`(20 秒短版,Reddit/Discord 用)、`iron-tide-short-vertical.mp4`(竖版无音轨,Shorts/TikTok 用)、`preview.gif`(7 秒动图)。想重录:`node tools/capture-hero-video.js && node tools/cut-video-variants.js`;`promo/builds/irontide-itch.zip` 是给 itch.io 用的,**PH 不需要上传构建包** |

---

## 1. 提前准备(现在 → 8月15日)

### 1.1 账号(本周末就做,7/25–7/26)

1. 用家长自己的邮箱在 producthunt.com 注册(或启用已有账号)。**账号越新、越不活跃,权重越低**,所以越早越好。
2. 完善个人资料:真实头像(家长自己的,不是孩子的)、简介。简介可直接粘贴:

```text
Parent and maintainer of Iron Tide — a browser battleship game my kid built. I keep the polished open-source fork running.
```

3. 从现在到发布日,**每周花 30 分钟真实地用 PH**:给别人的产品点赞、留 2–3 条认真评论、关注 Games / Open Source 话题。这既是养账号,也是学习别人的发布页怎么写的。

### 1.2 预热(7/26 前做)

⚠️ **PH 已于 2025-08-28 取消 Coming Soon / teaser 页面**,Submit 里已经没有 "Schedule / Coming soon" 这个选项了。别照旧攻略去找,找不到。

现在的做法:

1. Submit → 正常创建产品页,把 launch 日期排到 **2026-08-23(周日)**。PH 允许最多提前约一个月排期,7/26 排 8/23 在范围内。
2. 每个新建产品会自动获得一个 **Product Forum 讨论帖**——这就是现在的预热位。发布前在里面发 2–3 条开发进度或截图,让产品页在上线前就有内容和一点关注。
3. 排期后产品页在 launch 日之前对外可见但不进排行榜,可以先把链接给几个朋友试玩、提前收 bug。

### 1.3 为什么选 2026-08-23(周日)

- **在 Reddit / HN 轮次之后**:假设 Reddit 在 7 月底、Show HN 在 8 月上旬完成,届时 bug 已被真实玩家踩过一轮,页面文案也验证过。若那两轮顺延,PH 就整体后移一周(08-30),排期日同步改。
- **周日/周一是全周最容易进当日榜的两天**(竞品最少);周二到周四流量最大但强手如云。我们的目标是「被 feature + 拿名次给孩子留纪念」,不是抢流量,所以选周日。
- **时区对家长极其友好**:12:01 AM PT(夏令时 UTC-7)= 北京时间 **同一个周日的 15:01**。周日下午上线、晚上盯盘,孩子也在家,可以一起看(但别让 TA 盯排名,见 §6)。
- 免费浏览器游戏在 PH 是可行的:2026 年 7 月就有免费浏览器游戏(San Fran Sim)拿过当日 #3。

### 1.4 发布前一周终检(8/9–8/12)

- [ ] 6 张截图按 §2.7 规格重截/确认,上传到产品页
- [ ] 30–60 秒视频按 §2.8 录好,传 YouTube(公开或 unlisted),链接填入产品页
- [ ] 240×240 缩略图 GIF 做好(§2.7),体积 < 3MB
- [ ] 所有表单字段按 §2 填完,预览检查错别字
- [ ] 第一条评论(§2.6)、回复模板(§4)、当天分享文案(§3.4)全部存到一个随手能开的文档里

### 1.5 发布前一晚 QA(8/15 周六晚)

- [ ] 手机(iOS Safari + Android Chrome)和桌面(Chrome/Safari/Firefox)各开一次 https://game.boobank.com/irontide/ ,确认秒开、能进战斗
- [ ] 语言切换正常,英文界面无明显漏翻(PH 访客默认看英文)
- [ ] Service worker 没有缓存旧版本(硬刷新验证)
- [ ] VPS/Caddy 正常(静态站,扛 PH 流量没问题,但确认一下安心)

---

## 2. PH 表单逐项填写(英文,直接粘贴)

### 2.1 Product name

```text
Iron Tide
```

(游戏 HTML 标题是 “Iron Tide — Battleship Command”,但 PH 名称字段用短名;副标题信息放进 tagline。)

### 2.2 Tagline(≤60 字符,按推荐顺序 3 个备选)

**第 1 名(推荐,49 字符)——「孩子做的 + 单文件」是对 PH 人群最独特的钩子:**

```text
A kid-built battleship game in a single HTML file
```

**第 2 名(58 字符)——突出玩法体量:**

```text
Command a battleship across 31 theaters — free, no install
```

**第 3 名(57 字符)——突出海陆空:**

```text
Sea, air & land combat in one browser tab, built by a kid
```

### 2.3 Description(≤260 字符,以下 254 字符)

```text
Iron Tide is a free browser battleship game: a 31-theater world campaign where you command a warship, fly planes, drive amphibious tanks, and fight on foot. No account, no ads, no install. Built mostly by my kid; I maintain the polished open-source fork.
```

### 2.4 Links / Topics / Pricing 等字段

| 字段 | 填写值 |
|---|---|
| Website / main link | `https://game.boobank.com/irontide/` |
| 附加链接(如有栏位) | `https://github.com/VideoGameTips/irontide`(原仓库)、`https://github.com/longmaolab/irontide`(维护 fork) |
| Topics(选 3 个) | **Games**(必选)、**Open Source**、**Web App**(若无此项,备选:GitHub、Tech) |
| Pricing | **Free** |
| Promo code / 折扣 | 无,留空 |
| Makers | 只添加家长自己。孩子不加(未满 16 不能有账号),署名方式是在文案里写 GitHub ID |
| Hunter | 自己(self-hunt,现在是主流做法) |

### 2.5 上传顺序

产品页图库顺序:**视频放第 1 位**(PH 会优先展示),然后 screenshot-01 → 06。

### 2.6 First comment(发布后 1 分钟内以 maker 身份发出;这是权重最高的单条内容)

```text
Hi Product Hunt — parent here, posting on behalf of the actual builder: my kid, who goes by VideoGameTips on GitHub.

The honest story, because I'd rather over-share than have you wonder:

- My kid designed and built the vast majority of Iron Tide solo — the gameplay, the 31-theater world campaign, the rival "Grand Marshal Varga" and his radio chatter, the vehicles, the progression systems. The original repo is github.com/VideoGameTips/irontide.
- I maintain a polished fork (github.com/longmaolab/irontide): bug fixes, completing the English/Chinese localization, onboarding, achievements, and performance work. I used AI-assisted code review on that polish. The game itself is my kid's work.
- Product Hunt requires account holders to be 16+, so I own this account and front the launch. My kid will read every comment here.

What the game actually is: a free 3D naval-combat game that runs in your browser — no account, no ads, no install (it's a PWA if you do want to install it). You command a battleship, but you're not stuck on it: you can take off in planes, drive amphibious tanks onto the beach, and fight on foot. In port you can buy extra cannons and mount them on your own deck. There are 31 theaters, each with its own procedurally generated music profile, plus dynamic weather, a photo mode, gamepad and touch support, English/Chinese localization, and a shareable battle report card. It's essentially one ~800KB index.html plus three.js — the whole thing is readable in an afternoon. There's also an early multiplayer mode, but to be upfront: it's experimental and rough.

Feedback that would mean the most:

1. The first five minutes — did you understand what to do without a tutorial wall?
2. Performance on your hardware, especially older laptops and phones.
3. If you show it to a kid who's learning to code: what did they ask?

Ask us anything, including about the AI part — I'm happy to be specific about what was human-built (almost everything) and where AI helped (code review on my fork).

Play: https://game.boobank.com/irontide/
```

### 2.7 图库计划(6 张截图:拍什么 + 英文说明)

规格:每张 **1270×760**(或等比 2540×1520 再缩)。PH 图库没有单独的 caption 字段,所以把下面的英文短句**做进图片本身**(底部一条半透明深色横条 + 白字即可)。截图时:画质开最高 + bloom 开、隐藏调试信息、用照片模式(L 键)摆机位。

| 顺序 | 文件 | 拍什么 |
|---|---|---|
| 1 | `final/01-menu.png` | 主视觉:战列舰侧舷齐射,暴风雨天气,炮口火光 + 水柱(照片模式摆最帅的一张) |
| 2 | `final/02-combat-hud.png` | 世界战役地图全览,能看出 31 个战区的规模 |
| 3 | `final/03-broadside.png` | 驾驶飞机空中视角,下方是海战战场 |
| 4 | `final/04-armory.png` | 两栖坦克从海里冲上滩头、开火瞬间 |
| 5 | `final/05-night.png` | 港口商店界面,正在给甲板加装副炮(F 键功能) |
| 6 | `final/06-briefing.png` | 勋章/成就页 + 战区三星评价 + 可分享的战报卡片同框 |

每张图上的英文条(按序):

```text
Command your battleship — broadsides, storms, open sea
```

```text
A 31-theater world campaign, each with its own procedural music
```

```text
Leave the deck: take off and fly over the battle
```

```text
Drive amphibious tanks from sea to shore
```

```text
Buy extra cannons in port and mount them on your own deck
```

```text
12 medals, 3-star theater ratings, and a shareable battle report card
```

补充:若能截到 Boss「Grand Marshal Varga」的电台对话画面,可作为第 7 张追加(PH 支持多图),英文条:

```text
A rival with a voice: Grand Marshal Varga taunts you over the radio
```

**缩略图(240×240,GIF)**:信息流里自动播放,是点击率关键。要求:1 个 2–3 秒的简单循环(战列舰齐射 → 爆炸水花 → 定格 “IRON TIDE” 字样),高对比度、缩小到 240px 后仍看得清、**体积 < 3MB**。从视频里裁一段生成:

```bash
ffmpeg -ss 5 -t 3 -i promo/assets/final/iron-tide-hero-45s.mp4 \
  -vf "crop=ih:ih,scale=240:240:flags=lanczos,fps=12,split[a][b];[a]palettegen[p];[b][p]paletteuse" \
  -loop 0 promo/assets/final/thumb-ph-240x240.png
```

### 2.8 视频(30–60 秒)镜头清单

录制要求:1920×1080、60fps、画质最高、隐藏一切调试 UI;不用配音,加一段轻快免版权 BGM 即可(PH 里默认静音自动播放,画面必须自己会说话);每段镜头切换干脆,不要转场特效。传 YouTube 后把链接填进产品页。

| 时间 | 画面 | 叠加字幕(英文,大号白字) |
|---|---|---|
| 0–3s | 照片模式海面空镜 → 标题浮现 | `IRON TIDE` |
| 3–10s | 战列舰暴雨中侧舷齐射,命中敌舰 | `Command a battleship` |
| 10–16s | 世界地图快速掠过 31 个战区 | `A 31-theater world campaign` |
| 16–23s | 起飞驾机,俯冲扫射 | `Fly the planes yourself` |
| 23–30s | 两栖坦克出海登陆、开火 | `Drive amphibious tanks ashore` |
| 30–36s | 下船步行作战片段 | `Fight on foot` |
| 36–43s | 港口商店买炮 → 甲板副炮全开齐射 | `Mount extra cannons on your deck` |
| 43–50s | 勋章页 + 三星评价 + 可分享的战报卡片 | `Medals, stars, family scoreboard` |
| 50–58s | 最帅的一段海战收尾 → 结束卡 | `Free in your browser. No install, no ads. Open source.` 下一行 `game.boobank.com/irontide — built by a kid` |

---

## 3. 发布日 Runbook(北京时间,2026-08-23 周日)

### 3.1 时区对照(务必记牢)

- 12:01 AM PT(PDT,UTC-7)= **北京时间当天 15:01**
- 前 4 小时票数隐藏、测速度:PT 00:01–04:01 = **北京 15:01–19:01**
- 美国用户高峰(PT 上午 6–10 点)= **北京 21:00–次日 01:00**
- 当日结束(PT 23:59)= **北京周一 14:59**

### 3.2 逐小时清单

| 北京时间 | 做什么 |
|---|---|
| 周日 14:00–15:00 | 最后检查:游戏能开、PH 排程状态正常;打开回复模板文档;泡好茶 |
| **15:01** | 上线。确认页面已 live、视频/图片显示正常 |
| 15:01–15:10 | **立刻发出第一条评论(§2.6 原文粘贴)** |
| 15:10–16:00 | 给符合条件的朋友发私信(§3.3 话术);在自己的社交渠道发 §3.4 文案 |
| 15:00–19:01 | 票数隐藏窗口:**每 15–30 分钟刷新一次,所有评论几分钟内回复**(maker 互动权重极高) |
| 19:01 | 票数公开,截一张图存档 |
| 19:00–21:00 | 晚饭轮值:每 30–60 分钟看一次 |
| 21:00–01:00 | **美国上午高峰,评论最多的时段,尽量在线秒回**;23:00 左右再截图一次 |
| 01:00 | 最后一轮回复 + 截图,睡觉(愿意的话定 04:00 闹钟快速看一眼,不强求) |
| 周一 07:00 | 起床先回复夜间评论(此时是 PT 周日下午) |
| 周一 09:00–14:30 | 每 1–2 小时看一次,收尾回复 |
| 周一 14:50 | 准备截最终排名图 |
| 周一 **14:59** | 当日结束,截图最终名次、票数、评论区 |

### 3.3 拉支持的红线(非常重要)

**可以做:**
- 只私信「**注册满 1 年以上、平时真实活跃**」的 PH 用户朋友;话术是「我们上线了,欢迎去玩玩、留条反馈」——**请求反馈,不是请求投票**。私信模板:

```text
Hey! Today we launched Iron Tide on Product Hunt — a browser battleship game my kid built (I maintain the fork). If you have 5 minutes I'd love your honest take, especially on the first-five-minutes experience: https://www.producthunt.com/posts/iron-tide
```

**绝对不做:**
- ❌ 让任何人**新注册账号**来投票——新账号投票会被降权,甚至连累整个 listing
- ❌ 买票、互投群、“launch service”——发布前后你一定会收到一堆「保你上 Top 5」的私信,**全是骗局,一律忽略/拉黑**
- ❌ 在任何地方发「求 upvote」+ 直链投票按钮(PH 明确反感,分享发布页请人「看看/留言」即可)
- ❌ 和酸评论争吵(模板见 §4.9)

### 3.4 当天自有渠道分享文案(英文)

```text
Iron Tide is live on Product Hunt today. My kid built this 3D battleship game — a 31-theater campaign with planes, amphibious tanks, and on-foot combat — essentially in one HTML file. Free in your browser, open source. Honest feedback very welcome: https://www.producthunt.com/posts/iron-tide
```

---

## 4. 评论回复模板(英文,按评论类型)

> 用法:找到最接近的类型,替换方括号内容后粘贴。所有回复都由家长账号发出。**当天每条评论都要回**,这直接影响权重,也是给孩子看的礼貌示范。

**4.1 夸奖/祝贺:**

```text
Thank you — I'll pass this straight to the builder. Comments like this are exactly why we launched here. If anything felt confusing in your first few minutes, I'd genuinely love to hear that too.
```

**4.2 「真的是孩子做的?」(善意好奇):**

```text
Yes — and the receipts are public. The original repo with its full commit history is github.com/VideoGameTips/irontide; that's my kid's work: the design, the 31-theater campaign, the vehicles, the systems. My part is the maintenance fork (github.com/longmaolab/irontide): bug fixes, finishing the EN/中文 localization, onboarding, achievements, performance. Happy to answer specifics.
```

**4.3 「是不是 AI 做的?」(质疑向):**

```text
Fair question and I'd rather over-answer: the game itself — gameplay, campaign, systems — was designed and built by my kid. Where AI came in: I used AI-assisted code review on my maintenance fork's polish work (bug fixes, i18n, performance). I won't claim more credit for my kid than is true, and I won't hide the AI part either. The commit history of both repos is public if you want to dig.
```

**4.4 技术问题(单文件/three.js/架构):**

```text
It's essentially one index.html (~800KB) plus vendored three.js r128 — no build step, no bundler. The PWA pieces (manifest + service worker) sit alongside it, so it's installable and works on desktop and mobile. Source is public and honestly fun to read in one sitting: github.com/VideoGameTips/irontide (original) and github.com/longmaolab/irontide (maintained fork).
```

**4.5 Bug 反馈:**

```text
Thank you — this is exactly the feedback we hoped for. Could you share your device / browser / OS? If you're up for it, an issue at github.com/longmaolab/irontide/issues would be perfect; otherwise I'll file one from your comment so it doesn't get lost.
```

**4.6 功能建议:**

```text
Love this idea — logging it. I can't promise a timeline (it's a family hobby project, not a startup), but the tracker is where plans live: github.com/longmaolab/irontide/issues. If you open it there, the original builder will see it too.
```

**4.7 多人模式提问:**

```text
There is an early multiplayer mode, but I want to be straight with you: it's experimental and rough right now. The single-player campaign — 31 theaters, the rival storyline, the vehicles — is the real game today.
```

**4.8 「会一直免费吗/怎么赚钱?」:**

```text
It's free and staying that way — no ads, no account, and the code is open source. This is a family project; the "business model" is my kid learning in public and people having fun in a browser tab.
```

**4.9 严厉批评/负面:**

```text
Thanks for taking the time to write this — genuinely. You may well be right about [具体点]. I'll pass the actionable parts to the builder; concrete critique is worth more to a young developer than praise. If you remember which theater/moment it happened in, that would help us reproduce it.
```

**4.10 「怎么支持你们?」:**

```text
Three free ways: play it and tell us where you got confused (game.boobank.com/irontide), star the repos (github.com/VideoGameTips/irontide and github.com/longmaolab/irontide), and if you know a kid who's learning to code, show them the source — the whole game is readable in one file.
```

---

## 5. 发布后清单(中文)

**24 小时内(8/17 周一下午起):**

- [ ] 北京周一 14:59 截最终排名/票数/评论区全图,原图存档
- [ ] 把回复漏掉的评论全部补回(之后 3–5 天每天再看一次,PH 评论有长尾)
- [ ] 从 PH 产品页后台复制官方 badge 嵌入代码(下面是模板,**以后台给的真实代码为准**,替换 `POST_ID`):

给 portal 首页和游戏页脚的 HTML 版:

```html
<a href="https://www.producthunt.com/posts/iron-tide" target="_blank" rel="noopener">
  <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=POST_ID&theme=light" alt="Iron Tide on Product Hunt" width="250" height="54" />
</a>
```

给两个仓库 README 的 Markdown 版:

```markdown
[![Iron Tide on Product Hunt](https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=POST_ID&theme=light)](https://www.producthunt.com/posts/iron-tide)
```

**一周内:**

- [ ] 把「最终排名截图 + 最好的 3–5 条评论(翻译成中文)」排成一页纪念图,郑重地给孩子看——这是整个发布的真正目的
- [ ] 评论里的 bug/建议整理成 GitHub issues(标注来源 “from Product Hunt launch”)
- [ ] portal 页给 Iron Tide 条目加一句 “As seen on Product Hunt” + badge
- [ ] 记一页复盘:哪条 tagline/图最有效、哪些评论类型没预料到,留给下一个游戏发布用

---

## 6. 预期管理(发布前请先读这一节)

- **大概率结果是安静的一天。** PH 2025-26 是编辑精选制,只有约 10% 的产品被 feature(标准:有用、新颖、高完成度、有创意);没被选中的产品几乎没有流量。这是平台机制,**不是对游戏质量的判决**。
- **我们的牌其实不差**:「孩子独立做出的开源单文件 3D 游戏」对 PH 的 maker 人群是真实新颖的工程故事,而且免费浏览器游戏被 feature 有先例(2026 年 7 月的 San Fran Sim 拿过当日 #3)。值得认真做,但不承诺结果。
- **PH 用户是创业者和开发者,不是玩家。** 他们会欣赏这个故事、读源码、留几条高质量评论,但不会成为长期玩家群。长期玩家来自 itch.io / Reddit 那些渠道。
- **成功的定义(按这个顺序)**:① 拿到永久的发布页反链和 badge;② 收到哪怕 5 条真诚的评论给孩子看;③ 被 feature 即是大胜;④ 名次只是彩蛋。
- **给孩子的呈现方式**:不要让 TA 当天盯排名刷新(数字波动对孩子是折磨);等结果尘埃落定,把**筛选过的**好评论和纪念图一起给 TA。如果被 feature 了,庆祝;如果没有,话术是:「你的游戏被放到了全世界创业者看的橱窗里,还有人专门留言——大多数大人做的产品都没走到这一步。」两种结果,都值得吃一顿好的。
- **发布后 DM 里的「付费冲榜服务」全是骗局**,一封都不要回。
