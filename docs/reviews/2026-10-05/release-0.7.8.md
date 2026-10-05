# Release 0.7.8 — 5 October 2026

A patch release of `@beyond-js/ui` over [0.7.7](release-0.7.7.md).

After moving to 0.7.7, Projects' frame check, which counts the characters of each rendered line, found two shared parts that did not take the reading measure:
- `Unavailable`'s reason: 83 characters on Projects' projects page, at 1024 to 1920 px;
- `Field`'s hint: 97 characters on the add task.

Rather than add those two, this release gives the measure to every part of the package that holds a product's sentences, and adds a check that finds any it misses. The token set stays 0.3.1.

## What changed

| Change | Detail |
| --- | --- |
| Every prose part takes `--layout-measure` | One rule in `src/styles/prose.css`, last in the cascade. It covers the parts that already had it (`.bui-reading`, a callout's text, an empty state's body, a section's description, the header's facts) and adds: a field's hint, a statement as a whole (its hint keeps a line of its own), a choice's description, reason, note and detail, `Unavailable`'s reason and body, the picker's status, a notice's text and summary, a copied message's text, `Awaited`'s why, reason and note, a step's reason, a line's note, technical details' text, a consequence, a question's message, a dialog's description, the preferences' note, a secret's summary, a disclosure's help, a toast's text and detail, a chip's reason and a menu's reason. The measure is a cap, so it never widens anything. A statement's hint keeps a line of its own through `flex-basis: 100%`: capping the hint, or the statement's text, let the hint rise beside the value, which the `choose:` check caught, so the cap is on the statement as a whole |
| A check that finds a missed part | The acceptance's `prose:` check opens each DOM fixture page at 1920 px. It puts a long paragraph into every block whose class names a prose role (`hint`, `reason`, `description`, `note`, `why`, `summary`, `detail`, `message`, `text`, `status` or `body`), counts the characters of each rendered line, and fails on any past 80. On 0.7.7 it found ten parts past 80, at 82 to 265 characters, among them 06's two |

## Checks

| Check | Result |
| --- | --- |
| `npm test` | 316 of 316 |
| `npm run types` | No diagnostics |
| `npm run acceptance` | 169 of 169 in each engine: Chrome 154, Firefox 155 and WebKit 26.6. New: `prose:`. On 0.7.7 it fails with ten parts past 80 characters a line |

Tarball: `beyond-ui-0.7.8.tgz`, `sha512-gYhS9WsyToGGAvxIJtt3WUmIQzHRSoyqbTF40GPN+lKM184uFSOdb4mhmRusrFmKEbfIBtB+Kx9ObInfjMx3pg==`.

## Consumers

- **What changes for every consumer.** A product's own words in these parts wrap at about 77 characters a line, wherever the part sits.
- **Projects.** It can drop the two named exceptions in its frame test.

## What stays open

- **A multi-leg window's hand-over** stays deferred, as [0.7.5](release-0.7.5.md#what-stays-open) records.

## Family reference synchronization

The reference vendors 0.7.8 together with 0.7.7 in one round.
