import { createStore, is, Json, Store } from "effector";

export const storify = <V, SerializedState extends Json = Json>(
  value: V | Store<V>,
  config: {
    skipVoid?: boolean;
    name?: string;
    sid?: string;
    updateFilter?: (update: V, current: V) => boolean;
    serialize?:
      | "ignore"
      | {
          write: (state: V) => SerializedState;
          read: (json: SerializedState) => V;
        };
  } = { serialize: "ignore" },
): Store<V> => (is.store(value) ? value : createStore(value, config));
