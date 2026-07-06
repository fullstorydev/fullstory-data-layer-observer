---
name: release-dlo
description: Release and deploy the FullStory Data Layer Observer (DLO). Runs the full pipeline from this repo — version/changelog check, GitHub release, monorepo sync PR, conan deploy to staging, browser tests, prod deploy, and post-deploy monitoring. Has several mandatory human gates (PR merge, prod approval). Invoke from the DLO repo (fullstory-data-layer-observer).
user-invocable: true
---

# Release DLO

Deploy FullStory Data Layer Observer end-to-end. This skill drives a multi-step pipeline that
alternates between automated work and **human gates** — points where you MUST stop and wait for the
user before continuing. Never skip a gate. Never approve a prod deploy on the user's behalf.

## Orientation / key facts

- **DLO repo** (the "latest" source): this repository — `fullstory-data-layer-observer`. Detect its
  root with `git rev-parse --show-toplevel` from the current folder. Version lives in `package.json`.
- **GitHub repo**: `fullstorydev/fullstory-data-layer-observer`. Release tags are `v<version>` (e.g. `v4.1.7`).
- **Target folder** (inside the monorepo): `$FS_HOME/opensource/fullstory-data-layer-observer`. This is
  where the sync writes and where the browser tests run — this skill operates in the `$FS_HOME` checkout
  directly (no separate worktree; see the resolution note below).
- **Monorepo**: `$FS_HOME` is `.../mn/projects/fullstory`; its **git root is one level up** —
  `git -C "$FS_HOME" rev-parse --show-toplevel` (e.g. `/Users/<you>/src/mn`), referred to as `$MN_ROOT`.
- **`opensource.go` and `conancli` resolve paths from the `$FS_HOME` env var, NOT the current directory**
  (`fsio.ProjectPath` reads `$FS_HOME`). So `opensource.go sync` always writes into the `$FS_HOME`
  checkout regardless of where you `cd` — a worktree elsewhere would be ignored. That's why this skill
  switches the `$FS_HOME` checkout itself onto a `green`-based branch (Step 5) and works there.
- **Trunk / branch model differs per repo — do not conflate them:**
  - DLO source repo (`fullstory-data-layer-observer`) → trunk is **`main`**. All Step 1–4 branch/tag/pull
    operations use `main`.
  - Monorepo (`$MN_ROOT` / `$FS_HOME`) → two branches matter, **`green`** and **`master`** (NOT `main`):
    - `green` is the known **build-passing** branch. You cannot PR into it directly. Branch **off**
      `origin/green` for the sync.
    - `master` is the mainline you **PR into**. When a merged commit's build passes, CI **auto-advances
      `green`** to it. So: base the sync branch on `green`, but target the PR at **`master`**.
    - The squash-merge lands on `master`; once its build passes CI advances `green` past it. The deploy
      commit (commit-after-squash) is taken from `origin/green` — so it's inherently build-passing.
- **conan cog name** for DLO: `fullstory-data-layer-observer`.
- **conancli** (see the `conan-skill`): run from `projects/fullstory`:
  `go run ./tools/conancli/ -env=<env> create -githash=<hash> -cogs=fullstory-data-layer-observer`
  - staging env = `fs-staging`, production env = `fullstoryapp`. One `create` deploys **both** na1 and eu1 realms.
- **sync tool**: `tools/opensource.go sync fullstory-data-layer-observer v<version>` (a self-executing
  Go script, run from `projects/fullstory`). It downloads the **GitHub release tag** into the monorepo,
  so the GitHub release/tag MUST exist before you sync.

Throughout, call the resolved version **`latest-version`** (bare semver, no `v`). Derive the **major**
as `v<N>` from it (e.g. `4.1.8` → `v4`); the test URLs and CDN paths use this major.

Set up shell vars once, at the start:
```bash
DLO_REPO="$(git rev-parse --show-toplevel)"        # run from the DLO repo
GH_REPO="fullstorydev/fullstory-data-layer-observer"
TARGET="$FS_HOME/opensource/fullstory-data-layer-observer"
MN_ROOT="$(git -C "$FS_HOME" rev-parse --show-toplevel)"
```

---

## Step 1 — Preflight both repos

**DLO repo:** switch to `main` if not already there, then `git pull` to get up to date. If the working
tree is dirty, stop and ask the user how to proceed.

**Monorepo (`$FS_HOME`):** this skill switches the `$FS_HOME` checkout onto a `green`-based sync branch
in Step 5, so it must be clean first (otherwise the switch would carry or clobber the user's work).
Capture the current branch to restore at the end, and require a clean tree:
```bash
ORIG_MN_BRANCH="$(git -C "$MN_ROOT" rev-parse --abbrev-ref HEAD)"   # remember to restore this at the end
git -C "$MN_ROOT" status --porcelain
```
If `git status --porcelain` prints **anything** (uncommitted or untracked changes), do NOT proceed —
show the user the list and ask how to handle it (stash / commit / abort). Continue only once it's clean.

## Step 2 — Read the current version

Read `version` from the DLO repo `package.json`.

## Step 3 — Compare against the released version

Read the currently-released target version from the monorepo trunk (`origin/green`) directly — NOT from
the `$TARGET` working copy. The `$FS_HOME` checkout is usually parked on some other branch, so its
`opensource/.../package.json` can be stale; reading `origin/green` needs no checkout and is authoritative:
```bash
git -C "$MN_ROOT" fetch origin -q
git -C "$MN_ROOT" show origin/green:opensource/fullstory-data-layer-observer/package.json \
  | node -p "JSON.parse(require('fs').readFileSync(0)).version"
```
Compare that (semver) to the DLO version from Step 2.

- **DLO version is OLDER than target** → this is an error state. Report it and **exit**.
- **DLO version is NEWER than target** (e.g. `4.1.8` vs `4.1.7`) → `latest-version` = the DLO version.
  Skip to Step 4. (Normal case: whoever made changes already bumped the version + changelog.)
- **Versions are EQUAL** → the target folder was synced from the released tag `v<version>`, so the real
  question is whether anything shippable has landed on DLO `main` since that release. Ask git directly —
  this is **authoritative and catches every file** (`src/`, `package.json`, `README.md`,
  `rollup.config.js`, `tsconfig.json`, tests, anything) rather than diffing a hand-picked list of paths
  that can silently miss non-`src/` changes:
  ```bash
  git -C "$DLO_REPO" fetch --tags -q
  git -C "$DLO_REPO" diff --stat "v<version>..HEAD"   # lists changed files; empty output = no changes
  ```
  > Optional cross-check only: `diff -rq "$DLO_REPO" "$TARGET"`. Treat it as advisory — the target holds
  > only the subset the monorepo sync ships, so `Only in $DLO_REPO: …` lines are expected noise. Never
  > gate the release decision on a partial, hand-listed folder diff; use the git-tag diff above.
  - **No changes** (empty diff) → nothing to release. Report "DLO main is unchanged since `v<version>`;
    nothing to do" and **exit**.
  - **Changes present** → code landed without a version bump. Do a **patch** version bump (semver):
    1. Compute `latest-version` = current version with patch incremented
       (e.g. `4.1.7` → `4.1.8`).
    2. `git diff v<previous-version>..HEAD` (previous = the current package.json version's tag) to
       understand what changed.
    3. Write a new `### <latest-version>` entry at the top of the History section in `CHANGELOG.md`
       summarizing the changes (match the existing terse, bullet style). Save this summary text — you'll
       reuse it as the GitHub release notes in Step 4.
    4. Update the `version` field in `package.json` to `latest-version`.
    5. Update the version reference in `README.md` (the `Deployment` section links a versioned URL like
       `https://edge.fullstory.com/datalayer/v4/v<version>.js` — update it to `latest-version`).
    6. **⛔ HUMAN GATE**: Show the user the diff of these three files and the proposed changelog entry.
       These changes must land on DLO `main` (with a `v<latest-version>` tag) before the release. `main`
       is PR-protected (recent history is all squashed PRs), so open a PR for the bump, and **wait** for
       the user to merge it. After merge, `git pull` main so HEAD includes the bump, then continue.
       (If the user confirms direct pushes to main are allowed, you may commit + push directly instead.)

## Step 4 — Ensure a GitHub release exists

Check for an existing release for `latest-version`:
```bash
gh release view "v<latest-version>" -R "$GH_REPO"
```
- If it exists, continue.
- If not, create it, targeting the `main` commit that carries this version:
  ```bash
  gh release create "v<latest-version>" -R "$GH_REPO" --target main \
    --title "v<latest-version>" --notes "<notes>"
  ```
  - `<notes>`: if you authored the changelog entry in Step 3.1.2, use that summary. Otherwise use the
    `### <latest-version>` section already in `CHANGELOG.md`.
  - Creating the release also creates the `v<latest-version>` tag, which the sync tool downloads.

## Step 5 — Create the monorepo sync branch + PR

The sync pulls the just-released tag into the monorepo and updates the conan action config. Because
`opensource.go` writes to `$FS_HOME` regardless of cwd (see Orientation), do this **in the `$FS_HOME`
checkout itself** on a fresh `green`-based branch — no worktree.

1. Switch `$FS_HOME` to a new branch off `origin/green` (the tree is clean, verified in Step 1):
   ```bash
   git -C "$MN_ROOT" fetch origin -q
   git -C "$MN_ROOT" checkout -b "$(whoami)/sync-dlo-v<latest-version>" origin/green
   ```
2. Run the sync (writes into `$FS_HOME`):
   ```bash
   ( cd "$FS_HOME" && tools/opensource.go sync fullstory-data-layer-observer v<latest-version> )
   ```
   This updates `opensource/repos.yaml`, re-downloads source into `opensource/fullstory-data-layer-observer`,
   and updates `etc/cfg/deploy/actions/fullstory-data-layer-observer/action.yaml` (`RELEASE_TAG`).
3. Stage **only the sync's paths** (don't `git add -A` — avoid sweeping in any unrelated untracked files),
   commit, push, and open a PR **against `master`** (you branch off `green` but PR into `master`):
   ```bash
   git -C "$MN_ROOT" add \
     projects/fullstory/opensource/repos.yaml \
     projects/fullstory/opensource/fullstory-data-layer-observer \
     projects/fullstory/etc/cfg/deploy/actions/fullstory-data-layer-observer
   git -C "$MN_ROOT" status --short   # sanity-check: only the DLO sync files are staged
   git -C "$MN_ROOT" commit -m "sync fullstory-data-layer-observer to v<latest-version>"
   git -C "$MN_ROOT" push -u origin "$(whoami)/sync-dlo-v<latest-version>"
   ```
   Then open the PR **against `master`** (NOT `green` — you can't PR into `green`) with a body that states
   it's a sync and includes the changelog. Pull the changelog section for this version straight out of the
   synced `CHANGELOG.md`:
   ```bash
   NOTES=$(awk '/^### <latest-version>$/{f=1;next} /^### /{f=0} f' "$TARGET/CHANGELOG.md")
   ( cd "$FS_HOME" && gh pr create --base master \
       --title "sync fullstory-data-layer-observer to v<latest-version>" \
       --body "$(printf 'Syncs the open-source [\`fullstory-data-layer-observer\`](https://github.com/fullstorydev/fullstory-data-layer-observer) release **v<latest-version>** into the monorepo — updates \`opensource/repos.yaml\`, the deploy \`action.yaml\` \`RELEASE_TAG\`, and the vendored source under \`opensource/fullstory-data-layer-observer\`.\n\n## Changelog (v<latest-version>)\n%s\n' "$NOTES")" )
   ```
   > If a bot (e.g. Cursor) has already populated the PR body by the time you'd set it, **prepend** this
   > content above the existing text instead of overwriting it (fetch `gh pr view --json body`, then
   > `gh pr edit --body`). When creating the PR fresh, just include it from the start as above.
4. Show the user the PR link and prompt them to get it reviewed and merged.

## Step 6 — ⛔ HUMAN GATE: wait for the sync PR to merge, then poll `green` for the deploy commit

STOP. Ask the user to confirm once the PR from Step 5 is merged. Do not proceed until they confirm.

Once merged, the PR is squash-merged into **`master`**, and when its build passes CI advances **`green`**
past it. You deploy the commit **immediately after** the squash commit, taken from **`green`** — NOT the
squash commit itself. (Builds tend to fail *on* the squash commit; taking the next commit on `green` also
guarantees the deploy hash is build-passing.)

1. Get the squash-merge commit from the PR (run from `$FS_HOME` so `gh` targets the monorepo):
   ```bash
   SQUASH=$(cd "$FS_HOME" && gh pr view <pr-number> --json mergeCommit -q .mergeCommit.oid)
   echo "squash commit: $SQUASH"
   ```
2. **Poll `green` until the deploy commit lands — don't make the user watch.** Even after the merge,
   `green` won't include the squash commit until CI builds `master` and advances `green` past it, AND a
   further commit lands after the squash. This routinely takes **well over an hour**. Do NOT sit in the
   foreground or ask the user to keep re-checking — run a background poll that re-fetches and exits once
   the commit-after-squash appears on `green`, so you're re-invoked when it's ready:
   ```bash
   # Run with the Bash tool's run_in_background=true. It re-fetches, checks, sleeps, and exits
   # (printing the deploy hash) only once green has advanced past the squash commit.
   until git -C "$MN_ROOT" fetch origin green -q && \
         H=$(git -C "$MN_ROOT" log --reverse --ancestry-path --format=%H "$SQUASH"..origin/green | head -1) && \
         [ -n "$H" ]; do
     sleep 900   # 15 min between checks
   done
   echo "DEPLOY_HASH=$H"
   ```
   - Launch it in the background (`run_in_background: true`) — a foreground `sleep` is blocked, and the
     background runner re-invokes you when the loop exits. Tell the user you're polling and will notify
     them when the hash is ready (expected >1hr); they don't need to babysit it.
   - Alternatively, self-pace with scheduled re-checks (~15–20 min apart) if a background process isn't
     appropriate for the run context.
   - When it resolves, set `DEPLOY_HASH="$H"`, **notify the user**, and continue.
   - Never fall back to deploying the squash commit itself.

Use `$DEPLOY_HASH` for all deploys going forward (Steps 7 and 9). Confirm it with the user before deploying.

## Step 7 — Deploy to staging (conancli)

Deploy `$DEPLOY_HASH` (from Step 6) to staging using the `conan-skill`. Run conancli from `$FS_HOME` — the
branch you're on doesn't matter, conancli just talks to Conan with the hash. First fetch so the hash
resolves locally:
```bash
( cd "$FS_HOME" && git fetch origin -q && go run ./tools/conancli/ -env=fs-staging create \
    -githash="$DEPLOY_HASH" -cogs=fullstory-data-layer-observer )
```
This deploys both na1 and eu1 realms. Surface the returned Conan deployment URL. The action is `manual`,
so it may await approval — show the URL and wait until the deploy reports complete before testing.
(You may pass `-auto-approve` for staging if the user wants it streamlined; never for prod.)

## Step 8 — Browser tests against staging

Run the tests from `$TARGET` (`$FS_HOME/opensource/fullstory-data-layer-observer`). Because Step 5 left
the `$FS_HOME` checkout **on the sync branch**, this copy holds exactly the content synced from the
release tag — including any new/changed `test/*.spec.ts` — so the tests match what's deployed. (Do NOT
switch `$FS_HOME` back to another branch before testing, or the test suite would go stale.)
```bash
TEST_DIR="$TARGET"   # = $FS_HOME/opensource/fullstory-data-layer-observer, on the sync branch
```

1. Install deps and browser binaries (this folder has no `node_modules`):
   ```bash
   ( cd "$TEST_DIR" && npm install && npm run test:browser:bootstrap )
   ```
2. Run the browser tests against both staging edges. **Replace `v4` with the major of `latest-version`.**
   ```bash
   ( cd "$TEST_DIR" && PLAYWRIGHT_DLO_SCRIPT_SRC=https://edge.staging.fullstory.com/datalayer/v4/latest.js npm run test:browser )
   ( cd "$TEST_DIR" && PLAYWRIGHT_DLO_SCRIPT_SRC=https://edge.eu1.staging.fullstory.com/datalayer/v4/latest.js npm run test:browser )
   ```
3. Display both results to the user.

> **Node version drift (Step 8.1):** The two repos run different Node versions and the tests may fail to
> start. If so, add `--experimental-transform-types` to the `test:browser` npm script you're invoking
> (edit the script command in the target `package.json`, or invoke node with the flag) and re-run.

If tests fail (for real, not the drift issue), stop and report to the user before any prod deploy.

## Step 9 — ⛔ HUMAN GATE: deploy to production

Once staging tests pass, deploy the **same `$DEPLOY_HASH`** (Step 6) to production:
```bash
( cd "$FS_HOME" && go run ./tools/conancli/ -env=fullstoryapp create \
    -githash="$DEPLOY_HASH" -cogs=fullstory-data-layer-observer )
```
Surface the returned Conan **approval URL** to the user. STOP. Do **not** approve on their behalf. Wait
until the user confirms the deploy is live in production before continuing.

## Step 10 — Browser tests against production

Repeat Step 8's tests from the **same `$TEST_DIR`** (still on the sync branch), but drop `staging.` from
the hosts (`edge.staging.fullstory.com` → `edge.fullstory.com`, `edge.eu1.staging.fullstory.com` →
`edge.eu1.fullstory.com`). Keep the same major:
```bash
( cd "$TEST_DIR" && PLAYWRIGHT_DLO_SCRIPT_SRC=https://edge.fullstory.com/datalayer/v4/latest.js npm run test:browser )
( cd "$TEST_DIR" && PLAYWRIGHT_DLO_SCRIPT_SRC=https://edge.eu1.fullstory.com/datalayer/v4/latest.js npm run test:browser )
```
Display the results to the user.

## Step 11 — Monitor

Prompt the user to watch the DLO Grafana dashboard:
https://fullstory.grafana.net/d/-nktqXEnz/data-layer-observer-dlo?orgId=1&from=now-1h&to=now

---

## Notes for the operator (you)

- Use a TaskCreate/TaskUpdate checklist to track the 11 steps; it's a long pipeline with gates.
- The three human gates are **hard stops**: Step 3.1.2 (bump PR merge, only if reached), Step 6 (sync PR
  merge), and Step 9 (prod approval). Never proceed past them without explicit user confirmation.
- Report test output faithfully — if something fails, show it and stop rather than continuing to prod.
- The `$FS_HOME` checkout is left on the sync branch through the tests (Steps 8/10). Once the user
  confirms the release is done, offer to restore their original branch:
  `git -C "$MN_ROOT" checkout "$ORIG_MN_BRANCH"` (from Step 1). Don't switch back before the tests run.
