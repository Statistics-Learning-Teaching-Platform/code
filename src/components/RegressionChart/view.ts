import type { Stream } from 'xstream';
import { svg, h } from '@cycle/dom';
import type { VNode } from '@cycle/dom';
import type { State } from './types';
import { createXAxisVNode, createYAxisVNode } from '../../d3/axes';
import {
  createChartVNode,
  createTempLineVNode,
  createCustomLineVNode,
  createVerticalLineVNode,
  createHoveredPointVNode,
} from '../../d3/graph';

export function view(state$: Stream<State>): Stream<VNode> {
  return state$.map((state) => {
    const {
      width,
      height,
      margins,
      scales,
      datasets,
      customLine,
      regression,
      showRegression,
      hover,
    } = state;
    const chartHeight = height - margins.top - margins.bottom;

    return h('div.regression-chart.card.shadow-sm', [
      // SVG chart
      svg(
        {
          attrs: {
            width: String(width),
            height: String(height),
            class: 'chart-svg',
          },
        },
        [
          // Main chart group
          svg.g(
            {
              attrs: {
                transform: `translate(${margins.left}, ${margins.top})`,
              },
            },
            [
              // X Axis
              svg.g(
                {
                  attrs: { transform: `translate(0, ${chartHeight})` },
                },
                [createXAxisVNode(scales.xScale)]
              ),

              // Y Axis
              svg.g({ attrs: { transform: 'translate(0, 0)' } }, [
                createYAxisVNode(scales.yScale),
              ]),

              // Scatter plot + regression line (controlled by showRegression)
              createChartVNode(
                datasets,
                scales,
                showRegression,
                showRegression ? regression : undefined
              ),

              // Vertical line from hovered point to visible line (regression or custom)
              hover.showVerticalLine && hover.point && hover.lineY !== null
                ? createVerticalLineVNode(hover.point, hover.lineY, scales)
                : svg.g(),

              // Highlight hovered point
              hover.point
                ? createHoveredPointVNode(hover.point, scales)
                : svg.g(),

              // Custom line (user-drawn)
              createCustomLineVNode(
                customLine.finalPoints,
                scales,
                customLine.isShowCustomLine
              ),

              // Temp line (while dragging)
              createTempLineVNode(
                customLine.tempPoints,
                scales,
                customLine.isDragging
              ),
            ]
          ),
        ]
      ),
    ]);
  });
}
