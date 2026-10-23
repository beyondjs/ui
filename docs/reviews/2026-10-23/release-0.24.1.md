# Local UI 0.24.1 verification — what the products' adoption of 0.24.0 found

Evidence baseline: UI `d063a03` (0.24.0, an outage said once) plus this change, made in a worktree on 2026-10-23. Token set 0.6.0 is unchanged. Implementation is not the owner's acceptance.

## What changed

- **An outage's place is one quiet line.** Accounts' Security page drew four framed "Not available right now" boxes for one outage. `EmptyState`'s `outage` is now unframed by default, its mark beside its words in muted text; `frame: true` still asks for a box, and the other kinds keep theirs.
- **A shared read runs once per attempt in React.** React's `Recovery` wrapped each read's callback in its own function, so the DOM notice could not tell that several reads were one: a callback they shared ran once per read on each attempt. It now shares one call per callback while an attempt runs (found by Snapshots).
- **An empty React notice takes no room.** Its host element took a gap in a grid or a flex row while the notice was hidden (found by Snapshots and Accounts, each with a wrapper of its own); `.bui-host:has(> .bui-recovery[hidden])` now takes none.

## Executed checks

- Unit suite: 778 of 778 (`npm test`), including the new React case of a shared read and the outage place's frame by default.
- Declarations: `npm run types` passes.
- Browser acceptance, installed from the packed archive into the `dom`, `react19` and `react18` consumers: `checks/recovering.mjs` 7 of 7 in each of Chrome, Firefox and WebKit.

## Artifact

- Archive: `dist-pack/beyond-ui-0.24.1.tgz`, packed from the release commit.
- SHA-256: `db9b4fe22c01de2ccbd8ea962e0800673dfc6ab782ba5147b859660a34385fc8`.
- Integrity: `sha512-7ka31zZXVziEiPf/MEn0abplGyJwXAankuf9twJlqn2K8Ffk9qt4eqt4CY6fgfxNIuQAvCmyJVbcyblMEXeCoA==`.
