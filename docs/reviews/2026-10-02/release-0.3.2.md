# Release 0.3.2 — 2 October 2026

An additive release of `@beyond-js/ui` over 0.3.1. The token set is unchanged (0.2.0). It is vendored as `tools/beyond-ui-0.3.2.tgz` in Conduict, its first consumer; the other products stay on 0.3.1 until they need it (nothing in 0.3.1 changed behavior). Nothing is published.

| Change | Found by |
| --- | --- |
| `ChoiceMenu` (`src/dom/choice.js`, `src/styles/choice.css`, `types/dom.d.ts`): one choice among a few things that have a state, between `Select` and `Picker` ([catalog](../../components.md)) | Conduict's environment and composer audit of 2026-10-02 (its `docs/reviews/2026-10-02/environment-experience-audit.md`): the composer chose an environment, an AI engine and a repository with native selects, which cut their words ("Choose Claude Code or Co"), could not show an option's state or detail except as text after the name ("lab · Failed"), opened the platform's own menu unlike the family's, and left the state of the choice (a failed environment) to a line far below |
| `Placement` (`src/dom/core/placement.js`): where a floating list opens and how it stays inside the viewport, moved out of `ActionMenu` so both menus share it. `ActionMenu`'s behavior is unchanged | The same work, to avoid a second copy |

The architecture's rule on selects now says when each applies: `Select` for plain values a person reads at a glance; `ChoiceMenu` for a few things that have a state; `Picker` for searchable or large collections. No React adapter was added: no React consumer needs it yet.

## Checks

| Check | Result |
| --- | --- |
| `npm test` (with `tests/choice.test.mjs`, six cases: the button's words and state, the menu's radio items and actions, choosing once, disabled options, a press outside, destroy, options replaced, focus kept when redrawn while open) | 161 of 161 |
| `npm run types` (with `ChoiceMenu` in the types fixture) | No diagnostics |
| `npm run acceptance` (with a new check: the choice menu's keyboard, a disabled option's reason, focus return, and no word cut and nothing past the viewport at 320 px) | 105 of 105 in Chrome, Firefox and WebKit |

## Family reference synchronization

Synchronized in the Beyond Suite's reference 0.9.3 (its `branding/docs/reviews/2026-10-02/environment-experience.md`): `ChoiceMenu` in the component catalog with Conduict as its consumer, and the proposal D44 that says when a choice shows its state.
