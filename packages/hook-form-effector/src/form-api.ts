import { attach, type Store } from "effector";
import type {
  ErrorOption,
  FieldPath,
  FieldValues,
  Path,
  PathValue,
  SetValueConfig,
} from "react-hook-form";
import type { FormControl } from "./form-state";
import { storify } from "./lib";

/**
 * One `formSetApi` write. The name/value pairing is deliberately as loose
 * as RHF's own runtime (the value type is the union over all paths), so
 * callsites that pick the field dynamically stay cast-free.
 */
export type SetValuePayload<Values extends FieldValues> = {
  name: Path<Values>;
  value: PathValue<Values, Path<Values>>;
  options?: SetValueConfig;
};

/*
 * One factory per RHF call models actually make — each returns a single
 * effect over the form control, replacing the per-model
 * `attach({ source: $form, ... })` boilerplate. Granular on purpose: a
 * model declares exactly the effects it uses, under its own names, and
 * two forms in one module never fight over destructure aliases. Extend
 * the set when a new call pattern becomes common.
 */


/**
 * form.reset(emptyValues) — back to the pristine form. The empty values
 * are pinned at creation instead of using a bare form.reset(): RHF's
 * reset(values) REPLACES defaultValues, so after a prefill
 * ([[formPrefillApi]]) a bare reset() would restore the prefilled values,
 * not the pristine form.
 */
export const formResetApi = <Values extends FieldValues>(
  form: FormControl<Values> | Store<FormControl<Values>>,
  emptyValues?: Values,
) =>
  attach({
    name: "formResetFx",
    source: storify(form),
    effect: (form) => form.reset(emptyValues),
  });

/**
 * form.reset(values) with the payload — e.g. an edit prefill. Replaces
 * RHF defaultValues (RHF semantics), which is why formResetApi exists.
 */
export const formPrefillApi = <Values extends FieldValues>(
  form: FormControl<Values> | Store<FormControl<Values>>,
) =>
  attach({
    name: "formPrefillFx",
    source: storify(form),
    effect: (form, values: Values) => form.reset(values),
  });

/** form.setValue(name, value, options) with the payload. */
export const formSetApi = <Values extends FieldValues>(
  form: FormControl<Values> | Store<FormControl<Values>>,
) =>
  attach({
    name: "formSetFx",
    source: storify(form),
    effect: (form, { name, value, options }: SetValuePayload<Values>) =>
      form.setValue(name, value, options),
  });


export type FormFieldError<Values extends FieldValues> = {
  name:
    | "form"
    | "root"
    | `root.${string}`
    | FieldPath<Values>
    | `form.${string}`;
  error: ErrorOption;
  options?: { shouldFocus: boolean };
};


/**
 * setServerErrors bound to the form: attach a server's 422 field map as
 * type:"server" input errors (see server-errors.ts for the semantics).
 */
export const formSetErrorApi = <Values extends FieldValues>(
  form: FormControl<Values> | Store<FormControl<Values>>,
) =>
  attach({
    name: "formServerErrorsFx",
    source: storify(form),
    effect: (form, fields: FormFieldError<Values>[]) => {
      for (const fieldError of fields) {
        form.setError(fieldError.name, fieldError.error, fieldError.options);
      }
    },
  });

