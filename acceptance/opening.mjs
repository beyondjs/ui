import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { once } from 'node:events';
import { chromium, firefox, webkit } from 'playwright-core';
import { OpeningDocument } from '@beyond-js/ui/opening';

/**
 * Checks the opening under strict CSP, against a fictional delayed application (0.21.0): the identity
 * that never moves, the steps said with their times, recovery for a late, failed or offline opening,
 * the measured usual, a page restored from the cache and the hand-over into the product's bar.
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
			await this.#failed();
			await this.#error();
			await this.#unavailable();
			await this.#disabled();
			await this.#usual();
			await this.#offline();
			await this.#restored();
			await this.#handover();
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
		if (name === 'ready.js' || name === 'app.css') return send(types[name.split('.').pop()], readFileSync(new URL(`./fixtures/opening/${name}`, import.meta.url)));
		if (name === 'wordmark.svg') return send(types.svg, readFileSync(new URL('./fixtures/brand/wordmark.svg', import.meta.url)));
		if (name === 'state') return send('application/json', '{}');
		// The application's own faces, as its `@beyond-js/ui/fonts.css` declares them (0.17.1)
		if (name.startsWith('fonts/')) return send(types[name.split('.').pop()] ?? 'text/css', readFileSync(new URL(`../${name}`, import.meta.url)));
		response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; require-trusted-types-for 'script'; trusted-types 'none'");
		send('text/html', this.#document.render(readFileSync(new URL('./fixtures/opening/index.html', import.meta.url), 'utf8')));
	}

	/** A page whose `/state` read (or module) waits for `release()`; `fail` answers 503, `abort` aborts it */
	async #open({ theme = 'light', width = 390, motion = 'reduce', clock = true, javascript = true, hold = '**/state', abort = false, fail = false, prepare = null } = {}) {
		const context = await this.#browser.newContext({ viewport: { width, height: 800 }, colorScheme: theme, reducedMotion: motion, locale: 'es-ES', javaScriptEnabled: javascript });
		await prepare?.(context);
		const page = await context.newPage();
		if (clock && javascript) await page.clock.install();
		let release;
		const gate = new Promise(resolve => (release = resolve));
		await page.route(hold, async route => { await gate; if (abort) await route.abort(); else await route.fulfill({ status: fail ? 503 : 200, body: '{}' }); });
		await page.goto(`${this.#url}/?project=kept#context`, { waitUntil: hold.endsWith('ready.js') ? 'commit' : 'domcontentloaded' });
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
			assert.equal(await page.locator('.bui-opening-steps').isHidden(), true, 'a quick opening says no steps');
			await page.clock.fastForward(900);
			assert.deepEqual(await this.#steps(page), ['done Cargando Projects', 'active Confirmando tu sesión']);
			assert.match(await page.locator('.bui-opening-step >> nth=1 >> .bui-opening-time').textContent(), /^\d+,\d s$/, 'its time, in the language’s decimals');
			assert.equal(await page.locator('#bui-opening').evaluate(element => element.scrollWidth <= innerWidth), true);
			assert.equal(await page.locator('.bui-opening-veil').evaluate(element => getComputedStyle(element).backgroundColor), theme === 'dark' ? 'rgb(16, 22, 37)' : 'rgb(255, 255, 255)');
			await page.clock.fastForward(11300);
			const button = page.getByRole('button', { name: 'Volver a cargar', exact: true });
			await button.waitFor(); await button.focus();
			assert.equal(await page.getByText('Projects aún no se ha abierto', { exact: true }).isVisible(), true);
			assert.equal(await status.textContent(), 'Projects aún no se ha abierto. Sigue intentándolo. Vuelve a cargar si no termina.');
			assert.deepEqual(await this.#steps(page), ['done Cargando Projects', 'late Confirmando tu sesión']);
			assert.deepEqual(await page.locator('.bui-opening-lockup').boundingBox(), identity, 'the identity never moves while steps and recovery appear');
			await page.locator('.bui-opening-details summary').click();
			const details = await page.locator('[data-opening-text]').textContent();
			assert.match(details, /^Paso: Confirmando tu sesión\nPasos: Cargando Projects \(interface\) [^·]+ · Confirmando tu sesión \(session\) [^\n]+\nDirección: http:\/\/127\.0\.0\.1:\d+\/\?project=kept#context\nHora: \d{4}-/);
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

	async #failed() {
		const { context, page, release } = await this.#open({ hold: '**/ready.js', abort: true });
		try {
			release();
			await page.getByText('Projects no se pudo cargar', { exact: true }).waitFor();
			assert.deepEqual(await this.#steps(page), ['failed Cargando Projects']);
			assert.match(await page.locator('[data-opening-text]').textContent(), /Error: http:\/\/127\.0\.0\.1:\d+\/ready\.js/, 'the details name what could not load');
			await page.unroute('**/ready.js');
			await Promise.all([page.waitForEvent('framenavigated'), page.getByRole('button', { name: 'Volver a cargar', exact: true }).click()]);
			await page.getByRole('heading', { name: 'Your projects' }).waitFor();
			this.#count++;
		} finally { await context.close(); }
	}

	/** An uncaught failure while opening is said as one, and the product can still finish */
	async #error() {
		const { context, page, release } = await this.#open();
		try {
			await page.waitForFunction(() => document.querySelector('[data-opening-status]').textContent === 'Confirmando tu sesión');
			await page.evaluate(() => dispatchEvent(new ErrorEvent('error', { message: 'Startup failed', filename: 'http://127.0.0.1/ready.js', lineno: 3 })));
			await page.getByText('Algo falló al abrir. Vuelve a cargar para intentarlo de nuevo.', { exact: true }).waitFor();
			assert.equal(await page.getByText('Projects aún no se ha abierto', { exact: true }).isVisible(), true);
			assert.match(await page.locator('[data-opening-text]').textContent(), /Error: Startup failed · http:\/\/127\.0\.0\.1\/ready\.js:3/);
			assert.deepEqual(await this.#steps(page), ['done Cargando Projects', 'late Confirmando tu sesión']);
			release();
			await page.locator('#bui-opening').waitFor({ state: 'detached' });
			await page.getByRole('heading', { name: 'Your projects' }).waitFor();
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
			await page.getByText('Enable JavaScript in your browser to open this product.', { exact: true }).waitFor();
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

	/** Without a connection the opening says so, and code that could not load loads again by itself */
	async #offline() {
		const { context, page, release } = await this.#open({ clock: false, hold: '**/ready.js', abort: true });
		try {
			// The controller is running once the line for an opening without it is gone
			await page.waitForFunction(() => document.getElementById('bui-opening') && !document.querySelector('[data-opening-fallback]'));
			await context.setOffline(true);
			await page.evaluate(() => dispatchEvent(new Event('offline')));
			await page.getByText('Estás sin conexión', { exact: true }).waitFor();
			assert.equal(await page.getByText('Projects continúa cuando vuelvas a conectarte.', { exact: true }).isVisible(), true);
			release();
			await page.waitForFunction(() => document.querySelector('[data-opening-recovery]').dataset.state === 'offline' && document.querySelector('.bui-opening-step[data-state="failed"]'));
			await page.unroute('**/ready.js');
			const reloaded = page.waitForEvent('framenavigated');
			await context.setOffline(false);
			// Engines that emulate the connection fire `online` themselves; the others are told here
			await page.evaluate(() => dispatchEvent(new Event('online'))).catch(() => null);
			await reloaded;
			await page.getByRole('heading', { name: 'Your projects' }).waitFor();
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
			const leaving = await page.evaluate(() => ({ pointer: getComputedStyle(document.getElementById('bui-opening')).pointerEvents, app: getComputedStyle(document.getElementById('root')).visibility, target: document.querySelector('.bui-family .bui-lockup-mark').style.visibility }));
			assert.deepEqual(leaving, { pointer: 'none', app: 'visible', target: 'hidden' }, 'the product shows and takes the pointer at once; its wordmark waits under the moving one');
			const started = Date.now();
			await page.locator('#bui-opening').waitFor({ state: 'detached', timeout: 2000 });
			assert.ok(Date.now() - started < 1000, 'the hand-over is bounded');
			assert.equal(await page.locator('.bui-family .bui-lockup-mark').evaluate(node => getComputedStyle(node).visibility), 'visible');
			assert.ok(JSON.parse(await page.evaluate(() => localStorage.getItem('opening-fixture.opening'))).session.length === 1, 'a clean opening is measured');
			this.#count++;
		} finally { await context.close(); }
	}
}

await new OpeningAcceptance().run();
