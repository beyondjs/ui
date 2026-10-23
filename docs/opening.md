# Opening a product

`@beyond-js/ui/opening` owns the first browser-document presentation, from the first paint until the product draws a useful screen. It serves plain DOM and React applications equally, before either framework starts. The product keeps its session, admission, destination and request deadlines.

## What a person sees (0.21.0)

The opening applies the family's experience principle (EXP-01) through precision rather than decoration.

- **Quick.** The family lockup (the wordmark, its divider and the product's name, in the bar's proportions) and a trace: a line with a light that travels along it while work runs, in the colour of work in progress, like the family's indeterminate band. Nothing to read. The identity is placed a little above the middle and never moves while the opening says more below it.
- **Not quick (past 800 ms).** The steps, all at once, each with the family's mark for its state (done a filled circle, running a half-filled circle, late a diamond, failed a square) and its time in tabular figures: "Loading Conduict 0.4 s", "Confirming your session 1.2 s". The running step's time counts every 100 ms and is never announced. One live region says each new step.
- **Longer than usual.** Each opening that finished without recovery keeps its steps' durations on this device (`localStorage`, `<key>.opening`, the last 20 per step, durations only). From five openings on, a step running past its 90th percentile says "· usually 0.2 s" beside its time and the live region says once that it is taking longer than usual (D50).
- **Late (12 s, an engineering default).** "Conduict hasn't opened yet" / "It keeps trying. Reload if it doesn't finish.", with **Reload** and closed **Technical details**.
- **Failed.** Code that could not load (a script or a dynamic import) says "Conduict couldn't load" / "Reload to try again." and stops that step's time. Any other uncaught failure says "Something failed while it opened. Reload to try again."; the product can still finish and end the opening.
- **Offline.** "You're offline" / "Conduict continues when you reconnect." Code that could not load meanwhile loads again by itself when the connection returns; otherwise the product's own reads continue.
- **Technical details** hold the step, every step with its time, the error, the address and the time, with **Copy details** (selected for the keyboard when the browser refuses the clipboard).
- **Hand-over.** When the product's root holds a useful screen, the product is shown and takes the pointer at once; the wordmark and the name move into their places in the product's family bar (`.bui-family .bui-lockup-mark`, `.bui-lockup-name`), which wait hidden under them until they land, while the surface fades. Without a bar in view it fades alone. It lasts 360 ms and is bounded at 700 ms. Under reduced motion nothing moves: the trace is a still dashed band and the presentation is removed at once.
- **Reduced motion (0.21.2):** the trace's light, the running step's pulses and the steps' arrival are declared only under `prefers-reduced-motion: no-preference`, so no more specific rule of the package's or a product's brings them back; the trace is a still dashed band.
- **Restored from the back-forward cache before it opened** (a person who pressed Back from a sign-in), the page loads again rather than staying on a frozen opening.
- **Without its controller.** A line shown by the stylesheet alone after 15 s says "Conduict hasn't opened. Reload this page to try again."; the controller removes it as soon as it runs. With JavaScript disabled, only the enabling instructions show.

The opening shows no standing help: an explanation appears only with a cause and its way on.

## Application entries

Add `new OpeningPlugin({ product, logo, key, root, pages }).plugin` to Vite's plugins. `logo` is the product's existing wordmark file, relative to Vite's root. `key` is its existing `Preferences` key; `appearance`, `locale` and `device` match the product's defaults. `root` defaults to `#root`. `pages` lists exact root-relative HTML filenames, defaulting to `['/index.html']`; include `/desktop/index.html` only when it is an application entry. Hidden session landings are excluded.

The plugin serves its generated assets in development and emits the same files in production. The small deferred controller restores device preferences before the application modules run; the document's tokens follow the system when no choice is available. The opening's stylesheet declares the family's faces so its first paint is in Inter and Rubik; once the application is ready and declares the same faces from its own `@beyond-js/ui/fonts.css`, the controller loads the faces in use under the application's declaration and removes the opening's `@font-face` rules (0.17.1). The controller and styles are separate same-origin assets, so the page keeps its CSP and Trusted Types restrictions without inline scripts or markup sinks.

A static host uses `new OpeningDocument({ product, logo, key, root })`, serves its `files` map at the configured `base` and sends `render(html)` for its application document. Serve CSS, JavaScript, SVG, WOFF2 and text with their corresponding MIME types. The adapter never sends or keeps a credential.

## Readiness and the steps a product names

Mark the product's **initial** waiting element with `data-bui-opening-wait`. The controller observes the configured root until it contains a useful screen with no pending marker. Products with an existing state marker can supply `pending`, a selector within that root. A useful refusal or unavailable screen ends opening in the same way as content. Do not put this marker on internal loading after the page becomes usable.

Name the step with the marker's value: `session` while the product reads its session, `signin` just before it leaves for Beyond Accounts' sign-in, `projects` while it passes through Beyond Projects' session. The opening says each in the family's words and in the document's language; `loading.step({ step, language })` (React `Loading.step`) gives the product's own waiting line the same words, and `loading.steps` lists them. Any other value, or none, is said in the product's own words: since 0.21.2 one short line, its status line (`role="status"`) or else its first line of text, to the end of the first sentence and without its ellipsis, so a note a region adds while it waits starts no new step; else "Opening {product}". A document drawn by another version of the package (a development server whose package changed under it, before the server's process restarts) lacks this version's parts: the controller then only ends it on readiness, without an error. A product that leaves for a sign-in keeps its waiting element (`signin`) until the browser leaves, so the opening never ends on an interim page.

Until readiness, application siblings are hidden from sight, focus and the accessibility tree. Readiness adds no delay to the product's use. If recovery held keyboard focus, focus goes to the arriving heading, main region or first control, without scrolling. Otherwise the application keeps its own focus. Reload uses the browser's current full address and is the person's choice, except after offline code failures and back-forward restores described above. Products continue to own automatic service-outage retries, last-attempt information and reconciliation of unknown changes.

Public documents that already contain their content, native OS splash screens and session-renewal landings do not acquire an application opening. A retained client-rendered product can adopt the document presentation without adding product capability.

## Hosts that serve the package's sources

Bundled products need nothing more. A host that serves `@beyond-js/ui`'s source modules to the browser itself, as Projects' service does from `src/dom/`, serves `src/opening/words.js` too: since 0.21.0 `src/dom/feedback.js` imports the opening's words from it, so `loading.step` and the opening say a step in the same words.

## In-page loading lines

`loading(label)` / React `Loading` draws an announced waiting line whose mark, since 0.21.0, is work in progress's half-filled circle in the colour of work in progress, pulsing a few times and then still (still at once under reduced motion), as `Status`' busy. Structural skeletons retain their shape without continuous animation.

## Verification

`node --test tests/opening.test.mjs tests/opening-steps.test.mjs` checks the public adapters, emitted assets, canonical tokens, escaped text, explicit entry selection, the Vite middleware contract, the words in both languages, the measured usual durations and the steps. `npm run acceptance:opening` uses the physical fictional fixture under `acceptance/fixtures/opening/` (16 checks per engine since 0.21.2): both themes at 320/390/1440 px under reduced motion with the identity's place held while steps and recovery appear, the late recovery with its details and focus kept, a module that cannot load and Reload, an uncaught failure the product outlives, an unavailable screen, JavaScript disabled, the measured usual and its announcement, offline with the reload on reconnecting, a back-forward restore, the hand-over with motion into the fixture's bar, nothing running under reduced motion while steps show, an unnamed region said in one line, and the earlier markup with this controller. Set `BEYOND_UI_BROWSER=firefox` or `webkit` for the other engines. These are package checks; each product verifies its own adoption separately.
