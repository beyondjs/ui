# Architecture and decisions

## Boundary

UI owns reusable cross-product interface: design tokens, header and navigation building blocks, controls, fields, pickers, dialogs, collections, feedback, motion and the presentation of suite notifications. Products keep their domain behavior, resource authorization, navigation policy and copy: a component never decides who may enter a product or perform an operation, and never performs a business action. Branding keeps the navigable family model, journeys, experience proposals and the evidence of what products implement.

The package is `@beyond-js/ui`, version 0.1.1 (0.1.0 with the corrections product adoptions found; token set still 0.1.0). It is implemented and verified locally (see [validation](validation.md) and the [implementation evidence](reviews/2026-09-23/implementation-evidence.md)); it is not published, and no product consumes its components yet. Branding consumes its tokens.

## Structure

- `src/foundations/`: the canonical token data and `TokenSheet` (public module `@beyond-js/ui/tokens`). Plain data with no browser, bundler or framework dependency.
- `src/dom/`: the DOM core (`@beyond-js/ui/dom`, also the package root). Each component is a class that owns its element in `#private` state, mounts with `mount(parent)` and releases everything with `destroy()`: the element, listeners registered on `document` or other targets (`Component.listen`) and timers (`Component.later`). Larger components are composed of collaborators in their own directory (`picker/`: `Search`, `Selection`, `ResultList`; `collection/`: `Loader`, `Table`; `notifications/`: `Feed`, `NoticeList`, `Actions`, `Panel`, `Moment`, `Reach`).
- `src/react/`: the React adapter (`@beyond-js/ui/react`). Interactive components create the DOM class in a layout effect, place its element in a host React renders and destroy it on unmount; React content goes into component slots through portals (dialog body and footer, header slots, collection cells, help and disclosure panels). Simple elements (buttons, status, badges, callouts, loading, skeletons, fields, choices, selects) are rendered by React with the same markup and classes as the DOM builders, which a test compares.
- `src/styles/`: the component stylesheets, concatenated by `tools/build.mjs` into `dist/styles.css`; `dist/tokens.css` is generated from the token data.
- `types/`: hand-written declarations for every public module.

## Decisions

| Topic | Decision | Reason |
| --- | --- | --- |
| Renderer | Framework-free DOM core with a React adapter over it | One behavior implementation for the plain DOM consumer (Branding) and the React consumer (Delegate); neither React-only nor Web Components |
| Adapter rendering | Interactive components are driven by the DOM classes; simple elements are rendered by React with identical markup | Behavior such as focus, busy dismissal and paging is written once; simple markup stays idiomatic React |
| Source format | Plain ESM JavaScript, hand-written `.d.ts`; only the stylesheets are generated | No compile step between source and consumer; TypeScript consumers are checked by `npm run types` |
| Distribution | `npm pack` tarball vendored in each consumer's `tools/` (`file:tools/beyond-ui-<version>.tgz`) | Consumption from an installed artifact, never a sibling path, following the suite's `dev-orchestrator` pattern; no publication is authorized |
| Tokens | Canonical in this package from 0.1.0 (`src/foundations/`), moved unchanged from Branding with `provenance` (origin `branding/src/foundations`, suite revision `4c47733631efa4f16fd04ebcb2867de5dbd5b8f1`); `status` stays `proposed` | The versioned extraction the scope allows; one canonical copy. A test proves the generated sheet is byte-identical to Branding's earlier output. The move approves no value |
| Branding consumption | Branding's `src/foundations/` re-exports `@beyond-js/ui/tokens` from the vendored tarball | Branding keeps its import paths and holds no copy |
| Theming | Token custom properties per theme under `data-beyond-mode`, then `prefers-color-scheme` | The attribute the Beyond products already use |
| Copy | Every component takes `labels`; entries are strings with `{placeholders}` or functions for plurals and word order | Products localize (EN/ES); English is only the default |
| Notifications | Components read a consumer adapter shaped after `beyond-notifications/1` (`summary`, `list`, `read`, `unread`, `open`) and keep no item text after the view that showed it | Projects owns aggregation and read state; products own relays, permissions and destinations |
| Unit DOM | happy-dom for Node's test runner | It implements `<dialog>`, constraint validation and events, which jsdom lacks in part; layout, focus rings and real keys are proved in Chrome |
| Versions | The package version and the token set version (`tokens.version`) are independent: 0.1.1 is a package correction and the token set stays 0.1.0 | A token set changes only with a deliberate, evidenced token change; consumers re-vendor for component fixes without a token change |
| Notification summary | The adapter summary accepts `more` (a bounded count, shown "N+") and `sources: [{ product, state }]` beside `unavailable` | Beyond Projects answers `{ unread, more, sources }`; product relays keep the earlier shape |
| Branding rename or merge | Not selected | Unchanged owner position |

## Approved implementation acceptance

1. Inspect both consumers and select public contracts that support them; keep product policy outside the components.
2. Design a deliberate token extraction with one canonical source, provenance and versioning (executed at 0.1.0; see Decisions). Existing foundation aesthetics and interaction proposals still await owner approval.
3. Implement components with explicit ownership, cleanup, accessibility, keyboard/focus behavior and reduced-motion behavior. Select distribution and adapters through demonstrated consumption in React and plain DOM.
4. Add public-contract tests, real consumer fixtures and installed/exported acceptance. Demonstrate both consumers before reporting integration.
5. Apply the family-reference synchronization policy as product-visible changes are commissioned. Update Branding's affected representations and evidence in that assignment; onboarding does not modify simulated journeys.

Steps 1 to 4 are implemented for the package itself; consumer adoption and the product browser results of step 4 remain with each product's assignment. No commit, publication, deployment or data-migration authority follows from the implementation.


## September 23 shared experience scope

Implement reusable public components actually consumed by Delegate React and Branding plain DOM, including a common header. Select renderer/adapters/distribution through real consumption; do not force an exclusively React architecture or Web Components. The versioned token extraction is executed: tokens are canonical in this package from 0.1.0 and Branding re-exports them; never maintain competing canonical copies. No Branding rename/merge is selected and no blanket approval of its older proposals is implied.

Required components/patterns include shared header/navigation primitives, buttons/actions/menus, fields/validation, checkbox/radio, finite selects and searchable single/multi-entity pickers, dialogs/confirmations/focused forms, tooltips and persistent essential help, compact collections/search/filter/paging, loading/error/status/feedback and motion. Essential help must remain accessible on touch and by keyboard, not only hover/native title. Native finite selects may remain where usable; searchable entity collections require appropriate behavior and scale. Selection across filters/pages, counts, loading, no matches, failure, stale/ineligible selection and permission loss need clear contracts; authorization remains in each product.

Provide asynchronous custom in-app alert/confirm/prompt capabilities as needed by actual callers. The production interaction audit verified one `window.confirm`, Delegate's drafts guard, and no production alert/prompt. Adapting it must preserve navigation continuation/cancellation, independent browser `beforeunload`, multiple draft tokens and saved-but-refresh-failed semantics. Do not claim that native prompts are ubiquitous or promise to suppress browser-controlled unloading. Preserve busy nondismissibility where domain integrity requires it, double-submit prevention, Escape policy and focus restoration.

Audit all products and adopt shared replacements in every applicable surface, preserving their working behavior and domain contracts. Current Projects search/state filtering and create/adopt/rename/archive/delete/repository dialogs, Accounts feedback dialogs, Workspace dialog focus/Escape, both CDN management dialogs, Snapshots controls/identifier help and Branding builders/dialog/menu/table are existing product-local implementations, not UI consumers. Record actual adoption and justified remaining copies rather than counting an inventory as integration.

UI also supplies the suite notification header entry, panel and full inbox. Projects owns aggregation and durable read state; products own meaningful events/recipients/resource access/destinations. Read markers and clicks perform no business actions. Show permission-filtered counts/previews and explicit unavailable/degraded states; CDN + Accounts must work without Projects. Notifications are in-app only and distinct from toasts; no later channel implementation is required.

Branding must catalog each shared component, variants, use guidance, actual consumers, implemented/pending states and residual copies. Maintain bidirectional scenario/rule parity, coverage matrix and evidence in the same implementation assignment. Branding is the high-level family model, not a duplicate backend.

## Cross-product acceptance

Demonstrate actual public component consumption in Delegate React and Branding DOM, then all applicable product adoptions. Verify mounting/unmounting/cleanup and installed/exported artifacts. Test keyboard/focus/Escape, zoom, narrow/touch, EN/ES products, themes, reduced motion, loading/error/no matches, filter/page selection, stale eligibility/permission loss, double-submit prevention, drafts and retained list/back-forward context. Preserve usable native semantics. Record product browser results independently from component fixtures and reference simulation. A generic component demo or screenshot does not prove adoption.
