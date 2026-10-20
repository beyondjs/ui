# Shared interface writing review

## Coverage and method

The review covers the shared package's own visible text and accessibility names in English and Spanish, rather than a sample of screens. The public DOM export inventory contains 60 exports with labels, including aliases: 53 distinct bilingual sets and 554 distinct English keys with corresponding Spanish entries. Function-valued entries were reviewed with their source plural forms, product areas and roles. The opening document and session landing were reviewed separately because they are separate public modules. Availability labels and product display names were included.

Source inspection covered inline and fallback text in DOM builders, React adapters, session landing and opening, including the 141 matching text/label/accessibility call sites. Class names, protocol values, grammar keywords, thrown developer diagnostics and documentation examples were distinguished from UI copy. Caller-supplied labels, errors, causes and dynamic resource names remain each consumer's responsibility; this review does not establish every product's wording or hosted runtime.

| Family | Complete scope reviewed | Outcome |
| --- | --- | --- |
| Navigation and context | FamilyBar areas/roles/availability, Header, ProductNav, Sidebar, PageHeader, Tabs, Arrival, PagePanel, Help | Existing task names and semantic landmark names retained; sidebar outage sentence shortened. Compatibility keys remain available. |
| Choices and lists | Picker, Collection, DataTable, ProjectPicker, RefChooser, ChoiceMenu/ChoiceChip, ListRow, Checklist, EmptyState | Picker's empty and timeout states simplified. Search, no-match, denied access, kept values and pagination remain distinct. |
| Forms and dialogs | Field, FocusedForm, Dialog/SideSheet, Question/alert/confirm/prompt, consequence | Existing specific actions, validation, cancellation and destructive consequences retained. Generic failure fallbacks remain for callers without a more precise cause. |
| Accounts and credentials | Session, session landing, Preferences/PreferencesDialog, ProviderWindow, SecretField | Session and provider outage guidance split into clear sentences, preserving unconfirmed outcomes, automatic retry and retained work. Secret fallback preserves its restricted use and manual replacement warning. Device scope and sign-out names remain. |
| Conversations and approvals | Composer, ComposerDictation, CommandPalette, CommandCard/CommandDecisions, ActivityRow/ActivityGroup, LiveText | Search states use the same word. Microphone recovery is direct. Approval delivery says unconfirmed instead of claiming the answer never arrived. The alternative instruction names its task. Draft, recording, expiry and permission meanings remain. |
| Changes and copying | Diff, CopyButton, CopyValue, CopyMessage, activity copy controls | Browser copy failure removes repeated brand wording and preserves selected-text keyboard recovery. Diff meanings, counts, paths and keyboard instructions remain. |
| Notifications | NotificationEntry/NotificationInbox, cause catalog, count and matter labels | Unverifiable “everything else works” reassurance removed. The unavailable scope, underlying cause, partial products, unread counts and read actions remain. The setup cause names the actual notification connection. |
| State and operations | Status/StatusRow, Facts, Meter, Freshness, Steps, Awaited/AwaitedLine, TechnicalDetails, AgainLine, Toaster, loading, opening | Existing concise states, measured duration/uncertainty, retry, stale facts, support details and copy recovery retained. Opening and session landing already name useful actions. |

The 15-word direction is a readability goal per sentence, not a rule to remove permissions, costs, privacy, uncertainty or recovery. Short labels already serving their task were deliberately left intact. Dynamic values are not truncated to satisfy a word count. Public identifiers, option keys and callback contracts are unchanged.

## Changes and validation

UI 0.18.2 contains these text corrections. No API, stylesheet or token values change relative to the separately packed 0.18.1 snapshot. Documentation and comments naming the changed defaults are synchronized. Spanish fixture overrides remain intentional consumer examples; their unsupported reassurance was removed as well.

- `npm test`: 672 passed, none failed. Existing behavior assertions use the corrected wording. New checks visit every public catalog and protect uncertainty, source causes, automatic retry, retained work and manual credential replacement.
- `npm run types`: passed.
- Installed notification-state acceptance: 2 checks passed in each of Chrome 155, Firefox 155 and WebKit 26.6, covering unavailable, failed/retry/recovery, partial and empty states in DOM and React 19 consumers.
- Installed Chrome acceptance: confirmation consequence order and cancellation 2 passed; approval card focus/decision/outcome 2 passed; resource picker and account choice at 320 px 3 passed, including React 18.
- `git diff --check`: passed.

These browser checks exercise affected journeys; they are not a claim that every possible text is rendered in every state. Full text coverage is the source/catalog semantic review above, supplemented by the complete unit suite and these focused installed-consumer checks.

## Consumer typography inspection

A read-only scan identified selectors for each consumer owner to verify with actual shared components. These are candidates, not runtime failures inferred from source alone:

- Conduict's broad nested `h3` rule was confirmed to override Unavailable's title and was narrowed by its consumer owner.
- Projects' interface stylesheet has `.standing h2/h3`, `.cell h3` and `.gate h2` rules. They can win over a shared single-class heading if such a heading is placed inside those containers; actual compositions need verification.
- Delegate's layout gives every `h2` letter spacing, and delivery/settings styles contain scoped descendant headings. Shared components without explicit tracking may inherit that product-specific treatment.
- Packages' tool-page flex rules intentionally control its full-bleed workspace composition; they are not evidence that standard Page content should lose its width tier.
- Branding's bare heading rules remain subordinate to shared class declarations but can supply properties the shared component does not set.

No downstream stylesheet was edited in this review. The coordinated family-reference and consumer owners receive these findings and own their adoption checks. Shared default Sidebar remains supported; a conversation rail is not imposed on unrelated products.


## Compatibility copy and rendered purposes

`FamilyBar.labels.entries` and `.entry` remain exported compatibility keys. The current ProductSwitcher never reads them: its title is Products, and it does not render a repeated project subtitle. The short `area` purpose is rendered only outside a project; Conduict retains Machines and their conversations in English and its Spanish counterpart. It describes both local and cloud use. A catalog match alone is not evidence that a rejected sentence is visible.

Conduict's `welcome.first_title` is a retired catalog key without a Home consumer. The current Home passes no generic first-step title. It remains a compatibility inventory entry, not rendered onboarding copy.
