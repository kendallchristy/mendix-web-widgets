# Document Viewer Pro

Shows documents inside a Mendix 11 page: PDF, Word, Excel and other spreadsheets, PowerPoint (beta), images, multi-page TIFF scans, text and code, Markdown, HTML, emails, audio and video. Everything renders in the browser, so files never leave the app for a conversion service.

The viewer adds page thumbnails and the PDF outline, zoom, rotate, search with highlighted matches, print, download and full screen, and it reports pages, load results and errors back to the app. Users can mark up pages with highlights, notes and drawings, which the app stores as JSON.

## Setup

1. Add Document Viewer Pro to a page, usually inside a data view of a `System.FileDocument` (or a specialization such as `System.Image`).
2. On **General › Data source**, pick what to show with **Show**:

| Show            | Settings                                                                                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A file          | **File**: the file document, usually `$currentObject`.                                                                                                                                       |
| A URL           | **URL**: an expression with the web address. Files on another site load only when that site allows it (CORS).                                                                                |
| A list of files | **Files**: a data source of file documents, for example an order's attachments. **File name** (usually the `Name` attribute) and **Caption** fill the file strip that switches between them. |

**File name** (for a file or URL) overrides the name shown in the toolbar. The viewer picks the format from the name and checks it against the file's first bytes, so a PDF saved as `.docx` still opens as a PDF.

3. Set the height on **General › Display**: pixels, a percentage of the screen, or the full height of the parent container.

## File types

| Format            | Extensions                                                             | Notes                                                                                       |
| ----------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| PDF               | pdf                                                                    | Text selection, links, outline, password prompt.                                            |
| Word              | docx, docm, dotx, dotm                                                 | Pages, headers, footers, tables, images.                                                    |
| Spreadsheets      | xlsx, xlsm, xlsb, xltx, xltm, xls, ods, csv, tsv                       | Sheet tabs, merged cells, column widths; a fast grid for large sheets (up to 200,000 rows). |
| PowerPoint (beta) | pptx, pptm, ppsx, potx                                                 | Slides with shapes, images and charts. Complex slides can look different from PowerPoint.   |
| Images            | jpg, png, gif, webp, avif, bmp, ico, svg                               | Zoom, rotate and drag to pan.                                                               |
| TIFF              | tif, tiff                                                              | Every page of a multi-page scan.                                                            |
| Text and code     | txt, log, json, xml, yaml, sql, js, ts, java, cs, py and about 40 more | Syntax colors, line numbers, wrap lines; JSON is pretty-printed.                            |
| Markdown          | md, markdown                                                           | Rendered, with a source toggle.                                                             |
| HTML              | html, htm, xhtml                                                       | Shown in a locked frame where scripts and forms can't run, with a source toggle.            |
| Email             | eml, msg                                                               | Header, safe body, attachments open in the viewer (Back returns to the email).              |
| Audio and video   | mp3, wav, ogg, m4a, flac, mp4, webm, mov                               | The browser's player.                                                                       |

For anything else (`.doc`, `.ppt`, `.odt`, archives), the viewer says the type can't be previewed and offers a download. If the app can make a PDF copy (for example with a document conversion module), put it in **General › Preview file**: the viewer shows the copy when the original can't be shown, or always when **Show preview file** is _Always_. Download still gives the original.

## Viewing

- **Pages**: _Continuous scrolling_ scrolls through all pages; _One page at a time_ shows one page, and arrow keys turn pages.
- **Start zoom**: Fit width, Fit page, Actual size or a percentage. Images start at Fit page (and never grow past 100%) when Fit width is picked.
- **Sidebar**: _Automatic_ opens the thumbnails when the viewer is at least 900 pixels wide. PDFs with bookmarks get an **Outline** tab.
- Hold Ctrl (Cmd on a Mac) and scroll, or pinch on a touch screen, to zoom.

On narrow viewers (phones, side panels) the toolbar keeps the essentials and hides the rest.

### Keyboard

| Keys                                       | Does                                    |
| ------------------------------------------ | --------------------------------------- |
| Ctrl + F                                   | Search                                  |
| Enter / Shift + Enter                      | Next / previous match                   |
| Ctrl + P                                   | Print                                   |
| Ctrl + Plus / Minus / 0                    | Zoom in / out / reset                   |
| Page Down / Page Up                        | Next / previous page                    |
| Arrow keys, Home, End (one page at a time) | Turn pages, first page, last page       |
| Escape                                     | Close search, then markup               |
| Ctrl + Z / Ctrl + Shift + Z                | Undo / redo markup                      |
| Delete                                     | Delete the selected markup or signature |

## Toolbar

**Toolbar › Position** puts the toolbar at the top or bottom, or hides it. Each button (file name, page controls, zoom, rotate, search, print, download, full screen) has its own switch. **Extra content** is a drop zone at the end of the toolbar for your own buttons, for example "Approve" or "Send for signing".

## Access

| Setting                       | Does                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Allow download                | Expression. False hides the download button.                                                                              |
| Allow print                   | Expression. False hides print, and Ctrl + P does nothing while the viewer has focus.                                      |
| Allow text selection          | Expression. False stops selecting and copying text and the right-click menu.                                              |
| Watermark                     | Text repeated across the document and on printouts, for example `Confidential - {1}` with the user's name as a parameter. |
| Block remote images in emails | Hides images an email loads from the internet (often tracking pixels) until the user chooses **Show images**.             |

These settings stop casual copying in the viewer. They are not digital rights management: someone with the file's URL or the browser's developer tools can still get the file. Use Mendix access rules to decide who may see a file at all.

## Markup

Users can highlight text, highlight areas, add notes and draw on PDFs, images, TIFF scans and PowerPoint slides. Any highlight, area or drawing can also get a comment. The app stores all of it as JSON in a String attribute, so it reloads with the file and the app can read it.

### Setup

1. Add an unlimited String attribute for the markup, for example `Markup` on the file entity.
2. On the **Markup** tab, pick it in **Markup**. For a list of files, pick the attribute of the file entity.
3. Set **On change** to something that saves the object, usually a nanoflow that commits it. The viewer writes the attribute after every change and then runs **On change**, which also receives the JSON as the **Markup** variable. While the action is still running, the viewer waits and runs it once more with the latest JSON.
4. Optional: **Author** (for example the user's full name) is saved with each mark and shown with comments. **Allow markup** set to false shows the markup without letting the user change it.

If only the attribute is set, the markup changes the object in memory, and a Save button on the page commits it.

### Using it

The pen button in the toolbar opens the markup tools:

| Tool              | Does                                                                          |
| ----------------- | ----------------------------------------------------------------------------- |
| Select            | Click markup to select it, then comment on it, change its color or delete it. |
| Highlight text    | Select text to highlight it (PDFs).                                           |
| Highlight an area | Drag a box, for example around a figure or part of a scan.                    |
| Add a note        | Click to place a note and type it.                                            |
| Draw              | Draw with the mouse, a pen or a finger.                                       |

The colors apply to new markup and to the selected markup. **Undo** and **Redo** (Ctrl + Z, Ctrl + Shift + Z) step through changes, and Delete removes the selected markup. Selecting text in a PDF without the tools open also offers **Highlight**. The sidebar's **Markup** tab lists everything in page order and jumps to it. Printing includes the markup.

Markup positions are fractions of the page, so markup stays in place at any zoom, rotation and screen size. Word, spreadsheet, text and email files don't take markup, because their layout changes with the screen.

### JSON

```json
{
    "version": 1,
    "items": [
        {
            "id": "m1",
            "type": "highlight",
            "page": 1,
            "color": "#fab005",
            "rects": [[0.12, 0.15, 0.51, 0.02]],
            "text": "Revenue grew in quarter 2.",
            "comment": "Check this number",
            "author": "Sam Lee",
            "date": "2026-10-29T13:45:00.000Z"
        }
    ]
}
```

`type` is `highlight` (with `rects` and `text`), `area` (with `rect`), `note` (with `x` and `y`) or `ink` (with `strokes`, each a flat list of x, y points, and `width`). Rectangles are `[x, y, width, height]`. All positions are fractions of the page from its top left corner, without the user's rotation. Pages count from 1.

### Selected text

**Markup › Selected text › Action** adds a button to the menu that appears when the user selects text, in any file type with selectable text. The action receives the text and its page number as the **Selected text** and **Page number** variables, for example to create a task from a sentence in a contract. **Button caption** names the button.

## Forms and signatures

PDFs with form fields can be filled in right in the viewer, and users can sign any PDF. Both are on the **Forms and signatures** tab.

### Form fields

Text fields, check boxes, radio buttons, drop-downs and lists work as they do in a PDF reader. **Allow filling in** set to false shows the values without letting the user change them.

To keep the values in the app, pick an unlimited String attribute in **Form values**. The viewer writes the values there as JSON after each change, by field name, and runs **On change**, which also receives the JSON as the **Values** variable. Values already in the attribute are filled in when the PDF opens, so the app can prefill a form.

```json
{ "company": "Acme Supplies", "country": "Germany", "terms": "net30", "agree": true, "tags": ["a", "b"] }
```

Text fields and drop-downs give text, check boxes `true` or `false`, radio buttons the chosen option's value, and lists that allow several choices a list.

### Signing

The signature button in the toolbar opens a dialog where the user draws, types or uploads a signature (**Signer name** fills in the typed name). Then they click on the page to put it there, drag it to move it and drag its corner to resize it. When the PDF has empty signature fields, they show **Sign here**: clicking one signs right in the field, and later fields reuse the same signature.

The signature is an image on the page (an electronic signature), not a certificate-based digital signature.

### Saving

Filled in fields and signatures are kept in the viewer until they're saved. A bar at the bottom says there are unsaved changes and offers:

- **Download copy**: downloads the PDF with the values and signatures (when downloads are allowed).
- **Save**: puts the PDF in the **Save to** file document and runs **On save**. Set **On save** to a nanoflow that commits the object, because the file is only stored once the object is committed. **Save to** can be the same file that is shown; the viewer then reloads it and stays on the same page.

**Flatten fields** turns the fields into plain page content when saving, so the saved PDF can't be changed. Without **Save to** and with downloads turned off, the Sign button is hidden, because a signature couldn't be kept. Form values and **Save to** apply when the viewer shows a single file.

## Events and attributes

| Event          | Runs                                                                               |
| -------------- | ---------------------------------------------------------------------------------- |
| On load        | When a file has opened (also when an email attachment opens).                      |
| On error       | When a file can't be downloaded, read or shown. **Error message** gets the reason. |
| On page change | When the user moves to another page.                                               |
| On download    | Instead of the built-in download, for example to log downloads.                    |

| Attribute     | Type          | Use                                                                           |
| ------------- | ------------- | ----------------------------------------------------------------------------- |
| Current page  | Integer, Long | Two-way: the viewer writes the page the user is on; set it to jump to a page. |
| Page count    | Integer, Long | Written when a document with pages opens.                                     |
| Error message | String        | Written on errors and cleared when a file opens.                              |

## Labels

Every text in the viewer is on the **Labels** tab, so it can be translated. `[total]` and `[current]` in a label are filled in by the viewer, for example `of [total]`. Leave **PowerPoint beta note** empty to hide the beta notice.

## Dark mode

The viewer follows the `dark-mode` class: when an element around it (usually `body`) has the class `dark-mode`, the toolbar, sidebar and text views turn dark. Document pages stay white, like paper.

## How it loads

Each format's engine is a separate script inside the widget package, loaded the first time a file of that type opens. A page that only shows PDFs never downloads the spreadsheet or PowerPoint code. The scripts are served from the app itself, so the viewer works without internet access.

## Libraries

| Format       | Library                                                                                                              | License                    |
| ------------ | -------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| PDF          | [pdf.js](https://github.com/mozilla/pdf.js)                                                                          | Apache-2.0                 |
| PDF saving   | [pdf-lib](https://pdf-lib.js.org)                                                                                    | MIT                        |
| Word         | [docx-preview](https://github.com/VolodymyrBaydalka/docxjs)                                                          | Apache-2.0                 |
| Spreadsheets | [SheetJS Community Edition](https://sheetjs.com)                                                                     | Apache-2.0                 |
| PowerPoint   | [PptxViewJS](https://www.npmjs.com/package/pptxviewjs) with Chart.js, JSZip                                          | MIT                        |
| TIFF         | [UTIF2](https://www.npmjs.com/package/utif2)                                                                         | MIT                        |
| Code         | [highlight.js](https://highlightjs.org)                                                                              | BSD-3                      |
| Markdown     | [marked](https://marked.js.org) and [DOMPurify](https://github.com/cure53/DOMPurify)                                 | MIT, MPL-2.0 or Apache-2.0 |
| Email        | [postal-mime](https://github.com/postalsys/postal-mime), [msgreader](https://github.com/HiraokaHyperTools/msgreader) | MIT-0, Apache-2.0          |

Each engine's third-party licenses are in `engines/<name>.licenses.txt` inside the widget package.
