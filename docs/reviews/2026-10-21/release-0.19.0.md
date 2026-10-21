# A heading outranks what it names in UI 0.19.0

## Change

The owner's review of Conduict's presence panel found a type hierarchy that no single value broke and that no stylesheet test could see. The sheet's title was 16 px at 500 over 15 px text at 400, so it read as text. Its parts were headed in the label role (12 px, 500, muted) above meter labels and notes at 13 px, so a part's heading was the quietest text of its part. Sentences of one role took two styles, and the ways on (underlined links at body size) outweighed the title. Measured in Chrome over Conduict's fixture API, at `ui` `feature/next` `c5b71be` (0.18.4) and Conduict `0ea1a6c6`.

The family decision D158 (the owner's direction of 2026-10-21) states the rule: a heading outranks what it names. This release applies it to everything the package draws, and adds the means to hold each product to it:

- **Every title is semibold.** The token set's semibold has said "headings and emphasis" since 0.6.0 (D127), but only the page's H1 used it. Now the section, page panel, side sheet, dialog, drawer and compact header titles use it, as do `Unavailable`, `Facts`, `Checklist`, `Awaited`, `StatusRow`, the notification panel, the Products menu and the profile menu's identity, callouts, empty states, command cards and toasts. A list row's name, a sidebar object and a line's title stay at 500: they name items, not regions.
- **A heading takes its level's size.** A `Section` at level 3 is title-3, one step below a level-2 section (title-2). A side sheet's title takes the page panel's role (title-2), so its parts go in as `Section` at `level: 3`, and their text sits one step below those. A dialog holds no sections, so its title stays title-3, now semibold.
- **A label by design says so.** A heading that groups a list's or a menu's items, or names one item of a list, is quieter than its rows in the label role and carries `data-bui-label`. That covers a notification day and a diff's file. The Products title keeps no label tracking.
- **`Hierarchy`**, the development build's warning (`@beyond-js/ui/dom` and `/react`). A `Page` (DOM and React) starts one over itself, and so does an open `SideSheet` or `Dialog`. At most once a second after a change, it names in a console warning each shown heading that is lighter than semibold or outranked in the region it names, once per heading: "the heading "Load" (12 px, 500) is outranked…". The region is the element its `aria-labelledby` names, else its nearest region. It never changes the page.
- **A meter is a fact, not an action.** `Meter`'s fill takes the info hue instead of coral, so the region's primary action keeps coral to itself (C2).

No token value changed. The public additions are the `Hierarchy` class with its `HierarchyPaint` type and the `data-bui-label` attribute. Everything else keeps its API. The visible change is a heavier weight on every title, the side sheet's title at 19 px and level-3 sections at 16 px. Consumers that drew their own headings at 500, or headed a region in the label role, see the difference only once they adopt the rule. The development warning names each such heading.

The archive is `dist-pack/beyond-ui-0.19.0.tgz`, integrity `sha512-ffIHUsTqw56IfNIl/FQdsh91EP+VEVi71H/thIARE09thGrtOOl/P+jMjVhQQwn1lm4eOBJncg/MhHthQfbjCg==`.

## Executed local evidence

- `npm test`: 683 tests passed, 8 of them new in `tests/hierarchy.test.mjs`. In the built stylesheet they hold: every title semibold; the sheet title-2 and level 3 title-3; the label headings in the label role; and every heading element a component draws either a semibold title or marked `data-bui-label`, read from the sources. They also cover `Hierarchy`'s weight and outranking checks, its regions, labels, hidden text, the face of a heading and its once-per-heading warning. `tests/foundations.test.mjs` holds a meter's fill off coral.
- `npm run types`: passed, including the typed consumer `tests/fixtures/types/hierarchy.ts`.
- `npm run acceptance -- "shared hierarchy"`: 9 passed in Chrome 155, against the packed DOM, React 19 and React 18 consumers. That covers the menus' and `Unavailable`'s titles, now semibold. On a new page (`hierarchy.html`), a side sheet drawn as a machine's panel steps 19/600 → 16/600 → 15/400 → 13 muted, its ways on 13 px muted with no underline at rest, and a dialog's title is semibold above its body, in both themes at 1440 and 390 px. In the development build, the shared sheet, sections and dialog draw no heading `Hierarchy` names, and a sheet headed in the label role is named once per heading.
- The same 9 checks passed in Firefox 155 and WebKit 26.6 (`BEYOND_UI_BROWSER=firefox`, `webkit`).
- The complete `npm run acceptance` in Chrome: 318 of 323 checks passed on the first run, at a load average above 50. Rerunning the other five on the final tree, all passed:
  - Two "sentence case and the label size" checks had read the Products menu's first heading as a group label. That heading has been its title since 0.18.1, so the checks had failed since then on its 15 px. They now measure the title as a title (semibold, as written, no label tracking) and the group labels in the profile menu, comparing text with whitespace normalized: 2 passed.
  - Two "patterns" checks read 0.18.4's half-filled progress mark, a gradient on a ring, as the hollow circle, so two tones seemed to share a shape. They now read the half fill: 2 passed.
  - One React 18 "sign out of Beyond" check had timed out waiting for `/leave` (5 s). It passed with its group when run again: 6 passed.
- Conduict's presence panel, rebuilt on `Section` and `ActionLine` with this archive, measured in Chrome over its fixture API: title 19/600, parts 16/600, sentences 15/400 (the empty one included), labels and notes 13/400 muted, ways on 13/400 muted with no underline. Conduict's presence journey passed 10 checks (Conduict `docs/reviews/2026-10-21/presence-hierarchy.md`).

These are isolated fixtures and a product's fixture API, not hosted services or product acceptance.
