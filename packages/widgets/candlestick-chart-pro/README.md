# Candlestick Chart Pro

Candlestick and OHLC charts built on [Apache ECharts](https://echarts.apache.org), with the Hyper look by default: a price's open, high, low and close per period, with optional volume bars and moving averages. The widget draws only the chart; build cards and headline figures around it with ordinary Studio Pro widgets.

## Usage

1. Add the **Candlestick Chart Pro** widget from the Charts category in the toolbox.
2. Pick a data source with one object per period, and the **Date**, **Open**, **High**, **Low** and **Close** attributes. Periods are sorted by date.
3. Set **Volume** to add volume bars under the prices; **Volume height** sets their share of the chart.

### Style

**Style** draws filled candles or OHLC bars. Rising periods use the theme's up colour (blue) and falling ones its down colour (coral); **Rising colour** and **Falling colour** override them, and so do the `--hc-up-color` and `--hc-down-color` design tokens. **Moving averages** takes periods such as `20, 50` and draws a line for each.

### Zoom and interaction

**Zoom** lets users drag and scroll through long histories, use a slider, or both. **Tooltips** show the open, high, low, close with the change, the moving averages and the volume of the hovered period; **Tooltip text** replaces them. **On click** runs an action with the clicked period's object. Above 2,000 periods ECharts draws candles in its faster large mode.

### Styling

For dark mode, CSS design tokens, custom themes from the ECharts theme builder and the option override, see the [styling guide](../../../docs/charts/styling.md), which Studio Pro also opens from the widget's help link.

## Accessibility

Each chart includes a table of its prices and volumes for screen readers.
