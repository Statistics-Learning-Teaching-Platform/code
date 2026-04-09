import { div, h4, span, small } from '@cycle/dom';
import type { Stream } from 'xstream';
import type { VNode } from '@cycle/dom';
import type { State } from './types';

/**
 * View for StatisticsPanel Component
 *
 * Pure function that transforms state to VNode.
 * Displays SSE and residual information.
 *
 * @param state$ - State stream
 * @returns Virtual DOM stream
 */
export function view(state$: Stream<State>): Stream<VNode> {
  return state$.map((state) => {
    const { sse, hover, datasets, regression, customLine } = state;

    // Format SSE value (fixed to 4 decimal places)
    const formattedSSE = sse.value.toFixed(4);
    const pointCount = String(datasets.length);

    // Line type display
    const lineTypeDisplay =
      sse.lineType === 'regression'
        ? 'Regression Line'
        : sse.lineType === 'custom'
        ? 'Custom Line'
        : 'No Line';

    // Line type badge class
    const lineTypeBadge =
      sse.lineType === 'regression'
        ? 'bg-success'
        : sse.lineType === 'custom'
        ? 'bg-danger'
        : 'bg-secondary';

    const formatSigned = (value: number | null) => {
      if (value === null) return '--';
      return `${value >= 0 ? '+' : '-'} ${Math.abs(value).toFixed(3)}`;
    };

    const formatEquation = (slope: number | null, intercept: number | null) => {
      if (slope === null || intercept === null) return 'Not available yet';
      return `y = ${slope.toFixed(3)}x ${formatSigned(intercept)}`;
    };

    return div('.statistics-panel.card.shadow-sm', [
      // Title
      h4('.statistics-title', 'Statistics'),

      div('.stats-grid.mb-3', [
        div('.metric-card', [
          span('.metric-label', 'Points'),
          span('.metric-value', pointCount),
        ]),
        div('.metric-card', [
          span('.metric-label', 'Active SSE'),
          span('.metric-value', formattedSSE),
        ]),
        div('.metric-card', [
          span('.metric-label', 'R-squared'),
          span(
            '.metric-value',
            regression.available && regression.rSquared !== null
              ? regression.rSquared.toFixed(4)
              : '--'
          ),
        ]),
      ]),

      // SSE Section
      div('.sse-section', [
        div('.stat-row', [
          span('.stat-label', 'Current comparison'),
          span(`.badge.${lineTypeBadge}`, lineTypeDisplay),
        ]),
        div('.stat-row', [
          span('.stat-label', 'Sum of Squared Errors (SSE)'),
          span('.stat-value', formattedSSE),
        ]),
      ]),

      div('.equation-section.mb-3', [
        div('.equation-card.mb-2', [
          span('.stat-label', 'Regression equation'),
          span('.equation-value', formatEquation(regression.slope, regression.intercept)),
        ]),
        div('.equation-card', [
          span('.stat-label', 'Your line'),
          span('.equation-value', formatEquation(customLine.slope, customLine.intercept)),
        ]),
      ]),

      div('.residual-section', [
        div('.d-flex.flex-row.align-items-center.flex-wrap', [
          span('.stat-label.me-2', 'Hover:'),
          hover.point !== null &&
          hover.residual !== null &&
          hover.lineY !== null &&
          hover.point.x !== undefined &&
          hover.point.y !== undefined
            ? div([
                span(
                  '.stat-value.me-2',
                  `(${hover.point.x.toFixed(2)}, ${hover.point.y.toFixed(2)})`
                ),
                small('.text-muted.mx-2', '|'),
                span('.stat-label.me-1', 'Res:'),
                span('.stat-value.me-2', hover.residual.toFixed(4)),
                small('.text-muted.mx-2', '|'),
                span('.stat-label.me-1', 'Y hat:'),
                span('.stat-value', hover.lineY.toFixed(4)),
              ])
            : span('.stat-value.text-muted', 'Hover over a point'),
        ]),
      ]),

      div('.teaching-note.mt-3', [
        small(
          '.text-muted',
          sse.lineType === 'custom'
            ? 'Your hand-drawn line is active. Compare its SSE with the regression line to discuss why least squares matters.'
            : 'The regression line minimizes the total squared residuals for this dataset.'
        ),
      ]),
    ]);
  });
}
