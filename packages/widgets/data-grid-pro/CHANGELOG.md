# @kendallchristy/data-grid-pro

## 0.2.0

### Minor Changes

- [#18](https://github.com/kendallchristy/mendix-web-widgets/pull/18) [`4315d3a`](https://github.com/kendallchristy/mendix-web-widgets/commit/4315d3ad995d997d1072b5affaf0a33040ad9b7c) Thanks [@kendallchristy](https://github.com/kendallchristy)! - Bulk actions now act on every selected row: selected rows stay selected while scrolling, sorting (unless Keep selection is off) and refreshing, the selection clears after a bulk action has run and the data has refreshed (Clear after bulk action), and Escape clears it.

- [#27](https://github.com/kendallchristy/mendix-web-widgets/pull/27) [`361912d`](https://github.com/kendallchristy/mendix-web-widgets/commit/361912d2b36b12890af797d8a407b228c316acf9) Thanks [@kendallchristy](https://github.com/kendallchristy)! - Add Excel export: an Export button that downloads the visible columns and every row matching the search, filters and sort as .xlsx (typed numbers, dates and booleans, bold frozen header with filter buttons), with a per-column Export value, all or selected rows, a row maximum, progress with Cancel, and On before export and On after export actions.

- [#25](https://github.com/kendallchristy/mendix-web-widgets/pull/25) [`ae5e0ae`](https://github.com/kendallchristy/mendix-web-widgets/commit/ae5e0aef5d38b72093a2598d55faa36d3a448c85) Thanks [@kendallchristy](https://github.com/kendallchristy)! - Add header filters (text, number with comparisons and ranges, date range, enumeration and yes/no, picked from the column's attribute) with active filters shown as chips in the toolbar, and select all across pages, which fetches every row in the data source in batches with progress and a Cancel button.

- [#24](https://github.com/kendallchristy/mendix-web-widgets/pull/24) [`148b6ff`](https://github.com/kendallchristy/mendix-web-widgets/commit/148b6ff56d00ec6fcf01f4c83f6ac91f71097301) Thanks [@kendallchristy](https://github.com/kendallchristy)! - Add column reordering (drag a header, or use the move buttons in the column menu, saved with the user's settings, plus a Reset columns button) and a toolbar search box that looks in text, enumeration and number columns marked Can search.

## 0.1.0

### Minor Changes

- [#3](https://github.com/kendallchristy/mendix-web-widgets/pull/3) [`ef6942b`](https://github.com/kendallchristy/mendix-web-widgets/commit/ef6942bf5f0f3c28203479c047d5b26db872ad92) Thanks [@kendallchristy](https://github.com/kendallchristy)! - First release of Data Grid Pro: a high-density data grid for Mendix 11 with row virtualization, windowed loading, association columns, expandable row details, selection, column resizing, hiding and sorting, and saved user settings.
