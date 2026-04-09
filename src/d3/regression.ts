import * as d3 from 'd3';
import type {
  Point,
  Scales,
  Margins,
} from '../components/RegressionChart/types';

// ==================== Default Values ====================
export const DEFAULT_MARGINS: Margins = {
  top: 20,
  right: 10,
  bottom: 30,
  left: 40,
};

// ==================== Scale Creation ====================
/**
 * Create D3 scales for the chart
 * Pure function
 */
export function createScales(
  width: number,
  height: number,
  margins: Margins = DEFAULT_MARGINS,
  xDomain?: [number, number],
  yDomain?: [number, number]
): Scales {
  const chartWidth = width - margins.left - margins.right;
  const chartHeight = height - margins.top - margins.bottom;

  const xDomainRange: [number, number] = xDomain || [0, 6];
  const yDomainRange: [number, number] = yDomain || [0, 7];

  const xScale = d3
    .scaleLinear<number, number>()
    .domain(xDomainRange)
    .range([0, chartWidth]);

  const yScale = d3
    .scaleLinear<number, number>()
    .domain(yDomainRange)
    .range([chartHeight, 0]);

  return { xScale, yScale };
}

// ==================== Regression Calculation ====================
export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared?: number;
  y1: number; // Y at xMin
  y2: number; // Y at xMax
}

/**
 * Calculate least squares regression line
 * Pure function - no side effects
 */
export function calculateRegression(
  data: Point[],
  scales: Scales
): RegressionResult {
  const n = data.length;

  if (n === 0) {
    return { slope: 0, intercept: 0, rSquared: 0, y1: 0, y2: 0 };
  }

  // Calculate sums
  const sumX = d3.sum(data, (d: Point) => d.x);
  const sumY = d3.sum(data, (d: Point) => d.y);
  const sumXY = d3.sum(data, (d: Point) => d.x * d.y);
  const sumX2 = d3.sum(data, (d: Point) => d.x * d.x);
  // Calculate slope and intercept
  const denominator = n * sumX2 - sumX * sumX;
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R² (coefficient of determination)
  const yMean = sumY / n;
  const ssTot = d3.sum(data, (d: Point) => Math.pow(d.y - yMean, 2));
  const ssRes = d3.sum(data, (d: Point) =>
    Math.pow(d.y - (slope * d.x + intercept), 2)
  );
  const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

  // Calculate line endpoints for rendering
  const [xMin, xMax] = scales.xScale.domain();
  const y1 = slope * xMin + intercept;
  const y2 = slope * xMax + intercept;

  return {
    slope,
    intercept,
    rSquared,
    y1,
    y2,
  };
}

/**
 * Calculate slope from two points
 */
export function calculateSlope(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  return dx !== 0 ? (p2.y - p1.y) / dx : 0;
}

/**
 * Calculate Y-intercept from point and slope
 */
export function calculateIntercept(point: Point, slope: number): number {
  return point.y - slope * point.x;
}

// ==================== Pixel Conversion ====================
export interface Points {
  start: Point | null;
  end: Point | null;
}

/**
 * Convert pixel coordinates to data coordinates using scales
 */
export function convertPixelsToPoints(pixels: Points, scales: Scales): Points {
  return {
    start: pixels.start
      ? {
          x: scales.xScale.invert(pixels.start.x),
          y: scales.yScale.invert(pixels.start.y),
        }
      : null,
    end: pixels.end
      ? {
          x: scales.xScale.invert(pixels.end.x),
          y: scales.yScale.invert(pixels.end.y),
        }
      : null,
  };
}

/**
 * Compare two data arrays for equality
 * Used to avoid unnecessary D3 re-renders
 */
export function compareData(
  data1: Point[],
  data2: Point[],
  errorThreshold: number
): boolean {
  if (data1.length !== data2.length) {
    return false;
  }

  for (let i = 0; i < data1.length; i++) {
    const point1 = data1[i];
    const point2 = data2[i];

    if (
      Math.abs(point1.x - point2.x) > errorThreshold ||
      Math.abs(point1.y - point2.y) > errorThreshold
    ) {
      return false;
    }
  }

  return true;
}
