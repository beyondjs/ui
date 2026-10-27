# Local UI 0.42.0: a checklist's words at the reading measure

Evidence baseline: UI `cb0f08c` (0.41.0) on `feature/next` plus this change, made on 2026-10-27 for the round `measured`. It is the package's part of the suite's pending `packages-ui-first-steps-line-measure`: the owner chose to give `Checklist`'s detail the family's reading measure rather than shorten the Packages interface's words. The pending closes once the Packages interface vendors 0.42.0 and the family `frame` phase passes its arrival.

## Why

The family `frame` phase fails a page with a line of prose longer than 80 characters. On 2026-10-27 it measured the Packages interface's arrival for the first time. From 1024 px the first steps' details ran to 81 characters on one line: `.bui-checklist-detail` had no measure of its own and took the checklist's width, 40rem less its padding, step padding and marker.

## What changed

- **`prose.css`** holds a `Checklist` step's detail (`.bui-checklist-detail`) and a blocked step's reason (`.bui-checklist-reason`) at `--layout-measure` (54ch), as a page's lead and every other part that holds a product's sentences. At the detail's 13 px, 54ch is narrower than the room a 40rem checklist gives its words: before the change a long paragraph there ran to 89 characters a line (Chrome 156, the new check on `layout.html?first=1` at 1024, 1440 and 1920 px, run against 0.41.0's stylesheet).
- **Unchanged:** the checklist's own width (`--layout-form`), its head and progress, its steps' titles (names, not prose) and its actions.
- **Documentation:** README, AGENTS.md, the catalog (Reading width, `Checklist`), architecture, validation and the acceptance README.

## Executed checks

Through the machine's test queue, on 2026-10-27. Its commits on this branch: `6d6ace5` (the change), `a1792f3` (the release, the archive's source), `bc3523b` (the review's corrections, none of them packed) and the commit that carries these results.

- **During the work** (Chrome 156): the new `prose` check, run against 0.41.0's stylesheet, failed in every part at 1024, 1440 and 1920 px: no measure, the arrival's longest detail at 81 characters on one line, a blocked step's reason at 92, and a long paragraph at 89 characters a line. With the change it passed, and so did `layout`, `insets` and `hierarchy` (24 of 24). The unit test failed without the change and passed with it.
- **The release** (0.42.0 at `a1792f3`):
  - `npm test`: 1022 of 1022, React 18 included; `npm run types` compiles. Both ran again after the review's corrections, with the same counts.
  - From the packed archive, the whole acceptance, each engine its own bounded queue run: Chrome 156 465 of 465, Firefox 155 465 of 465, WebKit 26.6 465 of 465. Firefox and WebKit ran the corrected `prose` check; Chrome ran it again from the same archive, 2 of 2.
  - The archive: `beyond-js-ui-0.42.0.tgz`, sha256 `8d277291321d6c6c485a08d23a84b686ce14feb6349a23706f9ae0fc1ab1dc6b`, integrity `sha512-z62nBtoLjGZBKMEGbCrjDycldGpS8ROW8ltJnagXC6qCXltQXT/QJhUygFKCkLaFpvw36pDxa4nLEhpNVnzySw==`. It was packed again after the corrections with the same sha256.

## The independent review (2026-10-27) and its corrections

The review found nothing that had to be fixed in the change. Its points, each corrected in `bc3523b`:

1. This record claimed to resolve the suite's pending; it is the package's part of it.
2. The unit test read only rules naming the parts alone. It now fails on any rule whose selector ends in a part and sets a width.
3. The browser check compared a line's width with the part's own `max-width`, which holds by construction. It now compares the measure with 54 zeros in the part's own font.
4. The 89 characters named no run; they are named above.
5. The runs were not yet recorded; they are above.

## Limits

- **Package evidence only.** The Packages interface's adoption and the family `frame` phase are recorded in the suite. No other product vendors 0.42.0 yet: Accounts, Projects, Conduict, Delegate, CDN, Snapshots, Beyond Home and the reference take it with their next vendoring.
- **Other muted lines.** Only the checklist's words changed. Other parts whose class names read as prose but sit in boxes narrower than the measure (a choice card's detail, a dictation note) were not changed.

## Family reference synchronization

For the reference's next vendoring: in a checklist wider than the measure, a step's detail and a blocked step's reason wrap at about 54 characters' width instead of running to the checklist's edge. A short detail looks the same.
