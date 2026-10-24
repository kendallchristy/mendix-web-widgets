# Range Chart Pro

Range charts built on [Apache ECharts](https://echarts.apache.org), with the Hyper look by default: floating bars or dumbbells that show where something starts and ends, such as a day's low and high temperature or a project phase. The widget draws only the chart; build cards and headline figures around it with ordinary Studio Pro widgets.

## Usage

1. Add the **Range Chart Pro** widget from the Charts category in the toolbox.
2. Pick a data source, a **Category** attribute that names each row, and **From** and **To** attributes. They can be numbers or dates; ends given the wrong way round are swapped.
3. Set **Group by** to draw several ranges per category side by side, one colour per group.
4. **Order** keeps the data source's order, or sorts by name, by earliest start or by longest range.

### Style and labels

**Style** draws floating bars, with a **Corner radius**, or dumbbells, two dots joined by a line, with a **Dot size**. **Direction** lays the ranges out across or up the chart. **Value labels** show the from and to values at the ends, or the length of the range, in plain text or a pill. Date ranges show their length in days, hours or minutes.

### Interaction

**Tooltips** show each range's ends and length; **Tooltip text** replaces them. **On click** runs an action with the clicked range's object.

### Styling

For dark mode, CSS design tokens, custom themes from the ECharts theme builder and the option override, see the [styling guide](../../../docs/charts/styling.md), which Studio Pro also opens from the widget's help link.

## Accessibility

Each chart includes a table of its ranges and their lengths for screen readers.
