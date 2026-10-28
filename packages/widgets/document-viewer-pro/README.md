# Document Viewer Pro

Shows documents inside a Mendix 11 page: PDF, Word, Excel and other spreadsheets, PowerPoint (beta), images, multi-page TIFF scans, text and code, Markdown, HTML, emails, audio and video. Everything renders in the browser, so files never leave the app for a conversion service.

The viewer adds page thumbnails and the PDF outline, zoom, rotate, search with highlighted matches, print, download and full screen, and it reports pages, load results and errors back to the app.

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

| Keys                                       | Does                              |
| ------------------------------------------ | --------------------------------- |
| Ctrl + F                                   | Search                            |
| Enter / Shift + Enter                      | Next / previous match             |
| Ctrl + P                                   | Print                             |
| Ctrl + Plus / Minus / 0                    | Zoom in / out / reset             |
| Page Down / Page Up                        | Next / previous page              |
| Arrow keys, Home, End (one page at a time) | Turn pages, first page, last page |
| Escape                                     | Close search                      |

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
| Word         | [docx-preview](https://github.com/VolodymyrBaydalka/docxjs)                                                          | Apache-2.0                 |
| Spreadsheets | [SheetJS Community Edition](https://sheetjs.com)                                                                     | Apache-2.0                 |
| PowerPoint   | [PptxViewJS](https://www.npmjs.com/package/pptxviewjs) with Chart.js, JSZip                                          | MIT                        |
| TIFF         | [UTIF2](https://www.npmjs.com/package/utif2)                                                                         | MIT                        |
| Code         | [highlight.js](https://highlightjs.org)                                                                              | BSD-3                      |
| Markdown     | [marked](https://marked.js.org) and [DOMPurify](https://github.com/cure53/DOMPurify)                                 | MIT, MPL-2.0 or Apache-2.0 |
| Email        | [postal-mime](https://github.com/postalsys/postal-mime), [msgreader](https://github.com/HiraokaHyperTools/msgreader) | MIT-0, Apache-2.0          |

Each engine's third-party licenses are in `engines/<name>.licenses.txt` inside the widget package.
