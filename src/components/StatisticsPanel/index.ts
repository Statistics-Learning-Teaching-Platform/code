import { intent } from './intent';
import { model } from './model';
import { view } from './view';
import type { StatisticsPanelSources, StatisticsPanelSinks } from './types';

/**
 * StatisticsPanel Component
 *
 * A Cycle.js component for displaying regression statistics.
 * Features:
 * - SSE (Sum of Squared Errors) for regression or custom line
 * - Residual information for hovered points
 * - Display-only component (no user interactions)
 *
 * @param sources - Component sources (DOM, props, customLine, regression, pointHover)
 * @returns Component sinks (DOM)
 */
export function StatisticsPanel(
  sources: StatisticsPanelSources
): StatisticsPanelSinks {
  // MVI Pattern
  intent(sources);
  const state$ = model(sources);
  const vdom$ = view(state$);

  return {
    DOM: vdom$,
  };
}

// Re-export types for consumers
export type {
  StatisticsPanelProps,
  StatisticsPanelSources,
  StatisticsPanelSinks,
  CustomLineData,
  RegressionData,
  PointHoverData,
  Point,
  State,
} from './types';

export default StatisticsPanel;
