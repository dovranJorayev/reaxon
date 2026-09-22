# @reaxon/hook-form-effector

## 0.1.1

### Patch Changes

- 3f2672e: Rewrite the README around the package's ideology: react-hook-form owns the form, the binding exists for the model to read it (`formState`) or drive it (effect factories or your own `attach`). Adds a quick start with the control held in a `$form` store, a full API reference, and recipes for custom effects, derived stores, edit-dialog prefill and reset, server validation errors, dependent fields, and handing a UI-created form to the model through a Gate. Documents scope and SSR rules and the compiler plugin `factories` setup.
