# Validation

Run the checks that match a change. Every command runs from the repository root after `npm install` (Node.js 22.21.1 or later).

| Level | Command | Runner and DOM | What a pass proves |
| --- | --- | --- | --- |
| Contract and unit | `npm test` | `tools/build.mjs`, then Node's test runner (`node --test tests/*.test.mjs`) over happy-dom | Token extraction (byte-identical sheet against `tests/fixtures/branding-tokens-0.1.0.css`, provenance, contrast), source conventions (file length, no color literal in styles, documented classes, portable content), and the public contract of every DOM component and of the React adapter: success, negative and recovery cases, imported through the package's own `exports`. The React suites (`react.test.mjs`, and `strict.test.mjs` for `StrictMode` under an external store) run on React 19 and again on React 18.3.1 through `react18.test.mjs`, which installs React 18 into a temporary project (registry or npm cache) and runs them in a child process whose `react` and `react-dom` resolve there (`tests/support/react.mjs`) |
| Declarations | `npm run types` | TypeScript 7 (`tsc`, bundler resolution, `react-jsx`) over `tests/fixtures/types/` | A typed plain DOM consumer and a typed React consumer compile against `types/*.d.ts` |
| Installed browser acceptance | `npm run acceptance` | `npm pack`, three consumers installed from the tarball (plain DOM, React 19.3.0, React 18.3.1), esbuild bundles, Google Chrome through `playwright-core` | The artifact consumers install works in a real browser: keyboard, focus, Escape, busy dialogs, picker selection across pages and filters and "Select all shown", no matches, error retry, notification states (partial by display name, bounded "N+" count, "View all" closing the panel, React closing it through the ref), tooltip and help on keyboard and touch, reduced motion, both themes, 320 px, 200 % zoom (including a long dialog whose body scrolls with its title and actions in view), touch targets, teardown, Spanish copy and, on React 19 and 18, dialogs under `StrictMode` and an external-store provider staying open and fillable. See [acceptance](../acceptance/README.md) |

happy-dom is a development dependency because the unit contract needs `<dialog>`, constraint validation and events in Node; it does not lay out, draw focus rings or dispatch real key sequences, so those are asserted only in Chrome. The React adapter's unit tests run on React 19 and 18; both are also exercised in the browser acceptance.

A pass is package evidence only. It is not adoption by a product, not a product browser result, not screen-reader output and not hosted behavior. Record product results in the product's own evidence.

## Test organization

- `tests/`: contract and unit tests (`*.test.mjs`), `tests/support/page.mjs` (the happy-dom page), `tests/support/touches.mjs` (records any call on a destroyed DOM instance), `tests/support/react.mjs` (resolves React from another installation) and `tests/fixtures/` (physical fixtures with their [guide](../tests/fixtures/README.md): the token baseline, data sources and the typed consumers).
- `acceptance/`: the installed browser journey, with its [guide](../acceptance/README.md), `support/`, `checks/` and `fixtures/` (the plain DOM and React consumer pages and their fictional data).
- Substantive examples are files with their real extensions; tests assert outcomes through public modules. Harnesses copy fixtures into unique temporary directories whose paths contain a space, await readiness rather than fixed delays, and remove every directory, server and browser they started, on success and on failure. Nothing stops unrelated services.
- Do not regenerate `tests/fixtures/branding-tokens-0.1.0.css`: it is the extraction baseline. A deliberate token change is a new token version with its own evidence. The package version and the token set version are independent: package 0.1.3 still carries token set 0.1.0, and `tests/tokens.test.mjs` keeps asserting both the version and the byte-identical sheet.
- An assertion that compares DOM nodes uses `assert.ok(a === b, message)`: on failure, `assert.equal` would try to print the whole happy-dom node graph and the run appears to hang.

UI is not compiled by Packages or Engine, so `beyond test` and the utilities validation do not apply. It owns no service, port or selector profile; root and suite launch checks are inapplicable.

## Documentation changes

Validate local links and anchors, English and portability, the thin `CLAUDE.md` bridge, the shared coding and documentation standard copies, and `git diff --check`, including untracked files.
