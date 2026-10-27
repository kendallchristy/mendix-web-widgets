# Toast Pro

Toast notifications for Mendix 11. Drop the widget anywhere on a page, in a data view or in a list view: its texts, expressions and actions use the object around it (or the page parameters when it sits directly on the page). It closes itself after a number of milliseconds from an expression, runs actions before and after every step, and can hold buttons or any widgets you like.

Every Toast Pro on a page shares one stack per screen corner, so toasts from different widgets line up instead of overlapping.

## Setup

1. Add Toast Pro to a page, data view or list view.
2. Fill in a **Title** and/or **Message** on **General**. `[seconds]` in a text shows the seconds left.
3. Choose when it shows with **Show toast**:

| Show toast                       | Shows the toast                                                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| On load                          | When the widget appears: when the page opens, or when Studio Pro's visibility settings make the widget visible.                                      |
| When an expression is true       | Each time **Show when** turns from false to true.                                                                                                    |
| When a Boolean attribute is true | Each time **Show attribute** turns true. The widget sets it back to false when the toast closes, so a microflow or nanoflow can show it again later. |

**Close when** closes the toast as soon as an expression is true, for example when a background job is done.

## Closing

**Timing › Close after (ms)** is an Integer expression: `5000` closes after five seconds, `$Settings/ToastSeconds * 1000` reads it from data, and empty or `0` keeps the toast open until it is closed. The countdown pauses while the pointer is on the toasts, while focus is inside one and while the browser tab is hidden. A thin bar shows the time left.

Users can close a toast with the X, by pressing Escape while it has focus, or by swiping it sideways.

## Events

| Event           | Runs                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| On before show  | Before the toast appears. The toast waits until it finishes (at most 10 seconds).                    |
| On show         | When the toast appears.                                                                              |
| On click        | When the toast itself is clicked. **Close on click** closes it too.                                  |
| On timeout      | When the time runs out.                                                                              |
| On dismiss      | When the user closes it with the X, a swipe or Escape.                                               |
| On before close | Before the toast leaves, whatever closed it. The toast waits until it finishes (at most 10 seconds). |
| On close        | After the toast is gone, whatever closed it.                                                         |

**Close reason attribute** (String or Enumeration) gets why the toast closed before On before close runs: `Timeout`, `Dismissed`, `Button`, `Click`, `Content`, `Condition` or `Replaced`. For an enumeration, use these as the keys; reasons the enumeration doesn't list are skipped.

## Buttons and custom content

**Buttons** adds buttons in the toast, each with a caption, a style (Primary, Secondary or Link), an action, a visible expression and **Close after click**. `Undo ([seconds])` makes a counting Undo button.

**Custom content** adds a drop zone for any widgets, below the message or instead of it. A clicked element with the class `toast-pro-close` closes the toast, so a normal Mendix button in the drop zone can run its action and close the toast: give the button that class.

## Loading toasts

While **Timing › Busy** is true, the toast shows a spinner and doesn't count down. Pair it with **Variant from data** (an expression returning `'success'`, `'info'`, `'warning'`, `'error'` or `'neutral'`) and texts that read the same object, and one toast can say "Exporting…" and then "Export ready".

## Stacking

- **Position**: one of six corners and edges. On phones toasts always use the full width.
- **Stacking**: _Stacked_ tucks older toasts behind the newest and fans them out on hover; _Always expanded_ lists them.
- **Most visible**: toasts past this number wait, with their countdown paused, until there is room.
- **Group key**: a new toast replaces an open toast with the same key, for example `'order-' + $Order/OrderNumber`.

## Appearance

Five variants (Success, Info, Warning, Error, Neutral) set the color and icon, or pick a **Custom icon**. **Colored background** tints the whole toast. Errors are announced to screen readers as alerts and the rest as status messages.

Dark mode follows a `.dark-mode` class on any ancestor of the widget. Every color is a CSS variable (`--tp-surface`, `--tp-text`, `--tp-tone`, `--tp-primary` and more) that a theme can set on `.widget-toast-pro-toast`.

## Notes

- A toast belongs to its widget: when the widget leaves the page (navigation, a list view row that disappears), its toast goes too.
- Toasts render at the end of `<body>`, so a scrolling or clipped container doesn't cut them off.
