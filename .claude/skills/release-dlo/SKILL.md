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
  Consequence: any **repo-root-relative git path** (e.g. `git show origin/green:<path>`, `git add <path>`
  run with `-C "$MN_ROOT"`) must be prefixed with **`projects/fullstory/`** — the `opensource/…` and
  `etc/cfg/…` trees live under `$FS_HOME`, not at the repo root.
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
- **conan cog name** for DLO is the action's **display name**, `deploy 'fullstory-data-layer-observer'`
  (NOT the directory name `fullstory-data-layer-observer`). Using the directory name fails at deploy time
  with `Unable to find selected cog … in expanded tarball`. Pass it quoted: `-cog="deploy 'fullstory-data-layer-observer'"`.
- **conancli** (see the `conan-skill`): run from `projects/fullstory`:
  `go run ./tools/conancli/ -env=<env> create -githash=<hash> -cogs="deploy 'fullstory-data-layer-observer'"`
  - staging env = `fs-staging`, production env = `fullstoryapp`. One `create` deploys **both** na1 and eu1 realms.
- **Staging auto-deploys** this cog (deploys show creator `autodeploy` in `history`); once `green` has the
  sync, staging gets it automatically — a manual staging deploy is usually unnecessary (verify instead).
  **Prod is manual** (human deployers in `history`) — Step 9 is a real `conancli create` + approval.
- **sync tool**: `tools/opensource.go sync fullstory-data-layer-observer v<version>` (a self-executing
  Go script, run from `projects/fullstory`). It downloads the **GitHub release tag** into the monorepo,
  so the GitHub release/tag MUST exist before you sync.

Throughout, call the resolved version **`latest-version`** (bare semver, no `v`). Once it's known
(Step 3), derive the **major** into a shell var and use that in the test URLs — do NOT hardcode a literal
like `v4` (it looks runnable but silently breaks on a new major):
```bash
MAJOR="v$(printf '%s' "<latest-version>" | cut -d. -f1)"   # e.g. 4.1.8 -> v4
```

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
TGT_VER=$(git -C "$MN_ROOT" show origin/green:projects/fullstory/opensource/fullstory-data-layer-observer/package.json \
  | node -p "JSON.parse(require('fs').readFileSync(0)).version")
DLO_VER=$(node -p "require('$DLO_REPO/package.json').version")   # from Step 2
```
Compare them with a **proper numeric semver comparison — NOT a string/lexicographic compare** (else
`4.1.10` would sort *before* `4.1.9`, which is wrong; also don't rely on `sort -V`, unavailable on
macOS/BSD `sort`). Compare each dotted component numerically, e.g.:
```bash
CMP=$(node -e 'const a=process.argv[1].split(".").map(Number),b=process.argv[2].split(".").map(Number);
for(let i=0;i<Math.max(a.length,b.length);i++){const x=a[i]||0,y=b[i]||0;if(x!==y){console.log(x>y?"newer":"older");process.exit()}}
console.log("equal")' "$DLO_VER" "$TGT_VER")
echo "DLO $DLO_VER vs target $TGT_VER => DLO is $CMP"
```

- **`older`** → DLO version is behind the released target — an error state. Report it and **exit**.
- **`newer`** (e.g. `4.1.8` vs `4.1.7`) → `latest-version` = the DLO version.
  Skip to Step 4. (Normal case: whoever made changes already bumped the version + changelog.)
- **`equal`** → the target folder was synced from the released tag `v<version>`, so the real
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

## Step 7 — Staging (usually auto-deployed — verify, don't manually deploy)

Staging **auto-deploys** this cog, so once `green` has the sync it typically ships to staging on its own.
**Verify first** rather than deploying manually:
```bash
# Recent staging deploys for the cog (look for a SUCCEEDED autodeploy whose hash includes the sync):
( cd "$FS_HOME" && go run ./tools/conancli/ -env=fs-staging history -cog="deploy 'fullstory-data-layer-observer'" -limit=5 )
# And confirm the CDN serves the new version on both edges (expect HTTP 200):
curl -s -o /dev/null -w "na1 %{http_code}\n" "https://edge.staging.fullstory.com/datalayer/${MAJOR}/v<latest-version>.js"
curl -s -o /dev/null -w "eu1 %{http_code}\n" "https://edge.eu1.staging.fullstory.com/datalayer/${MAJOR}/v<latest-version>.js"
```
If staging already serves `v<latest-version>` on both edges, staging is done — go to Step 8. Only if it
hasn't autodeployed after a reasonable wait, deploy it manually (note the **display-name** cog):
```bash
( cd "$FS_HOME" && git fetch origin -q && go run ./tools/conancli/ -env=fs-staging create \
    -githash="$DEPLOY_HASH" -cogs="deploy 'fullstory-data-layer-observer'" )
```
This deploys both na1 and eu1 realms; surface the Conan URL and wait for it to complete before testing.

## Step 8 — Browser tests against staging

Run the tests from the **standalone `fullstory-data-layer-observer` repo** (`$DLO_REPO`) — NOT the monorepo
`$TARGET`. Make sure the checkout is on the released code: Step 1 left it on `main` (which is at
`v<latest-version>` once the release is out); to be exact, `git -C "$DLO_REPO" checkout v<latest-version>`.
The browser tests exercise the deployed CDN script, so the checkout just needs the released test suite.
```bash
TEST_DIR="$DLO_REPO"   # the standalone fullstory-data-layer-observer repo, at the released version
```

1. **Pin Node 20** (required). This repo fails under the machine's global Node when it's been upgraded
   (e.g. Homebrew bumped it to v26) — the browser tests won't start. Install node@20 once and pin it for
   the repo with direnv (this `.envrc` lives permanently in the standalone repo):
   ```bash
   brew install node@20                                                    # once per machine
   printf 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"\n' > "$TEST_DIR/.envrc"
   ( cd "$TEST_DIR" && direnv allow && node --version )                     # expect v20.x, not v26
   ```
   > In a non-interactive shell direnv won't auto-load; prefix test commands with
   > `direnv exec "$TEST_DIR" …` (or `export PATH="/opt/homebrew/opt/node@20/bin:$PATH"`) so they use node 20.
2. Install deps and browser binaries. **`webkit` must be installed explicitly** for this repo's setup, in
   addition to the general bootstrap (which otherwise may not fetch it):
   ```bash
   ( cd "$TEST_DIR" && npm install && npm run test:browser:bootstrap )
   ( cd "$TEST_DIR" && PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install webkit )
   ```
3. Run the browser tests against both staging edges (uses `$MAJOR` from Orientation — never a hardcoded `v4`):
   ```bash
   ( cd "$TEST_DIR" && PLAYWRIGHT_DLO_SCRIPT_SRC=https://edge.staging.fullstory.com/datalayer/${MAJOR}/latest.js npm run test:browser )
   ( cd "$TEST_DIR" && PLAYWRIGHT_DLO_SCRIPT_SRC=https://edge.eu1.staging.fullstory.com/datalayer/${MAJOR}/latest.js npm run test:browser )
   ```
4. Display both results to the user.

> **If tests still won't start after pinning Node 20:** try adding `--experimental-transform-types` to the
> `test:browser` npm script (a transform-types drift between Node versions).

If tests fail (for real, not the drift issue), stop and report to the user before any prod deploy.

## Step 9 — ⛔ HUMAN GATE: deploy to production

Prod is **manual** (no autodeploy), so this is a real deploy. **The human gate is here, BEFORE you run
`create`** — get the user's explicit go-ahead first, because for this cog `create` starts deploying
immediately (it goes straight to `DEPLOYMENT_STATE_IN_PROGRESS`; there is no separate approval click to
withhold). Only once the user says go, deploy the **same `$DEPLOY_HASH`** (Step 6), noting the
**display-name** cog:
```bash
( cd "$FS_HOME" && git fetch origin -q && go run ./tools/conancli/ -env=fullstoryapp create \
    -githash="$DEPLOY_HASH" -cogs="deploy 'fullstory-data-layer-observer'" )
```
Surface the returned Conan status URL, then poll the deploy to a terminal state (background poll, like
staging) — do NOT run the prod tests until it reports `SUCCEEDED`. If it `FAILED`, stop and show the error.

## Step 10 — Browser tests against production

Repeat Step 8's tests from the **same `$TEST_DIR`** (the standalone repo; node 20 + browsers already set
up), but drop `staging.` from the hosts (`edge.staging.fullstory.com` → `edge.fullstory.com`,
`edge.eu1.staging.fullstory.com` → `edge.eu1.fullstory.com`). Keep the same major:
```bash
( cd "$TEST_DIR" && PLAYWRIGHT_DLO_SCRIPT_SRC=https://edge.fullstory.com/datalayer/${MAJOR}/latest.js npm run test:browser )
( cd "$TEST_DIR" && PLAYWRIGHT_DLO_SCRIPT_SRC=https://edge.eu1.fullstory.com/datalayer/${MAJOR}/latest.js npm run test:browser )
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
