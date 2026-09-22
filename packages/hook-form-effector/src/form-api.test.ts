import { allSettled, fork } from "effector"
import { createFormControl } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"
import {
  formPrefillApi,
  formResetApi,
  formSetApi,
} from "./form-api"

type Values = { name: string; active: boolean }
const empty: Values = { name: "", active: false }

const build = () => createFormControl<Values>({ defaultValues: empty })

describe("formPrefillApi", () => {
  it("applies the payload as the new form values", async () => {
    const form = build()
    const prefillFx = formPrefillApi(form)
    const scope = fork()

    await allSettled(prefillFx, {
      scope,
      params: { name: "Loaded", active: true },
    })

    expect(form.getValues()).toEqual({ name: "Loaded", active: true })
  })
})

describe("formResetApi", () => {
  it("restores emptyValues even after a prefill replaced RHF defaults", async () => {
    const form = build()
    const resetFx = formResetApi(form, empty)
    const prefillFx = formPrefillApi(form)
    const scope = fork()

    // RHF's reset(values) replaces defaultValues — the exact reason the
    // empty values are pinned instead of calling a bare reset().
    await allSettled(prefillFx, {
      scope,
      params: { name: "Loaded", active: true },
    })
    await allSettled(resetFx, { scope })

    expect(form.getValues()).toEqual(empty)
  })
})

describe("formSetApi", () => {
  it("passes name, value, and options through to form.setValue", async () => {
    const form = build()
    // The write only persists on registered/mounted fields (the Controller
    // does that in the app), so the operator's contract — the call mapping
    // — is what the bare control can pin.
    const setValue = vi.spyOn(form, "setValue")
    const setFx = formSetApi(form)
    const scope = fork()

    await allSettled(setFx, {
      scope,
      params: { name: "name", value: "Typed", options: { shouldDirty: true } },
    })

    expect(setValue).toHaveBeenCalledWith("name", "Typed", {
      shouldDirty: true,
    })
  })
})

