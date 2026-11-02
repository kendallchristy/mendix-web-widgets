# Sortable List Pro

Reorder a list, row or grid of objects by dragging, and move them between lists. Built for Mendix 11 on [Pragmatic drag and drop](https://atlassian.design/components/pragmatic-drag-and-drop), so the browser draws the dragged item and the page doesn't re-render while it moves. Lists of thousands of objects stay smooth.

## Setup

1. Give the entity a **sort attribute**: Decimal is best, Integer or Long also work.
2. Add Sortable List Pro to a page and choose its **Data source**. The widget sorts the objects by the sort attribute itself, smallest first.
3. Put the widgets for each object in **Content**.
4. Pick the **Sort attribute**.
5. Add an **On move** nanoflow or microflow that commits the object. The widget sets the new sort value; the action saves it.

With a Decimal attribute a move normally changes only the dragged object: it gets the midpoint of its new neighbours (for example 2.5 between 2 and 3). With Integer or Long, when there's no whole number between the neighbours, the objects after it are renumbered as far as needed, and On move runs for each of them with **Moved** = false.

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

When an object arrives:

1. The widget gives it a sort value for its new place.
2. With **Value on receive**, it writes a value to an attribute, for example Status = `'Done'`. Each list then shows only the objects with its own value, so a few lists over one data source make a simple board.
3. **On receive** runs on this list for the object. Use it to set an association to this list's owner and commit; widgets can't change associations themselves.
4. **On remove** runs on the list it came from.

**List name** identifies a list to the other list's actions (`From list`, `To list`). **Can drop here** turns drops on or off, for example when a list is full.

The object stays on screen in its new list while the actions run and the data sources refresh, so nothing jumps back.

## Events

| Event         | Variables                         | Runs                                                             |
| ------------- | --------------------------------- | ---------------------------------------------------------------- |
| On move       | Moved, Old position, New position | For every object whose sort value changed. Positions start at 1. |
| On receive    | From list, New position           | For an object dropped here from another list.                    |
| On remove     | To list, Old position             | For an object dragged from this list to another one.             |
| On drag start | none                              | When a drag starts.                                              |

**Can drag** (an expression per object) locks objects that shouldn't move. Objects whose sort attribute is read-only for the user can't be dragged either.

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
- Mendix doesn't let widgets set associations. Moving between lists that differ by an association needs On receive.
