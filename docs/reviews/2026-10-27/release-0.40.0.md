# Local UI 0.40.0: organizations told apart in the family bar (D195)

Evidence baseline: UI `edfde42` (0.39.0) on `feature/next` plus this change, made on 2026-10-27 for the owner's decision D195 on an organization's short name (Beyond Suite's `docs/reviews/2026-10-27/organization-identity.md`).

## Why

The family audit's ACC-20 found that two organizations with the same name could not be told apart in any switcher. Beyond Accounts added a logo and an optional handle, but the family bar's organization menu drew the name and the role only, so neither ever reached a switcher. D195 makes the handle a required **short name** (`slug`), unique across Beyond, which Beyond Projects now relays in `beyond-family/1` with the logo's address.

## What changed

- **The organization menu** (`Organizations`, `src/dom/family/organizations.js`):
  - A name two of the person's organizations share, ignoring case and outer spaces, puts its short name (`organizations[i].slug`) before the role on its row's second line ("tienda-willy-2 · Developer"). Other names stand alone, and a shared name without a short name keeps its role.
  - Once one organization has a logo (`organizations[i].logo`), every row starts with its mark, so the names keep one left edge. With no logo, no row has a mark.
  - The product's own `fallback.organizations` are told apart the same way while the descriptor loads or is unavailable.
- **`OrganizationMark`** (DOM `new OrganizationMark({ name, picture })`, React `<OrganizationMark name logo />`, the same markup): a 20 px rounded square with the initial of the name, and the logo laid over it once it loads, removed when it fails. It is `aria-hidden` beside the name it marks. A product's own list of organizations draws it under the same rule.
- **`Picture`** (`src/dom/family/picture.js`): the person's avatar and an organization's logo share one rule for the addresses they show. They show `https:` and an image `data:`, as before, and since this release `http:` on a loopback host (`localhost`, a `.localhost` name, `127.0.0.1`, `[::1]`), where local development serves Accounts' logos. Any other `http:` host is still refused.
- **`entry`'s `mark`**: a node before a navigation menu row's text, hidden from its accessible name.
- **Types**: `FamilyOrganization`'s `slug` and `logo`, and `OrganizationMark`, in the new `types/organizations.d.ts`; React's `OrganizationMark` in `types/react.d.ts`.
- **Documentation**: the catalog, architecture, validation, README and AGENTS.md.

## Executed checks

Through the machine's test queue, on the change over `edfde42`:

- `npm run types` compiles, the new typed fixtures `organizations.ts` and `organizations.tsx` included, and `npm test` passes 1002 of 1002, React 18 included. An earlier run found `types/family.d.ts` past the 300-line target, so `FamilyOrganization` and `OrganizationMark` moved to `types/organizations.d.ts`.
- From the packed archive, in Chrome 156: every check whose name holds "family", 28 of 28, the new "family bar organization menu…" check among them, in the `dom`, `react19` and `react18` consumers where each applies.
- In Firefox 155 and in WebKit 26.6: "family bar organization menu…", 2 of 2 each.
- The archive: `dist-pack/beyond-ui-0.40.0.tgz`, integrity `sha512-qKxlkNzaI+SeyQy9e5CgzRLQ1vvqRh64iTeS1T5WthbrWGeg99ZDbLHhvqOdZJ+BvrUz4pJw74ow72D/dPwqiw==`. Beyond Accounts vendors it in the same round, and round `tended` builds 0.41.0 on it for the other products.

## Limits

- The mark's look beside a product's own rows is each product's acceptance. Accounts' list of organizations draws it since this release, and the other products' family bars draw it once they vendor 0.40.0 or later.
- Nothing resolves a short name to an organization. The bar only reads it.

Package evidence only. Nothing here is screen-reader output or hosted behavior.

## Family reference synchronization

Synchronized in the suite's round `told` (D195), unregistered. The reference vendors `@beyond-js/ui` 0.35.0, so its own bar and list draw the marks once it vendors 0.40.0 or later. Until then, its descriptor and its list carry the short names.
