# Opening a product

`@beyond-js/ui/opening` owns the first browser-document presentation. It serves plain DOM and React applications equally, before either framework starts. The product keeps its session, admission, destination and request deadlines. In-page `loading` / React `Loading` uses the same quiet waiting mark; structural skeletons retain their shape without continuous animation.

## Application entries

Add `new OpeningPlugin({ product, logo, key, root, pages }).plugin` to Vite's plugins. `logo` is the product's existing wordmark file, relative to Vite's root. `key` is its existing `Preferences` key; `appearance`, `locale` and `device` match the product's defaults. `root` defaults to `#root`. `pages` lists exact root-relative HTML filenames, defaulting to `['/index.html']`; include `/desktop/index.html` only when it is an application entry. Hidden session landings are excluded.

The plugin serves its generated assets in development and emits the same files in production. Its HTML contains the identity, opening state, browser recovery instructions and a JavaScript-disabled explanation. The small deferred controller restores device preferences before the application modules run; the document's tokens follow the system when no choice is available. Fonts, colours and the waiting mark come from UI's canonical sources. The controller and styles are separate same-origin assets, so the page keeps its CSP and Trusted Types restrictions without inline scripts or markup sinks.

A static host uses `new OpeningDocument({ product, logo, key, root })`, serves its `files` map at the configured `base` and sends `render(html)` for its application document. Serve CSS, JavaScript, SVG, WOFF2 and text with their corresponding MIME types. The adapter never sends or keeps a credential.

## Readiness and recovery

Mark the product's **initial** waiting element with `data-bui-opening-wait`. The controller observes the configured root until it contains a useful screen with no pending marker. Products with an existing state marker can supply `pending`, a selector within that root. A useful refusal or unavailable screen ends opening in the same way as content. Do not put this marker on internal loading after the page becomes usable.

Until then, application siblings are hidden from sight, focus and the accessibility tree: one status is announced. Readiness removes the document presentation, observer, error listeners and timer immediately. It adds no minimum delay and changes neither the address nor session. If recovery held keyboard focus, focus goes to the arriving heading, main region or first control, without scrolling. Otherwise the application keeps its own focus.

At 12 seconds, or upon a startup script failure, the presentation says opening has not finished and offers **Reload**. This is an engineering default, not a measured usual duration or a service outage. The original startup can still finish and replace recovery. Reload uses the browser's current full address; it is never automatic. Products continue to own automatic service-outage retries, last-attempt information and reconciliation of unknown changes. This presentation makes none of those decisions. If the controller itself cannot load, the static **Trouble opening?** disclosure still explains browser recovery. With JavaScript disabled, only the enabling instructions replace the waiting status.

Public documents that already contain their content, native OS splash screens and session-renewal landings do not acquire an application opening. A retained client-rendered product can adopt the document presentation without adding product capability.

## Verification

`node --test tests/opening.test.mjs` checks the public adapters, emitted assets, canonical tokens, escaped text, explicit entry selection and the Vite middleware contract. `npm run acceptance:opening` uses the physical fictional fixture under `acceptance/fixtures/opening/`: delayed reads, delayed/failed modules, reload, late readiness, focus, URL continuity, unavailable content, JavaScript disabled, both themes and 320/390/1440 px under reduced motion. Set `BEYOND_UI_BROWSER=firefox` or `webkit` for the other engines. These are package checks; each product verifies its own adoption separately.
