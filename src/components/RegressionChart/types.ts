import type { ScaleLinear } from 'd3';
import type { Stream } from 'xstream';
import type { DOMSource, VNode } from '@cycle/dom';

// ==================== Input Props ====================
export interface RegressionChartProps {
  width: number;
  height: number;
  datasets: Point[];
  margins?: Margins;
  xDomain?: [number, number];
  yDomain?: [number, number];

  // Control regression line visibility
  showRegression?: boolean; // default true

  // Signal to clear the custom line
  clearLineSignal?: Stream<number | null>;
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Point {
  x: number;
  y: number;
}

// ==================== Scales ====================
export interface Scales {
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
}

// ==================== Sources ====================
export interface RegressionChartSources {
  DOM: DOMSource;
  props: Stream<RegressionChartProps>;
}

// ==================== Actions (from Intent) ====================
export interface PointerCoordinates {
  x: number; // Pixel coordinates
  y: number;
}

export interface PointHoverAction {
  point: Point | null;
  event: {
    offsetX: number;
    offsetY: number;
    target: EventTarget | null;
  };
}

export interface Actions {
  // Line drawing
  pointerDown$: Stream<PointerCoordinates>;
  pointerMove$: Stream<PointerCoordinates>;
  pointerUp$: Stream<PointerCoordinates>;

  // Point hover
  pointHover$: Stream<PointHoverAction>;

  // Config
  config$: Stream<RegressionChartProps>;
  clearSignal$: Stream<number | null>;
}

// ==================== State (from Model) ====================
export interface Points {
  start: Point | null;
  end: Point | null;
}

export type HoverState =
  | { point: null; lineY: null; showVerticalLine: false; lineType: 'none' }
  | {
      point: Point;
      lineY: number;
      showVerticalLine: true;
      lineType: 'regression' | 'custom';
    };

export interface State {
  // Configuration
  props: RegressionChartProps;
  scales: Scales;
  showRegression: boolean;

  // Custom line (user-drawn)
  customLine: {
    tempPoints: Points;
    finalPoints: Points;
    isDragging: boolean;
    isShowCustomLine: boolean;
  };

  // Regression line (calculated)
  regression: {
    slope: number;
    intercept: number;
    rSquared: number | undefined;
  };

  // Point hover
  hover: HoverState;

  // Computed values
  datasets: Point[];
  width: number;
  height: number;
  margins: Margins;
}

// ==================== Sinks ====================
export interface RegressionChartSinks {
  DOM: Stream<VNode>;
  customLine: Stream<CustomLineData>;
  regression: Stream<RegressionData>;
  pointHover: Stream<PointHoverData>;
}

// ==================== Sink Output Data ====================
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
  pointY: number; // Actual Y value of the point
  lineY: number; // Y value on the visible line (regression or custom) at this X
  residual: number; // Difference (pointY - lineY)
  distance: number; // Absolute distance (|residual|)
  lineType: 'regression' | 'custom'; // Which line is being used
  timestamp: number;
}
