import xs, { Stream } from 'xstream';
import type {
  Actions,
  PointerCoordinates,
  Point,
  State,
  Scales,
  Points,
  CustomLineData,
  RegressionData,
  PointHoverData,
  HoverState,
} from './types';
import {
  createScales,
  calculateRegression,
  convertPixelsToPoints,
  calculateSlope,
  DEFAULT_MARGINS,
} from '../../d3/regression';

// ==================== Helper Functions ====================

function createTempPixels(
  pointerDown$: Stream<PointerCoordinates>,
  pointerMove$: Stream<PointerCoordinates>,
  pointerUp$: Stream<PointerCoordinates>
): Stream<{ start: Point | null; end: Point | null }> {
  const flattened$: Stream<{ start: Point | null; end: Point | null }> =
    pointerDown$
      .map((startEvent) => {
        const startX = startEvent.x;
        const startY = startEvent.y;

        return pointerMove$
          .map((moveEvent): { start: Point | null; end: Point | null } => ({
            start: { x: startX, y: startY },
            end: { x: moveEvent.x, y: moveEvent.y },
          }))
          .endWhen(pointerUp$);
      })
      .flatten();

  return flattened$.startWith({ start: null, end: null });
}

function createFinalPixels(
  pointerDown$: Stream<PointerCoordinates>,
  pointerUp$: Stream<PointerCoordinates>
): Stream<{ start: Point | null; end: Point | null }> {
  const flattened$: Stream<{ start: Point | null; end: Point | null }> =
    pointerDown$
      .map((startEvent) => {
        const startX = startEvent.x;
        const startY = startEvent.y;

        return pointerUp$.map(
          (endEvent): { start: Point | null; end: Point | null } => ({
            start: { x: startX, y: startY },
            end: { x: endEvent.x, y: endEvent.y },
          })
        );
      })
      .flatten();

  return flattened$
    .filter(({ start, end }) => {
      if (!start || !end) return false;
      return start.x !== end.x && start.y !== end.y;
    })
    .startWith({ start: null, end: null });
}

function createIsDragging(
  pointerDown$: Stream<PointerCoordinates>,
  pointerMove$: Stream<PointerCoordinates>,
  pointerUp$: Stream<PointerCoordinates>
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
  pointerDown$: Stream<PointerCoordinates>,
  pointerMove$: Stream<PointerCoordinates>,
  pointerUp$: Stream<PointerCoordinates>
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

// ==================== Main Model Function ====================

export function model(actions: Actions): Stream<State> {
  // ==================== Initial State ====================
  const initialScales = createScales(0, 0, DEFAULT_MARGINS, [0, 1], [0, 1]);

  const initialState: State = {
    // basic config (will be replaced by config$)
    props: {
      width: 0,
      height: 0,
      datasets: [],
      margins: DEFAULT_MARGINS,
      xDomain: [0, 1],
      yDomain: [0, 1],
      showRegression: true,
    },
    scales: initialScales,
    showRegression: true,
    // regression line
    regression: {
      slope: 0,
      intercept: 0,
      rSquared: 0,
    },
    // custom line (user-drawn)
    customLine: {
      tempPoints: { start: null, end: null },
      finalPoints: { start: null, end: null },
      isDragging: false,
      isShowCustomLine: false,
    },
    // hover state
    hover: {
      point: null,
      lineY: null,
      showVerticalLine: false,
      lineType: 'none',
    },
    // derived values
    datasets: [],
    width: 0,
    height: 0,
    margins: DEFAULT_MARGINS,
  };

  // ==================== Config patch ====================
  const configPatch$ = actions.config$.map((props) => (state: State): State => {
    const margins = props.margins || DEFAULT_MARGINS;
    const scales = createScales(
      props.width,
      props.height,
      margins,
      props.xDomain,
      props.yDomain
    );

    const reg = calculateRegression(props.datasets, scales);

    // Check if dataset has changed
    const datasetChanged =
      props.datasets !== state.datasets ||
      JSON.stringify(props.datasets) !== JSON.stringify(state.datasets);

    return {
      ...state,
      props,
      scales,
      showRegression: props.showRegression !== false,
      regression: {
        slope: reg.slope,
        intercept: reg.intercept,
        rSquared: reg.rSquared,
      },
      datasets: props.datasets,
      width: props.width,
      height: props.height,
      margins,
      // Reset hover state when dataset changes to avoid showing stale data
      ...(datasetChanged
        ? {
            hover: {
              point: null,
              lineY: null,
              showVerticalLine: false,
              lineType: 'none',
            },
          }
        : {}),
    };
  });

  // ==================== Custom line state (user-drawn) ====================
  const tempPixels$ = createTempPixels(
    actions.pointerDown$,
    actions.pointerMove$,
    actions.pointerUp$
  );

  const finalPixels$ = createFinalPixels(
    actions.pointerDown$,
    actions.pointerUp$
  );

  const clearedPixels$ = actions.clearSignal$
    .filter((signal) => signal !== null)
    .mapTo({ start: null, end: null } as Points);

  const customLineFinalPixels$ = xs
    .merge(finalPixels$, clearedPixels$)
    .startWith({ start: null, end: null } as Points);

  const isDragging$ = createIsDragging(
    actions.pointerDown$,
    actions.pointerMove$,
    actions.pointerUp$
  );

  const isShowCustomLine$ = createIsShowCustomLine(
    actions.pointerDown$,
    actions.pointerMove$,
    actions.pointerUp$
  );

  const customLinePatch$ = xs
    .combine(
      tempPixels$,
      customLineFinalPixels$,
      isDragging$,
      isShowCustomLine$
    )
    .map(
      ([tempPixels, finalPixels, isDragging, isShowCustomLine]) =>
        (state: State): State => ({
          ...state,
          customLine: {
            tempPoints: convertPixelsToPoints(tempPixels, state.scales),
            finalPoints: convertPixelsToPoints(finalPixels, state.scales),
            isDragging,
            isShowCustomLine,
          },
        })
    );

  // ==================== Point hover state ====================
  const pointHoverWithInitial$ = actions.pointHover$.startWith({
    point: null,
    event: {
      offsetX: 0,
      offsetY: 0,
      target: null,
    },
  });

  const hoverPatch$ = pointHoverWithInitial$.map(
    (hoverAction) =>
      (state: State): State => {
        const point = hoverAction.point;
        if (!point) {
          return {
            ...state,
            hover: {
              point: null,
              lineY: null,
              showVerticalLine: false,
              lineType: 'none',
            },
          };
        }

        // Determine which line to use for distance calculation
        // Priority: 1) Regression line (if shown), 2) Custom line (if exists), 3) None
        if (state.showRegression) {
          const lineY =
            state.regression.slope * point.x + state.regression.intercept;
          return {
            ...state,
            hover: {
              point,
              lineY,
              showVerticalLine: true,
              lineType: 'regression',
            },
          };
        } else if (
          state.customLine.isShowCustomLine &&
          state.customLine.finalPoints.start &&
          state.customLine.finalPoints.end
        ) {
          const start = state.customLine.finalPoints.start;
          const end = state.customLine.finalPoints.end;

          // Calculate slope and intercept from custom line
          const slope = (end.y - start.y) / (end.x - start.x);
          const intercept = start.y - slope * start.x;
          const lineY = slope * point.x + intercept;

          return {
            ...state,
            hover: {
              point,
              lineY,
              showVerticalLine: true,
              lineType: 'custom',
            },
          };
        }

        // No line to show distance from
        return {
          ...state,
          hover: {
            point: null,
            lineY: null,
            showVerticalLine: false,
            lineType: 'none',
          },
        };
      }
  );

  // ==================== Patch stream & state$ ====================
  const patch$ = xs.merge(configPatch$, customLinePatch$, hoverPatch$);

  const state$ = patch$.fold((state, patch) => patch(state), initialState);

  return state$;
}

// ==================== Sink Creation Helpers ====================

/**
 * Create custom line sink - emits when user completes drawing a line
 */
export function createCustomLineSink(
  finalPoints$: Stream<Points>,
  scales$: Stream<Scales>
): Stream<CustomLineData> {
  return xs
    .combine(finalPoints$, scales$)
    .filter(([points]) => points.start !== null && points.end !== null)
    .map(([points]) => {
      const start = points.start!;
      const end = points.end!;
      const slope = calculateSlope(start, end);
      const intercept = start.y - slope * start.x;

      return {
        slope,
        intercept,
        startPoint: start,
        endPoint: end,
        timestamp: Date.now(),
      };
    });
}

/**
 * Create regression sink - emits regression calculation results
 */
export function createRegressionSink(
  regression$: Stream<{
    slope: number;
    intercept: number;
    rSquared: number | undefined;
  }>,
  scales$: Stream<Scales>,
  datasets$: Stream<Point[]>
): Stream<RegressionData> {
  return xs
    .combine(regression$, scales$, datasets$)
    .map(([regression, scales, datasets]) => {
      const [xMin, xMax] = scales.xScale.domain();
      return {
        slope: regression.slope,
        intercept: regression.intercept,
        rSquared: regression.rSquared,
        startPoint: {
          x: xMin,
          y: regression.slope * xMin + regression.intercept,
        },
        endPoint: {
          x: xMax,
          y: regression.slope * xMax + regression.intercept,
        },
        dataPointCount: datasets.length,
        timestamp: Date.now(),
      };
    });
}

/**
 * Create point hover sink - emits both hover and non-hover states
 */
export function createPointHoverSink(
  hoverState$: Stream<HoverState>
): Stream<PointHoverData> {
  function isHoverWithPoint(
    h: HoverState
  ): h is Extract<HoverState, { point: Point }> {
    return h.point !== null && h.lineY !== null && h.showVerticalLine === true;
  }

  return hoverState$.map((hover): PointHoverData => {
    // When hovering over a point
    if (isHoverWithPoint(hover)) {
      const point = hover.point;
      const lineY = hover.lineY;
      const residual = point.y - lineY;

      return {
        point,
        pointY: point.y,
        lineY,
        residual,
        distance: Math.abs(residual),
        lineType: hover.lineType,
        timestamp: Date.now(),
      };
    }

    // When not hovering - emit null state
    return {
      point: null,
      pointY: 0,
      lineY: 0,
      residual: 0,
      distance: 0,
      lineType: 'regression',
      timestamp: Date.now(),
    };
  });
}
