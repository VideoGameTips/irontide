# Iron Tide — Show HN 发布全套材料

> 适用平台：Hacker News (news.ycombinator.com)
> 准备日期：2026-07-24（周五）｜建议发布日期：**2026-07-28（周二）北京时间 20:00–21:30**（详见第 4 节）
> 素材说明：HN 是纯文本社区，**没有**截图、视频、标签、分类字段——`promo/assets/` 的截图和视频本次用不上，也不需要录视频。只需要：标题 + URL + 你的首条评论。

---

## 1. 标题与提交 URL

### 提交入口与填法

1. 登录 HN 后打开 `https://news.ycombinator.com/submit`
2. **title** 填下面选定的标题；**url** 填提交 URL；**text 留空**（Show HN 带 URL 时不填正文，故事放首条评论里）
3. 提交后**立刻**在自己的帖子下发第 2 节的首条评论

**提交 URL（url 字段，原样粘贴）：**

```text
https://game.boobank.com/irontide/
```

### 标题候选（按推荐顺序排列，均 ≤80 字符）

**首选（77 字符）——技术钩子领跑：**

```text
Show HN: Iron Tide – a battleship game in a single 800KB HTML file (three.js)
```

理由：HN 工程师最容易被"single file / 800KB HTML"这种反常识技术点吸引，点进去是想看代码怎么塞进一个文件的，天然引向技术讨论而不是"又一个网页游戏"的划走。同时提前化解"AI 生成的套壳游戏吧"的第一印象——单文件本身就是个有态度的工程选择。

**备选 A（77 字符）——内容体量领跑：**

```text
Show HN: Iron Tide – browser battleship game with a 31-theater world campaign
```

理由："31-theater world campaign"传递了这不是周末小 demo 而是有完整战役结构的游戏。适合重发时替换使用。缺点：没有技术钩子，在 HN 的点击率通常弱于首选。

**备选 B（79 字符）——玩法广度领跑：**

```text
Show HN: Iron Tide – command a battleship, fly planes, drive tanks (in-browser)
```

理由：一句话展示"战列舰+飞机+坦克"的玩法跨度，最像游戏宣传语。缺点：也最像宣传语——HN 对营销味敏感，放最后。

**排除项说明**：三个标题都刻意不提"my kid"。历史数据摆在那：2018 年 kid-led 标题拿了 341 分，但 2025–26 年同类标题大多 1–6 分还招来 AI 质疑。孩子的故事放首条评论，让游戏自己先站住。

---

## 2. 首条评论（英文，提交后立刻发）

```text
Hi HN — poster (and parent) here.

Iron Tide is a naval action game that runs entirely in the browser: you command a battleship through a 31-theater world campaign, and along the way you can also fly planes, drive amphibious tanks, fight on foot, and mount extra cannons onto your deck at port. There's a rival, Grand Marshal Varga, who talks to you over story radio; each theater gets its own procedurally generated music (31 profiles); plus dynamic weather, a photo mode (L key), quick battle and sandbox modes, gamepad and touch support, and English/Chinese localization. Free, no account, no ads, no install.

Transparency up front, since I know the question is coming: my kid (GitHub handle VideoGameTips) designed and built the vast majority of this solo — the gameplay, the campaign, the systems. Original repo: https://github.com/VideoGameTips/irontide

I'm the parent. I maintain a polished fork — bug fixes, finishing the i18n, onboarding, achievements, performance — and I used AI-assisted code review for that polish work. The game itself is the kid's. Fork: https://github.com/longmaolab/irontide

We deliberately keep my kid's name, age, and everything else private, so I front the accounts and I'll be the one answering here.

Tech: three.js (r128), essentially one ~800KB index.html plus vendored libs — no build step; what you view-source is the game. It's an installable PWA (manifest + service worker) and runs on desktop and mobile. There's an early multiplayer mode too, but it's experimental — please judge the single-player.

What I'd genuinely love feedback on:

- Performance on your hardware (there are quality settings and adaptive quality, but real-world reports beat my test matrix)
- Whether the first five minutes teach the game well enough
- Anything in the campaign that feels unfair or confusing

Play: https://game.boobank.com/irontide/
```

---

## 3. 评论应对手册（8 种典型评论 + 英文回复模板）

通用原则：**快**（前 2 小时每条都回）、**短**（HN 讨厌长篇辩护）、**诚实**（不知道就说不知道）、**永远不拿孩子年龄当挡箭牌**。

### 3.1 AI 质疑（"这是 AI 写的吧？" / "又一个 AI 生成游戏"）

必然出现，是 2025–26 年同类帖的头号死因。策略：不辩解、不受伤，直接给可验证的事实（公开的 commit 历史），并主动区分"孩子的游戏本体"和"家长 fork 里用了 AI 辅助的部分"——主动坦白比被挖出来强一百倍。

```text
Fair question, and I'd rather answer it head-on. The game — gameplay, campaign, systems — was designed and built by my kid; the commit history on the original repo (https://github.com/VideoGameTips/irontide) is public if you want to look. Where AI *was* involved: on my fork I used AI-assisted code review for the polish work (bug fixes, i18n, performance). I'm not going to claim the project is AI-free, because my part isn't — but the game is the kid's.
```

### 3.2 "单文件？为什么？"（"800KB 的 HTML？这是反模式吧"）

这类通常是好奇多于攻击。策略：承认权衡，讲清单文件的真实好处（零构建、即改即刷、view-source 即代码、配合 PWA 离线），别硬说这是最佳实践。

```text
Honest answer: it grew that way, and we kept it. For a project like this the zero-tooling loop — edit, save, refresh — is hard to beat, there's no build step to break, and view-source *is* the source. The vendored libs also keep the PWA fully offline-capable. The tradeoffs are real (diffs are noisy, some editors groan at an 800KB file), so I wouldn't prescribe it for a team, but for one person shipping a game it's been a feature, not a bug.
```

### 3.3 性能吐槽（"我的机器上掉帧" / "手机发烫"）

这是最有价值的反馈，回复要像收 bug report 一样感谢并追问环境。游戏有画质设置和自适应画质（含 bloom），先指过去，再请对方提 issue。

```text
Thanks — this is exactly the feedback I wanted. Could you share device / OS / browser (and GPU if you know it)? There's a quality settings menu, and adaptive quality should step things down automatically (including bloom) — I'd like to know if it isn't kicking in for you. If you have a minute, an issue at https://github.com/longmaolab/irontide would be gold.
```

### 3.4 依赖安全（"vendored three.js r128 太老了，有没有安全问题"）

策略：承认 r128 老，说明风险面（纯客户端静态页、无账号、没有敏感数据可偷）、vendor 的原因（PWA 离线 + 不依赖 CDN），欢迎具体的 CVE 指引，不承诺具体升级时间表。

```text
Legitimate point — r128 is old. Context on the risk surface: it's a static, client-side game with no accounts and nothing to log into, so the blast radius is small, but I'm not dismissing it. The libs are vendored so the PWA works fully offline and doesn't depend on a CDN staying alive. I'd like to move to a current three.js eventually; the r128-to-modern jump is a pile of breaking changes, so it hasn't been the top priority. If you know of a specific CVE relevant to r128 in this usage, please point me at it.
```

### 3.5 COPPA / 隐私方向的指责（"让小孩上网公开项目合适吗" / "收集儿童数据？"）

多数是真关心，少数是找茬。策略：**回答一次，事实清楚，然后离开那个线程**。核心事实：游戏无账号无广告没什么可收集；孩子的姓名/年龄/地点/长相零公开；所有对外账号都由家长出面。不解释育儿观，不接续辩论。

```text
Reasonable thing to raise. The game has no accounts, no sign-up, and no ads — there's nothing to hand over to play it. On the family side: we publish zero identifying details about my kid (no name, age, location, or photos — the GitHub handle is just a handle), and I, the parent, front every public account including this one. That's a line we decided on before publishing anything.
```

（如果对方继续纠缠或上升到人身：停止回复。见 3.8。）

### 3.6 真诚的"怎么教孩子编程"提问

Show HN 上最好的评论类型，认真回。策略：只讲真实发生过的做法，不编造学习路线；不透露任何个人信息。核心经验：项目归属权在孩子、早发布早看到真人玩、家长做 maintainer 而不是 director。

```text
The honest version of what worked for us:

1. The project belongs to the kid — their repo, their design calls, their game. I never "took over the keyboard."
2. Ship early. A rough playable thing that a family member actually plays teaches more than any tutorial.
3. I took the maintainer role, not the director role: bug fixes, deployment, i18n — the unglamorous stuff — on a fork, so the kid's repo stays theirs.
4. Feedback is encouragement-first. "This boss fight is cool — and here's a bug I hit" lands very differently from a code review.

No curriculum, no bootcamp — just a game they wanted to exist. Happy to answer specifics.
```

### 3.7 功能建议（"应该加潜艇" / "求 VR 支持"）

策略：一律感谢，引到 GitHub issue，同时说清方向由原作者定——这既诚实又再次强化"孩子是作者"的事实。

```text
Thanks — noted! Best place for this is a GitHub issue (https://github.com/VideoGameTips/irontide for the original, or my fork at https://github.com/longmaolab/irontide). Fair warning on roadmap: the game's direction is the original author's call, not mine — I just keep the fork polished. But real player suggestions are exactly what I hoped to collect today.
```

### 3.8 恶意贬低（"垃圾" / "这也配上 HN" / 阴阳怪气）

**默认策略：不回复。** HN 的社区自净机制（downvote、flag）对纯恶意评论很有效，你回一句它就多活一小时。判断标准：

- 评论里**有任何可执行的信息**（哪怕包在恶意里）→ 只回那个信息点，忽略情绪部分，用下面模板
- 纯情绪、纯人身、钓鱼 → **沉默**。不点踩（你的 karma 也不够）、不 flag 战、绝不提"这是孩子做的所以你不该这么说"——那等于把孩子推出来挡枪，也正中对方下怀

仅在有实质内容时使用：

```text
There's a fair point buried in there — [restate the one actionable thing neutrally]. I'll look at that. Thanks.
```

---

## 4. 发布流程与后勤（中文）

### 4.1 时间

- 7 月美东是 EDT（UTC−4），北京时间快 12 小时。
- **首选：2026-07-28（周二）美东上午 08:00–09:30 = 北京时间 7 月 28 日（周二）晚 20:00–21:30。**
- 备选：07-29（周三）、07-30（周四）同一时段。
- 不建议今天（周五）和周末发：HN 周末流量低，且首发机会只有一次，别浪费在低谷。

### 4.2 账号要求

- 用**家长自己的** HN 账号发（隐私规则：所有对外账号家长出面）。
- 如果还没有账号：**今天（周五）就去注册**，然后在周末用真实身份正常参与几条评论——不是刷 karma，而是让账号在发帖时不是一个零历史的全新绿名账号（新账号用户名显示绿色，容易被当 spam flag）。
- **绝对红线：不拉票。** 不发"帮我点个赞"的链接给朋友、不让家人注册账号投票、不在微信群求赞。HN 的 voting-ring 检测非常灵敏，被判定拉票会直接杀帖且可能连累账号。让帖子自然生长。

### 4.3 发帖当晚的守候

- Show HN 规则明确要求发帖人在评论区在场。**提交后的头 2 小时是生死线**——早期评论互动直接决定能否离开 /newest 页。
- 北京时间 20:00 发帖意味着守到**凌晨 00:00–02:00**，请当天下午补觉、家里事提前安排。
- 每条评论都尽快回（用第 3 节模板打底，按具体内容改写，别整段原样贴导致回复雷同）。
- 首条评论必须在提交后 5 分钟内发出——很多人点进来先看有没有作者说明。

### 4.4 服务器与缓存（提前 24 小时做完，即 07-27 周一）

HN 首页帖子通常带来**数万独立访客**，务必提前演练：

1. `ssh root@207.148.98.206` 检查 VPS：磁盘、内存、Caddy 进程正常。
2. **Cloudflare 加缓存规则**：对 `game.boobank.com/irontide/*` 建 Cache Rule（Eligible for cache / 相当于 Cache Everything），Edge TTL 建议 2 小时。游戏是纯静态 HTML，走 Cloudflare 边缘后 VPS 几乎零压力——这是本次最重要的一步保险。
3. 确认 Cloudflare 的 Brotli 压缩开启（800KB 的 HTML 压缩后会小很多）。
4. **代码冻结**：周一起到发帖结束不改版。缓存 + service worker + 发布中途改代码 = 用户各自拿到不同版本的经典事故。
5. 开无痕窗口 + 手机各实测一遍 `https://game.boobank.com/irontide/`，确认冷加载正常、PWA 安装正常。
6. 唯一绕过缓存直连 VPS 的是实验性多人模式的 WebSocket——它本来就标注 experimental，如果当晚扛不住，属于可接受的降级，不必为它加班。

### 4.5 重发礼仪（如果首发没起来）

- 判定标准：48 小时后 <5 分且没有实质讨论 → 允许**一次**重发。
- 时间：等 2–3 周，即 **2026-08-11（周二）之后**，同样选周二至周四美东上午。
- 重发时换标题变体（比如首发用了首选标题，重发用备选 A），首条评论可微调但事实不变。
- 另一条正规通道：发邮件给 `hn@ycombinator.com`，礼貌说明"first Show HN didn't get seen, would appreciate a second-chance pool consideration"——HN 官方有 second-chance 机制，版主人工把有价值但被埋没的帖子重新放回首页候选，这比自己重发成功率更高。
- 一次重发为限。反复重发会被当 spam。

---

## 5. 预期管理（发帖前请先读这一段）

把预期先说透：**Show HN 的中位数结局就是几个赞、两三条评论，然后沉下去。** 2018 年那个"12 岁女儿写的游戏"拿到 341 分是那个年代的例外；2025–26 年同类的孩子作品帖大多停在 1–6 分，还常常要先扛一轮"是不是 AI 写的"。所以请把成功重新定义：只要有几个陌生人真的开了一局、留下一条真实反馈（哪怕是掉帧吐槽），这次发布就值了——那是孩子的游戏第一次被世界上不认识的人认真玩过。无论分数如何，回头告诉孩子的版本应该是："你的游戏上了 Hacker News，有真的工程师玩过并且留了话。" 这句话本身就是奖杯。分数是玄学，游戏是真的，孩子做出它这件事更是真的——这三样里只有一样不由我们控制，而恰好是最不重要的那样。
