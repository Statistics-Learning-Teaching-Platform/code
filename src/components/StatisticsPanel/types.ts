import type { Stream } from 'xstream';
import type { DOMSource, VNode } from '@cycle/dom';

// Re-export Point type from RegressionChart for convenience
export interface Point {
  x: number;
  y: number;
}

// ==================== Input Props ====================
export interface StatisticsPanelProps {
  datasets: Point[];
}

// ==================== Sources ====================
export interface StatisticsPanelSources {
  DOM: DOMSource;
  props: Stream<StatisticsPanelProps>;
  customLine: Stream<CustomLineData>;
  regression: Stream<RegressionData>;
  pointHover: Stream<PointHoverData>;
}

// ==================== Sink Data Types (from RegressionChart) ====================
export interface CustomLineData {
  slope: number;
  intercept: number;
  startPoint: Point;
  endPoint: Point;
  timestamp: number;
}

export interface RegressionData {
  slope: number;
  intercept: number;
  rSquared: number | undefined;
  startPoint: Point;
  endPoint: Point;
  dataPointCount: number;
  timestamp: number;
}

export interface PointHoverData {
  point: Point | null; // The data point being hovered (null when not hovering)
  pointY: number;
  lineY: number;
  residual: number;
  distance: number;
  lineType: 'regression' | 'custom';
  timestamp: number;
}

// ==================== State (from Model) ====================
export interface SSEData {
  value: number;
  lineType: 'regression' | 'custom' | null;
  timestamp: number;
}

export interface HoveredPointData {
  point: Point | null;
  residual: number | null;
  lineY: number | null;
  lineType: 'regression' | 'custom' | null;
}

export interface LineSummary {
  slope: number | null;
  intercept: number | null;
  rSquared: number | null;
  available: boolean;
}

export interface State {
  // SSE statistics
  sse: SSEData;

  // Hovered point residual
  hover: HoveredPointData;

  // Datasets for calculation
  datasets: Point[];

  // Equation summaries
  regression: LineSummary;
  customLine: LineSummary;
}

// ==================== Sinks ====================
export interface StatisticsPanelSinks {
  DOM: Stream<VNode>;
}

// ==================== Actions (from Intent) ====================
// This component is display-only, no user interactions
export interface Actions {
  // No actions needed - display only component
}
