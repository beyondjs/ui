# Browser acceptance

`npm run acceptance` proves the packed package in a real browser, installed the way consumers install it.

## What a run does

1. `npm pack` into a temporary directory (the `prepack` build runs first) and prints the tarball's `sha512` integrity.
2. Prepares three consumers, each a temporary project whose path contains a space: `dom` (the plain DOM page), `react19` (the React page on React 19.3.0) and `react18` (the same page on React 18.3.1). Each installs the tarball and its React version with `npm install`, copies `fixtures/`, and bundles its page with esbuild, which resolves `@beyond-js/ui`, `@beyond-js/ui/react` and both stylesheets through the package's `exports`. Nothing is read from this checkout's `src/`.
3. Serves each consumer from a static server on an ephemeral port and opens Google Chrome (Playwright's `chrome` channel, headless). Every check opens its own browser context, so viewport, color scheme, reduced motion and touch never leak between checks.
4. Prints one line per check and consumer and a final count; exits with 1 when any check fails. Temporary projects, servers and the browser are removed on success and on failure.

`node acceptance/run.mjs "<text>"` runs only the checks whose consumer and name contain the text. `DEBUG=1` prints the full failure log.

Prerequisites: Node.js 22.21.1 or later, `npm install` in this repository, network or npm cache access for the consumers' React installs, and Google Chrome installed.

## Layout

- `run.mjs`: the run described above.
- `support/`: `consumer.mjs` (temporary consumer projects), `server.mjs` (static server), `browser.mjs` (Chrome and small assertions), `words.mjs` (visible copy per fixture language).
- `checks/`: the checks, grouped by area: `keyboard.mjs` (action menu, dialog, busy confirmation, prompt), `picker.mjs`, `notifications.mjs`, `help.mjs` (help, tooltip, touch, focused form) and `presentation.mjs` (reduced motion, themes, 320 px, 200 % zoom, collection, teardown, Spanish copy). Each check names the consumers it applies to.
- `fixtures/`: the physical consumer pages.
  - `dom/`: a plain JavaScript page that creates, mounts and destroys DOM components, in English (the package defaults).
  - `react/`: a React page using `@beyond-js/ui/react` inside `StrictMode`, with Spanish copy passed through `labels` (`labels.js`), as a localized product does.
  - `data/`: the fictional sources both pages use: people for the picker (45, one disabled), requests for the collection, and a notification adapter with modes selected by `?notices=` (`ready`, `empty`, `failed`, `unavailable`, `partial`).
  - `page.css`: page layout only; component styles come from the package.

Each page exposes `window.fixture` so checks can switch a source into failure and call a complete teardown.

## What a pass proves and does not

A pass proves the installed artifact works in Chrome for these fixture pages: exports and stylesheets resolve, keyboard, focus and Escape behave, busy dialogs hold, the picker keeps choices across pages and filters, notification states are stated, reduced motion, both themes, 320 px width, 200 % zoom (approximated as a 640 CSS px viewport at device scale 2) and touch targets, and that teardown releases the components' document listeners. It does not prove adoption by any product, other browsers, screen reader output, or a real notification service: the adapters are fixtures.
