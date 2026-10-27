# Local UI 0.42.0: a checklist's words at the reading measure

Evidence baseline: UI `cb0f08c` (0.41.0) on `feature/next` plus this change, made on 2026-10-27 for the round `measured`. It is the package's part of the suite's pending `packages-ui-first-steps-line-measure`: the owner chose to give `Checklist`'s detail the family's reading measure rather than shorten the Packages interface's words. The pending closes once the Packages interface vendors 0.42.0 and the family `frame` phase passes its arrival.

## Why

The family `frame` phase fails a page with a line of prose longer than 80 characters. On 2026-10-27 it measured the Packages interface's arrival for the first time. From 1024 px the first steps' details ran to 81 characters on one line: `.bui-checklist-detail` had no measure of its own and took the checklist's width, 40rem less its padding, step padding and marker.

## What changed

- **`prose.css`** holds a `Checklist` step's detail (`.bui-checklist-detail`) and a blocked step's reason (`.bui-checklist-reason`) at `--layout-measure` (54ch), as a page's lead and every other part that holds a product's sentences. At the detail's 13 px, 54ch is narrower than the room a 40rem checklist gives its words: before the change a long paragraph there ran to 89 characters a line (Chrome 156, the new check on `layout.html?first=1` at 1024, 1440 and 1920 px, run against 0.41.0's stylesheet).
- **Unchanged:** the checklist's own width (`--layout-form`), its head and progress, its steps' titles (names, not prose) and its actions.
- **Documentation:** README, AGENTS.md, the catalog (Reading width, `Checklist`), architecture, validation and the acceptance README.

## Executed checks

Results are added below as they run.

## Limits

- **Package evidence only.** The Packages interface's adoption and the family `frame` phase are recorded in the suite. No other product vendors 0.42.0 yet: Accounts, Projects, Conduict, Delegate, CDN, Snapshots, Beyond Home and the reference take it with their next vendoring.
- **Other muted lines.** Only the checklist's words changed. Other parts whose class names read as prose but sit in boxes narrower than the measure (a choice card's detail, a dictation note) were not changed.

## Family reference synchronization

For the reference's next vendoring: in a checklist wider than the measure, a step's detail and a blocked step's reason wrap at about 54 characters' width instead of running to the checklist's edge. A short detail looks the same.
