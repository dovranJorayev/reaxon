# reaxon

Reactive bindings for the JavaScript ecosystem, published under the
[`@reaxon`](https://www.npmjs.com/org/reaxon) npm scope.

| Package | Description |
| --- | --- |
| [`@reaxon/mobx-tanstack-query`](packages/mobx-tanstack-query) | MobX reactive wrappers for TanStack Query observers |
| [`@reaxon/effector-hook-form`](packages/effector-hook-form) | Effector bindings for react-hook-form |

## Development

Requirements: Node.js 22.14+ and pnpm 12 (`corepack enable` picks the pinned
version from `package.json#packageManager`).

```sh
pnpm install          # frozen lockfile, 7-day dependency cooldown, no lifecycle scripts
pnpm verify           # typecheck + test + build + publint, same as CI
pnpm test             # vitest across all packages
pnpm build            # vite library builds (ESM + CJS + bundled .d.ts)
```

## Releasing

Releases are driven by [changesets](https://github.com/changesets/changesets):

1. Run `pnpm changeset` in your branch and describe the change.
2. Merge the PR. The `Release` workflow opens a "Version Packages" PR.
3. Merge that PR. After a maintainer approves the `npm-publish` environment,
   the packages are published through npm trusted publishing (OIDC) with
   provenance. No npm token is stored anywhere.

See `docs/reports/` for the supply-chain threat model and the CI credential
setup guide.

## License

MIT
