import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { once } from 'node:events';
import { chromium, firefox, webkit } from 'playwright-core';
import { OpeningDocument } from '@beyond-js/ui/opening';

/** Checks the static opening under strict CSP, against a fictional delayed application. */
class OpeningAcceptance {
	#document = new OpeningDocument({ product: 'Projects', key: 'opening-fixture', device: true, logo: new URL('./fixtures/brand/wordmark.svg', import.meta.url) });
	#server;
	#browser;
	#url;
	#count = 0;

	async run() {
		this.#server = createServer((request, response) => {
			const name = request.url.split('?')[0].slice(1);
			if (this.#document.files.has(name)) {
				response.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : name.endsWith('.svg') ? 'image/svg+xml' : 'font/woff2');
				return response.end(this.#document.files.get(name));
			}
			if (name === 'ready.js') {
				response.setHeader('Content-Type', 'text/javascript');
				return response.end(readFileSync(new URL('./fixtures/opening/ready.js', import.meta.url)));
			}
			if (name === 'state') return response.end('{}');
			response.setHeader('Content-Type', 'text/html');
			response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; require-trusted-types-for 'script'; trusted-types 'none'");
			response.end(this.#document.render(readFileSync(new URL('./fixtures/opening/index.html', import.meta.url), 'utf8')));
		});
		try {
			this.#server.listen(0, '127.0.0.1'); await once(this.#server, 'listening');
			this.#url = `http://127.0.0.1:${this.#server.address().port}`;
			const engine = process.env.BEYOND_UI_BROWSER ?? 'chrome';
			this.#browser = await ({ chrome: () => chromium.launch({ channel: 'chrome' }), firefox: () => firefox.launch(), webkit: () => webkit.launch() })[engine]();
			for (const theme of ['light', 'dark']) for (const width of [320, 390, 1440]) await this.#check({ theme, width });
			await this.#check({ module: true });
			await this.#check({ failure: true });
			await this.#check({ disabled: true });
			console.log(`${engine}: ${this.#count} opening checks passed`);
		} finally {
			await this.#browser?.close(); this.#server.closeAllConnections();
			await new Promise(resolve => this.#server.close(resolve));
		}
	}

	async #check({ theme = 'light', width = 390, module = false, failure = false, disabled = false }) {
		const context = await this.#browser.newContext({ viewport: { width, height: 800 }, colorScheme: theme, reducedMotion: 'reduce', locale: 'es-ES', javaScriptEnabled: !disabled });
		try {
			const page = await context.newPage();
			if (!disabled) await page.clock.install();
			let release;
			const gate = new Promise(resolve => release = resolve);
			const pattern = module ? '**/ready.js' : '**/state';
			await page.route(pattern, async route => { await gate; if (module) await route.abort(); else await route.fulfill({ status: failure ? 503 : 200, body: '{}' }); });
			await page.goto(this.#url + '/?project=kept#context', { waitUntil: module ? 'commit' : 'domcontentloaded' });
			if (disabled) {
				await page.getByText('Enable JavaScript in your browser to open this product.', { exact: true }).waitFor();
				assert.equal(await page.getByRole('status').count(), 0);
				this.#count++; return;
			}
			await page.getByText('Abriendo…', { exact: true }).waitFor();
			assert.equal(await page.locator('#bui-opening').evaluate(element => element.scrollWidth <= innerWidth), true);
			assert.equal(await page.locator('#bui-opening').evaluate(element => getComputedStyle(element).backgroundColor), theme === 'dark' ? 'rgb(16, 22, 37)' : 'rgb(255, 255, 255)');
			await page.clock.fastForward(12001);
			const button = page.getByRole('button', { name: 'Volver a cargar', exact: true });
			await button.waitFor(); await button.focus();
			if (width === 390 && !module && !failure) {
				mkdirSync('.artifacts/opening', { recursive: true });
				await page.screenshot({ path: `.artifacts/opening/${process.env.BEYOND_UI_BROWSER ?? 'chrome'}-${theme}.png` });
			}
			release();
			if (module) {
				await page.waitForLoadState('domcontentloaded'); await page.unroute(pattern);
				await button.click();
			}
			await page.locator('#bui-opening').waitFor({ state: 'detached' });
			await page.getByRole('heading', { name: failure ? 'The service is unavailable' : 'Your projects' }).waitFor();
			if (!module) assert.equal(await page.locator('h1').evaluate(node => node === document.activeElement), true);
			assert.ok(page.url().endsWith('/?project=kept#context'));
			assert.equal(await page.locator('body').evaluate(body => body.getAnimations({ subtree: true }).length), 0);
			this.#count++;
		} finally { await context.close(); }
	}
}
await new OpeningAcceptance().run();
