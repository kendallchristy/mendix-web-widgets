# Bubble Cluster Chart Pro

Packed bubbles built on [Apache ECharts](https://echarts.apache.org), with the Hyper look by default. Each bubble's area shows its value, so the biggest items stand out at a glance, and the bubbles can cluster by group. The widget draws only the chart: build cards, headline figures and lists around it with ordinary Studio Pro widgets.

## Usage

1. Add the **Bubble Cluster Chart Pro** widget from the Charts category in the toolbox.
2. Pick a data source, a **Category** attribute that names each bubble, and a **Value** attribute. Objects with the same category are combined with **Aggregation** (sum by default; Count needs no Value).
3. Optionally set a **Group** attribute. Bubbles then cluster by group, one colour per group, and the legend names the groups.

The bubbles are packed to fill the chart, largest in the middle, and spread out to suit a wide or tall chart. Past **Most bubbles** (30 by default) the smallest fold into one **Other** bubble.

### Bubbles and labels

**Bubble style** is a glossy gradient (the default), solid, or tinted with an outline. **Gap between bubbles** and **Gap between groups** are in pixels, and **Group outlines** draws a dashed circle around each group with its name above.

**Label shows** the name and value (the default), the name and percentage, just one of them, or nothing. Labels only appear inside bubbles big enough for them, and long names are cut short with an ellipsis; the tooltip names every bubble. **Value style** shows values in a pill or as plain text.

### Interaction

- **Tooltips** show the bubble's value and share, and its group. **Tooltip text** replaces them for a bubble that stands for a single object.
- **On click** runs an action with the clicked bubble's first object.
- **Drilldown** splits a clicked bubble by **Drilldown level 2**, then **Drilldown level 3**. A breadcrumb in the top-right corner steps back up, and On click runs at the last level.

### Colours

Bubbles take the palette in order, or their group's colour, and Other is grey. To keep a category's colour whatever the data, set the **Colour** attribute or **Colour expression**, for example to `#8038D0`.

### Styling

For dark mode, CSS design tokens, custom themes from the ECharts theme builder and the option override, see the [styling guide](../../../docs/charts/styling.md), which Studio Pro also opens from the widget's help link.

## Accessibility

Each chart includes a table of its data for screen readers, with every bubble's name, group, value and share.
