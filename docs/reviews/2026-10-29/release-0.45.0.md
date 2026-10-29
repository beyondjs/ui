# UI 0.45.0: shared composition

Executed locally over baseline `efe0fc8` on 2026-10-29, with the source changes uncommitted during validation. The owner commissioned Layout, Sidebar and Lists across applicable products. This is implementation evidence, not publication or visual acceptance.

The archive `dist-pack/beyond-ui-0.45.0.tgz` has integrity `sha512-Lt0KFehHFZAzLkpZ6pFrhCHBcYHUIH+u83IkE4BFyClOF9zrpwrD8dYsXVDWSlzRcf53Y++7MsEh3JdY0sT9Hg==`. Consumers compare every installed file with it (491 files). Styles SHA-256: `0802c8f6a4d56dfb9ee706570074bbe84343ef7ac6bf134862156d7d0b920af9`. Tokens remain 0.8.0.

Initial 0.45.0 source unit suite: 1113 passed, no failures or skips. TypeScript fixtures passed. Focused installed Chromium global-navigation checks passed for DOM, React 18 and React 19 in both themes and widths 320–1440. Composition geometry passed for the three adapters. The broad and subsequent focused three-engine results are recorded separately below; these shared fixtures are not product integration.

The public contracts are in [composition](../../composition.md) and [Sidebar](../../sidebar.md). Consumers adopt the package’s public options and classes, rather than reproducing its styling. The suite’s family reference records consumer applicability, source baselines and local runtime evidence under its common-composition review.

## Final regression evidence

Earlier focused source checks passed 29 tests and TypeScript fixtures. Navigation and composition passed six checks in each of Chrome, Firefox and WebKit on candidate Gq74: DOM, React 18 and React 19, including inline/contextual layouts, keyboard focus, persistence, mobile transitions and 40 px organization marks contained in both inline and stacked rows. The hsFJ change only aligns a terminal CopyValue wrapper’s font with its small control before computing the optical inset.

On hsFJ, all four notice-inset checks passed in each engine: DOM and React 19, 1440/390 px, both themes, compact density and coarse input. An independent diagnostic additionally passed 96 measurements across DOM/React 19, default/small inherited fonts, Chrome/WebKit, both widths/themes and all three input/density states. Eight valid family Frame samples passed; four injected oversized notices were rejected. Inline and stacked mark geometry remained contained.

The earlier broad sweep is retained as diagnostic evidence: Chrome 500/501, Firefox 501/501 and WebKit 494/501. WebKit findings led to explicit object-button focus and terminal-copy inset repairs. The isolated Chrome coarse-Unavailable finding did not reproduce in six independent samples and passed the final coarse-inset check. These final targeted results close those findings; no all-green rerun of the entire broad sweep is claimed.

The BWIf candidate additionally covers a React ListRow inside a product's list item: the first row has no duplicate divider and the two end rows retain the frame corners. DOM, React 18 and React 19 passed the wrapped composition check in all three engines at 320/390/960/1920 px in both themes (three checks per engine). The BWIf source regression set passed 22/22. This selector-only correction leaves the previously verified terminal-copy geometry unchanged.

## Mobile table menu clearance after BWIf

The refreshed Accounts mobile capture exposed menu buttons extending into the first metadata line. The canonical narrow table rule now reserves the menu's lower overhang in the existing flex line break, only for a nonempty menu cell. Its symmetric lift and name alignment remain unchanged; metadata starts below the full painted target.

Before repacking, isolated consumers installed BWIf and applied the exact updated `src/styles/table.css` as a source overlay (SHA-256 `7a8fe49ed8264590eadbbf556098e93917d4db02cd9698ac7c527277f336a458`). A negative control reproduced the original 8 px overlap in Chrome, Firefox and WebKit. All three engines then passed five focused checks each: the new clearance check in DOM, React 18 and React 19, and the existing menu interaction check in DOM and React 19. The new check covers 320/390 px, fine/coarse input, both themes, native `menu(row)` and product-owned menu columns, wrapped names, empty menu rows, containment and independent activation. That is 72 page contexts and 432 visible menu geometries across the three engines. Existing checks also retain wide-table geometry, reveal, keyboard and touch behavior.

Those preliminary results verify the CSS source overlay. The final Lt0K archive recorded above then passed the same five focused checks in each engine from installed DOM/React consumers, plus ten focused source tests and TypeScript fixtures. Accounts independently passed 16 mobile member cases in each engine, with no overlap beyond 0.016 px subpixel rounding, using the actual product composition. An independent source and rendered review found no remaining menu-clearance issue. BWIf and earlier candidate evidence above remains historical evidence.
