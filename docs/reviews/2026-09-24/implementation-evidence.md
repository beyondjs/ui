# @beyond-js/ui 0.1.3 — implementation evidence (September 24, 2026)

Two options Delegate asked for during its adoption, recorded there as pending requests to this repository (its experience checklist row 29 and its decision register), added in package 0.1.3. Both are additive: no existing signature or default changed, and the token set is unchanged (`tokens.version` `0.1.0`, sheet byte-identical to the baseline).

| Option | Behavior | Proved by |
| --- | --- | --- |
| `Picker` `all` (multiple pickers only; React prop `all`) | A quiet "Select all shown" action in the picker's foot (label `all`, localized by the consumer) adds, in one change and one `onchange`, every result shown that is enabled and not chosen yet, across every page loaded with "Load more". It is offered only while the results are ready and one is left to add; when it leaves while focused, focus returns to the search field. Disabled results are never added. A product's own limit (for example a maximum) stays the product's check when it commits | `tests/picker.test.mjs` (two tests: additions keep an earlier choice from another query, skip the disabled result, report one change, hide the action and return focus, and offer it again after "Load more"; not offered by a single picker or without the option); `acceptance/checks/picker.mjs` in Chrome on the DOM, React 19 and React 18 consumers, with Spanish copy on React |
| `confirm` `focus: 'cancel' \| 'accept'` (also through React `useConfirm`) | Which button starts focused, independently of the tone. The default is unchanged: Cancel for `tone: 'danger'`, Accept otherwise. `focus: 'cancel'` without the danger tone keeps the primary accept styling, for consequential steps that are not destructive, such as a publication | `tests/dialog.test.mjs` (a non-danger confirmation starting on Cancel with a primary accept; a danger one asking for Accept) |

Executed on Node.js 22.21.1, Chrome 153.0.8010.53, playwright-core 1.63.0, React 19.3.0 and 18.3.1, TypeScript 7.0.2.

| Check | Result |
| --- | --- |
| `npm test` | 79/79: 0.1.2's 76 plus the three tests above |
| `npm run types` | Passed |
| `npm run acceptance` | 64/64: plain DOM 24, React 19 26, React 18 14 (0.1.2's 61 plus the "Select all shown" check on each consumer) |

Final tarball: `dist-pack/beyond-ui-0.1.3.tgz`, integrity `sha512-X0vgzgReH7eOkwevjhEuZwZWozLzBBuMLXewJlLq9uUtapcgecBxWtwtu21Uw0/3VDmWN20hEopM4AXw73ZGhQ==`, 73 entries; the acceptance run after the last source change packed the same integrity.

Consumers: Delegate re-vendored 0.1.3 the same day and uses both options (batch selection offers "Select all shown"; every Delegate confirmation starts on Cancel), recorded in its own evidence; Branding re-vendored it to model them. Projects, Snapshots, Accounts and Workspace stay on 0.1.2 and CDN on 0.1.1: they use neither option, so nothing changes for them until they re-vendor.

Not established: the new options are exercised with the fixture pages and Delegate's own journeys only; no screen reader announced the added count (the count is in the picker's existing polite live region).

**Family reference synchronization — synchronized in the same assignment:** Branding re-vendored 0.1.3 and models both behaviors; its component catalog lists the two options as implemented and no longer as pending requests. Its own record is under `branding/docs/reviews/2026-09-24/`.
