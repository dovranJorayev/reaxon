# Security policy

## Reporting a vulnerability

Please do not open a public issue for security problems. Use GitHub's private
vulnerability reporting on this repository ("Security" tab, "Report a
vulnerability"). You will get an acknowledgement within 72 hours.

## Supported versions

Only the latest published version of each `@reaxon/*` package receives fixes.

## How releases are protected

- Packages are published exclusively by the `Release` GitHub Actions workflow
  through npm trusted publishing (OIDC). No long-lived npm token exists.
- Every release carries a provenance attestation. Verify with
  `npm audit signatures` after installing.
- Publishing requires approval of the `npm-publish` environment by a maintainer.
- Third-party actions are pinned to commit SHAs and audited by zizmor on every PR.
- Dependencies observe a 7-day cooldown (`minimumReleaseAge`) and dependency
  lifecycle scripts never run (`strictDepBuilds`).

The full threat model lives in `docs/reports/2026-09-14-npm-supply-chain-threat-model.md`.
