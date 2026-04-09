import xs from 'xstream';
import { Stream } from 'xstream';
import { svg, h } from '@cycle/dom';
import type { VNode } from '@cycle/dom';
import type { State } from './model';
import { createXAxisVNode, createYAxisVNode } from '../d3/axes';
import {
  createChartVNode,
  createTempLineVNode,
  createCustomLineVNode,
} from '../d3/graph';

const marginTop = 20;
const marginRight = 10;
const marginBottom = 30;
const marginLeft = 40;

export function view(state$: Stream<State>): Stream<VNode> {
  return state$.map((state) => {
    const chartHeight = state.height - marginTop - marginBottom;
    const xScale = state.scales.xScale;
    const yScale = state.scales.yScale;
    const scales = { x: xScale, y: yScale };

    return h('div', [
      h('h1', 'D3.js with Cycle.js'),
      svg(
        {
          attrs: {
            width: state.width,
            height: state.height,
          },
        },
        [
          svg.g(
            {
              attrs: {
                transform: `translate(${marginLeft}, ${marginTop})`,
                id: 'main_group',
              },
            },
            [
              svg.g(
                {
                  attrs: {
                    transform: `translate(0, ${chartHeight})`,
                  },
                },
                [createXAxisVNode(xScale)]
              ),
              svg.g(
                {
                  attrs: {
                    transform: 'translate(0, 0)',
                  },
                },
                [createYAxisVNode(yScale)]
              ),
              createChartVNode(state.datasets, scales),
              createTempLineVNode(state.tempPoints, scales, state.isDragging),
              createCustomLineVNode(
                state.finalPoints,
                scales,
                state.isShowCustomLine
              ),
            ]
          ),
        ]
      ),
    ]);
  });
}
