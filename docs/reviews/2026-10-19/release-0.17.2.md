# Release 0.17.2 — 2026-10-19

Evidence baseline: UI `5aab5fc` (0.17.1) on `feature/next`, clean, plus this change on `fix/2026-10-19-ui-0172`. Token set 0.6.0 is unchanged. The change applies the family vocabulary (D141, S31) to the family bar's copy; it creates no new approval or product acceptance.

## What changed and why

- **The product switcher's area lines say the family's words.** The documentation pass of 2026-10-19 found that `src/dom/family/labels.js` still said, in English and Spanish, "Captures" ("Capturas") for Snapshots and "Environments and conversations" ("Entornos y conversaciones") for Conduict, and that Packages, one of `productNames` since 0.15.0, had no area line. They are now the switcher's short form of Projects' product leads ("Immutable snapshots of selected packages.", "Machines and the conversations on them.", "Develop and preview packages, and save snapshots."): Snapshots "Snapshots of selected packages" ("Instantáneas de los paquetes elegidos"), Conduict "Machines and their conversations" ("Máquinas y sus conversaciones") and Packages "Packages, previews and snapshots" ("Paquetes, vistas previas e instantáneas"). Beyond Home keeps "Your projects, recent work and what needs you". Workspace keeps "Development environments": it is retired from the family's entries (E6) and its line is Projects' own lead.

## What ran

Executed locally on this change:

- `npm test`: 659 tests, 659 passed (653 before 0.17.2; the new `vocabulary.test.mjs` adds six).
- `npm run acceptance` (packed tarball, DOM, React 19 and React 18 consumers): 303 checks passed and none failed in Chrome and in Firefox; in WebKit 302 passed and one failed on its first run (React 18's "suggestions with real keys", a 5 s wait for the composer's suggestion list, unrelated to the family bar's copy), and that check then passed on two reruns in WebKit (3 of 3 each, DOM, React 19 and React 18).

Not exercised: a screen reader, a hosted product, or any product's use of the new lines beyond each consumer's own unit suite.

## Consumers

The tarball is vendored on each consumer's `fix/2026-10-19-ui-0172` branch (for CDN and the Packages interface, on top of their vocabulary branches), with each consumer's unit suite run there; none is merged into `feature/next`.

## Family reference

Visible behaviour: the product switcher's lines for Snapshots, Conduict and Packages. The reference vendors 0.17.2 on the suite's `fix/2026-10-19-ui-0172` branch; its component catalog's version records are left to the reference's owner.
