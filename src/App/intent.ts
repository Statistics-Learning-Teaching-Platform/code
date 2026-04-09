import type { DOMSource } from '@cycle/dom';
import xs, { Stream } from 'xstream';
import throttle from 'xstream/extra/throttle';
import { $el } from '../_utils/dom';
import type { Config } from './types';

export interface PointerEvent {
  x: number;
  y: number;
}

export interface Actions {
  pointerDown$: Stream<PointerEvent>;
  pointerMove$: Stream<PointerEvent>;
  pointerUp$: Stream<PointerEvent>;
  config$: Stream<Config>;
}

export function intent(sources: {
  DOM: DOMSource;
  CONFIG: Stream<Config>;
}): Actions {
  const pointerDown$ = $el(sources.DOM, 'svg')
    .events('pointerdown')
    .map((ev: any) => ({ x: ev.offsetX - 40, y: ev.offsetY - 20 }));

  const pointerMove$ = $el(sources.DOM, 'svg')
    .events('pointermove')
    .map((ev: any) => ({ x: ev.offsetX - 40, y: ev.offsetY - 20 }))
    .compose(throttle(16));

  const pointerUp$ = $el(sources.DOM, 'svg')
    .events('pointerup')
    .map((ev: any) => ({ x: ev.offsetX - 40, y: ev.offsetY - 20 }));

  const config$ = sources.CONFIG.map((config) => ({
    width: config.width,
    height: config.height,
    datasets: config.datasets,
  }));

  return {
    pointerDown$,
    pointerMove$,
    pointerUp$,
    config$,
  };
}
