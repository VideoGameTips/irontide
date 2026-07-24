# Iron Tide — Newgrounds 上传全套指南(copy-paste ready)


> **文件路径基准**：下面所有 `promo/...` 路径都相对于 **`/Users/longmao/projects/irontide/`**
> （不是仓库目录）。开始之前先执行一次，后面的路径就都能直接用：
>
> ```bash
> cd /Users/longmao/projects/irontide
> ```
>
> 物料在 `promo/`，文档在 `repo/docs/promo/`。物料不进版本库，用 `repo/tools/` 里的脚本重新生成。

> 平台:Newgrounds(newgrounds.com,月访问约 2800 万)
> 特点:HTML5 zip 上传、发布即公开并进入 "Under Judgment" 社区投票、反馈文化直率甚至毒舌、优秀作品有机会被员工推上首页。
> 今天是 2026-07-24(周五)。建议今晚做准备,**2026-07-25(周六)北京时间 20:00–22:00 发布**(≈ 美东周六早上 8–10 点,发布后美国玩家全天都在投票)。

---

## 第 0 步:发布前准备清单(今晚周五完成)

### 0.1 素材确认

| 素材 | 路径 | 用途 |
|---|---|---|
| 网页版构建包 | `/Users/longmao/projects/irontide/promo/builds/irontide-portal-singleplayer.zip` | 上传主体 |
| 截图 ×6 | `/Users/longmao/projects/irontide/promo/assets/final/01-menu.png` … `final/06-briefing.png` | 缩略图 + 项目截图 |

视频:**Newgrounds 游戏上传不需要视频**,这一步可跳过。你计划录的 30–60 秒实况留给其他渠道复用即可。

### 0.2 zip 自检(很重要,NG 是沙盒 iframe 环境)

- `index.html` 必须在 **zip 根目录**(解压后第一层就能看到,不能套一层文件夹)。
- 所有资源路径必须是**相对路径**(单文件 + vendored 库的结构天然满足,确认即可)。
- PWA 的 service worker / manifest 在 NG 的 CDN 沙盒里可能注册失败——**失败时必须静默,不能弹错误**。本地测一下。
- 首屏要有可见的加载提示(游戏本身 ~800KB、秒开,问题不大,但 NG 玩家对白屏零容忍)。
- 声音必须在用户点击/按键之后才开始播放(浏览器自动播放策略;确认游戏有"点击开始"一类的首屏)。

本地验证命令(完整玩 2 分钟,含开炮、按 Tab 开军械库、按 L 拍照):

```
cd /private/tmp/claude-501/-Users-longmao-projects-irontide/e9d1afc0-4a5f-4659-8c07-dd4a2040f5a2/scratchpad
mkdir -p ng-test && cd ng-test
unzip -o /Users/longmao/projects/irontide/promo/builds/irontide-portal-singleplayer.zip
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

### 0.3 账号规则(务必遵守)

- **由家长注册并持有账号**。NG 规定 13–17 岁需家长许可,而且站内其他分区有成人内容——**孩子不单独浏览 Newgrounds**,看评论一律经你过滤(见第 7 步)。
- 用户名建议直接用 `longmaolab`(与 GitHub 一致,便于对得上开源仓库)。**不要**填年龄、城市、学校;名字可以出现,GitHub 手柄 "VideoGameTips" 也可以。
- 注册用你自己的邮箱,完成邮箱验证。

---

## 第 1 步:创建项目

1. 登录后访问 **https://www.newgrounds.com/projects**(或右上角用户菜单里找 "Projects / Upload your creations")。
2. 选择 **Game** 类型,点 **Create a New Project**(按钮措辞可能略有不同,以页面为准)。
3. 进入项目编辑器后,按下面第 2–5 步逐字段填写。可以随时保存草稿,最后再点发布。

---

## 第 2 步:逐字段填写

### 2.1 Title(标题)

```
Iron Tide: Battleship Command
```

### 2.2 Category / Genre(分类)

- Category:**Games**
- Genre 首选:

```
Action - Shooter - Multidirectional
```

- 如果你觉得下拉列表里 `Action - Shooter - First Person` 更贴切(游戏里有第一人称开飞机/步战段落),选它也没问题。二选一即可,别纠结,发布后可改。

### 2.3 Description(游戏描述,英文,整块粘贴)

```
Command your own battleship across a 31-theater world campaign, and hunt down your rival: Grand Marshal Varga, complete with story radio dialogue.

One war, four ways to fight — captain a battleship, fly planes, drive amphibious tanks, or fight on foot. Visit the port shop to bolt extra cannons onto your deck (press F).

FEATURES
- 31-theater world campaign with a story rival
- Battleship + planes + amphibious tanks + infantry combat
- Mount extra deck cannons at the port shop
- 12 in-game medals, a 3-star rating on every theater, and a battle report card you can save as a PNG
- Quick battle mode and sandbox maps
- Dynamic weather, and procedural music with a unique profile for every theater
- Photo mode (press L)
- Quality settings + adaptive quality with bloom
- Keyboard/mouse, gamepad and touch — plays on desktop and mobile
- English / 中文
- Single-player campaign, quick battle, and sandbox maps

Free, no account, no ads, loads in seconds. Built with three.js, and fully open source (links in the author comments).
```

### 2.4 Author Comments(作者的话,英文,整块粘贴——孩子的故事放这里,克制而真诚)

```
Hi Newgrounds! Parent here, posting on behalf of my kid.

This game was designed and built almost entirely by my kid, solo (GitHub handle: VideoGameTips) — the 31-theater campaign, the boss rival, the vehicles, the deck-cannon shop, basically everything you'll actually play. My part is the parent-maintained fork: bug fixes, finishing the English/Chinese translations, onboarding, achievements and performance tuning, with some AI-assisted code review along the way.

It's fully open source:
- Original repo by the kid: https://github.com/VideoGameTips/irontide
- Polished fork: https://github.com/longmaolab/irontide

A few notes:
- The 12 medals are in-game medals, not Newgrounds API medals (maybe someday).
- Multiplayer is EXPERIMENTAL and early — single player is the real game.
- Tips: press Tab for the armory, buy a gun, then F to bolt it onto your deck; press L for photo mode.

Honest feedback is genuinely welcome — especially anything that feels bad in the first five minutes. My kid reads the constructive reviews (I filter first; this is Newgrounds, after all). Thanks for playing!
```

> 说明:如果你的编辑器界面只有一个大文本框(有些版本 Description 和 Author Comments 是合一的),就把 2.3 整块贴上,空一行,再贴 2.4 整块。

### 2.5 Tags(标签)

NG 标签数量有限(一般最多 12 个),全小写、无空格(用连字符)。逐个输入以下 10 个:

```
battleship
naval
warship
war
3d
shooter
tank
campaign
open-source
ocean
```

### 2.6 Rating(适龄分级)—— 选 **T**

Newgrounds 的投稿表单**不是 ESRB 那种"轻/中/重"分级**,而是五个勾选框。照下面勾:

- Nudity/Sexual:**不勾**
- Violence:**勾上**(军事载具战斗、爆炸、核打击与神风机)
- Explicit Audio:**不勾**
- Explicit Text:**不勾**
- Adult Themes:**不勾**(战争题材,但无血腥、无脏话)

⚠️ **填表前先知道游戏里有什么**:游戏包含核打击载具(B-29 / Tu-95 等历史核载机、一架"原子打击无人机")和几架专用神风机,而且**默认是开着的**。设置面板(按 K)里有「家长模式(无核武)」开关可以关掉这些,但默认关闭。

所以别在任何地方把游戏描述成"只有卡通爆炸"——那对审核和玩家都不诚实,而且 NG 的社区判定期里一定有人玩到。如实勾 Violence、分级选 **T**(≈13+)就够了,这也是 NG 上同类军事题材的常规做法。

**可选的更稳做法**:如果希望在 NG 上以更低分级示人,可以在给 NG 的这份构建里把 `SETTINGS.contentFilter` 默认改成 `true`(家长模式默认开),核武与神风内容就不出现,再按 E 分级提交。这是产品决定,不是必须。

### 2.7 AI 内容申报(如果表单问到)

近年 NG 对生成式 AI 素材有严格政策,表单可能问 "Does this contain AI-generated content?" 之类:

- 游戏内**美术/音频素材不是 AI 生成的**(程序化生成音乐 ≠ AI 生成),按提问口径选 **No**。
- 开发过程中用过 AI 辅助代码审查——这一点我们已经在 Author Comments 里如实写明,问心无愧。
- 如果表单的问法明确涵盖"AI 辅助开发",就如实勾选并简单备注 "AI-assisted code review only; all art, music and design are original."

### 2.8 Licensing / Sharing(授权选项)

保持页面默认即可。游戏本身已在 GitHub 开源,无需在 NG 额外授权什么。

---

## 第 3 步:上传 zip + 尺寸设置

1. 在项目的文件/上传区选择 `/Users/longmao/projects/irontide/promo/builds/irontide-portal-singleplayer.zip`(几 MB,远低于 NG 上限,秒传)。
2. **View
port / Dimensions(嵌入尺寸)填:**

```
Width: 1280
Height: 720
```

3. 勾选 **Fullscreen**(允许全屏按钮)——游戏是响应式全屏设计,开了全屏才是完整体验。
4. 如果有 "mobile / touch compatible"(手机/平板兼容)一类的勾选项,**勾上**(游戏有触屏操作)。
5. 预加载:NG 会先显示自己的加载层,之后就是游戏自己的首屏——0.2 节的自检已覆盖,这里无需额外做 preloader。
6. 用编辑器里的 **Preview** 功能在 NG 沙盒里实际玩 2 分钟再发布:确认能全屏、有声音(点击后)、进得了港口商店。

---

## 第 4 步:缩略图与截图

- **Icon/Thumbnail(缩略图)**:用 `promo/assets/` 里最有辨识度的一张(建议 `final/01-menu.png`,战舰开炮或天气效果最抓眼的那张)。NG 上传时自带裁剪工具,按提示裁即可;主体居中、别让 UI 文字被裁掉。
- 如界面提供额外 screenshots 区,把 `final/02-combat-hud.png` 到 `final/06-briefing.png` 都传上:覆盖战舰、飞机、坦克、步战、港口商店、照片模式各一张最好。

---

## 第 5 步:发布

- 点 **Publish**。发布即公开,自动进入 **Under Judgment**(社区打分 0–5)。
- 建议发布时间:**2026-07-25(周六)北京时间 20:00–22:00**。
- 发布后把游戏页 URL 记下来,后续回评论、看分数都在这个页面。
- **不要**叫亲友注册小号刷分、不要在任何地方求票("vote 5 plz" 在 NG 是大忌)——被发现会严重损害账号信誉,而且违背我们自己的诚信原则。

---

## 第 6 步:Under Judgment 机制(先给你交底)

- 判定期一般持续数天(预计 7 月 27–31 日之间出结果)。期间玩家边玩边打 0–5 分。
- 判定结束时分数过低(大约低于 1.6)的作品会被**删除**(NG 黑话叫 "blammed");通过则永久保留并获得正式评分。一个完整可玩、有这个体量的游戏,被 blam 的概率很低,但要有心理准备。
- 当日高分作品可能拿 Daily 奖(Daily 1st–5th);员工觉得出色的会推上**首页**——这两样都是锦上添花,不是目标。

---

## 第 7 步:评论应对(重点:先过滤,再给孩子看)

### 7.1 家长工作流(中文)

1. 发布后 48 小时(7 月 25–27 日)每天查看 1–2 次评论,**永远由你先读**。
2. 把评论分三类:
   - **有用的技术/设计反馈**(哪怕语气冲):翻译成建设性的中文转述给孩子。"这人说前 5 分钟不知道该干嘛"比原文的脏话版本有用一万倍。
   - **无用的刻薄话**(纯发泄、没有信息量):不回复、不转述、直接翻篇。NG 文化就是嘴狠,不代表游戏差。
   - **违规内容**(人身攻击、骚扰):用评论旁的举报/flag 功能处理,不对线。
3. 回复一律用英文、以家长身份、账号口径与 Author Comments 一致。**任何情况下不透露年龄、城市、学校、长相**;名字和 "VideoGameTips" 可以说。有人私信打探这些一律不回。
4. 不争辩、不解释情绪。有人打 0 分骂街,最好的回应是没有回应。
5. 给孩子看评论时的原则:好评原样翻;差评先问自己"这条里有没有孩子能用上的信息?"——有就提炼那一句,没有就不提。

### 7.2 英文回复模板(按情况粘贴改用)

好评/鼓励类:

```
Thanks for playing, and for the kind words! I'll pass this along — my kid (who built the game) will be thrilled. If you haven't yet, try buying a gun in the armory (Tab) and bolting it onto your deck with F.
```

建设性批评类(哪怕语气冲,只回内容):

```
Thanks for the honest feedback — this is exactly what we posted here for. You're right about [具体问题,如 "the early-game guidance"]; it's going on the fix list. The game is open source (links in the author comments) if you want to follow along.
```

Bug 报告类:

```
Thanks for the report! Could you share your browser/device and roughly where it happened (which theater / vehicle)? You can also file it at https://github.com/longmaolab/irontide/issues — either way, we'll dig into it.
```

多人模式抱怨类:

```
Good catch — this upload is single-player only, so there's no multiplayer button here. There is an experimental multiplayer mode, but it only runs on the game's own site (game.boobank.com/irontide) and it's rough. The 31-theater campaign is the real game right now.
```

---

## 第 8 步:合理预期(发布前请通读这段,也用它给孩子打预防针)

对一个没有粉丝基础的新账号,现实的第一周大概率是:**几百到小几千次游玩、个位数到十几条评论、评分落在 2.5–3.5 之间**——在 NG,一个新人作品稳定在 3 分以上已经是不错的成绩。被 blam 的风险对这种完整度的游戏很低,但存在;首页推荐和 Daily 奖是小概率事件,别当目标。NG 玩家会拿它跟站上打磨多年的成名作比,评语会直接甚至难听——这不是针对孩子,是这个社区对所有人的方式。这次发布真正能拿到的东西是:真实陌生玩家的第一手反馈(尤其是前 5 分钟的流失点)、一个公开的作品页,以及"把作品放到最挑剔的玩家社区面前"这件事本身。对一个孩子的作品来说,敢发出来就已经赢了一半;剩下一半,是把有用的反馈捡回来做进下个版本。

---

## 附:发布时间线速查

| 日期 | 事项 |
|---|---|
| 2026-07-24(周五)| 第 0 步全部准备:zip 自检、注册账号、填好项目草稿 |
| 2026-07-25(周六)20:00–22:00 北京时间 | 点 Publish 发布 |
| 2026-07-25–27(周六–周一)| 每天查看评论 1–2 次,按第 7 步回复 |
| 2026-07-27–31(下周)| Under Judgment 出结果;通过后截图留念,把好评翻给孩子 |
