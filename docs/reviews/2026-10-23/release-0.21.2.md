# Local UI 0.21.2 verification — the opening still under reduced motion, and robust

Evidence baseline: UI `c03b102` (0.21.1, the family's list rules over 0.21.0's opening, with its archive's record) plus this change, made in a worktree on 2026-10-23. Token set 0.6.0 is unchanged. Implementation is not the owner's acceptance.

## What changed

- **Reduced motion.** 0.21.0 stopped the opening's motion under `prefers-reduced-motion: reduce` with `animation: none`, which lost on specificity to the running step's rule (`.bui-opening-step[data-state='active'] .bui-opening-dot`): the running step's mark kept pulsing. WebKit also kept the trace's animation alive under `display: none`. Found by the suite's built-document opening acceptance in WebKit against Packages, whose own stylesheet arrives with its module and so did not mask it. The trace's light, the running step's pulses and the steps' arrival are now declared only under `prefers-reduced-motion: no-preference`.
- **Another version's document.** A development server whose package changed under it can render the earlier markup while serving this controller (observed on a running local Conduict). The controller now checks its parts once and, when they are missing, only ends the opening on readiness, without an error.
- **Durations under a tenth of a second** read "< 0.1 s" («< 0,1 s»), never "0.0 s" (found by Projects' adoption: its session read usually takes tens of milliseconds, so a slow read would have said "usually 0.0 s").
- **Unnamed steps.** A step a product does not name is said in one short line: its status line (`role="status"`), else its first line of text, to the end of its first sentence. A note a region adds while it waits starts no new step (found in Beyond Home's window host).

## Artifact

- Archive: `dist-pack/beyond-ui-0.21.2.tgz`.
- SHA-256: `9185538fc6624f6b0998bb64459d72d6941b9c4602a2b0dd0941b23f7669bc44`.
- Integrity: `sha512-QvdJPlEyd+OA6Hj+hnsPTDIrfpvtXOgzL70mcs3NjVBse+Lc54MzkQfzDCk/OV5xeSJluxs8CoIu8sdAHFiOxg==`.

## Executed checks

- Unit suite: 761 of 761 (`npm test`), including the stylesheet check that no opening animation is declared outside the no-preference block; declarations pass.
- Opening acceptance (`npm run acceptance:opening`): 16 of 16 in each of Chrome, Firefox and WebKit, adding nothing running under reduced motion while the steps show (it fails against 0.21.0's stylesheet with `bui-opening-pulse` running), an unnamed region said in one line with a note added below it, and the earlier markup with this controller ending without an error.
- The installed DOM/React browser acceptance was not run again: this change touches only `src/opening/`, which those consumers do not load; 0.21.1's run covers the rest of the package.
