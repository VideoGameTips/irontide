# 轻量数据观测 / Lightweight analytics (#40)

**原则:隐私优先。** 不用第三方 SDK,不存任何个人信息,不发 cookie,不生成用户 ID。
观测手段只有一个:VPS 上 Caddy 的访问日志。

## 现状(2026-07-24 调查结果)

- Iron Tide 公开地址:`https://game.boobank.com/irontide/`(Caddy `handle_path /irontide/*` → `/opt/games/irontide` 静态目录)
- 调查时 `/var/log/caddy/access.log` **存在但为 0 字节,从 2025-05-09 起从未写入过**:
  `:80` 站点块没有 `log` 指令,而且文件属主是 `root`,Caddy 以 `caddy` 用户运行根本写不进去。
  换句话说:**上线以来没有任何访问数据,所有优先级判断都是纯猜测。**
- 2026-07-24 已修复:`:80` 块加上 `log` 指令(10 MiB 滚动 × 5 份),`/var/log/caddy` 整目录 chown 给 caddy,重启验证写入正常。

## 怎么看数据(运维手册)

SSH 到 VPS(`ssh root@207.148.98.206`)后:

```bash
# 最近 7 天 irontide 页面命中数(排除静态资源,只算 HTML 入口)
grep '"uri":"/irontide/"' /var/log/caddy/access.log | wc -l

# 粗略独立访客(按 IP 去重;Cloudflare 隧道下取 X-Forwarded-For 首段更准)
grep '/irontide/' /var/log/caddy/access.log \
  | grep -o '"client_ip":"[^"]*"' | sort -u | wc -l

# 各游戏对比
for p in irontide arena-shooter dadaboom; do
  printf '%-14s %s\n' "$p" "$(grep -c "/$p/" /var/log/caddy/access.log)"
done
```

日志是 Caddy 默认的 JSON 行格式,一行一个请求;10 MiB × 5 份约够几个月。

## 事件埋点(navigator.sendBeacon)——暂缓

Issue #40 的第 2 步(tutorial_step / first_death / session_end 三个事件)按原议题约定
**"先看流量,值得再做"**。日志刚开始积累,等有几周真实数据后再评估。
如果将来要做:挂点已经勘察好(见 issue #40 正文),接收端用 Caddy 单独路由 + 追加写
平面文件即可,依旧不建数据库、不存个人信息。

## 推广期怎么看效果(2026-07 起)

推广手册见 `docs/promo/README.md`。每个渠道带来的流量都能从访问日志里分开看,
靠的是 **referer** 字段和 **每渠道一个 UTM 参数**——不需要任何第三方统计。

### 发帖时给链接加上来源标记

除了 itch.io / CrazyGames(它们托管的是自己那份 zip,不走我们的域名),
其余渠道贴链接时都用带参数的地址,例如:

```
https://game.boobank.com/irontide/?from=reddit-webgames
https://game.boobank.com/irontide/?from=hn
https://game.boobank.com/irontide/?from=ph
https://game.boobank.com/irontide/?from=threejs-forum
```

`from=` 这个参数游戏本身不读,只是让日志里能分辨来源。
(注意:游戏**确实**会读一个 query 参数——`?touch=1` / `?touch=0` 可以强制开关触屏控制,
见 `index.html` 的 `TOUCH` 常量。这在渠道反馈里有人说"手机上没有摇杆"时很有用:
让对方开 `https://game.boobank.com/irontide/?touch=1` 试一次就能分清是检测问题还是别的问题。
两个参数可以一起用:`?from=reddit-webgames&touch=1`。)

### 按渠道统计

```bash
# 每个渠道的入口命中数
grep '"uri":"/irontide/?from=' /var/log/caddy/access.log \
  | grep -o 'from=[a-z0-9-]*' | sort | uniq -c | sort -rn

# 没带参数但有 referer 的(别人转发的、搜索来的)
grep '"uri":"/irontide/"' /var/log/caddy/access.log \
  | grep -o '"Referer":\["[^"]*"' | sort | uniq -c | sort -rn | head -20

# 发帖当天的逐小时曲线(判断有没有上首页)
grep '/irontide/' /var/log/caddy/access.log \
  | grep '2026-08-11' | grep -o 'T[0-9][0-9]' | sort | uniq -c
```

### 上大流量渠道之前

Show HN 上首页意味着几小时内几万次访问。发帖**当天早上**先确认:

```bash
ssh root@207.148.98.206 'df -h /; free -m; systemctl is-active caddy'
```

游戏本体是纯静态文件(index.html + vendor),Caddy 扛这个量没问题;
真正的风险是联机 WebSocket 打到同一台机器。发大流量渠道前,
门户版 zip 已经隐藏了联机入口,自家站点则建议在高峰期留意
`systemctl status godot-pvp-game` 之外的连接数。

## 首次访问性能基准(2026-07-24 实测)

`node tools/measure-first-visit.js` 会用 Chrome DevTools 协议模拟不同设备,
冷缓存实测线上站点。这些数字可以直接写进渠道文案(门户方特别在意加载速度):

| 设备档位 | 菜单出现 | 点击到进入战斗 | 传输量 |
|---|---|---|---|
| 桌面(不限速) | 0.52 s | +1.08 s | 435 KB |
| 中端笔记本(CPU ×4 降速) | 0.83 s | +1.46 s | 436 KB |
| 手机档(CPU ×4 + Fast 3G) | 3.27 s | +1.33 s | 434 KB |

对比参照:Poki 对首包的目标是 8 MB 以内,CrazyGames 的硬上限是初始 50 MB——
我们只有 **0.43 MB**,余量极大。这也解释了为什么"点开就能玩"这个卖点站得住:
不是营销话术,是实测。

游戏更新后重跑一次,数字变差(尤其传输量翻倍)说明有大资源被引入,值得查。
