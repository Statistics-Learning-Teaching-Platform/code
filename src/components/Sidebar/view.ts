import {
  div,
  h2,
  label,
  select,
  option,
  input,
  button,
  span,
  type VNode,
} from '@cycle/dom';
import { Stream } from 'xstream';
import type { SidebarState } from './types';

export function view(state$: Stream<SidebarState>): Stream<VNode> {
  return state$.map((state) =>
    div('.sidebar-shell.p-4.h-100', [
      // Title
      h2('.sidebar-title.h4.mb-3', 'Regression Studio'),

      div('.sidebar-intro.mb-4', [
        span(
          '.small.text-muted',
          'Use the controls below to compare your own fitted line against the least-squares regression line.'
        ),
      ]),

      // Dataset selection section
      div('.sidebar-section.mb-4.mt-4', [
        label(
          '.sidebar-label.form-label',
          { attrs: { for: 'dataset-select' } },
          'Select Dataset:'
        ),
        select(
          '#dataset-select.dataset-select.form-select',
          { attrs: { disabled: state.datasets.length === 0 || state.isLoading } },
          [
            state.isLoading
              ? option(
                  { attrs: { value: '', disabled: true, selected: true } },
                  'Loading datasets...'
                )
              : null,
            !state.isLoading && state.datasets.length === 0
              ? option(
                  { attrs: { value: '', disabled: true, selected: true } },
                  'No datasets available'
                )
              : null,
            ...state.datasets.map((dataset) =>
              option(
                {
                  attrs: {
                    value: dataset.id,
                    selected: dataset.id === state.selectedDataset,
                  },
                },
                dataset.name
              )
            ),
          ].filter(Boolean)
        ),
      ]),

      state.loadError
        ? div('.alert.alert-warning.py-2.px-3.small.mb-4', state.loadError)
        : null,

      // Regression toggle section
      div('.sidebar-section.mb-4.mt-4', [
        div('.form-check.form-switch', [
          input('#regression-toggle.regression-toggle.form-check-input', {
            attrs: {
              type: 'checkbox',
              checked: state.showRegression,
            },
          }),
          label(
            '.form-check-label',
            { attrs: { for: 'regression-toggle' } },
            'Show Regression Line'
          ),
        ]),
      ]),

      // Clear custom line button section
      div('.sidebar-section.mb-4.mt-4', [
        button(
          '.clear-custom-line.btn.btn-outline-secondary',
          { attrs: { type: 'button' } },
          'Clear Custom Line'
        ),
      ]),

      // Info section (optional)
      state.datasets.length > 0
        ? div('.sidebar-info.card.mt-3', [
            div('.card-body', [
              div('.info-item.mb-2', [
                span('.info-label.fw-bold', 'Selected: '),
                span(
                  '.info-value',
                  state.datasets.find((d) => d.id === state.selectedDataset)
                    ?.name || 'None'
                ),
              ]),
              div('.info-item', [
                span('.info-label.fw-bold', 'Data Points: '),
                span(
                  '.info-value',
                  String(
                    state.datasets.find((d) => d.id === state.selectedDataset)
                      ?.data.length || 0
                  )
                ),
              ]),
            ]),
          ])
        : null,

      div('.sidebar-guide.mt-4', [
        div('.guide-title.fw-semibold.mb-2', 'Try this in class'),
        div('.guide-step.small.text-muted', '1. Predict the slope before showing the model.'),
        div('.guide-step.small.text-muted', '2. Draw your own line and compare the SSE.'),
        div('.guide-step.small.text-muted', '3. Hover a point to discuss its residual.'),
      ]),
    ])
  );
}
