# Styling the chart widgets

Every chart widget in this repo shares one styling system. It starts from the Hyper look, follows your app's light and dark mode, and lets you restyle charts app-wide, per chart, or with a theme you design in the [ECharts theme builder](https://echarts.apache.org/en/theme-builder.html).

This is the page Studio Pro opens from a chart widget's help link.

## How the layers combine

Each layer overrides the one before it.

1. **Theme** (Chart style tab): Hyper, Hyper light, Hyper dark, or Custom. Custom uses the Theme JSON on the Advanced tab, with Hyper filling in anything it leaves out.
2. **CSS design tokens** in your app's theme SCSS. Set them once and every chart in the app follows.
3. **Chart style properties** on each widget: palette, line curve, glow, bar style, gridlines, legend, tooltip and so on.
4. **Option override** (Advanced tab): ECharts option JSON merged over everything else, for anything the properties don't cover.

## Dark mode

The Hyper theme follows a CSS custom property, so it works with whatever class your app uses for dark mode. Add one line under that class:

```scss
.my-dark-mode-class {
    --hc-mode: dark;
}
```

Charts watch `<html>` and `<body>` for class changes and switch theme live, with no reload. Choose Hyper light or Hyper dark on a widget to pin it to one mode.

## CSS design tokens

Set any of these in your theme SCSS, globally or on a container to scope them to part of a page.

| Token                            | What it sets                                          |
| -------------------------------- | ----------------------------------------------------- |
| `--hc-mode`                      | `light` or `dark`                                     |
| `--hc-color-1` to `--hc-color-8` | Series colours, in order (used when Palette is Theme) |
| `--hc-font-family`               | Titles, legends and tooltips                          |
| `--hc-font-figures`              | Numbers: axis labels, value labels and tooltip values |
| `--hc-text-color`                | Titles and tooltip values                             |
| `--hc-label-color`               | Axis labels, legend text and subtitles                |
| `--hc-grid-color`                | Gridlines                                             |
| `--hc-muted-color`               | Marks outside a highlight range                       |
| `--hc-surface`                   | Chart background when Background is Theme surface     |

For example, to brand every chart with three company colours:

```scss
:root {
    --hc-color-1: #5b2be0;
    --hc-color-2: #ff7a00;
    --hc-color-3: #00a3a3;
}
```

## Design a theme in the ECharts theme builder

1. Download [hyper-light.theme-builder.json](themes/hyper-light.theme-builder.json) (or [the dark version](themes/hyper-dark.theme-builder.json)).
2. Open the [ECharts theme builder](https://echarts.apache.org/en/theme-builder.html), choose **Import**, and pick that file. The builder now starts from the Hyper look.
3. Change colours, fonts, axes and so on. The preview updates as you go.
4. Choose **Download**, then the **JSON** version, and copy it.
5. In Studio Pro, set the widget's **Theme** to **Custom** and paste the JSON into **Theme JSON** on the Advanced tab.

To give each customer or user their own theme, store the JSON in an attribute and use **Theme JSON (dynamic)**; it merges over the static Theme JSON.

The ready-to-paste Hyper themes are in [hyper-light.json](themes/hyper-light.json) and [hyper-dark.json](themes/hyper-dark.json).

## Option override

The option override is [ECharts option JSON](https://echarts.apache.org/en/option.html), merged last. Objects merge key by key, and a list of objects such as `series` merges item by item, so you can restyle one series without repeating its data.

Make the first series dashed and start the value axis at zero:

```json
{
    "series": [{ "lineStyle": { "type": "dashed" } }],
    "yAxis": { "min": 0 }
}
```

An object applied to a list applies to every item, so `"yAxis": { "min": 0 }` sets both axes when a chart has a right-hand axis.

## The Hyper look

| Token              | Light                                                                           | Dark                                                                            |
| ------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Series colours     | `#8038D0` `#F87800` `#0860F8` `#48B840` `#BD16CE` `#D99A00` `#E5466F` `#0F8FC4` | `#9458E8` `#E06C00` `#3D7DF5` `#3DA336` `#C43BD6` `#B88200` `#E0506F` `#1590C8` |
| Out-of-focus marks | `#C9CCD6`                                                                       | `#3A4060`                                                                       |
| Text, labels       | `#111318`, `#8A8F9C`                                                            | `#F2F4F8`, `#8A91AD`                                                            |
| Gridlines          | `#EEF0F4`                                                                       | `#232842`                                                                       |
| Fonts              | Inter for text, a monospaced font for figures                                   | Same                                                                            |

Both palettes keep neighbouring series distinguishable for colour-blind readers. In light mode the orange, green and amber are below 3:1 contrast against white, so charts always pair colour with a legend, labels or tooltips, and every chart includes a data table for screen readers. **Hyper high-contrast** is a stricter palette for apps that need it.
