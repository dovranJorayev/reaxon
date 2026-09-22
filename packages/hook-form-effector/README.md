# @reaxon/hook-form-effector

[Effector](https://effector.dev) bindings for
[react-hook-form](https://react-hook-form.com)'s headless `createFormControl`.
Form logic (fields, validation, submit) stays in react-hook-form; this package
lets Effector models read derived form state and drive the control with
effects, scope-safe.

```sh
pnpm add @reaxon/hook-form-effector effector react-hook-form
```

## API

### `formState({ form, setup, teardown? })`

Mirrors a form control into a store of `{ values, ...FormState }`. `setup`
starts the subscription (fire it under a scope, e.g. on dialog open);
`teardown` stops it. The store is seeded on attach, so a `reset` that ran in
the same wave as `setup` is never missed.

```ts
import { createEvent, fork, allSettled } from 'effector';
import { createFormControl } from 'react-hook-form';
import { formState } from '@reaxon/hook-form-effector';

const form = createFormControl<{ name: string }>({ defaultValues: { name: '' } });
const opened = createEvent();
const $form = formState({ form, setup: opened });

const scope = fork();
await allSettled(opened, { scope });
scope.getState($form).values.name; // ''
```

### Effect factories over the control

- `formResetApi(form, emptyValues)` — `form.reset(emptyValues)`; pins the
  pristine values because RHF's `reset(values)` replaces `defaultValues`.
- `formPrefillApi(form)` — `form.reset(payload)`, e.g. an edit prefill.
- `formSetApi(form)` — `form.setValue(name, value, options)`.
- `formSetErrorApi(form)` — `form.setError(name, error, options)` for each
  entry of a `FormFieldError[]` payload, e.g. to attach a server's field
  errors after a failed submit.

Each accepts either a form control or a `Store` holding one.

## Effector plugin setup (SSR / `fork`)

Every export of this package is a factory: it creates stores, events and
effects on each call. For those units to get stable SIDs, which `fork` and
`serialize` need for SSR and for hydration, list the package in the
`factories` option of the Effector compiler plugin. Client-only apps that
never serialize a scope can skip this.

Babel (`effector/babel-plugin`):

```json
{
  "plugins": [
    ["effector/babel-plugin", { "factories": ["@reaxon/hook-form-effector"] }]
  ]
}
```

SWC (`@effector/swc-plugin`), e.g. in `.swcrc` or Next.js `experimental.swcPlugins`:

```json
["@effector/swc-plugin", { "factories": ["@reaxon/hook-form-effector"] }]
```

Vite with `@vitejs/plugin-react`:

```ts
react({
  babel: {
    plugins: [
      ["effector/babel-plugin", { factories: ["@reaxon/hook-form-effector"] }],
    ],
  },
});
```

## Peer dependencies

- `effector` `^23`
- `react-hook-form` `^7.72` (`createFormControl` exists since 7.55, but the `form.*` error names and the `isSubmitted` subscription flag this package relies on typecheck from 7.72.0)

## License

MIT
