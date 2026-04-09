import xs, { Stream } from 'xstream';
import type {
  SidebarProps,
  SidebarActions,
  SidebarState,
  Dataset,
} from './types';
import type { RequestOptions } from '@cycle/http';

export function model(actions: SidebarActions): Stream<SidebarState> {
  // Config stream: initial state setup (only runs once per config emission)
  const configState$ = actions.config$.map(
    (_props: SidebarProps) => (state: SidebarState) => {
      // Only initialize if state is still initial (empty datasets)
      if (state.datasets.length === 0) {
        return {
          ...state,
          showRegression: false,
          isLoading: true,
          loadError: null,
        };
      }
      // Otherwise keep state as-is (don't reset showRegression)
      return state;
    }
  );

  // Datasets loaded action: replaces datasets in state
  const datasetsLoadedPatch$ = actions.datasetsLoaded$.map(
    (datasets: Dataset[]) => (state: SidebarState) => ({
      ...state,
      datasets,
      selectedDataset:
        datasets.length > 0 ? datasets[0].id : state.selectedDataset,
      isLoading: false,
      loadError: null,
    })
  );

  const datasetLoadErrorPatch$ = actions.datasetLoadError$
    .filter((error): error is string => error !== null)
    .map(
      (error: string) => (state: SidebarState) => ({
        ...state,
        isLoading: false,
        loadError: error,
      })
    );

  // Dataset selection action
  const datasetPatch$ = actions.selectDataset$.map(
    (selectedDataset: string) => (state: SidebarState) => ({
      ...state,
      selectedDataset,
    })
  );

  // Toggle regression action
  const regressionPatch$ = actions.toggleRegression$.map(
    () => (state: SidebarState) => ({
      ...state,
      showRegression: !state.showRegression,
    })
  );

  // Clear custom line action (state unchanged, just emits signal)
  const clearSignal$ = actions.clearCustomLine$.map(
    () => (state: SidebarState) => state
  );

  // Merge all state updates
  const stateUpdate$ = xs.merge(
    configState$,
    datasetsLoadedPatch$,
    datasetLoadErrorPatch$,
    datasetPatch$,
    regressionPatch$,
    clearSignal$
  );

  // Initial state
  const initialState: SidebarState = {
    datasets: [],
    selectedDataset: '',
    showRegression: false,
    isLoading: true,
    loadError: null,
  };

  // Apply all updates using fold
  return stateUpdate$.fold(
    (state: SidebarState, updateFn: (state: SidebarState) => SidebarState) =>
      updateFn(state),
    initialState
  );
}

// Sink creators for component outputs
export function createDatasetChangeSink(
  selectDataset$: Stream<string>
): Stream<string> {
  return selectDataset$;
}

export function createSelectedDatasetSink(
  state$: Stream<SidebarState>
): Stream<Dataset> {
  // Emit whenever state changes with a valid dataset (initial + changes)
  return state$
    .map((state) => {
      const dataset = state.datasets.find(
        (d) => d.id === state.selectedDataset
      );
      if (!dataset) {
        if (state.datasets.length > 0) {
          console.warn(
            '[Sidebar] Selected dataset not found, returning first dataset'
          );
          return state.datasets[0];
        }
        return undefined;
      }
      return dataset;
    })
    .filter((dataset): dataset is Dataset => dataset !== undefined);
}

export function createToggleRegressionSink(
  toggleRegression$: Stream<null>,
  state$: Stream<SidebarState>
): Stream<boolean> {
  // Emit current state whenever toggle is clicked, with initial emission
  return toggleRegression$
    .map(() => state$)
    .flatten()
    .map((state) => state.showRegression)
    .startWith(false); // Initial value (matches SidebarState.showRegression default)
}

export function createClearCustomLineSink(
  clearCustomLine$: Stream<null>
): Stream<number> {
  return clearCustomLine$.map(() => Date.now());
}

// Create HTTP requests sink
export function createHTTPSink(
  actions: SidebarActions
): Stream<RequestOptions> {
  const request$ = actions.config$
    .map((props: SidebarProps) => {
      console.log(
        '[HTTP Sink] Creating requests for',
        props.datasetPaths.length,
        'datasets'
      );
      // Create individual request streams and merge them
      const requestStreams = props.datasetPaths.map((path: string) => {
        console.log('[HTTP Sink] Creating request for:', path);
        return xs.of({
          url: path,
          method: 'GET',
          category: 'datasets',
        } as RequestOptions);
      });
      const merged = xs.merge(...requestStreams);
      return merged;
    })
    .flatten();

  // Debug: log what's being emitted
  request$.addListener({
    next: (req: RequestOptions) =>
      console.log('[HTTP Sink] Emitting request:', req.url),
    error: (err) => console.error('[HTTP Sink] Error:', err),
    complete: () => console.log('[HTTP Sink] Stream complete'),
  });

  return request$;
}
