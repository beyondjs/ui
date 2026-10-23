# Local UI 0.25.1 verification: React draws an outage's place as one quiet line

Evidence baseline: UI `5ffcaf1` (0.25.0) plus this change, made in a worktree on 2026-10-23. Token set 0.6.0 is unchanged. Implementation is not the owner's acceptance.

## What changed

**React's outage place had a box.** Since 0.24.1, the DOM `EmptyState` draws an outage's place as one quiet line: no box unless `frame` asks for one.

React's `EmptyState` still defaulted `frame` to `true` and passed it to the DOM component. As a result, React products kept the box on every outage place, including `Section`'s `unavailable`, unless they passed `frame={false}`. Delegate's adoption of D163 found this.

Now `frame` left unset takes the DOM component's default: a box for every kind except an outage. The declarations type `frame` as `boolean | null`.

## Executed checks

- **Unit suite:** 786 of 786 (`npm test`). This includes a new React case: an outage's place is unframed by default and framed when asked, an empty place keeps its box, and `Section`'s `unavailable` follows the same rule. The new case fails without the change.
- **Declarations:** `npm run types` passes.
- **Full browser acceptance in Chrome:** 355 of 355.
- **Recovery browser checks:** `checks/recovering.mjs` passed 7 of 7 in each of Chrome, Firefox and WebKit. It was installed from the packed archive into the `dom`, `react19` and `react18` consumers. It now also measures that each outage place has no border, in all three consumers.

## Artifact

- Archive: `dist-pack/beyond-ui-0.25.1.tgz`, packed from the release commit.
