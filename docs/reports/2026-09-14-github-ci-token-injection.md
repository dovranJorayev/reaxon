# How CI gets its credentials: OIDC first, GitHub secrets second

Date: 2026-09-14
Applies to: `.github/workflows/release.yml` in the `reaxon` monorepo.

## 1. The rule

No credential is ever stored in the repository, in a workflow file, in a
lockfile, or in a maintainer's home directory for CI's benefit.

| Tier | Mechanism | Used for |
| --- | --- | --- |
| 1 (default) | **OIDC trusted publishing**: GitHub mints a short-lived identity token for the running job; npm exchanges it for a publish credential that dies with the job | Publishing `@reaxon/*` |
| 2 (fallback) | **GitHub Actions secrets** injected as environment variables on exactly one step | Only if tier 1 is unavailable (self-hosted runners, an outage, a registry without OIDC) |
| 3 (local only) | `.env` (gitignored) or an `npm login` session | The one-time bootstrap publish of a brand-new package |

The `GITHUB_TOKEN` that Actions provides is a fourth, automatic credential; it
is scoped per job by the `permissions` blocks and never needs configuration.

## 2. Tier 1: trusted publishing (what `release.yml` does today)

### 2.1 Bootstrap: a package must exist before npm will trust a workflow

npm attaches trusted publishers to an existing package, so the first version of
each new package is published by a human, once:

```sh
# 1. clean checkout of main, verified locally
pnpm install --frozen-lockfile && pnpm verify

# 2. sign in: since December 2025 this is a 2-hour session, not a stored token
npm login

# 3. publish both packages (the exact versions in package.json, access public)
pnpm -r publish --access public --no-git-checks

# 4. confirm, then let the session expire; nothing is written to ~/.npmrc that
#    outlives it
npm view @reaxon/hook-form-effector version
npm view @reaxon/tanstack-query-mobx version
```

If `npm login` is impossible on the machine, create a granular access token
scoped to the `@reaxon` packages, keep it in `.env` (gitignored), export it for
the single command (`NODE_AUTH_TOKEN=$NPM_TOKEN pnpm -r publish ...`), then
**delete the token on npmjs.com** immediately afterwards.

### 2.2 Configure the trusted publisher on npmjs.com (per package)

Package page, Settings, "Trusted publishing", "GitHub Actions":

| Field | Value |
| --- | --- |
| Organization or user | `dovranJorayev` |
| Repository | `reaxon` |
| Workflow filename | `release.yml` |
| Environment name | `npm-publish` |
| Allowed actions | `npm publish` and `npm stage publish` (choose stage-only once changesets supports staging) |

Then under "Publishing access" choose **"Require two-factor authentication and
disallow tokens"**. From that moment only this workflow, in this environment,
can publish, and no token can.

### 2.3 What the workflow needs

```yaml
jobs:
  publish:
    environment:
      name: npm-publish          # must match the trusted publisher config
    permissions:
      contents: write            # tags + GitHub releases
      id-token: write            # lets the job request an OIDC token
    steps:
      - uses: actions/setup-node@<sha>
        with:
          node-version: 24       # npm >= 11.5.1 is required for OIDC; Node 24 ships it
          registry-url: https://registry.npmjs.org
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: changesets/action/publish@<sha>
        with:
          script: pnpm exec changeset publish
```

`changeset publish` detects pnpm and runs `pnpm publish` for each package;
pnpm performs the OIDC exchange itself. Because the repository and the
packages are public, npm attaches a provenance attestation automatically. No
`NPM_TOKEN`, no `NODE_AUTH_TOKEN`, no `.npmrc` with an `_authToken` line.

Constraints to remember:

- GitHub-hosted runners only; self-hosted runners cannot use trusted publishing.
- The workflow **filename** and the **environment name** are part of the
  identity. Renaming either breaks publishing until the npm side is updated.
- A reusable workflow (`workflow_call`) needs `id-token: write` in both the
  caller and the callee.
- The OIDC token lives in the runner process for the duration of the job. Any
  code running in that job (a dependency with a lifecycle script, a poisoned
  cache) can read it: that is exactly how TanStack was compromised in May 2026.
  Hence no caches, `strictDepBuilds`, the 7-day cooldown, and the environment
  approval gate in front of this job.

### 2.4 Verifying a release

```sh
npm view @reaxon/hook-form-effector --json | jq .dist.attestations
npm audit signatures          # in a consumer project
```

The package page on npmjs.com shows a "Provenance" panel linking the exact
commit and workflow run.

## 3. Tier 2: injecting a token from GitHub secrets

Use only when OIDC cannot work. Everything below keeps the token out of git,
logs, and third-party action inputs.

### 3.1 Create the token (npmjs.com, Access Tokens, "Granular Access Token")

| Setting | Value | Why |
| --- | --- | --- |
| Packages and scopes | Read and write, **only** `@reaxon` | Blast radius |
| Organizations | No access | The token must not manage the org |
| Expiration | 30 days (90 is the hard cap for write tokens) | Forced rotation |
| Bypass 2FA | On | CI has no second factor. Since 2026-07-31 such tokens can no longer create tokens, change maintainers, or edit trusted publishers, and around January 2027 they lose direct `npm publish` and keep only `npm stage publish` |
| IP allow-list | Leave empty (GitHub runner IPs rotate) | |

### 3.2 Store it as an **environment** secret, not a repository secret

Repository settings, Environments, `npm-publish`, "Environment secrets", name
`NPM_TOKEN`. Environment secrets are only exposed to jobs that declare
`environment: npm-publish`, which are the jobs behind the required-reviewer
gate. A repository secret would be visible to every job on `main`.

With the GitHub CLI:

```sh
gh secret set NPM_TOKEN --env npm-publish --repo dovranJorayev/reaxon
# paste the token when prompted; never pass it as a command-line argument
```

### 3.3 Change in `release.yml`

Add the token to **the publish step only**, as an environment variable:

```yaml
      - name: Publish
        uses: changesets/action/publish@<sha>
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
        with:
          script: pnpm exec changeset publish
```

`actions/setup-node` with `registry-url` writes a `.npmrc` that reads the
token from `NODE_AUTH_TOKEN` at publish time, so nothing else changes. Keep
`id-token: write` in place; when both are present npm prefers the token, and
removing the secret later re-enables OIDC without a workflow edit.

Rules that hold for every secret in every workflow:

- Pass secrets with `env:` on the step that needs them, never as `with:` inputs
  to third-party actions (those end up in the action's process arguments and
  logs) and never in `run:` command lines.
- Never write `${{ toJSON(secrets) }}` or iterate over `secrets`. ChainDrop's
  payload harvested Actions secrets from workflows that did exactly this.
- GitHub masks a secret's exact value in logs; it does not mask it base64- or
  URL-encoded. Do not `echo`, `printenv`, or `cat ~/.npmrc` in CI.
- Secrets are not available to workflows triggered by pull requests from forks.
  That is a feature; do not work around it with `pull_request_target`.
- Rotate on a calendar (the token expiry does this for you) and immediately
  after any incident, any maintainer departure, and any suspicious publish.

### 3.4 Same pattern for other services

`GH_TOKEN` for a GitHub App or PAT (only if the default `GITHUB_TOKEN` is not
enough, for example to have the version PR trigger CI), `CODECOV_TOKEN`,
`SENTRY_AUTH_TOKEN`: create with the narrowest scope, store as an environment
secret, inject with `env:` on one step, pin the action that consumes it.

## 4. Tier 3: local development

- Copy `.env.example` to `.env`. Both `.env` and `.env.*` are gitignored;
  `.env.example` is the only one tracked and contains no values.
- Prefer `npm login` sessions over tokens on laptops. If a token must exist,
  keep it in `.env` and load it per command; never in `~/.npmrc`, never in
  `~/.gitconfig` URL rewrites, never in shell history (prefix the command with a
  space or use a prompt).
- `git config --global credential.helper osxkeychain` (macOS) or the GitHub CLI
  (`gh auth login`) stores GitHub credentials in the OS keychain instead of
  plain text.

## 5. Checklist before the first automated release

1. Bootstrap publish done for both packages (section 2.1).
2. Trusted publisher added on both packages; "disallow tokens" enabled (2.2).
3. `npm-publish` environment exists with a required reviewer and is limited
   to `main`.
4. "Allow GitHub Actions to create and approve pull requests" is enabled
   (needed by the version job).
5. Push a changeset, merge, approve the environment when the `publish` job
   asks, then check the provenance panel on npmjs.com.
6. Read the harden-runner audit report for the publish job and switch
   `egress-policy` to `block` if the endpoint list matches.
