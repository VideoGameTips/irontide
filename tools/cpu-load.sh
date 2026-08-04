#!/bin/zsh
# 造 CPU 负载跑基准，且**漏不出去**。
#
#   tools/cpu-load.sh <占几个核> <硬超时秒> <命令...>
#   tools/cpu-load.sh 8 300 npx playwright test tests/smoke/battle-teardown.spec.js --repeat-each=3
#
# 2026-08-04 的教训：手写 `for i in {1..8}; do (while :; do :; done) & done` 压测，
# 收尾写 `LOADPIDS=$(jobs -p); kill $LOADPIDS 2>/dev/null`。结果 8 个死循环全泄漏，
# 满转 1 小时 49 分，烧掉约 13.8 CPU 小时，最后要人肉 kill -9。三层保护，一层都不能省：

set -u
N=${1:?用法: cpu-load.sh <核数> <硬超时秒> <命令...>}
DEADLINE=${2:?用法: cpu-load.sh <核数> <硬超时秒> <命令...>}
shift 2
[ $# -gt 0 ] || { print -u2 "cpu-load.sh: 没有给要跑的命令"; exit 2; }

pids=()
for _ in {1..$N}; do
  # ① 负载器自己带死线。trap 在 SIGKILL 下不会执行，父进程被 -9（超时/session 结束）时
  #    下面两层全废，只有「自己会到点停」救得回来 —— 当初那 8 个正是 PPID=1 的孤儿。
  #    实测：父进程 kill -9 后负载器 PPID 变 1、继续 99%，到死线自行退出。
  (
    stop=$(( SECONDS + DEADLINE ))
    while (( SECONDS < stop )); do :; done
  ) &
  pids+=($!)
  # ② 逐个记 $!。zsh -c / bash -c 默认关作业控制（set +m），`jobs -p` 是空的，
  #    kill 拿不到参数就报错 —— 而原来那行还写了 2>/dev/null 把报错吞了，于是无声失败。
done

cmd=
trap 'kill "${pids[@]}" ${cmd:-} 2>/dev/null' EXIT INT TERM

print -u2 "cpu-load: ${N} 个负载器已起（死线 ${DEADLINE}s）：${pids[*]}"

# ③ 基准命令必须放到后台再 wait，不能直接前台跑。
#    实测：zsh 阻塞在前台子进程上时**不会**执行 TERM trap，要等子进程结束才补跑 ——
#    「脚本被 TERM 杀掉时 trap 兜底」这个说法只有配上 `& wait` 才成立。
"$@" &
cmd=$!
wait $cmd
