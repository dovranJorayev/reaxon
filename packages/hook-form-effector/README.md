# @reaxon/hook-form-effector

[Effector](https://effector.dev) bindings for
[react-hook-form](https://react-hook-form.com)'s headless `createFormControl`.

```sh
pnpm add @reaxon/hook-form-effector effector react-hook-form
```

## How it thinks

**react-hook-form owns the form.** Fields, validation, dirty tracking,
submission: all of it stays in RHF, exactly as it would without Effector.
This package adds nothing on top of that and deliberately imposes almost no
structure of its own. It exists for two moments only:

1. **The model needs to read the form.** `formState({ form, setup })` mirrors
   the control into a store, so you can derive other stores from it: a submit
   button's `disabled`, a "you have unsaved changes" flag, an autosave trigger.
2. **The model needs to drive the form.** Reset it after a successful save,
   prefill it when an edit dialog opens, push server validation errors back
   onto the fields. Any RHF method is one `attach` away; a few factories cover
   the calls that come up in every project, mostly so the payloads are typed.

The form control is a **mutable client object**. It is created once with
`createFormControl`, handed to the UI through `useForm({ formControl })`, and
handed to the model wrapped in a store. Where you create it is up to you: in
the model (the common case) or in the UI, passed down through a Gate. Every
export accepts either the bare control or a `Store` holding one, so the same
operators work in both layouts.

Prefer the store. A `$form` store is one line, and it is what makes the form
injectable: `fork({ values: [[$form, fakeControl]] })` swaps the control
under every effect and operator in a test, and a Provider can do the same per
scope in the app. Passing the bare control around works, but pins every
operator to that one instance.

## Quick start

The model creates the form, mirrors it, and owns the save effect. The UI
renders it with plain RHF.

```ts
// profile.model.ts
import { combine, createEffect, createEvent, createStore, sample } from "effector";
import { createFormControl } from "react-hook-form";
import { formState, formResetApi } from "@reaxon/hook-form-effector";

type Profile = { name: string; email: string };
const empty: Profile = { name: "", email: "" };

// The control is a mutable client object: keep it out of serialization.
export const $form = createStore(
  createFormControl<Profile>({ defaultValues: empty, mode: "onChange" }),
  { serialize: "ignore" },
);

export const opened = createEvent();
export const closed = createEvent();
export const submitted = createEvent<Profile>();

export const $formState = formState({ form: $form, setup: opened, teardown: closed });
export const $canSubmit = combine($formState, (s) => !!s.isValid && !!s.isDirty);

export const saveProfileFx = createEffect(async (profile: Profile) => {
  /* PUT /profile */
});
const resetFormFx = formResetApi($form, empty);

sample({ clock: submitted, target: saveProfileFx });
sample({ clock: saveProfileFx.done, target: resetFormFx });
```

```tsx
// ProfileForm.tsx
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useUnit } from "effector-react";
import { $form, opened, closed, submitted, $canSubmit } from "./profile.model";

export function ProfileForm() {
  const model = useUnit({
    form: $form,
    canSubmit: $canSubmit,
    onOpen: opened,
    onClose: closed,
    onSubmit: submitted,
  });
  const form = useForm({ formControl: model.form.formControl });

  useEffect(() => {
    model.onOpen();
    return model.onClose;
  }, [model.onOpen, model.onClose]);

  return (
    <form onSubmit={form.handleSubmit(model.onSubmit)}>
      <Controller
        control={form.control}
        name="name"
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <input {...field} aria-invalid={fieldState.invalid} />
        )}
      />
      <Controller
        control={form.control}
        name="email"
        rules={{ required: true, pattern: /.+@.+/ }}
        render={({ field, fieldState }) => (
          <input {...field} type="email" aria-invalid={fieldState.invalid} />
        )}
      />
      <button disabled={!model.canSubmit}>Save</button>
    </form>
  );
}
```

Validation rules live on each `Controller`, submission goes through `handleSubmit`,
and the model never touches a DOM node. It only reads `$formState` and fires
one effect. The UI reads the control through `useUnit($form)` rather than
importing the instance, so under a scoped Provider it gets that scope's form.

## API

### `formState({ form, setup, teardown? })`

Mirrors a form control into `Store<{ values } & Partial<FormState>>`.

- `form`: a control from `createFormControl`, or a `Store` holding one.
- `setup`: an event that starts the subscription. Fire it under a scope, for
  example on mount or on dialog open.
- `teardown`: an optional event that stops it.

The store carries `values` plus these RHF slices: `errors`, `isDirty`,
`isValid`, `isValidating`, `isSubmitted`, `touchedFields`, `dirtyFields`.
Everything except `values` is `undefined` until RHF's first notification, so
derive with defaults: `!!s.isValid`.

Two details worth knowing. The store is seeded with the current `values` on
attach, so a `reset` that ran in the same wave as `setup` is never missed. And
RHF notifies synchronously, sometimes during React render, so updates are
deferred by one microtask before reaching Effector; order is preserved.

### Effect factories

Each returns a single effect bound to the form. Each accepts a control or a
`Store` holding one.

| Factory | Effect params | What it does |
| --- | --- | --- |
| `formResetApi(form, emptyValues?)` | `void` | `form.reset(emptyValues)`, back to the pristine form |
| `formPrefillApi(form)` | `Values` | `form.reset(values)`, e.g. an edit prefill |
| `formSetApi(form)` | `{ name, value, options? }` | `form.setValue(name, value, options)` |
| `formSetErrorApi(form)` | `FormFieldError<Values>[]` | `form.setError(...)` for each entry |

Why `formResetApi` takes the empty values up front: RHF's `reset(values)`
**replaces** `defaultValues`. After a prefill, a bare `reset()` would restore
the prefilled record, not an empty form. Pinning the pristine values at
creation makes "reset" mean the same thing regardless of what came before.

The factories are conveniences, not the boundary of what you can do. See the
first recipe below.

### Types

- `FormControl<Values>`: the return type of `createFormControl<Values>`.
- `FormStateWithValues<Values>`: the state type of the `formState` store.
- `SetValuePayload<Values>`, `FormFieldError<Values>`: effect payloads.

## Recipes

### Call any form method from your own effect

There is no wrapper for `trigger`, `clearErrors`, `getFieldState` or
anything else, because none is needed. `attach` to the `$form` store.

```ts
import { attach } from "effector";

export const validateEmailFx = attach({
  source: $form,
  effect: (form) => form.trigger("email"),
});

export const clearErrorsFx = attach({
  source: $form,
  effect: (form, name?: "name" | "email") => form.clearErrors(name),
});
```

This is also the shape of every factory in this package, which is why they
take `$form` too: in a test, `fork({ values: [[$form, fakeControl]] })` swaps
the control under all of them at once.

### Derived stores: unsaved-changes guard and autosave

`$formState` is an ordinary store. Map it, combine it, sample from it.

```ts
import { combine, createEffect, sample } from "effector";
import { debounce } from "patronum";

export const $hasUnsavedChanges = combine($formState, (s) => !!s.isDirty);

const autosaveFx = createEffect(async (draft: Profile) => {
  /* PUT /profile/draft */
});

sample({
  clock: debounce($formState, 800),
  filter: (s) => !!s.isDirty && !!s.isValid,
  fn: (s) => s.values,
  target: autosaveFx,
});
```

### Edit dialog: prefill on open, reset on close

```ts
import { createEvent, sample } from "effector";
import { formPrefillApi, formResetApi } from "@reaxon/hook-form-effector";

export const editOpened = createEvent<Profile>();
export const editClosed = createEvent();

const prefillFx = formPrefillApi($form);
const resetFx = formResetApi($form, empty);

sample({ clock: editOpened, target: prefillFx });
sample({ clock: editClosed, target: resetFx });

export const $formState = formState({ form: $form, setup: editOpened, teardown: editClosed });
```

`editOpened` both starts the mirror and prefills the form in one wave. The
attach snapshot inside `formState` guarantees the store starts with the
prefilled values, whichever runs first.

### Server validation errors back onto the fields

Map a failed save to field errors and let RHF render them next to the inputs.

```ts
import { sample } from "effector";
import { formSetErrorApi, type FormFieldError } from "@reaxon/hook-form-effector";

const setErrorsFx = formSetErrorApi($form);

type ApiError = { fields?: Record<string, string[]> };

sample({
  clock: saveProfileFx.failData,
  fn: (error): FormFieldError<Profile>[] => {
    const fields = (error as ApiError).fields ?? {};
    return Object.entries(fields).map(([name, messages]) => ({
      name: name as keyof Profile,
      error: { type: "server", message: messages[0] },
    }));
  },
  target: setErrorsFx,
});
```

Names outside the form's fields are typed out at compile time, so a renamed
field breaks the mapping loudly instead of silently dropping an error. For a
message that belongs to the whole form use `name: "root"` or `"root.<key>"`
and read it from `formState.errors.root` in the UI.

### Dependent fields: set one field from the model

```ts
import { combine, sample } from "effector";
import { formSetApi } from "@reaxon/hook-form-effector";

const setFx = formSetApi($form);
const $country = combine($formState, (s) => s.values.country);

// When the user picks a country, snap the currency to that country's default.
sample({
  clock: $country,
  source: $currencyByCountry,
  fn: (byCountry, country) => ({
    name: "currency" as const,
    value: byCountry[country],
    options: { shouldDirty: true },
  }),
  target: setFx,
});
```

### Form created in the UI, handed to the model through a Gate

Sometimes the component owns the form, for instance when a third-party
wrapper insists on calling `useForm` itself. Pass the control up through a
Gate and let the model store it.

```ts
// model.ts
import { combine, createStore, sample } from "effector";
import { createGate } from "effector-react";
import { formState, formResetApi } from "@reaxon/hook-form-effector";
import type { FormControl } from "@reaxon/hook-form-effector";

export const FormGate = createGate<{ form: FormControl<Profile> }>();

export const $form = createStore<FormControl<Profile> | null>(null, { serialize: "ignore" });
sample({ clock: FormGate.open, fn: ({ form }) => form, target: $form });

const $readyForm = combine($form, (form) => form!); // only read after Gate.open
export const $formState = formState({ form: $readyForm, setup: FormGate.open, teardown: FormGate.close });
export const resetFx = formResetApi($readyForm, empty);
```

```tsx
// Component.tsx
import { useMemo } from "react";
import { createFormControl, useForm } from "react-hook-form";
import { useGate } from "effector-react";

export function Component() {
  const control = useMemo(() => createFormControl<Profile>({ defaultValues: empty }), []);
  useGate(FormGate, { form: control });
  const form = useForm({ formControl: control.formControl });
  /* ... */
}
```

`formState` re-subscribes whenever the store it was given changes, so a
remount that creates a fresh control is picked up automatically.

## Scopes and SSR

Everything here is scope-safe: the subscription callback is bound with
`scopeBind`, and all effects are `attach`ed, so `fork` and `allSettled` work as
expected. Two rules follow from the form being a mutable client object:

- Stores that hold a control are created with `serialize: "ignore"`. Do the
  same for your own `$form` stores.
- A control created at module level is one object shared by every scope. For
  SSR or per-request scopes, create it where the scope begins: in an effect
  fired on open, or in the component and handed in through a Gate as above.

### Compiler plugin

Every export of this package is a factory: it creates stores, events and
effects on each call. For those units to get stable SIDs, which `fork` and
`serialize` need for hydration, list the package in the `factories` option of
the Effector compiler plugin. Client-only apps that never serialize a scope
can skip this.

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
- `react-hook-form` `^7.72` (`createFormControl` exists since 7.55, but the
  `root.*` error names and the `isSubmitted` subscription flag this package
  relies on typecheck from 7.72.0)

`effector-react` and `patronum` appear in the recipes but are not required by
the package itself.

## License

MIT
