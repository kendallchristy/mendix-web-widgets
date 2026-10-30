# Data Grid Pro

A fast, high-density data grid for Mendix 11. It is built for lists of thousands to hundreds of thousands of rows: only the rows on screen are in the page, and only the rows around them are loaded.

## Features

- **Row virtualization.** About 30 rows are in the page at any time, however long the list is.
- **Windowed loading.** The grid loads three pages around the rows on screen and moves that window as you scroll, so jumping to the middle of 100,000 rows loads one window, not everything above it.
- **Association columns.** Show many related objects in one cell as pills, loaded in one request per window (see below).
- **Cell styles.** Text, colored badges and progress bars, plus custom widgets per cell. A column can widen on hover to show more detail.
- **Expandable rows.** Put widgets in _Row details_ and rows open a panel below them, like an accordion.
- **Selection.** Single or multi selection, with shift-click ranges, select all (including rows that aren't loaded), and bulk actions in the toolbar.
- **Search.** One search box in the toolbar that looks in the columns you choose.
- **Header filters.** A filter under each column header that fits its attribute, with active filters shown as chips.
- **Column reordering.** Users drag headers, or use the column menu, to change the column order.
- **User settings.** Sort, column order, widths, hidden columns and density, saved in the browser or in an attribute.
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

### Search box

Turn on **Search box** on the Toolbar tab to show one search field in the toolbar. It looks in every column with **Can search** on (the default) that shows an attribute:

- Text attributes match when they contain the typed text, ignoring case.
- Enumeration attributes match when their caption contains the text.
- Number attributes match when the text is that number, so "1200" or "1,200" finds 1200.

Booleans, dates, dynamic text, custom content and related objects columns are skipped. Searching starts once typing pauses, or right away on Enter. Escape or the × clears it. The search runs in the database, on top of the data source's own constraints.

### Header filters

Turn on **Header filters** in the Columns group to add a row of filters under the column headers. Each column that shows an attribute and has **Can filter** on (the default) gets the filter that fits its type:

| Attribute type         | Filter                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| String                 | Contains the typed text, ignoring case.                                                    |
| Integer, Long, Decimal | A number (`12`), a comparison (`>100`, `<=3.5`) or a range (`10..20`, both ends included). |
| Date and time          | A From and To date, whole days.                                                            |
| Enumeration            | Pick one or more values.                                                                   |
| Boolean                | Any, Yes or No.                                                                            |

Filters combine with each other and with the search box: a row must match all of them. Each active filter shows as a chip in the toolbar; its × removes it, and **Clear filters** removes them all. Filters run in the database on top of the data source's own constraints, and they last for the page visit.

### Column order

With **Can reorder columns** on (the default), users drag a header left or right to move the column. The column menu also has move buttons for keyboard users and a **Reset columns** button that brings back the Studio Pro order, widths and hidden columns. The order is saved with the user's other settings. The first column in the user's order is the pinned one.

### Bulk actions

Set **Selection** to Single or Multi and place buttons in **Bulk actions**. They replace the toolbar widgets while rows are selected, next to an "N selected" label and a Clear button.

To act on the selected rows, have a button call a microflow or nanoflow with a parameter of the grid's entity: a list for Multi selection, a single object for Single selection. In the button's call settings, pass the grid's selection as that parameter (Studio Pro lists it under the grid's name and maps it automatically when it's the only match). This works from any button on the page, not only from Bulk actions.

| Setting                     | Effect                                                                                                                                                                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Keep selection**          | On (default): rows stay selected when the user sorts, searches or filters. Off: sorting, searching or filtering clears the selection. Rows always stay selected while scrolling and when the data refreshes, so the action gets every row the user picked. |
| **Clear after bulk action** | On (default): once a Bulk actions button has run and the grid's data has refreshed, the selection is cleared. Actions that change no data, like an export, leave it as it is.                                                                              |

Escape on a focused row also clears the selection.

### Selecting every row

The header checkbox selects the loaded rows. With **Select all pages** on (the default) and more rows in the data source, the bulk actions bar then offers **Select all N**. It fetches the rows in batches of 500 with a progress bar and a Cancel button, then selects them all, so a bulk action gets every row. **Select all maximum** (default 50,000) caps how many rows it takes; above that the link reads **Select first N**. Bulk action buttons are hidden while it runs.

### Loading and height

- **Virtual scrolling** (default) loads rows as you scroll. Give the grid a fixed height, or let it fill its container.
- **Pages** shows one page at a time with Previous and Next buttons.

## Performance

Measured with the demo app in `packages/demos/data-grid-pro-demo`, which runs the widget against a mocked Mendix API with 120 ms of latency, in headless Chromium with software rendering. Real browsers with a GPU are faster.

| Rows    | First rows | Wheel scroll, average frame | Fling, average frame | Rows in the page |
| ------- | ---------- | --------------------------- | -------------------- | ---------------- |
| 20,000  | 0.38 s     | 17 ms                       | 22 ms                | 31               |
| 100,000 | 0.76 s     | 30 ms                       | 37 ms                | 31               |

Run it with `pnpm --filter @kendallchristy/data-grid-pro-demo bench -- --rows 20000`.

## Development

```sh
pnpm --filter @kendallchristy/data-grid-pro dev     # build and watch; set MX_PROJECT_PATH to copy the .mpk into a Mendix app
pnpm --filter @kendallchristy/data-grid-pro-demo dev  # run the demo app with generated data
pnpm --filter @kendallchristy/data-grid-pro test
```

The demo checks rendering and speed only. Test every change in a Mendix 11 app too, since the demo's mock doesn't cover Studio Pro or the real data API.
