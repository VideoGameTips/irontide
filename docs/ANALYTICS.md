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
