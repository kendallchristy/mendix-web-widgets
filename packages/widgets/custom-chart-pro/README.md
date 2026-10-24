# Custom Chart Pro

Any chart [Apache ECharts](https://echarts.apache.org) can draw, such as sankey, treemap, sunburst, graph or map, from an ECharts option with Mendix data. It has the Hyper look and dark mode of the other chart widgets.

## Usage

1. Add the **Custom Chart Pro** widget from the Charts category in the toolbox.
2. Write the chart's [ECharts option](https://echarts.apache.org/en/option.html) as JSON in **Option JSON**.
3. Add a **Data set** for each list of Mendix objects the chart needs: a name, a data source, and up to six fields, each an attribute with the name the option uses for it.
4. Point the option at the data: series read a data set with `"datasetId": "Sales"`, and strings such as `"$rows:Sales"`, `"$column:Sales.value"`, `"$tree:Budget"` or `"$nodes:Flows"` are replaced with the data.

The [Custom Chart Pro guide](../../../docs/charts/custom-chart.md), which Studio Pro opens from the widget's help link, explains each placeholder with examples, along with clicks and maps.

### Interaction

A data set's **On click** runs with the clicked row's object, for series drawn from that data set's rows.

### Maps

Set **Map name** and **Map GeoJSON URL** to draw a map series or a `geo` component. The widget loads the map before the chart draws.

### Styling

Theme, palette, background, figures font and dark mode work as on the other chart widgets; see the [styling guide](../../../docs/charts/styling.md). This widget registers every ECharts chart type, so its bundle is the largest of the chart widgets.

## Accessibility

Each chart includes a table of its data sets' rows for screen readers.
