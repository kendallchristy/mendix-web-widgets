# Heatmap Chart Pro

Heatmaps built on [Apache ECharts](https://echarts.apache.org), with the Hyper look by default: a grid of cells coloured by value, such as busy hours per weekday, or a calendar of days, such as activity per day of the year. The widget draws only the chart; build cards and headline figures around it with ordinary Studio Pro widgets.

## Usage

1. Add the **Heatmap Chart Pro** widget from the Charts category in the toolbox.
2. Pick a data source, a **Column** attribute and a **Row** attribute, and a **Value** attribute. Objects in the same cell are combined with **Aggregation**; with **Count**, no value is needed.
3. Text columns and rows keep the order they first appear in, so sort the data source to order them. Numbers and dates are sorted.
4. For a calendar, set **Layout** to **Calendar** and pick a date as the **Column**. Each year gets its own row of weeks.

### Cells and colours

**Show values** writes each cell's value, in dark or light text to suit its colour, when the cell is big enough. **Gap between cells** and **Corner radius** shape the cells. The colour **Scale** runs from green through amber to coral, through shades of the first palette colour, or through your own colours; **Reverse** swaps its ends, and **Scale minimum** and **Scale maximum** fix them. **Show the scale** adds a colour bar under the chart.

### Interaction

**Tooltips** show each cell's column, row and value; **Tooltip text** replaces them for cells that hold a single object. **On click** runs an action with the clicked cell's first object.

### Styling

For dark mode, CSS design tokens, custom themes from the ECharts theme builder and the option override, see the [styling guide](../../../docs/charts/styling.md), which Studio Pro also opens from the widget's help link.

## Accessibility

Each chart includes a table of its cells for screen readers.
