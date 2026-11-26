# The active project and run live in localStorage; switching reloads the page

Every tool already reads and writes its inputs through one flat localStorage store keyed by element id (`labkit:v1:inputs`, tables, history, bench). Projects and runs (W1) are built around that instead of rewriting about 90 tools: the active project's active run (or its losse invoer) is what sits in those keys, and every inactive project and run is packed into IndexedDB. Switching packs the current one, unpacks the other and reloads the page, the same way session import already works. Preferences (pins, favourites, recent, expert mode, phase filter, language, theme) stay outside projects.

## Considered Options

- **Live swap without reload:** rejected; every tool would need to reset its state in place, and one forgotten tool leaks data between projects.
- **Namespacing every input key by project:** rejected; touches every tool and the share, undo and validation code that sets inputs by id.
- **Everything in localStorage:** rejected; about 5 MB in total is too small for several projects with history and bench photos.

## Consequences

- Storage goes through one layer, so the Windows app can later keep inactive projects as files in a folder (step S273) without the tools noticing.
- On the website LabKit asks once for persistent storage (`navigator.storage.persist()`) so the browser does not clear projects when disk space runs low.
