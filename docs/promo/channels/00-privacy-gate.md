# 发帖前的隐私闸门（所有渠道的前置条件）


> **文件路径基准**：下面所有 `promo/...` 路径都相对于 **`/Users/longmao/projects/irontide/`**
> （不是仓库目录）。开始之前先执行一次，后面的路径就都能直接用：
>
> ```bash
> cd /Users/longmao/projects/irontide
> ```
>
> 物料在 `promo/`，文档在 `repo/docs/promo/`。物料不进版本库，用 `repo/tools/` 里的脚本重新生成。

> **这一页没做完，任何渠道都不要发。**
> 推广的本质是把陌生人引向这两个仓库和这个站点。引流之前，先确认它们不会泄露不该泄露的东西。
> 下面每一条都是 2026-07-24 实际检查出来的结果，不是假想风险。

## 家里定的口径（2026-07-24）

- **名字（Andy）可以公开**。这是家长的决定：一个名字不构成风险，而且孩子署名自己的作品是应得的。
- **私人邮箱不可以**。`zianandyli@gmail.com` 出现在两个仓库的每一条提交里，任何人用 GitHub 公开 API 就能一次性拉走，是垃圾邮件、钓鱼和身份关联的直接入口。
- **不公开的**：年龄、城市、学校、真人照片/录音。这三样组合起来才真正定位到一个孩子，比名字危险得多。

按这个口径，下面各条的处理方式都已相应调整。

## 已经处理的

### 1. 提交历史里的私人邮箱 —— 已重写（fork 仓库）

`longmaolab/irontide` 的全部提交作者邮箱已改写成 GitHub 的 noreply 地址，**作者名 `Andy Li` / `VideoGameTips` 原样保留**。验证：

```bash
git log --format='%an <%ae>' | sort -u
```

输出里不应再出现任何 `@gmail.com`。

> **孩子自己的仓库 `VideoGameTips/irontide` 还没改** —— 那是他的仓库，需要他本人操作或明确授权。做法与这边完全一样，命令见文末附录。在他改之前，"去看提交历史"这类邀请仍然会把人引到有邮箱的地方。

### 2. 游戏源码里的注释 —— 已改，等部署

`index.html` 原有四处中文注释写着孩子的名字。按新口径名字本身没问题，但这四处注释的内容是"谁写了哪段代码"，对读源码的人没有意义，已统一改成「上游新增…」。`server/README.md` 的示例玩家名同步改成 `Captain`。

（这条只在部署后生效：`curl -s https://game.boobank.com/irontide/ | grep -c gmail` 应为 0。）

## 还需要你做的

### 孩子的仓库（`VideoGameTips/irontide`）

`longmaolab/irontide` 已经改完了，但孩子的原始仓库里每条提交仍带着 `zianandyli@gmail.com`。而所有渠道文案在回应"真的是小孩做的吗"时都会说"提交历史是公开的，你自己看"——那条路径目前仍然通向邮箱。

需要孩子本人（或经他同意）执行，命令见文末附录。这是他的仓库，不该由别人代改历史。

**在他改完之前**，两个选择：要么暂时只放 fork 的链接（`github.com/longmaolab/irontide`），要么就接受邮箱可见。不要在他不知情的情况下 force push 他的仓库。

### 顺手把源头堵住

在孩子的 GitHub 账号里打开 **Settings → Emails**，勾上：

- ☑ **Keep my email addresses private**
- ☑ **Block command line pushes that expose my email**

第二项特别重要——不勾的话，以后从命令行 push 会再次把真实邮箱写进新的提交，等于白改一次。

### 3. GitHub 账号资料自查

打开 https://github.com/VideoGameTips 和 https://github.com/longmaolab，检查：

- [ ] Settings → Public profile 的 **Bio / Company / Location** 里没有年龄、城市、学校（Name 放名字没问题）
- [ ] 头像不是真人照片
- [ ] 其他公开仓库、Star 列表、Gist 里没有带出学校、城市或私人邮箱（学校作业、带完整个人信息的文档等）
- [ ] Settings → Emails 勾上 **Keep my email addresses private** 和 **Block command line pushes that expose my email**（防止以后再泄露）

### 4. 域名 WHOIS

```bash
whois boobank.com | grep -i "registrant\|admin\|email\|phone" | head
```

确认注册商的隐私保护是开着的。推广会把 `game.boobank.com` 推到很多人面前，其中有人会顺手查 WHOIS。

### 5. 发行包再确认

部署并重新生成 zip 之后：

```bash
cd promo/builds && unzip -p irontide-itch.zip index.html | grep -ci "gmail\|@qinfund"
unzip -p irontide-portal-singleplayer.zip index.html | grep -ci "gmail\|@qinfund"
```

两条都必须是 `0`。上传到 itch.io / CrazyGames / Newgrounds 的包是会被永久保存的，传上去再想撤回就晚了。

---

## 发帖时的持续纪律

- 所有平台账号由**家长**注册、家长发言。孩子不注册 Reddit / HN / Discord / Product Hunt（这些平台本身也要求 13+ 或成年）。
- 提到孩子可以用名字或 GitHub ID **VideoGameTips**（家里同意公开名字）。但**不要写具体年龄**——"我 11 岁的儿子"比"我家孩子"更容易传播，也把一个精确的身份坐标永久留在了公网上。名字 + 年龄 + 城市这个组合才是真正危险的那个，任何两项都别同时出现。
- 不发孩子的照片、录音、视频出镜。游戏画面录屏 + 家长旁白（或纯无人声）是安全的做法。
- 陌生人私信问"孩子多大""在哪上学""能不能加个联系方式"——**一律不回**，不管对方看起来多友善。
- 评论区由家长先看一遍再转述给孩子。这既是情绪保护，也能在有人开始打探身份时第一时间发现。


---

## 附录：重写提交历史里的邮箱（保留名字）

在仓库目录下执行。**会改变所有 commit 哈希**，需要 force push。

```bash
brew install git-filter-repo        # 或 pip install git-filter-repo

cat > /tmp/irontide.mailmap <<'EOF'
Andy Li <videogametips@users.noreply.github.com> <zianandyli@gmail.com>
VideoGameTips <videogametips@users.noreply.github.com> <zianandyli@gmail.com>
EOF

git filter-repo --mailmap /tmp/irontide.mailmap --force
git push --force origin main
```

作者名 `Andy Li` / `VideoGameTips` 原样保留，只有邮箱被换成 GitHub 的 noreply 地址。

验证：

```bash
git log --format='%an <%ae>' | sort -u
```

不应再出现 `@gmail.com`。

> 注意：`filter-repo` 跑完会把 `origin` remote 删掉（它的安全设计，防止误推）。上面的 `git push` 之前如果报 "no such remote"，先 `git remote add origin git@github.com:<owner>/irontide.git`。
