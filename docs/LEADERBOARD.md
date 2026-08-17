# 排行榜 — 设计与运维手册

线上：https://sushigamelab.com/irontide/ · 服务端代码 `server-leaderboard/`

`docs/DIRECTION.md` 曾把在线排行榜列进"永不做清单"，2026-08-17 重新评估后落地。
那三条否决理由怎么解决的写在 DIRECTION.md 4.1 节，本文只讲**怎么跑、怎么修、怎么查**。

---

## 1. 五张榜

| 榜 | 排序 | 分组 | 收谁 |
|---|---|---|---|
| 战区速通 | 用时升序 | 31 战区 × 3 难度 = 93 张 | 战役模式的**胜局** |
| 单场战功 | `war_score` 降序 | 3 难度 | **只收战役局** |
| 生涯总分 | `career_score` 降序 | 全局 | 通过增量检查的记录 |
| 精通 | `stars_total*2 + medals*5 + 通关*50` | 全局 | 同上 |
| 本周 | 上面各榜加 `created_at >= 本周一` | — | 不是新榜，是个时间窗参数 |

**为什么单场战功只收战役局**：沙盒试验场和五杀快速战斗跟战役战区不是同一种仗，
混在一张榜上比分数等于拿它们互相排名。这两个模式仍然计入生涯和精通——那两张榜衡量的是人，不是某一仗。

```
war_score = 击沉×10 + 击落×3 + 占岛×15 + 利维坦×50
          + 胜利 100 + 零损舰 50
          + max(0, (par - 用时)/par × 100)        par = 240 + 敌舰数×80
```
难度**不加系数**——榜已经按难度分开了，再加系数只会让人算不明白自己的分是怎么来的。

---

## 2. 反作弊：六层，以及它做不到什么

**先说做不到的**：这是客户端权威的浏览器游戏，**没有任何办法让作弊变得不可能**。
目标是三条能达成的：随手作弊直接失效、认真作弊不值得、真出现了能发现能删。

| 层 | 机制 | 代码位置 |
|---|---|---|
| L0 | **分数只在服务端算**。客户端传的 `war_score` 一律忽略 | `scoring.js: warScore()` |
| L1 | **开局握手 + 服务端计时**。想报 40 秒通关就得真等 40 秒 | `server.js: handleStart/handleFinish` |
| L2 | **一次性 nonce 做 HMAC**。仓库里没有任何常驻密钥——nonce 每场新发、用完即废 | `server.js`, `index.html: lbSign()` |
| L3 | **合理性上限**，全部从游戏自己的刷新常量推导 | `scoring.js: validateRun()` |
| L4 | **生涯分增量检查**，抓存档编辑；按离线时长放宽 | `scoring.js: maxCareerDelta()` |
| L5 | **可疑记录入库但不上榜**；管理页可隐藏单条或影子封禁设备 | `admin.html` |

**上限为什么故意放得很松**：卡太紧会误伤"这孩子今天状态爆棚"的真实成绩。
两种失败里只有一种值得避免——**宁可放过一个作弊的，不可冤枉一个诚实的**。
上限的推导（每 55 秒最多 2 艘增援、每波攻势最多 6 艘）写在 `scoring.js` 的注释里，另乘 1.5 倍安全系数。

**故意不做的**：完整回放校验。游戏是 three.js + 浮点物理 + 大量 `Math.random()`，
不是确定性模拟；改造成可重放的工作量比整个排行榜大一个数量级，还会锁死后续玩法开发。

**和秘籍的关系**：连按 3 次 `\` 仍然给 $10,000，但**在按下的那一刻**就提示本局转为练习局。
练习局**照常提交**、标记 `practice`、不上榜。之所以不是"不提交"——生涯分是累计的，
这一局不传，下一局的增量就变成两局之和，会把**诚实玩家**判成存档编辑。

---

## 3. 两档身份

**匿名是默认，也是一等公民**——不登录能用这里所有的榜，一个功能都不少。

| | 匿名档 | 登录档（Sushi ID） |
|---|---|---|
| 身份 | 本机随机 id + 词表呼号 | `sushi:<账号>`，显示名来自 Sushi ID |
| 门槛 | 零 | 10 位密码 + recovery code |
| 93 张详细榜 | ✅ | ✅ |
| 站级榜（全站九个游戏）| ❌ | ✅，且标 `verified` |
| 换设备 / 清缓存 | 变成新舰长 | 保留 |

**反作弊对两档一视同仁**：它校验的是「这一局」，不是名字上写着谁。榜按成绩排，匿名玩家完全可以压过登录玩家。

🔴 **归属必须服务端查**。浏览器交给本服务的只是一个 Sushi ID runId，而 runId 可以从别人那儿抄；
信客户端等于给「页面自称的人」排名。所以走 `/sushi-api/internal/runs/:id`（服务间 token），
而且结果记在**握手那一刻**，不是从结算包里读——否则打完还能把这局指到别人账号上。

Sushi ID 挂了 / 不认这个 run / 账号被停用 → **一律降级成匿名局**，不丢战果、不挡玩。

## 3.1 隐私

**匿名档存下来的全部东西**：本机随机生成的一个 id、两个词表下标、战斗数字。
没有账号、没有邮箱、没有自由输入的名字。**登录档**另外存账号 id 和显示名；
**登录用的用户名永远不出现在任何榜上**（Sushi ID 的公开名是它自己用词表生成的）。

- **呼号只能是词表笛卡尔积里的一个点**（48 形容词 × 40 名词 = 1920），服务端存下标不存字符串。
  下标越界直接 400。**没有输入框就不可能有脏词，也不可能泄露真名。**
- **IP 不存明文**，只存 `HMAC(ip, IP_SALT)` 前 16 位用于限流，30 天自动清空。
- 🔴 **设备 id 走 `X-IT-Player` 请求头，绝不放进 query string。** Caddy 记录完整 URI，
  放 query 里等于把这个持久标识符和客户端 IP 一起写进 access log——正是"不明文存 IP"要防的那个组合。
  （这个仓库在 pvp 上踩过同类的坑：GET query 传密码，密码进了日志。）
- 首次结算时问一次同意。**答"是"之前一个包都不发**，所以第一场战斗本身不会上传。
- 面板里有「把我从榜上撤下来」，把该设备所有记录置 `hidden`。

---

## 4. 部署

服务 `irontide-leaderboard.service`，监听 `127.0.0.1:7781`，专用系统用户 `irontide-lb`。

```bash
# 数据库（绝不能放在 git checkout 里——部署走 git reset --hard，会连库一起冲掉）
/var/lib/irontide-leaderboard/leaderboard.db
```

环境变量（写在 unit 里）：

| 变量 | 说明 |
|---|---|
| `PORT` / `HOST` | 7781 / 127.0.0.1 |
| `DATA_DIR` | `/var/lib/irontide-leaderboard` |
| `ADMIN_TOKEN` | 管理页口令。**不设则管理页数据接口直接 401** |
| `IP_SALT` | IP 哈希盐。默认值会在启动日志里告警 |
| `WEEK_TZ_OFFSET_MIN` | 本周榜的重置时区，默认 -480（太平洋时间） |
| `SUSHI_API_BASE` | Sushi ID 的地址，默认 `http://127.0.0.1:3030/sushi-api` |
| `SUSHI_SERVICE_TOKEN` | 与 Sushi ID 共享的密钥（= 它的 `SGL_VERIFIER_SECRET`）。**不设 = 登录档整个关闭**，只剩匿名档 |

Caddy 在 sushigamelab.com 站点块里加：

```
handle_path /irontide-api/* {
    reverse_proxy localhost:7781
}
```

⚠️ Caddyfile 有 `admin off`，`systemctl reload caddy` **必失败**，只能 `restart`。
⚠️ 加新的 `log` 指令前必须先 `install -o caddy -g caddy -m 640 /dev/null <日志文件>`，
否则 Caddy 起不来 → **全站四个域名一起挂**。

### 更新服务端代码

服务端代码在游戏仓库里，所以 `deploy-irontide.sh` 拉新代码时会一并更新，
但**跑着的进程还是旧的**，需要重启：

```bash
sudo systemctl restart irontide-leaderboard
```

`deploy-irontide.sh` 已经在检测到 `server-leaderboard/` 有变化时自动做这件事。
`kid` 账号有一条只针对这一个服务的 sudoers 授权，所以 Andy 自己部署也能重启。

### 备份

每天 04:17 由 cron 跑 `sqlite3 .backup`，保留 14 份：

```bash
/usr/local/bin/irontide-lb-backup.sh      # 备份到 /var/backups/irontide-leaderboard/
```

---

## 5. 排查

```bash
# 服务活着吗
curl -s https://sushigamelab.com/irontide-api/health          # {"ok":true,"schema":1}
systemctl status irontide-leaderboard
journalctl -u irontide-leaderboard -n 50 --no-pager

# 榜是空的？先确认有没有记录进来
sudo -u irontide-lb sqlite3 /var/lib/irontide-leaderboard/leaderboard.db \
  "SELECT status, COUNT(*) FROM runs GROUP BY status;"

# 谁被判可疑了、为什么
sudo -u irontide-lb sqlite3 /var/lib/irontide-leaderboard/leaderboard.db \
  "SELECT id, player_id, flags, sunk, duration_s, elapsed_s FROM runs WHERE status!='ok' ORDER BY id DESC LIMIT 20;"
```

管理页：`https://sushigamelab.com/irontide-api/admin`，页面里输 `ADMIN_TOKEN`。
**口令走请求头，不进 URL**，所以不会落进 access log。

### 常见症状

| 症状 | 多半是 |
|---|---|
| 榜一直空着，但游戏正常 | 玩家没点同意，或 Caddy 那段 `handle_path` 没生效。先 curl `/health` |
| 大量记录被判 `flagged` 且 flags 是 `duration-exceeds-wallclock` | 服务器时钟漂了。查 `timedatectl` |
| 大量 `sunk` 超限 | Andy 调过战区数值，但 `campaign-facts.json` 没重新生成。跑 `node tools/extract-campaign.js`（`npm test` 会先替你抓到） |
| 榜显示旧数据 | `sw.js` 的 API 白名单被改坏了。它是 cache-first，`/irontide-api/` 必须直接 return |

---

## 5.1 本地开发

```bash
node tools/dev-proxy.js     # 单一 origin：/irontide/ + /sushi-api/* + /irontide-api/*
```

**必须走代理，不要直连 :7781。** Sushi ID 拒绝跨站 POST、会话 cookie 是 SameSite=lax、
不发 CORS 头——这三条在线上都对，但也意味着「游戏在 :3000、账号在 :3030」这种本地布局
根本跑不通。本地和线上同形，本地才复现得了线上的 bug。

## 6. 改动这块代码时

- **战区数值改了要重新生成**：`node tools/extract-campaign.js`。忘了的话 `npm test` 会红。
- **词表 `js/callsigns.js` 是客户端和服务端共用同一个文件**，别复制成两份——
  下标对不上会让所有人的名字变成别人的。
- 改了 `index.html` 记得 bump `sw.js` 的 `CACHE`。
- 服务端依赖是原生模块（better-sqlite3），VPS 上有完整工具链，`npm install` 能编。
  `git reset --hard` 不删 gitignore 的 `node_modules`，所以装一次就够，除非依赖变了。
