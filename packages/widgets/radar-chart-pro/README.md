# Radar Chart Pro

Radar charts built on [Apache ECharts](https://echarts.apache.org), with the Hyper look by default: one shape per series across several measures, for comparing profiles such as products or teams. The widget draws only the chart; build cards and headline figures around it with ordinary Studio Pro widgets.

## Usage

1. Add the **Radar Chart Pro** widget from the Charts category in the toolbox.
2. Add a **Series** for each shape. Pick its data source, a **Measure** attribute that names each spoke and a **Value** attribute. Objects with the same measure are combined with **Aggregation**.
3. Each measure is scaled to its own largest value, rounded up. **Scale maximum** gives every measure the same scale instead, for example 100 for scores.

### Shape and labels

**Shape** draws polygon or circular rings, and **Rings** sets how many. **Area fill** shades each shape; **Line width** and **Markers** set its outline and points. **Value labels** write each value at its point, which reads best with one series. Give a series a **Colour** to override the palette.

### Interaction

**Tooltips** list every measure of the hovered shape.

### Styling

For dark mode, CSS design tokens, custom themes from the ECharts theme builder and the option override, see the [styling guide](../../../docs/charts/styling.md), which Studio Pro also opens from the widget's help link.

## Accessibility

Each chart includes a table of every series' values per measure for screen readers.
