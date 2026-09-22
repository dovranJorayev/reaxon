# @reaxon/tanstack-query-mobx

MobX reactive wrappers for [TanStack Query](https://tanstack.com/query) v4
observers. Read query results as MobX computed values: reading a field inside
a reaction subscribes the observer, and disposing the last reaction
unsubscribes it.

```sh
pnpm add @reaxon/tanstack-query-mobx @tanstack/react-query@^4 mobx
```

## API

- `createQuery({ queryClient, getOptions })` — a `QueryObserverResult` whose
  fields are MobX computeds. `getOptions` is tracked, so observable inputs
  re-create the observer options automatically.
- `createInfinityQuery({ queryClient, getOptions })` — same for
  `InfiniteQueryObserver`.
- `queryResource(query, selector?)` — an `IResource`-shaped view over a query.
- `resource(fetcher)` — a standalone lazy, reactive async resource.

```ts
import { QueryClient } from '@tanstack/react-query';
import { autorun } from 'mobx';
import { createQuery } from '@reaxon/tanstack-query-mobx';

const queryClient = new QueryClient();

const user = createQuery({
  queryClient,
  getOptions: () => ({
    queryKey: ['user', 1],
    queryFn: () => fetch('/api/users/1').then((r) => r.json()),
  }),
});

autorun(() => {
  if (user.isSuccess) console.log(user.data.name);
});
```

## Peer dependencies

- `@tanstack/react-query` `^4`
- `mobx` `>=6`
- `mobx-utils` `>=6` (optional, only for `IResource` typing)

## License

MIT
