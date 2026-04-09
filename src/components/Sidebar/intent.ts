import xs, { Stream } from 'xstream';
import { $el } from '../../_utils/dom';
import type { SidebarSources, SidebarActions, Dataset } from './types';
import type { Response } from '@cycle/http';

export function intent(sources: SidebarSources): SidebarActions {
  // Props stream as config action
  const config$ = sources.props;

  // HTTP responses: datasets loaded
  const responseStreams$ = sources.HTTP.select('datasets');

  const datasetResults$ = responseStreams$
    .map((response$: Stream<Response>) =>
      response$.map((res: Response) => {
        if (res.status !== 200) {
          return {
            dataset: null as Dataset | null,
            error: `Failed to load ${res.request?.url || 'dataset'} (status ${res.status})`,
          };
        }

        let dataset: Dataset | null = null;

        if (res.body) {
          dataset = res.body as Dataset;
        } else if (res.text) {
          try {
            dataset = JSON.parse(res.text) as Dataset;
          } catch (error) {
            console.error('[Sidebar intent] Failed to parse dataset text:', error);
          }
        }

        if (!dataset) {
          return {
            dataset: null as Dataset | null,
            error: `Loaded ${res.request?.url || 'dataset'} but could not parse its contents.`,
          };
        }

        return {
          dataset,
          error: null as string | null,
        };
      })
    )
    .flatten();

  const datasetsLoaded$ = datasetResults$
    .filter(
      (result): result is { dataset: Dataset; error: null } =>
        result.dataset !== null
    )
    .map((result) => result.dataset)
    .fold((acc: Dataset[], dataset: Dataset) => [...acc, dataset], []);

  const datasetLoadError$: Stream<string | null> = xs.merge(
    xs.of(null as string | null),
    datasetResults$
      .filter(
        (result): result is { dataset: null; error: string } =>
          result.error !== null
      )
      .map((result) => result.error as string | null)
  );

  // Dataset selection from dropdown
  const selectDataset$ = $el(sources.DOM, '.dataset-select')
    .events('change')
    .map((ev: Event) => (ev.target as HTMLSelectElement).value);

  // Toggle regression checkbox
  const toggleRegression$ = $el(sources.DOM, '.regression-toggle')
    .events('change')
    .mapTo(null as null);

  // Clear custom line button
  const clearCustomLine$ = $el(sources.DOM, '.clear-custom-line')
    .events('click')
    .mapTo(null as null);

  return {
    config$,
    datasetsLoaded$,
    datasetLoadError$,
    selectDataset$,
    toggleRegression$,
    clearCustomLine$,
  };
}
