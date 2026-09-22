# reaxon

Reactive bindings for the JavaScript ecosystem, published under the
[`@reaxon`](https://www.npmjs.com/org/reaxon) npm scope.

| Package | Description | Source | npm |
| --- | --- | --- | --- |
| `@reaxon/tanstack-query-mobx` | MobX reactive wrappers for TanStack Query observers | [packages/tanstack-query-mobx](https://github.com/dovranJorayev/reaxon/tree/main/packages/tanstack-query-mobx#readme) | [npmjs.com](https://www.npmjs.com/package/@reaxon/tanstack-query-mobx) |
| `@reaxon/hook-form-effector` | Effector bindings for react-hook-form's `createFormControl` | [packages/hook-form-effector](https://github.com/dovranJorayev/reaxon/tree/main/packages/hook-form-effector#readme) | [npmjs.com](https://www.npmjs.com/package/@reaxon/hook-form-effector) |

## Compatibility

Each package versions independently and declares the upstream versions it
supports as `peerDependencies`. CI runs every package's test suite at both
edges of every range (the exact lower bound, and the newest release inside the
range), and a guard test in each package fails if the installed peer ever falls
outside the declared range.

| Package | Peer | Supported |
| --- | --- | --- |
| `@reaxon/tanstack-query-mobx` | `@tanstack/query-core` | `^4` |
| `@reaxon/tanstack-query-mobx` | `mobx` | `^6` |
| `@reaxon/hook-form-effector` | `effector` | `^23` |
| `@reaxon/hook-form-effector` | `react-hook-form` | `^7.55.0` |

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
