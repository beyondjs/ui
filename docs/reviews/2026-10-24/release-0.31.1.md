# Local UI 0.31.1 verification: a list's keys only where the focus can move

Evidence baseline: UI `f262120` (0.31.0, a product arrives once) plus this change, made in a worktree on 2026-10-24. Token set 0.7.0 is unchanged. Implementation is not the owner's acceptance.

## Why

The owner reviewed Conduict's All conversations with one conversation. Its end line said "1 conversation · nothing older" and "↑ ↓ to move · Enter to open", but Up and Down move nowhere from the only row: `RowKeys` keeps the focus on it. The hint promised a move that cannot happen. This was gap 11 of the suite's `ui-list-rules-gaps` pending (the family's list rules L5 and L7, D162).

## What changed

- `Collection`'s end line shows its keys only where the focus can move: on a page of two rows or more, or of one row a search reached, since Down from the search input goes to it.
- A list of one row says only its words. A list whose rows open nothing still says no keys, and touch screens still hide them.
- `docs/components.md` and the README say so.

## Artifact

- Archive: `dist-pack/beyond-ui-0.31.1.tgz`.
- SHA-256: `ae03640555a384aca334be31f5e64979d7ddbff267fb1c6c56f2fc28f31b4510`.
- Integrity: `sha512-6LS6SVpngYpL8bKjqko9wYMAxOLG9x0/Ge3INSCrPAnRm1FMTJXZVakLvCXnEVEa47mNcKfL1+wbxsjjXVw/Bg==`.

## Executed checks

- Unit suite: 840 of 840 (`npm test`). The new test in `tests/list-rules.test.mjs` covers one row alone, one row a search reached and a last page of one row; it fails against 0.31.0's `collection.js`. Declarations pass (`npm run types`).
- Browser acceptance (`npm run acceptance`): 380 of 380 in Chrome. Firefox and WebKit were not run: the change adds or leaves out one element and touches no geometry, motion or engine-specific behavior.
