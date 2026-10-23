# Local UI 0.22.0: Lanes

UI 0.22.0 adds `Lanes` (DOM and React), concurrent work drawn as lanes on one time axis, for the multi-agent round of 2026-10-23: a coding agent's subagents first (Conduict's crew block) and any parallel work a product follows. Its contract is the [catalog entry](../../components.md#conversations). It builds on 0.20.4; the coordinated 0.20.5 and 0.21.0 work of other sessions is not in this branch and is merged by the round's coordinator.

## What it adds

- `src/dom/lanes/`: `Lanes` (public) with `Lane`, `LaneAxis`, `LaneKeys`, `LaneTree`, `LaneWords`, `LaneTip` and the English and Spanish copy; `src/styles/lanes.css`, built after the rail's; React `Lanes` in `src/react/lanes.js`; declarations in `types/lanes.d.ts` and `types/react-lanes.d.ts`, re-exported beside the rail's because `types/dom.d.ts` is at the 300-line limit.
- No token changes (token set 0.6.0). No existing component, stylesheet or declaration changes behavior; `tools/build.mjs`, the two indexes, the harness's run list and consumer entries each gain one entry.

## Decisions taken in this stream

- **A button as a subgrid row.** Each lane is a native `<button>` whose `grid-template-columns` is `subgrid` of one grid on the list, so the columns align across lanes by their content with nothing measured in script. A probe confirmed identical column edges for button rows in Chrome 155, Firefox 155 and WebKit 26.6 before the stylesheet was written; the acceptance measures it on every run.
- **Still marks.** The marks reuse `Status`'s tone classes (shape and hue) and drop its four-beat pulse: LOAD-01 rules out repeated motion, and the ticking time already says the lane lives.
- **Tooltips.** The trace's timing shows on hover of the trace; a cut title (or kind) shows whole on hover of the lane and on keyboard focus (D44). Both are the package's `Tooltip`, made on first need and hidden from assistive technology, because the lane's name and description (`aria-describedby`, its start) already say the words.
- **Axis.** Live steps are 1, 2, 5, 10, 15, 30, 60 and 120 minutes, then doubling, strictly above the time run; an end reported past the page's own now still fits the axis, since a server's clock can run ahead of the page's.
- **Class names.** Every part is under `bui-lanes-` (the lane itself is `bui-lanes-lane`): `.bui-lane` and `.bui-lane-wide` are the thread template's public lane classes (D96), and a first draft that named each lane `bui-lane` restyled a thread's messages, which the full acceptance caught ("one edge, one lane"). A unit test now keeps the lanes' stylesheet off those classes.
- **API refinements of the round's contract (section 4).** `choose(key, event)` also passes the event; `update()` also takes `label` and `trace`; `focus(key, options?)` returns whether a lane was found; `keys` lists the lanes' keys; a fact may be `{ text, label }`; the React form takes `onChoose` and gives a ref with `focus`.

## Executed checks

Run on 2026-10-23 on the round's machine:

- **Archive.** `dist-pack/beyond-ui-0.22.0.tgz`, packed by `npm run pack:consumers` with no consumer named, so nothing was copied into another repository. SHA-256 `f7c0694df2f5c217f63c99263b317c0ed5d1ef7acdf27f62d17dad57107f396a`; integrity `sha512-cklG3/CfKcuWwTO8YGgGEvPF3FntejmqG9oTE6fVWdDijI0nizkS96/IEK7f8FT8YLv54LGW812XOpMCTzBaiA==`, the archive the second full acceptance run below packed and tested.
- **Unit and declarations.** `npm test`: 766 tests, 766 pass, React 18.3.1 included through `react18.test.mjs` (with `react-lanes.test.mjs`). `npm run types` compiles, its expected errors included.
- **Lanes in three engines.** `npm run acceptance -- "lanes:"`: 10 of 10 (DOM, React 19 and React 18 consumers) in Chrome 155.0.8059.85, Firefox 155.0 and WebKit 26.6.
- **The whole acceptance in Chrome.** 353 of 353. The first full run of the draft failed one check, "one edge, one lane (D96)" on the DOM page, which passed on the untouched 0.20.4 archive; its cause was the class collision described above, corrected before this run. The whole acceptance was not run in Firefox or WebKit for this release.
- **Screenshots.** The geometry checks saved their screenshots (both themes at 1440, 1024, 390 and 320 px, every engine and consumer) outside the repository through `BEYOND_UI_SHOTS`; they are not versioned.
- **Before the stylesheet.** A probe outside the repository showed a native `<button>` whose columns are `subgrid` of its parent grid aligning its cells with its siblings' in the three engines; the acceptance now measures that on every run.

## Limits

A pass is package evidence only: no product has adopted `Lanes`, nothing here is a product browser result, screen-reader output or hosted behavior, and WebKit is Safari's engine run by Playwright, not Safari. The React form takes text for a lane's `title`, `kind` and `now`.

## Family reference synchronization

Synchronization pending: the family reference (Beyond Suite's `branding/`) catalogs every shared component and its consumers; `Lanes` needs its entry there, and Conduict's crew block its journeys, in the round's suite stream, which owns those files. This stream changed only this repository.
