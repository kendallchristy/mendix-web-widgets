# Kanban Board Pro

A Kanban board for Mendix 11: drag cards between columns, reorder cards, and reorder the columns themselves. Built on [Pragmatic drag and drop](https://atlassian.design/components/pragmatic-drag-and-drop), so the browser draws the dragged card and the board doesn't re-render while it moves. Columns with hundreds of cards stay smooth.

## Setup

Choose where the columns come from with **Columns from**.

### Columns from an enumeration

The simplest board: one column per value of an enumeration on the card entity, in the enumeration's order.

1. Choose the **Card data source** and the widgets for each card in **Card content**.
2. Set **Column attribute** to the enumeration, for example Status.
3. Set **Card sort attribute**: Decimal is best, Integer or Long also work.
4. Add an **On card move** nanoflow that commits the card.

When a card moves, the widget sets the enumeration and the sort value; On card move saves them.

### Columns from a data source

Columns are objects of their own, for example Stage, and each card has an association to its column.

1. Choose the **Column data source**, its **Title**, and optionally a **Column key** (a unique name or code; defaults to the title).
2. Choose the **Card data source**, **Card content** and **Card sort attribute**.
3. Set **Column association** to the card's association to its column.
4. Add an **On card move** nanoflow. Mendix doesn't let widgets change associations, so the nanoflow sets it: when **Moved** is true and **From column** differs from **To column**, retrieve the column whose key is To column, set the association, and commit.

The card stays in its new column while the nanoflow runs and the data refreshes. If the association isn't changed within 10 seconds, the card goes back.

To let users reorder columns, set a **Column sort attribute** and an **On column move** nanoflow that commits the column. Columns are then dragged by their header.

## Columns

| Setting           | What it does                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| Header content    | Extra widgets in each header, such as a menu button. Data source columns only.                             |
| Footer content    | Widgets under each column's cards, such as an Add card button. Data source columns only.                   |
| Card limit        | A work-in-progress limit per column. A full column refuses drops and its count turns amber, red when over. |
| Collapsible       | A button folds a column to a narrow strip. Cards can still be dropped on it. Remembered per browser.       |
| Show card count   | The count beside each title, as `3/5` with a limit.                                                        |
| Empty column text | Shown in a column with no cards.                                                                           |

## Cards

All cards load in one request (up to **Maximum cards**, 2,000 by default) and are grouped into columns in the browser. With **Height** set to Fixed or Fill, each column scrolls on its own and long columns draw only the cards on screen.

**Can drag** (an expression per card) locks cards that shouldn't move. Cards whose sort attribute is read-only for the user can't be dragged either. **On card click** runs when a card is clicked outside its own buttons, links and inputs.

## Events

| Event          | Variables                                   | Runs                                                                     |
| -------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| On card move   | Moved, From column, To column, New position | For every card whose column or sort value changed. Positions start at 1. |
| On column move | Moved, New position                         | For every column whose sort value changed.                               |
| On card click  | none                                        | When a card is clicked, or Enter is pressed on it.                       |

With a Decimal sort attribute a move normally changes only the dragged card. With Integer or Long, cards may be renumbered to make room; they get **Moved** = false.

From column and To column are the column keys: the enumeration key with enumeration columns, the Column key (or title) with data source columns.

## Keyboard and screen readers

Tab to a card. Space picks it up (Enter too, unless On card click is set), Up and Down move it within a column, Left and Right move it to the next column, Space drops it and Escape cancels. The board scrolls to follow.

Screen readers hear each step. The texts are on the **Accessibility** tab, with the placeholders `[item]`, `[column]`, `[position]` and `[count]` (square brackets, because Studio Pro reserves braces). **Card name** sets how each card is named.

## Look

- **Column width**, **Height** (grow, fixed or fill) and **Card style** (a card, or plain to leave the look to the content).
- **Show the drop position as**: cards making room (default) or a line.
- **Animation**: Normal (200 ms), Fast (120 ms) or Off. Users who turn on reduced motion get none.
- **Drag preview**: the card as it looks, or a compact card.
- Dark mode follows the `dark-mode` class on any ancestor, such as `<body>`.

The colors are CSS variables on `.kbp` (`--kbp-column-bg`, `--kdnd-accent`, `--kdnd-surface` and others), so a theme can override them.
