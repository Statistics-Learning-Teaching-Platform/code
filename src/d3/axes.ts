import * as d3 from 'd3';
import { svg } from '@cycle/dom';
import type { ScaleLinear } from 'd3';
import type { VNode } from '@cycle/dom';

function drawXAxis(
  container: d3.Selection<SVGGElement, unknown, null, undefined>,
  scale: ScaleLinear<number, number>
): void {
  const existingAxis = container.select('#x-axis');
  if (existingAxis.node()) {
    if (
      existingAxis.attr('data-scale-range') === scale.range().toString() &&
      existingAxis.attr('data-scale-domain') === scale.domain().toString()
    ) {
      return;
    } else {
      existingAxis.remove();
    }
  }

  const axis = d3.axisBottom(scale);
  container
    .append('g')
    .call(axis)
    .attr('id', 'x-axis')
    .attr('data-scale-range', scale.range())
    .attr('data-scale-domain', scale.domain())
    .style('user-select', 'none')
    .style('pointer-events', 'none');
}

function drawYAxis(
  container: d3.Selection<SVGGElement, unknown, null, undefined>,
  scale: ScaleLinear<number, number>
): void {
  const existingAxis = container.select('#y-axis');
  if (existingAxis.node()) {
    if (
      existingAxis.attr('data-scale-range') === scale.range().toString() &&
      existingAxis.attr('data-scale-domain') === scale.domain().toString()
    ) {
      return;
    } else {
      existingAxis.remove();
    }
  }

  const axis = d3.axisLeft(scale);
  container
    .append('g')
    .call(axis)
    .attr('id', 'y-axis')
    .attr('data-scale-range', scale.range())
    .attr('data-scale-domain', scale.domain())
    .style('user-select', 'none')
    .style('pointer-events', 'none');
}

export function createXAxisVNode(scale: ScaleLinear<number, number>): VNode {
  // 使用 Cycle DOM 提供的 svg.g 助手创建 <g> 元素
  return svg.g({
    hook: {
      insert: (vnode: VNode) => {
        const g = d3.select(vnode.elm as SVGGElement);
        drawXAxis(g, scale);
      },
      update: (vnode: VNode) => {
        const g = d3.select(vnode.elm as SVGGElement);
        drawXAxis(g, scale);
      },
    },
  });
}

export function createYAxisVNode(scale: ScaleLinear<number, number>): VNode {
  return svg.g({
    hook: {
      insert: (vnode: VNode) => {
        const g = d3.select(vnode.elm as SVGGElement);
        drawYAxis(g, scale);
      },
      update: (vnode: VNode) => {
        const g = d3.select(vnode.elm as SVGGElement);
        drawYAxis(g, scale);
      },
    },
  });
}
