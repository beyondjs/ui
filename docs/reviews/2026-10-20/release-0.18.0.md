# UI 0.18.0 navigation

Local implementation on `feature/next`, based on `22afee8` with uncommitted changes. The owner authorized implementing the reviewed navigation mockup during the Conduict Live usability review. Token set 0.6.0 is unchanged. No registry publication, hosted operation or product acceptance is established here.

The package adds the opt-in desktop `Sidebar.rail`, its contextual object panel and optional order, retaining the standard sidebar and mobile drawer. It exposes the same behavior in React and DOM types, adds the canonical `settings` glyph, and admits named rail glyphs with shared tooltips. Missing objects and hidden panels preserve keyboard recovery. The product switcher uses Products/Productos, omits the repeated project subtitle, marks the current product with a check and applies the reviewed spacing.

Executed checks:

- `npm test`: 667/667, including the compatibility suites on React 18.3.1. The source guard holds every source file at 300 lines or fewer. The default sidebar tests remain unchanged apart from the new source responsibilities.
- `npm run types`: passed with DOM and React rail consumers.
- `npm run acceptance -- 'rail navigation'` and the Firefox/WebKit variants: 7/7 per engine, using installed UI 0.18.0 with DOM, React 19.3.0 and React 18.3.1 consumers. The checks cover keyboard toggle/collapse, focus through updates, mobile drawer/merged bar, viewport fit at 1440, 390 and 320 px, both desktop themes and reduced motion. A later source separation preserves that tested behavior; the full unit suite verifies the final source and the negative focused-object disappearance case.

The initial unprivileged full-suite invocation could not complete its temporary React 18 installation. It was stopped and repeated with the installation available. This is not a source failure. An initial browser assertion counted metadata in the hidden mobile location sections; it was corrected to inspect the product section, retaining the mobile context.

Conduict and family-reference adoption, vendoring and their evidence belong to the coordinating assignment. The reference synchronization is being performed by its separate owner; package fixtures are not evidence of those integrations. No commits or pushes were made by this package work.
