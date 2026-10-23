# Gauge Chart Pro

Gauges and progress meters for a single value, built on [Apache ECharts](https://echarts.apache.org), with the Hyper look by default. The widget draws only the gauge; build the card around it with ordinary Studio Pro widgets.

## Usage

1. Add the **Gauge Chart Pro** widget from the Charts category in the toolbox, usually inside a data view.
2. Set **Value** to an expression, typically an attribute such as `$currentObject/Progress`. **Minimum** and **Maximum** default to 0 and 100.
3. Optionally set a **Target**, drawn as a marker on the arc, and a **Caption** shown under the value.
4. Pick a **Shape** (a 240° arc, a half circle or a full ring) and an **Indicator**: a progress arc, a needle, or both.

### Bands

Add **Bands** to mark ranges on the track, such as behind, on track and ahead. Each band runs from the end of the previous one (the first from the minimum) up to its **Up to** value. Set **Colour** to **Colour of the band the value is in** to colour the progress arc by its band. Give each band a **Label**: the tooltip shows it, so the band never relies on colour alone.

### Number format

The usual number format applies to the value, target and range. **Show as percentage** shows the value as a share of the range instead.

### Styling

For dark mode, CSS design tokens, custom themes from the ECharts theme builder and the option override, see the [styling guide](../../../docs/charts/styling.md), which Studio Pro also opens from the widget's help link.

## Accessibility

The gauge includes a table of its value, target, band and range for screen readers.
