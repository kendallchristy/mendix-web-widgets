# Funnel Chart Pro

Funnel charts built on [Apache ECharts](https://echarts.apache.org), with the Hyper look by default: stages that narrow down, with the conversion between them. The widget draws only the chart; build cards and headline figures around it with ordinary Studio Pro widgets.

## Usage

1. Add the **Funnel Chart Pro** widget from the Charts category in the toolbox.
2. Pick a data source, a **Category** attribute that names each stage, and a **Value** attribute. Objects with the same category are combined with **Aggregation**.
3. Stages follow the data source's order by default, so sort the data source by stage. **Order** can sort them by value or name instead.

### Labels and conversion

Labels sit beside the stages by default and show the name, the value and the **Conversion**: each stage's share of the first stage, or of the stage before it. Inside labels suit wide funnels; their text turns dark on light stages.

### Colours

Stages are steps of one thing, so by default they are shades of one colour, lightening down the funnel. Set **Colours** to **A palette colour per stage** for distinct colours, or set the **Colour** attribute to fix a stage's colour.

### Interaction

**Tooltips** show each stage's value and conversion. **On click** runs an action with the stage's first object, and **Drilldown** splits a clicked stage by **Drilldown level 2**, then **Drilldown level 3**, with a breadcrumb to step back up.

### Styling

For dark mode, CSS design tokens, custom themes from the ECharts theme builder and the option override, see the [styling guide](../../../docs/charts/styling.md), which Studio Pro also opens from the widget's help link.

## Accessibility

Each chart includes a table of its stages and conversion rates for screen readers.
