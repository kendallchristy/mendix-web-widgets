---
"@kendallchristy/sortable-list-pro": minor
"@kendallchristy/kanban-board-pro": minor
---

Save moves through nanoflows. Mendix never lets a widget change attributes of list objects, so On move, On move to another list, On card move and On column move now receive the new sort value (and the target column or list value) as action variables, and the nanoflow saves them. Items are no longer locked when the sort attribute is read-only, and Studio Pro shows an error when a save action is missing.
