# Radial Bar Chart Pro

Radial bar charts built on [Apache ECharts](https://echarts.apache.org), with the Hyper look by default: one ring per category, each filled up to its value. They suit a few progress figures shown together, such as goals per team. The widget draws only the chart; build cards and headline figures around it with ordinary Studio Pro widgets.

## Usage

1. Add the **Radial Bar Chart Pro** widget from the Charts category in the toolbox.
2. Pick a data source, a **Category** attribute that names each ring, and a **Value** attribute. Objects with the same category are combined with **Aggregation**.
3. Set **Full ring at** to the value of a complete ring, for example `100` for percentages. Left empty, the largest value fills its ring.
4. Shape the rings on the Scale and shape tab: **Sweep** is how far a full ring goes round (270° by default, 360° closes the circle), and **Start angle** where it starts.

The largest values come first, on the outside. **Most rings** (5 by default) keeps the chart readable.

### Interaction

- Names and values sit at the start of the rings. With a closed circle there is no room there, so the legend names the rings instead.
- **Tooltips** show the value and its share of a full ring. **On click** runs an action with the ring's first object, and **Drilldown** works as on Pie Chart Pro.

### Styling

For dark mode, CSS design tokens, custom themes from the ECharts theme builder and the option override, see the [styling guide](../../../docs/charts/styling.md), which Studio Pro also opens from the widget's help link.

## Accessibility

Each chart includes a table of its data for screen readers, and every ring is named beside it or in the legend.
