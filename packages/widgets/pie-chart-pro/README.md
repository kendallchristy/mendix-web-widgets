# Pie Chart Pro

Pie, donut, half donut and rose charts built on [Apache ECharts](https://echarts.apache.org), with the Hyper look by default. The widget draws only the chart: build cards, headline figures and lists around it with ordinary Studio Pro widgets.

## Usage

1. Add the **Pie Chart Pro** widget from the Charts category in the toolbox.
2. Pick a data source, a **Category** attribute that names each slice, and a **Value** attribute. Objects with the same category are combined with **Aggregation** (sum by default; Count needs no Value).
3. Choose a **Shape** on the Shape and labels tab: donut (the default, with the total in the hole), pie or half donut. **Rose** gives every slice the same angle and shows the value by its length instead.

Pies are for part-to-whole at a glance. Keep them to a handful of slices: past **Most slices** (6 by default) the smallest fold into one **Other** slice. To compare close values, bars in Cartesian Chart Pro read better.

### Interaction

- **Tooltips** show the slice's value and share. **Tooltip text** replaces them for a slice that stands for a single object.
- **On click** runs an action with the clicked slice's first object.
- **Drilldown** splits a clicked slice by **Drilldown level 2**, then **Drilldown level 3**. A breadcrumb in the top-right corner steps back up, and On click runs at the last level.

### Colours

Slices take the palette in order, and Other is grey. To keep a category's colour whatever the data, set the **Colour** attribute to a colour per object, for example `#8038D0`.

### Styling

For dark mode, CSS design tokens, custom themes from the ECharts theme builder and the option override, see the [styling guide](../../../docs/charts/styling.md), which Studio Pro also opens from the widget's help link.

## Accessibility

Each chart includes a table of its data for screen readers, and ECharts' aria support describes the chart. Labels or the legend name every slice, so colour is never the only cue.
