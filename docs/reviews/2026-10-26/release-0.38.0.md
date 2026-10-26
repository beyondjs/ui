# Local UI 0.38.0: a raised panel pinned beside the main column (D189)

Evidence baseline: UI `9ff83e7` (0.37.0) on `feature/next` plus this change, made in a worktree on 2026-10-26 for the suite's request `conduict-live-applications-20261024` (branch `live/raised-panel-20261026`). It was made on 0.34.0 and rebased onto 0.37.0.

## Why

Conduict's Start an application puts the page's one action, Start application, in a resource page's raised side panel, beside a list of components that can be long (16 for one application). Conduict kept that panel in view with a rule of its own (`frontend/src/styles/launch.css`), and no family component said whether a raised panel may stay in view. On 2026-10-26 the owner decided:
- a raised side panel that holds the page's action stays in view while the person scrolls a long main column, from the width where it sits beside that column;
- `@beyond-js/ui` draws it, and products stop drawing it themselves;
- a raised panel of conditions alone keeps flowing (D189).

## What changed

- **`pinned`**: an option and a setter of the DOM `Page`, and a prop of React's `Page`. It marks the raised aside `data-pinned`, beside `data-raised`.
  - It applies only to a raised panel. A flat aside, or a panel kept in view (`panel`), is never pinned.
  - The page's choice is kept. Set before `raised`, it takes effect once the panel is raised. Taking `raised` off unpins the panel until it is raised again.
- **Its rule** (`styles/resource.css`) sits inside the 68rem container query that puts the panel beside the main column:
  - sticky at `--bui-page-sticky`, with the same fallback as `.bui-page-panel`, and below a compact header's line by `--bui-page-compact`;
  - `box-sizing: border-box`, a `max-height` within the window and its own scroll, so its whole box stays inside the window.
  - Below 68rem it flows below the main column as before. Nothing else of the raised panel changes, and pinned and unpinned panels are drawn alike.
- **Types**: `types/page.d.ts` and `types/react.d.ts`.
- **Documentation**: the catalog's Pages and insets table, the architecture and validation guides, the acceptance guide and AGENTS.md.

## How the choice was made

- **An explicit choice, not every raised panel.** A resource page's raised panel usually holds conditions (access, where it lives) that need not follow the reader. Only a panel that holds the page's action gains by staying in view, so the page says so.
- **The name says what the panel does**, as `raised` says how it looks: it stays pinned beside the main column, like a pinned table column. It is a different word from the panel kept in view (`PagePanel`), which the person can hide and which opens as a side sheet below its cut. A pinned panel is never hidden and never becomes a sheet.
- **No `overscroll-behavior: contain`**, unlike `.bui-page-panel`. The first candidate kept it and failed in Chrome: the wheel over a pinned panel that fits did not scroll the page.
  - On a page of that rule alone, Chrome 155 held the wheel over a scroll container with nothing to scroll that contains its overscroll (the page stayed at 200 px; with `auto` it moved to 500).
  - Firefox 155 and WebKit 26.6 scroll the page either way.
  - Whether `.bui-page-panel` traps the wheel the same way was not measured. It is the suite's pending `ui-page-panel-wheel-trap`.

## Executed checks

- **The candidate**, 0.34.0 `b397dc4` plus this change, before its rebase:
  - `npm test`: 903 of 903, React 18 included; `npm run types` compiles.
  - `node acceptance/run.mjs 'pinned panel|page: |insets (D184): CommandCard'`: 20 of 20 in each of Chrome 155, Firefox 155 and WebKit 26.6, in the `dom` and `react19` consumers.
- **After the rebase onto 0.37.0** (`69c065a`), through the machine's test queue:
  - `npm run types` compiles, and `npm test` passes 980 of 980.
  - From the packed archive below (`BEYOND_UI_TARBALL`): the whole acceptance in Chrome 155, 445 of 445.
  - `node acceptance/run.mjs 'pinned panel|page: |insets|hanging'` in Firefox 155 and in WebKit 26.6, 31 of 31 each. These are the four pinned checks, the five `page:` checks, the inset checks (D184) and 0.37.0's hanging check (D188), in the `dom` and `react19` consumers.
- **The archive:** `dist-pack/beyond-ui-0.38.0.tgz`, packed at `69c065a`, integrity `sha512-TwAZtBhhWNfwtVKnXEvi75XdICkQUAO88BJDBpUpqqyFtowjeI9dCmOXoLeCebk7j1kP7NzkEdszn9dQV0DmPg==`. Products vendor it when each one adopts it.

## Limits

- **Container queries.** A browser without them never pins the panel; it flows beside the main column as before.
- **A panel taller than the window** scrolls itself. Its last action is reached by that scroll, never by the page's.
- **A product's own sticky rule** is removed when it adopts 0.38.0. Conduict's adoption is ordered after the rounds that vendor 0.36.0 and 0.37.0 into it.

Package evidence only. Nothing here is screen-reader output or hosted behavior.

## Family reference synchronization

Synchronization blocked on order. The family reference records D189 at 0.61.0 in its round `viewed` (the suite's branch `live/reference-held-20261026`), after the reference rounds that hold 0.57.0 to 0.60.0, which are not on the suite's `feature/next` yet (it holds 0.56.0). The suite's pending `family-sticky-side-panel` holds the steps.
