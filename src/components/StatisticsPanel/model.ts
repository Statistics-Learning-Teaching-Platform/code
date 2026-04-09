import xs, { Stream } from 'xstream';
import type {
  State,
  SSEData,
  CustomLineData,
  RegressionData,
  PointHoverData,
  StatisticsPanelSources,
  Point,
} from './types';

// ==================== Helper Functions ====================

/**
 * Calculate SSE (Sum of Squared Errors) for a given line
 * SSE = Σ(y_i - ŷ_i)²
 */
function calculateSSE(
  datasets: Point[],
  slope: number,
  intercept: number
): number {
  return datasets.reduce((sum, point) => {
    const predictedY = slope * point.x + intercept;
    const residual = point.y - predictedY;
    return sum + residual * residual;
  }, 0);
}

/**
 * Create SSE data from regression or custom line
 */
function createSSEData(
  datasets: Point[],
  slope: number,
  intercept: number,
  lineType: 'regression' | 'custom'
): SSEData {
  return {
    value: calculateSSE(datasets, slope, intercept),
    lineType,
    timestamp: Date.now(),
  };
}

// ==================== Main Model Function ====================

/**
 * Model for StatisticsPanel Component
 *
 * Combines incoming streams from RegressionChart sinks
 * to create state with SSE and hover information.
 */
export function model(sources: StatisticsPanelSources): Stream<State> {
  // ==================== Initial State ====================
  const initialState: State = {
    sse: {
      value: 0,
      lineType: null,
      timestamp: Date.now(),
    },
    hover: {
      point: null,
      residual: null,
      lineY: null,
      lineType: null,
    },
    datasets: [],
    regression: {
      slope: null,
      intercept: null,
      rSquared: null,
      available: false,
    },
    customLine: {
      slope: null,
      intercept: null,
      rSquared: null,
      available: false,
    },
  };

  // ==================== Props Stream ====================
  const props$ = sources.props;

  // ==================== SSE Calculation Streams ====================
  // SSE for regression line
  const regressionSSE$ = sources.regression.map(
    (regData: RegressionData) => (state: State) => {
      const sseData = createSSEData(
        state.datasets,
        regData.slope,
        regData.intercept,
        'regression'
      );

      return {
        ...state,
        sse: sseData,
        regression: {
          slope: regData.slope,
          intercept: regData.intercept,
          rSquared: regData.rSquared ?? null,
          available: true,
        },
      };
    }
  );

  // SSE for custom line (only emitted when user completes drawing)
  const customLineSSE$ = sources.customLine.map(
    (lineData: CustomLineData) => (state: State) => {
      const sseData = createSSEData(
        state.datasets,
        lineData.slope,
        lineData.intercept,
        'custom'
      );

      return {
        ...state,
        sse: sseData,
        customLine: {
          slope: lineData.slope,
          intercept: lineData.intercept,
          rSquared: null,
          available: true,
        },
      };
    }
  );

  // ==================== Hover Data Stream ====================
  const hoverData$ = sources.pointHover.map(
    (hoverData: PointHoverData) => (state: State) => {
      const isNoHover = hoverData.point === null;
      const newHover = {
        point: hoverData.point,
        residual: isNoHover ? null : hoverData.residual,
        lineY: isNoHover ? null : hoverData.lineY,
        lineType: isNoHover ? null : hoverData.lineType,
      };
      return {
        ...state,
        hover: newHover,
      };
    }
  );

  // ==================== Datasets Stream ====================
  const datasetsPatch$ = props$.map(
    (props) =>
      (state: State): State => ({
        ...state,
        datasets: props.datasets,
      })
  );

  // ==================== Patch stream & state$ ====================
  // Initial state patch to ensure first emission
  const initialStatePatch$ = xs.of((_: State): State => initialState);

  const patch$ = xs.merge(
    initialStatePatch$,
    datasetsPatch$,
    regressionSSE$,
    customLineSSE$,
    hoverData$
  );

  const state$ = patch$.fold((state, patch) => patch(state), initialState);

  return state$;
}
