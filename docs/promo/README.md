# Iron Tide 推广作战手册

> 生成于 2026-07-24（周五）。所有渠道调研基于 2025–2026 的平台现状。
> **贯穿全文的两条硬约束**：① 所有账号由家长注册和发言，任何地方不出现孩子的真名、年龄、城市、学校、照片，只说 "my kid" 或 GitHub ID `VideoGameTips`；② 不编数字、不吹牛，联机功能一律标注 experimental 或不提。

---

## ⛔ 先读这个：[`channels/00-privacy-gate.md`](channels/00-privacy-gate.md)

对抗式审查（8 个 agent 逐条核对平台规则和游戏事实，151 项发现）查出两处隐私问题。**家里定的口径是：名字可以公开，私人邮箱不行，年龄/城市/学校不公开。**

1. **提交历史里的私人邮箱** —— fork 仓库已重写（作者名保留，只换邮箱为 noreply）。**孩子自己的仓库 `VideoGameTips/irontide` 还没改**，需要他本人操作；在那之前，文案里"去看提交历史"的邀请仍会通向邮箱。
2. **游戏源码里的注释** —— 四处"谁写了哪段"的注释已改成中性表述，需部署后生效。

细节和命令都在隐私闸门那一页。

## 这个目录里有什么

```
promo/
├── README.md            ← 你在读的这份：总控 + 日历 + 优先级
├── AUDIT-FINDINGS.md    对抗式审查的 151 项完整发现（发帖前逐条自查）
├── channels/            渠道手册（逐字可复制）
│   ├── 00-privacy-gate.md      ⛔ 发帖前的隐私闸门（先读这个）
│   ├── itch-io.md              itch.io 上架（零门槛，先做这个）
│   ├── crazygames.md           CrazyGames Basic Launch（玩家量最大）
│   ├── newgrounds.md           Newgrounds（即传即发，反馈文化强）
│   ├── reddit-posting-kit.md   r/WebGames · r/playmygame · r/IndieGaming
│   ├── threejs-ecosystem.md    r/threejs + three.js 官方论坛 Showcase
│   ├── show-hn.md              Hacker News Show HN
│   ├── product-hunt.md         Product Hunt
│   └── submit-once-kit.md      Free Game Planet / 两个 newsletter / YouTube Shorts
├── assets/final/        成品物料（下方清单）
└── builds/              两个发行 zip（已 iframe 实测通过）
```

## 物料清单（已产出，可直接用）

| 文件 | 规格 | 用在哪 |
|---|---|---|
| `assets/final/01-menu.png` | 1600×900 | 所有渠道截图 1（英文主菜单 + 31 战区 + 沙盒地图） |
| `assets/final/02-combat-hud.png` | 1600×900 | 截图 2（追尾视角、五艘敌舰、命中播报、HUD 全貌） |
| `assets/final/03-broadside.png` | 1600×900 | 截图 3 / 主视觉（白天舷侧齐射） |
| `assets/final/04-armory.png` | 1600×900 | 截图 4（军械库分类面板 + 火力对比） |
| `assets/final/05-night.png` | 1600×900 | 截图 5（星空夜战，月光水面） |
| `assets/final/06-briefing.png` | 1600×900 | 截图 6（战区简报卡 OPERATION 1） |
| `assets/final/cover-itch-630x500.png` | 630×500 | itch.io 封面（尺寸是它的硬性要求） |
| `assets/final/thumb-ph-240x240.png` | 240×240 | Product Hunt 缩略图 |
| `assets/final/og-1280x720.png` | 1280×720 | 社交卡片 / YouTube 封面底图 |
| `assets/final/preview.gif` | 600px 宽 7 秒 | Reddit / Discord / README 动图 |
| `assets/final/iron-tide-hero-45s.mp4` | 1600×900 48 秒 | 所有渠道的视频位 |
| `builds/irontide-itch.zip` | 0.4 MB | itch.io（保留联机入口，去掉 service worker） |
| `builds/irontide-portal-singleplayer.zip` | 0.4 MB | CrazyGames / Newgrounds（额外隐藏联机入口） |

**hero 视频的镜头顺序**：舰桥第一人称推进（0–9.5s）→ 追尾视角对轰（9.5–18.5s）→ 环绕运镜（18.5–32.5s）→ 黎明光线（32.5–40.5s）→ 军械库面板（40.5–44.5s）。要剪短版就从环绕段截。

**重新生成物料**（游戏更新后）：

```bash
cd repo && npm install
node tools/capture-screenshots.js && node tools/capture-hero-video.js
node tools/build-portal.js && node tools/verify-portal-build.js
```

`verify-portal-build.js` 会把两个 zip 解压到本地 HTTP 服务、**放进 iframe 里**跑 10 项检查（能开战、31 战区在、地形模块在、泛光在、配乐在、无 service worker、联机入口按预期显示/隐藏、无 console 报错）。上架前必跑，全绿再提交。

---

## 优先级：每分力气换到的真实玩家

**第一梯队（真正带玩家）**：CrazyGames（月访问约 7800 万、明确非独占、有 QA 门槛）> itch.io（零门槛、jam 文化、鼓励值高）> Newgrounds（即传即发、反馈最直接）。
**Poki 跳过**——默认 5 年 web 独占，与开源 + 自托管冲突。

**第二梯队（社区，带真实反馈）**：r/WebGames、r/playmygame、r/threejs + three.js 官方论坛 Showcase（这是 threejs.org 首页精选的正式入口）、一次 Show HN。

**第三梯队（一次提交长期有效）**：Free Game Planet、Web Game Dev newsletter（CrazyGames 和 Poki 赞助，被收录等于在门户编辑面前露脸）、Gamedev.js Weekly。

**Product Hunt**：值得做一次，但**不是玩家渠道**。2025 年起编辑精选制，只有约 10% 被 featured，受众是创业者不是玩家。放在最后，当作"一天的鼓励事件 + 一条永久高权重外链"。

---

## 四周日历（从 2026-07-24 周五算起）

| 时间 | 动作 | 手册 |
|---|---|---|
| **7/24 周五（今天）** | GitHub topics + homepage（**已完成**）；README 改版（**已完成**）；awesome-open-source-games PR（**已提交**） | — |
| **7/25 周六** | itch.io 上架（草稿 → 实测 → 公开）；同日发首篇 devlog | `itch-io.md` |
| **7/26 周日** | Newgrounds 上传；Free Game Planet + 两个 newsletter 各投一封 | `newgrounds.md` `submit-once-kit.md` |
| **7/27 周一** | **开始养 Reddit 账号**（r/WebGames 要求 7 天号龄 + 10 comment karma）：每天认真评论 2–3 个别人的游戏 | `reddit-posting-kit.md` §1 |
| **7/28 周二** | CrazyGames 提交 Basic Launch（提交前跑一次 `verify-portal-build.js`） | `crazygames.md` |
| **7/29 周三** | three.js 官方论坛 Showcase 发帖（有审核延迟，早发早排队） | `threejs-ecosystem.md` |
| **8/1 周六** | r/threejs 发帖（原生上传视频，技术钩子开头） | `threejs-ecosystem.md` |
| **8/3 周一** | r/WebGames 发帖（此时号龄已够）；当天全程回评论 | `reddit-posting-kit.md` |
| **8/6 周四** | r/playmygame 发帖（求反馈框架，当天也给别人反馈） | `reddit-posting-kit.md` |
| **8/11 周二** | **Show HN**（美东上午发；前置：VPS 压测 + 首条评论准备好） | `show-hn.md` |
| **8/17 周一** | r/IndieGaming（距上次自推超过两周，规则允许） | `reddit-posting-kit.md` |
| **8/23 周日** | **Product Hunt**（周日排名门槛最低；太平洋时间 00:01 上线 = 北京时间 15:01） | `product-hunt.md` |
| **持续** | YouTube Shorts 每周一支（无人脸无童声，纯游戏画面） | `submit-once-kit.md` |
| **记到日历** | 2027 年 1 月 Coolest Projects 开放报名（18 岁以下全球作品展，收现成项目） | 见下 |

**为什么不同一天全发**：同样内容同时出现在多个平台首页会被识别成营销活动，招来版主删帖。而且服务器扛不住叠加流量。

---

## 发帖前必跑：文案事实核对

```bash
node tools/verify-copy-claims.js
```

19 项断言，把文案里写死的数字（31 战区、29 艘船、61 飞机、22 坦克、12 勋章、7 沙盒图）、关键功能、以及四个最容易写错的键位（Tab 开军械库 / F 装炮 / E 上炮位 / L 拍照）全部对着**线上构建**核一遍，任何一条对不上就退出码非零并打印真实值。

里面有一条反向断言：**确认游戏里没有排行榜**。之前文案宣传过一个"家庭高分榜"，那个功能从来不存在——这类"凭印象写出来的功能"是店面页最容易翻车的地方，所以专门留了一条守着。

游戏每次改动完、每次发帖前跑一次。

## 上线前必做的三件事

1. **压测**：Show HN 上首页 = 几小时内几万次访问。提前确认 Vultr VPS + Cloudflare tunnel 扛得住，建议给 `/irontide/*` 的静态资源加 Cloudflare cache-everything 规则。
2. **隐私体检**：两个仓库的 commit 历史、README、GitHub profile 里如果有真名/邮箱/地理位置痕迹，在游戏被人关注之前清理掉。`boobank.com` 的 WHOIS 确认开了隐私保护。
3. **给 Andy 的预期管理**：先说清楚"中位数结果很小"——itch.io 中位数游戏一辈子只有约 600 次游玩，Reddit 帖子拿几个赞是常态。**陌生人认真玩过之后写的每一条评论，才是这件事的奖励。** 尖锐评论由家长先过滤再转述。

---

## "孩子做的"这个故事怎么讲

这是双刃剑，2018 年 "Show HN: 我 12 岁女儿写的游戏" 拿了 341 分，但 2025–2026 年同类帖子普遍只有个位数分，还会被追问"是不是 AI 写的"。

**统一口径**（所有渠道一致）：

- **标题只放游戏**，不放孩子。孩子的故事放在正文末尾或首条评论里。
- **分工讲清楚**：孩子（GitHub: VideoGameTips）独立设计并写了游戏主体——玩法、31 关战役、舰机坦步系统；家长维护打磨版 fork（修 bug、补全中英双语、新手引导、成就、性能），过程中用了 AI 辅助代码审查。
- **开源就是证明**：两个仓库的 commit 历史都是公开的，质疑者自己会去看。不用争辩，给链接就行。
- **不打悲情牌、不打神童牌**。就说"这是我家孩子做的，我们觉得挺好玩，免费的，你要不要试试"。

---

## 少儿展示渠道（鼓励价值最高，但要等窗口）

| 渠道 | 状态 | 下一个窗口 |
|---|---|---|
| **Coolest Projects Online**（树莓派基金会） | 2026 届已于 5/27 截止 | **2027 年 1 月开放报名**，收现成项目，18 岁以下，13 岁以下由家长代报，人人有证书和个性化反馈 |
| **Hack Club** | 需 13 岁以上**本人**参与，家长不能代 | Stardance 计划到 2026-09-30；Daydream/Campfire 城市 jam 不定期 |
| **GitHub Game Off** | 只收比赛期间新做的游戏，Iron Tide 本体不能参赛 | 每年 11 月，可用同一账号做小新作导流 |
| **js13kGames** | 技术上不可能（13KB 上限，three.js 就超了） | — |

---

## 已经完成的动作

- ✅ GitHub 仓库加了 10 个 topics（`threejs` `threejs-game` `browser-game` `webgl` `html5-game` `naval-combat` `game` `javascript-game` `open-source-game` `pwa`）+ homepage 指向试玩地址
- ✅ README 改版：顶部一键试玩 CTA、英文一句话说明、5 张截图 + 动图、准确的内容量数字
- ✅ 向 `michelpereira/awesome-open-source-games` 提了收录 PR
- ✅ 6 张宣传截图 + 3 种规格封面 + 动图 + 48 秒 hero 视频
- ✅ 两个发行 zip，iframe 内 10 项检查全绿
- ✅ 4 个可重复运行的物料生产脚本进了仓库 `tools/`
