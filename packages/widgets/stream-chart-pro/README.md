# Stream Chart Pro

Stream graphs built on [Apache ECharts](https://echarts.apache.org), with the Hyper look by default: flowing layers that show how groups rise and fall over time, such as sales per channel. The widget draws only the chart; build cards and headline figures around it with ordinary Studio Pro widgets.

## Usage

1. Add the **Stream Chart Pro** widget from the Charts category in the toolbox.
2. Pick a data source, a **Date** attribute (numbers such as week numbers work too), a **Group** attribute and a **Value** attribute. Each group becomes one stream.
3. **Period** adds up dates per day, week, month, quarter or year; **Aggregation** decides how they combine.
4. **Most groups** keeps the largest groups and folds the rest into one muted **Other** stream.

### Labels and axis

**Name the streams** writes each name at the start of its stream; turn it off and the legend appears instead. **Date format** sets the axis labels, for example `{MMM} {yyyy}`.

### Interaction

**Tooltips** list every stream at the hovered moment, largest first.

### Styling

For dark mode, CSS design tokens, custom themes from the ECharts theme builder and the option override, see the [styling guide](../../../docs/charts/styling.md), which Studio Pro also opens from the widget's help link.

## Accessibility

Each chart includes a table of every stream's values per moment for screen readers.
