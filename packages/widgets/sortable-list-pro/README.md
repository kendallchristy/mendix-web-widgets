# Sortable List Pro

Reorder a list, row or grid of objects by dragging, and move them between lists. Built for Mendix 11 on [Pragmatic drag and drop](https://atlassian.design/components/pragmatic-drag-and-drop), so the browser draws the dragged item and the page doesn't re-render while it moves. Lists of thousands of objects stay smooth.

## Setup

1. Give the entity a **sort attribute**: Decimal is best, Integer or Long also work.
2. Add Sortable List Pro to a page and choose its **Data source**. The widget sorts the objects by the sort attribute itself, smallest first.
3. Put the widgets for each object in **Content**.
4. Pick the **Sort attribute**.
5. Add an **On move** nanoflow that saves the move (see below). Studio Pro shows an error until it's set.

### Saving a move

Mendix doesn't let widgets change attributes of objects from a list data source, so the widget works out the new sort value and your nanoflow saves it. Mendix passes each action variable to the nanoflow parameter with the same name and type, so give On move these parameters:

| Parameter      | Type    | Value                                                      |
| -------------- | ------- | ---------------------------------------------------------- |
| (the object)   | Entity  | The object that moved.                                     |
| `newSortValue` | Decimal | Its new sort value.                                        |
| `moved`        | Boolean | True for the dragged object, false for objects renumbered. |
| `oldPosition`  | Integer | Optional. Its place before the move, from 1.               |
| `newPosition`  | Integer | Optional. Its place after the move, from 1.                |

The nanoflow needs two steps: **Change object** to set the sort attribute to `$newSortValue` (with an Integer or Long attribute, `round($newSortValue)`), then **Commit**.

With a Decimal attribute a move normally changes only the dragged object: it gets the midpoint of its new neighbours (for example 2.5 between 2 and 3). With Integer or Long, when there's no whole number between the neighbours, the objects after it are renumbered as far as needed, and On move runs for each of them with `moved` = false.

The object stays in its new place while the nanoflow runs and the data source refreshes, so nothing jumps back.

Objects with an empty sort attribute go to the end. The first time one of them is moved, it and anything around it that needs a value get one.

## Layout

| Setting                 | What it does                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout                  | Vertical list, horizontal row, or grid of tiles.                                                                                                        |
| Gap (px)                | Space between items.                                                                                                                                    |
| Minimum tile width (px) | Grid only. Tiles share each row equally and are never narrower than this.                                                                               |
| Height                  | _Grow with content_, _Fixed_ or _Fill the parent container_. Fixed and Fill scroll inside the widget and draw only the items on screen (from 60 items). |
| Drag with               | _The whole item_, _A grip icon_, or _A custom handle_: any element in the content with the class `dnd-handle`.                                          |
| Empty content           | Widgets shown when the list has no objects. Items from other lists can be dropped on it.                                                                |
| Objects per load        | How many objects load at first; more load when the user scrolls to the end.                                                                             |

Buttons, links and inputs inside the content keep working: a drag never starts from them.

## Moving between lists

Lists on the same page with the same **Group** exchange objects. They must show the same entity.

Each list can show its own data source, or several lists can share one data source and split it with **List attribute** and **List value**: each list then shows only the objects whose attribute matches its value, for example Status = `'Done'`. A few lists over one data source make a simple board.

When an object moves to another list, **On move to another list** runs on the list it came from (Mendix only runs a list's actions for its own objects). Its nanoflow saves the move:

1. Set the sort attribute to `$newSortValue`.
2. Set the list attribute from `$toValue` (the target's List value), or set an association using `$toList` (the target's **List name**).
3. Commit.

Give it parameters named `toList` and `toValue` (String), `newSortValue` (Decimal), and optionally `oldPosition` and `newPosition` (Integer). Studio Pro shows an error when a list has a Group but no On move to another list.

Objects in the target list that are renumbered to make room run that list's On move. **Can drop here** turns drops on or off, for example when a list is full.

The object stays on screen in its new list while the nanoflow runs and the data sources refresh, so nothing jumps back. If Mendix doesn't move it within 10 seconds, it goes back.

## Events

| Event                   | Variables                                               | Runs                                                                 |
| ----------------------- | ------------------------------------------------------- | -------------------------------------------------------------------- |
| On move                 | moved, newSortValue, oldPosition, newPosition           | For every object in this list whose place changed.                   |
| On move to another list | toList, toValue, newSortValue, oldPosition, newPosition | For an object dragged from this list into another list of the group. |
| On drag start           | none                                                    | When a drag starts.                                                  |

**Can drag** (an expression per object) locks objects that shouldn't move.

## Keyboard and screen readers

Every item can be focused with Tab. Space or Enter picks it up, the arrow keys move it (Left and Right as well in a grid), Space or Enter drops it, and Escape cancels. The list scrolls to follow.

Screen readers hear each step. The texts are on the **Accessibility** tab, with the placeholders `[item]`, `[position]` and `[count]` (square brackets, because Studio Pro reserves braces). **Item name** sets how each object is named.

## Look

- **Show the drop position as**: the other items making room (default) or a line.
- **Animation**: Normal (200 ms), Fast (120 ms) or Off. Users who turn on reduced motion get none.
- **Drag preview**: the item as it looks, or a compact card. Windows fades drag images wider than 280 px, so wide items read better as a compact card.
- Dark mode follows the `dark-mode` class on any ancestor, such as `<body>`.

The colors are CSS variables on `.slp` (`--kdnd-accent`, `--kdnd-surface`, `--kdnd-border` and others), so a theme can override them.

## Limits

- The widget sorts in the browser, so the sort attribute must be one the data source can read. Database, XPath and association data sources all work.
- Mendix doesn't let widgets change attributes or associations of list objects, so every move is saved by a nanoflow.
