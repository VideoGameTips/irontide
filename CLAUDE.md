# Iron Tide — 给 AI 助手的工作约定

## 这是什么项目

一个浏览器 3D 海战游戏，**主要由孩子（GitHub: VideoGameTips）独立开发**，家长做维护
（bug 修复、中英双语、新手引导、成就、性能）。线上：https://game.boobank.com/irontide/

**评价和改动以鼓励为主。** 批评性分析要框定成"降低新玩家门槛"，不是"这里写得不好"。

## 仓库

**只有一个仓库**：`VideoGameTips/irontide`。
`longmaolab/irontide` 曾是家长的 fork，2026-07-24 内容全部并入本仓库后**已归档（只读）**，
不要再往那里推任何东西。

## Worktree 约定（借鉴 snap 项目）

```
irontide/
├── repo/          主仓库，游戏代码就在这里的 main 上直接改
├── repo-promo/    推广模块 worktree，常驻 claude/promo-idle
├── promo/         物料与构建产物（不进版本库，两个 worktree 都软链到这里）
└── kid-backup.git 改写 git 历史前的完整镜像备份
```

**游戏代码直接在 `repo/` 的 main 上开发**，不要为它另开 worktree——项目就一个
`index.html`，多开 worktree 反而带来两处麻烦：依赖要重装，而且 playwright 配置是
`reuseExistingServer: true`，3000 端口上若有别的 worktree 起的服务，测试测的就是**别人的代码**。
下面这套 worktree/idle 分支约定只适用于 `repo-promo` 的推广工作流。

- **`repo-promo/` 文件夹长期保留，不要删**。依赖装好了，删了下次重装；正在里面跑的 session 也会悬空。
- **idle 分支只用来停靠，绝不在上面开发或提交**。真要干活就开新分支
  `claude/promo-<这次干啥>`，干完合并、切回 idle：
  ```bash
  cd repo-promo && git checkout claude/promo-idle && git fetch origin && git reset --hard origin/main
  ```
- 没活干时不要停在已合并的旧分支上，也不要留成 detached HEAD。

## 推广

执行手册在 [`docs/promo/README.md`](docs/promo/README.md)——那是唯一入口，各渠道分册在
`docs/promo/channels/`，逐字可复制。物料生产工具在 `tools/`，从空目录能跑通全链路。

**发帖前必读** [`docs/promo/channels/00-privacy-gate.md`](docs/promo/channels/00-privacy-gate.md)。
家里定的口径：**名字可以公开**（孩子署名自己的作品是应得的），**年龄、城市、学校、
私人邮箱不可以**——名字+年龄+城市这个组合才真正定位到一个孩子，任何两项别同时出现。
所有平台账号由家长注册和发言。

⚠️ **这个仓库是公开的**：任何文档里都不要写出真实的私人邮箱地址。之前踩过——
git 历史里的邮箱清理干净了，隐私文档却把它明文登记在仓库里，等于白清。

## 改动前

- `npm test`（node:test 单测）和 `npx playwright test`（冒烟）必须过
- 改了文案里的数字/功能/键位，跑 `node tools/verify-copy-claims.js` 核对是否还与游戏一致
- 改了 `index.html` 的 `<head>`，跑 `node tools/verify-og-tags.js`
- 改了 `index.html` 任何地方，按 `sw.js` 顶部的约定 bump 缓存版本号，否则老玩家拿不到新版

## 部署

```bash
ssh irontide-vps 'cd /opt/games/irontide && git fetch origin main && git reset --hard origin/main'
```

`irontide-vps` 是本机 `~/.ssh/config` 里的别名，**真实地址和用户名不写进这个仓库**——
这是公开仓库，写进来等于把 root 登录目标广播给全网扫描器。本机加一段即可：

```
Host irontide-vps
  HostName <VPS 地址，见你自己的运维记录>
  User <用户名>
```

⚠️ 老实说清楚：地址早先已经提交过，**git 历史里还留着**，这次清理只是不再继续暴露。
真正的防护是服务器侧——禁用密码登录只留密钥、装 fail2ban、日常别用 root 而用普通用户加 sudo。

Caddy 的坑：Caddyfile 有 `admin off`，`systemctl reload caddy` 必失败，只能 `restart`。
