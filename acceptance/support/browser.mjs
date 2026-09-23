import { chromium } from 'playwright-core';

/**
 * The browser of the acceptance run: the installed Google Chrome (channel `chrome`), headless.
 * Every check opens its own context so viewport, color scheme, motion and touch never leak between
 * checks.
 */
export class Browser {
	#browser = null;

	async launch() {
		this.#browser = await chromium.launch({ channel: 'chrome', headless: true });
		return this;
	}

	get version() {
		return this.#browser.version();
	}

	/** Opens a consumer page in a new context and waits until the fixture is ready. */
	async open(consumer, { query = '', ...options } = {}) {
		const context = await this.#browser.newContext({ viewport: { width: 1280, height: 900 }, ...options });
		const page = await context.newPage();
		const errors = [];
		page.on('pageerror', error => errors.push(error.message));
		await page.goto(`${consumer.url}${query}`);
		await page.waitForFunction(() => window.fixture?.ready && document.querySelector('.bui-header') && document.querySelector('.bui-picker'));
		return { page, context, errors };
	}

	async close() {
		await this.#browser?.close();
	}
}

/** Fails a check with a message. */
export function expect(condition, message) {
	if (!condition) throw new Error(message);
}

/** Whether the page scrolls sideways. */
export function overflow(page) {
	return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}

/** A short description of the focused element. */
export function focused(page) {
	return page.evaluate(() => {
		const node = document.activeElement;
		return node ? `${node.tagName.toLowerCase()}|${node.getAttribute('aria-label') ?? ''}|${node.textContent.trim().slice(0, 40)}|${node.className}` : 'none';
	});
}
