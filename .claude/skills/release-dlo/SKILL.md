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
- **Target folder** (inside the monorepo): `$FS_HOME/opensource/fullstory-data-layer-observer`.
- **Monorepo**: `$FS_HOME` is `.../mn/projects/fullstory`, but the **git root is one level up** —
  `git -C "$FS_HOME" rev-parse --show-toplevel` (e.g. `/Users/<you>/src/mn`). Worktrees are worktrees
  of that root, so a worktree at `~/src/worktrees/<x>` contains `projects/fullstory/` inside it.
- **Trunk branches differ per repo — do not conflate them:**
  - DLO source repo (`fullstory-data-layer-observer`) → trunk is **`main`**. All Step 1–4 branch/tag/pull
    operations use `main`.
  - Monorepo (`$MN_ROOT` / `$FS_HOME`) → trunk is **`green`** (NOT `main`). The sync PR branches from,
    targets, and merges into `origin/green`; the post-merge deploy commit is found on `origin/green`.
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

## Step 1 — Sync main

From the DLO repo, switch to `main` if not already there, then `git pull` to get up to date.
If the working tree is dirty, stop and ask the user how to proceed.

## Step 2 — Read the current version

Read `version` from the DLO repo `package.json`.

## Step 3 — Compare against the target folder

Read `version` from `$TARGET/package.json` and compare (semver) to the DLO version.

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

The sync pulls the just-released tag into the monorepo and updates the conan action config.

1. Create a worktree of the monorepo from `origin/green`, named by version, branched as
   `<whoami>/sync-dlo-v<latest-version>`:
   ```bash
   git -C "$MN_ROOT" fetch origin
   git -C "$MN_ROOT" worktree add "$HOME/src/worktrees/v<latest-version>" \
     -b "$(whoami)/sync-dlo-v<latest-version>" origin/green
   ```
2. Run the sync from `projects/fullstory` inside the new worktree:
   ```bash
   WT="$HOME/src/worktrees/v<latest-version>/projects/fullstory"
   ( cd "$WT" && tools/opensource.go sync fullstory-data-layer-observer v<latest-version> )
   ```
   This updates `opensource/repos.yaml`, re-downloads source into `opensource/fullstory-data-layer-observer`,
   and updates `etc/cfg/deploy/actions/fullstory-data-layer-observer/action.yaml` (`RELEASE_TAG`).
3. Commit all changes, push the branch, and open a PR **against `green`** (the monorepo trunk, not `main`):
   ```bash
   ( cd "$WT" && git add -A && git commit -m "sync fullstory-data-layer-observer to v<latest-version>" )
   git -C "$WT" push -u origin "$(whoami)/sync-dlo-v<latest-version>"
   ( cd "$WT" && gh pr create --base green --fill )
   ```
4. Show the user the PR link and prompt them to get it reviewed and merged.

## Step 6 — ⛔ HUMAN GATE: wait for the sync PR to merge, then find the squash commit

STOP. Ask the user to confirm once the PR from Step 5 is merged. Do not proceed until they confirm.

Once merged, the PR is squash-merged into the monorepo trunk, **`green`**. You must deploy the commit
**immediately after** the squash commit — NOT the squash commit itself. (Builds tend to fail *on* the
squash commit; the mechanics aren't important here, just always take the next one.)

1. Get the squash-merge commit from the PR:
   ```bash
   SQUASH=$(gh pr view <pr-number> -R <monorepo> --json mergeCommit -q .mergeCommit.oid)
   echo "squash commit: $SQUASH"
   ```
2. Find the commit immediately after it on `green` (first commit whose parent is the squash commit):
   ```bash
   git -C "$MN_ROOT" fetch origin -q
   DEPLOY_HASH=$(git -C "$MN_ROOT" log --reverse --ancestry-path --format=%H "$SQUASH"..origin/green | head -1)
   echo "deploy hash (commit after squash): $DEPLOY_HASH"
   ```
   If that comes back empty, the squash commit is currently the tip of `green` — wait for the next commit
   to land (or ask the user how to proceed) rather than deploying the squash commit.

Use `$DEPLOY_HASH` for all deploys going forward (Steps 7 and 9). Confirm it with the user before deploying.

## Step 7 — Deploy to staging (conancli)

Deploy `$DEPLOY_HASH` (from Step 6) to staging using the `conan-skill`. Run conancli from any checkout of
the monorepo under `projects/fullstory` — the branch you're on doesn't matter, conancli just talks to
Conan with the hash. First make sure the hash is fetched locally so Conan/git can resolve it:
```bash
( cd "$WT" && git fetch origin -q && go run ./tools/conancli/ -env=fs-staging create \
    -githash="$DEPLOY_HASH" -cogs=fullstory-data-layer-observer )
```
This deploys both na1 and eu1 realms. Surface the returned Conan deployment URL. The action is `manual`,
so it may await approval — show the URL and wait until the deploy reports complete before testing.
(You may pass `-auto-approve` for staging if the user wants it streamlined; never for prod.)

## Step 8 — Browser tests against staging

Run the tests from the **worktree's synced copy**, NOT `$FS_HOME/opensource/...`. This matters: the
`$FS_HOME` checkout is often on some other branch and does **not** contain the sync PR's changes (those
landed on `green` in Step 6), so its `test/*.spec.ts` can be stale — if the release changed the test suite,
you'd run the wrong tests. The worktree's `opensource/fullstory-data-layer-observer` holds exactly the
content synced from the release tag in Step 5, which is what's deployed.
```bash
TEST_DIR="$WT/opensource/fullstory-data-layer-observer"   # $WT from Step 5
```

1. Install deps and browser binaries (the worktree copy has no `node_modules`):
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
( cd "$WT" && go run ./tools/conancli/ -env=fullstoryapp create \
    -githash="$DEPLOY_HASH" -cogs=fullstory-data-layer-observer )
```
Surface the returned Conan **approval URL** to the user. STOP. Do **not** approve on their behalf. Wait
until the user confirms the deploy is live in production before continuing.

## Step 10 — Browser tests against production

Repeat Step 8's tests from the **same `$TEST_DIR`** (the worktree copy), but drop `staging.` from the
hosts (`edge.staging.fullstory.com` → `edge.fullstory.com`, `edge.eu1.staging.fullstory.com` →
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
- Clean up the worktree when done (optional, after the user confirms success):
  `git -C "$MN_ROOT" worktree remove "$HOME/src/worktrees/v<latest-version>"`.
