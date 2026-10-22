# Data Grid Pro

A fast, high-density data grid for Mendix 11. It is built for lists of thousands to hundreds of thousands of rows: only the rows on screen are in the page, and only the rows around them are loaded.

## Features

- **Row virtualization.** About 30 rows are in the page at any time, however long the list is.
- **Windowed loading.** The grid loads three pages around the rows on screen and moves that window as you scroll, so jumping to the middle of 100,000 rows loads one window, not everything above it.
- **Association columns.** Show many related objects in one cell as pills, loaded in one request per window (see below).
- **Cell styles.** Text, colored badges and progress bars, plus custom widgets per cell. A column can widen on hover to show more detail.
- **Expandable rows.** Put widgets in _Row details_ and rows open a panel below them, like an accordion.
- **Selection.** Single or multi selection, with shift-click ranges, select all, and bulk actions in the toolbar.
- **User settings.** Sort, column widths, hidden columns and density, saved in the browser or in an attribute.
- **Keyboard.** Arrow keys, Page Up and Page Down, Home and End move between cells. Enter runs the row action or opens the details, and Space selects.

## Usage

1. Add Data Grid Pro to a page and choose a data source.
2. Add columns. For each column, choose what it shows:
    - **Attribute**: an attribute of the row, or of an object over an association.
    - **Dynamic text**: a text template.
    - **Custom content**: any widgets.
    - **Related objects**: many related objects as pills (see below).
3. Optionally set the cell style (text, badge or progress), alignment, width, and whether users can sort, resize or hide the column.

### Showing many associated objects in one cell

There are two ways, depending on how the data is modeled.

| Model                                             | Column setup                                                                                                                                                                             | Requests                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| The row has a reference set to the related entity | _Show_ Attribute, and pick an attribute over the reference set, for example `Competitor_Tag/Tag/Name`.                                                                                   | Mendix fetches the values with the rows. |
| The related entity has a reference to the row     | _Show_ Related objects. Set _Related data source_ to the related entity, _Association to row_ to the reference that points back at the row, and pick a caption and, optionally, a color. | One request for each loaded window.      |

Either way a cell shows the first three objects and a "+N" chip. Hovering the cell lists them all.

### Expandable rows

Place widgets in **Row details** to make rows expandable. The widgets get the row's object, so they can show anything about it.

| Setting                | Effect                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------- |
| **Expand on**          | _Chevron only_ (default), or _Row click_ to open a row by clicking anywhere on it. |
| **One open at a time** | Opening a row closes the row that was open before.                                 |

Clicks on buttons, links and inputs inside a row, and anywhere inside the open details, don't toggle the row. If the row also has a single-click _On click action_, both happen on the same click, so Studio Pro warns about it. A double-click action works alongside row-click expanding.

### Loading and height

- **Virtual scrolling** (default) loads rows as you scroll. Give the grid a fixed height, or let it fill its container.
- **Pages** shows one page at a time with Previous and Next buttons.

## Performance

Measured with the demo app in `packages/demos/data-grid-pro-demo`, which runs the widget against a mocked Mendix API with 120 ms of latency, in headless Chromium with software rendering. Real browsers with a GPU are faster.

| Rows   | First rows | Wheel scroll, average frame | Fling, average frame | Rows in the page |
| ------ | ---------- | --------------------------- | -------------------- | ---------------- |
| 20,000 | 0.38 s     | 17 ms                       | 22 ms                | 31               |

Run it with `pnpm --filter @kendallchristy/data-grid-pro-demo bench -- --rows 20000`.

## Development

```sh
pnpm --filter @kendallchristy/data-grid-pro dev     # build and watch; set MX_PROJECT_PATH to copy the .mpk into a Mendix app
pnpm --filter @kendallchristy/data-grid-pro-demo dev  # run the demo app with generated data
pnpm --filter @kendallchristy/data-grid-pro test
```

The demo checks rendering and speed only. Test every change in a Mendix 11 app too, since the demo's mock doesn't cover Studio Pro or the real data API.
