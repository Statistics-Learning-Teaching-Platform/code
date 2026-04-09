import type { DOMSource } from '@cycle/dom';
import xs, { Stream } from 'xstream';
import throttle from 'xstream/extra/throttle';
import { $el } from '../../_utils/dom';
import type {
  RegressionChartProps,
  Actions,
  Point,
  PointerCoordinates,
  PointHoverAction,
} from './types';
import { DEFAULT_MARGINS } from '../../d3/regression';

export function intent(sources: {
  DOM: DOMSource;
  props: Stream<RegressionChartProps>;
}): Actions {
  // (margins are available via props; no local snapshot required)

  // ==================== SVG pointer events (for line drawing) ====================
  const pointerDown$: Stream<PointerCoordinates> = $el(sources.DOM, 'svg')
    .events('pointerdown')
    .map((ev: Event) => {
      const pointerEvent = ev as PointerEvent;
      return {
        x: pointerEvent.offsetX - DEFAULT_MARGINS.left,
        y: pointerEvent.offsetY - DEFAULT_MARGINS.top,
      };
    });

  const pointerMove$: Stream<PointerCoordinates> = $el(sources.DOM, 'svg')
    .events('pointermove')
    .map((ev: Event) => {
      const pointerEvent = ev as PointerEvent;
      return {
        x: pointerEvent.offsetX - DEFAULT_MARGINS.left,
        y: pointerEvent.offsetY - DEFAULT_MARGINS.top,
      };
    })
    .compose(throttle(16)); // ~60fps

  const pointerUp$: Stream<PointerCoordinates> = $el(sources.DOM, 'svg')
    .events('pointerup')
    .map((ev: Event) => {
      const pointerEvent = ev as PointerEvent;
      return {
        x: pointerEvent.offsetX - DEFAULT_MARGINS.left,
        y: pointerEvent.offsetY - DEFAULT_MARGINS.top,
      };
    });

  // ==================== Point hover events (NEW) ====================
  // Hover enter on data points
  const pointHoverEnter$: Stream<PointHoverAction> = $el(
    sources.DOM,
    '.data-point'
  )
    .events('mouseenter')
    .map((ev: Event) => {
      const mouseEvent = ev as MouseEvent;
      // Extract point data from the element's data attributes
      const pointData = (mouseEvent.target as HTMLElement).dataset;
      const point: Point = {
        x: parseFloat(pointData.x || '0'),
        y: parseFloat(pointData.y || '0'),
      };
      return {
        point,
        event: {
          offsetX: mouseEvent.offsetX,
          offsetY: mouseEvent.offsetY,
          target: mouseEvent.target,
        },
      };
    });

  // Hover leave on data points
  const pointHoverLeave$: Stream<PointHoverAction> = $el(
    sources.DOM,
    '.data-point'
  )
    .events('mouseleave')
    .map((ev: Event) => {
      const mouseEvent = ev as MouseEvent;
      return {
        point: null,
        event: {
          offsetX: mouseEvent.offsetX,
          offsetY: mouseEvent.offsetY,
          target: mouseEvent.target,
        },
      };
    });

  // Combine hover enter/leave into single stream
  // Provide a precise type for the merged hover stream so downstream code has a
  // Stream<PointHoverAction>-compatible type. We use a type assertion here to
  // keep the runtime behavior unchanged while satisfying the compiler.
  const pointHover$: Stream<PointHoverAction> = xs.merge(
    pointHoverEnter$,
    pointHoverLeave$
  );

  // ==================== Config ====================
  const config$ = sources.props;

  // ==================== Clear signal ====================
  const clearSignal$ = sources.props
    .map((props) => props.clearLineSignal)
    .filter((signal) => signal !== undefined)
    .map((signal) => signal!)
    .flatten()
    .startWith(null);

  return {
    pointerDown$,
    pointerMove$,
    pointerUp$,
    pointHover$,
    config$,
    clearSignal$,
  };
}
