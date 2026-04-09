import xs, { Stream } from 'xstream';
import * as d3 from 'd3';
import type { Actions, PointerEvent } from './intent';
import type { Point } from './types';

export interface Scales {
  xScale: d3.ScaleLinear<number, number>;
  yScale: d3.ScaleLinear<number, number>;
}

export interface Points {
  start: Point | null;
  end: Point | null;
}

export interface State {
  scales: Scales;
  tempPoints: Points;
  isDragging: boolean;
  finalPoints: Points;
  isShowCustomLine: boolean;
  datasets: Point[];
  width: number;
  height: number;
}

const marginTop = 20;
const marginRight = 10;
const marginBottom = 30;
const marginLeft = 40;

function createScales(width: number, height: number): Scales {
  const chartWidth = width - marginLeft - marginRight;
  const chartHeight = height - marginTop - marginBottom;
  const xScale = d3
    .scaleLinear<number, number>()
    .domain([0, 6])
    .range([0, chartWidth]);
  const yScale = d3
    .scaleLinear<number, number>()
    .domain([0, 7])
    .range([chartHeight, 0]);
  return { xScale, yScale };
}

function createTempPixels(
  pointerDown$: Stream<PointerEvent>,
  pointerMove$: Stream<PointerEvent>,
  pointerUp$: Stream<PointerEvent>
): Stream<Points> {
  const flattened$ = pointerDown$
    .map((startEvent) => {
      const startX = startEvent.x;
      const startY = startEvent.y;

      return pointerMove$
        .map((moveEvent) => ({
          start: { x: startX, y: startY },
          end: { x: moveEvent.x, y: moveEvent.y },
        }))
        .endWhen(pointerUp$);
    })
    .flatten();

  return flattened$
    .map((data: any) => data)
    .startWith({ start: null, end: null } as Points);
}

function convertPixelsToPoints(tempPixels: Points, scales: Scales): Points {
  return {
    start: tempPixels.start
      ? {
          x: scales.xScale.invert(tempPixels.start.x),
          y: scales.yScale.invert(tempPixels.start.y),
        }
      : null,
    end: tempPixels.end
      ? {
          x: scales.xScale.invert(tempPixels.end.x),
          y: scales.yScale.invert(tempPixels.end.y),
        }
      : null,
  };
}

function createFinalPixels(
  pointerDown$: Stream<PointerEvent>,
  pointerUp$: Stream<PointerEvent>
): Stream<Points> {
  const flattened$ = pointerDown$
    .map((startEvent) => {
      const startX = startEvent.x;
      const startY = startEvent.y;

      return pointerUp$.map((endEvent) => ({
        start: { x: startX, y: startY },
        end: { x: endEvent.x, y: endEvent.y },
      }));
    })
    .flatten();

  return flattened$
    .map((data: any) => data)
    .filter(({ start, end }: any) => {
      if (!start || !end) return false;
      return start.x !== end.x && start.y !== end.y;
    })
    .startWith({ start: null, end: null } as Points);
}

function createIsDragging(
  pointerDown$: Stream<PointerEvent>,
  pointerMove$: Stream<PointerEvent>,
  pointerUp$: Stream<PointerEvent>
): Stream<boolean> {
  return xs
    .merge(
      pointerDown$
        .map(() => {
          return pointerMove$.mapTo(true).endWhen(pointerUp$);
        })
        .flatten()
        .startWith(false),
      pointerUp$.mapTo(false)
    )
    .startWith(false);
}

function createIsShowCustomLine(
  pointerDown$: Stream<PointerEvent>,
  pointerMove$: Stream<PointerEvent>,
  pointerUp$: Stream<PointerEvent>
): Stream<boolean> {
  return xs
    .merge(
      pointerDown$
        .map(() => {
          return pointerMove$.mapTo(false).endWhen(pointerUp$);
        })
        .flatten()
        .startWith(false),
      pointerUp$.mapTo(true)
    )
    .startWith(false);
}

export function model(actions: Actions): Stream<State> {
  const width$ = actions.config$.map((config) => config.width);
  const height$ = actions.config$.map((config) => config.height);
  const datasets$ = actions.config$.map((config) => config.datasets);

  const scales$ = xs
    .combine(width$, height$)
    .map(([width, height]) => createScales(width, height));

  const tempPixels$ = createTempPixels(
    actions.pointerDown$,
    actions.pointerMove$,
    actions.pointerUp$
  );

  const tempPoints$ = xs
    .combine(tempPixels$, scales$)
    .map(([tempPixels, scales]) => convertPixelsToPoints(tempPixels, scales));

  const isDragging$ = createIsDragging(
    actions.pointerDown$,
    actions.pointerMove$,
    actions.pointerUp$
  );

  const finalPixels$ = createFinalPixels(
    actions.pointerDown$,
    actions.pointerUp$
  );

  const finalPoints$ = xs
    .combine(finalPixels$, scales$)
    .map(([finalPixels, scales]) => convertPixelsToPoints(finalPixels, scales));

  const isShowCustomLine$ = createIsShowCustomLine(
    actions.pointerDown$,
    actions.pointerMove$,
    actions.pointerUp$
  );

  return xs
    .combine(
      scales$,
      tempPoints$,
      isDragging$,
      finalPoints$,
      isShowCustomLine$,
      datasets$,
      width$,
      height$
    )
    .map(
      ([
        scales,
        tempPoints,
        isDragging,
        finalPoints,
        isShowCustomLine,
        datasets,
        width,
        height,
      ]) => ({
        scales,
        tempPoints,
        isDragging,
        finalPoints,
        isShowCustomLine,
        datasets,
        width,
        height,
      })
    );
}
