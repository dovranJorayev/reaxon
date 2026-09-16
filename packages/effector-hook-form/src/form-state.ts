import {
  attach,
  createEvent,
  createStore,
  is,
  sample,
  scopeBind,
  type Event,
  type Store,
} from "effector";
import {
  createFormControl,
  type FieldValues,
  type FormState,
} from "react-hook-form";
import { storify } from "./lib";

/** Flattens an intersection so hovers and error messages show one object type. */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

const noop = () => {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFormContext = any;

export type FormControl<
  TFieldValues extends FieldValues = FieldValues,
  TContext = AnyFormContext,
  TTransformedValues = TFieldValues,
> = Prettify<
  ReturnType<
    typeof createFormControl<TFieldValues, TContext, TTransformedValues>
  >
>;

export type FormStateWithValues<
  TFieldValues extends FieldValues = FieldValues,
> = Prettify<{ values: TFieldValues } & Partial<FormState<TFieldValues>>>;

/**
 * Mirror a react-hook-form `createFormControl` instance into an Effector store.
 *
 * The form control itself is a client-only UI controller (held in a
 * `serialize: "ignore"` store). `setup` starts the subscription — fire it under
 * a scope, e.g. on dialog open — and the optional `teardown` stops it. The
 * returned store always holds the latest form state plus current `values`.
 *
 * Form *logic* (fields, validation, submit) stays in the UI via RHF; this store
 * exists so Effector can read derived state such as `isValid`/`isSubmitting`
 * (e.g. to drive a submit button's disabled state) without duplicating logic.
 */
export const formState = <
  TFieldValues extends FieldValues = FieldValues,
  TContext = AnyFormContext,
  TTransformedValues = TFieldValues,
>(config: {
  form:
    | FormControl<TFieldValues, TContext, TTransformedValues>
    | Store<FormControl<TFieldValues, TContext, TTransformedValues>>;
  setup: Event<unknown>;
  teardown?: Event<unknown>;
}) => {
  const $form = storify(config.form, { serialize: "ignore", name: "form" });

  const $unsubscribe = createStore(noop, { serialize: "ignore" });
  const $formState = createStore<FormStateWithValues<TFieldValues>>({
    values: $form.defaultState.getValues() as TFieldValues,
  });

  const updated = createEvent<FormStateWithValues<TFieldValues>>();

  const subscribeFx = attach({
    name: "formSubscribeFx",
    source: $unsubscribe,
    effect: (
      unsubscribe,
      form: FormControl<TFieldValues, TContext, TTransformedValues>,
    ) => {
      const onUpdate = scopeBind(updated, { safe: true });

      unsubscribe();

      // Attach snapshot: a reset that ran BEFORE this subscription attached
      // notified nobody — read the current values so the mirror can never
      // start stale. Values only: the control exposes no derived flags;
      // those arrive with RHF's next real notification.
      queueMicrotask(() => onUpdate({ values: form.getValues() }));

      return form.subscribe({
        // Opt into the slices we mirror — `subscribe` only invokes the callback
        // for formState parts it is told to track (`values` included).
        formState: {
          values: true,
          errors: true,
          isDirty: true,
          isValid: true,
          isValidating: true,
          isSubmitted: true,
          touchedFields: true,
          dirtyFields: true,
        },
        // RHF notifies subscribers SYNCHRONOUSLY, including from <Controller>
        // field registration which runs during React render. Forwarding into
        // effector right there makes every useUnit subscriber setState during
        // another component's render (React error). One microtask defers the
        // mirror out of the render phase; ordering between updates is kept.
        callback: (updates) => queueMicrotask(() => onUpdate(updates)),
      });
    },
  });
  const unsubscribeFx = attach({
    name: "formUnsubscribeFx",
    source: $unsubscribe,
    effect: (unsubscribe) => unsubscribe(),
  });

  sample({ clock: [config.setup, $form], source: $form, target: subscribeFx });
  sample({ clock: subscribeFx.doneData, target: $unsubscribe });
  sample({ clock: updated, target: $formState });

  if (config.teardown) {
    sample({ clock: config.teardown, target: unsubscribeFx });
  }

  return $formState;
};
