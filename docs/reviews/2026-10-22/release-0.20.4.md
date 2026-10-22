# Local UI 0.20.4 verification

UI 0.20.4 includes the coordinated changes recorded in [0.20.2](release-0.20.2.md). UI 0.20.3 introduced `Disclosure.outside` (default true). Setting it to false keeps an inline section open while another control receives a press. UI 0.20.4 adopts this behavior in shared Help. Floating menus and overlay drawers keep their dismissal behavior and guards.

## Artifact and adoption

- Archive: `dist-pack/beyond-ui-0.20.4.tgz`.
- SHA-256: `85b452feb4c8698fb00be68de06576db92fbda29d7f0c786c12a47a59099e52c`.
- Integrity: `sha512-+G0ETB9gXqL6WY09nKEbkWaxZjSGDCcmLtAO3tPLytX7YVU8YrhLBlAcUW5xpl1KUETwlIx1957GSRIgpHLz/A==`.
- Token set: 0.6.0. The optional DOM and React property extends the existing public contract.
- All thirteen coordinated consumer archives, installed source, types and fonts were checked byte for byte after offline installation with scripts disabled.

The 0.20.2, 0.20.3 and 0.20.4 archives are immutable. Compared with 0.20.2, executable changes are limited to Disclosure, its React adapter and Help; type declarations add the option. The generated CSS differs only in its version comment. Tokens, fonts and other executable sources are identical. README and package metadata also differ. Earlier runtime evidence remains attributed to its actual version.

## Executed checks

UI 0.20.4 passes 748 unit tests and the TypeScript declaration check. Installed browser acceptance passes all nine focused cases: DOM, React 19 and React 18 in Chrome, Firefox and WebKit. Each case exercises normal and reduced motion, a real pointer press and release on another action, scroll stability, explicit toggle and Escape closure, focus return, default menu dismissal and inline Help continuity.

The initial 0.20.3 fixture omitted the harness readiness marker; Chrome also received an unsupported engine name. WebKit exposed an assertion that assumed a mouse button always retains focus, although the platform can focus the body. These harness errors are preserved in the local logs. The corrected checks assert that the disclosure does not redirect focus and separately require explicit keyboard focus return. They execute against the immutable 0.20.4 artifact.

Conduict's Summary.fold opts out of outside dismissal for its inline sections. Home already uses native details. Its Files journey passes 20/20 in each of Chrome, Firefox and WebKit after the inline correction and a scoped Development width correction. Home passes 6/6 in each engine, including the real title click with expanded context. The additional Files checks cover native list/button semantics, Enter/Space, sequential keyboard focus and current versus hover states. Final reference 0.40.0 passes its build and 580 unit/model checks on 2026-10-23. Its 100 selected browser cases per engine are covered by full baselines and successful focused reruns, not one all-green run. Isolated API stand-ins do not establish provider integration or owner acceptance.

## Family synchronization

The reference's Home sections use native details; its final Working copies Development section uses shared Disclosure with outside dismissal disabled. Both preserve outside actions. Its maintained list-interaction guidance states the same inline versus floating behavior. Packages' editor chooser and conversation answer details remain floating panels; CDN's local Disclosure is native details. The generic change preserves their existing behavior. The final machine composition and scoped consumer synchronization are complete; the suite’s `branding/docs/reviews/2026-10-22/integrated-validation.md` records exact executed coverage and independent runtime limits.


## Existing local frontend

After refreshing its Vite dependency watcher without changing configuration bytes, the existing Conduict frontend serves UI 0.20.4. Its CSS matches the installed stylesheet byte for byte. Its served prebundle matches the disk cache after import-URL normalization, and all 247 mapped UI source files match the installed package. This verifies served dependencies; the product interaction results above use isolated fixtures.

A fresh read-only asset verification on 2026-10-23 again matched the served CSS, prebundle and all 247 mapped sources to 0.20.4, without restarting the frontend or changing its session. Repository documentation was updated after packaging; the archive remains immutable.
