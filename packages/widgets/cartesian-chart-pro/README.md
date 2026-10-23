# Cartesian Chart Pro

Line, area, bar, column, scatter and bubble charts, alone or combined, built on [Apache ECharts](https://echarts.apache.org) with the Hyper look by default. The widget draws only the chart: build cards, headline figures and lists around it with ordinary Studio Pro widgets.

## Usage

1. Add the **Cartesian Chart Pro** widget from the Charts category in the toolbox.
2. Add a series: pick a data source, the **X value** and **Y value** attributes, and a **Type**. Dates give a time axis, numbers a number axis, and anything else a category axis.
3. Add more series to compare or combine them. Series with the same **Stack** name stack; **Group by** splits one data source into a series per value.

### Interaction

- **Tooltips** show every series at the hovered point. **Tooltip text** on a series replaces its row with your own text template.
- **On click** runs an action with the clicked object (for an aggregated point, the first object behind it).
- **Drilldown**: Date drilldown goes from year to quarter, month, week and day; Category drilldown regroups a clicked X value by each series' **Drilldown level 2** and **Drilldown level 3** attributes. A breadcrumb beside the title steps back up, and On click runs at the last level.
- **Zoom** adds a slider or drag-and-scroll zoom for long time series.

### Loading and large data

The chart shows a placeholder until every series' data source has loaded completely, and it is never drawn from partial data. When the data reloads, the last chart stays on screen with a thin progress bar until the new data is in.

Series with more than 2,000 points are drawn the fast way: lines are downsampled to the pixels available, and bars and scatter points are drawn in one batch without glow, rounded corners or greyed-out points outside a highlight range. Five charts of 10,000 points each draw in about a second.

### Styling

The Chart style tab covers the theme, palette, lines, bars, highlight range, value labels, gridlines, legend, tooltip, size and animation. For dark mode, CSS design tokens, custom themes from the ECharts theme builder and the option override, see the [styling guide](../../../docs/charts/styling.md), which Studio Pro also opens from the widget's help link.

### Highlight range

**Highlight from** and **Highlight to** take X values (category names, numbers, or ISO dates such as `'2026-03-01'`). Points inside the range keep their colour and the rest turn grey; with **Label which points** set to **Ends of the highlight**, the two ends get value pills.

## Accessibility

Each chart includes a table of its data for screen readers, and ECharts' aria support describes the chart. Colour is never the only cue: multi-series charts show a legend, and the Hyper high-contrast palette is available for stricter contrast needs.
