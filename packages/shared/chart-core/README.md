# Chart core

Shared code for the chart widgets: the ECharts setup, the Hyper light and dark themes, CSS design tokens, number and date formatting, aggregation, drilldown helpers, and the React components every chart renders with (`EChart`, `Breadcrumb`, `ChartStatus`, `ScreenReaderTable`).

Widgets bundle it into their `.mpk`; it isn't released on its own. Each widget registers only the ECharts chart types it draws, so unused chart code is left out of its bundle.

## Styling

How the styling layers, CSS design tokens, dark mode and the ECharts theme builder fit together is in [docs/charts/styling.md](../../../docs/charts/styling.md). The Hyper theme files in `docs/charts/themes` are generated from `src/theme`; a unit test fails when they drift, and `UPDATE_THEME_FILES=1 pnpm test` rewrites them.

## Tests

Jest can't load ECharts' ES modules, so `jest.widget.js` maps `echarts/*` to the stand-ins in `src/__mocks__/echarts`. Chart widgets use it as their Jest config; `src/__mocks__/echarts/core.ts` exposes the charts it created, with the options and themes they were given.
