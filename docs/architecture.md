# Architecture and decisions

## Current boundary

UI is a documentation-only library scaffold. It has no public package name, module API, runtime, renderer, build pipeline or delivery format. The owner-selected responsibility is reusable cross-product UI: header/navigation building blocks, typography and color foundations, tokens, controls, dialogs and motion. Products retain their domain behavior, resource authorization and navigation policy; reusable building blocks do not decide who may enter a product or perform an operation.

Branding remains the broader navigable family model, functional journeys, user experience and evidence of what products implement versus what is pending. Its current implementation uses Vite, JavaScript DOM classes, shared chrome and plain-data foundations. Delegate is an intended React consumer. UI must be consumable by both; adaptation, lifecycle, styling and distribution contracts require design and execution before a compatibility claim is made.

## Decisions

| Topic | State |
| --- | --- |
| Shared components and foundations owned by UI | Owner-selected direction; not implemented |
| Branding family model and experience evidence | Retained in Branding |
| Canonical tokens | Existing Branding `src/foundations/`; no extraction or duplicate copy |
| React and plain DOM consumption | Required future consumer boundaries; unverified |
| Renderer, adapters, packaging and public names | Open; no exclusive React architecture or mandatory Web Components |
| Branding rename or merge | Floated, not selected; no action authorized |
| Product redesign and shared adoption | Approved September 23 next implementation scope; documentation-only baseline remains |

## Approved implementation acceptance

1. Inspect both consumers and select public contracts that support them; keep product policy outside the components.
2. Design a deliberate token extraction with one canonical source, provenance and versioning. Until executed, retain Branding as canonical. Existing foundation aesthetics and interaction proposals still await owner approval.
3. Implement components with explicit ownership, cleanup, accessibility, keyboard/focus behavior and reduced-motion behavior. Select distribution and adapters through demonstrated consumption in React and plain DOM.
4. Add public-contract tests, real consumer fixtures and installed/exported acceptance. Demonstrate both consumers before reporting integration.
5. Apply the family-reference synchronization policy as product-visible changes are commissioned. Update Branding's affected representations and evidence in that assignment; onboarding does not modify simulated journeys.

The September 23 owner decision commissions the next implementation scope described below. This documentation change implements no components and grants no commit, publication, deployment or data-migration authority.


## September 23 shared experience scope

Implement reusable public components actually consumed by Delegate React and Branding plain DOM, including a common header. Select renderer/adapters/distribution through real consumption; do not force an exclusively React architecture or Web Components. Branding tokens remain canonical until actual versioned extraction; never maintain competing canonical copies. No Branding rename/merge is selected and no blanket approval of its older proposals is implied.

Required components/patterns include shared header/navigation primitives, buttons/actions/menus, fields/validation, checkbox/radio, finite selects and searchable single/multi-entity pickers, dialogs/confirmations/focused forms, tooltips and persistent essential help, compact collections/search/filter/paging, loading/error/status/feedback and motion. Essential help must remain accessible on touch and by keyboard, not only hover/native title. Native finite selects may remain where usable; searchable entity collections require appropriate behavior and scale. Selection across filters/pages, counts, loading, no matches, failure, stale/ineligible selection and permission loss need clear contracts; authorization remains in each product.

Provide asynchronous custom in-app alert/confirm/prompt capabilities as needed by actual callers. The production interaction audit verified one `window.confirm`, Delegate's drafts guard, and no production alert/prompt. Adapting it must preserve navigation continuation/cancellation, independent browser `beforeunload`, multiple draft tokens and saved-but-refresh-failed semantics. Do not claim that native prompts are ubiquitous or promise to suppress browser-controlled unloading. Preserve busy nondismissibility where domain integrity requires it, double-submit prevention, Escape policy and focus restoration.

Audit all products and adopt shared replacements in every applicable surface, preserving their working behavior and domain contracts. Current Projects search/state filtering and create/adopt/rename/archive/delete/repository dialogs, Accounts feedback dialogs, Workspace dialog focus/Escape, both CDN management dialogs, Snapshots controls/identifier help and Branding builders/dialog/menu/table are existing product-local implementations, not UI consumers. Record actual adoption and justified remaining copies rather than counting an inventory as integration.

UI also supplies the suite notification header entry, panel and full inbox. Projects owns aggregation and durable read state; products own meaningful events/recipients/resource access/destinations. Read markers and clicks perform no business actions. Show permission-filtered counts/previews and explicit unavailable/degraded states; CDN + Accounts must work without Projects. Notifications are in-app only and distinct from toasts; no later channel implementation is required.

Branding must catalog each shared component, variants, use guidance, actual consumers, implemented/pending states and residual copies. Maintain bidirectional scenario/rule parity, coverage matrix and evidence in the same implementation assignment. Branding is the high-level family model, not a duplicate backend.

## Cross-product acceptance

Demonstrate actual public component consumption in Delegate React and Branding DOM, then all applicable product adoptions. Verify mounting/unmounting/cleanup and installed/exported artifacts. Test keyboard/focus/Escape, zoom, narrow/touch, EN/ES products, themes, reduced motion, loading/error/no matches, filter/page selection, stale eligibility/permission loss, double-submit prevention, drafts and retained list/back-forward context. Preserve usable native semantics. Record product browser results independently from component fixtures and reference simulation. A generic component demo or screenshot does not prove adoption.
