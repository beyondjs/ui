# Release 0.7.4 — 5 October 2026

A patch release of `@beyond-js/ui` over [0.7.3](../2026-10-04/release-0.7.3.md), asked for by the suite's coordinating session. It adds the family bar's "GitHub" entry (PRJ-14, part of the owner-approved D51 amending D48) and fixes every finding of an independent review of 0.7.0–0.7.3: 4 medium, 4 medium/low and 7 low, with no high-severity defect. The token set is unchanged (0.3.0). Nothing is published; consumers vendor the tarball.

## GitHub in the profile menu (PRJ-14)

The organization group of the profile menu (D48) ends with **GitHub** («GitHub») for every member, when `links.github` is present. That link is Projects' GitHub section of the organization in view, which Projects' `beyond-family/1` carries since projects `6f93789`. It is an absolute address, followed as given: the bar adds no product or return, also when the menu opens. The entry does not show without the link, nor without an organization in view. A product may supply the address through `fallback.links.github`. Its key is `FamilyBar.labels.en.github` / `.es.github`.

Affected files: `src/dom/family/account.js`, `places.js`, `labels.js` and `types/family.d.ts`.

## The review's findings

| # | Severity | Defect | Fix | Test |
| --- | --- | --- | --- | --- |
| 1 | Medium | React `SideSheet` rebuilt by every render when `labels` were passed inline, so it closed while busy and lost its content | It depends on `labels?.close`, as React `Dialog` does | `react-review.test.mjs` |
| 2 | Medium | Tab was trapped in a `SideSheet` on targets that cannot take focus: a button inside a closed `<details>` (technical details) or in a collection's hidden column | `Focus.targets` leaves out what is not rendered (`[data-bui-hidden]`, the inside of a closed `<details>` other than its summary). Tab moves to the next candidate that takes focus. A `<summary>` is now a target, so technical details open by keyboard | `review.test.mjs`; acceptance `choose: side sheet: Tab passes over a button folded in closed technical details` |
| 3 | Medium | A recognized paste was chosen again after the person removed it, by "Load more", Try again or a late page | A recognition settles once, on the first answer to the query it was read for (`Recognizer.settled`) | `review.test.mjs` |
| 4 | Medium | `RefChooser` lost a typed ref while the branches loaded or could not be read, and moved focus to an element out of the page | The ref is stated ("v1.2.0, kept while the branches can't be listed") and submitted through a hidden input. Focus goes to an element in the page | `review.test.mjs` |
| 5 | Medium/low | The Git ref check accepted names Git refuses | A leading `-` (also an option-injection risk), a part starting with `.`, `.lock` ending any part and control characters are refused | `review.test.mjs` |
| 6 | Medium/low | The DOM `ProjectPicker` ignored its initial `value` | The value is kept until the first projects are listed | `review.test.mjs` |
| 7 | Medium/low | A first suggestion that arrived late overwrote what the person typed | The typed value stands, and the field reads as edited | `review.test.mjs` |
| 8 | Low | A React one-option statement never reported its value to a controlled form | `Select`, radio `Choices` and `ChoiceMenu` report the stated value once it differs from the form's. `Select` passes it as an event-like `{ target: { name, value } }`. It is reported once under StrictMode too | `react-review.test.mjs` |
| 9a | Low | Tab out of an open menu inside a `SideSheet` jumped to Close | From an element that is not a target, Tab goes to the next target after it in document order, and Shift+Tab to the one before | `review.test.mjs` |
| 9b | Low | `Draft.address('new')` returned `/new?…` | A relative address keeps its path as written | `review.test.mjs` |
| 9c | Low | English showed on Spanish pages: "Rama Choose", "Proyecto · Choose" and the accounts switcher's search | `RefChooser`, `ProjectPicker` and the resource picker's "From" pass `placeholder`, `search` and `none` from their own sets | `review.test.mjs`; `spanish.test.mjs` checks the new keys in both languages |
| 9d | Low | The React `SideSheet`'s error was placed again at every render, so screen readers announced it again | The alert region is refilled only when an error appears or goes | `react-review.test.mjs` |
| 9e | Low | `ProviderWindow` kept `window.opener` | The opener is set to null right after `open()`. The window passes through other origins, such as an organization's identity provider, and none of them may navigate the product's tab. The outcome is read from the server, the window's closing is polled every 500 ms (`poll`), and a `beyond-provider` message, where it still arrives, only wakes the read. Projects' trip page closes itself without an opener since projects `11266ef` | `review.test.mjs` |
| 9f | Low | "Select all shown" left out the suggested group | It adds the suggested items too | `review.test.mjs` |
| 9g | Low | `Awaited` and `AwaitedLine` gave `check()` no time limit (D40), so a check that never settled kept "Check again" disabled | A check is bounded by `bound` (20 s by default, `Bound.run`), then "The check did not finish. Try again." | `review.test.mjs` |

**Each test fails without its fix.** This was checked by building the package from 0.7.3's sources with the new tests:
- 8 cases of `review.test.mjs` fail.
- The other 4 (findings 2, 9a, 9e and 9g) and `react-review.test.mjs` never finish.

## Checks

| Check | Result |
| --- | --- |
| `npm test` (new: `family-github.test.mjs`, `review.test.mjs`, `react-review.test.mjs`) | 309 of 309 |
| `npm run types` | No diagnostics |
| `npm run acceptance` (new: the profile menu's GitHub entry at 1440 and 390 px for the DOM, React 19 and React 18 consumers, and the side sheet's Tab past folded technical details) | 167 of 167 in each engine: Chrome 154, Firefox 155 and WebKit 26.6 |

Tarball: `beyond-ui-0.7.4.tgz`, `sha512-zIC1xLbTvPv5E/6PENssu2bSscV2Hl7JMlK4tEQyB+zReR6YLDERtAtBw1JEeTx7NSJicUzjGTuFf4by/go8tA==`.

## Consumers

A product that relays Projects' descriptor shows "GitHub" with no change of its own. A product that passes its own copy of the family bar's labels should take `FamilyBar.labels[language]`, which carries the `github` key.

## Family reference synchronization

The suite's family reference models the GitHub entry and Accounts' GitHub row with the vendored 0.7.4, recorded with the suite commit that vendors it.
