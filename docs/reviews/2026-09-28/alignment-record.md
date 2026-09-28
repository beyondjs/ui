# 0.1.6 and 0.1.7: the family lockup and alignment corrections — 28 September 2026

The family's interface alignment audit of this date (the suite's `docs/reviews/2026-09-28/ui-alignment-audit.md`) found eleven defects in this package's shared components, shown by every product that vendors them. It also found each product building its own wordmark and product-name lockup, several of them wrong. 0.1.6 corrects the eleven and adds one lockup for the family.

## What changed

| Audit id | Defect | Change |
| --- | --- | --- |
| UI-01 | The unread dot of a notification sat 4.5 px above its title (10.5 px at touch size) | `notices.css`: the title's first line is one target tall through padding, and the dot is centred on it |
| UI-02 | A `bui-status` dot was centred on a wrapped label, 10.7 px below its first line | `feedback.css`: `align-items: flex-start` and a dot offset of `(1lh - 8px) / 2` |
| UI-03 | Inbox tools stood 38, 36 and 32 px tall side by side | `controls.css`: a toggle group is one control tall; `notices.css`: the tools button is control-tall |
| UI-04 | The toast's close button sat 5 px below its first line, and the toast was top-heavy | `overlays.css`: icon, first line and close button share one target-tall line. The toaster's bottom offset is `--bui-toaster-bottom` |
| UI-05 | A labelled `ActionMenu` trigger was 32 px tall beside 36 px buttons, at regular weight | `controls.css`: a trigger with a visible label is control-tall and medium weight |
| UI-06 | The action menu shrank to a narrow trigger and wrapped its items | `controls.css`: `.bui-menu { width: max-content }` within its existing maximum |
| UI-07 | A stale chip's remove button fell to a third line | `picker.css`: the reason takes the chip's last line |
| UI-08 | Inputs overflowed their container without a border-box reset | `forms.css`: `box-sizing: border-box` on inputs and select controls |
| UI-09 | The callout icon sat 1.5–2.5 px below its title at compact sizes | `feedback.css`: offset derived from the line height |
| UI-10 | Stacked table cells were inset 8 px from the page edge | `collection.css`: no inline padding on stacked cells |
| UI-11 | The bell glyph sat 1.75 units low in its box | `core/icons.js`: path centred |
| FAM-01 | Seven different wordmark and product-name treatments across the family | New `lockup` (`src/dom/lockup.js`), React `Lockup`, `.bui-lockup` rules in `header.css` and their declarations |

In the lockup, the product name is sized to the wordmark's cap height (0.714 × its height) and centred on its letters. The letters fill only the upper part of the image, above the drips of the O. It was measured in Chrome with the family wordmark and Rubik. The name's cap top and baseline fall within 0.3 px of the letters' at 21, 24 and 32 px. The other corrections were measured on the same page: the status dot, callout icon, toast parts and notice dot are centred within 0.7 px of their first line, and the inbox tools and a labelled trigger beside a button are all 36 px.

The family reference's proposal R06 (never styling the product name beside the wordmark) is not decided. The lockup is one family treatment that replaces the per-product ones, and it is the single place that would change if R06 were approved. The token set stays 0.1.0; version 0.1.6.

## What ran

| Command | Result |
| --- | --- |
| `npm test` | 85 of 85 (two new tests: the DOM lockup's markup and accessible name, and the React `Lockup` rendering the DOM markup) |
| `npm run types` | Clean |
| `npm run acceptance` | 67 of 67 (the packed tarball installed in the `dom`, `react19` and `react18` consumers, Chrome headless) |
| Measurement page (scratch, not retained) | The lockup, status, callout, toast, notice, inbox tools and labelled trigger, as above |

## 0.1.7: the lockup in the header

The products' adoption of 0.1.6 found two gaps:

- **The brand read twice.** `Header` kept `brand.label` as hidden text beside a `logo`. A named lockup therefore read "Beyond Snapshots Beyond Snapshots" unless the product hid it.
- **No React `logo`.** The React declarations had no `brand.logo`, and a React product could pass only a DOM node.

0.1.7 closes both:

- **One accessible name.** With a picture (`lockup`, `logo` or `image`), `Header` names the brand link by `aria-label` from `brand.label` and hides the picture from assistive technology. With no picture, the visible label stays the name.
- **`brand.lockup`.** The new `brand.lockup: { src, name }` builds the family lockup inside the header, in both the DOM and the React `Header`.
- **Declarations.** `lockup` and `logo` are declared for both.

The brand tests moved to `tests/brand.test.mjs`, because `controls.test.mjs` would have exceeded the 300-line target.

| Command | Result |
| --- | --- |
| `npm test` | 86 of 86 |
| `npm run types` | Clean |
| `npm run acceptance` | 67 of 67 |

## Consumers

Recorded when the products adopt the release in the same assignment.
