import type { StatisticsPanelSources, Actions } from './types';

/**
 * Intent for StatisticsPanel Component
 *
 * This is a display-only component with no user interactions.
 * All inputs come from RegressionChart sinks via sources.
 *
 * @param sources - Component sources
 * @returns Empty actions object (display-only component)
 */
export function intent(_sources: StatisticsPanelSources): Actions {
  // This component has no user interactions
  // All data comes from RegressionChart sinks (customLine, regression, pointHover)
  return {} as Actions;
}
