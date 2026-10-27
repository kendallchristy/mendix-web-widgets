# Custom Chart Pro

Custom Chart Pro draws anything [Apache ECharts](https://echarts.apache.org/en/option.html) can: sankey, treemap, sunburst, graph, parallel, boxplot, maps and the rest. You write the ECharts option as JSON, and the widget fills in your Mendix data, applies the Hyper theme and dark mode, and runs your actions on click.

This is the page Studio Pro opens from the widget's help link. For themes, dark mode and CSS design tokens, see the [styling guide](styling.md).

## Option JSON

**Option JSON** is an [ECharts option](https://echarts.apache.org/en/option.html) as JSON: double-quoted keys, no comments and no functions. The [ECharts examples](https://echarts.apache.org/examples/en/index.html) are a good starting point: copy an example's option, drop its `data`, and point it at your data sets as below. **Option JSON (dynamic)** takes an option from an attribute or expression and merges it over Option JSON, for example to switch a series type at runtime.

The widget adds the Hyper look under your option, so anything your option says wins:

- The theme's colours, fonts, axes and tooltip, as on every chart widget.
- Rounded, gapped tiles for treemaps and sunbursts, soft gradient links for sankeys, and surface-coloured outlines for pies and graphs.

## Data sets

Each **Data set** has a **Name**, a **Data source** and up to six **Fields**. A field is an attribute plus the name your option uses for it. Dates stay dates, decimals become numbers, and enumerations show their captions.

Every data set becomes an ECharts dataset whose `id` is its name, with one row per object. Series read it with `datasetId` and `encode`:

```json
{
    "xAxis": { "type": "category" },
    "yAxis": {},
    "series": [{ "type": "bar", "datasetId": "Sales", "encode": { "x": "month", "y": "value" } }]
}
```

Series that don't take datasets, such as sankey and treemap, use placeholders instead. A placeholder is a string anywhere in the option that the widget replaces with data:

| Placeholder             | Becomes                                                                                                                                                                                                                            | For                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `"$rows:Sales"`         | The rows. Series on axes (line, bar, scatter and the like) get each row as a list of values, with the fields named so `encode` can use them. Other series get objects, one key per field: `[{ "month": "Jan", "value": 2100 }, …]` | Scatter points, sankey and graph links, pie slices, any series `data` |
| `"$column:Sales.value"` | One field's values: `[2100, 2250, …]`                                                                                                                                                                                              | `xAxis.data`, a simple series' `data`                                 |
| `"$tree:Budget"`        | A tree built from the `name`, `parent` and `value` fields. Rows whose parent isn't found are top-level.                                                                                                                            | Treemap, sunburst, tree                                               |
| `"$nodes:Flows"`        | The distinct names in the `source` and `target` fields, each in the next palette colour                                                                                                                                            | Sankey and graph nodes                                                |

Data set names may use letters, digits and underscores. A placeholder that names a data set or field that doesn't exist shows an error in place of the chart, so typos are caught straight away.

### Examples

A scatter of two fields from a Sales data set with `Revenue` and `Target` fields:

```json
{
    "xAxis": { "type": "value", "name": "Revenue" },
    "yAxis": { "type": "value", "name": "Target" },
    "series": [{ "type": "scatter", "data": "$rows:Sales", "encode": { "x": "Revenue", "y": "Target" } }]
}
```

A sankey from a Flows data set with `source`, `target` and `value` fields:

```json
{
    "tooltip": { "trigger": "item" },
    "series": [{ "type": "sankey", "data": "$nodes:Flows", "links": "$rows:Flows" }]
}
```

A treemap from a Budget data set with `name`, `parent` and `value` fields:

```json
{
    "tooltip": {},
    "series": [{ "type": "treemap", "data": "$tree:Budget", "roam": false }]
}
```

A sunburst of the same data:

```json
{
    "series": [{ "type": "sunburst", "data": "$tree:Budget", "radius": ["15%", "95%"], "label": { "minAngle": 12 } }]
}
```

## Clicks

A data set's **On click** runs with the clicked row's object, for series drawn from that data set's rows: through `datasetId` or `datasetIndex`, `"$rows:…"` or `"$tree:…"`. Sankey and graph links aren't clickable this way, since a click there reports the node.

## Maps

To draw a map series or a `geo` component, put the map's GeoJSON somewhere the app serves it, for example in your theme's `resources` folder, and set **Map name** and **Map GeoJSON URL**. The widget loads the map once per page before the chart draws, and the option refers to it by name:

```json
{
    "series": [{ "type": "map", "map": "world", "data": "$rows:Countries" }]
}
```

Studio Pro can't load the app's files, so the design-mode preview shows a note instead of the map.

## Empty data and errors

When every data set is empty, the chart shows the **No data message**. A chart without data sets draws whatever its option holds. Invalid JSON, a placeholder that names something missing, or a series on axes the option doesn't have (say `yAxisIndex: 1` with one `yAxis`) shows the problem in place of the chart. So does any other option ECharts can't draw, with ECharts' own message, and Studio Pro flags invalid JSON, unnamed fields and duplicate data set names before you run the app.

## Accessibility

Each chart includes a table of its data sets' rows for screen readers. Describe the chart in your option's `aria` settings when its shape carries meaning the table can't.
