# Release 0.7.7 — 5 October 2026

A patch release of `@beyond-js/ui` over [0.7.6](release-0.7.6.md), asked for by the suite's coordinating session after two findings:
- **Projects' frame check** (LR-02: no line of prose past 80 characters) found that `--layout-measure: 68ch` holds about 85 to 90 characters of Rubik.
- **Accounts' interface evidence** flagged the crumb (20 px tall) and the arrival line's "Back to Projects" (19 px) as targets under 24 px.

It carries token set **0.3.1**. Nothing else in the token set changes.

## The reading measure (token set 0.3.1)

**Approval.** The owner approved narrowing the measure on 2026-10-05, relayed by the coordinating session: "about 60ch, so a line holds about 75–80 characters", with the exact value chosen by measurement. This narrows the value of one of D52's layout tokens, which were approved as engineering defaults to be measured. The family reference's register records it with D52.

**Measurement.** The corpus was 100 paragraphs of the family's own prose:
- 60 in English, from the family reference's mockups;
- 40 in Spanish, from the products' catalogs and the package's labels.

Each paragraph was set in `.bui-reading` with the package's tokens, `fonts.css` and `styles.css`, in Rubik at the two prose sizes:
- body, weight 300;
- small, weight 400, which is how callouts, empty states and section descriptions are set.

Each rendered line's characters were counted, leaving out each paragraph's last line. The run used Chrome 154, Firefox 155 and WebKit 26.6. Across engines, sizes and languages:

| Measure | Longest line | 90th percentile | Average line |
| --- | --- | --- | --- |
| 54ch | 77 | 75 | 67–71 |
| 55ch | 80 | 76 | 69–72 |
| 56ch | 83 | 77 | 70–74 |
| 58ch | 84 | 80 | 73–76 |
| 60ch | 88 | 83 | 76–79 |
| 68ch (0.3.0) | 98 | 94 | 86–90 |

**The value is 54ch.** At 60ch the average line is what the approval describes (76–79), but single lines reach 88, which every product's frame check fails under LR-02. 55ch touches 80 with no margin for text the corpus does not hold. 54ch is the widest measure that keeps every measured line at or under 80, at 77, while averaging 67–71.

`ch` was kept over `rem` because it follows the font in use. A product's fallback face, or a size that is not body, keeps about the same number of characters a line, which a fixed `rem` width would not. The value is a token: if the owner prefers 55ch or 56ch, it is one line and a token set patch.

## Targets of 24 px on a small line

A crumb's link and the arrival line's "Back to {product}" are standalone navigation targets, not links inside a sentence. Both are now at least 24 px tall (WCAG 2.5.8):
- `display: inline-block` and block padding of (24 px − 1lh) / 2, with 3 px where `lh` is not known;
- an equal negative block margin.

So the hit area grows and the line keeps its height: the crumbs stay 20 px, and the arrival line stays as tall as its Dismiss button. The rules moved, with the arrival line's own, into `src/styles/arrival.css`, right after `page.css` in the cascade, so `page.css` stays under 300 lines.

## Checks

| Check | Result |
| --- | --- |
| `npm test` | 316 of 316 |
| `npm run types` | No diagnostics |
| `npm run acceptance` | 168 of 168 in each engine: Chrome 154, Firefox 155 and WebKit 26.6 |

**The first `page:` acceptance check is corrected and extended:**
- **Line counting.** It now counts the characters of each rendered line. Before, it divided a paragraph's characters by its lines, so the short last line hid long ones. With per-line counting, 0.7.6's 68ch fails with a line of 93 characters at 1023 px.
- **Targets.** It now also checks the crumb and the way back are at least 24 px tall, and that their lines keep their height. Without the new rule, the targets measure 20.1 and 18.8 px and the check fails.

`tokens.test.mjs` holds token set 0.3.1's one changed line.

Tarball: `beyond-ui-0.7.7.tgz`, `sha512-pv/M18Rro5klTGreMXPfCeLSFda2M6fwVzjReudte09UlCxCBCaf3dpnA/XK3Ihwzn1wzzFzD17CyCsWDXIlHw==`.

## Consumers

- **What changes for every consumer.** Text under `.bui-reading`, a callout's text, an empty state's body, a section's description and the header's facts wrap earlier, at most about 77 characters a line.
- **Projects.** Its frame test can drop its one named exception, the add task's token paragraph.
- **Accounts.** It fixes its own quick-login link, a local-only control, in the same round.

## What stays open

- **A multi-leg window's hand-over** stays deferred, as [0.7.5](release-0.7.5.md#what-stays-open) records.

## Family reference synchronization

The reference vendors 0.7.7 and records the owner's approval with D52's layout tokens in its register.
