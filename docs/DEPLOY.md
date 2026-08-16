# How to put Iron Tide online

**Pushing to GitHub does not put your game online.** Those are two different things, and this
page is about the second one.

When you `git push`, your code goes to GitHub. The server people actually play on
(`sushigamelab.com`) does **not** notice. Somebody has to tell it to go and fetch the new code.
That somebody can now be you.

---

## Quick reference

Once you're set up, deploying is three commands:

```bash
git push                                                        # 1. code to GitHub
ssh irontide-vps '/opt/games/sushigamelab/deploy-irontide.sh'   # 2. server fetches it
curl -s https://sushigamelab.com/irontide/sw.js | grep CACHE    # 3. check it worked
```

Everything below is either first-time setup, or what to do when one of those three goes wrong.

---

## Start here — which bit do you actually need?

Run this one command first. It tells you how much of the setup you still have to do:

```bash
ssh irontide-vps 'echo it works'
```

| What you get back | What it means | Go to |
|---|---|---|
| `it works` | You're completely set up. | **Part 2** |
| `Could not resolve hostname` | Your computer doesn't know the nickname yet. | **1.4** |
| `Permission denied (publickey)` | It found the server but wouldn't let you in. | **Part 3** |
| `command not found: ssh` | Rare. Tell your dad. | — |

Most of the time you'll land on **1.4** — that's a two-minute fix, and it's the only step that
needs anything from your dad.

---

# Part 1 — First-time setup

Do this once per computer. If you get a new laptop, you do it again.

## 1.1 Get the code

```bash
cd ~/projects            # or wherever you keep your projects
git clone https://github.com/VideoGameTips/irontide.git
cd irontide
```

Check it worked:

```bash
git log --oneline -1     # should print the most recent commit
```

## 1.2 Do you have an SSH key?

> **You can probably skip 1.2 and 1.3.** If you have ever successfully logged into the server
> from this computer, your key is already on it and stays there — you don't send it again. Skip
> to **1.4**. Only do 1.2 and 1.3 on a computer you've never logged in from.

An SSH key is how the server knows it's you. It comes in two halves: a **private** half that
never leaves your computer, and a **public** half you give away.

```bash
ls ~/.ssh/id_*
```

If you see something like `id_ed25519` and `id_ed25519.pub`, you already have one — skip to 1.3.

If it says *No such file or directory*, make one:

```bash
ssh-keygen -t ed25519 -C "andy"
```

Press Enter at every question to accept the defaults. When it asks for a passphrase you can press
Enter for none — it's simpler, and it's fine for this.

> ⚠️ **Never send anyone the file without `.pub`.** That's the private half. Sending it is like
> posting your house key to a stranger. The `.pub` one is the safe one to share.

## 1.3 Send your public key to your dad

```bash
cat ~/.ssh/id_ed25519.pub
```

That prints one long line starting with `ssh-ed25519`. Copy the **whole line** and send it to him.
He has to add it to the server — you can't do that step yourself, and that's deliberate.

Wait until he tells you it's done before continuing.

## 1.4 Set up the `irontide-vps` shortcut

`irontide-vps` is a nickname for the server, stored on your own computer so you don't have to
type the address every time. Check whether you already have it:

```bash
ssh -G irontide-vps | head -3
```

**Already set up** — `hostname` is a real address, and `user` is your account on the server:

```
host irontide-vps
user <a real username>
hostname <a real address>
```

**Not set up** — `hostname` just repeats the nickname back at you, and `user` is the name you use
on *your own* computer. Both are SSH shrugging and guessing, which means it has never heard of
this nickname:

```
host irontide-vps
user <your name on this laptop>
hostname irontide-vps
```

To add it, open `~/.ssh/config` (create the file if it doesn't exist) and put in:

```
Host irontide-vps
  HostName <the server address — ask your dad>
  User <your username on the server — ask your dad>
```

**Two things to get right here:**

**The username is yours, not your dad's.** You have your own account on that server, and it's a
different user from the one he logs in with. If you copy his settings exactly, you'll be knocking
on the door with the wrong name and get turned away.

**The real address and username are deliberately not written in this file.** This repository is
public — anyone on the internet can read it. Putting the server's address here would hand every
scanner on the internet a target. Ask for them privately.

## 1.5 Test the connection

```bash
ssh irontide-vps 'echo it works'
```

If it prints `it works`, you're done setting up. If not, jump to **Part 3 — When it goes wrong**.

---

# Part 2 — Every time you deploy

## 2.1 Before you push: two checks

**Run the tests.** They catch things that are easy to miss and hard to find later.

```bash
npm test                 # fast, a few seconds
npx playwright test      # slower, a couple of minutes
```

Both should say everything passed. If something fails, fix it before deploying — a broken game
on the live site is worse than a late one.

**Did you change `index.html`?** Then bump the cache version near the top of `sw.js` — whatever
number is on that line, add one:

```js
const CACHE = 'irontide-v86';   // ← so make it v87
```

If you skip this, people who already played will keep seeing the **old** version, because their
browser saved a copy for offline play. The game will look unchanged to everyone but you, which is
a confusing way to waste an evening.

## 2.2 Push

```bash
git branch --show-current    # must say: main
git status                   # should say "working tree clean" after committing
git add -A
git commit -m "what you changed"
git push
```

**Only `main` goes live.** The server pulls `main` and nothing else. If you've been working on a
branch, that work will not appear on the website no matter how many times you deploy — you have
to merge it into `main` first. Check the branch name before you push; it's the thing most likely
to quietly waste your time.

## 2.3 Deploy

```bash
ssh irontide-vps '/opt/games/sushigamelab/deploy-irontide.sh'
```

Good output — the two codes are the version before and after:

```
irontide       ⬆️  06a8344 → 88ab815
```

Output that means *nothing happened*:

```
irontide       ✓  已是最新 (88ab815)
```

"已是最新" means *already up to date* — the server looked and found nothing new. Nine times out
of ten that's because you forgot `git push`.

## 2.4 Check it actually worked — do not skip this

```bash
curl -s https://sushigamelab.com/irontide/sw.js | grep CACHE
```

That prints the version that's live right now. If you bumped it to `v86` and this says `v85`, the
deploy didn't happen.

Even better, check the actual thing you changed:

```bash
curl -s https://sushigamelab.com/irontide/ | grep -c "some text you just added"
```

`1` or more means your change is live. `0` means it isn't.

**Why this step matters more than it looks:** a deploy can fail *after* the push has already
succeeded. That has happened. When it does, GitHub looks perfectly healthy while the live site is
still running last week's code — and that's the most misleading way this can break, because
everything you'd normally glance at looks fine. The only proof is the live site itself.

---

# Part 3 — When it goes wrong

### `Could not resolve hostname irontide-vps`
The shortcut isn't set up on this computer. Go back to **1.4**.

### `Permission denied (publickey)`
Check these in order — the first is by far the most likely:

1. **Wrong username.** Your config must say *your* user, not your dad's:
   ```bash
   ssh -G irontide-vps | grep '^user '
   ```
   If that prints his username, that's the problem — fix the `User` line in `~/.ssh/config`.
2. **Different computer.** Your key lives on one machine. On any other one, the server has never
   heard of you. Redo **Part 1** there.
3. **Key missing.** `ls ~/.ssh/id_*` — if there's nothing, your key is gone. Make a new one (1.2)
   and send the `.pub` to your dad again.

### `❌ 更新失败` (update failed)
The server couldn't write the files. You have permission for **Iron Tide only** — the other games
on that machine belong to other projects, and trying to touch them shows this. If you see it for
`irontide` itself, something's wrong with the permissions; tell your dad.

### `✓ 已是最新` but your change isn't live
The server looked and found nothing new on `main`. Two possible reasons, in order of likelihood:

1. **You didn't push.**
   ```bash
   git log origin/main..HEAD --oneline
   ```
   Anything that prints there is a commit that exists **only on your computer**. Push it.
2. **You pushed, but to a branch.**
   ```bash
   git branch --show-current
   ```
   If that isn't `main`, the server will never see your work. Merge it into `main` and push that.

### The live site still looks old in your browser
Hard reload with `Cmd+Shift+R`. The game installs a service worker that caches itself for offline
play, so your browser may be showing a stored copy. This is exactly why **2.1** says to bump the
cache version — that's the switch that tells every player's browser to throw the old copy away.

### Something else / you're stuck
Tell your dad what command you ran and paste the **whole** error. "It didn't work" is much harder
to help with than the actual message.

---

# Part 4 — Things worth knowing

## There are two live copies

| Where | How it updates | Notes |
|---|---|---|
| `sushigamelab.com/irontide/` | **you deploy it** (this page) | the main site |
| `videogametips.github.io/irontide/` | **by itself**, a minute or two after you push | GitHub Pages, published straight from `main` |

So after a push, the GitHub Pages copy quietly runs ahead of the main site until somebody
deploys. If the two ever disagree, that's why — and it means seeing your change on the
`github.io` one is **not** proof that you deployed successfully.

## Who can deploy

You and your dad. Either of you can go first — the deploy script is set up so neither of you can
accidentally lock the other one out.

<details>
<summary>If you're curious how</summary>

The script sets `umask 002` before it runs, which makes every file it writes editable by both of
you. Without it, whoever deployed last would own the files with read-only permission for everyone
else, and the other person's next deploy would fail with `❌ 更新失败`. It's two lines, and it's
the whole reason `deploy-irontide.sh` exists instead of just calling the shared update script.
</details>

You can deploy **Iron Tide only**. The other games on that server belong to other projects.

## Handy one-liners

```bash
# what's live right now
curl -s https://sushigamelab.com/irontide/sw.js | grep CACHE

# what the server thinks it has
ssh irontide-vps 'git -C /opt/games/sushigamelab/irontide log --oneline -1'

# what you have locally
git log --oneline -1

# anything of yours not pushed yet?
git log origin/main..HEAD --oneline
```

When all four agree, you're properly deployed.
