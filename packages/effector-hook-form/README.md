# @reaxon/effector-hook-form

[Effector](https://effector.dev) bindings for
[react-hook-form](https://react-hook-form.com)'s headless `createFormControl`.
Form logic (fields, validation, submit) stays in react-hook-form; this package
lets Effector models read derived form state and drive the control with
effects, scope-safe.

```sh
pnpm add @reaxon/effector-hook-form effector react-hook-form
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
import { formState } from '@reaxon/effector-hook-form';

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
- `formServerErrorsApi(form)` — attach a `{ field: string[] }` server error
  map as `type: "server"` field errors.

Each accepts either a form control or a `Store` holding one.

### `setServerErrors(form, fields)`

The plain function behind `formServerErrorsApi`. Returns how many fields were
attached; `0` means nothing matched and the caller should fall back to a
generic message.

## Peer dependencies

- `effector` `^23`
- `react-hook-form` `^7.79`

## License

MIT
