# @kendallchristy/sortable-list-pro

## 0.2.0

### Minor Changes

- [#28](https://github.com/kendallchristy/mendix-web-widgets/pull/28) [`e78c038`](https://github.com/kendallchristy/mendix-web-widgets/commit/e78c0384f9426f9eaac0e327c70c8b40660882eb) Thanks [@kendallchristy](https://github.com/kendallchristy)! - Save moves through nanoflows. Mendix never lets a widget change attributes of list objects, so On move, On move to another list, On card move and On column move now receive the new sort value (and the target column or list value) as action variables, and the nanoflow saves them. Items are no longer locked when the sort attribute is read-only, and Studio Pro shows an error when a save action is missing.

- [#28](https://github.com/kendallchristy/mendix-web-widgets/pull/28) [`e78c038`](https://github.com/kendallchristy/mendix-web-widgets/commit/e78c0384f9426f9eaac0e327c70c8b40660882eb) Thanks [@kendallchristy](https://github.com/kendallchristy)! - Add Sortable List Pro (reorder a list, row or grid by dragging, move objects between lists in a group, windowed for thousands of objects) and Kanban Board Pro (cards between columns from an enumeration or a data source, column reordering, work-in-progress limits, collapsible columns), both on a shared engine built on Pragmatic drag and drop with keyboard moves, screen reader announcements and dark mode.
