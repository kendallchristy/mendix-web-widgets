# Date Picker Pro

A date, date range, month, quarter, year and time picker for Mendix 11. It has a preset sidebar, event markers under days, Apply and Cancel for ranges, typing with separators that fill in, typed shortcuts such as `t`, `+7` or `last month`, and a help popup that lists every shortcut.

It does everything the Marketplace Advanced Date Picker does (see [Compared with Advanced Date Picker](#compared-with-advanced-date-picker)), so pages can switch to it without losing features.

## Setup

1. Add the widget to a data view, list view or any place with an object.
2. On **General**, choose the **Selection type**:
    - **Single date**: pick a **Date attribute**.
    - **Date range**: pick a **Start date attribute** and an **End date attribute**.
3. Choose a **Date format**. Date, Date and time and Time follow the user's language; Month, Quarter, Year and Custom pick whole periods or use your own pattern (for example `dd-MM-yyyy HH:mm`).
4. Optionally turn on presets, add markers, or limit the selectable days.

The widget uses Studio Pro's own label, visibility and editability settings, and shows Mendix validation feedback under the field.

### Saving

- **Single dates** save as soon as a day is clicked. Turn **Close on select** off to keep the popup open.
- **Ranges** show **Apply** and **Cancel**, so a half-picked range is never saved. Set **Behavior › Apply and Cancel** to change this for either kind.
- **Save range end as** controls the time saved with the end of a range when no time is shown. _End of the last day_ (23:59:59) suits filters such as `[Date] <= $End`.
- **Time zone handling** follows the attribute's _Localize_ setting by default, so an unlocalized attribute keeps the date the user picked in every time zone.

## Typing

With **Typing › Segmented** (the default), the field is split into day, month and year parts. Users type only the digits and the separators fill in: `03152026` becomes `03/15/2026`. Arrow keys move between parts and change them, and Backspace clears one. A part is saved once it is full or the user leaves the field, so a half-typed year is never saved. **Free text** gives a plain input instead.

With **Relative typing** on, users can also type:

| Type                                      | Gets                                                          |
| ----------------------------------------- | ------------------------------------------------------------- |
| `t`, `y`, `tom`                           | Today, yesterday, tomorrow                                    |
| `now`                                     | Today at the current time (date and time formats)             |
| `+7`, `-7`                                | 7 days from today, or 7 days ago                              |
| `+2w`, `-3m`, `+1q`, `+1y`                | Weeks, months, quarters or years from today                   |
| `15`                                      | The 15th of this month                                        |
| `fri`, `next fri`, `last mon`             | This coming Friday, the Friday after today, the Monday before |
| `this week`, `last month`, `next quarter` | The whole period (ranges)                                     |
| `last 7 days`, `next 30 days`             | A number of days up to or from today, counting today (ranges) |
| `wtd`, `mtd`, `qtd`, `ytd`                | Week, month, quarter or year to date (ranges)                 |

Enter uses what was typed and Esc goes back to the previous date. Weekday names also work in the user's language.

### Help popup

Users can see every shortcut on the page: the **?** button beside the field (or in the popup's footer, see **Appearance › Shortcuts help**) opens a list that only shows what applies to that picker, with an example in its own date format. Typing `?` in the field opens it too, and Alt + ↓ opens the calendar. Replace the list with your own content through **Custom help content**.

## Presets

**Presets** adds the sidebar from the design: Today, Yesterday, Tomorrow, This and Last week, month, quarter and year, and All time, each with a translatable label. Single dates only get the day presets, and month or year pickers only get presets that fit. The active preset lights up, also after reloading the page, and **Custom** lights up when the dates match none.

Add your own with **Custom presets** (a label with start and end expressions) or **Presets from data** (for example fiscal periods stored in the database). On phones the presets show as chips above the calendar.

## Selectable dates and times

- **Min date** and **Max date**, also for months, quarters and years.
- **Specific days** and **Interval days** from data sources, either as the only days that can be picked or as days that can't.
- **Days of the week** to switch off, for example weekends.
- **Range length**: the shortest and longest range, and whether a range may include unavailable days. The popup explains why Apply didn't save.
- **Min time**, **Max time** and **Specific times** for the time list.

Unavailable days are crossed out and announced as "Not selectable".

## Markers

Point **Markers › Data source** at objects with a date, and the calendar shows a dot under each of those days, up to three per day with a count after that. Each marker can have its own **Color** (any CSS color, for example `var(--brand-danger)`) and a **Label**, which shows on hover and is read out by screen readers.

## Appearance

- **Show as**: an input box, a button (like the design, showing `Jan 10, 2026 – Jan 16, 2026`) or an inline calendar.
- **Months to display** side by side (0 shows 1 for single dates and 2 for ranges), **First day of the week**, week numbers (locale or ISO), and days of other months.
- **Size**: compact, default or large.
- **Mobile breakpoint**: below this width the popup becomes a sheet across the bottom of the screen.
- Clicking a month's title jumps to a month grid, and from there to a year grid.

### Dark mode and theming

The picker switches to dark colors when the page, or any element around the widget, has the `dark-mode` class, and switches back as soon as the class is removed. The popup is not portaled, so it follows the same class. For another class, set the dark `--dpp-*` variables under it (see below).

Every color and size is a CSS variable, so an app can restyle the picker from its theme:

```scss
.widget-date-picker-pro {
    --dpp-accent: #7c5cfc;
    --dpp-accent-hover: #6b4bef;
    --dpp-accent-soft: rgba(124, 92, 252, 0.14);
    --dpp-range: #f1f2f4;
    --dpp-radius: 8px;
    --dpp-day-size: 36px;
}
```

See `src/ui/DatePickerPro.scss` for the full list.

## Behavior and events

- **On change** runs after a value is saved, **On enter** when the popup opens and **On leave** when it closes.
- **Custom content** places your own widgets under the calendar. Set the **Close popup attribute** to true (for example from a button in that content) to close the popup; the widget sets it back to false.
- **Open to date** sets the month shown when nothing is picked yet.

## Accessibility

- The calendar is a grid with arrow keys, Page Up and Page Down for months, Shift + Page Up and Page Down for years, and Home and End for the week. Month, quarter, year and time lists work the same way.
- Typed parts are spin buttons with their own labels, so screen readers say "Start date, month, 03".
- Days are announced in full with "today", "selected", "Not selectable" and marker labels, and every text the widget speaks can be translated on the **Accessibility** tab.
- Opening the calendar from the button or with Alt + ↓ moves focus to the selected day, Tab stays inside the popup while it is open, and focus returns to the field when it closes.

## Compared with Advanced Date Picker

| Advanced Date Picker                                                | Date Picker Pro                                |
| ------------------------------------------------------------------- | ---------------------------------------------- |
| Single date and date range                                          | Yes, plus month, quarter, year and time ranges |
| Date, time, date and time, month, quarter, year and custom formats  | Yes                                            |
| Time interval and time caption                                      | Yes                                            |
| Min and max date, specific days, interval days, days of the week    | Yes, with data sources                         |
| Min and max time, specific times                                    | Yes                                            |
| Placeholder, input mask and invalid character message               | Yes, with segmented typing                     |
| Months to display, show previous months, week numbers, outside days | Yes                                            |
| Today button, calendar icon, clearable, custom icon                 | Yes                                            |
| Popup alignment and arrow                                           | Yes                                            |
| Custom content and close attribute                                  | Yes                                            |
| On change, on enter, on leave                                       | Yes                                            |
| Translatable screen reader labels                                   | Yes                                            |
| Read-only as text or as a disabled control                          | Yes                                            |

Added in Date Picker Pro: presets with custom and data-driven presets, event markers, Apply and Cancel, hover preview of the range, button and inline triggers, relative typing with the help popup, range length rules, month and year jump, a phone layout, dark mode, CSS variable theming and time-zone safe dates.

## Development

```sh
pnpm --filter @kendallchristy/date-picker-pro build    # dist/<version>/*.mpk
pnpm --filter @kendallchristy/date-picker-pro test
pnpm --filter @kendallchristy/date-picker-pro dev      # rebuilds into a test project
```

Date logic lives in `src/core` and has no React or Mendix in it. The components are in `src/components`, and `src/mendix/buildConfig.tsx` turns the widget's properties into the picker's config.
