# How to put Iron Tide online

**Pushing to GitHub does not put your game online.** Those are two different things, and this
page is about the second one.

When you `git push`, your code goes to GitHub. The server that people actually play on
(`sushigamelab.com`) does **not** notice. Somebody has to tell it to go and fetch the new code.
That somebody can now be you.

---

## The short version

```bash
ssh irontide-vps '/opt/games/sushigamelab/deploy-irontide.sh'
```

That's it. It should print something like:

```
irontide       ⬆️  06a8344 → 88ab815
```

The two codes are the version before and after. If it says `✓ 已是最新` ("already up to date")
instead, that means the server already had your code — usually because you forgot to `git push`
first, or because somebody just deployed it.

---

## Step 0 — check the shortcut exists

`irontide-vps` is a nickname for the server, stored on **your own computer**. If it isn't set up,
none of the commands here will work. Check it:

```bash
ssh -G irontide-vps | head -3
```

**Good** — you'll see a real address and username:

```
host <something>.<something>
hostname <a real address>
user <a real username>
```

**Not set up** — `hostname` just repeats `irontide-vps` back at you:

```
hostname irontide-vps
```

That means SSH has no idea what `irontide-vps` means and will fail with
`Could not resolve hostname`.

### If it isn't set up

Add it to `~/.ssh/config` on your machine. Create the file if it doesn't exist:

```
Host irontide-vps
  HostName <the server address — ask your dad, it is not written down in this repo>
  User <your username on the server>
```

**The real address and username are deliberately not in this file.** This repository is public —
anyone on the internet can read it. Writing the server's address here would be handing every
scanner on the internet a target. Ask for them privately.

Then check it worked:

```bash
ssh irontide-vps 'echo it works'
```

---

## The whole routine, start to finish

```bash
# 1. make sure your work is actually committed and pushed
git status                 # should say "nothing to commit, working tree clean"
git push

# 2. tell the server to fetch it
ssh irontide-vps '/opt/games/sushigamelab/deploy-irontide.sh'

# 3. check it really worked  ← do not skip this
curl -s https://sushigamelab.com/irontide/sw.js | grep CACHE
```

Step 3 matters more than it looks. **A deploy can fail *after* the push succeeds** — that has
already happened once — and when it does, GitHub looks perfectly fine while the live site is
still running last week's code. The only way to know is to look at the live site.

`sw.js` carries a version number that gets bumped every time `index.html` changes, so it is a
quick way to tell which version is live. If you changed the version to `v90` and the live site
says `v89`, the deploy did not happen.

Even better, check the actual thing you changed:

```bash
curl -s https://sushigamelab.com/irontide/ | grep -c "some text you just added"
```

`1` or more means your change is live. `0` means it isn't.

---

## What can go wrong

### `Could not resolve hostname irontide-vps`
The shortcut isn't set up on this computer. Go back to **Step 0**.

### `Permission denied (publickey)`
The server doesn't recognise your key. Either you're on a different computer from the one that
was set up, or your key file is missing. Your dad has to add your key to the server — you can't
do it yourself, and that's on purpose.

### `❌ 更新失败` (update failed)
The server couldn't write the files. You have permission for `irontide` **only** — the other nine
games on that machine are not yours to touch, and trying will show this. If it says this for
`irontide` itself, something is wrong with the permissions; tell your dad.

### It says `✓ 已是最新` but your change isn't live
The server fetched successfully but there was nothing new to fetch. You almost certainly forgot
`git push`. Run `git status` and `git log origin/main..HEAD --oneline` — if that last one prints
anything, those are commits that only exist on your computer.

### The live site still looks old in your browser
Try a hard reload (`Cmd+Shift+R`). The game installs a service worker that caches itself for
offline play, so your browser may be showing you a stored copy. This is also exactly why
`sw.js`'s cache version must be bumped whenever `index.html` changes — see the note at the top
of `sw.js`.

---

## Two places, not one

There are actually **two** live copies of the game:

| Where | Updates how | Notes |
|---|---|---|
| `sushigamelab.com/irontide/` | **you have to deploy it** (this page) | the main site |
| `videogametips.github.io/irontide/` | **by itself**, a minute or so after you push | GitHub Pages, published straight from `main` |

So after a push, the GitHub Pages one will quietly go ahead of the main site until somebody
deploys. If the two ever disagree, that's why.

---

## Who can deploy

You and your dad, and either of you can go first — the deploy script is set up so that neither of
you can accidentally lock the other one out. (If you're curious: it sets `umask 002`, which makes
every file it writes editable by both of you. Without that, whoever deployed last would own the
files and the other person's next deploy would fail.)

You can deploy **Iron Tide only**. The other games on that server belong to other projects.
