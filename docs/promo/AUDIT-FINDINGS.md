# 对抗式审查完整发现清单

> **⚠️ 这是历史记录，不是待办清单。** 下面 151 项发现于 2026-07-24，blocker 和大部分 major
> **当天已修复**（两处隐私泄露都已处理：源码注释已改并部署，两库的提交历史邮箱已重写成 noreply
> 且作者名保留）。保留原文是为了记录"为什么这么判断"，方便以后游戏改版时不再踩同样的坑。
>
> **本文件正文一律不写出任何真实的私人邮箱地址**——这个仓库是公开的，把要保护的地址登记在这里
> 会直接抵消掉历史重写的效果。凡是需要指代它的地方一律写「孩子的旧私人邮箱」。

> 2026-07-24，8 个 agent 逐份审查渠道手册，每条断言都对照线上构建和平台现行文档核实。
> 共 **151 项**：32 blocker / 55 major / 64 minor。
>
> **blocker 和大部分 major 已经修掉**（见 PR #90 的提交记录）。这份清单保留全文，
> 是为了两件事：① 发帖前逐条自查；② 以后游戏改版了，同样的坑不要再踩一遍。
>
> 已修的项目在下面依然列出——因为"为什么这么写"比"改成了什么"更有用。


---

## threejs-ecosystem.md

**审查结论**：serious-problems · 14 项

**做得好的部分**（不要在后续修改里弄丢）：

- The `islandSurfaceY` code block in the Discourse post is a faithful reproduction of the real js/terrain.js — variable names (`islandLocal`, `islandLayerNorm`), the `o.r>30` guard and the 3.8 / 2.1 / 1.3 height constants all match. Safe to post verbatim; only whitespace and comment alignment differ.
- The strongest technical claim in the kit — "no raycasts against geometry anywhere in the movement code" — is verifiably TRUE. `grep -c "Raycaster\|raycast\|intersectObject" index.html` returns 0. This is the claim most likely to be challenged on r/threejs and it holds.
- `updateAdaptiveQuality(rawDt)` exists at index.html:911 with exactly that signature. The vendored postprocessing list (EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, CopyShader, LuminosityHighPassShader) matches vendor/postprocessing/ file-for-file. The "unit-tested in Node with a minimal THREE.Vector3 stub" claim is backed by tests/terrain.test.js and terrain.js's own header comment.
- Game facts are clean: 31 theaters, rival "Grand Marshal Varga" (the renamed one, not Admiral Thorne), photo mode on L, PWA + gamepad + touch, bilingual EN/中文, quick battle + sandbox + 3-star theater ratings all verified in the live source. No invented feature counts anywhere.
- All date and timezone math is correct: 2026-07-24 is a Friday, 2026-07-28 is a Tuesday, and Beijing 21:00–23:00 on 7/28 is exactly 09:00–11:00 US Eastern (EDT).
- The Discourse background claims match the official category text verbatim in substance — moderator approval required, and homepage "updated a couple of times a year" vs the doc's 约每半年刷新一次.
- Anti-manipulation hygiene is genuinely good: §2 says 不要请任何人去点赞,不要用小号 and §5.6 forbids 刷数据 / 反复发新帖 / 私信轰炸版主. There is no vote solicitation, no astroturfing, and no fake urgency anywhere in the kit.
- Multiplayer is correctly and consistently labeled experimental (Scenario 3), and the r128 answer (Scenario 4) is honest and disarming rather than defensive — it converts the weakest technical point into a request for help, which is the right move for this forum.

### 🔴 BLOCKER — §4 回复模板 — 场景 2「有人问『真的是小孩做的吗?』」

**问题**：The template tells skeptics "the original repo's history is public" — i.e. it actively directs a skeptical audience into the commit log. That commit log currently exposes the kid's real name and personal email. `git log --format='%an <%ae>'` in repo returns: `Andy Li <孩子的旧私人邮箱>` and `VideoGameTips <孩子的旧私人邮箱>`. The master promo/README.md line 97 lists scrubbing this as an unfinished pre-launch task. So the kit ships a reply template whose whole persuasive mechanism is pointing strangers at the exact PII the hard rules forbid — real name, plus a reusable personal email.

**修正**：TWO changes, both required. (1) HARD PRECONDITION — add above §2: 「**发帖前必须先完成的事**:`git log --format='%an <%ae>' | sort -u` 在两个仓库上跑一遍。现在的输出里有 `Andy Li <孩子的旧私人邮箱>`——真名 + 私人邮箱。必须先用 git filter-repo 重写作者信息为 `VideoGameTips <VideoGameTips@users.noreply.github.com>`,并在 GitHub 账号设置里打开 'Keep my email addresses private' 和 'Block command line pushes that expose my email',同时检查 VideoGameTips 的 GitHub profile 没有真名、头像人脸、所在地。这一步没做完,本文档任何一条都不要发。」 (2) Replace the Scenario 2 block with text that never invites history inspection: `Fair question, and I want to be precise: the game itself — gameplay, the 31-theater campaign, the systems — was designed and built solo by my kid (GitHub: VideoGameTips). What I did as the parent is the polished fork: bug fixes, finishing the i18n, onboarding, achievements, and performance work, with AI-assisted code review. So the game is the kid's; the polish pass is mine. They're a minor, so I keep anything identifying about them offline — I hope that's understandable.`

### 🔴 BLOCKER — §2 一楼评论 · 第一条 tech note;§3 正文 · 「Architecture: one HTML file, no bundler」

**问题**：Both posts claim three.js is vendored locally with "no CDN dependency at runtime", and the Discourse version adds the dare "You can View Source the whole game." There IS a runtime CDN dependency. index.html:10521 injects `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js` as a fallback when the local copy hasn't loaded after ~2s. This is posted to the one audience guaranteed to View Source, immediately after being invited to. A 30-second grep destroys the honesty framing the entire post rests on.

**修正**：In the Reddit 一楼评论, replace the first bullet's second sentence with: `` `three.min.js` (r128) and the official bloom example passes (EffectComposer / UnrealBloomPass etc.) are vendored locally — no npm, no build step. There's one runtime fallback: if the local copy hasn't loaded after ~2s the page injects the cdnjs r128 build, so a broken static host still boots. `` In the Discourse 正文, replace the first paragraph's dash clause with: `are vendored locally — no npm, no build step. (One honest caveat: there is a single CDN *fallback* — if the local `three.min.js` hasn't appeared after ~2s the page injects the cdnjs r128 copy so a misconfigured host still boots. A normal load never touches the network beyond this origin.) You can View Source the whole game.`

### 🔴 BLOCKER — §3 正文 · 「Platform bits」→ i18n bullet

**问题**：The bullet says i18n is "handled at the string boundary with a `t()` wrapper — a few hundred call sites, so the game logic never branches on language." Two falsehoods. There is no `t()` in the codebase (`grep -o "\bt(" index.html` = 0); the helper is `const T=(en,zh)=>(isZh()&&zh!=null)?zh:en;` at index.html:444, with 312 call sites. And the game logic demonstrably DOES branch on language: `isZh()` is called directly 31 times in game and render code (e.g. the duration formatter and the LORE_ZH_BEATS chronicle branch inside endGame). Naming a function that doesn't exist is the single most checkable error possible on a forum full of people who will open the file.

**修正**：Replace the bullet with: `- **i18n:** English/中文 through a two-argument `T(en, zh)` helper (~310 call sites) plus small lookup tables (`trName` / `trText` / `trRank`) for generated strings and unit names. It isn't perfectly clean — about thirty places still test `isZh()` directly where Chinese needs different word order — but it keeps the whole translation layer inside the same single file.` Also delete the same `t()` claim if it is mirrored in any sibling channel doc.

### 🔴 BLOCKER — §3 注册与准备 步骤 2–3;§3 发帖表单字段 表格「正文」行

**问题**：The Discourse plan cannot execute as written. Discourse trust level 0 (a brand-new account) is hard-capped at 1 image per post, 2 hyperlinks per post, and zero attachments, and cannot send personal messages. The kit instructs the parent to drag in 3 screenshots, ships a body containing 5 link occurrences across 3 distinct URLs, and suggests also dragging in the MP4. The offered workaround — 先删掉原始仓库那条链接 — is arithmetically insufficient: removing it still leaves the play URL and the fork URL appearing twice each. The parent will hit a wall mid-compose on a post that took real effort.

**修正**：Rewrite 注册与准备 steps 2–3 as: 「2. 注册后**先升到 Trust Level 1(Basic)再写帖子**。TL0 新号的硬限制是:一帖最多 **1 张图**、最多 **2 个链接**、**不能传任何附件**、**不能发私信**——按下面的正文写法必然被系统拦下。升级条件是公开且明确的:**进入至少 5 个主题、读满 30 个帖子、累计阅读满 10 分钟**。踏实读 15 分钟 Showcase 区就会自动升级,可在头像 → Preferences 里确认当前 trust level。3. **确认已是 TL1 再发帖**,这样 3 张截图 + 3 个链接都能正常放。万一仍停在 TL0:只放 1 张 `01-menu.png`,正文只留试玩链接和 fork 链接两条(把 Links 小节整个删掉、把 VideoGameTips 那个内联链接改成纯文字 `GitHub: VideoGameTips`),等过审后再用回复补齐其余截图和链接。」 And replace the 正文 table cell's tail with: 「**MP4 不要拖进去**——Discourse 把视频当附件,TL0 完全禁止、TL1 也有体积上限,6.5MB 的 hero 视频大概率被拒。要动图就用 `promo/assets/final/preview.gif`(600×338 / 7 秒 / 1.1MB)。」

### 🟠 MAJOR — §0 时间表 整个表格

**问题**：This kit's schedule contradicts the master calendar in promo/README.md, which assigns the Discourse Showcase post to 7/29 周三 and the r/threejs post to 8/1 周六. This doc says Discourse on 7/24–7/25 and r/threejs on 7/28. Worse, README schedules the parent's Reddit account warm-up to *begin* 7/27 (每天认真评论 2–3 个别人的游戏). Posting a native video with a link-bearing first comment from a cold Reddit account on 7/28 — one day into warm-up — is exactly the pattern Reddit's spam filter removes silently. The parent following two files gets two different launch dates.

**修正**：Reconcile both files to one date. Recommended, because it preserves this doc's own correct Tuesday-US-morning reasoning AND clears the warm-up: set the Discourse row to 「7/29 周三 | 提交 Discourse Showcase 帖(前提:账号已升到 TL1)。Showcase 要过版主审核,**预期几天才出现**,不要重复提交」 and the Reddit row to 「8/4 周二 北京时间 21:00–23:00(= 美东周二上午 9–11 点) | 发 r/threejs 帖。此时家长账号已按 `reddit-posting-kit.md` 养了 8 天,不会被当新号过滤」. Then edit promo/README.md's calendar: change the 8/1 周六 r/threejs row to 8/4 周二 so the two files agree.

### 🟠 MAJOR — §1 通用素材:30 秒视频录制(整节)

**问题**：The section tells the parent to start from zero — full-screen Chrome, Cmd+Shift+5 or OBS, then CapCut — as if no video exists. Three finished videos are already in promo/assets/final/: iron-tide-hero-45s.mp4 (1600×900, 47.9s), iron-tide-clip-20s.mp4, and preview.gif (600×338, 7s). This is an evening of duplicated work. It is also not a pure duplicate — the hero video's documented shot order (bridge FP → chase → orbit → dawn → armory) genuinely lacks planes, tanks, infantry, photo mode and the map — so the instruction needs to become a targeted top-up, not a from-scratch shoot.

**修正**：Replace the section's opening with: 「### 先看已有素材(不要从零重录)\n`promo/assets/final/` 里已有成品:`iron-tide-hero-45s.mp4`(1600×900,48 秒)、`iron-tide-clip-20s.mp4`、`preview.gif`(600px/7 秒,给 Discourse 和 README 用)。hero 视频的镜头顺序是:舰桥第一人称(0–9.5s)→ 追尾对轰(9.5–18.5s)→ 环绕运镜(18.5–32.5s)→ 黎明光线(32.5–40.5s)→ 军械库(40.5–44.5s)。\n\n**只需要补拍三段** hero 视频里没有的画面:飞机起飞俯冲、两栖坦克抢滩 + 下车步战、按 L 的照相模式环绕。补拍时用和 hero 一致的 **1600×900**(不要用 1920×1080,否则同一条时间线上要缩放,画面会糊)。\n\n30 秒版剪法:齐射开场(从 hero 9.5–14s 截)→ 补拍的飞机段 → 补拍的坦克/步战段 → 补拍的照相模式段 → hero 的黎明环绕(32.5–37s)→ 最后 2 秒标题定格。」 Delete the 1920×1080 line and the OBS/CapCut from-scratch workflow above it.

### 🟠 MAJOR — 整份文档 — 缺少「预期管理 / 保护孩子」小节

**问题**：This is the only channel kit with no expectation-management section. show-hn.md has §5 预期管理, newgrounds.md has §8 合理预期, product-hunt.md has §6 including the explicit rule 不要让 TA 当天盯排名刷新 … 把筛选过的好评论给 TA. promo/README.md's own pre-launch item 3 mandates 尖锐评论由家长先过滤再转述. threejs-ecosystem.md only has §3 审核期望, which is about moderator latency, not the kid. r/threejs is the harshest audience in the whole plan — it is where "r128 is four years old", "this is AI-generated" and "a single 800KB HTML file is not architecture" will actually be said — and it is the one kit with no emotional brief for the parent.

**修正**：Add a new §6 before 未来冲击 threejs.org 首页: 「## 6. 预期管理(发帖前先读这一段)\n\n**先把成功重新定义。** r/threejs 的中位数结局是十几个赞、两三条评论。论坛 Showcase 帖典型是几十次浏览。这两个数字都不是失败,是常态。真正的奖励只有一种:**一个不认识你们的人,真的开了一局,然后写下具体的东西**——哪怕是「iPad 上掉帧」。那是孩子的游戏第一次被世界认真对待。\n\n**这个版块会说什么。** r/threejs 是全流程里技术最硬、嘴最直的一站。大概率会出现:「r128 是 2021 年的,为什么不升级」「这是 AI 写的吧」「单文件 800KB 不算架构」。这些不是针对孩子的恶意,是工程师之间默认的说话方式——但十几岁的人读起来不是这个感觉。\n\n**所以:原始评论区由家长先过滤。** 不要把 Reddit 页面直接推给孩子刷。当天晚上由你挑出**具体的、玩过之后写的**那几条,连同一句「有人专门为你的游戏写了这些」一起转述。技术批评先自己消化,过两天再当成「下一版要做什么」的素材讲给 TA,不要在发帖当晚讲。\n\n**不要让孩子自己回评论。** 所有账号是家长的,所有回复用第 4 节模板,这既是隐私红线,也是情绪缓冲带。」

### 🟠 MAJOR — §3 审核期望 · 第二条

**问题**：The escalation advice is both impossible and off-protocol. It says to DM a moderator after 3 days — but trust level 0 accounts cannot send personal messages at all, so a new account literally has no such button. It also says 私信给 @mrdoob 以外的活跃版主, i.e. hand-pick a moderator, whereas the official "About the Showcase category" text says to message the `@moderators` group. Hand-picking an individual maintainer on a small forum is precisely the behavior §5.6 of this same document forbids (不要私信轰炸版主) — the kit contradicts itself.

**修正**：Replace the bullet with: 「- 不要因为没出现就重发。官方 Showcase 分类说明原话就是审核会慢、可以 message `@moderators`——**那是一个用户组,不是某个人**。等满 3 整天再礼貌地发一条给 `@moderators`,不要点名任何个人,尤其不要私信 @mrdoob。另外注意 TL0 账号根本发不了私信,这是第 3 节要求先升到 TL1 的又一个理由。」

### 🟡 MINOR — §1 开头;§2 开头;§3 背景

**问题**：Three oddly precise, unsourced statistics: r/threejs 约 3.4 万订阅, 历史区间大约 15–107 个赞, and 典型帖子 30–170 次浏览. I could not verify any of them (reddit.com is not fetchable from this environment). They are internal Chinese notes rather than posted copy, so they cannot embarrass the family publicly — but the kit's own 诚实红线 is 不编数字, and a range like "15–107" reads as fabricated precision. The 30–170 views figure is actually useful expectation-setting and worth keeping in softened form.

**修正**：§1: 「r/threejs 的展示视频(原生上传)效果最好,比纯链接帖显眼得多。」 §2: 「r/threejs 是个中小型技术版块,没有严格的自我宣传限制,技术钩子最有效。发帖前请自己打开侧栏把规则读一遍——尤其确认是否**强制**要求 flair,有些版块没 flair 会被自动删帖。」 §3: 「典型帖子的浏览量是几十次这个量级——这里图的不是流量,是进入 three.js 官方视野。」

### 🟡 MINOR — §2 发帖步骤 第 2 步与第 6 步

**问题**：Step 6's hedge (如果发帖界面允许视频帖带正文) leaves the parent hunting for a body field that does not exist. Reddit's Images & Video tab restricts the post to a title and strips long-form body text; that is a settled behavior, not an unknown. Leaving it as a maybe wastes time at the worst moment — the two minutes right after a video post goes live, when the first comment needs to land.

**修正**：Replace step 6 with: 「6. **Images & Video 标签页不提供正文框**——这是正常的,不要去找。视频帖的「正文」就是你自己的一楼评论。所以:点 Post 之后**立刻**在自己的帖子下贴出下面的「一楼评论」代码块,越快越好(前几分钟就会有人点进来找链接)。贴完后自己刷新一次确认评论没被自动折叠。」

### 🟡 MINOR — §3 正文 · 「Procedural per-theater music (no audio files)」

**问题**："Each of the 31 campaign theaters has its own profile … Battle vs. ambient states switch profiles" is literally true but leads readers to expect per-theater battle music. index.html:1341 reads `if(mode!=='ambient') return MUSIC_PROFILES.default;` — the per-theater profile applies only in the ambient state; every theater shares one battle profile. Also the profiles carry more than scale+progression (drone, pad, pulse, shimmer, melody, perc, cutoff, barDur), so the description undersells the real work while overselling the coverage.

**修正**：Replace the paragraph with: `There are zero audio files. Each of the 31 campaign theaters has its own **ambient** profile in a `MUSIC_PROFILES` table — scale, chord progression, percussion voice, filter cutoff, bar duration — synthesized live from WebAudio oscillators; combat drops to a shared battle profile so the mix stays readable under gunfire. It keeps the whole game tiny and still gives every theater its own mood.`

### 🟡 MINOR — §2 标题 A、标题 B;§3 标题;§2 一楼评论;§3 正文

**问题**：The size figure ~800 KB appears five times. index.html is 837,223 bytes = 818 KiB. "~800 KB" is defensible if you mean KiB, but anyone who saves the file sees 837 KB, and this post's entire appeal is precision. Rounding down the one number people can trivially check is an avoidable own-goal.

**修正**：Change every instance of `~800 KB` to `~820 KB` (818 KiB / 837,223 bytes). Affected strings: 標題 A `A 31-theater battleship campaign in a single ~820 KB index.html — three.js r128, no bundler, procedural WebAudio music, PWA [sound on]`; Discourse 标题 `Iron Tide — a 31-theater battleship campaign in a single ~820 KB index.html (r128, no bundler)`; and the two body sentences beginning `Essentially the whole game lives in one` / `Essentially the entire game is a single`.

### 🟡 MINOR — §2 标题 B

**问题**：Title B promises "Here's 30 seconds of it", which locks the edit to an exact runtime. After the §1 fix the clip may land at 28s or 34s, and a title that misstates its own attached video is a small credibility scratch on a post whose selling point is accuracy. Title B also front-loads "My kid" in the title, which contradicts promo/README.md's cross-channel rule 标题只放游戏,不放孩子 — 孩子的故事放在正文末尾或首条评论里.

**修正**：Delete Title B and mark Title A as the only option, adding one line: 「(不提供「我孩子做的」版本标题——总控手册的统一口径是**标题只放游戏**,孩子的故事放在一楼评论的 Honest credit 段落里。技术版块尤其如此:先用技术把人留住,再讲人的故事,比反过来强。)」 If a story angle is still wanted later, keep it out of the title and out of the first sentence.

### 🟡 MINOR — §2 一楼评论;§3 正文(通篇英文)

**问题**：Density of em-dash asides is high enough to read as machine-written to the exact audience most primed to suspect it — the kit's own Scenario 2 exists because 是不是 AI 写的 is expected. The Reddit comment alone runs seven em-dash clauses in five short paragraphs, and stock connectives ("Honest credit", "genuinely interesting", "Happy to answer questions") stack the same impression. The prose is otherwise clear and specific; it just needs unevening.

**修正**：Do one editing pass converting roughly half the em-dash asides to full stops or commas, and cut the three stock phrases. Concretely: change `Honest credit: the vast majority of the game — gameplay, campaign, systems — was designed and built solo by my kid` to `About who made what. My kid designed and built the game itself, solo: the gameplay, the campaign, the systems.`; change `Happy to answer questions — and for deep engine questions I may relay them to the repo issues.` to `I'll answer what I can here. Anything deep in the engine I'll take to the repo issues and reply there with actual code.`


---

## crazygames.md

**审查结论**：needs-fixes · 17 项

**做得好的部分**（不要在后续修改里弄丢）：

- 游戏事实基本干净:31 战区、12 枚奖章、3★ 战区评分(index.html:8492-8500 确认为「胜利 1★ + 快于标准时间 +1★ + 未损舰 +1★」)、7 张沙盒图、每战区独立程序化音乐、中英双语——全部与实测一致。全文 0 处 'Admiral Thorne' 残留,对手统一为 Grand Marshal Varga(源码中 32 处 Varga,并确有无线电嘲讽台词),这条最容易踩的坑没踩。
- §5 的三个 KPI 与官方 Basic Launch 文档逐字对得上:平均游玩 10+ 分钟、次日留存 10–15%、转化率 80%+、加载 <10 秒、体积 <20MB,连「指南针,不是判决书」(a compass, not a final grade)的框定都忠实转述了,没有编数字。
- 平台硬指标全部核对无误:250MB / 1500 文件上限、初始下载 ≤50MB、进入 gameplay ≤20 秒、<20MB 才有移动端首页资格、4GB 内存 Chromebook、必须相对路径且明令禁止绝对路径、非独占、后台自带 preview 环境、每份提交都过人工 QA。封面三尺寸(16:9 1920×1080 / 2:3 800×1200 / 1:1 800×800)与「图上只能有游戏名、无边框、非原始截图、三张风格一致」的限制也与官方一字不差。
- §1.1 脚本里的四处 patch 锚点在 index.html 中全部真实存在且唯一:manifest 第 7 行、SW 注册 10497–10499 行、`log.querySelector('#mpBtn').onclick=openMultiplayer;` 第 4557 行、水印 `game.boobank.com/irontide` 第 8560 行。每处带 `assert` 的做法是对的——上游一改就报错而不是静默漏改。我另外验证了 `openMultiplayer` 在全文件仅此一处被调用,所以 `.remove()` 确实能彻底切断联机入口;脚本保留 icons/ 也是对的(index.html:9-10 的 favicon / apple-touch-icon 真的引用了它们,删掉会 404)。
- §1.4「真机测不满意就先只上 desktop」和 §4「被拒是常态,不是终点」的处理方式是这份文档最好的部分——先降风险再求全,且完全没有刷量、拉票、互赞、多平台灌水一类会反噬的建议。§5 结尾写给孩子的那段把「两周数据无论好坏都只是下一轮打磨的输入」讲清楚了,预期管理到位。

### 🔴 BLOCKER — §0 一页速览「视频」行 + §2.2 表单字段对照表「Video」行

**问题**：文档说「CrazyGames 提交**不需要**视频,不用录」。这是错的。官方 Game covers 文档原文:「You must add 3 cover images (landscape, portrait and square) and upload preview videos when you submit your game to CrazyGames.」预览视频是**必交项**,而且要两条(横屏 + 竖屏),规格与已产出的 iron-tide-hero-45s.mp4(1600×900、48 秒、带声音)全部对不上。按现在的文档走,家长会在提交表单卡住,或者上传一条必被打回的视频。这是整份套件最大的缺口。

**修正**：§0 表格该行改为:「视频 | **必需**——2 条预览视频:横屏 1080p 16:9(1920×1080)+ 竖屏 1080p 2:3(720×1080);长度 15–20 秒(超过 20 秒会被平台裁掉);单条 ≤50MB;**必须无声**;首帧用对应比例的静态封面图,便于从封面平滑过渡;不要黑场/黑边、不要鼠标指针、不要 logo、不要任何促销文字」。§2.2 的「Video | 不需要」改为「Video | 上传横屏 + 竖屏两条预览视频(规格见 §0)」。并在 §1 增加一节 §1.7「预览视频制作」:现有 `promo/assets/final/iron-tide-hero-45s.mp4` 不能直接用(48 秒、1600×900、有音轨),需重新导出——从中挑 15–18 秒最有画面冲击的连续片段(主炮齐射 / 舰载机起飞 / 抢滩),重渲染为 1920×1080 无音轨版本,再单独裁 / 重构一版 720×1080 竖屏,两条的首帧分别换成 §1.6 的 16:9 与 2:3 封面。

### 🔴 BLOCKER — §2.2 表单字段对照表「Build」行

**问题**：「Build | 上传 `promo/builds/irontide-portal-singleplayer.zip`」与 §1.1 开头「**不要**直接上传 `promo/builds/irontide-portal-singleplayer.zip`」直接打架。家长按 §2 的顺序操作时只会看到 §2.2 这一行,结果上传的包里仍然带着 manifest.json 和 `game.boobank.com/irontide` 水印——正好命中 §1.1 列出的两条改动理由,以及 §4 自己列的「导流」拒绝原因。

**修正**：该行改为:「Build | 上传 §1.1 脚本产出的 `promo/builds/irontide-crazygames.zip`(**不是** `irontide-portal-singleplayer.zip`,后者仍带 manifest 与站外水印)」。

### 🔴 BLOCKER — §1.6 封面图制作 —— 「输出文件名」代码块

**问题**：给出的三个输出路径是 `promo/assets/final/og-1280x720.png`、`03-broadside.png（需竖裁）`、`thumb-ph-240x240.png`。这三个都是**已经产出、另有用途**的文件,而且尺寸没有一个对得上要求:og 是 1280×720(要 1920×1080)、03-broadside 是 1600×900(要 2:3 800×1200)、thumb-ph 是 240×240(要 800×800)。按字面执行会覆盖掉 Open Graph 图和 Product Hunt 缩略图,同时交出三张尺寸全错、必被 QA 打回的封面。

**修正**：整个代码块替换为三个全新文件名,不碰任何已产出资产:
```
promo/assets/final/cover-cg-landscape-1920x1080.png   # 16:9
promo/assets/final/cover-cg-portrait-800x1200.png     # 2:3
promo/assets/final/cover-cg-square-800x800.png        # 1:1
```
并在下面加一行:「导出后用 `sips -g pixelWidth -g pixelHeight <文件>` 逐张核对尺寸,三张都必须与上面标注完全一致。」

### 🟠 MAJOR — §1.3 iframe 本地测试

**问题**：一节里有四个互相对不上的路径,家长必然拿到 404:(1) 让把一段 **HTML** 存成 `tools/verify-portal-build.js`(扩展名是 .js);(2) 正文却让浏览器打开 `http://localhost:8080/iframe-test.html`(第三个名字);(3) iframe 的 `src="crazygames-build/index.html"` 指向一个 §1.1 从未创建过的目录;(4) §1.1 实际把构建产物放在 `promo/builds/.verify/portal`。四处没有一处能对上。

**修正**：统一为一处。§1.3 开头改为「存为 `promo/builds/iframe-test.html`」,iframe 那行改为 `<iframe src=".stage/irontide-crazygames/index.html"` (与下面 §1.1 修正后的输出目录一致),下面的命令块保持 `cd promo/builds && python3 -m http.server 8080`,浏览器地址保持 `http://localhost:8080/iframe-test.html`。

### 🟠 MAJOR — §1.1 构建脚本 —— `OUT=` 与结尾 zip 命令

**问题**：两个副作用:(1) `OUT=promo/builds/.verify/portal` 正是现有 `.promo-verify.js` 用来存放 portal 验证构建的目录,脚本第一行 `rm -rf "$OUT"` 会直接抹掉已通过 iframe 验证的产物;(2) 结尾 `cd "$OUT"` 后 `zip -rq ../irontide-crazygames-build.zip`,`..` 解析成 `.verify/`,最终 zip 落在隐藏目录 `promo/builds/.verify/` 里,而 §2 从头到尾没有再提过这个路径,家长在 Finder 里根本看不到它。

**修正**：脚本头部改为:
```
SRC=repo
OUT=promo/builds/.stage/irontide-crazygames
ZIP=promo/builds/irontide-crazygames.zip
```
结尾三行改为:
```
cd "$OUT"
rm -f "$ZIP"
zip -rq "$ZIP" . -x '.*'
echo "---- zip 内容与体积 ----"
unzip -l "$ZIP"; ls -lh "$ZIP"
```

### 🟠 MAJOR — §0「构建体积」行,并连带 §1.2 第 2 条、§1.5 第 1 条、§5 KPI 表「转化率」行

**问题**：「实测约 **1.4MB**」被当成 zip 体积反复引用了四次,但实测不是这个数。`irontide-portal-singleplayer.zip` 实际 458,427 字节 ≈ **0.44MB**;1.4MB 是**解压后**的大小(1,481,627 字节)。文档把解压体积冠上「实测」二字当 zip 体积用,属于自己发明数字——正是这份套件在别处严格避免的事。(文件数 11 个是对的:portal 包 12 个文件,CrazyGames 版再去掉 manifest.json 正好 11。)

**修正**：§0 该行改为:「构建体积 | 实测 zip **约 0.45MB**(解压后约 1.4MB / 11 个文件),远低于 250MB / 1500 文件上限;初始下载远低于 20MB → 有资格出现在**移动端首页**」。§1.2 第 2 条改为「zip 约 0.45MB、解压后约 1.4MB、11 个文件」。§1.5 第 1 条括号内改为「0.45MB 的 zip 即使 3G 也只要几秒」。§5 表格改为「0.45MB 秒开 + 可跳过教程」。

### 🟠 MAJOR — §5「Full Launch 要求」列表最后一条「快速进入 gameplay(菜单即达,符合)」

**问题**：直接声称合规,但对不上官方原文。CrazyGames Gameplay 要求是:「Games should land new users in gameplay immediately. If this is not feasible... a maximum of 1 click is allowed.」而 Iron Tide 首次启动的实际流程是:index.html:4612 的 `buildMenu()` 在 `!career.seenIntro` 时弹出 prologue 弹窗(需点 BEGIN)→ 回到主菜单 → 点选舰种卡片 `chooseShip()` 才进战斗,**至少 2 次点击**,且 prologue 弹窗只能靠按钮关闭(`showStory` 没有绑 Esc / 点击外部关闭)。把一个真实风险写成「符合」,家长就不会去改,等 QA 打回才发现。

**修正**：该条改为:「快速进入 gameplay(**待确认**——官方要求「最多 1 次点击」,而首次启动是 prologue 弹窗 + 选舰共 2 次点击,是本次提交最可能被 QA 点名的一条)」。同时在 §4「QA 会检查的点」第 1 条末尾追加:「首次进入的点击数:官方原文是 land new users in gameplay immediately,做不到时**最多允许 1 次点击**。Iron Tide 首启是 prologue 弹窗 → 选舰 = 2 次。提交前的低成本缓解:给 prologue 弹窗加 Esc / 点击遮罩关闭,或把它挪到第一场战斗开始后再放。若被点名,这是首选整改项。」

### 🟠 MAJOR — §5「Full Launch 要求」列表第 2 条

**问题**：把「内容不超过 PEGI-12」只列为 Full Launch 的要求。实际上官方 Requirements Introduction 把「Adhere to PEGI12」写在 **Basic Launch** 要求里,Gameplay 页更是直接写「CrazyGames is a website for an audience aged 13 or more. Your game must be PEGI 12 compliant.」——这是这次提交就要满足的门槛,不是以后的事。写成 Full Launch 专属会让家长误以为首轮可以放松。

**修正**：从 §5 的 Full Launch 列表里移出,改放到 §0 一页速览「官方硬指标」行,该行改为:「官方硬指标 | 初始下载 ≤50MB;进入 gameplay ≤20 秒;**内容必须符合 PEGI 12(Basic Launch 就要求,不是 Full Launch 才要)**;桌面端必须支持 Chrome 与 Edge;英文本地化为强制项(Iron Tide 全部达标)」。§5 的 Full Launch 列表该条改为「内容 PEGI-12(Basic Launch 阶段已满足,继续保持)」。

### 🟠 MAJOR — §4「常见拒绝原因 → 应对」表「与已有游戏相似/名称混淆」行

**问题**：列了这条拒绝原因,却没告诉家长风险已经实际存在。Google Play 上有一款正在运营的 **Irontide**(`com.professorunggas.irontide`),自我描述是「arcade naval shooter where you command legendary warships from different fleets」——同名同题材,几乎是最坏的撞名情形;Steam 另有 Iron Tides。官方 Quality 指南明确要求 distinctive naming 与 IP ownership。§2.2 的 Game name 填 `Iron Tide` 会把这个风险最大化,而游戏自己的 title tag 本来就是更具区分度的「Iron Tide — Battleship Command」。

**修正**：§2.2 的 Game name 行改为:「Game name | `Iron Tide: Battleship Command`(用完整标题,与 index.html 的 title tag 一致。Google Play 上已有同题材的 Irontide、Steam 上有 Iron Tides,单写 Iron Tide 撞名风险高;副标题既能区分,又准确描述玩法)」;Slug 行改为 `iron-tide-battleship-command`。§4 该行的「应对」栏追加:「已知撞名对象:Google Play 的 Irontide(海战射击)、Steam 的 Iron Tides。用 §3.4 说明原创性,并强调本作名称含副标题、代码与美术全部自有、仓库有完整开发历史可查。」

### 🟠 MAJOR — §3.2 操作说明(Controls 字段)

**问题**：已列的键位我逐条比对源码 index.html:3908-3940 全部正确(含容易写错的 E 登机、P 跳伞、E 降落),但漏掉的几个会直接卡住玩家:**P**——舰船被击沉后回到己方港口按 P 才能换新船,这是唯一的复活路径(`bailoutOrBoard()` / `nearFriendlyHarborForReplacement()`),漏了玩家就以为游戏结束;**C**——潜艇下潜/上浮(`toggleDive`),而潜艇就在可选舰种里;**G**——开坦克时切换水陆(`tankLandToggle`),恰恰是 §3.1 描述里主打的两栖卖点;另外 **Q** 换随身武器、**X** 拆炮、**Y** 派 AI 飞机、**O** 舰队指令、**Esc** 跳过教程也都没写(官方 Quality 指南特别看重教程可跳过,写出来是加分项)。

**修正**：整块替换为:
```
Mouse + keyboard (gamepad and touch supported)

ON DECK
- WASD: walk, Mouse: look
- E: take the helm / man a turret / board a plane or deck tank
- F: install a purchased cannon on your deck
- G: go ashore / return to ship
- Tab: armory (shop), H: harbor upgrades, N: world map, B: build
- R: sonar, V: drop mine, Z: damage control, X: scrap a gun, Y: launch an AI-flown plane

AT THE HELM: W/S throttle, A/D rudder, T camera, C dive/surface (submarines), O fleet orders, E step away
TURRETS: Mouse aim, Left-click fire, E exit
PLANES: W/S throttle, A/D turn, Mouse pitch, Click guns, Space bombs, P parachute, E land
TANKS: W/S drive, A/D steer, Mouse aim, Click fire, G switch between land and water, E dismount
ON FOOT: WASD walk/swim, Click fire, Q change weapon, B build defenses, E board a tank
IF YOUR SHIP SINKS: sail back to your harbor and press P for a replacement
PHOTO MODE: L · SETTINGS: K · Esc: close a panel, or skip the tutorial
```

### 🟡 MINOR — §3.1 游戏描述,最后一段末句

**问题**：「full gamepad and touch support」写死在描述里,但 §1.4 明确建议真机测试不理想就先只勾 desktop。两边一旦不一致,提交页会出现「描述说支持触屏、Supported devices 却没勾 mobile」的自相矛盾,QA 一眼能看出来。

**修正**：该句改为 `Full gamepad support. Playable in English and Chinese.`,并在 §2.2 的「Supported devices」行末尾追加一句:「**若最终勾了 mobile**,再把 §3.1 末句改回 `Full gamepad and touch support.`——两处必须一致,否则 QA 会当成描述不实。」

### 🟡 MINOR — §3.3 内容分级/年龄问卷答复,最后一句

**问题**：「Comparable to mild-violence ratings such as PEGI 7-12」——PEGI 没有「7-12」这个区间,分级只有 3 / 7 / 12 / 16 / 18 五档。写一个不存在的档位,在一个专门看分级合规的字段里显得不专业。

**修正**：末句改为:`This is consistent with a PEGI 12 rating, and we confirm the game complies with the CrazyGames PEGI 12 requirement.`

### 🟡 MINOR — §1.6 封面图制作,做法第 3 步

**问题**：「叠上游戏名 `IRON TIDE`(只写这三个词……)」——IRON TIDE 是两个词。另外若按上面第 9 条改用完整标题提交,封面上写什么需要明确(官方只允许出现游戏名,多写一个字都可能被打回)。

**修正**：该步改为:「叠上游戏名 `IRON TIDE`(**只有这两个词**,粗衬线或军事风字体。官方规定图上除游戏名外不得出现任何其它文字——不要写 New / Play now,也不要加副标题、图标或商店 logo)」。

### 🟡 MINOR — §4「QA 会检查的点」第 6 条「导流」

**问题**：「游戏内不能有指向其它站点的链接/二维码/水印」把规则说死了。官方 Gameplay 页实际允许:菜单页可放社群链接(Discord、开发者网站),桌面版主菜单或结算页可放游戏商店链接,系列作之间可互链;**永远禁止**的是 App Store 链接,以及指向本作可玩版本的跨站导流。规则记错会让家长以后误删本来允许的东西,也会削弱他对这份文档其它判断的信任。

**修正**：该条改为:「**导流**:禁止 App Store 链接,禁止把玩家导向本作在别处的**可玩版本**(战报水印里的 `game.boobank.com/irontide` 正是这一类,所以 §1.1 第 4 处必须改)。官方实际允许的是:菜单页的社群链接(Discord / 开发者网站)、桌面版主菜单或结算页的游戏商店链接、系列作互链——首次提交我们一律不放,过审后再考虑。」

### 🟡 MINOR — §3.4 给审核/原创性问题的补充说明

**问题**：「designed and built primarily by a young developer in our family」主动向一个商业平台披露主要作者是未成年人。开发者门户条款要求账号持有人为成年人,平台从来没问过作者年龄,这句是白送的信息,可能引出监护人证明、权利归属之类的追问,反而把简单的原创性问答复杂化。GitHub handle 已经足够满足署名与佐证需求。

**修正**：首两句改为:`Iron Tide is an original, open-source game. It was designed and built by a member of our family (GitHub handle: VideoGameTips), and I am the account holder and maintainer of the polished fork submitted here.` 其余保持不变。

### 🟡 MINOR — §0 建议时间表「之后」行

**问题**：「QA 反馈通常几个工作日到两周」和「工作日提交,QA 响应更快」都没有官方依据——官方 FAQ 只说明**更新**通常当个工作日内处理完,对**首次提交**的审核时长没有任何承诺。写成「通常」会让家长按这个节奏排预期,过了两周没消息就以为出事了。

**修正**：该行改为:「之后 | 官方**未公布**首次提交的审核时长(FAQ 只承诺过审后的**版本更新**一般当个工作日处理完),一切以后台消息线程为准。把等待期当成默认状态,不要按天数推测结果。若在 8 月初获批,两周测试大约 8 月中旬结束,届时看数据(§5)」。§0 时间表 7/27 行的「工作日提交,QA 响应更快」删去,改为「工作日提交,后台消息回复更及时」。

### 🟡 MINOR — §1.2 构建自检清单

**问题**：补丁改的 `#mpBtn` 就在无线电日志页脚里,和 §0 提到的 🌐 语言切换按钮同处一片 UI,清单只检查了「MULTIPLAYER 按钮消失」,没检查语言切换是否还在。而官方 Gameplay 页把英文本地化列为强制项,双语切换又是这作的亮点,patch 误伤了不会有任何报错。

**修正**：在「主菜单**看不到** 🌐 MULTIPLAYER 按钮」下面补一条:「- [ ] 主菜单右上角的 🌐 语言切换按钮**仍在**,点击能在 English / 中文之间来回切,切换后舰种卡片与菜单文案都跟着变(官方强制要求英文本地化,且默认必须是英文)」。


---

## reddit-posting-kit.md

**审查结论**：needs-fixes · 22 项

**做得好的部分**（不要在后续修改里弄丢）：

- §0 时区换算和全部日期算术都对:EDT=UTC-4、北京领先 12 小时、"美东 9:00 = 北京 21:00" 正确;7/24(五)→7/31(五)→8/1(六)→8/4(二)→8/7(五)→8/8(六)→8/29(六) 星期几全部核对无误,包括"7/24 注册的号满 30 天后的第一个周六 = 8/29" 这个不容易算对的推导。
- §9.2 反 shadowban 一节是整份文档最扎实的部分,而且完全干净:明确禁止小号自赞、亲友集中点赞、删帖重发同链接、短链接、短期多版块刷同一 URL。全文没有任何 astroturfing 或催票建议,符合铁律。自查方法(无痕访问 /user/ 页面、r/ShadowBan 机器人)和申诉入口 https://www.reddit.com/appeals 都是真实有效的。
- 游戏事实大部分正确:31 个战区、12 枚勋章、three.js r128、单文件 index.html、PWA、手柄+触屏、中英双语,以及最关键的——对手名字用的是 Grand Marshal Varga,没有残留旧名 Admiral Thorne。联机全程标注 experimental 或不提,符合诚实铁律。
- §7 回复剧本的 ②(被质疑是 AI 做的)和 ⑤(尖锐批评)写得诚实、不辩解,而且主动交代家长这一侧用了 AI 辅助代码审查——r/webdev 最容易翻车就在这一点,提前坦白比被扒出来强得多。③ bug 反馈模板问的三个问题(设备/浏览器、当时在做什么、是否必现)也是真正可用的。
- 结构上的克制是对的:发帖前 2 分钟规则复查清单、四个版块拉开天数、r/WebGames 只有一次机会所以先重测线上版、被删帖先 modmail 不硬重发、明确排除 r/incremental_games。

### 🔴 BLOCKER — §3 正文 / §3 发帖后第一条评论 / §4 发帖后第一条评论 / §5 视频拍摄清单 35–45s(共 4 处)

**问题**：键位错了。实测键位是 Tab 开商店、F 放置火炮、E 上炮位、H 回港口。文档四处都写成 "F opens the port shop" / "Mount extra cannons on your deck at the port shop (F key)" / "港口商店(按 F)"。最糟的是它出现在发帖后立刻发的"新手提示"评论里——第一个照着按的人会公开纠正你,而且会显得家长根本没玩过孩子的游戏。视频镜头表也会照着错的键去录。

**修正**：§3 正文该条改为:"- Buy extra deck guns in the shop (Tab), drop them onto your deck with F, and man one yourself with E";§3 首条评论改为:"A few tips if you jump in: Tab opens the shop where you can buy extra deck guns — F places one on your deck, E mans it. L is photo mode if you catch a nice storm. If anything breaks, tell me your device + browser and I'll get it fixed — issues also welcome at https://github.com/longmaolab/irontide/issues";§4 首条评论改为:"- Tab opens the shop (extra deck guns: F places them, E mans them), H returns you to harbour, L is photo mode";§5 镜头表 35–45s 改为:"商店(Tab)买炮 → F 放到甲板 → E 上炮位 → 加装后齐射对比"。另在 §5 镜头表下加一行:"录之前先自己按一遍确认:Tab 商店 / F 放炮 / E 上炮 / H 港口 / L 拍照 / N 战术地图 / T 第一三人称 / G 下船步行。"

### 🔴 BLOCKER — §6 r/webdev 正文,"Some things that were fun to get working" 第二条

**问题**："Adaptive quality: it monitors frame rate and steps effects (including bloom) up or down automatically" 这条自动降级/自动调 bloom 的机制在实测清单里查不到——实测只确认了一个手动画质设置(I 键)。这是整篇技术帖里最"有料"的一条,发在 r/webdev 就是招人开源码验证的靶子;如果代码里没有帧率监控和自动降级,当场被拆穿,连带整篇的可信度和"孩子独立做的"这个说法一起崩。

**修正**：发帖前在源码里搜一遍(requestAnimationFrame 的帧率统计 / 自动切 quality 的分支)。确认不了就换成实测确认的写法:"- Quality control: a graphics-quality setting (I key) that scales the heavier effects down, which is what makes it survive on phones"。确认了再写回自动降级,并把触发阈值写具体。

### 🔴 BLOCKER — §2 养号周 7/24(五)/ 全部四篇帖子里的 https://github.com/VideoGameTips/irontide

**问题**：文档把孩子的 GitHub 仓库链接推给 r/IndieGaming(约 50 万订阅)等版块,却从头到尾没有一步要求先审计那个账号。铁律只管住了帖子正文里不写真名,但公开仓库的 commit author 邮箱、profile 的 Name/Bio/Location/头像、其他公开仓库和 Star 列表都可能带出真名、学校或城市,而且 commit 邮箱在公开仓库里任何人都能直接拉到。这是整份文档唯一真正会泄露孩子身份的口子。

**修正**：在 §2 的 7/24 那一格开头加一条硬门槛(未做完不得进入后续任何一天):"**发帖前置检查(必须全过)**:(1) 打开 github.com/VideoGameTips 的 Settings→Public profile,确认 Name、Bio、Company、Location、头像里没有真名、年龄、城市、学校、真人照片;(2) 在仓库里跑 `git log --format='%an <%ae>' | sort -u`,看提交作者名和邮箱有没有真名或常用私人邮箱,有就先到 GitHub Settings→Emails 勾选 'Keep my email addresses private' 和 'Block command line pushes that expose my email',已泄露的历史邮箱按需处理;(3) 翻一遍该账号其他公开仓库、Issue 留言、Gist、Star 列表,凡是能推出学校/城市/真名的先设私有;(4) 确认 boobank.com 的域名 WHOIS 已开启隐私保护,否则一个 whois 查询就能把家长真名地址拉出来。"

### 🟠 MAJOR — §5 视频拍摄清单 + §2 7/31 + §8 日历 8/7 行

**问题**：文档让家长用 OBS/QuickTime 重新录一条 30–60 秒的视频,给了完整八段镜头表——但成品里已经有 promo/assets/final/iron-tide-hero-45s.mp4(1600×900,48 秒)。家长会白白花一整晚重录,或者更糟:8/6 晚上才发现要录,来不及,8/7 的档期直接鸽掉。

**修正**：§5 "视频拍摄清单" 标题改为 "视频素材(已有成品,优先直接用)",正文首段改为:"**先用已产出的 promo/assets/final/iron-tide-hero-45s.mp4(1600×900,48 秒)**。发帖前只需确认三点:(a) 音轨是游戏内程序化音乐,没有任何第三方版权素材;(b) 最后一帧有没有 `Free in your browser — link in comments`,没有就补一帧;(c) 开头 5 秒是不是最强画面(暴风雨齐射)。三点都满足就直接传,不要重录。只有确认成品不可用时,才按下面的镜头表补录。" 同时 §2 的 7/31 与 §8 的 8/7 行把"录制/剪辑"改为"检查已有视频成品是否满足上述三点"。

### 🟠 MAJOR — §3 帖子类型("可用 Reddit 编辑器插入 2~3 张截图…比如战列舰主视角 + 世界地图 + 坦克登陆")

**问题**：指向了不存在的素材。实际产出的六张成品图是 01-menu / 02-combat-hud / 03-broadside / 04-armory / 05-night / 06-briefing,没有"世界地图"也没有"坦克登陆"。家长会在 promo/assets/ 里翻半天找不到,然后临时去游戏里现截,发帖时间就滑走了;而且写的是 promo/assets/ 而不是 promo/assets/final/。

**修正**：改为:"**帖子类型:** Text post(正文里放链接)。用 Reddit 编辑器按此顺序插入 3 张图,路径写全:`promo/assets/final/03-broadside.png`(齐射,最强画面放第一张)、`promo/assets/final/02-combat-hud.png`(战斗 HUD)、`promo/assets/final/04-armory.png`(军械库)。备选 `05-night.png`、`06-briefing.png`。注意:目前**没有**世界地图和坦克抢滩的成品截图,不要按这两个去找;想要就得先自己截。"

### 🟠 MAJOR — §1 总时间线 8/8 行 + §6 门槛两种情况 + §8 日历 8/8 行

**问题**：日历自相矛盾。§9.2 明确写"同一个 URL 不要短期内发到多个版块(这也是本日历把 4 个帖子拉开 3~7 天的原因)",但 8/7 发 r/IndieGaming、8/8 就发 r/webdev,间隔只有 1 天,而且是同一个 URL 在 24 小时内进两个大版——正是反垃圾系统最敏感的模式。文档自己给自己挖的坑。

**修正**：把老账号方案的 8/8 全部改成 **2026-08-15(六)**(距 8/7 有 8 天,符合 3~7 天以上的间隔原则),新账号备选保持 8/29。§8 日历对应行改为:"| 8/15 | 六 | r/webdev(仅老账号) | 20:30 | Sat 8:30 AM | Showoff Saturday flair;技术内容打头 |"。§1 表格同步改为"2026-08-15 或 08-29"。

### 🟠 MAJOR — §2 硬性门槛第三条 + §6 门槛("约 100 karma + 账号 30 天")

**问题**：这个门槛我在任何公开来源都核实不到。能查到的 r/webdev 明文规则只有两条:非商业项目展示仅限 Showoff Saturday、且必须以技术细节为主(该版约 310 万订阅)。文档拿一个查无实据的数字,让新账号硬等到 8/29——比 8/1 首帖晚了整整四周,而且把"老账号 vs 新账号"这个分叉写成了确定性规则。

**修正**：§6 门槛段改为:"**门槛(待核实):** r/webdev 公开规则只明确两点——非商业项目展示仅限周六、必须以技术细节为主。网上流传的 100 karma / 30 天门槛没有找到出处,不要为它白等三周。做法:**8/15(六)直接按 Showoff Saturday 发**。若被 AutoModerator 拦下,它的自动回复会写明真实门槛,再按那个数字顺延到最近的一个周六(最坏情况 8/29)。被拦不算事故,机器人删帖不留封禁记录。" §2 硬性门槛第三条同步改成"r/webdev:门槛未证实,按第 6 节处理"。

### 🟠 MAJOR — 全文缺失(建议新增 §0.5)+ §3 正文最后一行

**问题**：没有任何一处做情绪保护。全文只讲怎么发得出去、怎么不被封,没讲帖子沉了怎么办、孩子该不该看评论区。而 §3 正文还公开承诺 "I'll pass every comment on (kindly worded or not — I'll translate the tone)"——等于对着 Reddit 宣布"你说什么孩子都会看到",这既招引恶意评论,又把家长自己的过滤余地堵死了。r/IndieGaming 五十万人的版块,出现一条尖酸评论几乎是必然的。

**修正**：§3 正文末行改为:"Brutal honesty welcome — I read everything and pass the useful parts on to my kid."(不承诺原样转述)。并在 §0 后新增一节:"## 0.5 给家长的心理准备(发帖前和孩子一起过一遍)\n- 先约定什么算成功:**拿到 3 条能真正改进游戏的具体反馈就算赢**。不拿点赞数当目标,发帖前就把这句话跟孩子说清楚。\n- 说明最可能的结果:大多数帖子只有几十个赞、几条评论,甚至 0 评论。这跟游戏好不好没关系,是版块流量和时段决定的。\n- **账号只有家长登录,评论区只有家长看。** 孩子不刷帖、不看原始评论区、不参与任何和版主的沟通。\n- 家长每天固定挑一次时间,把评论整理成一份摘要念给孩子听:具体的表扬原样念;可执行的批评翻译成\"下一步可以做什么\";人身攻击、阴阳怪气、\"这不就是 AI 做的\"一律不转述。\n- 帖子沉了的那天,当天就带孩子看一条具体的正面反馈或一个已经修好的 bug,把注意力落回\"游戏又变好了一点\"。"

### 🟠 MAJOR — §9.1 r/WebGames 的"画恐龙解封"传统

**问题**：整整一节建立在一个查不到任何出处的传闻上,文档还特意加了一句"这不是段子"来加强可信度。真被 ban 了照着做——给陌生版主发一张手绘恐龙——轻则被当成怪人,重则耽误真正该走的 modmail 流程。更糟的是它建议"让孩子画一只反而更有诚意":把孩子拖进一次封禁申诉,还要把孩子的手绘和笔迹发给素不相识的版主。

**修正**：整节删掉,替换为:"### 9.1 被删帖 / 被 ban 怎么办\n网上流传的\"画恐龙才给解封\"之类说法查不到任何可靠出处,不要当成流程。标准做法:通过 modmail 私信版主 → 礼貌说明这是孩子做的免费开源游戏、无任何商业行为 → 问清具体违反了哪一条 → 按要求改正后再问能否重发。全程由家长处理,不要让孩子参与,也不要把孩子的画、手写字迹、任何自制物件发给陌生版主。态度平和 + 只谈规则,大多数情况几天内会有回应。"

### 🟠 MAJOR — §3 正文 "What's in it" 第 4 条

**问题**："12 medals, 3-star ratings per theater, quick battle mode, sandbox maps, dynamic weather" 里只有 "12 medals" 和 "sandbox maps" 是实测确认过的。"3-star ratings per theater"、"quick battle mode"、"dynamic weather" 三项都没有实测依据(§4 首条评论的 "Quick battle and sandbox modes"、§5 镜头表的"天气动态变化"同样受影响)。铁律第二条是不编数字——写了游戏里没有的东西,第一个玩家就会在评论区问"三星评级在哪"。

**修正**：发帖前逐条在游戏里点开确认。确认不了的就换成实测数字,这几个反而更有说服力:"- 29 playable ships, from a destroyer up to Yamato, Bismarck and Missouri\n- 61 aircraft and 22 vehicles, and you can crew any of them yourself\n- 31 campaign theaters, 7 sandbox maps, 12 medals"。§4 首条评论和 §5 镜头表里没确认的功能同步删掉。

### 🟠 MAJOR — §3 Link flair

**问题**：给的兜底 flair 不存在。r/playmygame 实际在用的 flair 是 `[PC] (Web)`、`[PC] (Windows)`、`[Mobile] (Android)`、`[Mobile] (Web)`、`General`,没有单独的 `[Web]`;家长在下拉列表里找 `[Web]` 会找不到而卡住。另外该版有自己的发帖入口/模板,不用它容易被自动删。

**修正**：改为:"**Link flair:** 选 **`[PC] (Web)`**。该版实际在用的是 `[PC] (Web)` / `[PC] (Windows)` / `[Mobile] (Android)` / `[Mobile] (Web)` / `General` —— **没有单独的 `[Web]`**;万一 `[PC] (Web)` 不在当天列表里,退而选 `General`。另外:先看该版侧边栏有没有自己的 \"Make a Post\" 按钮或发帖模板,有就用它发,不要用 Reddit 通用发帖框。"

### 🟠 MAJOR — §4 Flair

**问题**：flair 名字写错了形态。r/WebGames 的 flair 是括号缩写(`[HTML5]`、`[PZL]`、`[RPG]`、`[SIM]`、`[STRAT]`、`[MULTI]`、`[TD]`、`[IO]`、`[SPORT]`、`[INC]`),不是文档写的 "Action / Strategy" 这种全词。家长按"Action"去找会找不到,而最贴合本作、也是该版第二常用的 `[HTML5]` 文档完全没提。

**修正**：改为:"**Flair:** 该版 flair 是括号式体裁缩写,实际在用的有 `[HTML5]` `[PZL]` `[RPG]` `[SIM]` `[STRAT]` `[MULTI]` `[TD]` `[IO]` `[SPORT]` `[INC]`。本作首选 **`[HTML5]`**;若当天列表里有动作类缩写(如 `[ACT]`)则用它。列表里**没有**写成 \"Action\"/\"Strategy\" 全词的 flair,别按全词找。以当天下拉列表为准。"

### 🟠 MAJOR — §2 硬性门槛 / §4 定位 / §5 定位 / §9.3

**问题**：几条被当成硬规则的门槛我都核实不到出处:r/WebGames 的"账号 ≥7 天 + ≥10 评论 karma"和"3 个月不可重发"、r/playmygame 的"当天必须互评,否则删帖甚至警告"、r/IndieGaming 的"两周只此一帖"和"不放商店链接"。文档开头承认信息来自 2025 年存档快照,但正文却把它们写成了确定事实,而整个五周日历完全建立在这些数字上。

**修正**：在每处后面加 "(2025 快照,发帖当天必须在侧边栏 Rules 里逐条对照,以当天为准)";并把 §0 铁律第 3 条改为:"**发帖前 2 分钟重看该版现行规则。本文所有天数、karma 门槛、重发间隔均来自 2025 年存档快照,已无法在线核实——凡与当天侧边栏不一致的,一律以侧边栏为准,并当场改本文。**" 另外把 §9.3 的"r/playmygame 的当天互评是硬规则,不做会被删帖甚至警告"改成"…按 2025 快照是硬规则;即便当天规则放宽了也照做,这是该版的文化"——反正照做没坏处,但别把没核实的处罚写死。

### 🟡 MINOR — §3 正文 / §4 首条评论 / §5 首条评论 / §6 正文 / §7 模板②(共 5 处)

**问题**："I maintain a polished fork" 这个说法五处照抄,英文里不地道(fork 不会被形容为 polished),读起来就是机翻或 AI 生成的味道;而且同一个账号在四个版块发出一字不差的作者身份段落,任何人点开账号历史都会看出是复制粘贴的宣传模板。

**修正**：统一改成自然说法,并且四篇各写各的。例如 §3:"I'm the parent — I keep a maintenance fork going: bug fixes, translations, onboarding, performance.";§4:"I'm his parent; I do the unglamorous half — bug fixes, i18n, performance.";§5:"I'm the parent, and I patch things up afterwards — bugs, translations, performance.";§6:"I'm the parent; the fork is where I do maintenance — bug fixes, i18n completion, onboarding, performance."

### 🟡 MINOR — §3 正文第一条 / §4 首条评论第一条

**问题**："who taunts you over story radio dialogue" 和 "who talks to you over story radio" 这两句英文别扭,"story radio" 不是英文里的说法,母语者会读出翻译腔。

**修正**：§3 改为:"- A 31-theater campaign across a world map, with a rival — Grand Marshal Varga — who taunts you over the radio as you push forward";§4 改为:"- Campaign: 31 theaters across a world map, with a rival boss (Grand Marshal Varga) who taunts you over the radio between fights"

### 🟡 MINOR — §6 标题(两条)+ §6 正文第二段

**问题**：实测单文件是 ~835KB,文档一律写 ~800KB,而且"a single index.html plus vendored libraries"没提还有一个独立的 js/terrain.js。r/webdev 的人一定会点开仓库数字节数——发现你把体积往下抹、把"单文件"说得比实际干净,恰恰是这篇技术帖唯一的卖点上作假,得不偿失。老老实实写 835KB 反而更有说服力。

**修正**：标题里的 "~800KB" 改为 "~835KB";正文第二段改为:"The technically interesting part: the whole game is essentially one index.html — about 835KB of HTML/JS — plus a locally vendored three.js (r128) and one extra module for terrain generation. A manifest + service worker make it installable as a PWA, and the same build runs on desktop and mobile." 同时把"works like a native app"删掉(iOS 上的 PWA 达不到这个描述)。

### 🟡 MINOR — §7 回复剧本(缺一个模板)

**问题**：发 r/webdev 必然会被问的一个问题没有准备:"three.js r128 是 2021 年的版本,为什么不升级?" 这是技术版最容易出现、也最容易让家长临场答得难看的一条。现有六个模板都没覆盖。

**修正**：新增:"**⑦ \"为什么还在用 three.js r128?\"**\n\n```text\nHonest answer: it's what my kid started on in the beginning and there was never a forcing reason to move. Upgrading means re-checking every material, light and post-processing pass in the game, and for a kid, shipping the next theater always won over chasing the current release. It's on the list. The repo is open if anyone wants to look at what a migration would actually cost: https://github.com/longmaolab/irontide\n```"

### 🟡 MINOR — §1 总时间线 8/8 行、§2 硬性门槛第三条("见第 7 节")、§2 7/31 格("视频见第 6 节")

**问题**：三处章节交叉引用都指错了。r/webdev 是第 6 节不是第 7 节(第 7 节是回复剧本),视频镜头表在第 5 节不是第 6 节。家长按图索骥会翻到不相干的章节。

**修正**：§1 表格和 §2 硬性门槛里的"见第 7 节"全部改为"见第 6 节";§2 的 7/31 那格"视频见第 6 节"改为"视频见第 5 节"。

### 🟡 MINOR — §3 标题(约 13 万订阅)、§4 标题(约 12.5 万订阅)、§5 标题(约 40.6 万订阅)

**问题**：订阅数都偏低了。当前第三方统计:r/playmygame 约 13.5 万、r/WebGames 约 14.1 万、r/IndieGaming 约 50.5 万(r/webdev 约 310 万)。数字本身不影响发帖,但会让家长低估 r/IndieGaming 那一帖的流量量级——直接关系到下一条的服务器准备。

**修正**：改为 "§3 r/playmygame(约 13.5 万订阅)"、"§4 r/WebGames(约 14 万订阅)"、"§5 r/IndieGaming(约 50 万订阅)";或者干脆删掉数字,只在 §5 保留一句"这是四个版里最大的一个,量级是其他三个的三倍以上"。

### 🟡 MINOR — §2 7/31 收尾 + §8 日历(缺失项)

**问题**：全部四篇帖子都只指向 https://game.boobank.com/irontide/ ——一台家用 VPS 加 Cloudflare tunnel,没有任何备份链路。r/IndieGaming 五十万人的版块,帖子最热的那两个小时正是流量峰值;站点一卡,评论区看到的就是一个打不开的链接,帖子当场死掉,而且这是最不可能补救的一种失败。promo/builds/irontide-itch.zip 已经做好了,不用白不用。

**修正**：§2 的 7/31 那格加一条:"把 promo/builds/irontide-itch.zip 传到 itch.io 建一个备用页面(公开但不投放到浏览榜),记下 URL 存在手边。" §8 日历每一行的"当天额外动作"加一句:"守帖期间每 20 分钟自己开一次无痕窗口访问 game.boobank.com/irontide/;一旦变慢或打不开,立刻在帖子里补一条评论:`Mirror in case the main link is struggling: <itch URL>`。"

### 🟡 MINOR — §3 标题(两条,均以 "[Web] " 开头)

**问题**：标题前缀 "[Web]" 和你要选的 flair `[PC] (Web)` 重复标注同一件事。在 flair 已经承担平台标签的版块里,标题再带一个自制方括号前缀,看起来像是没搞懂版规的外来户,也白白占掉标题开头最值钱的位置。

**修正**：两条标题去掉 "[Web] " 前缀:"Iron Tide — my kid's battleship action game (31-theater campaign, planes, tanks). Looking for honest feedback on difficulty and onboarding" 和 "Iron Tide — free browser battleship game built by my kid. What would make you keep playing past the first theater?" 平台信息交给 flair。

### 🟡 MINOR — §2 每日任务 7/30(四)

**问题**："查一遍自己的 karma;若评论 karma < 30,今天补足" ——"补足"把整周的社区参与变成了凑指标。一个账号如果历史是八天集中评论、然后立刻甩链接,版主和老用户一眼就能看出是为发广告养的号,这正是这一节想避免的结果。

**修正**：改为:"7/30(四)| 看一眼账号状态。karma 数字不是目标,别为凑数去水评论——如果这一周你只在真想说话的时候才说话,数字自然够 r/WebGames 那 10 分的下限。真差得多,就再认真玩两个别人的游戏、写两条像样的反馈,而不是去刷十条短评。"


---

## newgrounds.md

**审查结论**：serious-problems · 22 项

**做得好的部分**（不要在后续修改里弄丢）：

- Section 5 explicitly forbids alt-account vote-stuffing and 'vote 5 plz' begging, and names both the account-reputation risk and the integrity reason. No astroturfing, no fake urgency, no cross-post spam anywhere in the kit — this is clean.
- Section 7's comment-triage workflow is genuinely protective: parent reads every comment first, three-bucket sort (useful/ mean/ reportable), 'the best response to a 0-star rant is no response', and a hard no on real name, age, city, school, face. This is the best part of the document.
- Section 8's expectation-setting paragraph is honest and kind. It names the blam risk without catastrophizing, refuses to treat front page or Daily as a goal, and reframes the actual win as first-hand stranger feedback. Good emotional armor for a kid.
- Section 0.3 is factually correct: Newgrounds' terms do require parental permission for 13-17-year-olds, the site does host adult content elsewhere, and 'the kid does not browse Newgrounds alone' is the right call.
- The 28M monthly-visits figure checks out (~27.9M, April 2026 Semrush/Similarweb) — not an invented number.
- The publish-time math is correct: 2026-07-25 20:00 Beijing = 12:00 UTC = 08:00 EDT Saturday morning.
- The zip self-check rules are right for Newgrounds (index.html at the zip root, relative paths only, no wrapper folder) and the actual build satisfies them — verified: irontide-portal-singleplayer.zip has index.html at root, 16 files.
- Author Comments correctly pre-empts the 'where are the medals?' complaint by distinguishing in-game medals from Newgrounds API medals. NG regulars do notice this.
- Choosing irontide-portal-singleplayer.zip is the right build for Newgrounds — it keeps NG traffic off the family VPS. It just needs the copy to match (see blocker on multiplayer).

### 🔴 BLOCKER — §0.2 local-verification comment (line 28), §2.3 Description (line 78), §2.4 Author Comments tips (line 110), §7.2 good-review reply template (line 220)

**问题**：The shop keybind is wrong, and it is wrong in the four places a new player is most likely to try it. The doc says 'press F at the port shop' / '进港口商店按 F'. Verified against the shipped build: Tab opens the shop (called the Armory in-game), F places/mounts a gun you already own, and H is harbor upgrades. The game's own tip strings read 'Press Tab for the Armory, then F to mount a gun right where you stand', 'Press H for harbor upgrades', and 'No guns mounted yet! Tab → pick a weapon → F on deck to install it.' A Newgrounds player who follows the store-page instruction presses F, nothing happens, and the very first thing they learn is that the description lies. This is the worst possible error during a judgment window.

**修正**：§2.3 Description sentence → 'Open the Armory with Tab, buy a gun, then press F on deck to bolt it on. Press H at your harbor for repairs and upgrades.' §2.4 tips line → '- Tips: Tab opens the Armory (buy a gun), F mounts it on your deck, H is harbor upgrades, L is photo mode.' §7.2 good-review template last sentence → 'If you have not yet, hit Tab for the Armory, buy a second gun, and press F on deck to mount it.' §0.2 verification comment → '（完整玩 2 分钟,含开炮、按 Tab 进军械库买炮、按 F 在甲板上装炮、按 H 进港口、按 L 拍照）'

### 🔴 BLOCKER — §2.3 Description, FEATURES bullet 4 (line 84)

**问题**：'family high-score board' is an invented feature. I grepped the shipped index.html: there is no scoreboard, no leaderboard, no high-score list, no shared board of any kind (the only 'bestScore' in the file is an aim-assist dot-product threshold). What actually exists is a per-theater career record in localStorage holding stars and a best clear time. The word 'family' also implies a shared/multi-player-profile feature that does not exist, and needlessly signals a personal detail on a platform where the account is meant to read as a normal dev account.

**修正**：Replace the bullet with: '- 12 in-game medals, plus a 3-star rating and best clear time saved for every theater'

### 🔴 BLOCKER — §2.3 Description last FEATURES bullet (line 91), §2.4 Author Comments (line 109), §7.2 multiplayer reply template (lines 235-239)

**问题**：The build being uploaded has no multiplayer, but the store copy advertises it three times. Verified by diffing the two zips: irontide-portal-singleplayer.zip contains `{const _mp=log.querySelector('#mpBtn'); if(_mp) _mp.style.display='none';}  /* portal build: single-player submission */` and never wires openMultiplayer, while irontide-itch.zip wires it normally. A Newgrounds player reading 'Experimental early multiplayer' will hunt for a button that is display:none. That is a false-advertising 0-star review during a judgment window that now blams at 2.00.

**修正**：Keep the singleplayer zip (correct choice) and delete all three mentions: (1) remove the FEATURES bullet '- Experimental early multiplayer (rough edges expected)'; (2) in Author Comments replace '- Multiplayer is EXPERIMENTAL and early — single player is the real game.' with '- This is the single-player build. There is an experimental multiplayer mode in the source repo, but it is not part of this submission.'; (3) delete the entire §7.2 '多人模式抱怨类' template — nobody can complain about a mode that is not there.

### 🔴 BLOCKER — §6 Under Judgment 机制 (line 197) and 附:发布时间线速查 (line 256)

**问题**：The blam threshold is wrong and predates a rules change. The doc says works scoring '大约低于 1.6' get blammed and that judgment lasts '数天' with results expected 7/27–31. Newgrounds changed judgment on 2024-12-06: the vote cap dropped from ~200 to 60, and the pass bar is now 40 votes → ≥1.00, 50 votes → ≥1.50, 60 votes → ≥2.00. The real bar is 2.0, not 1.6 — meaningfully harsher — and with a 60-vote cap judgment typically resolves in hours to ~48h, not the following week. The family would be watching the wrong number on the wrong schedule.

**修正**：Replace the first two §6 bullets with: '- 判定按票数分档(2024-12-06 起的规则):40 票需 ≥1.00 分、50 票需 ≥1.50 分、60 票需 ≥2.00 分,60 票封顶。\n- 达不到该档分数会被删除(NG 黑话 blammed);通过则永久保留并获得正式评分。因为票数上限只有 60,判定通常在几小时到 48 小时内出结果,不是好几天——发布当晚就要开始看。' And change the timeline table's last row from '2026-07-27–31(下周)' to '2026-07-26–27(周日–周一)| Under Judgment 多半已出结果;通过后截图留念,把好评翻给孩子'.

### 🔴 BLOCKER — §2.6 Rating(适龄分级)

**问题**：The descriptor checklist is not Newgrounds' form. The doc lists ESRB-style items with severity levels — 'Violence: Mild', 'Blood/Gore: None', 'Nudity: None', 'Language: None', 'Adult Themes: None'. Newgrounds' game submission uses five plain checkboxes with no severity levels: Nudity/Sexual, Violence, Explicit Audio, Explicit Text, Adult Themes — and a submission with zero descriptors checked is what gets auto-rated E. The parent will sit on the form hunting for 'Blood/Gore' and 'Language' dropdowns that do not exist, and 'Mild' is not a selectable value anywhere.

**修正**：Replace the descriptor block with: '内容描述项(NG 只有 5 个勾选框,没有轻重分级):\n- Nudity/Sexual:不勾\n- Violence:**勾上**(军事载具战斗、爆炸、核打击与神风机)\n- Explicit Audio:不勾\n- Explicit Text:不勾\n- Adult Themes:不勾(战争题材但无血腥、无脏话;若你读完 2.6 下面那段后觉得该勾,勾上也不影响 T 分级)\n注意:一个描述项都不勾的作品会被自动判为 E。'

### 🔴 BLOCKER — §2.6 Rating rationale (line 138 'Violence: Mild(军事载具战斗、爆炸,卡通化,无血腥)')

**问题**：The kit tells the parent to describe the game to a moderator as cartoonish vehicle combat with no gore, and never mentions what is actually in the build. Verified in the shipped index.html: the game includes a nuclear ICBM strike (R-36M, 45 references, you click a target area on the map), nuclear-payload bombers (b29, tu95v), and a dedicated kamikaze airframe — and `SETTINGS.contentFilter` defaults to `false`, so all of it is enabled out of the box. The parent needs to know this before rating and before the kid reads a review about it. T is still the right rating, but the characterization is an understatement to the person who decides your rating, and misrating invites exactly the staff re-rating / account-reputation hit the doc says it wants to avoid. Separately, the built-in content filter is a real selling point for a parent-run account and is nowhere in the copy.

**修正**：Add after the descriptor list: '⚠️ 先知道游戏里有什么再填表:游戏包含核打击(R-36M 洲际导弹、B-29/Tu-95 核载机)和一架专用神风机,默认是开着的。设置面板(按 K)里有「内容过滤」开关可以关掉这些。分级仍选 T,勾 Violence 即可——但别在任何地方把游戏描述成「只有卡通爆炸」,那是对审核和玩家都不诚实的说法。' And add to the §2.3 FEATURES list: '- Optional content filter in Settings (K) turns off the nuclear and kamikaze aircraft'

### 🟠 MAJOR — §3 上传 zip + 尺寸设置, step 3 (line 171)

**问题**：The fullscreen instruction is inverted. The doc says '勾选 Fullscreen(允许全屏按钮)'. Newgrounds' game form does not have an 'allow fullscreen' opt-in — it has a 'Hide fullscreen button' toggle, and the button is shown by default. Ticking the box as instructed would remove the fullscreen button from a game whose entire selling point is full-screen 3D naval combat.

**修正**：Replace step 3 with: '3. 全屏:NG 的选项是 **Hide fullscreen button(隐藏全屏按钮)**,默认不勾就等于允许全屏——**保持不勾**。(以页面实际措辞为准:如果它写的是 Hide/隐藏,就别勾;如果写的是 Allow/允许,才勾上。)游戏是响应式全屏设计,全屏才是完整体验。'

### 🟠 MAJOR — §2.3 / §2.4 and the note at line 115

**问题**：The long copy is in the wrong field, and the hedge is wrong. Newgrounds' game form has a short description (a one-to-two-line blurb used in listings and search) plus a separate Author Comments body. The doc pastes a ~1,000-character FEATURES list into 'Description' and then reassures the parent at line 115 that '有些版本 Description 和 Author Comments 是合一的' — they are not, and the parent will hit a length limit mid-paste with no fallback plan.

**修正**：Replace the §2.3 block with a short blurb: 'A first-person naval war game. Command your own battleship, buy and bolt on your own guns, and fight a 31-theater campaign against Grand Marshal Varga — or fly a plane, drive an amphibious tank, or fight on foot. Free, runs in the browser, English / 中文.' Move the entire FEATURES list to the top of Author Comments. Replace the line-115 note with: '说明:NG 的 Description 是**短简介**(列表页和搜索里显示,有字数上限,以输入框旁的计数为准),Author Comments 才是正文大文本框。FEATURES 清单放 Author Comments,不要塞进 Description。'

### 🟠 MAJOR — §2.4 Author Comments, the 'Original repo by the kid' link (line 104)

**问题**：This link routes Newgrounds' bluntest users straight onto the kid's own GitHub account, bypassing the entire comment-filtering workflow §7 spends a page building. That profile's bio currently reads 'IronTideDevTeam(actually it's only 1 person...)' and the account carries ~20 other repos including personal ones (david-story-book, gamereview, world-takeover, stickmanwarsim). GitHub issues on those repos are a feedback channel the parent is not watching and cannot triage. The doc's own §7 rule — parent reads everything first — is silently defeated by one hyperlink.

**修正**：Before publishing, either (a) turn off Issues and Discussions on github.com/VideoGameTips/irontide so the parent's fork is the only inbox, or (b) drop the direct link and credit in prose instead. Recommended Author Comments replacement: 'It is fully open source. The original game is by my kid (GitHub handle VideoGameTips); the polished build you are playing is my parent-maintained fork: https://github.com/longmaolab/irontide — bug reports and feedback go there, please.' Keep only the one link you can moderate.

### 🟠 MAJOR — §2.4 Author Comments (line 101) and §2.7 AI 内容申报

**问题**：Volunteering 'with some AI-assisted code review along the way' in the Author Comments on the one platform with a hard, loudly-enforced ban on generative AI is asking for a pile-on. Newgrounds bans AI-generated content outright and its community is militant about it. The phrase is vague enough that a hostile skimmer quotes it as 'AI-made game' — during a judgment window that now blams at 2.00 on as few as 40-60 votes. Do not hide it (§2.7's honesty instinct is right), but do not leave it quotable-out-of-context either. Separately, §2.7 tells the parent to answer 'No' without telling them to first confirm nothing shipped is AI-generated.

**修正**：§2.4: replace the AI clause with a precise, unquotable sentence placed in the notes list rather than the credits sentence: '- No generative AI in the game: every asset is code — the ships, terrain, weather and music are all generated procedurally by three.js and the Web Audio API, and there are no image or audio files to speak of. I used an AI assistant to review my own patches to the fork; none of the game content is AI-generated.' §2.7: add before the 'No' instruction: '先自查一遍:图标 icons/icon-192.png 与 icon-512.png、以及页面 og-cover.jpg 都不是 AI 生成的(确认过再答 No)。'

### 🟡 MINOR — §3 上传 zip, step 1 (line 162)

**问题**：'(几 MB,远低于 NG 上限,秒传)' — the actual file is 448 KB zipped, 1.45 MB unzipped, 16 files. A parent who sees 0.4 MB after being told 'several MB' may think they grabbed the wrong build and go hunting.

**修正**：'(448 KB,解压后 1.45 MB;NG 的 HTML5 zip 上限是 3,000 MB,秒传)'

### 🟡 MINOR — §0.2 zip 自检, service worker bullet (line 24)

**问题**：The self-test asks the parent to check service-worker behaviour that is not in the build. Verified: irontide-portal-singleplayer.zip contains 16 files and no sw.js (the itch zip has 17 and includes it). manifest.json is still present and is harmless in an iframe. The parent would spend time chasing a non-issue.

**修正**：Replace the bullet with: '- 这个构建包已经**移除了 service worker**(sw.js 不在包里),不会在 NG 沙盒里注册失败。manifest.json 仍在包内,iframe 里无害,无需处理。'

### 🟡 MINOR — §3, lines 163–164

**问题**：'Viewport' is split across a line break in the middle of the word, inside a bold marker: '**View' / 'port / Dimensions(嵌入尺寸)填:**'. This renders as broken markdown with a stray '**View' on its own line — the first thing the parent sees when they reach the upload step.

**修正**：Join into one line: '2. **Viewport / Dimensions(嵌入尺寸)填:**'

### 🟡 MINOR — §4 缩略图与截图 (line 180)

**问题**：The thumbnail recommendation contradicts its own description. It says to use `final/01-menu.png` but describes the ideal shot as '战舰开炮或天气效果最抓眼的那张'. 01-menu.png is the title menu. The broadside shot is 03-broadside.png. Also, the already-produced cover-itch-630x500.png and thumb-ph-240x240.png are not mentioned, so the parent may re-crop from scratch.

**修正**：'**Icon/Thumbnail(缩略图)**:用 `final/03-broadside.png`(战舰齐射,最抓眼)。如果 NG 的裁剪比例更接近方形,`final/thumb-ph-240x240.png` 已经是裁好的方图,可以直接用;横版封面可用 `final/cover-itch-630x500.png`。NG 上传时自带裁剪工具,主体居中、别让 HUD 文字被裁掉。'

### 🟡 MINOR — §4 缩略图与截图 (line 181)

**问题**：The requested screenshot coverage does not exist. The doc asks for one shot each of 战舰/飞机/坦克/步战/港口商店/照片模式. The six finals actually produced are: 01-menu (menu), 02-combat-hud, 03-broadside, 04-armory (the shop), 05-night, 06-briefing. There is no plane, tank, or infantry screenshot anywhere in promo/assets/final/. Also, Newgrounds' game form is a title / short description / cropped icon / genre / rating / commentary / tags form — it may not offer a separate screenshot gallery at all, in which case the five extra images have nowhere to go.

**修正**：'- 已产出的 6 张是:01-menu(菜单)、02-combat-hud(战斗 HUD)、03-broadside(齐射)、04-armory(军械库商店)、05-night(夜战)、06-briefing(战前简报)。**没有**飞机/坦克/步战的截图——想要就现补拍三张,不想补就按现有的用。\n- NG 的游戏表单不一定有独立的截图区。如果没有,就把这几张图片直接贴进 Author Comments(NG 的正文编辑器支持插图),放在 FEATURES 下面。'

### 🟡 MINOR — §0.1 素材确认 (line 18)

**问题**：'你计划录的 30–60 秒实况' is written in the future tense, but the video already exists. promo/assets/final/ contains iron-tide-hero-45s.mp4 (48s), iron-tide-clip-20s.mp4, iron-tide-short-vertical.mp4 and preview.gif. Stale copy makes the parent think there is unfinished work before they can publish.

**修正**：'视频:**Newgrounds 游戏上传不需要视频**,这一步可跳过。已经产出的 `final/iron-tide-hero-45s.mp4`(48 秒)、`iron-tide-clip-20s.mp4`、`iron-tide-short-vertical.mp4` 和 `preview.gif` 留给其他渠道复用。'

### 🟡 MINOR — §2.1 Title

**问题**：The title drifts from the shipped build. The game's own <title> tag is 'Iron Tide — Battleship Command' (em dash); the doc submits 'Iron Tide: Battleship Command' (colon). Trivial on its own, but the whole point of a launch kit is that the store page and the game agree.

**修正**：Use 'Iron Tide — Battleship Command'

### 🟡 MINOR — §2.3 Description, opening sentence (line 76)

**问题**：'Command your own battleship across a 31-theater world campaign, and hunt down your rival: Grand Marshal Varga, complete with story radio dialogue.' — 'complete with story radio dialogue' dangles off Varga's name, so it reads as though Varga comes with dialogue included. Comma-splice plus tacked-on feature clause is exactly the cadence that reads as machine-written to a Newgrounds audience that is primed to sniff for it.

**修正**：'Command your own battleship through a 31-theater campaign and hunt down Grand Marshal Varga. Your crew and your enemies talk to you over the radio the whole way.'

### 🟡 MINOR — §2.3 Description, FEATURES list

**问题**：The most persuasive verified numbers are missing. The build actually ships 29 playable ships (plus a boss, the Leviathan), 61 aircraft, 22 tanks, 21 weapons, 7 sandbox maps and a 121-item armory. The FEATURES list gives none of them, so it reads like generic marketing instead of the genuinely absurd content count that would make a Newgrounds player click. Also 'Quality settings + adaptive quality with bloom' is engine jargon nobody outside the project understands, and 'English / 中文' never says how to switch.

**修正**：Add: '- 29 playable ships, 61 aircraft, 22 tanks, 21 weapons — a 121-item armory' and '- One boss: the Leviathan'. Replace the quality bullet with '- Runs on a laptop: optional bloom (I key) and automatic detail scaling if your frame rate drops'. Replace the language bullet with '- English / 中文 — the 🌐 button at the top right of the menu, switchable mid-battle'.

### 🟡 MINOR — §2.5 Tags (line 119)

**问题**：'NG 标签数量有限(一般最多 12 个)' — I could not verify a 12-tag hard limit from any source; the guidance in circulation is 5-10 tags per submission. Stating an unverified number invites the parent to either leave tags on the table or hit an unexpected wall. It is also unverified whether Newgrounds accepts hyphens in tags, which matters for 'open-source'.

**修正**：'NG 的标签数量上限以输入框旁的计数为准(实用建议是 5–10 个,贪多反而稀释搜索表现)。全小写。先输下面这 10 个;如果 `open-source` 因连字符被拒,改成 `opensource`。'

### 🟡 MINOR — §2.2 Category / Genre

**问题**：Both suggested subgenres are real (Newgrounds' Shooter subgenres are First Person, Fixed, Horizontal Flight, Multidirectional, Run 'n Gun, Tube/Rail, Vertical Flight), so nothing here breaks. But the doc's first choice is backwards for this game: 'Multidirectional' is Newgrounds shorthand for twin-stick top-down shooters, while this is a first-person 3D game where you stand on the deck. Picking Multidirectional puts it in front of an audience expecting something else, which costs stars during judgment.

**修正**：Swap the order: make 'Action - Shooter - First Person' the primary recommendation (第一人称站在甲板/开飞机/步战,最贴切), and list 'Action - Shooter - Multidirectional' as the alternative. Keep the '发布后可改' reassurance.

### 🟡 MINOR — §2.8 Licensing / Sharing

**问题**：'保持页面默认即可' is not wrong but tells the parent nothing about what they are agreeing to. Newgrounds' game form carries an embedding-permissions setting (whether other sites may embed the game) and an awards opt-out. A parent who does not know what these are will hesitate at the one screen the doc says to skip.

**修正**：'这一节有两个选项:**Embedding(是否允许别的网站嵌入这个游戏)** 和 **awards opt-out(是否放弃参评 Daily/Weekly 奖)**。两个都保持默认(允许嵌入、参评)即可——嵌入能带来更多游玩量,参评不花任何代价。游戏本身已在 GitHub 开源,NG 这边无需额外授权。'


---

## product-hunt.md

**审查结论**：serious-problems · 20 项

**做得好的部分**（不要在后续修改里弄丢）：

- §3.1 timezone math is correct and carefully done. 12:01 AM PDT (UTC-7) = 15:01 Beijing same day; the 4-hour hidden-vote window = 15:01–19:01 Beijing; PT 23:59 = Monday 14:59 Beijing. All weekday labels check out too (2026-08-16 really is a Sunday, 08-15 a Saturday, 07-26 a Sunday). PH's own docs say 'PST' year-round; this doc correctly uses PDT for August.
- Every keybind and mechanic reference in the doc is factually correct against the live build: F to mount a bought gun (§2.7 row 5), L for photo mode (§2.7 header), harbor shop, on-foot combat, amphibious tanks, planes. No wrong keys anywhere.
- The rival is correctly named 'Grand Marshal Varga' in all three places (§2.6, §2.7 supplement, §4.7 context). The old 'Admiral Thorne' name does not appear.
- '31 theaters' is right (CAMPAIGN.length = 31), '12 medals' is right (ACHIEVEMENTS = 12), '3-star theater ratings' is real (verified `earnedStars` / `★'.repeat(3-earnedStars)` in the build), and 'each with its own procedurally generated music profile' is genuinely accurate — MUSIC_PROFILES holds 32 per-theater profiles (chord progression, scale, percussion style) rendered live through WebAudio oscillators, no audio files shipped. three.js r128 vendored, no build step, ~800KB single file, PWA, gamepad, touch, EN/中文 — all verified true.
- §4.3 (the 'is this AI-made?' answer) and §4.9 (harsh criticism) are honest, non-defensive, and correctly refuse to over-claim credit for the kid. This is the hardest copy in the kit and it is good.
- §6 expectation management is the best section in the document: the ~10% featured rate, the four editorial criteria (useful / interesting / well-made / creative), and the 'PH users are founders, not players' point all check out against Product Hunt's 2024–2025 editorial-curation change. Telling the parent to keep the kid off the live leaderboard and to show only filtered comments afterwards is exactly right.
- §3.3's 'absolutely do not' list (no new accounts to vote, no vote-buying, no 'please upvote' posts, no arguing) matches Product Hunt's Community Guidelines, which explicitly prohibit 'asking for upvotes, using bots, incentivizing upvotes' on pain of account suspension.
- The San Fran Sim precedent is real and correctly stated — it was ranked #3 Product of the Day for July 11th, 2026, and is a free browser game. Good, verifiable, non-inflated evidence.

### 🔴 BLOCKER — §2.6 First comment, §4.2, §4.4, §4.10 — every 'go read the source / the commit history is the receipts' line

**问题**：The kid's real first name is embedded in the shipped game and is live right now. `index.html` (the exact file served at https://game.boobank.com/irontide/ and inside both zips in promo/builds/) contains four Chinese code comments naming him: line 8937 `// Andy 新增的其他舰船`, line 8945 `// 传奇旗舰(Andy 新增)`, line 8999 `// Andy 新增的飞机与无人机`, line 9647 `// Andy 新增的传奇旗舰(真实历史名舰,用通行中文舰名)`. Worse, the public commit history of BOTH repos carries the author identity `Andy Li <孩子的旧私人邮箱>` (verified via the GitHub API: 2 distinct identities in VideoGameTips/irontide, 12 commits in longmaolab/irontide). This kit's whole credibility strategy is to point a global audience at that source and that commit history four separate times. Ctrl+F 'Andy' is all it takes. This breaks the hard rule (never the kid's real name) and it is amplified, not merely risked, by the launch copy.

**修正**：Do all four before scheduling anything: (1) In index.html replace the four comments with `// 新增的其他舰船`, `// 传奇旗舰(新增)`, `// 新增的飞机与无人机`, `// 新增的传奇旗舰(真实历史名舰,用通行中文舰名)`; redeploy the live page and rebuild BOTH zips in promo/builds/ (they currently contain 4 hits each). (2) On the kid's GitHub account enable Settings → Emails → 'Keep my email addresses private' AND 'Block command line pushes that expose my email'. (3) Rewrite author identity in both repos: create a mailmap file containing `VideoGameTips <videogametips@users.noreply.github.com> Andy Li <孩子的旧私人邮箱>` and `VideoGameTips <videogametips@users.noreply.github.com> VideoGameTips <孩子的旧私人邮箱>`, run `git filter-repo --mailmap <file>` in each clone, then force-push. (4) Re-run a grep for the kid's old private address across index.html, README.md, docs/ and js/ and confirm zero hits. Only after all four pass should the 'read the source' lines in §2.6/§4.2/§4.4/§4.10 be used as written.

### 🔴 BLOCKER — §2.6 First comment ('a family high-score board'), §2.7 caption 6, §2.7 screenshot 6 description, §2.8 video subtitle at 43–50s

**问题**：There is no family high-score board in the game. Grepping the shipped index.html for `high score`, `highScore`, `HIGH SCORE`, `leaderboard`, `Leaderboard` returns zero hits; the only two matches for 'family' are CSS `font-family` declarations. This is an invented feature stated four times, including in the single highest-visibility piece of copy (the maker's first comment) and burned into a gallery image caption. If one commenter goes looking for it, the entire 'I'd rather over-share than have you wonder' honesty framing collapses — on a launch whose only real asset is credibility.

**修正**：Delete every mention. §2.6: change '…gamepad and touch support, English/Chinese localization, and a family high-score board.' to '…gamepad and touch support, English/Chinese localization, and 3-star ratings on every theater.' §2.7 caption 6: change to `12 medals to earn, and a 3-star rating on every theater`. §2.7 screenshot-6 description: change to '成就/勋章页 + 战区三星评价'. §2.8 subtitle at 43–50s: change to `Medals and 3-star theater ratings`.

### 🔴 BLOCKER — §2.7 图库计划 (the 6-row table) and §1.4 checklist item 1

**问题**：The table maps the six real files to content they do not contain — I opened all six. Actual contents: 01-menu.png = the main menu / command-select screen (title, THEATER 1/31, the 7 sandbox battlefields, the campaign market list); 02-combat-hud.png = daytime third-person combat HUD with enemy markers and a 'called shot — waterline hit' toast; 03-broadside.png = a quiet photo-mode side view of the fleet in daylight, nothing firing; 04-armory.png = the ARMORY panel (Twin Turret / Torpedo Tube / Deck Gun prices, 'press F to install'); 05-night.png = night sea under moonlight, photo mode; 06-briefing.png = the 'OPERATION 1 · Training Bay' briefing card with 'click or press any key to skip' still on screen. The doc instead describes a stormy broadside, a world campaign map, an in-flight plane view, a tank hitting the beach, a harbor shop, and a medals page. Four of those six screenshots DO NOT EXIST among the produced assets. The parent will discover this mid-upload with the launch scheduled, and the six burned-in English caption strings are written for the wrong images.

**修正**：Either re-shoot to match the plan, or rewrite the table to the files that exist. Minimum viable rewrite, in this upload order — 1 `02-combat-hud.png` → caption `Command your battleship — called shots, flooding, open sea`; 2 `04-armory.png` → caption `Buy extra cannons in port and mount them on your own deck`; 3 `03-broadside.png` → caption `Photo mode: your fleet, any angle`; 4 `05-night.png` → caption `Night operations under a moonlit sea`; 5 `01-menu.png` → caption `31 theaters, 7 sandbox battlefields, 29 warships to command`; 6 `06-briefing.png` → caption `Every operation opens with a briefing from Fleet Command`. Then either capture 3 genuinely missing shots (tactical map via N, in-flight via P, tank ashore via E+G, achievements page) or drop those claims from the gallery. Also re-shoot 06 without the 'click or press any key to skip' prompt on screen. Do NOT lead the gallery with 01-menu.png as currently instructed — it is a dense text UI screen that reads as noise at card size.

### 🔴 BLOCKER — §1.2 Coming Soon 预热页, §0 一页速览 (row 'Coming Soon 预热页'), §1.3 (Coming Soon 日期同步改)

**问题**：Product Hunt discontinued Coming Soon / teaser pages on 2025-08-28 ('[ChangeLog] August 28 — No more "Coming soon"'). There is no Submit → 'Schedule / Coming soon' option to select, so the instruction 'PH 右上角 Submit → 创建产品页 → 选择 “Schedule / Coming soon”' cannot be followed. The claim that '关注者会在发布当天收到 PH 的自动通知,这是前 4 小时冷启动的主要来源之一' is built on a feature that no longer exists. This burns the parent's one prep weekend on a dead end and quietly removes the doc's only cold-start mechanism.

**修正**：Replace §1.2 entirely with: '预热(7/26 前做): PH 已于 2025-08-28 取消 Coming Soon / teaser 页面。现在的做法是 —— Submit 建好产品并把 launch 排期到 2026-08-16(PH 允许最多提前 1 个月排期,7/26 排 8/16 完全在范围内)。每个新建产品会自动获得一个 Product Forum 讨论帖,这就是新的预热位:在帖子里发 2–3 条开发进度/截图,访客可以点 Follow,发布当天会收到通知。预热文案(粘贴到第一条 forum 帖):' then keep the existing English paragraph but change its last sentence from 'launching here on Sunday, August 16. Follow to get notified.' to 'Launching here on Sunday, August 16 — follow this product to get notified.' In §0 change the row label from 'Coming Soon 预热页' to '产品页 + 排期 + Forum 预热帖', and in §1.3 change 'Coming Soon 日期同步改' to '产品页排期日期同步改'.

### 🟠 MAJOR — §1.4 checklist item 2 and §2.8 录制要求

**问题**：'传 YouTube(公开或 unlisted)' is wrong. Product Hunt's own launch guide states the video field takes YouTube links only and the video 'must be public'. An unlisted upload risks the video simply not rendering on the product page — discovered on launch day, with no time to fix.

**修正**：Change both places to: '传 YouTube,必须设为「公开 / Public」(PH 只接受公开的 YouTube 完整链接,unlisted / 短链接都不会加载)'.

### 🟠 MAJOR — §2.7 缩略图(240×240,GIF)

**问题**：'信息流里自动播放,是点击率关键' is wrong. Product Hunt's help center states GIF thumbnails are non-animated while loading and animate only on hover. Building the thumbnail around motion that most visitors will never see means the single most important 240px asset is designed for the wrong constraint — the still first frame is what actually sells the click.

**修正**：Change to: '**缩略图(240×240,GIF)**:PH 的 GIF 缩略图**只在鼠标悬停时才播放**,列表里默认显示的是静止的第一帧。所以第一帧必须自己就能打动人(建议直接用现成的 `thumb-ph-240x240.png` 作为第一帧构图),动画只是悬停时的加分项。体积 < 3MB(PH 硬性上限)。'

### 🟠 MAJOR — §2.7 规格行 ('每张 1270×760') and §1.4 checklist item 1 ('按 §2.7 规格重截')

**问题**：1270×760 is the correct PH recommendation, but every produced screenshot is 1600×900 (verified with sips on all six). As written, the checklist tells the parent to re-shoot all six screenshots the week before launch. That is unnecessary work — 1600×900 uploads fine, and if they want exact spec it is a one-line conversion, not a re-shoot.

**修正**：Change the spec line to: '规格:PH 推荐 **1270×760**。现有的 6 张是 **1600×900**,直接上传也没问题(PH 会自适应);想严格对齐推荐尺寸就跑一次转换,不要重截:`for f in promo/assets/final/0*.png; do ffmpeg -y -i "$f" -vf "scale=1270:-2,pad=1270:760:0:(760-ih)/2:color=0x0a1018" "${f%.png}-ph.png"; done`(补边颜色 #0a1018 就是游戏背景色)。' In §1.4 change 'ffmpeg -y -i' item 1 to '6 张截图确认/转换尺寸并上传到产品页(**不需要重截**)'.

### 🟠 MAJOR — §2.7 ffmpeg 命令

**问题**：The command encodes a GIF (palettegen/paletteuse/-loop 0) but writes it to `promo/assets/final/thumb-ph-240x240.png` — a wrong extension AND a silent overwrite of an already-produced, valid 240×240 PNG thumbnail (47KB, currently on disk). If the GIF turns out worse, the fallback is already destroyed.

**修正**：Change the last line of the command from `-loop 0 promo/assets/final/thumb-ph-240x240.png` to `-loop 0 promo/assets/final/thumb-ph-240x240.gif`, and add below it: '(现有的 `thumb-ph-240x240.png` 是已经做好的静态版,**不要覆盖**,留作备用。)'

### 🟠 MAJOR — §2.8 视频(30–60 秒)镜头清单 and §0 一页速览 ('视频家长自录 30–60 秒')

**问题**：The doc tells the parent to record a fresh 30–60s video at 1920×1080/60fps, but `promo/assets/final/iron-tide-hero-45s.mp4` already exists — 1600×900, 47.87s, 6.6MB — and §2.7's own ffmpeg command already reads from that exact file. So the kit simultaneously assumes the video exists and instructs the parent to shoot it. That is several hours of avoidable work in the launch week, plus a resolution spec (1920×1080) that does not match anything produced.

**修正**：Retitle §2.8 to '### 2.8 视频(已完成,只需上传)' and open with: '**视频已经做好了:`promo/assets/final/iron-tide-hero-45s.mp4`(1600×900,48 秒)。只需要上传到 YouTube 并设为公开,把完整链接填进产品页。** 下面的镜头清单保留作为参考——只有在你看完成片想重录时才用得上。' Delete '1920×1080、60fps' from the recording requirements or mark it as 'only if re-shooting'. In §0 change the 素材位置 row to '视频 `promo/assets/final/iron-tide-hero-45s.mp4`(48 秒,已完成,传 YouTube 公开即可)'.

### 🟠 MAJOR — §3.3 私信模板 and §3.4 当天自有渠道分享文案

**问题**：Both templates hardcode `https://www.producthunt.com/posts/iron-tide`. That slug does not exist yet and Product Hunt assigns it at submission — it may come back as `iron-tide-2`, or land under the newer `/products/<slug>/...` path. As written, the parent copy-pastes a 404 into every DM and every social post during the 4-hour window that matters most.

**修正**：Replace the URL in both blocks with the literal placeholder `[PASTE THE REAL PH URL HERE]`, and add a line at the top of §3.2's 15:01 row: '**上线后第一件事:从浏览器地址栏复制产品页的真实 URL,替换掉 §3.3 / §3.4 模板里的占位符**(PH 的 slug 是提交时生成的,不能提前猜)。'

### 🟠 MAJOR — §2.6 First comment, third bullet

**问题**：'Product Hunt requires account holders to be 16+, so I own this account and front the launch.' This publicly pins the kid as under 16. The hard rule is never the kid's age — a bound is still an age. Combined with a public GitHub account with dated commit history and a family-run VPS, it narrows the profile far more than the launch needs. The parent fronting the account needs no justification at all.

**修正**：Replace that bullet with: '- I run this account and front the launch; my kid is a minor and stays off the platform. My kid will read every comment here.' Then delete the now-duplicated final sentence of the bullet above it. Also change §2.4's Makers row from '孩子不加(未满 16 不能有账号)' to '孩子不加(未成年,不注册平台账号),署名方式是在文案里写 GitHub ID'.

### 🟠 MAJOR — §3.3 拉支持的红线, '可以做' 第一条

**问题**：'只私信「注册满 1 年以上、平时真实活跃」的 PH 用户朋友' filters recipients by the exact criteria Product Hunt uses to weight votes. Even with the 'ask for feedback, not votes' framing, selecting who to contact by account age is vote engineering — and if a recipient screenshots it, that reading is the obvious one. Unsolicited launch-day DMs inside Product Hunt itself also sit right next to the Community Guidelines' ban on 'artificially increasing activity', which carries account suspension. The whole point of §6 is that this launch is a keepsake, not a ranking play; this line contradicts that.

**修正**：Replace the bullet with: '- 只联系**你本来就认识、并且会真的想玩这个游戏的人**,而且走你自己的渠道(微信 / 邮件 / 短信),**不要用 PH 站内私信群发**。不要按「账号年龄 / 活跃度」筛选联系人——那是在筛选票权,不是在找反馈,被截图就说不清了。发一句就够,不要追问对方去没去。' Keep the English template as-is; it is well written and correctly asks for feedback rather than votes.

### 🟠 MAJOR — §4 评论回复模板 (missing template) and §6

**问题**：The entire launch is framed as 'my kid built this', yet there is no reply template for the single most predictable comment: 'How old is your kid?' / 'What's their name?' / 'Where do they go to school?' / 'Can we interview them?'. Under time pressure at 23:00 Beijing time, with a friendly commenter and a proud parent, that is exactly when a detail slips out. Every other comment type has a script; this one — the only one that can actually hurt the child — does not.

**修正**：Add as §4.11 with this exact text: '**4.11 打听孩子身份的(年龄/姓名/学校/采访请求)——不管多善意,一律用这条:**\n\n```text\nHope you understand — we keep the builder anonymous online. No name, no age, no school, no photos, no interviews. What I can share is the work itself: the repo, the commit history, and any technical question you want to ask about how something was built. Thanks for respecting that.\n```\n\n对方继续追问就不再回复,直接回到技术话题。**不要**因为对方看起来很友善就补充「其实他才X岁」这种细节。'

### 🟠 MAJOR — §4.3 'is this AI made?' template, and §2.7 截图要求

**问题**：Every one of the six produced screenshots shows an in-game helper panel labelled 'CLAUDE · SHIP'S AI' in the bottom-left corner (verified in 01, 02, 04, and visible in the HUD shots). The launch copy simultaneously argues that AI only did code review on the parent's fork. A commenter who opens the gallery sees an AI assistant branded with an AI vendor's name inside the game and reads the two together as a contradiction — on the one accusation this launch is least able to absorb. It is also a third-party product name shipped as a character name.

**修正**：Two changes. (1) In §2.7 截图要求 add: '截图时关掉左下角的「CLAUDE · SHIP'S AI」提示框(点 × 即可),再拍——避免和 §4.3 的说明产生视觉矛盾。' (2) Append to the §4.3 template: ' (And if you spotted the in-game advisor panel in the screenshots — that is a scripted tutorial helper my kid wrote, canned hint strings, no model call. It just has an unfortunate name.)' Consider renaming that in-game advisor before launch.

### 🟠 MAJOR — §2.7 图库计划, 01-menu.png as 主视觉 / §1.2 预热页配图

**问题**：01-menu.png — the image the doc designates as the lead visual and as the pre-launch hero — legibly lists the 7 sandbox battlefields, two of which are named 'Hiroshima' ('Urban-island nuclear aftermath: flattened districts, ash-grey water, and brutal close fighting') and 'Chernobyl' ('Abandoned reactor zone'). Leading a global, mainstream, professional launch with real nuclear-disaster place names as game maps is an avoidable line of attack, and the parent has no prepared answer for it anywhere in §4.

**修正**：Do not use 01-menu.png as the lead or as the forum-thread hero (see the reordered gallery in the §2.7 fix — lead with 02-combat-hud.png). If 01-menu.png is used at all, crop it above the 'SANDBOX BATTLEFIELDS' row. Add a §4.12 template: '```text\nFair flag. Those are sandbox test maps my kid named after places he'd read about in history class, not statements about them. I'll talk to him about renaming them — that is a good conversation to have with a kid who is building things people can see.\n```'

### 🟡 MINOR — §2.3 Description(≤260 字符)

**问题**：Product Hunt's own 'preparing for launch' page currently states a 500-character maximum for the description, while the older help-center article still says 260. The 254-character text is safe under either limit, but if the form allows 500 the doc leaves half the field unused — and it is the field where the strongest verifiable numbers could go.

**修正**：Change the heading to '### 2.3 Description(表单里以实际字数上限为准:帮助中心写 260,官方 launch 指南写 500。下面这版 254 字符,两种上限都能用)' and add a second block labelled '若表单允许 500 字符,用这版:' containing: `Iron Tide is a free browser battleship game: a 31-theater world campaign where you command a warship, fly planes, drive amphibious tanks, and fight on foot. 29 playable ships, 61 aircraft, 22 tanks, 7 sandbox battlefields, and a synth soundtrack generated per theater. No account, no ads, no install — it's essentially one 800KB HTML file. Built mostly by my kid; I maintain the polished open-source fork.`

### 🟡 MINOR — §2.4 Links / Topics / Pricing 表格

**问题**：Two field names are out of date and one current field is missing. Product Hunt now labels the field 'Launch tags' ('choose up to 3 launch tags that strongly relate to your launch'), not 'Topics', and the form has a 'Shoutouts' field (up to 3 per launch) that the doc never mentions. It also does not warn about PH's rule that the product URL must not be a shortened or tracking link.

**修正**：Rename the row 'Topics(选 3 个)' to 'Launch tags(最多选 3 个)'. Add two rows: '| Shoutouts(最多 3 个)| 可留空;要填就选真实用到的工具(例如 three.js 的 PH 页面),不要为了刷曝光乱填 |' and '| 注意 | Website 必须是直链,PH 明确禁止短链接和带 tracking 参数的链接 |'.

### 🟡 MINOR — §0 一页速览, '谁来发' 行

**问题**：'2025-26 年约 60% 都是自发' is close but misattributed. The figure people cite is that ~60% of #1-Product-of-the-Day winners were self-hunted and ~79% of featured posts were self-hunted — not that 60% of all launches are. Given the doc's own 'no invented numbers' standard, a number restated loosely is exactly the kind of thing a skeptical reader checks.

**修正**：Change to: '家长本人账号,自己 hunt 自己(PH 官方现在直接建议 maker 自己发,拿过当日 #1 的产品里约六成是自发的,完全正常)'.

### 🟡 MINOR — §1.1 账号, 第 3 条

**问题**：'这既是养账号' names the activity as account farming. The underlying advice (genuinely use the site for a few weeks before launching) is fine and correct, but the framing is the one line in the kit that would look bad if the kid or anyone else read it — and §6 spends real effort establishing that this launch is not a gaming exercise.

**修正**：Change to: '3. 从现在到发布日,**每周花 30 分钟真实地用 PH**:玩玩别人的产品、给真心喜欢的点个赞、留 2–3 条认真评论、关注 Games / Open Source 话题。目的是发布那天你不是个陌生人,而且你会学到别人的发布页是怎么写的。'

### 🟡 MINOR — §2.3 Description and §2.6 First comment

**问题**：The kit leans on soft claims ('the vehicles', 'the progression systems') and omits the strongest verified numbers in the build: 29 player-selectable warships plus a boss, 61 aircraft, 22 tanks, 21 weapons, 7 sandbox battlefields. On a platform whose audience rewards concrete engineering detail, and for a story whose whole burden is 'a kid really did this alone', specific counts do more work than adjectives — and every one of them is checkable in the source.

**修正**：In §2.6, change 'There are 31 theaters, each with its own procedurally generated music profile, plus dynamic weather…' to 'There are 31 theaters and 7 sandbox battlefields, 29 playable warships, 61 aircraft and 22 tanks, and each theater generates its own synth soundtrack live in the browser (no audio files — it's all WebAudio oscillators driven by a per-theater chord/scale profile). Plus dynamic weather…'


---

## submit-once-kit.md

**审查结论**：serious-problems · 22 项

**做得好的部分**（不要在后续修改里弄丢）：

- 日程表的星期全部正确:7/24 是周五,7/25-26 周末录制、7/27 周一发信、7/28 及 8/4、8/11、8/18 都确实是周二,7/31 确实是周五。这类日期错误最常见,这里一个都没有。
- Free Game Planet 那一节的事实全部核实无误:他们的 /contact/ 页确实没有表单,确实给的是 admin@freegameplanet.com 和 @FreeGamePlanet,也确实写着不保证收录每个推荐。「发一次即可,不要催,两周没动静就算了」是对的做法。
- 反刷屏纪律很干净:明确写了不催、不重发、不注册小号顶帖、不要 @ 任何人(包括 verekia)、先读频道置顶规则、遵守 slowmode。整份文档没有一处教人刷好评或制造虚假热度。
- 给 verekia 的私信时机处理得很有分寸——等 showcase 帖发出至少一周、且有自然反应之后再私信,而且明说「冷启动第一天就私信维护者是失礼的」、私信里不问「什么时候能上」。这是社区礼节,不是话术。
- §3 诚实交代了 gamedevjsweekly.com 抓取返回 403、没能确认站上是否有表单,并要求家长自己再看一眼页脚 —— 没有为了显得完整而编一个表单出来。这个自我披露的习惯值得保留。
- 录屏那节的技术细节是对的:QuickTime 确实录不到系统声音;1440p 母带竖裁后有效宽度 1440×9/16 = 810px 这个算术准确;MKV 防崩溃再 Remux 是 OBS 的标准做法。
- 「麦克风轨关掉,不收环境音,防止收进孩子的声音」是这份文档里最好的一条 —— 它把隐私规则落到了一个具体的、容易忘的操作开关上。
- COPPA 那一条没有替家长下判断,而是说明选项、指出这是合规判断、要求上传时自行确认。在这个问题上不装懂是正确的。
- 三个渠道的署名口径完全一致(孩子设计开发、家长维护打磨版 fork、家长持有全部账号),而且明确要求「不多说一分,不少说一分」——这个统一口径本身是对的,只是需要按上面第 1 条先把 git 历史清干净,口径才站得住。

### 🔴 BLOCKER — 铁律 §1 (隐私) — and every place that links a repo: §2 Discord 帖 "Original repo", §3 邮件正文 "Original repo", §4.1 频道简介, §4.3 描述模板

**问题**：The kid's real name and personal email are PUBLIC in the git history of both repos this kit promotes. `git log` on main shows 9 commits authored by `Andy Li <孩子的旧私人邮箱>` and 19 by `VideoGameTips <孩子的旧私人邮箱>`, plus a parent commit (dc668d8) whose MESSAGE reads "i18n: full Chinese coverage for Andy's new systems...". Both github.com/VideoGameTips/irontide and github.com/longmaolab/irontide are public, so one click on "Commits" from any link in this kit exposes the name and the address. The kit posts the kid's repo URL publicly in two channels and instructs nothing about this. This alone breaks the hard rule and cannot be undone once curators, a newsletter archive, and a Discord log point at it.

**修正**：Do NOT send anything until this is fixed. Add a step 0 to 本周发射时间表 before 7/27:

「0. 发射前必做(阻断项):
 a. 孩子的 GitHub → Settings → Emails → 勾选 'Keep my email addresses private' 和 'Block command line pushes that expose my email'。
 b. 在 longmaolab/irontide 上重写历史,把作者身份统一成 handle:
    git filter-repo --name-callback 'return b"VideoGameTips"' --email-callback 'return b"VideoGameTips@users.noreply.github.com"'
    再把 dc668d8 的 commit message 改成 'i18n: full Chinese coverage for the new systems (nemesis, lore, MP, market, almanac, K panel)',然后 force-push。
 c. 孩子的原仓库同样处理;做不到就 GitHub Support 请求清除旧 SHA 缓存,或先把原仓库转为 private。
 d. 在 (a)(b)(c) 全部完成前,从 Discord 帖和 Gamedev.js 邮件里删掉 'Original repo: https://github.com/VideoGameTips/irontide' 这一行,只保留 'GitHub: VideoGameTips' 这个称呼,不给仓库直链。
 e. 用无痕窗口打开两个仓库的 /commits 页面,亲眼确认看不到真名再发信。」

### 🔴 BLOCKER — §1 Free Game Planet 邮件正文 Description 段;§5.2 录制清单 A7

**问题**：Invented feature. The email tells a curator the game has "a family high-score board", and A7 tells the parent to film 「家庭排行榜页」. No such thing exists in the build: grep of index.html finds no leaderboard / high score / 排行榜 / RECORDS screen, and the only localStorage keys are ironTideCareer / ironTideDifficulty / ironTideLang / ironTideLastShip / ironTideSettings / SAVE_KEY / tutorial flags. A curator who plays looking for it and doesn't find it will not run the game — and the parent will burn recording time hunting a screen that isn't there. (3-star ratings and 12 medals ARE real — `'★'.repeat(R.stars)+'☆'.repeat(3-R.stars)` and the 12 achievements — so only the score board is fabricated.)

**修正**：In the FGP email, replace the sentence with: "A rival, Grand Marshal Varga, taunts you over the radio as you chase 3-star ratings on all 31 theaters and 12 medals." In §5.2 A7, delete 「家庭排行榜页各扫一遍」 and keep only 「某战区三星结算画面、勋章(成就)页各扫一遍」.

### 🔴 BLOCKER — §5.3 六张官方截图;§1 操作步骤第 2 条;§4.1 第 3 条;§2 发帖步骤第 4 条;整个 §5

**问题**：Every screenshot description in the kit contradicts the file that was actually produced, and §5 schedules a whole weekend re-shooting assets that already exist. Verified by opening the files: 01-menu.png is the MAIN MENU (kit calls it 战列舰满舷齐射); 02-combat-hud.png is the in-battle HUD (kit calls it 31 战区世界地图全貌); 03-broadside.png is an overcast surface ship shot with no muzzle flash and no aircraft (kit calls it 飞机空中视角); 04-armory.png is the ARMORY side panel at night (kit calls it 两栖坦克冲上滩头); 05-night.png is a calm starlit night with no rain, no lightning, no gunfire (kit calls it 暴风雨海战 and attaches it to a curator email under that description); 06-briefing.png is the OPERATION 1 briefing overlay, and it has a black polygon rendering artifact across the top of the frame (kit calls it 港口商店甲板装炮界面). Meanwhile promo/assets/final/ already holds all six 1600x900 finals plus cover-itch-630x500, cover-itch-titled-630x500, cover-social-1280x720, cover-square-800x800, og-1280x720, thumb-ph-240x240, thumb-titled-240x240, preview.gif, iron-tide-hero-45s.mp4 (47.9s, 6.6 MB), iron-tide-clip-20s.mp4 and iron-tide-short-vertical.mp4 (608x1080, 22s).

**修正**：Rewrite §5 as 「素材:已完成,不需要重录」 and list the real inventory with real descriptions:

「promo/assets/final/ 已产出,直接用:
- 01-menu.png — 主菜单(标题 + 31 战区选择 + 沙盒地图 + 装备市场)
- 02-combat-hud.png — 舰桥第三人称作战 HUD,前方多艘敌舰
- 03-broadside.png — 阴天海面编队近景
- 04-armory.png — 夜战中打开 ARMORY 军械库面板(体现买炮装炮机制)
- 05-night.png — 星空夜航海面
- 06-briefing.png — OPERATION 1 任务简报overlay(注意:画面顶部有一块黑色多边形渲染瑕疵,别对外用这张)
- iron-tide-hero-45s.mp4(47.9s / 6.6MB)、iron-tide-clip-20s.mp4、iron-tide-short-vertical.mp4(608x1080, 22s)、preview.gif
只有当你想要 §4.2 那四条 Shorts 的专门镜头时才补录;补录清单见下。」

Then fix the two send-out steps: §1 step 2 becomes 「附件带 03-broadside.png(海面编队)、04-armory.png(军械库,体现独特机制)、02-combat-hud.png(作战 HUD)」 — do not attach 01-menu.png (see the Hiroshima/Chernobyl finding) and do not attach 06 (rendering artifact). §2 step 4 becomes 「配 04-armory.png + iron-tide-hero-45s.mp4」.

### 🔴 BLOCKER — 整份文档 — 缺失章节;直接影响 §1 附件、§2 截图、§4.1 横幅

**问题**：The kit never mentions that the game ships two real-world atrocity sites as playable sandbox maps and contains nuclear and kamikaze content, and it repeatedly tells the parent to attach or post the one screenshot that displays them. 01-menu.png legibly shows sandbox cards "Hiroshima — Urban-island nuclear aftermath: flattened districts, ash-grey water, and brutal close fighting" and "Chernobyl — Abandoned reactor zone". index.html contains 21 'kamikaze' matches, 37 nuclear/nuke matches, and the project's own README documents a 「家长模式(关闭核武与神风内容)」 toggle. Sending a curator a menu shot of "Hiroshima: flattened districts" under the banner "my kid made this" is exactly the thing that turns a friendly submission into a public incident.

**修正**：Add a new 铁律 item 4 and act on it before 7/27:

「4. 敏感内容:游戏里有 Hiroshima / Chernobyl 两张沙盒地图、核武与神风(kamikaze)机制。发射前先决定:
 a. 最省事、也最建议:把两张沙盒地图改名并重写描述(如 'Ashfall City — 城市废墟近战'、'Reactor Zone — 废弃反应堆'),核武统一叫 'heavy warhead',kamikaze 统一叫 'suicide drone / ramming attack'。
 b. 在 README 顶部保留并写清 '家长模式' 开关的位置。
 c. 在 (a) 完成前,任何对外图片都不要用 01-menu.png——它把这两张地图的文字拍得清清楚楚。
 d. 若有人问起,统一口径:'It's a WWII-era naval sim; there are two ruined-city sandbox maps and a parental toggle that disables the nuclear and suicide-attack content.' 不辩解、不展开。」

### 🟠 MAJOR — §2 Discord 帖、§3 Gamedev.js 邮件、铁律 §3 署名口径

**问题**：The game ships an in-HUD assistant literally branded "CLAUDE · SHIP'S AI" / "CLAUDE · 舰载 AI" (visible in 02-combat-hud.png, 04-armory.png and 06-briefing.png; index.html has CLAUDE_TIPS / CLAUDE_TIPS_ZH arrays and a claudeBob animation). The kit's 署名口径 says only 「用了 AI 辅助 code review」. Posting to a Discord full of professional web-game devs with a screenshot showing an Anthropic-branded companion, while the pitch is "my kid built this solo", invites both a trademark question and a credibility question the parent has no prepared answer for.

**修正**：Rename before launch — it costs one find-and-replace: change 'CLAUDE · SHIP'S AI' → 'SHIP'S AI', 'CLAUDE · 舰载 AI' → '舰载 AI', and the CLAUDE_TIPS / claudeBob identifiers to SHIPAI_TIPS / aiBob. Then add to 铁律 §3: 「游戏内的提示助手叫『Ship's AI』,是孩子写死的提示文案,不是接了任何 AI 服务;被问到就这么答。」 If you keep the name, do not attach 02 / 04 / 06 anywhere, and add the line 'The in-game tip helper is a hard-coded hint system, not a live model' to the Discord post.

### 🟠 MAJOR — §1 / §2 / §3 每一处 "Source: https://github.com/longmaolab/irontide"

**问题**：Every channel sends the reader to a GitHub page whose description is factually wrong against the live build. The repo description says "8 ship types, 40+ aircraft, 17 tanks" and the README says 「8 种军舰、40+ 种飞机、17 种坦克」. The probed build has 30 ships (29 playable), 61 planes, 22 tanks. Understating by 3-4x is still a wrong number in the one place a technical reader will check, and it makes the rest of the pitch look unchecked.

**修正**：Add to the pre-launch step 0: 「更新 longmaolab/irontide 的仓库 description 和 README 第一段为:『29 playable warships, 61 aircraft, 22 tanks, 21 weapon types, 31 campaign theaters, 7 sandbox maps, 12 medals — all in a single HTML file.』中文同步改成『29 种可选军舰、61 种飞机、22 种坦克、21 种武器、31 关战役、7 张沙盒地图、12 枚勋章』。」 These verified numbers are also a stronger hook than anything currently in the pitches — consider putting the ship/plane/tank counts into the Free Game Planet description.

### 🟠 MAJOR — §3 Gamedev.js Weekly — 投稿地址核实情况 / 收件人

**问题**：Wrong recipient. hello@end3r.com is Andrzej Mazur's personal contact page address, and that page says nothing about Gamedev.js Weekly. The purpose-built address is on gamedevjs.com/contact, which states verbatim: "If you want to send us some interesting news, you've just released a tool or a game... feel free to shoot us a message to contact at gamedevjs dot com". Sending a game submission to his personal inbox instead of the stated submissions address is the difference between landing in the candidate pool and landing in a personal backlog.

**修正**：Replace the 收件人 block with `contact@gamedevjs.com` and rewrite the 核实情况 paragraph as: 「gamedevjsweekly.com 对抓取返回 403,站上没能直接确认表单。但 gamedevjs.com/contact 页面(2026-07-24 核实)明确写着:发布了游戏或工具、想投新闻,发到 contact@gamedevjs.com。用这个地址。抄送 hello@end3r.com 可选,但不必要。发送前请自己打开 gamedevjsweekly.com 看一眼页脚,如果站上给了别的专用地址,以站上的为准。」 Also verify the cadence before promising an issue date: the archive's latest issue was #652 on 2026-07-03, three weeks before today — confirm the newsletter isn't on a summer break before writing 「争取进 7/31 那期」.

### 🟠 MAJOR — §4.1 频道设置 第 3 条

**问题**：YouTube will reject the banner. Channel art has a hard minimum of 2048x1152 (16:9, max 6 MB); 01-menu.png is 1600x900 and will be refused at upload, so the parent will sit there re-cropping and guessing. The avatar advice is also unnecessary work — cover-square-800x800.png already exists and 800x800 is exactly YouTube's recommended avatar size.

**修正**：Replace item 3 with: 「头像:直接用 promo/assets/final/cover-square-800x800.png(YouTube 推荐尺寸就是 800x800)。横幅:YouTube 最低要求 2048x1152、上限 6MB,现有素材都不够大 —— 用 cover-social-1280x720.png 做底,在剪映/Figma 里新建 2560x1440 画布放大铺满,文字只放中间 1546x423 安全区内,写 'Free browser game — game.boobank.com/irontide'。不用任何真人照片。」

### 🟠 MAJOR — §4.1 第 5 条、§4.3 上传说明;整份文档缺少评论区保护

**问题**：Two gaps that hit the kid directly. (1) Comments are force-disabled on any video marked 'made for kids' — so the instruction 「每条发出后自己置顶一条评论」 will silently fail on any Short the parent flags that way, and the Play link disappears from the comment slot. (2) The kit sets no comment moderation and gives no expectation-setting anywhere. A channel that announces "designed and built by a young solo dev" WILL attract comments about the creator's age; nothing here stands between those comments and the kid.

**修正**：Extend §4.1 item 5 with: 「注意:任何标记为『面向儿童』的视频,YouTube 会强制关闭评论区 —— 置顶评论也就发不出去。普通 gameplay 选『不是面向儿童的内容』,置顶评论才有效。」 And add a new item 7: 「7. 评论区防护(先做再发第一条):YouTube Studio → 设置 → 社区 → 自动过滤器,把『可能不适当的评论』设为『提高严格程度并保留待审核』,再在『屏蔽字词』里加上孩子的真名、真名拼音、年龄相关词。评论一律由你先看,只把善意的、有用的反馈转述给孩子。」 And add to the 备忘: 「预期管理:三个渠道大概率安静收场 —— 独立小游戏被 newsletter 选中是小概率事件。提前跟孩子说清楚『我们是去认识做游戏的人,不是去冲数据』,把『有陌生人认真玩完了一关』当成成功标准,而不是播放量。」

### 🟠 MAJOR — §2 「它是什么」与 Newsletter pitch 私信

**问题**：The premise of channel #2 is partly stale, and it misses the single best 'submit once' target on this exact site. verekia's own GitHub Sponsors page now says "I am no longer dedicating myself full-time to this project" about WebGameDev.com and that the newsletter is "monthly-ish" — not the weekly-ish pipeline the kit implies. He also now runs "WebGamer.io — my portal to showcase great web games", which is literally a submit-once, permanently-listed directory for browser games and is not mentioned anywhere in this kit. Separately the sponsor list is incomplete (CrazyGames, VIVERSE and Poki) and 「约 2.5k 成员」 is an unverified number in a document whose own 铁律 forbids invented numbers.

**修正**：Rewrite the 它是什么 paragraph as: 「网页游戏开发社区,由 verekia(Jonathan Verrecchia)创办,CrazyGames、VIVERSE、Poki 赞助。注意:他已公开说不再全职维护 webgamedev.com,newsletter 目前是『大约每月一封』,所以别把上刊当作目标,把认识同行当作目标。成员数以你进服务器后看到的为准,不要引用道听途说的数字。」 In the DM, change 「the Web Game Dev newsletter」 to 「the Web Game Dev newsletter (whenever the next one goes out)」 so you're not implying a weekly cadence. And add a fourth channel to the timetable: 「7/29 周三 — 把游戏提交到 WebGamer.io(verekia 的网页游戏展示站,一次提交长期收录),用 §1 的 description 段和 cover-social-1280x720.png。」

### 🟠 MAJOR — §4.2 Short 1 shot list;§5.2 A2

**问题**：Wrong keybind instructions, which will make the parent fumble on camera. The kit says 「打开商店,按 F 购买/安装甲板炮」 and 「进港 → 商店 → 按 F 装炮」. F does not purchase and does not open anything. The game's own on-screen text (readable in 04-armory.png) is: "Click a weapon, then press F (or click Install below) to install it" and the tip reads "Tab for guns, H for harbor upgrades". Tab opens the ARMORY, H is harbor, F installs the already-selected weapon. Nowhere in this 385-line kit is Tab or H ever mentioned.

**修正**：Short 1 shot list 3–12s becomes: 「按 H 进港 → 按 Tab 打开 ARMORY 军械库 → 点选 Deck Gun/Twin Turret → 按 F 装到甲板空位(录下屏幕上的 'press F to install' 提示)」. §5.2 A2 becomes: 「A2 甲板加炮全流程:H 进港 → Tab 开军械库 → 点武器 → F 装炮 → 出港齐射」. Also add a 按键速查 box to §5 so the parent isn't guessing: 「Tab 军械库 · F 装炮 · E 上/下炮位(也用于上坦克) · H 海港 · B 建造 · P 上/下飞机 · G 步行切换(开坦克时是水陆切换) · N 战术地图 · T 第一/第三人称 · L 照相模式 · I 画质 · Esc 关面板/跳过教程 · W/S 油门 · A/D 舵。」

### 🟠 MAJOR — §5.2 A7;§5.3 02-combat-hud.png 描述;§5.4 hero 分镜 5–12s

**问题**：Three separate deliverables depend on a screen that appears not to exist. The kit asks for 「31 战区地图平移浏览」 / 「31 战区世界地图全貌」 / 「A7 世界地图扫过」. The menu (01-menu.png) presents theaters one card at a time — "THEATER 1 / 31 · Training Bay" — not as a pannable world map, and grepping the source finds no world-map / campaign-map screen; N opens an in-battle 战术地图, which is a different thing. The parent will hunt for this shot and come up empty three times.

**修正**：Replace all three with the shot that actually exists: 「A7 战役体量展示:在主菜单上把 31 个战区一张张翻过去(左右切换战区卡片,拍下 'THEATER 1 / 31' 到 'THEATER 31 / 31' 的角标变化),再拍某战区的三星结算画面和勋章页。」 And in the hero 分镜 5–12s: 「战区卡片连续翻页(角标 1/31 → 31/31)→ 字幕 'A 31-theater campaign'」. If you want an actual map on screen, use the in-battle 战术地图(按 N)and label it as such.

### 🟠 MAJOR — §3 邮件正文 — Angles 第一条;§2 Discord 帖;§3 正文首段

**问题**：Overclaim aimed squarely at the audience most likely to check. The bullet says the whole campaign is "all in one HTML file". The shipped tree is index.html (835,630 bytes) PLUS vendor/three.min.js PLUS js/terrain.js — a JS gamedev newsletter editor and a room full of web-game devs will open the repo, see js/terrain.js, and the single strongest technical angle in the pitch becomes the thing that was overstated. The 800 KB figure is also rounded the wrong way (actual 835 KB).

**修正**：In §3, first paragraph: "shipped as one ~835 KB index.html plus a vendored three.js and a single terrain module — no build step". Angles bullet 1: "- Single-file architecture: a 31-theater campaign, a story rival with radio dialogue, and planes / amphibious tanks / on-foot combat all live in one ~835 KB index.html (plus vendored three.js and one terrain module); there is no build step at all." Apply the same 835 KB + "and one terrain module" correction to the Discord post and the verekia DM.

### 🟡 MINOR — §4.2 Short 3 标题 EN;§1 邮件正文 Description

**问题**：Rank inconsistency in the public copy. The rival's in-game title is Grand Marshal Varga (confirmed in 04-armory.png: "Grand Marshal Varga: Turn back now, and I might let you keep your hull."), but the Short 3 English title calls him "the enemy admiral" and the FGP email calls him "A rival admiral, Grand Marshal Varga" in the same breath. The Chinese fallback title (敌方元帅) is correct, so only the English is off. "story radio dialogue" is also awkward English.

**修正**：Short 3 EN title: `The enemy commander talks trash over the radio`. FGP description sentence: "A rival, Grand Marshal Varga, taunts you over the radio as you chase 3-star ratings on all 31 theaters and 12 medals."

### 🟡 MINOR — §4.2 开头「竖屏 9:16,15–60 秒」;§4.3 描述模板 #Shorts

**问题**：Outdated platform rule. YouTube raised the Shorts ceiling from 60 seconds to 3 minutes in October 2024, and #Shorts has not been required for classification for years — Shorts are detected by aspect ratio and duration. Stating a 60-second cap as a rule will make the parent cut good footage for no reason.

**修正**：Replace with: 「竖屏 9:16(1080x1920 最佳),YouTube Shorts 上限已是 3 分钟,但我们仍然只做 15–60 秒 —— 短的完播率高。单机制单主题,开头 2 秒必须有动作画面。#Shorts 标签不是必需的(YouTube 按比例和时长自动识别),留着无害。」 Also note that the existing iron-tide-short-vertical.mp4 is 608x1080 — usable, but upscale or re-export at 1080x1920 before uploading.

### 🟡 MINOR — §2 发帖步骤第 6 条;备忘第 2 条

**问题**：Both point the parent at 「第 0 节」, which does not exist — the 署名口径 is item 3 of the unnumbered 铁律 section. Small, but it's the exact moment the parent is under pressure (someone just asked "who made this?") and has to hunt for the script.

**修正**：Change both references to 「见开头『铁律』第 3 条」. Better: paste the actual answer inline in §2 step 6 so it is copy-pasteable under pressure: 「My kid designed and built the game — I maintain a polished fork (bug fixes, i18n, onboarding, achievements, performance) and I run all the public accounts to protect their privacy. Happy to answer anything technical.」

### 🟡 MINOR — §1 「它是什么」

**问题**：Two claims are shakier than stated. The itch.io 'Free Game Planet' collection is curated by brunob and can only contain games hosted on itch.io — Iron Tide is self-hosted, so a database entry cannot 'sync' into it, and 「一次提交、三处曝光」 overstates the return. (Their Tumblr is the third real surface.) This is the kit's own 不编数字 rule applied to itself.

**修正**：Rewrite as: 「每日更新的免费游戏数据库,浏览器游戏是主类目之一。收录后通常也会发到他们的 X(@FreeGamePlanet)和 Tumblr,数据库条目长期留存、持续带自然流量。他们还有一个 itch.io 合集,但那个只收 itch 上托管的游戏,我们自托管进不去 —— 以后真上了 itch 再说。」 The rest of §1 is verified correct: their /contact/ page has no form, gives admin@freegameplanet.com and @FreeGamePlanet, and says "We can't guarantee that we'll feature every game suggested, but we'll certainly check them out!"

### 🟡 MINOR — §2 发帖步骤第 4 条;§5.1 录屏设置

**问题**：Discord's free-tier upload cap is 10 MB. The existing iron-tide-hero-45s.mp4 is 6.6 MB and will drag in fine — but §5.1 tells the parent to record at 2560x1440 / 40000 Kbps, and any ~50s cut at that bitrate lands around 250 MB and will be rejected at the drop. The kit never mentions the cap, so the failure happens live in the channel.

**修正**：Add to §2 step 4: 「Discord 免费账号单文件上限 10MB。现成的 iron-tide-hero-45s.mp4 是 6.6MB,可以直接拖。如果你自己重剪,导出时压到 10MB 以内(1080p / 约 1500 Kbps / H.264),压不下去就传 YouTube 不公开链接贴出来。」

### 🟡 MINOR — §2 Discord 帖首行;§3 邮件正文首段;verekia 私信

**问题**：Leading three separate pitches with "three.js (r128)" is a self-inflicted wound in front of exactly the audience that will notice: r128 shipped in April 2021. The first reply in a web-gamedev Discord will be "why are you five years behind?", which buries the actual story. The version is true and should stay honest if asked — it just shouldn't be the headline.

**修正**：Drop the revision from the opening line in all three: "Iron Tide — a free browser battleship-command game built with three.js." Keep one honest line lower down in the Discord post only: "It's pinned to three.js r128 and vendored locally — upgrading is on the list, and I'd take advice on it." That turns the weak point into a conversation starter instead of a gotcha.

### 🟡 MINOR — §5.3 标题「存 promo/assets/」;§5.5 其他备好的资产

**问题**：Path and inventory are both off. The real directory is promo/assets/final/ (the kit's own inline references use `final/...` inconsistently against a `promo/assets/` header). §5.5 lists only irontide-itch.zip and omits irontide-portal-singleplayer.zip (0.4 MB, service worker stripped and multiplayer entry hidden), and the kit never mentions preview.gif, og-1280x720.png, cover-itch-630x500.png, cover-itch-titled-630x500.png, cover-square-800x800.png, thumb-ph-240x240.png, thumb-titled-240x240.png, iron-tide-clip-20s.mp4 or iron-tide-short-vertical.mp4 — several of which are exactly what the next platform will ask for.

**修正**：Replace §5.5 with: 「promo/builds/irontide-itch.zip(0.4MB,含实验性联机)和 promo/builds/irontide-portal-singleplayer.zip(0.4MB,隐藏联机入口)—— 本轮三个渠道都只要 URL,不用传包,留给以后 itch.io 用(itch 封面直接用 cover-itch-titled-630x500.png)。另外备好但本轮没用到的:preview.gif(邮件/论坛里当动图)、og-1280x720.png(已上线)、thumb-ph-240x240.png(Product Hunt 之类的方形缩略图)、cover-square-800x800.png(YouTube 头像)、iron-tide-clip-20s.mp4。所有路径都在 promo/assets/final/ 下。」

### 🟡 MINOR — §3 邮件正文结尾;§1 邮件正文

**问题**：Two lines read as machine-written flattery and slightly inflate. "Thanks for twelve-plus years of the newsletter!" is the kind of closer that signals a template, and it is a number the kit didn't verify (issue #652 as of 2026-07-03 is consistent with a 2014 start, but you're asserting it to the person who would know). "packs an unusually large amount of game" in the FGP email is also strained English.

**修正**：Gamedev.js closer: "Thanks for keeping the newsletter going all these years — I've been reading it." (Only keep the second clause if it's true.) FGP: replace "and packs an unusually large amount of game — a full world campaign with a story rival — into a single web page" with "and fits a full 31-theater campaign, 29 playable warships and a story rival into a single web page."

### 🟡 MINOR — §2 Discord 帖 / §3 邮件 / §4 频道简介 中的 GitHub 链接

**问题**：Even after the history rewrite, the kit publicly points strangers at github.com/VideoGameTips/irontide, which currently has 52 open issues and the description "Please just play this. It's awesome." That is an open channel for adults to interact directly with a child in a space nobody is instructed to moderate.

**修正**：Add to the pre-launch step 0: 「在孩子的仓库上 Settings → Features → 取消勾选 Issues 和 Discussions(或至少把 Issues 设为只有你能开),把所有对外反馈引到 longmaolab/irontide,由你接。孩子仓库的 description 改成中性的一句『Iron Tide — a browser naval combat game.』」 And before sending, open https://game.boobank.com/irontide/ in a fresh incognito window to confirm it loads — the automated check got a 403 (likely Cloudflare bot filtering, but a dead link in a curator email is unrecoverable).


---

## show-hn.md

**审查结论**：serious-problems · 13 项

**做得好的部分**（不要在后续修改里弄丢）：

- Section 4.2's anti-vote-soliciting red line is exactly right and matches HN's own Show HN rule ("Please don't ask friends to upvote or comment"). No astroturfing anywhere in the kit — the second-chance-pool route via hn@ycombinator.com is a real, legitimate mechanism.
- The header is correct that HN is text-only with no image/video/tag/category fields, so the produced assets genuinely aren't needed here. No phantom asset paths, no missing deliverables.
- Title lengths are honestly counted (77/77/79) and HN's real limit is 80 characters. The decision to keep "my kid" out of the title and put it in the first comment is sound.
- All date and timezone math checks out: 08:00 EDT = 20:00 Beijing same day; 2026-07-28/29/30 really are Tue/Wed/Thu; 2026-08-11 really is the Tuesday two weeks after launch.
- The two historical data points are real, not invented. "Show HN: A game my 12-year-old daughter wrote" scored exactly 341 points on 2018-01-02, and recent kid-project Show HNs really do land in the 1–12 range. Expectation-setting in section 5 is honest and well-judged.
- Template 3.3's technical claim is accurate against the code: updateAdaptiveQuality() really does step the pixel ratio down and call setGfxQuality(0), which sets bloomPass.enabled = false. Safe to say out loud.
- Game facts that are correct: 31-theater campaign, 31 music profiles (MUSIC_PROFILES has 32 keys = default + one per theater, and it is genuinely procedural Web Audio), the rival's name Grand Marshal Varga, photo mode on L, quick battle + sandbox, gamepad + touch, EN/ZH, three.js r128, no build step, installable PWA, experimental multiplayer.
- 3.5 (privacy) and 3.8 (trolls) have the right posture: answer once and leave, never use the kid's age as a shield, don't flag-war. Leaving the submit form's text field blank when a URL is present is also correct HN behavior.

### 🔴 BLOCKER — §2 首条评论 ("Original repo:" line) and §3.1 AI 质疑 template

**问题**：The kit tells HN "we deliberately keep my kid's name, age, and everything else private" and, in the same breath, directs readers to the commit history. That history publicly exposes the kid's real name and email. Verified today: 9 commits on github.com/VideoGameTips/irontide are authored as "Andy Li", and all 28 commits carry 孩子的旧私人邮箱 in the author field (visible via the API, .patch URLs, and any clone). The same 9 "Andy Li" commits are inherited by the fork github.com/longmaolab/irontide, so both links leak. Sending thousands of HN engineers there is self-inflicted deanonymization and breaks the family's hard rule.

**修正**：Do NOT post until this is remediated and verified. (1) On the kid's GitHub account: Settings → Emails → enable "Keep my email addresses private" AND "Block command line pushes that expose my email". (2) Rewrite author identity on BOTH repos: `git filter-repo --name-callback 'return b"VideoGameTips"' --email-callback 'return b"VideoGameTips@users.noreply.github.com"'` then force-push. (3) Verify with `gh api repos/VideoGameTips/irontide/commits --paginate --jq '.[].commit.author'` and the same for longmaolab/irontide — the output must contain no real name and no gmail address. (4) Delete template 3.1's sentence "the commit history on the original repo (https://github.com/VideoGameTips/irontide) is public if you want to look" regardless, per the next issue.

### 🔴 BLOCKER — §3.1 AI 质疑 — "the commit history ... is public if you want to look"

**问题**：The kit's central rebuttal to "is this AI-written?" points at evidence that refutes the claim instead of supporting it. Verified in the public history of VideoGameTips/irontide: the first two commits are "Add files via upload" (GitHub web-UI blob drops; the initial one adds index.html with +3,958 lines in one shot) — precisely the fingerprint skeptics read as "pasted in". Worse, commit e6c0305f (2026-07-18, "Sync this week's Iron Tide development from the working repo") bulk-lands most of the game's marquee features — the legendary hulls, 8 UAV types, the fire/damage-deformation system, tank track drive, enemy doctrines, per-theater score — in a single commit that carries `Co-Authored-By: Claude Opus 4.8`, and its message names a second public repo (VideoGameTips/2d-battle-simulator) where the real work happened. Inviting HN to audit that log is handing the skeptics their top comment.

**修正**：Replace the whole of template 3.1 with: "Fair question, and I'd rather answer it head-on. The game — gameplay, campaign, systems — is my kid's design and code. I'm not going to wave the commit log at you as proof, because it isn't proof: early on the files were uploaded through the GitHub web UI rather than committed properly, and one commit bulk-imports a week of work that had been landing in the wrong repo. So here is the honest version instead. [ONE SENTENCE THE FAMILY MUST WRITE THEMSELVES, TRUTHFULLY: exactly what role, if any, an AI assistant played in the kid's own work.] On my fork the AI use is not in doubt — roughly half the commits there carry a Co-Authored-By: Claude trailer. If you want a real test of authorship, ask me anything about how a system in the game works and I'll come back with the answer from the person who designed it." I cannot write the bracketed sentence for you — it is the one claim in the whole kit that has to be the family's own true statement, and it is the one HN will test hardest.

### 🔴 BLOCKER — §2 首条评论 — "I used AI-assisted code review for that polish work"

**问题**：This materially understates the fork's AI involvement, and it is disprovable in ten seconds by anyone who clicks a commit. Verified: 54 of the 123 commits reachable in longmaolab/irontide carry `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`. "AI-assisted code review" describes reviewing; the trailers say co-authoring. The kit's own doctrine ("主动坦白比被挖出来强一百倍") is correct, and this line is the thing that gets dug out.

**修正**：Replace "and I used AI-assisted code review for that polish work" with: "and I do that work with an AI coding assistant (Claude) — about half the commits on my fork carry a Co-Authored-By trailer saying so, so it's on the record rather than buried."

### 🔴 BLOCKER — Whole document — it is git-tracked at docs/promo/channels/show-hn.md in the PUBLIC repo longmaolab/irontide (4 unpushed commits, added by 3705e57)

**问题**：Two failures at once. (1) The next `git push` publishes this entire playbook — the eight canned reply templates, the "don't mention my kid in the title" strategy, section 5 — into the public repo the post links to. HN readers browse the repo of a Show HN; finding a scripted response manual for "AI 质疑" turns every honest reply into visible theatre. All seven sibling channel kits ship with it. (2) Line 189 puts `ssh root@207.148.98.206` in that public file — and the same root+IP string is ALREADY public today in docs/ANALYTICS.md line 16 on GitHub. A Show HN aims thousands of engineers at that repo.

**修正**：Before any push: (a) `cd wt-promo && git rm -r --cached docs/promo && printf 'docs/promo/\n' >> .gitignore && git commit -am 'chore: keep the launch playbook out of the public repo'`; (b) scrub the IP from the doc — replace line 189 with "1. SSH 到 VPS(连接方式见本机 CLAUDE.md,不要写进仓库)检查:磁盘、内存、Caddy 进程正常。"; (c) scrub the already-public copy: edit docs/ANALYTICS.md lines 16 and 85 to remove `root@207.148.98.206`, commit, push — and note that removing it from HEAD does not remove it from history, so also confirm the VPS has password auth disabled and key-only root login before launch night.

### 🟠 MAJOR — §2 首条评论, paragraph 1 — "mount extra cannons onto your deck at port"

**问题**：Wrong mechanic in the flagship public paragraph. Verified in index.html: weapons are bought in the in-game ARMORY panel (Tab) and installed with F — the shop hint reads "Click a weapon, then press F to install it", and tryPlace() has no harbour gate; it works during play (the war pauses while the panel is open). H opens a completely separate "HARBOR COMMAND" panel whose hint is "Spend funds to fortify and supply your harbor." A player who reads the post, sails to a port and waits for a cannon menu will bounce.

**修正**：Replace "and mount extra cannons onto your deck at port" with "and bolt extra guns onto your deck from an in-game armory mid-campaign".

### 🟠 MAJOR — §2 首条评论 ("What I'd genuinely love feedback on:" bullets) and §3.6 (numbered list)

**问题**：HN has no list syntax and single newlines do not break lines — its formatdoc says only "Blank lines separate paragraphs." As written, the three feedback bullets will render as one run-on line reading "- Performance on your hardware - Whether the first five minutes teach the game well enough - Anything in the campaign that feels unfair or confusing", and 3.6's four numbered points will collapse the same way. The single most important comment of the launch will look broken.

**修正**：Put a blank line between every list item in both templates, e.g. the feedback block becomes: "What I'd genuinely love feedback on:\n\n- Performance on your hardware (there are quality settings and adaptive quality, but real-world reports beat my test matrix)\n\n- Whether the first five minutes teach the game well enough\n\n- Anything in the campaign that feels unfair or confusing\n\nPlay: https://game.boobank.com/irontide/". Do the same between items 1–4 in 3.6. Add a note under §1: "HN 评论只认空行分段——列表每一项之间必须空一行,否则会挤成一整段。"

### 🟠 MAJOR — §4.4 step 2 (Cloudflare Cache Rule) and step 6

**问题**：The cache rule as described will cache nothing, so the "最重要的一步保险" silently does not happen. Verified against the live site right now: the origin sends `cache-control: no-cache` and Cloudflare reports `cf-cache-status: DYNAMIC`. Setting only "Eligible for cache" leaves the origin's no-cache header in charge. Separately, the rule expression `game.boobank.com/irontide/*` also matches `/irontide/ws` (the multiplayer WebSocket path per the hosting layout) and `/irontide/sw.js` (the PWA's own update mechanism), which contradicts step 6's assumption that the WebSocket bypasses the rule.

**修正**：Rewrite step 2 as: "**Cloudflare 加缓存规则**:Rules → Caching Rules,表达式 `(http.host eq \"game.boobank.com\" and starts_with(http.request.uri.path, \"/irontide/\") and not http.request.uri.path in {\"/irontide/ws\" \"/irontide/sw.js\"})`。Cache eligibility 选 Eligible for cache,并且**必须**在 Edge TTL 选 \"Ignore cache-control header and use this TTL\" = 2 小时——否则源站的 `cache-control: no-cache` 会让规则形同虚设。改完用 `curl -sI https://game.boobank.com/irontide/ | grep cf-cache-status` 复核,第二次请求必须是 HIT,不能还是 DYNAMIC。"

### 🟠 MAJOR — §4.2 第二条(注册账号 / 绿名)

**问题**：The stated mechanic is wrong, so the parent will spend the weekend on something that cannot work. HN's green username tracks account AGE (widely documented as roughly the first two weeks), not karma or comment count. An account registered 07-24 and posting 07-28 is four days old and will still be green no matter how many genuine comments it leaves. The kit promises an outcome the platform does not offer.

**修正**：Replace the bullet with: "- 如果还没有账号:**今天就注册**——不是为了洗掉绿名(绿名只看账号年龄,大约头两周内都是绿的,周末发几条评论改变不了),而是为了在发帖前熟悉站内节奏、把 karma 拿到 31 以上(31 karma 才有 flag 权限,501 才能 downvote)。接受发帖当天是绿名;如果确实想避开绿名,唯一办法是把首发推到注册满两周之后(即 2026-08-07 以后)。周末只在自己真感兴趣的帖子下发言,不刷。"

### 🟡 MINOR — §4.4 step 3 (Brotli)

**问题**：Outdated Cloudflare instruction — the parent will hunt the dashboard for a switch that no longer exists. Cloudflare removed the Brotli on/off toggle from the dashboard/API and turned Brotli on by default for all zones; compression is now negotiated automatically (zstd > brotli > gzip), tunable only via Compression Rules. Verified live: game.boobank.com already returns `content-encoding: zstd`.

**修正**：Replace step 3 with: "3. 压缩不用设置——Cloudflare 已经取消了 Brotli 开关,默认全开(zstd/br/gzip 自动协商)。只做一次确认:`curl -sI -H 'Accept-Encoding: br, zstd, gzip' https://game.boobank.com/irontide/ | grep -i content-encoding`,看到 `zstd` 或 `br` 即可(今天实测是 zstd)。"

### 🟡 MINOR — §1 首选标题, §2 ("~800KB index.html"), §3.2 (twice)

**问题**：Two small precision problems in the kit's main hook. The file HN will actually download is 835,630 bytes (= 816 KiB), not 800KB — and this audience runs `curl -sI`. Also, "a single 800KB HTML file" is flatly disprovable in devtools: the page loads index.html plus vendor/three.min.js, six vendor/postprocessing/*.js files, and js/terrain.js. The comment body hedges correctly ("essentially one ~800KB index.html plus vendored libs") but the title does not, which invites a pedantic top comment on the very framing chosen as the lead hook.

**修正**：Change the preferred title to (79 chars): "Show HN: Iron Tide – battleship game in one 820KB HTML file + vendored three.js". In §2 change "essentially one ~800KB index.html plus vendored libs" to "one hand-written 820KB index.html plus vendored three.js r128 and a terrain module". In §3.2 change both "800KB" occurrences to "820KB".

### 🟡 MINOR — §2 首条评论 — "Free, no account, no ads, no install." vs "It's an installable PWA" two paragraphs later

**问题**：Self-contradiction in the same comment; a nitpicker will pick it, and it costs nothing to avoid.

**修正**：Change "Free, no account, no ads, no install." to "Free, no account, no ads, nothing to download."

### 🟡 MINOR — §5 预期管理 / §3 通用原则

**问题**：The kit protects the kid's identity thoroughly but never says who reads the thread. Section 5 implies the parent curates what gets relayed, but there is no explicit rule, and launch night is exactly when a tired parent hands over a phone. §3.8 tells the parent not to feed trolls but says nothing about the kid seeing them.

**修正**：Add as the first line of §5: "**先定一条规矩:当晚孩子不看原帖。** 帖子和评论区只由家长打开。孩子看到的是家长筛过之后转述的版本——先念最好的两三条真实反馈(包括掉帧吐槽,那也是真人在玩),恶意评论一条都不转。第二天再一起看完整线程也不迟,那时候情绪已经落地了。"

### 🟡 MINOR — §2 / §3.7 — both templates link github.com/VideoGameTips/irontide

**问题**：Linking the repo also hands HN the whole GitHub account. That profile currently has 20 public repos (including david-story-book, taco-statement-analyzer, gamereview and others), none of which have been reviewed against the family's privacy rule. The profile fields themselves are clean (no name, email, location, bio), but the kit never tells the parent to check what else is reachable from the link it is about to publicise.

**修正**：Add to §4.4 as a new step 0: "0. **发帖前把 github.com/VideoGameTips 的全部公开仓库过一遍**(目前 20 个)。任何 README、提交信息、故事/作业类项目里出现真名、学校、城市、照片的,先改成私有或删掉——链接一发出去,整个账号都会被人翻。"


---

## itch-io.md

**审查结论**：serious-problems · 21 项

**做得好的部分**（不要在后续修改里弄丢）：

- CONTROLS block (§3) is the strongest part of the kit — I checked every keybind against the shipped index.html and they are all correct, including the ones that sounded invented: `Enter` really does open a chat that prints "COMMAND: Type /help to list captain commands." with a real command set (/status /map /shop /harbor /sonar /mine /damage /sound /clear), and `N` really is labelled "☢ STRATEGIC MISSILE COMMAND" in-game so "N strategic map" matches the player-facing label.
- Every headline number in §3 checks out: 31 theaters, 12 achievements, 3-star ratings (earnedStars = 1 + fast-clear + no-ships-lost, capped at 3, drawn as ★.repeat(st) on the theater card), and "procedural music with a distinct profile for each of the 31 theaters" is exactly right (32 profiles = default + 31).
- "virtual stick and context buttons" (§3) and "虚拟摇杆+情境按钮" (§2.4) are accurate — the source comment reads "MOBILE / TOUCH CONTROLS — virtual stick + look pad + mode-aware buttons".
- The itch form walkthrough (§2) uses the real field names and real option values: Classification, Kind of project = HTML with the exact helper string, Release status, No payments, "This file will be played in the browser", Community = Comments, Visibility Draft → Public. Cover 630×500 with a 315×250 minimum and the 10-tag cap are both correct per itch's own getting-started doc.
- §7 「不做的事(诚实红线)」 is genuinely good and rare — no astroturfing, no sockpuppets, no vote solicitation, no fake numbers, no link-dropping in other devs' comment sections. Nothing anywhere else in the kit contradicts it.
- Draft-first-then-Public, with a real playtest on the draft page before flipping to Public, is the correct workflow and the kit never asks the kid to register or speak anywhere.
- Pricing = No payments with the stated reason (no tax/payout paperwork for a minor's work) is sound and keeps the account clean.

### 🔴 BLOCKER — §2.3 Uploads + §3 Description, bullet "An early multiplayer mode exists but is experimental"

**问题**：The kit uploads `irontide-itch.zip`, which keeps a prominent "🌐 MULTIPLAYER" button on the menu wired to `openMultiplayer()`. That panel prefills its relay URL from `defaultRelayUrl()`, which is `(location.protocol==='https:'?'wss':'ws')+'://'+location.host+'/play'`. On itch the game runs from itch's HTML CDN host, so this resolves to `wss://html-classic.itch.zone/play` — an endpoint that does not exist. Every visitor who clicks the button gets "Connection failed." and no way to know what to type instead. The description advertises the mode, so the first public comment on the page will be "multiplayer is broken." The already-built `irontide-portal-singleplayer.zip` hides that button (`{const _mp=log.querySelector('#mpBtn'); if(_mp) _mp.style.display='none';}`) — the kit picks the wrong one of the two builds it has.

**修正**：§0 and §2.3: upload `promo/builds/irontide-portal-singleplayer.zip`, not `irontide-itch.zip`. Then delete this bullet from §3 entirely:
"- An early multiplayer mode exists but is experimental — the campaign and quick battle are the real game today"
and replace it with:
"- One-player game: a 31-theater campaign, quick battle, and 7 sandbox maps"
Also delete the matching promise in §3's opening if you have added one. (If you would rather keep multiplayer live on itch, that is a separate decision: it requires hard-coding the real relay — e.g. `return 'wss://game.boobank.com/irontide/play';` — which then points public itch traffic at the family VPS and opens an in-game chat channel between your kid and strangers. Do not do that without deciding it deliberately.)

### 🔴 BLOCKER — §3 Description, "WHO MADE THIS" — the two GitHub links; contradicts the privacy red line on line 4

**问题**：Line 4 promises the kid's real name appears nowhere. §3 then instructs the parent to publish links to both repos. The git history in repo contains 9 commits authored as `Andy Li <孩子的旧私人邮箱>` and 28 commits total carrying <孩子的旧私人邮箱> (the rest under the `VideoGameTips` display name on the same address). Author name and email are public on every GitHub commit page and through the unauthenticated API. Publishing `https://github.com/VideoGameTips/irontide` next to the sentence "the developer is a minor" hands anyone a real first+last name and a personal email for a child, in two clicks. The kit has no step that checks this.

**修正**：Add a new step to §1, before anything is made Public:
"0. 先做隐私体检(必须在发布前完成):
   - `cd repo && git log --format='%an <%ae>' | sort -u` —— 如果出现真名或私人邮箱,先用 `git filter-repo --mailmap` 重写两个仓库的历史并 force push,再发布任何链接。
   - GitHub → Settings → Emails,给 VideoGameTips 账号勾选 'Keep my email addresses private' 和 'Block command line pushes that expose my email'。
   - 打开 https://github.com/VideoGameTips 检查 profile 的 Name / Bio / Location / 头像里没有真名、城市、学校、真人照片。
   - 检查两个仓库的 commit 列表页、Issues、PR 描述里没有真名。"
Until that is done, cut the upstream link from §3 and keep only:
"- Open source: https://github.com/longmaolab/irontide"

### 🔴 BLOCKER — §3 Description, WHAT'S INSIDE — "12 medals and achievements, 3-star ratings on every theater, and a family high-score board"

**问题**："a family high-score board" does not exist. There is no leaderboard, high-score table, or score board anywhere in the shipped build — `high score`, `highScore`, `leaderboard` and `scoreboard` all return zero matches in index.html (the only `bestScore` is a variable inside the aim-assist cone). This is an invented feature on a public store page, and it is the exact kind of claim a commenter will call out. (The other two claims in the same bullet are correct — 12 achievements, and stars really do cap at 3.)

**修正**：Replace the bullet with:
"- 12 medals to earn, and a 3-star rating on every theater — clear it fast and lose no ships for all three"

### 🔴 BLOCKER — §3 Description, "It's also a PWA — you can install it to your home screen and play offline." (and the related 技术备注 in §0)

**问题**：False on the build being uploaded. Both zips have had the service-worker registration stripped — `serviceWorker` appears zero times in index.html (sw.js and manifest.json are still in the zip, but nothing registers them). With no registered service worker, and running inside itch's cross-origin iframe, there is no install prompt and no offline play. A player who tries it and it silently does nothing is a bad first impression on the store page itself. The §0 note is wrong in a related way: it says the SW "registration will fail, that's normal" — there is no registration at all, so nothing fails.

**修正**：§3: delete the line "It's also a PWA — you can install it to your home screen and play offline." If you want to keep the capability visible, move it onto the boobank line instead:
"The game also lives at https://game.boobank.com/irontide/ — same build, and that version installs to your home screen and plays offline."
§0 技术备注: replace with:
"技术备注:上传给 itch 的构建包已经去掉了 service worker 注册,所以 itch 页面上没有离线/安装功能,也不会有报错。离线安装只在 game.boobank.com 那一份上有。"

### 🟠 MAJOR — §0 发布前物料清单 (cover image bullet + video bullet) and all of §6

**问题**：The kit tells the parent to hand-crop a cover image and to spend Saturday morning recording a 30–60s video. Both already exist. `promo/assets/final/` contains `cover-itch-630x500.png` and `cover-itch-titled-630x500.png` (ready to upload), plus `iron-tide-hero-45s.mp4` (48s), `iron-tide-clip-20s.mp4`, `iron-tide-short-vertical.mp4` and `preview.gif`. As written this adds a wasted half-day and pushes the launch, for work already done.

**修正**：§0: replace the cover bullet with:
"- 封面图:`promo/assets/final/cover-itch-630x500.png`(已生成,直接上传;带标题的版本是 `cover-itch-titled-630x500.png`,二选一)"
and replace the video bullet with:
"- 视频:`promo/assets/final/iron-tide-hero-45s.mp4`(已生成,48 秒)—— 直接传 YouTube,不用重录"
§6: retitle to "## 6. 视频(可选:只有想重录时才看)" and add a first line: "成片已经有了(`iron-tide-hero-45s.mp4`)。下面的 shot list 只在你想自己重拍时用。" Update the 建议时间表 accordingly: 7/25 上午改为「传已有的 mp4 到 YouTube → 填链接」,发布可以提前到周五晚或周六上午。

### 🟠 MAJOR — §6 shot list, row 45–54秒: "N 打开战略地图扫一眼 31 个战区"

**问题**：N does not open a 31-theater map. `KeyN` calls `toggleTacticalMap()`, which opens a panel headed "☢ STRATEGIC MISSILE COMMAND" — a nuclear-silo targeting screen for the current battle, with the hint "Select a friendly R-36M silo, then select a target area." The screen that actually shows all 31 theaters with ★ ratings is the campaign briefing / theater-select screen from the menu (that's what `06-briefing.png` is). If the parent does keep §6 and follows this row, they record the wrong screen and only find out in the edit.

**修正**：Replace that cell with:
"露一段 Varga 的电台对话字幕;回主菜单进战役简报页(就是截图 06-briefing.png 那一屏),扫一眼 31 个战区和 ★ 评分;闪一下勋章界面"
If you want the missile screen as a separate beat, describe it correctly: "按 N 开 ☢ STRATEGIC MISSILE COMMAND(本场战斗的核打击目标屏)".

### 🟠 MAJOR — § 建议时间表 ("被 Fresh Games 栏目扫到的窗口期") and §7 发布后 checklist

**问题**：The kit sets one expectation — publish Saturday, catch the Fresh Games window — and offers no fallback when it doesn't happen. itch's quality guidelines state that "our systems or a site moderator may choose to remove your page from itch.io's discovery index," pages then stay reachable by direct URL but appear in no listing. Brand-new creator accounts routinely wait days to weeks before a first project is indexed in browse/search; itch's support forum has a steady stream of month-long waits requiring a manual index request. For a kid watching the view counter, "we launched and literally nobody came, and we can't even find it in search" is the worst possible day-one outcome, and the kit has nothing to say about it.

**修正**：Add to §7, 发布日 section:
"- [ ] **先跟孩子把预期说清楚**:itch 新账号的第一个项目通常不会立刻进 browse/search,可能要等几天甚至几周才被收录。页面本身用直链一直能玩。第一周的目标是「做完并且发出去」,不是数字。
- [ ] 发布后第 3 天,用无痕窗口在 itch 搜 \"Iron Tide\" 看有没有收录。如果 7 天后还搜不到,去 itch.io/support 开一个 ticket,附项目链接,礼貌地请求人工 index(这是完全正常的流程,不是被封)。"
And soften the timetable rationale: delete "发布后头两天正是被'Fresh Games'栏目扫到的窗口期" and write instead "Fresh Games 栏目会滚动展示新页面,但新账号首个项目要先通过收录审核,不保证当天出现——把发布本身当成目标。"

### 🟠 MAJOR — §2.5 Details → AI generation disclosure

**问题**：The kit tells the parent to answer Yes/Code but never states what that does. Answering Yes stamps public tags onto the project page: "AI Generated" plus the sub-tag "AI Generated Code" (projects answering No get a "No AI" tag). On a page whose entire emotional pitch is "my kid built this," a visible AI-Generated badge is exactly the thing that produces a hostile top comment. The kit also mis-frames the field: it justifies the Yes with "fork 的维护工作用了 AI 辅助代码审查," but itch's question is "does your project contain the results of generative AI?" — code review alone isn't generative output in the shipped build; AI-written code that ships is. The parent should answer the question that was actually asked, and be ready for the tag.

**修正**：Rewrite the section as:
"**Generative AI disclosure**(表单问的是 'does your project contain the results of generative AI?'):
- 这个字段对游戏是**可选**的(只对 asset 包强制),但我们照实填。
- 判断标准是**成品里有没有 AI 生成的内容**,不是「有没有用过 AI 工具」。如果 fork 里有 AI 写进去、现在还在跑的代码,就选 **Yes** 并只勾 **Code**;如果 AI 只做了代码审查和建议、代码是人写的,那就选 **No**。你比我清楚,按实际情况选。
- **选 Yes 的后果要知道**:itch 会在页面上自动打 'AI Generated' 和 'AI Generated Code' 两个公开标签(选 No 会打 'No AI' 标签)。这两个标签会被看见,而且这类页面容易收到'所以是 AI 做的?'的评论。
- 如果选了 Yes,就在 §3 的 WHO MADE THIS 段落里主动说清楚,别让标签替你解释。"
And if Yes, add this sentence to §3's WHO MADE THIS paragraph, right after the fork sentence: "To be precise about the AI disclosure tag on this page: it covers maintenance code in my fork only — the game's design, its systems, its art and its writing are my kid's."

### 🟠 MAJOR — §1 账号设置, step 1: "itch 官方允许监护人账号发布未成年人的作品——这正是我们的合规路径"

**问题**：itch.io does not say this. Its Terms of Service say: "Publishers affirm that they are either more than 18 years of age, or possess legal parental or guardian consent," and separately "Publishers are solely responsible for the content they upload." There is no documented guardian-account provision. The parent-owned account is compliant — but for a different reason than the kit gives. Stating a platform rule that the platform never stated is the kind of thing that falls apart if support ever asks, and the whole page's credibility rests on nothing being overstated.

**修正**：Replace step 1 with:
"1. 打开 https://itch.io/register ,**用你自己(成年人)的身份注册**。itch 的服务条款要求发布者年满 18 岁,或者取得父母/监护人同意,并且规定'发布者对上传内容负全部责任'。我们的做法是账号和责任都在家长这边——孩子本人不注册、不发言。"

### 🟠 MAJOR — §2.6 Community; §3 last line "Every single one gets read out at our dinner table"; §7 「回评论」

**问题**：The kit opens a public comment section on a page that announces the developer is a child, and then tells the world the child hears every comment — which is precisely the signal that attracts someone who wants to be heard by a child. There is no moderation plan anywhere: nothing about the parent reading comments before the kid does, nothing about itch's delete/block controls, nothing about what to do with a cruel one. §7's single line 「回评论——由你(家长)回复」 covers who replies, not who reads first.

**修正**：§3: replace the closing line with something that keeps the warmth without advertising a child audience:
"If you play it, a comment means a lot — we read them together."
§2.6: append:
"评论区开着,但由你(家长)全权管理。itch 项目页 → Comments,每条评论右侧有删除;点用户名进他主页可以 Block。"
§7 发布日: add:
"- [ ] 跟孩子约好:评论由你先看一遍,再挑着念给他听。好评原样念;恶评你自己处理掉,不必转达。这条要提前说,不要等到出事再说。
- [ ] 提前打预防针:第一周可能一条评论都没有,这很正常,和游戏好不好无关。"

### 🟡 MINOR — § 建议时间表 脚注 ("互动率约为下载游戏的 3 倍") and §7 ("中位数游戏一生只有约 1.6k 次浏览")

**问题**：Two hard numbers stated as fact with no source. Both trace to one place: Chris Zukowski's How To Market A Game itch.io benchmark (May 2025), which reports "Median 1,582" lifetime views and the browser-vs-download gap (37% of viewers play a browser game vs 6% for download-only) from a self-selected survey of 169 developers who volunteered their stats. That is a useful figure but it is not an itch.io statistic and it is not a random sample. A third claim — "itch 浏览流量周末最高" — has no source at all; that benchmark says traffic spikes on itch are event-driven, not day-of-week driven.

**修正**：Timetable footnote → "选周六发布主要是因为你周末有时间盯着。关于浏览器可玩的价值:据 How To Market A Game 2025 年 5 月对 169 位开发者自报数据的统计,浏览器游戏约 37% 的访问者会点开来玩,只能下载的游戏是 6%——差不多 3 倍。样本是自愿提交的,当参考不当定论。"
§7 → "jam 是 itch 上最主要的被发现渠道。同一份 2025 年的开发者调查里,itch 游戏的浏览量中位数是 1,582 次(169 份自报样本)。想超过这个数基本靠 jam 和外链,不靠首页。"

### 🟡 MINOR — §0 发布前物料清单, 检查 zip 结构 ("同包应含 vendor/、manifest.json、sw.js、icons/")

**问题**：The list omits `js/`, and `js/terrain.js` is required for the game to run — a parent verifying against this list would sign off on an incomplete zip. I unzipped the real build: it is index.html, js/terrain.js, icons/icon-192.png, icons/icon-512.png, manifest.json, sw.js, vendor/three.min.js and vendor/postprocessing/ (6 files), 17 entries total.

**修正**：Replace with: "同包应含 `vendor/`、`js/`(里面有 terrain.js,缺了游戏起不来)、`icons/`、`manifest.json`、`sw.js`,一共 17 个条目。"

### 🟡 MINOR — §3 Description, WHAT'S INSIDE — "Photo mode (press L) for screenshots, plus quality settings with adaptive bloom"

**问题**："adaptive" appears nowhere in the build. Bloom exists (initPostFX, UnrealBloomPass in vendor/postprocessing/) but there is no adaptive bloom. It reads as invented spec-sheet jargon, which is the specific flavour of over-claim that makes a page look AI-written.

**修正**：Replace with: "- Photo mode (press L) for screenshots, and a quality setting (press I) if your machine needs a lighter load"

### 🟡 MINOR — §3 Description, WHAT'S INSIDE — "Dynamic weather, and procedural music..."

**问题**：Loose. Weather is chosen per theater at map load (`weather.type=M.weather; weather.tod=M.tod`) alongside a day/night value and a sea state — it is not weather that shifts dynamically during a battle. Storms do change the sea and bring audible rain, which is the genuinely good detail the current wording buries.

**修正**：Replace with: "- Every theater has its own weather and time of day — storms raise the sea state and you can hear the rain over the guns" (keep the procedural-music clause as its own bullet; it is accurate as written)

### 🟡 MINOR — §3 Description, CONTROLS block

**问题**：The controls list is otherwise complete but silently omits `C` — `if(e.code==='KeyC') toggleDive();` — and the description never mentions that a submarine is one of the playable ships. A player who buys the submarine has no way to learn how to dive.

**修正**：Add to the Ship line, after "Z damage control": " · C dive / surface (submarine)". Optionally add to WHAT'S INSIDE: "- 29 ships to unlock and command, from a scout up to Yamato — including a submarine that dives"

### 🟡 MINOR — §3 Description, WHAT'S INSIDE (missing bullet)

**问题**：The description never mentions the game's most impressive and most verifiable fact: the sheer content count. The build has 29 player-selectable ships plus a boss (Leviathan), 61 planes, 22 tanks and 21 weapons. A page selling "my kid built this" leaves its best evidence on the floor, and these are the numbers a skeptical reader can check in thirty seconds by opening the armory.

**修正**：Add as the second bullet under WHAT'S INSIDE:
"- 29 ships, 61 aircraft, 22 tanks and 21 weapons in the armory — plus one enemy flagship you will not enjoy meeting"
(Screenshot 04-armory.png already shows this; put it early in the screenshot order so the claim is visible.)

### 🟡 MINOR — §6 录制参数 ("按 J 确认音乐开着"; "L 拍照模式(自由飞行相机:WASD 飞、Space/Shift 升降)")

**问题**：Two small traps. J is a toggle (`if(e.code==='KeyJ'&&!e.repeat) musicToggle();`) — telling the parent to "press J to confirm music is on" will mute it half the time and they'll record a silent take. And the photo-mode free-fly control scheme (WASD to fly, Space/Shift for altitude) is asserted without being verified anywhere; if it's wrong the parent burns time fighting the camera.

**修正**：Replace with: "游戏里按 **I** 把画质调到最高;音乐是 **J** 切换,先听一下,已经在响就别按。按 **L** 进拍照模式后,先在屏幕上看一眼提示的相机操作再开录——不要照搬这里写的按键。"

### 🟡 MINOR — §6 shot list, row 5–14秒: "正常驾驶,W 满舵门冲向敌舰"

**问题**：Garbled and mixes up two controls. 「满舵门」 is not a word — 「满舵」 is full rudder (A/D) and 「油门」 is throttle (W/S). As written the instruction is unfollowable.

**修正**：Replace with: "正常驾驶,W 加满油门冲向敌舰,A/D 打舵摆出侧舷,鼠标瞄准齐射"

### 🟡 MINOR — §7 发布后 checklist, the README snippet

**问题**：The snippet `**itch.io:https://longmaolab.itch.io/irontide**` has no space after the colon and is not a markdown link, so it renders as bolded run-together text rather than a clickable link — in the README of the repo the itch page points at.

**修正**：Replace the snippet with:
"- **itch.io**: <https://longmaolab.itch.io/irontide>"

### 🟡 MINOR — §6 结尾 ("传 YouTube(你现有 Google 账号...)")

**问题**：Two omissions. YouTube requires an audience declaration on every upload — "Is this video made for kids?" — and it is not optional; the kit doesn't mention it, and choosing "Yes, made for kids" strips comments and several features from the video. Separately, the upload will carry the parent's existing channel name and avatar publicly on the itch page embed; if that Google account is a family account, the channel name or avatar may identify more than intended.

**修正**：Append: "上传前两件事:(1) YouTube 会强制问 'Is this video made for kids?' —— 这是面向一般玩家的游戏预告,选 **No, it's not made for kids**(此设置影响评论和推荐,选错要重设);(2) 先确认这个 Google 账号的频道名和头像不是真名/全家福——它会公开显示在 itch 页面的视频下面。不确定就新开一个只用来发游戏的频道。"

### 🟡 MINOR — §2.5 Details → Tags

**问题**：`battleships` is a near-dead tag on itch — 14 games total — while the singular `battleship` has 65 and `naval` has 89. itch's quality guidelines specifically say to "prefer using a suggested tag over creating a new one" and to avoid redundant synonyms. As listed, one of the ten slots is spent on a tag almost nobody browses.

**修正**：Change the tag line to:
"naval, war, 3d, battleship, tanks, flight, shooter, singleplayer, arcade, open-source"
(`open-source` is a live tag — 2,668 games — so that choice is good; only the plural is the problem.)

