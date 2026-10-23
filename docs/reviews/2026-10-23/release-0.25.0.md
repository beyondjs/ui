# Local UI 0.25.0 verification — the opening says only what is true

Evidence baseline: UI `f142a68` (0.24.1) on `feature/next` plus this change, made in a worktree on 2026-10-23 at the owner's request. Token set 0.6.0 is unchanged. Implementation is not the owner's acceptance.

## Why

The owner's screenshot of Conduict at `/conversations/new` showed the family lockup over an open "Trouble opening?" whose help said to reload or reconnect. That was 0.20's markup: Conduict's development server had run since before 0.21.0, so Node kept the configuration's earlier `@beyond-js/ui/opening`, which drew 0.20's markup with a later stylesheet and controller. The application never opened, because its first module named an export (`waiting`) that the server's prepared copy of the package lacked. The controller then threw on the markup it did not know, so nothing said what had happened. Reviewed from source in each state, the 0.21 redesign also fell short where it mattered: a module that could not link read as "hasn't opened yet" over "Something failed while it opened" with the trace still moving; offline offered Reload; "Reload to try again." sat under Reload; "It keeps trying" promised a retry the opening never made; and in development it hid Vite's own error overlay.

## What changed

- **Failures said by what they mean** (`fault.js`). The product cannot open in this page when its code could not load or link (one of the page's own scripts or an import that did not arrive, a module naming an export its dependency lacks, a syntax error reported before the document's modules ran) or when its modules threw before anything was drawn. The opening then says "Couldn't open {product}" with **Reload** and no note, and stops every sign of progress: the failed step's time stops and the trace becomes a plain divider in every motion setting. Anything else, a promise nobody handled included, is a failure the product may outlive. It goes to the details, and the opening says nothing about it unless there is no new step within 4 s; then it says "Taking longer than expected" if the product drew something, or "Couldn't open" if it drew nothing. A script of another origin or an extension's that fails is not the product's code. A product that moves after the opening said it could not open is alive: the opening waits again, keeping the failed step, and a step that failed stays failed whatever is said next. The details keep the first failure, or the one that made the product unable to open.
- **One reload by itself** (`retry.js`). Code that could not load reloads the page once per address within 30 s (this tab's session storage) before anything is said, so a failure that passes is never seen; one that persists is said instead of looping, and without storage nothing reloads by itself.
- **States that offer only what can work** (`recovery.js`). Late is "Taking longer than expected" / "You can keep waiting or reload.". Offline is "You're offline" / "Opening continues as soon as you're back online.", with no Reload and no details: Reload offline puts the browser's own error page in place of the opening. Over a start that threw, which reconnecting cannot fix, "Couldn't open" stays said and its Reload waits for the connection. No note restates its button, and the `projects` step is "Connecting to Beyond Projects". JavaScript disabled says "Turn on JavaScript in your browser to open {product}.", and the stylesheet's own line, which cannot know that anything failed, says "{product} hasn't opened yet. Reload this page to try again.". Technical details add "Opening: @beyond-js/ui 0.25.0".
- **The controller draws the steps and the recovery** (`frame.js`). The document paints the identity, the trace and the one announced line, stamped `data-version`. A document another version drew (a development server that has not restarted since the package changed) is drawn again in this version's form, keeping its wordmark. A late or failed state then says "{product}'s development server is out of date. Stop it and start it again, then reload.", because a restart inside the same process keeps the earlier adapter. The details add "Page drawn by", and the console says it once.
- **Development** (`plugin.js`, `install.js`). On a development server a failure shows its details open, and the opening steps aside at once for Vite's error overlay, which it no longer hides or covers. The Vite adapter builds each document from the document module as installed (`document.js?installed=…`, its words with it). From the moment its server listens until it closes, it restarts the server (`server.restart(true)`) once another copy is installed and the install has settled: npm's record of `node_modules`, written last, is newer than the manifest (or 60 s passed without one) and both have been still for 1.5 s. A restart that fails leaves the earlier server running, and the next install is still followed. `OpeningInstall` is public for a static host that keeps running.

## Independent review

A read-only review of the first commit (`dcda000`) probed it in Chrome, Firefox and WebKit and against a real Vite 6.4.3 server, and read Vite 5.4, 6.4 and 8.3's source. Its seven code findings were all corrected, each verified again with its own probe in the three engines:

1. the watcher stopped before a restart that could fail, so a failed restart ended the following;
2. a server that never listened was followed and could be restarted after closing;
3. offline after a start that threw promised that reconnecting would open it, and drew the failed step as late;
4. after a final failure the product's next step ran under "Couldn't open";
5. stepping aside for Vite's overlay left the step's clock running;
6. a syntax error from a read before drawing, such as JSON that does not parse, counted as code that could not link, and reloaded the page;
7. a later, unrelated failure replaced the cause in the details.

Its four copy findings were applied:

- the out-of-date line names the product's server and says how to restart it;
- offline's note no longer makes the product its subject or promises what a start failure cannot keep;
- the stylesheet's own line no longer gives a verdict it cannot back;
- the details' labels say whose version each is, and "Couldn't" is consistent.

It confirmed that Vite awaits an asynchronous `configResolved`, that a successful restart builds a fresh adapter with no watcher piling up, that a build never sets `development`, that `[hidden]` wins and that nothing loops. Chrome does not report a rejected `response.json()` nobody handled (Firefox and WebKit do), so in Chrome that case is answered at the late bound.

## Executed checks

- Unit suite: 785 of 785 (`npm test`), including `opening-recovery.test.mjs`. It covers what each failure means, the page's own scripts, the one reload by itself, and what each state offers in both languages, with Reload waiting for the connection. It also covers a document another version drew, an install noticed once npm's record follows it, and an installed copy in a scratch `node_modules`. That copy's development server builds its document from what is installed, keeps following after a restart that failed, and leaves alone a server that never listened.
- Declarations: `npm run types` passes.
- Opening acceptance (`npm run acceptance:opening`): 20 of 20 in each of Chrome, Firefox and WebKit, `acceptance/opening-failures.mjs` among them. A product that throws and then moves anyway (`revived.js`) is checked offline and back.
- A real development server: Vite 6.4.3 in a scratch application with the package installed from its archive. Installing another copy under the running server logged that it was restarting, forced the dependencies' preparation and served the installed document from the same process, about 2 s after the install ended. A second install restarted it once more; an install of an unrelated package did not.

## Artifact

- Archive: `dist-pack/beyond-ui-0.25.0.tgz`, packed from the release commit.
- SHA-256: SHA.
- Integrity: INTEGRITY.

Not run: screen readers, a hosted product, the products' own adoption (each product's record), the owner's review.
