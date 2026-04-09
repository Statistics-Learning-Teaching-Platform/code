import { intent } from './intent';
import {
  model,
  createDatasetChangeSink,
  createSelectedDatasetSink,
  createToggleRegressionSink,
  createClearCustomLineSink,
  createHTTPSink,
} from './model';
import { view } from './view';
import type { SidebarSources, SidebarSinks } from './types';

/**
 * Sidebar Component
 *
 * A Cycle.js component for controlling regression teaching visualization.
 * Features:
 * - Dataset selection dropdown
 * - Toggle regression line visibility
 * - Clear custom line button
 * - HTTP loading of datasets
 *
 * @param sources - Component sources (DOM, HTTP, props)
 * @returns Component sinks (DOM, HTTP, datasetChange, selectedDataset, toggleRegression, clearCustomLine)
 */
export function Sidebar(sources: SidebarSources): SidebarSinks {
  // MVI Pattern
  const actions = intent(sources);
  const state$ = model(actions);
  const vdom$ = view(state$);

  // Create sink streams from actions and state
  const datasetChange$ = createDatasetChangeSink(actions.selectDataset$);
  const selectedDataset$ = createSelectedDatasetSink(state$);
  const toggleRegression$ = createToggleRegressionSink(
    actions.toggleRegression$,
    state$
  );
  const clearCustomLine$ = createClearCustomLineSink(actions.clearCustomLine$);
  const http$ = createHTTPSink(actions);

  return {
    DOM: vdom$,
    HTTP: http$,
    datasetChange: datasetChange$,
    selectedDataset: selectedDataset$,
    toggleRegression: toggleRegression$,
    clearCustomLine: clearCustomLine$,
  };
}

// Re-export types for consumers
export type {
  SidebarProps,
  SidebarSources,
  SidebarSinks,
  SidebarState,
  Dataset,
  DatasetLoadError,
} from './types';

export default Sidebar;
