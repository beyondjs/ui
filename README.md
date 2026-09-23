# Beyond UI

The owner-approved next [implementation scope](docs/architecture.md#september-23-shared-experience-scope) requires actual React/DOM consumption, a shared header, common interaction patterns and notification presentation with cross-suite adoption. This is a concrete implementation mandate for the next assignment; the repository remains a documentation-only scaffold today.

Beyond UI owns reusable cross-product interface components and foundations: shared header and navigation building blocks, typography, colors and tokens, inputs, buttons, dialogs and motion.

**Status: documentation-only library scaffold.** There is no component implementation, package manifest, dependency installation, build, test runner, CLI or development server yet. No package is published and no product consumes UI. No installation command or `npm run dev` is available. The repository needs only Git and a text editor for its current documentation workflow.

## Ownership and consumers

UI is intended to support both Delegate's React application and Branding's plain JavaScript DOM views. Its rendering and distribution architecture remains open; neither an exclusively React implementation nor Web Components has been selected.

Branding remains the navigable model of the entire Beyond family, its functional journeys, experience proposals and evidence of implemented versus pending behavior. Its existing `src/foundations/` remains the canonical token source until an explicit extraction is implemented. UI does not carry a second token copy. A merge or rename of Branding has not been selected.

## Work here

Read [AGENTS.md](AGENTS.md), [architecture and decisions](docs/architecture.md), [coding standards](docs/coding-standards.md) and [validation](docs/validation.md). The validation guide distinguishes today's documentation checks from future contract, integration and acceptance tests. [Onboarding evidence](docs/reviews/2026-09-23/onboarding.md) records the initial repository inspection and executed checks.

Maintained guides belong in `docs/`, dated evidence in `docs/reviews/`, and temporary assignments in [docs-temp](docs-temp/README.md). No sibling checkout is required to understand these guides. In Beyond Suite, UI is registered as a library scaffold and deliberately has no selector service, port or shared-launcher dependency.
