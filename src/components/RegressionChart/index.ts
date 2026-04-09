import { intent } from './intent';
import { model, createCustomLineSink, createRegressionSink, createPointHoverSink } from './model';
import { view } from './view';
import type { RegressionChartSources, RegressionChartSinks } from './types';

/**
 * RegressionChart Component
 *
 * A Cycle.js component for interactive regression teaching.
 * Features:
 * - Scatter plot with data points
 * - Calculated regression line (least squares)
 * - User-drawn custom lines for comparison
 * - Point hover with vertical line to regression
 * - Props-based control for regression visibility
 * - Clear custom line via signal
 *
 * @param sources - Component sources (DOM, props)
 * @returns Component sinks (DOM, customLine, regression, pointHover)
 */
export function RegressionChart(sources: RegressionChartSources): RegressionChartSinks {
  // MVI Pattern
  const actions = intent(sources);
  const state$ = model(actions);
  const vdom$ = view(state$);

  // Create sink streams from state
  const customLine$ = createCustomLineSink(
    state$.map(s => s.customLine.finalPoints),
    state$.map(s => s.scales)
  );

  const regression$ = createRegressionSink(
    state$.map(s => s.regression),
    state$.map(s => s.scales),
    state$.map(s => s.datasets)
  );

  const pointHover$ = createPointHoverSink(
    state$.map(s => s.hover)
  );

  return {
    DOM: vdom$,
    customLine: customLine$,
    regression: regression$,
    pointHover: pointHover$
  };
}

// Re-export types for consumers
export type {
  RegressionChartProps,
  RegressionChartSources,
  RegressionChartSinks,
  CustomLineData,
  RegressionData,
  PointHoverData,
  Point,
  Margins
} from './types';

export default RegressionChart;
