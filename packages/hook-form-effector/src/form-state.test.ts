import {
  allSettled,
  attach,
  createEvent,
  createStore,
  fork,
  sample,
} from "effector"
import { createFormControl } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"
import { formState } from "./form-state"

describe("formState", () => {
  it("mirrors form values into the store after setup", async () => {
    const form = createFormControl<{ name: string }>({
      defaultValues: { name: "" },
    })
    const setup = createEvent()
    const $formState = formState({ form, setup })

    const scope = fork()
    await allSettled(setup, { scope })
    expect(scope.getState($formState).values.name).toBe("")

    form.setValue("name", "Hello", { shouldDirty: true })
    await vi.waitFor(() => {
      expect(scope.getState($formState).values.name).toBe("Hello")
    })
  })

  /**
   * Pins the seeding contract for `formState`: an effect may reset the form
   * in the same wave that fires `setup`, in ANY order. The subscribe path
   * runs through a `sample` (sampler priority), so a directly-launched reset
   * effect's handler runs BEFORE the subscription attaches and its RHF
   * notification reaches nobody — the mirror stays correct only because the
   * subscription emits a values snapshot on attach. These tests fail if that
   * snapshot is ever removed.
   */
  describe("seeding in the setup wave", () => {
    type Values = { name: string }

    function build(withYield: boolean) {
      const control = createFormControl<Values>({ defaultValues: { name: "" } })
      const $form = createStore(control, { serialize: "ignore" })
      const load = createEvent()
      const opened = createEvent()
      const $mirror = formState({ form: $form, setup: opened })
      const seedFx = attach({
        source: $form,
        effect: async (form) => {
          if (withYield) await Promise.resolve()
          form.reset({ name: "seeded" })
        },
      })
      // Targets launch in array order: `opened` first, then `seedFx`.
      sample({ clock: load, target: [opened, seedFx] })
      return { load, $mirror }
    }

    async function flushMirror() {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }

    it("a microtask-yielding seed reaches the mirror", async () => {
      const { load, $mirror } = build(true)
      const scope = fork()
      await allSettled(load, { scope })
      await flushMirror()
      expect(scope.getState($mirror).values.name).toBe("seeded")
    })

    it("a synchronous seed reaches the mirror via the attach snapshot", async () => {
      const { load, $mirror } = build(false)
      const scope = fork()
      await allSettled(load, { scope })
      await flushMirror()
      expect(scope.getState($mirror).values.name).toBe("seeded")
    })
  })
})
