import { Stream } from 'xstream';
import type { DOMSource } from '@cycle/dom';
import type { HTTPSource, RequestOptions } from '@cycle/http';
import type { VNode } from '@cycle/dom';

export interface Dataset {
  id: string;
  name: string;
  data: Array<{ x: number; y: number }>;
}

export interface SidebarProps {
  datasetPaths: string[]; // List of dataset file paths to load
}

export interface SidebarSources {
  DOM: DOMSource;
  HTTP: HTTPSource;
  props: Stream<SidebarProps>;
}

export interface SidebarSinks {
  DOM: Stream<VNode>;
  HTTP: Stream<RequestOptions>;
  datasetChange: Stream<string>;
  selectedDataset: Stream<Dataset>;
  toggleRegression: Stream<boolean>;
  clearCustomLine: Stream<number>;
}

export interface SidebarActions {
  config$: Stream<SidebarProps>; // Props stream as action
  datasetsLoaded$: Stream<Dataset[]>; // HTTP response: loaded datasets
  datasetLoadError$: Stream<string | null>;
  selectDataset$: Stream<string>;
  toggleRegression$: Stream<null>;
  clearCustomLine$: Stream<null>;
}

export interface SidebarState {
  datasets: Dataset[];
  selectedDataset: string;
  showRegression: boolean;
  isLoading: boolean;
  loadError: string | null;
}

export interface DatasetLoadError {
  id: string;
  error: string;
}
