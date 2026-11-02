# Kanban Board Pro

A Kanban board for Mendix 11: drag cards between columns, reorder cards, and reorder the columns themselves. Built on [Pragmatic drag and drop](https://atlassian.design/components/pragmatic-drag-and-drop), so the browser draws the dragged card and the board doesn't re-render while it moves. Columns with hundreds of cards stay smooth.

## Setup

Choose where the columns come from with **Columns from**.

### Columns from an enumeration

The simplest board: one column per value of an enumeration on the card entity, in the enumeration's order.

1. Choose the **Card data source** and the widgets for each card in **Card content**.
2. Set **Column attribute** to the enumeration, for example Status.
3. Set **Card sort attribute**: Decimal is best, Integer or Long also work.
4. Add an **On card move** nanoflow that saves the move (see below). Studio Pro shows an error until it's set.

### Saving a move

Mendix doesn't let widgets change attributes of objects from a list data source, so the widget works out where the card goes and On card move saves it. Mendix passes each action variable to the nanoflow parameter with the same name and type, so give the nanoflow these parameters:

| Parameter      | Type    | Value                                                            |
| -------------- | ------- | ---------------------------------------------------------------- |
| (the card)     | Entity  | The card that moved.                                             |
| `newSortValue` | Decimal | Its new sort value.                                              |
| `toColumn`     | String  | The key of the column it's in now.                               |
| `fromColumn`   | String  | Optional. The key of the column it came from.                    |
| `moved`        | Boolean | Optional. True for the dragged card, false for cards renumbered. |
| `newPosition`  | Integer | Optional. Its place in the column, from 1.                       |

With enumeration columns the nanoflow is one **Change object** and a commit:

- Sort attribute = `$newSortValue` (with Integer or Long, `round($newSortValue)`).
- Column attribute = the enumeration value for `$toColumn`, for example `if $toColumn = 'Doing' then MyModule.Status.Doing else if $toColumn = 'Done' then MyModule.Status.Done else MyModule.Status.Backlog`. `$toColumn` is the enumeration key (its name, not its caption).
- Commit: Yes.

### Columns from a data source

Columns are objects of their own, for example Stage, and each card has an association to its column.

1. Choose the **Column data source**, its **Title**, and optionally a **Column key** (a unique name or code; defaults to the title).
2. Choose the **Card data source**, **Card content** and **Card sort attribute**.
3. Set **Column association** to the card's association to its column.
4. Add an **On card move** nanoflow with the parameters above. It sets the sort attribute to `$newSortValue`; when `$fromColumn` differs from `$toColumn`, it retrieves the column whose key is `$toColumn` and sets the association; then it commits.

The card stays in its new column while the nanoflow runs and the data refreshes. If the column isn't changed within 10 seconds, the card goes back.

To let users reorder columns, set a **Column sort attribute** and an **On column move** nanoflow with a Decimal parameter `newSortValue` that sets the column's sort attribute to it and commits. Columns are then dragged by their header.

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

**Can drag** (an expression per card) locks cards that shouldn't move. **On card click** runs when a card is clicked outside its own buttons, links and inputs.

## Events

| Event          | Variables                                              | Runs                                                                     |
| -------------- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| On card move   | moved, newSortValue, fromColumn, toColumn, newPosition | For every card whose column or sort value changed. Positions start at 1. |
| On column move | moved, newSortValue, newPosition                       | For every column whose sort value changed.                               |
| On card click  | none                                                   | When a card is clicked, or Enter is pressed on it.                       |

With a Decimal sort attribute a move normally changes only the dragged card. With Integer or Long, cards may be renumbered to make room; they get `moved` = false.

`fromColumn` and `toColumn` are the column keys: the enumeration key with enumeration columns, the Column key (or title) with data source columns.

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
