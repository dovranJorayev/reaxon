import mobx from 'mobx';
import { expect, describe } from 'vitest';
import { NO_SUBSCRIPTION_WARNING, resource } from './resource';
import { itObserve } from './tools';

/**
 * @description Tests for the resource function
 * DISCLAIMER: All tests cases are copied from the mobx-utils library, but adapted to internal use cases.
 * https://github.com/mobxjs/mobx-utils/blob/master/test/from-resource.js
 */

const it = itObserve;
const test = itObserve;
mobx.configure({ enforceActions: 'observed' });

class Record {
  data: { name: string };
  subscriptions: Array<() => void>;

  constructor(name: string) {
    this.data = { name: name };
    this.subscriptions = [];
  }

  updateName(newName: string) {
    this.data.name = newName;
    this.subscriptions.forEach(f => f());
  }

  subscribe(cb: () => void) {
    this.subscriptions.push(cb);
    return () => {
      const idx = this.subscriptions.indexOf(cb);
      if (idx !== -1) {
        this.subscriptions.splice(idx, 1);
      }
    };
  }
}

const createObservable = (
  record: Record,
  { suppressWarning = false }: { suppressWarning?: boolean } = {}
) => {
  let subscription: (() => void) | undefined;
  return resource<{ name: string }>(
    sink => {
      sink(record.data);
      subscription = record.subscribe(() => {
        sink(record.data);
      });
    },
    () => subscription?.(),
    undefined,
    { suppressWarning }
  );
};

describe('resource', () => {
  test('basics [original repo]', async () => {
    const base = console.warn;
    const warn: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.warn = (msg: any) => warn.push(msg);

    const me = new Record('michel');
    const me$ = createObservable(me);
    expect(me.subscriptions.length).toBe(0);

    let currentName: string | undefined;
    let calcs = 0;
    let disposer = mobx.autorun(() => {
      calcs++;
      currentName = me$.current()?.name;
    });

    expect(me.subscriptions.length).toBe(1);
    expect(currentName).toBe('michel');
    me.updateName('veria');
    expect(currentName).toBe('veria');
    me.updateName('elise');
    expect(currentName).toBe('elise');
    expect(calcs).toBe(3);

    disposer();
    expect(me.subscriptions.length).toBe(0);

    me.updateName('noa');
    expect(currentName).toBe('elise');
    expect(calcs).toBe(3);

    // test warning
    expect(me$.current()?.name).toBe('noa'); // happens to be visible through the data reference, but no autorun tragger
    expect(warn).toEqual([NO_SUBSCRIPTION_WARNING]);

    // resubscribe
    disposer = mobx.autorun(() => {
      calcs++;
      currentName = me$.current()?.name;
    });

    expect(currentName).toBe('noa');
    expect(calcs).toBe(4);

    expect(me.subscriptions.length).toBe(1);
    me.updateName('jan');
    expect(calcs).toBe(5);

    me$.dispose();
    expect(me.subscriptions.length).toBe(0);
    expect(() => me$.current()).toThrow();

    me.updateName('john');
    expect(calcs).toBe(5);
    expect(currentName).toBe('jan');

    disposer(); // autorun

    expect(warn.length).toBe(1);
    console.warn = base;
  });

  test('from computed, #32', () => {
    const you = new Record('You');
    const you$ = createObservable(you);

    const computedName = mobx.computed(() => you$.current()?.name.toUpperCase());
    let name: string | undefined;
    const d = mobx.autorun(() => (name = computedName.get()));
    expect(name).toBe('YOU');
    you.updateName('Me');
    expect(name).toBe('ME');
    d();
    you.updateName('Hi');
    expect(name).toBe('ME');
  });

  test('initial subscription and reactivity', ({ observe }) => {
    const me = new Record('michel');
    const me$ = createObservable(me);
    expect(me.subscriptions.length).toBe(0);

    let currentName: string | undefined;
    let calcs = 0;
    observe(() => {
      calcs++;
      currentName = me$.current()?.name;
    });

    expect(me.subscriptions.length).toBe(1);
    expect(currentName).toBe('michel');
    me.updateName('veria');
    expect(currentName).toBe('veria');
    me.updateName('elise');
    expect(currentName).toBe('elise');
    expect(calcs).toBe(3);
  });

  test('unsubscription on autorun disposal', ({ observe }) => {
    const me = new Record('michel');
    const me$ = createObservable(me);

    observe(() => {
      me$.current();
    });

    expect(me.subscriptions.length).toBe(1);
    observe.purge();
    expect(me.subscriptions.length).toBe(0);
  });

  test('if no initial value is provided & no subscription is made, the current value is undefined', () => {
    const me = new Record('michel');
    const me$ = createObservable(me);
    me.updateName('noa');
    me.updateName('john');

    // Trigger warning
    expect(me$.current()?.name).toBeUndefined();
  });

  test('warning on access outside reaction if suppressWarning is not passed', () => {
    const base = console.warn;
    const warn: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.warn = (msg: any) => warn.push(msg);

    const me = new Record('michel');
    const me$ = createObservable(me);
    me.updateName('noa');

    // Trigger warning
    expect(me$.current()?.name).toBe(undefined);
    expect(warn).toEqual([NO_SUBSCRIPTION_WARNING]);

    console.warn = base;
  });

  test('warning on access outside reaction if suppressWarning is false', () => {
    const base = console.warn;
    const warn: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.warn = (msg: any) => warn.push(msg);

    const me = new Record('michel');
    const me$ = createObservable(me, { suppressWarning: false });
    me.updateName('noa');

    // Trigger warning
    expect(me$.current()?.name).toBe(undefined);
    expect(warn).toEqual([NO_SUBSCRIPTION_WARNING]);

    console.warn = base;
  });

  test('NO warning on access outside reaction if suppressWarning is true', () => {
    const base = console.warn;
    const warn: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.warn = (msg: any) => warn.push(msg);

    const me = new Record('michel');
    const me$ = createObservable(me, { suppressWarning: true });
    me.updateName('noa');

    // Trigger warning
    expect(me$.current()?.name).toBe(undefined);
    expect(warn).toEqual([]);

    console.warn = base;
  });

  test('resubscription', ({ observe }) => {
    const me = new Record('michel');
    const me$ = createObservable(me);
    let calcs = 0;
    let currentName: string | undefined;

    observe(() => {
      calcs++;
      currentName = me$.current()?.name;
    });
    observe.purge();

    expect(me.subscriptions.length).toBe(0);

    // Resubscribe
    observe(() => {
      calcs++;
      currentName = me$.current()?.name;
    });

    expect(me.subscriptions.length).toBe(1);
    expect(calcs).toBe(2);
    me.updateName('noa');
    expect(currentName).toBe('noa');
    expect(calcs).toBe(3);
  });

  test('resource disposal', ({ observe }) => {
    const me = new Record('michel');
    const me$ = createObservable(me);
    observe(() => {
      me$.current();
    });

    expect(me.subscriptions.length).toBe(1);

    me$.dispose();
    expect(me.subscriptions.length).toBe(0);
    expect(() => me$.current()).toThrow();
  });
});
