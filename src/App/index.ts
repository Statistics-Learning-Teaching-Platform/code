import isolate from '@cycle/isolate';
import type { DOMSource, VNode } from '@cycle/dom';
import xs, { Stream } from 'xstream';
import { intent } from './intent';
import { model } from './model';
import { view } from './view';
import type { Config } from './types';

export interface AppSources {
  DOM: DOMSource;
  CONFIG: Stream<Config>;
}

export interface AppSinks {
  DOM: Stream<VNode>;
}

export function App(sources: AppSources): AppSinks {
  const actions = intent(sources);
  const state$ = model(actions);
  const vdom$ = view(state$);

  return {
    DOM: vdom$,
  };
}
