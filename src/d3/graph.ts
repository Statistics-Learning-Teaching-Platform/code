import * as d3 from 'd3';
import { svg } from '@cycle/dom';
import type {
  Point,
  Scales,
  Points,
} from '../components/RegressionChart/types';
import type { VNode } from '@cycle/dom';
import { compareData } from './regression';

// ==================== Render scatter plot with hover support ====================
export function createChartVNode(
  data: Point[],
  scales: Scales,
  showRegression: boolean,
  regression?: { slope: number; intercept: number }
): VNode {
  return svg.g({
    attrs: { id: 'chart-group' },
    hook: {
      insert: (vnode: VNode) => {
        const g = d3.select(vnode.elm as SVGGElement);
        regressionChart(g, data, scales, showRegression, regression);
      },
      update: (vnode: VNode) => {
        const g = d3.select(vnode.elm as SVGGElement);
        regressionChart(g, data, scales, showRegression, regression);
      },
    },
  });
}

function regressionChart(
  container: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentData: Point[],
  scales: Scales,
  showRegression: boolean,
  regression?: { slope: number; intercept: number }
): void {
  // Update or create data points
  container
    .selectAll('.data-point')
    .data(currentData)
    .join(
      (enter) =>
        enter
          .append('circle')
          .attr('class', 'data-point')
          .attr('cx', (d: Point) => scales.xScale(d.x))
          .attr('cy', (d: Point) => scales.yScale(d.y))
          .attr('r', 5)
          .attr('fill', 'steelblue')
          .attr('data-x', (d: Point) => d.x)
          .attr('data-y', (d: Point) => d.y),
      (update) =>
        update
          .attr('cx', (d: Point) => scales.xScale(d.x))
          .attr('cy', (d: Point) => scales.yScale(d.y))
          .attr('data-x', (d: Point) => d.x)
          .attr('data-y', (d: Point) => d.y),
      (exit) => exit.remove()
    );

  // Draw regression line if enabled
  if (showRegression && regression) {
    drawRegressionLine(container, regression, scales);
  } else {
    container.selectAll('.regression-line').remove();
  }
}

function drawRegressionLine(
  container: d3.Selection<SVGGElement, unknown, null, undefined>,
  regression: { slope: number; intercept: number },
  scales: Scales
): void {
  const x1 = scales.xScale.domain()[0];
  const y1 = regression.slope * x1 + regression.intercept;
  const x2 = scales.xScale.domain()[1];
  const y2 = regression.slope * x2 + regression.intercept;
  const data = [
    { x: x1, y: y1 },
    { x: x2, y: y2 },
  ];

  const existingLine = container.selectAll('.regression-line');

  if (existingLine.node()) {
    const existingData = existingLine.datum();
    if (compareData(existingData as Point[], data, 0.0001)) return;
  }

  existingLine.remove();
  const line = d3
    .line<Point>()
    .x((d) => scales.xScale(d.x))
    .y((d) => scales.yScale(d.y));

  container
    .append('path')
    .datum(data)
    .attr('d', line)
    .attr('class', 'regression-line')
    .attr('stroke', 'blue')
    .attr('stroke-width', 2)
    .attr('fill', 'none');
}

// ==================== NEW: Vertical line from point to regression ====================
export function createVerticalLineVNode(
  hoverPoint: Point,
  regressionY: number,
  scales: Scales
): VNode {
  return svg.line({
    attrs: {
      class: 'hover-vertical-line',
      x1: scales.xScale(hoverPoint.x),
      y1: scales.yScale(hoverPoint.y),
      x2: scales.xScale(hoverPoint.x),
      y2: scales.yScale(regressionY),
      stroke: 'red',
      'stroke-width': 1,
      'stroke-dasharray': '3,3',
      opacity: 0.7,
    },
  });
}

// ==================== NEW: Highlight hovered point ====================
export function createHoveredPointVNode(point: Point, scales: Scales): VNode {
  return svg.circle({
    attrs: {
      class: 'hovered-point-highlight',
      cx: scales.xScale(point.x),
      cy: scales.yScale(point.y),
      r: 8,
      fill: 'none',
      stroke: 'red',
      'stroke-width': 2,
    },
  });
}

// ==================== Temp line (while dragging) ====================
export function createTempLineVNode(
  tempPoints: Points,
  scales: Scales,
  isDragging: boolean
): VNode {
  if (!tempPoints.start || !tempPoints.end || !isDragging) {
    return svg.g();
  }

  return svg.line({
    attrs: {
      class: 'temp-line',
      x1: scales.xScale(tempPoints.start.x),
      y1: scales.yScale(tempPoints.start.y),
      x2: scales.xScale(tempPoints.end.x),
      y2: scales.yScale(tempPoints.end.y),
      stroke: 'grey',
      'stroke-width': 2,
      'stroke-dasharray': '5,5',
    },
  });
}

// ==================== Custom line (user-drawn, completed) ====================
export function createCustomLineVNode(
  finalPoints: Points,
  scales: Scales,
  isShow: boolean
): VNode {
  if (!finalPoints.start || !finalPoints.end || !isShow) {
    return svg.g();
  }

  // Extend the line to full chart width
  const x1 = finalPoints.start.x;
  const y1 = finalPoints.start.y;
  const x2 = finalPoints.end.x;
  const y2 = finalPoints.end.y;

  const m = (y2 - y1) / (x2 - x1);
  const b = y1 - m * x1;

  const xMin = scales.xScale.domain()[0];
  const yMin = m * xMin + b;
  const xMax = scales.xScale.domain()[1];
  const yMax = m * xMax + b;

  return svg.line({
    attrs: {
      class: 'custom-line',
      x1: scales.xScale(xMin),
      y1: scales.yScale(yMin),
      x2: scales.xScale(xMax),
      y2: scales.yScale(yMax),
      stroke: 'red',
      'stroke-width': 2,
    },
  });
}
