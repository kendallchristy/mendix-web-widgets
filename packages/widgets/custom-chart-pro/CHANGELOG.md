# @kendallchristy/custom-chart-pro

## 0.2.0

### Minor Changes

- [#12](https://github.com/kendallchristy/mendix-web-widgets/pull/12) [`c4e3549`](https://github.com/kendallchristy/mendix-web-widgets/commit/c4e3549409265d012b1a5747c1dc24bdcd3d927a) Thanks [@kendallchristy](https://github.com/kendallchristy)! - First release of Bubble Cluster Chart Pro, packed bubbles with value pills and optional groups, and Custom Chart Pro, any ECharts chart from option JSON with Mendix data sets, on Apache ECharts with the Hyper theme and live dark mode.

### Patch Changes

- [#14](https://github.com/kendallchristy/mendix-web-widgets/pull/14) [`8efe7b9`](https://github.com/kendallchristy/mendix-web-widgets/commit/8efe7b91523dbe9fa1f4042e3694cf7ea7eba1b7) Thanks [@kendallchristy](https://github.com/kendallchristy)! - Charts recover when ECharts fails to apply an update, instead of crashing the page with "Cannot read properties of undefined (reading 'get')". An option that can't be drawn at all shows ECharts' message in place of the chart. A dark mode or theme change no longer brings back the data the chart first showed.

- [#14](https://github.com/kendallchristy/mendix-web-widgets/pull/14) [`8efe7b9`](https://github.com/kendallchristy/mendix-web-widgets/commit/8efe7b91523dbe9fa1f4042e3694cf7ea7eba1b7) Thanks [@kendallchristy](https://github.com/kendallchristy)! - `"$rows:…"` now works for scatter, line, bar and other series on axes: each row becomes a list of values, with the fields named so `encode` can use them. A series that names an axis the option doesn't have shows which series and axis, in place of the chart.
