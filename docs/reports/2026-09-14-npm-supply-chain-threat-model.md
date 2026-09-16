# npm supply-chain threat model for the `@reaxon` packages

Date: 2026-09-14
Scope: the `reaxon` monorepo, the `@reaxon/*` packages it publishes, the GitHub
Actions pipeline that publishes them, and the machines of the maintainers and
consumers.

## 1. Why this document exists

Between September 2025 and September 2026 the npm registry went through the
worst run of supply-chain compromises in its history. The pattern is stable
enough to model:

1. An attacker obtains **one** credential: a maintainer's npm token, an npm or
   GitHub session via phishing, or a token minted inside a misconfigured CI job.
2. They publish a new version of every package that credential can reach. The
   malicious code is in a `preinstall`/`postinstall` script or an injected
   dependency, so it runs on every `install`.
3. The payload harvests every secret on the host (npm and GitHub tokens, cloud
   credentials, SSH keys, CI secrets), then republishes itself with the tokens
   it just stole. That is the "worm" step.
4. Detection typically takes 20 minutes to a few hours; registry removal takes
   hours. Anyone who installed the fresh version in that window is compromised.

A library publisher sits on both sides of this: we can be **the victim whose
packages are weaponised** and we can be **the consumer that installs a
weaponised dependency**. The controls below address both.

## 2. Incident review, 2025-03 to 2026-09

| Date | Incident | Initial access | Execution / propagation | Lesson applied here |
| --- | --- | --- | --- | --- |
| 2025-03-14 | `tj-actions/changed-files` | Compromised bot PAT; release **tags were moved** to a malicious commit | Dumped runner memory to print CI secrets into logs | Pin actions to commit SHAs, never tags |
| 2025-07 | `eslint-config-prettier`, `is`, `num2words` | Phishing (`npmjs.help` fake 2FA reset) | Windows DLL loader / RAT in postinstall | Phishing-resistant 2FA; tokens cannot reset 2FA |
| 2025-08-26 | Nx "s1ngularity" | `pull_request_target` injection in a Nx workflow leaked an npm token | postinstall hunted secrets (using local AI CLIs) and pushed them to public GitHub repos | No `pull_request_target`; no tokens in CI |
| 2025-09-08 | `chalk`, `debug`, `ansi-styles` (18 packages, 2B weekly downloads) | Maintainer phished | Browser crypto-clipper injected into bundles | Cooldown: the malicious versions lived about two hours |
| 2025-09-15 | Shai-Hulud 1.0 (`@ctrl/tinycolor`, about 500 packages) | Stolen npm tokens from earlier waves | postinstall ran TruffleHog, stole npm/GitHub/cloud creds, **republished every reachable package**, dropped a GitHub Actions workflow to exfiltrate secrets | Lifecycle scripts off; tokens revoked; provenance |
| 2025-11-24 | Shai-Hulud 2.0 (700+ packages: Zapier, ENS, PostHog, AsyncAPI, Postman) | Stolen tokens + GitHub PATs | `preinstall` bootstrapped **Bun** to dodge Node monitoring; wiped the home directory if it could not exfiltrate | Egress control in CI; cooldown |
| 2025-12-09 | npm revokes all classic tokens | Registry policy | Write tokens capped at 90 days; `npm login` becomes a 2-hour session | Tokens are now a liability by design |
| 2026-03-31 | `axios@1.14.1` / `0.30.4` | Maintainer account | Injected dependency `plain-crypto-js` pulled a multi-stage RAT | Injected *dependencies* bypass "no scripts" if the dependency has scripts: cooldown + exotic-dep blocking |
| 2026-04-22 | `@bitwarden/cli` / Checkmarx ("Third Coming") | Compromised vendor infrastructure | Credential stealer + self-propagation | Vendor CI is part of your trust boundary |
| 2026-04-29 | Mini Shai-Hulud (SAP `@cap-js/*`) | Maintainer account | 11.7 MB obfuscated stealer in `preinstall` | Same |
| 2026-05-11 | TanStack (84 versions of 42 packages in six minutes) | `pull_request_target` on a fork PR ran `pnpm install` of attacker code, which **poisoned the Actions cache**; the release job restored it, and the payload **read the OIDC token out of the runner process memory** and published directly to npm | Published under a valid trusted-publisher identity | No `pull_request_target`; no cache in the release job; environment approval gate; egress block |
| 2026-05-19 | `@antv` / `atool` (639 versions, 323 packages in one hour) | Stolen maintainer credentials | Six parallel credential collectors | Cooldown makes a one-hour blast radius harmless |
| 2026-06-01 | `@redhat-cloud-services` (32 packages) | Compromised employee GitHub account, review bypassed | "Miasma" stealer; CI pipeline abused | Branch rulesets + CODEOWNERS on `.github/` |
| 2026-07-14 | AsyncAPI generator/specs | Unprotected pre-production branches; malicious commits reached the release pipeline | RAT with IPFS delivery, Ethereum-contract C2, Nostr and DHT fallbacks | Protect every branch a release can start from |
| 2026-07-31 | npm restricts bypass-2FA tokens | Registry policy | Tokens can no longer mint tokens, change maintainers or trusted publishers; direct publish removed around 2027-01 | Trusted publishing is the only durable path |
| 2026-08-04 | `keyv`, `cacheable`, `cache-manager` + 400 packages ("ChainDrop") | GitHub maintainer account takeover | `preinstall` loader downloads Bun; steals GitHub/npm/AWS/K8s/Vault secrets and **GitHub Actions secrets via `toJSON(secrets)`**; persists through editor task files and coding-assistant hook configs; C2 via Ethereum dead drop | Never expose the `secrets` context wholesale; review dotfiles that editors auto-run |
| 2026-09-07 | Dormant Shai-Hulud payload republished after 111 days | Retained stolen tokens | Four packages in one hour | Rotate everything after an incident; stolen tokens do not expire on their own |

Sources are listed in section 7.

## 3. Assets and trust boundaries

| Asset | Compromise means | Owner |
| --- | --- | --- |
| Publish rights to `@reaxon/*` | Every consumer of our packages installs attacker code | npm org owners |
| `dovranJorayev/reaxon` repository (main branch, workflows) | Attacker changes what CI builds and publishes | GitHub repo admins |
| Maintainer GitHub and npm accounts | Both of the above | Each maintainer |
| GitHub Actions runner during `Release` | Holds the OIDC identity that npm trusts | Workflow definition |
| Maintainer laptops | Hold sessions, SSH keys, and every other project's secrets | Each maintainer |
| Consumers' CI and laptops | What we are protecting by publishing clean code | Consumers |

Trust boundaries that matter: fork PR to base repo; dependency code to our
runner; GitHub identity to npm identity (OIDC); local checkout to registry.

## 4. Threat tree and controls

### 4.1 Our packages get published by an attacker

| Attack | Control | Where |
| --- | --- | --- |
| Stolen long-lived npm token | **There is no token.** Publishing uses npm trusted publishing (OIDC). npm package setting "Require 2FA and disallow tokens" makes a token useless even if one existed | `release.yml`, npm package settings (manual) |
| Phished maintainer session publishes from a laptop | Same npm setting blocks local publishes; require non-SMS 2FA (security key or passkey) on npm and GitHub | Manual |
| Attacker edits `release.yml` in a PR | CODEOWNERS on `.github/`, `pnpm-workspace.yaml`, lockfile, `.npmrc`, `package.json`; branch ruleset requires owner review and passing CI | `.github/CODEOWNERS`, rulesets (manual) |
| Fork PR runs with base-repo privileges (`pull_request_target`, Nx and TanStack pattern) | No `pull_request_target` anywhere; `permissions: {}` at workflow level; zizmor fails CI on the dangerous patterns | `ci.yml`, `release.yml` |
| Cache poisoning feeding the release job (TanStack) | No dependency caches in any workflow; cold `pnpm install --frozen-lockfile` every time | `ci.yml`, `release.yml` |
| OIDC token stolen from runner memory by a malicious dependency during `pnpm install` in the release job | Dependency lifecycle scripts never run (`strictDepBuilds`); 7-day cooldown means an attacker needs a week-old undetected package; `id-token: write` exists only in the `publish` job; that job runs behind the `npm-publish` environment with required reviewers; harden-runner egress list restricted to the registry, GitHub and Sigstore (switch to `block` after the first audited run) | `pnpm-workspace.yaml`, `release.yml` |
| Action tag moved to malicious commit (tj-actions) | Every action pinned to a full commit SHA; Dependabot maintains the pins with a 7-day cooldown | Workflows, `dependabot.yml` |
| Attacker publishes from a look-alike workflow | Trusted publisher on npm is bound to `dovranJorayev/reaxon`, `release.yml`, and environment `npm-publish`; a different file or fork cannot mint the identity | npm package settings (manual) |
| Consumers cannot tell a clean release from a poisoned one | Provenance attestation on every publish (automatic with trusted publishing); `SECURITY.md` tells consumers to run `npm audit signatures` | `publishConfig.provenance`, `SECURITY.md` |

### 4.2 We install a weaponised dependency

| Attack | Control | Where |
| --- | --- | --- |
| Fresh malicious version of a direct or transitive dependency | `minimumReleaseAge: 10080` (7 days). Every incident above was removed from the registry within hours | `pnpm-workspace.yaml` |
| Malicious `preinstall`/`postinstall` | `strictDepBuilds: true` with an empty `allowBuilds` list: install fails loudly if any dependency wants to run a script | `pnpm-workspace.yaml` |
| Dependency swapped for a git URL or tarball URL deep in the tree | `blockExoticSubdeps: true` | `pnpm-workspace.yaml` |
| Downgrade to a token-published version after we have seen a provenance-signed one (account takeover publishing from outside CI) | `trustPolicy: no-downgrade` | `pnpm-workspace.yaml` |
| Lockfile tampering in a PR | `--frozen-lockfile` in CI; CODEOWNERS on the lockfile; Dependency Review action fails PRs that add vulnerable or badly licensed packages | `ci.yml`, `CODEOWNERS` |
| Dependabot merges a poisoned bump minutes after publish | Dependabot `cooldown` 7 days (14 for majors); no auto-merge | `dependabot.yml` |
| Floating ranges drift between machines | `save-exact=true`; exact pins in every `package.json` | `.npmrc` |

### 4.3 Repository and account integrity

| Attack | Control |
| --- | --- |
| Force push / history rewrite on `main` | Ruleset: block force pushes and deletions (manual) |
| Commit with a forged author | Ruleset: require signed commits; the version PR is committed through the GitHub API and is GitHub-signed |
| Secrets committed by accident | `.env*` gitignored; GitHub secret scanning with push protection (manual); the `secrets` context is never serialised in workflows |
| Maintainer account takeover | Hardware-key or passkey 2FA on GitHub and npm; no SMS; review `npm token list` and GitHub PATs monthly |

## 5. What must be configured outside the repository

These cannot be expressed in files. Do them once, in this order.

1. **npm**: create the `reaxon` organisation; enforce 2FA for the org.
2. **npm**: bootstrap-publish each package once (see the CI token report), then
   add a trusted publisher per package: owner `dovranJorayev`, repository
   `reaxon`, workflow `release.yml`, environment `npm-publish`. Set
   "Publishing access" to "Require two-factor authentication and disallow
   tokens".
3. **GitHub, Environments**: create `npm-publish` with at least one required
   reviewer and "Prevent self-review" off (a solo maintainer must be able to
   approve their own release). Limit it to the `main` branch.
4. **GitHub, Actions settings**: "Allow GitHub Actions to create and approve
   pull requests" on (needed by the version job); "Require approval for all
   outside collaborators" for fork PRs; enable the policy that requires actions
   to be pinned to a full-length commit SHA.
5. **GitHub, Rulesets on `main`**: require a PR, require the `CI` checks,
   require CODEOWNERS review, require signed commits, block force pushes.
6. **GitHub, Security**: enable Dependabot alerts, secret scanning with push
   protection, and private vulnerability reporting.
7. **Maintainer accounts**: hardware key or passkey as the only second factor
   on GitHub and npm.

## 6. Residual risk and next steps

- **Staged publishing.** npm's `npm stage publish` puts a release in a queue
  that a maintainer approves with 2FA. It is the strongest available control
  against a hijacked pipeline. Changesets does not support it yet
  (changesets/changesets#2025). Until then the `npm-publish` environment gate
  is the human approval step. Revisit when changesets ships `--stage`.
- **Egress blocking.** `release.yml` runs harden-runner in `audit` mode with
  the expected endpoint list. After the first successful release, confirm the
  audit report matches and flip `egress-policy` to `block`.
- **Cooldown trade-off.** A 7-day cooldown also delays security *fixes* by a
  week. For a critical advisory, add the fixed version to
  `minimumReleaseAgeExclude` in a reviewed PR and remove it afterwards.
- **Runner memory.** The TanStack attack showed that any code running in the
  same job as `id-token: write` can steal the OIDC token. The remaining window
  is our own build code and the packages that survived the cooldown. Keeping the
  publish job minimal, script-free, and behind an approval gate is the
  mitigation; full separation (build in one job, publish a pre-built artifact
  in another with no `install` at all) is possible with `changesets/action/pack`
  and is the next hardening step if the dependency tree grows.
- **Sigstore verification for consumers.** Document `npm audit signatures` and
  consider publishing an SBOM per release.

## 7. Sources

- Unit 42, "The npm Threat Landscape: Attack Surface and Mitigations (updated 2026-07-15)": https://unit42.paloaltonetworks.com/monitoring-npm-supply-chain-attacks/
- Unit 42, "Shai-Hulud worm compromises npm ecosystem": https://unit42.paloaltonetworks.com/npm-supply-chain-attack/
- Datadog Security Labs, "The Shai-Hulud 2.0 npm worm": https://securitylabs.datadoghq.com/articles/shai-hulud-2.0-npm-worm/
- CISA alert, axios compromise (2026-04-20): https://www.cisa.gov/news-events/alerts/2026/04/20/supply-chain-compromise-impacts-axios-node-package-manager
- TanStack, "Postmortem: TanStack npm supply-chain compromise": https://tanstack.com/blog/npm-supply-chain-compromise-postmortem
- TanStack, "Hardening TanStack After the npm Compromise": https://tanstack.com/blog/incident-followup
- JFrog, "Shai-Hulud Returns: npm worm hits @antv": https://research.jfrog.com/post/shai-hulud-here-we-go-again-may19/
- Red Hat, RHSB-2026-006: https://access.redhat.com/security/vulnerabilities/RHSB-2026-006
- Datadog Security Labs, "'ChainDrop' worm compromises hundreds of popular npm packages": https://securitylabs.datadoghq.com/articles/npm-worm-compromises-popular-npm-packages/
- Wiz, "keyv and cacheable npm package hijacked": https://www.wiz.io/blog/keyv-and-cacheable-npm-supply-chain-attack
- Elastic Security Labs, "Shai-Hulud strikes again: CHAINDROP": https://www.elastic.co/security-labs/shai-hulud-chaindrop-npm-supply-chain
- Aikido, "A Shai-Hulud npm payload came back 111 days later": https://www.aikido.dev/blog/shai-hulud-npm-resurfaces
- GitHub changelog, "npm classic tokens revoked, session-based auth": https://gh.io/all-npm-classic-tokens-revoked
- GitHub changelog, "Staged publishing and new install-time controls for npm" (2026-05-22): https://github.blog/changelog/2026-05-22-staged-publishing-and-new-install-time-controls-for-npm/
- GitHub changelog, "npm install-time security and GAT bypass2fa deprecation" (2026-07-08): https://github.blog/changelog/2026-07-08-npm-install-time-security-and-gat-bypass2fa-deprecation/
- GitHub changelog, "Restricting npm bypass-2FA granular access tokens" (2026-07-31): https://github.blog/changelog/2026-07-31-restricting-npm-bypass-2fa-granular-access-tokens/
- npm docs, "Trusted publishing for npm packages": https://docs.npmjs.com/trusted-publishers/
- npm docs, "Staged publishing": https://docs.npmjs.com/staged-publishing/
- pnpm settings reference (minimumReleaseAge, trustPolicy, strictDepBuilds, blockExoticSubdeps): https://pnpm.io/settings
- zizmor: https://docs.zizmor.sh/
- StepSecurity harden-runner: https://github.com/step-security/harden-runner
