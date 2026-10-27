# @kendallchristy/cartesian-chart-pro

## 0.2.0

### Minor Changes

- [#4](https://github.com/kendallchristy/mendix-web-widgets/pull/4) [`d063050`](https://github.com/kendallchristy/mendix-web-widgets/commit/d06305059ffb5a65c295b9c5dc80f477c0156846) Thanks [@kendallchristy](https://github.com/kendallchristy)! - First release of Cartesian Chart Pro: line, area, bar, column, scatter and bubble charts on Apache ECharts, with the Hyper theme, live dark mode, drilldown, highlight ranges, custom themes from the ECharts theme builder, and fast drawing of large series.

### Patch Changes

- [#11](https://github.com/kendallchristy/mendix-web-widgets/pull/11) [`11f0c68`](https://github.com/kendallchristy/mendix-web-widgets/commit/11f0c68d8424027e35a0d3ee0f4350bad4b184d6) Thanks [@kendallchristy](https://github.com/kendallchristy)! - Dots are sized to their bars, and bars too thin for dots stay solid. Bubbles at the edges are no longer cut off. Daily date axes name the month ("Mar 5") instead of showing bare day numbers.

- [#14](https://github.com/kendallchristy/mendix-web-widgets/pull/14) [`8efe7b9`](https://github.com/kendallchristy/mendix-web-widgets/commit/8efe7b91523dbe9fa1f4042e3694cf7ea7eba1b7) Thanks [@kendallchristy](https://github.com/kendallchristy)! - Charts recover when ECharts fails to apply an update, instead of crashing the page with "Cannot read properties of undefined (reading 'get')". An option that can't be drawn at all shows ECharts' message in place of the chart. A dark mode or theme change no longer brings back the data the chart first showed.

- [#9](https://github.com/kendallchristy/mendix-web-widgets/pull/9) [`6f4469f`](https://github.com/kendallchristy/mendix-web-widgets/commit/6f4469f4e8229480e8e6d65589473fc4b624d055) Thanks [@kendallchristy](https://github.com/kendallchristy)! - Figures font now also sets the font of the axis labels, not only of value labels and tooltips.

- [#10](https://github.com/kendallchristy/mendix-web-widgets/pull/10) [`1e2b8ea`](https://github.com/kendallchristy/mendix-web-widgets/commit/1e2b8eaf2cd0a726aa93aee4386735f5293464b1) Thanks [@kendallchristy](https://github.com/kendallchristy)! - Pill tooltips now fit their value instead of keeping the card tooltip's minimum width.
