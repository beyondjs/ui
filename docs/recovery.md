# Connection recovery

UI owns recovery presentation. Products own the dependency identity, context, request bounds and permission decisions.

Use `RetryAction` for a safe read or transport reconnect: the refresh glyph, visible **Try again** label (Spanish **Reintentar**), secondary style and busy state. DOM takes `run`; React takes `onClick`. The callback must report its failure in its owning state. React activation releases busy state after rejection, including StrictMode effect replay; an unmounted hook cannot start new work or update its departed component. The component consumes a rejected activation after releasing busy state; it does not display or classify the error.

`Recovery` is one notice for one explicitly identified dependency and context. Create independent instances for independent failures. Never group by matching error text, the word “connection”, HTTP status alone or timing alone. An API transport loss and its live stream can share the active product/project's reachability scope; a named upstream, machine connection, access refusal or session loss cannot be inferred to share it.

Register each affected read with `set(key, {title, reason, details, run})`. A read that answers returns anything except `false`; a missing answer returns `false` or rejects. Use a distinct stable key for each independent read. Each read retains its own technical details, disclosure expansion and focused Copy control as evidence updates. Reuse one callback when several symptoms are answered by the same read; it runs once per attempt. An answer removes only that entry. `delete(key)` removes an entry confirmed by its owner or no longer relevant. Replacing an entry invalidates its earlier pending answer. Supply `focus: () => heading` for focus after the final symptom ends. Destroy the notice when its context leaves.

Automatic reads use `Again`: one running attempt, backoff, online and visibility recovery, and `AgainLine`'s last-attempt wording. Each callback must bound its own network call. Transports that already reconnect register `automatic: false`; they retain their transport backoff and join the shared manual action. They return `false` until their actual ready event removes the entry. A transport's last successful observation is distinct from its last attempt. Do not invent either timestamp.

A product's root connection failure belongs once in its active context's notice region. A section-specific failure belongs in that section. A modal notification panel may keep its own actionable failure when its relay or upstream differs; a shared visual position alone does not establish a shared incident. A future application-wide owner requires context-aware lifecycle and explicit dependency identities; do not move all warnings into the family bar.

Keep useful content and drafts. Mark retained facts last known and state which reads are unavailable. A recovered stream is not proof that every resource read recovered. Remove each symptom only on its own answer. Only the product decides which actions remain safe. Session loss stays under `Session`; a lost transport checks the session first. Never register a write, destructive command or unknown outcome for automatic replay.

## Diagnostics

Show `TechnicalDetails` when there is useful support evidence: request/time, source diagnostics, transport observations or a specific known cause. Missing HTTP information from an event stream is itself an explicit limit, never a fabricated server reason. Ordinary labels name tasks and objects, not identifiers.

The disclosure and its surface share a bounded form width. Technical output uses that surface's available width; it is not capped again as prose. It uses regular monospace at the shared small size with explicit body leading, wraps long identifiers, scrolls long output inside the region, and remains copyable. Ordinary explanatory prose retains the reading measure. The entire panel, not only its text, shrinks on narrow screens.

## Validation and adoption

The isolated source tests cover grouped and independent scopes, partial recovery, stale answers, transport-owned backoff, one running activation, EN/ES action labels and icons, existing DOM/React `Unavailable`, and notification recovery. A diagnostic update invalidates late copy feedback from earlier evidence. The shared TechnicalDetails copy behavior is tested separately. Packaging, consumers' installed behavior and rendered geometry remain separate gates.

Consumers with custom action nodes must migrate those nodes to `RetryAction`; changing `Unavailable`'s default cannot replace an explicit action. No product's independent upstream failures are grouped automatically by UI.
