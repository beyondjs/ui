import assert from 'node:assert/strict';

/**
 * The opening when it cannot simply wait (0.25.0), against the fictional fixture: code that cannot
 * load or link reloads once by itself and then says it could not open, with every sign of progress
 * stopped; a start that threw says so at once; a failure the product may outlive is said only when
 * nothing moves; offline offers nothing that cannot work; a document another version drew is drawn
 * again and says its cause; a development server's error overlay is never covered.
 */
export class OpeningFailures {
	#open;
	#steps;

	/**
	 * @param {{ open: Function, steps: Function }} specs the acceptance's page opener and its steps reader
	 */
	constructor({ open, steps }) {
		this.#open = open;
		this.#steps = steps;
	}

	/** The checks, each returning when it passed */
	get checks() {
		return [() => this.#unloaded(), () => this.#linked(), () => this.#thrown(), () => this.#revived(), () => this.#outlived(), () => this.#offline(), () => this.#earlier(), () => this.#overlay()];
	}

	/** Counts the page's loads in its tab, the first one included, before any of its scripts runs */
	static #counted(context) {
		return context.addInitScript(() => {
			try { sessionStorage.setItem('opening-loads', String(Number(sessionStorage.getItem('opening-loads') ?? '0') + 1)); } catch {}
		});
	}

	static #loads(page) {
		return page.evaluate(() => Number(sessionStorage.getItem('opening-loads')));
	}

	/** Whether the document says the opening has gone (`html[data-bui-opened]`, 0.35.0) */
	static #opened(page) {
		return page.evaluate(() => document.documentElement.hasAttribute('data-bui-opened'));
	}

	/** Nothing says it still runs: no travelling light and a plain divider instead of the dashed band */
	static async #still(page) {
		const trace = await page.locator('.bui-opening-trace').evaluate(node => ({ image: getComputedStyle(node).backgroundImage, light: getComputedStyle(node, '::after').display }));
		assert.deepEqual(trace, { image: 'none', light: 'none' }, 'a failed opening shows no sign of progress');
	}

	/** A script that cannot load: one reload by itself, then the failure with Reload and no note that restates it */
	async #unloaded() {
		const { context, page, release } = await this.#open({ hold: '**/ready.js', abort: true, clock: false, prepare: OpeningFailures.#counted });
		try {
			release();
			await page.getByText('No se pudo abrir Projects', { exact: true }).waitFor();
			assert.equal(await OpeningFailures.#loads(page), 2, 'one reload by itself before saying it');
			assert.deepEqual(await this.#steps(page), ['failed Cargando Projects']);
			assert.equal(await page.locator('.bui-opening-note').isHidden(), true, 'no sentence that restates the button');
			assert.equal(await page.locator('[data-opening-status]').textContent(), 'No se pudo abrir Projects.');
			assert.match(await page.locator('[data-opening-text]').textContent(), /Error: No se pudo cargar http:\/\/127\.0\.0\.1:\d+\/ready\.js/);
			await OpeningFailures.#still(page);
			assert.equal(await OpeningFailures.#opened(page), false, 'no mark while its failure is said');
			await page.unroute('**/ready.js');
			await Promise.all([page.waitForEvent('framenavigated'), page.getByRole('button', { name: 'Volver a cargar', exact: true }).click()]);
			await page.getByRole('heading', { name: 'Your projects' }).waitFor();
		} finally { await context.close(); }
	}

	/** An entry that names an export its dependency lacks never links: the same as code that cannot load */
	async #linked() {
		const { context, page } = await this.#open({ clock: false, entry: 'linked.js', prepare: OpeningFailures.#counted });
		try {
			await page.getByText('No se pudo abrir Projects', { exact: true }).waitFor();
			assert.equal(await OpeningFailures.#loads(page), 2, 'one reload by itself');
			assert.deepEqual(await this.#steps(page), ['failed Cargando Projects']);
			assert.match(await page.locator('[data-opening-text]').textContent(), /absent/, 'the details name what could not link');
			await OpeningFailures.#still(page);
		} finally { await context.close(); }
	}

	/** An entry that throws before drawing anything: said at once, with no reload by itself */
	async #thrown() {
		const { context, page } = await this.#open({ clock: false, entry: 'thrown.js', prepare: OpeningFailures.#counted });
		try {
			await page.getByText('No se pudo abrir Projects', { exact: true }).waitFor();
			await page.waitForTimeout(300);
			assert.equal(await OpeningFailures.#loads(page), 1, 'code that loaded and threw is not loaded again');
			assert.match(await page.locator('[data-opening-text]').textContent(), /could not start/);
		} finally { await context.close(); }
	}

	/**
	 * A start that threw, then offline: reconnecting cannot fix it, so the failure stays said and its Reload
	 * waits for the connection; when the product moves anyway, the opening waits again, then opens
	 */
	async #revived() {
		const { context, page, release } = await this.#open({ clock: false, entry: 'revived.js' });
		const reload = () => page.getByRole('button', { name: 'Volver a cargar', exact: true });
		try {
			await page.getByText('No se pudo abrir Projects', { exact: true }).waitFor();
			await context.setOffline(true);
			await page.evaluate(() => dispatchEvent(new Event('offline')));
			await reload().waitFor({ state: 'hidden' });
			assert.equal(await page.getByText('Estás sin conexión', { exact: true }).count(), 0, 'no promise that reconnecting opens it');
			assert.equal(await page.getByText('No se pudo abrir Projects', { exact: true }).isVisible(), true);
			assert.deepEqual(await this.#steps(page), ['failed Cargando Projects'], 'a step that failed stays failed whatever is said next');
			await context.setOffline(false);
			await page.evaluate(() => dispatchEvent(new Event('online'))).catch(() => null);
			await reload().waitFor();
			await page.waitForFunction(() => document.querySelector('[data-opening-recovery]').hidden && document.querySelector('[data-opening-status]').textContent === 'Confirmando tu sesión');
			assert.deepEqual(await this.#steps(page), ['failed Cargando Projects', 'active Confirmando tu sesión'], 'it waits again, saying what failed and what runs');
			release();
			await page.locator('#bui-opening').waitFor({ state: 'detached' });
			await page.getByRole('heading', { name: 'Your projects' }).waitFor();
		} finally { await context.close(); }
	}

	/** A failure once the product drew: nothing said while it may finish, "longer than expected" once nothing moves */
	async #outlived() {
		const { context, page, release } = await this.#open();
		try {
			await page.waitForFunction(() => document.querySelector('[data-opening-status]').textContent === 'Confirmando tu sesión');
			await page.evaluate(() => dispatchEvent(new ErrorEvent('error', { message: 'Startup failed', filename: 'http://127.0.0.1/ready.js', lineno: 3 })));
			await page.clock.fastForward(1000);
			assert.equal(await page.locator('[data-opening-recovery]').isHidden(), true, 'the product may still finish');
			await page.clock.fastForward(3500);
			await page.getByText('Está tardando más de lo esperado', { exact: true }).waitFor();
			assert.equal(await page.getByText('Puedes seguir esperando o volver a cargar.', { exact: true }).isVisible(), true);
			assert.match(await page.locator('[data-opening-text]').textContent(), /Error: Startup failed · http:\/\/127\.0\.0\.1\/ready\.js:3/);
			assert.deepEqual(await this.#steps(page), ['done Cargando Projects', 'late Confirmando tu sesión']);
			release();
			await page.locator('#bui-opening').waitFor({ state: 'detached' });
			await page.getByRole('heading', { name: 'Your projects' }).waitFor();
		} finally { await context.close(); }
	}

	/** Offline: the product opens by itself on reconnecting, so nothing is offered that cannot work offline */
	async #offline() {
		const { context, page, release } = await this.#open({ clock: false, hold: '**/ready.js', abort: true });
		try {
			// The controller is running once the line for an opening without it is gone
			await page.waitForFunction(() => document.getElementById('bui-opening') && !document.querySelector('[data-opening-fallback]'));
			await context.setOffline(true);
			await page.evaluate(() => dispatchEvent(new Event('offline')));
			await page.getByText('Estás sin conexión', { exact: true }).waitFor();
			assert.equal(await page.getByText('La apertura continúa en cuanto vuelvas a tener conexión.', { exact: true }).isVisible(), true);
			assert.equal(await page.getByRole('button', { name: 'Volver a cargar', exact: true }).isVisible(), false, 'Reload offline would put the browser’s error in place of the page');
			assert.equal(await page.locator('.bui-opening-details').isVisible(), false);
			assert.equal(await OpeningFailures.#opened(page), false, 'no mark while offline is said');
			release();
			await page.waitForFunction(() => document.querySelector('[data-opening-recovery]').dataset.state === 'offline' && document.querySelector('.bui-opening-step[data-state="failed"]'));
			await OpeningFailures.#still(page);
			await page.unroute('**/ready.js');
			const reloaded = page.waitForEvent('framenavigated');
			await context.setOffline(false);
			// Engines that emulate the connection fire `online` themselves; the others are told here
			await page.evaluate(() => dispatchEvent(new Event('online'))).catch(() => null);
			await reloaded;
			await page.getByRole('heading', { name: 'Your projects' }).waitFor();
		} finally { await context.close(); }
	}

	/** The markup before 0.21.0 with this controller: drawn again in this version's form, saying its cause, and nothing throws */
	async #earlier() {
		const errors = [];
		const warned = [];
		// Heard from the context, which exists before the page's first script runs
		const prepare = context => {
			context.on('weberror', error => errors.push(error.error().message));
			context.on('console', message => { if (message.type() === 'warning') warned.push(message.text()); });
		};
		const { context, page, release } = await this.#open({ path: '/earlier?project=kept#context', prepare });
		try {
			await page.waitForFunction(() => document.querySelector('[data-opening-status]')?.textContent === 'Confirmando tu sesión');
			assert.equal(await page.locator('.bui-opening-help, .bui-opening-panel').count(), 0, 'nothing of the earlier markup stays');
			assert.equal(await page.locator('.bui-opening-lockup .bui-opening-wordmark').getAttribute('src'), '/wordmark.svg');
			await page.clock.fastForward(12100);
			await page.getByText('El servidor de desarrollo de Projects está desactualizado. Detenlo, vuelve a iniciarlo y vuelve a cargar.', { exact: true }).waitFor();
			assert.equal(await page.locator('.bui-opening-details').evaluate(node => node.open), false, 'still running: the details stay closed');
			assert.match(await page.locator('[data-opening-text]').textContent(), /Página generada por: una versión anterior/);
			release();
			await page.locator('#bui-opening').waitFor({ state: 'detached' });
			await page.getByRole('heading', { name: 'Your projects' }).waitFor();
			assert.deepEqual(errors, [], 'nothing throws');
			assert.ok(warned.some(line => /stop the development server and start it again/.test(line)), 'the console says it to whoever develops');
		} finally { await context.close(); }
	}

	/** A development server's error overlay says what failed in full: the opening steps aside at once */
	async #overlay() {
		const { context, page } = await this.#open({ clock: false });
		try {
			await page.waitForFunction(() => document.querySelector('[data-opening-status]')?.textContent === 'Confirmando tu sesión');
			await page.evaluate(() => document.body.append(Object.assign(document.createElement('vite-error-overlay'), { textContent: '[plugin:vite:react-babel] /src/main.tsx: Unexpected token (12:4)' })));
			await page.locator('#bui-opening').waitFor({ state: 'detached' });
			assert.equal(await page.locator('vite-error-overlay').evaluate(node => getComputedStyle(node).visibility), 'visible');
			assert.equal(await OpeningFailures.#opened(page), true, 'the opening stepped aside: the document says so');
		} finally { await context.close(); }
	}
}
