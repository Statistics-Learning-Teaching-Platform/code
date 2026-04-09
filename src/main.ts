import { run } from '@cycle/run';
import { makeDOMDriver } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';
import xs, { Stream } from 'xstream';
import { h } from '@cycle/dom';

// Import Bootstrap CSS from local installation
import 'bootstrap/dist/css/bootstrap.min.css';
// Import custom styles
import './styles/custom.css';
import { Sidebar } from './components/Sidebar';
import { RegressionChart } from './components/RegressionChart';
import { StatisticsPanel } from './components/StatisticsPanel';
import type { Dataset } from './components/Sidebar';
import type { RegressionChartProps } from './components/RegressionChart/types';
import type { StatisticsPanelProps } from './components/StatisticsPanel/types';
import type { DOMSource, VNode } from '@cycle/dom';
import type { HTTPSource, RequestOptions } from '@cycle/http';

interface MainSources {
  DOM: DOMSource;
  HTTP: HTTPSource;
}

interface MainSinks {
  DOM: Stream<VNode>;
  HTTP: Stream<RequestOptions>;
}

const EMPTY_DATASET: Dataset = {
  id: 'loading',
  name: 'Loading dataset...',
  data: [],
};

function getDatasetTeachingNote(dataset: Dataset) {
  const notes: Record<string, { headline: string; prompt: string }> = {
    'positive-correlation': {
      headline: 'As x increases, y tends to increase as well.',
      prompt: 'Ask students to predict a positive slope before revealing the regression line.',
    },
    'negative-correlation': {
      headline: 'As x increases, y tends to decrease.',
      prompt: 'Use this set to reinforce the meaning of a negative slope.',
    },
    'no-correlation': {
      headline: 'There is no clear linear pattern in the points.',
      prompt: 'Discuss why a fitted line can still exist even when it explains little variation.',
    },
    'strong-linear': {
      headline: 'The points are tightly clustered around a line.',
      prompt: 'This is a good place to compare residuals and talk about high R-squared.',
    },
    'exponential-growth': {
      headline: 'The pattern bends upward instead of staying linear.',
      prompt: 'Use this set to show the limitation of fitting a straight line to nonlinear data.',
    },
  };

  return (
    notes[dataset.id] || {
      headline: 'Explore the scatterplot and compare your fitted line to the regression line.',
      prompt: 'Invite students to explain what the slope and residuals are telling them.',
    }
  );
}

function main(sources: MainSources): MainSinks {
  console.log(
    '[main] main() called - Sidebar + RegressionChart + StatisticsPanel composition'
  );

  // ==================== Sidebar Component ====================
  const sidebarProps$ = xs.of({
    datasetPaths: [
      '/data/positive-correlation.json',
      '/data/negative-correlation.json',
      '/data/no-correlation.json',
      '/data/strong-linear.json',
      '/data/exponential-growth.json',
    ],
  });

  const sidebarSinks = Sidebar({
    DOM: sources.DOM,
    HTTP: sources.HTTP,
    props: sidebarProps$,
  });

  const selectedDataset$ = sidebarSinks.selectedDataset.startWith(EMPTY_DATASET);

  // ==================== RegressionChart Component ====================
  // Merge clear signals: from manual button click + automatic on dataset change
  const clearSignal$ = xs.merge(
    sidebarSinks.clearCustomLine,
    sidebarSinks.datasetChange.mapTo(Date.now())
  );

  // Combine Sidebar sinks to create RegressionChart props
  const chartProps$ = xs
    .combine(selectedDataset$, sidebarSinks.toggleRegression)
    .map(([dataset, showRegression]): RegressionChartProps => {
      // Calculate xDomain and yDomain from dataset
      const data = dataset.data;
      let xMin = 0,
        xMax = 0,
        yMin = 0,
        yMax = 0;

      if (data.length > 0) {
        const xValues = data.map((d) => d.x);
        const yValues = data.map((d) => d.y);
        xMin = Math.min(...xValues);
        xMax = Math.max(...xValues);
        yMin = Math.min(...yValues);
        yMax = Math.max(...yValues);

        // Add padding to the domains (10% on each side)
        const xPadding = (xMax - xMin) * 0.1 || 1;
        const yPadding = (yMax - yMin) * 0.1 || 1;
        xMin -= xPadding;
        xMax += xPadding;
        yMin -= yPadding;
        yMax += yPadding;
      }

      return {
        width: 800,
        height: 600,
        datasets: dataset.data,
        xDomain: [xMin, xMax],
        yDomain: [yMin, yMax],
        showRegression: showRegression,
        clearLineSignal: clearSignal$.map((n: number): number | null => n),
      };
    });

  const chartSinks = RegressionChart({
    DOM: sources.DOM,
    props: chartProps$,
  });

  // ==================== StatisticsPanel Component ====================
  // Create props stream for StatisticsPanel from the dataset data
  const statsPanelProps$ = selectedDataset$.map(
    (dataset): StatisticsPanelProps => ({
      datasets: dataset.data,
    })
  );

  const statisticsPanelSinks = StatisticsPanel({
    DOM: sources.DOM,
    props: statsPanelProps$,
    customLine: chartSinks.customLine,
    regression: chartSinks.regression,
    pointHover: chartSinks.pointHover,
  });

  // ==================== Render ====================
  const vdom$ = xs
    .combine(sidebarSinks.DOM, chartSinks.DOM, statisticsPanelSinks.DOM, selectedDataset$)
    .map(([sidebar, chart, panel, dataset]) => {
      const teachingNote = getDatasetTeachingNote(dataset);

      return h('div.app-shell', {}, [
        h('div.app-container.container-fluid.py-4', {}, [
          h('div.hero-panel.mb-4', {}, [
            h('div.hero-copy', {}, [
              h('p.eyebrow.mb-2', 'Interactive Regression Teaching Site'),
              h('h1.hero-title.mb-3', 'Teach regression by letting students test ideas visually.'),
              h(
                'p.hero-text.mb-0',
                'Start with a dataset, ask students to predict the slope, then compare a hand-drawn line with the least-squares fit.'
              ),
            ]),
            h('div.hero-tips', {}, [
              h('div.tip-chip', 'Predict the sign of the slope'),
              h('div.tip-chip', 'Compare SSE values'),
              h('div.tip-chip', 'Use residuals to explain fit'),
            ]),
          ]),
          h('div.row.g-4.align-items-stretch', {}, [
            h(
              'div.col-12.col-xl-3',
              { style: { minWidth: '280px' } },
              [sidebar]
            ),
            h('div.col-12.col-xl-9', {}, [
              h('div.content-stack.d-flex.flex-column.gap-3', {}, [
                h('div.lesson-banner.mb-3', {}, [
                  h('div.lesson-meta', {}, [
                    h('div.lesson-label', 'Current dataset'),
                    h('h2.lesson-title.mb-1', dataset.name),
                    h('p.lesson-headline.mb-1', teachingNote.headline),
                    h('p.lesson-prompt.mb-0', teachingNote.prompt),
                  ]),
                  h('div.lesson-stats', {}, [
                    h('div.lesson-stat', {}, [
                      h('span.lesson-stat-label', 'Points'),
                      h('strong.lesson-stat-value', String(dataset.data.length)),
                    ]),
                    h('div.lesson-stat', {}, [
                      h('span.lesson-stat-label', 'Task'),
                      h('strong.lesson-stat-value', 'Fit and compare'),
                    ]),
                  ]),
                ]),
                h('div.chart-card', {}, [
                  h('div.chart-card-header', {}, [
                    h('h3.chart-card-title.mb-1', 'Scatterplot and fitted lines'),
                    h(
                      'p.chart-card-subtitle.mb-0',
                      'Draw directly on the chart to create a candidate model, then use the statistics panel to compare it with the regression line.'
                    ),
                  ]),
                  h(
                    'div.chart-wrapper.d-flex.align-items-center.justify-content-center',
                    { style: { minHeight: '0' } },
                    [chart]
                  ),
                ]),
                h('div.panel-wrapper', {}, [panel]),
              ]),
            ]),
          ]),
        ]),
      ]);
    });

  return {
    DOM: vdom$,
    HTTP: sidebarSinks.HTTP,
  };
}

// Run the application
run(main, {
  DOM: makeDOMDriver('#main-container'),
  HTTP: makeHTTPDriver(),
});
