import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { once } from 'node:events';
import { chromium, firefox, webkit } from 'playwright-core';
import { OpeningDocument } from '@beyond-js/ui/opening';
import { OpeningFailures } from './opening-failures.mjs';
import { OpeningArrival } from './opening-arrival.mjs';
import { OpeningFocusing } from './opening-focusing.mjs';

/**
 * Checks the opening under strict CSP, against a fictional delayed application (0.21.0, 0.25.0): the
 * identity that never moves, the steps said with their times, a late opening, the measured usual, a page
 * restored from the cache and the hand-over into the product's bar; `OpeningArrival` holds how a product
 * arrives once, complete (0.31.0), `OpeningFailures` what it says and offers when it cannot simply wait, and
 * `OpeningFocusing` where a focus asked for while covered lands (0.35.0).
 */
class OpeningAcceptance {
	#document = new OpeningDocument({ product: 'Projects', key: 'opening-fixture', device: true, logo: new URL('./fixtures/brand/wordmark.svg', import.meta.url) });
	#server;
	#browser;
	#url;
	#engine = process.env.BEYOND_UI_BROWSER ?? 'chrome';
	#count = 0;

	async run() {
		this.#server = createServer((request, response) => this.#serve(request, response));
		try {
			this.#server.listen(0, '127.0.0.1'); await once(this.#server, 'listening');
			this.#url = `http://127.0.0.1:${this.#server.address().port}`;
			this.#browser = await ({ chrome: () => chromium.launch({ channel: 'chrome' }), firefox: () => firefox.launch(), webkit: () => webkit.launch() })[this.#engine]();
			for (const theme of ['light', 'dark']) for (const width of [320, 390, 1440]) await this.#late({ theme, width });
			await this.#unnamed();
			await this.#unavailable();
			await this.#disabled();
			await this.#usual();
			await this.#restored();
			await this.#handover();
			await this.#bare();
			const helpers = { open: options => this.#open(options), steps: page => this.#steps(page) };
			for (const check of [...new OpeningArrival(helpers).checks, ...new OpeningFailures(helpers).checks, ...new OpeningFocusing(helpers).checks]) {
				await check();
				this.#count++;
			}
			console.log(`${this.#engine}: ${this.#count} opening checks passed`);
		} finally {
			await this.#browser?.close(); this.#server.closeAllConnections();
			await new Promise(resolve => this.#server.close(resolve));
		}
	}

	#serve(request, response) {
		const name = request.url.split('?')[0].slice(1);
		const send = (type, body) => { response.setHeader('Content-Type', type); response.end(body); };
		const types = { js: 'text/javascript', css: 'text/css', svg: 'image/svg+xml', woff2: 'font/woff2', txt: 'text/plain' };
		if (this.#document.files.has(name)) return send(types[name.split('.').pop()], this.#document.files.get(name));
		if (/^[a-z]+\.js$/.test(name) || name === 'app.css') return send(types[name.split('.').pop()], readFileSync(new URL(`./fixtures/opening/${name}`, import.meta.url)));
		if (name === 'wordmark.svg') return send(types.svg, readFileSync(new URL('./fixtures/brand/wordmark.svg', import.meta.url)));
		if (name === 'state' || name === 'content') return send('application/json', '{}');
		// The application's own faces, as its `@beyond-js/ui/fonts.css` declares them (0.17.1)
		if (name.startsWith('fonts/')) return send(types[name.split('.').pop()] ?? 'text/css', readFileSync(new URL(`../${name}`, import.meta.url)));
		response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; require-trusted-types-for 'script'; trusted-types 'none'");
		const html = this.#document.render(readFileSync(new URL('./fixtures/opening/index.html', import.meta.url), 'utf8'));
		// `/earlier`: the markup before 0.21.0 with this version's controller and stylesheet; `/bare` (0.35.0): no
		// opening's markup at all, its controller still loaded
		const opening = /<div id="bui-opening"[\s\S]*?<\/noscript>\n<\/div><\/div>/;
		send('text/html', name === 'earlier' ? html.replace(opening, readFileSync(new URL('./fixtures/opening/earlier.html', import.meta.url), 'utf8').trim()) : name === 'bare' ? html.replace(opening, '') : html);
	}

	/**
	 * A page whose `/state` read (or module) waits for `release()`; `fail` answers 503, `abort` aborts it,
	 * and `entry` serves another fixture module as the application's entry
	 */
	async #open({ theme = 'light', width = 390, motion = 'reduce', clock = true, javascript = true, hold = '**/state', abort = false, fail = false, prepare = null, entry = null, path = '/?project=kept#context' } = {}) {
		const context = await this.#browser.newContext({ viewport: { width, height: 800 }, colorScheme: theme, reducedMotion: motion, locale: 'es-ES', javaScriptEnabled: javascript });
		await prepare?.(context);
		const page = await context.newPage();
		if (clock && javascript) await page.clock.install();
		if (entry) await page.route('**/ready.js', route => route.fulfill({ contentType: 'text/javascript', body: readFileSync(new URL(`./fixtures/opening/${entry}`, import.meta.url)) }));
		let release;
		const gate = new Promise(resolve => (release = resolve));
		await page.route(hold, async route => { await gate; if (abort) await route.abort(); else await route.fulfill({ status: fail ? 503 : 200, body: '{}' }); });
		await page.goto(`${this.#url}${path}`, { waitUntil: hold.endsWith('ready.js') ? 'commit' : 'domcontentloaded' });
		return { context, page, release };
	}

	#steps(page) {
		return page.locator('.bui-opening-step').evaluateAll(rows => rows.map(row => `${row.dataset.state} ${row.querySelector('.bui-opening-label').textContent}`));
	}

	async #late({ theme, width }) {
		const { context, page, release } = await this.#open({ theme, width });
		try {
			const status = page.locator('[data-opening-status]');
			await page.waitForFunction(() => document.querySelector('[data-opening-status]').textContent === 'Confirmando tu sesión');
			const identity = await page.locator('.bui-opening-lockup').boundingBox();
			// A quick opening says no steps; an engine that took longer than the reveal to get here already says them
			if (await page.evaluate(() => performance.now() < 700)) assert.equal(await page.locator('.bui-opening-steps').isHidden(), true, 'a quick opening says no steps');
			await page.clock.fastForward(900);
			assert.deepEqual(await this.#steps(page), ['done Cargando Projects', 'active Confirmando tu sesión']);
			assert.deepEqual(await page.locator('#bui-opening').evaluate(node => node.getAnimations({ subtree: true }).filter(motion => motion.playState === 'running' && motion.effect.getComputedTiming().duration > 1).map(motion => motion.animationName)), [], 'nothing moves under reduced motion, the running step’s mark included');
			assert.match(await page.locator('.bui-opening-step >> nth=1 >> .bui-opening-time').textContent(), /^\d+,\d s$/, 'its time, in the language’s decimals');
			assert.equal(await page.locator('#bui-opening').evaluate(element => element.scrollWidth <= innerWidth), true);
			assert.equal(await page.locator('.bui-opening-veil').evaluate(element => getComputedStyle(element).backgroundColor), theme === 'dark' ? 'rgb(16, 22, 37)' : 'rgb(255, 255, 255)');
			await page.clock.fastForward(11300);
			const button = page.getByRole('button', { name: 'Volver a cargar', exact: true });
			await button.waitFor(); await button.focus();
			assert.equal(await page.getByText('Está tardando más de lo esperado', { exact: true }).isVisible(), true);
			assert.equal(await status.textContent(), 'Está tardando más de lo esperado. Puedes seguir esperando o volver a cargar.');
			assert.deepEqual(await this.#steps(page), ['done Cargando Projects', 'late Confirmando tu sesión']);
			assert.deepEqual(await page.locator('.bui-opening-lockup').boundingBox(), identity, 'the identity never moves while steps and recovery appear');
			await page.locator('.bui-opening-details summary').click();
			const details = await page.locator('[data-opening-text]').textContent();
			assert.match(details, /^Paso: Confirmando tu sesión\nPasos: Cargando Projects \(interface\) [^·]+ · Confirmando tu sesión \(session\) [^\n]+\nApertura: @beyond-js\/ui \d+\.\d+\.\d+\nDirección: http:\/\/127\.0\.0\.1:\d+\/\?project=kept#context\nHora: \d{4}-/);
			if (width === 390) {
				mkdirSync('.artifacts/opening', { recursive: true });
				await page.screenshot({ path: `.artifacts/opening/${this.#engine}-${theme}.png` });
			}
			await button.focus();
			release();
			await page.locator('#bui-opening').waitFor({ state: 'detached' });
			await page.getByRole('heading', { name: 'Your projects' }).waitFor();
			assert.equal(await page.locator('h1').evaluate(node => node === document.activeElement), true, 'a person in recovery keeps a keyboard destination');
			// One set of faces once the application is ready: the opening's handed over to the application's
			await page.clock.runFor(1000);
			await page.waitForFunction(() => ![...document.querySelector('link[data-bui-opening]').sheet.cssRules].some(rule => rule.constructor.name === 'CSSFontFaceRule'));
			const faces = await page.evaluate(async () => {
				await document.fonts.ready;
				const named = [...document.fonts].filter(face => /Inter|Rubik/.test(face.family));
				return { count: named.length, inter: document.fonts.check('400 16px Inter') };
			});
			assert.equal(faces.count, 12, `one set of faces: ${JSON.stringify(faces)}`);
			assert.equal(faces.inter, true);
			assert.ok(page.url().endsWith('/?project=kept#context'));
			assert.equal(await page.locator('body').evaluate(body => body.getAnimations({ subtree: true }).length), 0, 'nothing moves under reduced motion');
			assert.equal(await page.evaluate(() => localStorage.getItem('opening-fixture.opening')), null, 'an opening that needed recovery is not measured');
			this.#count++;
		} finally { await context.close(); }
	}

	/** A step the product does not name is said in one short line, and a note added below it starts no new step */
	async #unnamed() {
		const { context, page, release } = await this.#open({ path: '/?unnamed' });
		try {
			await page.clock.fastForward(900);
			assert.deepEqual(await this.#steps(page), ['done Cargando Projects', 'active Leyendo tus proyectos']);
			await page.clock.fastForward(500);
			assert.deepEqual(await this.#steps(page), ['done Cargando Projects', 'active Leyendo tus proyectos'], 'the note below the line starts no step');
			release();
			await page.locator('#bui-opening').waitFor({ state: 'detached' });
			this.#count++;
		} finally { await context.close(); }
	}

	async #unavailable() {
		const { context, page, release } = await this.#open({ fail: true });
		try {
			release();
			await page.locator('#bui-opening').waitFor({ state: 'detached' });
			await page.getByRole('heading', { name: 'The service is unavailable' }).waitFor();
			this.#count++;
		} finally { await context.close(); }
	}

	async #disabled() {
		const { context, page } = await this.#open({ javascript: false });
		try {
			await page.getByText('Turn on JavaScript in your browser to open Projects.', { exact: true }).waitFor();
			assert.equal(await page.getByRole('status').count(), 0, 'nothing announces a wait that cannot happen');
			assert.equal(await page.locator('.bui-opening-trace').isHidden(), true);
			this.#count++;
		} finally { await context.close(); }
	}

	/** A clean opening is measured; past this device's 90th percentile it says so, once */
	async #usual() {
		const fast = JSON.stringify({ interface: [50, 60, 70, 80, 90], session: [100, 110, 120, 130, 140] });
		const { context, page, release } = await this.#open({ prepare: context => context.addInitScript(value => { try { if (location.protocol === 'http:' && !sessionStorage.getItem('seeded')) { localStorage.setItem('opening-fixture.opening', value); sessionStorage.setItem('seeded', '1'); } } catch {} }, fast) });
		try {
			await page.clock.fastForward(1500);
			await page.waitForFunction(() => document.querySelector('[data-opening-status]').textContent === 'Confirmando tu sesión está tardando más de lo normal');
			assert.match(await page.locator('.bui-opening-step[data-late] .bui-opening-time').textContent(), /^[\d,]+ s · normalmente 0,1 s$/);
			release();
			await page.locator('#bui-opening').waitFor({ state: 'detached' });
			const kept = JSON.parse(await page.evaluate(() => localStorage.getItem('opening-fixture.opening')));
			assert.equal(kept.session.length, 6, 'this opening joined the measured ones');
			assert.equal(kept.interface.length, 6);
			this.#count++;
		} finally { await context.close(); }
	}

	/** A page that left before opening and came back from the back-forward cache opens again */
	async #restored() {
		const { context, page } = await this.#open({ clock: false });
		try {
			await page.waitForFunction(() => document.querySelector('[data-opening-status]').textContent === 'Confirmando tu sesión');
			const reloaded = page.waitForEvent('framenavigated');
			await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
			await reloaded;
			this.#count++;
		} finally { await context.close(); }
	}

	/** With motion, the identity lands on the bar's own and the product is usable from the first frame */
	async #handover() {
		const { context, page, release } = await this.#open({ theme: 'dark', width: 1280, motion: 'no-preference', clock: false });
		try {
			await page.waitForFunction(() => document.querySelector('[data-opening-status]').textContent === 'Confirmando tu sesión');
			release();
			await page.waitForFunction(() => document.getElementById('bui-opening')?.dataset.state === 'leaving');
			const leaving = await page.evaluate(() => ({ pointer: getComputedStyle(document.getElementById('bui-opening')).pointerEvents, app: getComputedStyle(document.getElementById('root')).visibility, target: getComputedStyle(document.querySelector('.bui-family .bui-lockup-mark')).visibility, landing: document.querySelector('.bui-family').dataset.buiLanding, opened: document.documentElement.hasAttribute('data-bui-opened') }));
			assert.deepEqual(leaving, { pointer: 'none', app: 'visible', target: 'hidden', landing: 'flight', opened: false }, 'the product shows and takes the pointer at once; its wordmark waits under the moving one, and it has not arrived yet');
			const started = Date.now();
			await page.locator('#bui-opening').waitFor({ state: 'detached', timeout: 2000 });
			assert.ok(Date.now() - started < 1000, 'the hand-over is bounded');
			assert.equal(await page.locator('.bui-family .bui-lockup-mark').evaluate(node => getComputedStyle(node).visibility), 'visible');
			assert.ok(JSON.parse(await page.evaluate(() => localStorage.getItem('opening-fixture.opening'))).session.length === 1, 'a clean opening is measured');
			// The one public mark of an arrival (0.35.0): once the identity has landed, its bar's mark gone
			await page.waitForFunction(() => document.documentElement.hasAttribute('data-bui-opened'), null, { timeout: 2000 });
			assert.equal(await page.evaluate(() => 'buiLanding' in document.querySelector('.bui-family').dataset), false, 'the mark comes once the identity has landed');
			this.#count++;
		} finally { await context.close(); }
	}

	/** A document with no opening to run says at once that the product has arrived (0.35.0) */
	async #bare() {
		const { context, page, release } = await this.#open({ path: '/bare' });
		try {
			await page.waitForFunction(() => document.documentElement.hasAttribute('data-bui-opened'), null, { timeout: 5000 });
			assert.equal(await page.locator('#bui-opening').count(), 0, 'no opening was drawn');
			release();
			this.#count++;
		} finally { await context.close(); }
	}
}

await new OpeningAcceptance().run();
