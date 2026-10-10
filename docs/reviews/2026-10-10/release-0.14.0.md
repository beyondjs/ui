# Release 0.14.0 — 10 October 2026

The conversation round the owner approved on 2026-10-10 as settled contract S29: the family rules
FR-1 to FR-9 of the family reference's record of that date (`branding/docs/reviews/2026-10-10/
conversation-sidebar-proposals.md` in the Beyond Suite repository) entered the register as D94 to D102,
and Conduict's audit of the same date (its `docs/reviews/2026-10-10/conversation-experience-audit.md`)
traced most of its corrections to this package. Token set 0.5.0. Every part is generic: products bring
their words, their commands, their transcription service and their adoption.

| Rule | 0.14.0 |
| --- | --- |
| D94, an anchored composer | `Page`'s `thread` template: the frame fills the window under the chrome (`--bui-page-chrome`) with no padding under its content; the main column ends with the `dock` (`PageDock`), pushed to its end and sticky at the window's bottom with one gutter and the safe area under it; its hairline only while content passes beneath, from an `IntersectionObserver` on an end mark. The header ends at the thread's edge, so the panel's toggle never moves |
| D95, motion follows the person's action | `--motion-exit` (120 ms) and `--motion-ease-exit`; a page's panel enters and leaves with transform and opacity (`Motion`), its columns changing once; `SideSheet` and menus (`ActionMenu`, `ChoiceMenu`, the composer's split menu, disclosures) leave as an inert picture (`Leaving`, generalized from 0.1.5's disclosure exit); activity bodies and `bui-summary` disclosures ease their height (`interpolate-size`, `::details-content`) and fade elsewhere; live dots pulse about five seconds, then hold; nothing moves under reduced motion |
| D96, one edge, one lane | `--layout-lane` (the 54ch measure after `--layout-indent`, the rail's 2.125rem) and the wide lane `--layout-thread` (52rem, approved by D96 as an amendment of D67's tier); `.bui-lane`, `.bui-lane-wide`, `RailItem`'s `wide`; a panel kept in view comes next to the lane and takes what is left up to `--layout-aside-max`, the rest on the far side |
| D97, action and search with their object; groups fold | The `Sidebar`'s `kind: 'object'` group (heading line with the action and the `search` icon expanding in place; groups of entries; `more`), disclosure headings that keep their count and current item, kept per device and product in `localStorage`, `attention` groups that keep their tone and open by themselves, an opt-in ⌘K / Ctrl+K a host can turn off (off by default, so a product's own command palette keeps the key), the objects' action on the product row below the cut |
| D98, the current item is not a link | The text color at weight 500 with the accent bar and its surface |
| D99, Facts in two columns | The value in a fixed column after the label (`--bui-facts-label`, 9.5rem); a number at the end in tabular figures (`numeric`) |
| D100, one composer, one place | `Composer`'s `tray`, a focus border instead of an outline ring (CV-16), commands after "/" (`commands`), `recall` on ArrowUp in an empty field, the growth cap near a third of the window with **Expand** into a taller editor (CV-11), and **Dictate** (`dictation`, `ComposerDictation`) |
| D101, one state, one place | No component: the rule is the product's composition (Conduict's composer line and panel) |
| D102, one control style per quiet line | `ActionLine` and `.bui-path` |
| Conduict's P3, code colors | `Highlighter` (text nodes and spans, no `innerHTML`) and the proposed `--color-code-*` roles, in `Diff` and activity sections |

Dictation is the browser side of Conduict's E112: voice to editable text, never sent, with MediaRecorder types
negotiated as `audio/webm;codecs=opus`, `audio/webm`, `audio/mp4` (no Ogg: the chosen provider refuses it), a
cap of 120 s, nothing transcribed under one second ("Too short to transcribe", the recording kept), a bounded
transcription with Cancel, and every failure in words with its ways on. The product's `transcribe` makes the
request; the package keeps nothing and adds no origin to a content security policy.

## Migration

- **A conversation page.** Use `new Page({ template: 'thread', dock: composer, … })` (React `dock`) and delete
  the product's own sticky dock (`position: sticky; bottom: 0` inside the frame). Give message, prose and the
  rail's content the lane (`.bui-lane`, or the thread template's own rules) and code, diffs, tool output and
  approval cards `.bui-lane-wide` (or `RailItem`'s `wide`). A host with chrome of its own sets
  `--bui-page-chrome`. A product's header that widened over thread and panel ends at the thread's edge.
- **The sidebar.** The top `action` and `search` keep working where they were. To adopt D97, move them into
  a `kind: 'object'` group with the entries groups and the `more` link, and drop the top ones; pass
  `shortcut: true` only where the product has no command palette of its own. Groups of entries with a heading
  fold from 0.14.0; `fold: false` keeps a plain heading. Mark a group whose items need the person with
  `attention: true`.
- **The composer.** Keep one `Composer` for a new and a started conversation in the dock; give the new
  conversation's choices as `tray` chips and set `tray = null` once it exists; a product's own narrow menu of
  commands becomes `commands`. A product that drew an outline around the focused composer deletes it.
- **Facts.** A number given as a string that should align to the end says `numeric: true`.
- **Motion.** A product's own surface that opens and closes in place uses the same tokens; nothing else to do
  for the shared components.

## Verification

Every result is local, on one machine, against the packed tarball `beyond-ui-0.14.0.tgz`
(`sha512-ANTl0UE1f8G45JyekO+aQfsOBph2JVi+HvHo+wuMhXXrhXJO+K+enQPQqQFgLA+zI6/ZtiRP1NYyBTDX1DDdLA==`, the same
bytes for the final Chrome and Firefox runs and `npm run pack:consumers`).

| Check | Result |
| --- | --- |
| `npm test` | 566 passing (496 in 0.13.1): `dock`, `objects`, `edges`, `quiet`, `react-round`, `dictation`, `dictation-failures` and `highlight` added; `tokens` lists token set 0.5.0 and holds the code colors to 4.5:1 on canvas, surface, surface-sunken and a diff's added and deleted rows in both themes; `foundations` admits the composer's taller editor among what overlaps |
| `npm run types` | Passes, with `fixtures/types/round.ts` and `round.tsx` for every new option and class |
| `npm run acceptance` | 282 of 282 checks in Chrome 154, Firefox 155 and WebKit 26.6, each engine run whole (263 in 0.13.1; `anchoring`, `moving`, `seeking` and `editing` add 19). Dictation ran with a fake microphone in Chrome and Firefox; Playwright's WebKit has no fake capture device, so its dictation check returns there without asserting. Firefox closes an activity body at once (it does not transition `display`) and its `::details-content` style cannot be read, so those two motions are asserted in Chrome and WebKit only |
| Changed expectations | `panels.mjs` waits for the panel's exit (D95); `thread.mjs` expects the main column at the lane beside the panel (D96); `fitting.mjs` expects Claude Code's chips shown at the lane and lets a running Codex turn's long chips fold behind Options there (they fit only at the 52rem thread tier, which D96 now gives to code) |

Not established: any product's adoption (Conduict, the family reference and the other products vendor 0.14.0 in
their own assignments), a real transcription provider, a real microphone or a phone, Safari itself (WebKit is
its engine), screen reader output, and the Desktop's ⌘K handling, which belongs to the Desktop.

## Family reference

The family reference (`branding/`, owned by the suite) models these rules in its own assignment of this round
(its register's D94 to D102 and S29, its thread, sidebar, start surface and motion). This package's change is
visible in every product that re-vendors it; each product's adoption is its own assignment. Synchronization
outcome for this repository: **synchronization pending in the family reference's own assignment** (the
reference re-vendors 0.14.0 and models it; nothing in it was changed here).
