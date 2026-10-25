import { expect } from '../support/browser.mjs';

/**
 * What a page scrolls to lands below its sticky lines (0.35.0), on the `clear.html` pages: the family bar, below
 * the Sidebar's cut its product row unless the Sidebar is merged with the bar (`?merged=1`), and the header's
 * compact line where one is drawn (`?compact=1`). An address's target (a fragment navigated to), a part brought
 * into view from its start (`scrollIntoView`) and a section's heading focused by code, from under the bar and
 * from below the window, at 320, 390 and 1440 px. Without the compact line the document's `scroll-padding-top`
 * is the bar's height, with the row's where it is drawn, and a little room. And a control on those sticky lines
 * (the bar's, the row's button, the compact line's action) moves nothing when it takes focus, by code or by Tab.
 */
async function open(browser, consumer, { width, query }) {
	const view = await browser.open(consumer, { file: 'clear.html', query, viewport: { width, height: 800 }, reducedMotion: 'reduce' });
	await view.page.evaluate(() => document.fonts.ready);
	await view.page.waitForSelector('.clear-part .bui-section-title[tabindex="-1"]', { state: 'attached' });
	return view;
}

/** Three frames: the compact line decides on the frame after a scroll. */
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))));

/** The lowest edge of the sticky lines drawn now, the document's scroll padding and the top of `selector`. */
const measure = (page, selector) =>
	page.evaluate(selector => {
		const drawn = node => (node?.getClientRects().length && node.getBoundingClientRect().height > 0 ? node.getBoundingClientRect() : null);
		const bar = drawn(document.querySelector('.bui-family'));
		const row = drawn(document.querySelector('.bui-sidebar-row'));
		const compact = drawn(document.querySelector('.bui-page-compact[data-shown] .bui-page-compact-line'));
		// The bar's edge is a 1 px line under its box
		const lines = Math.max(bar ? bar.bottom + 1 : 0, row?.bottom ?? 0, compact?.bottom ?? 0);
		const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
		// Where the compact line starts against the bar's edge or the row's: a gap between them shows the page through
		const gap = compact ? Math.round(compact.top - Math.max(bar ? bar.bottom + 1 : 0, row?.bottom ?? 0)) : null;
		return { lines, padding, top: document.querySelector(selector).getBoundingClientRect().top, row: Boolean(row), compact: Boolean(compact), gap, y: Math.round(scrollY) };
	}, selector);

/** Back to the page's top with no fragment, the compact line hidden again. */
const reset = async page => {
	await page.evaluate(() => (history.replaceState(null, '', location.pathname + location.search), scrollTo(0, 0)));
	await settle(page);
};

const cases = [
	{ width: 1440, query: '', padding: 52 },
	{ width: 1440, query: '?compact=1' },
	{ width: 390, query: '', padding: 96 },
	{ width: 390, query: '?compact=1' },
	{ width: 320, query: '', padding: 96 },
	{ width: 320, query: '?merged=1', padding: 52 },
	{ width: 320, query: '?merged=1&compact=1' }
];

/** Lands an address's target and a scrolled part, then focuses two headings by code. */
async function land(page, at, query) {
	await page.evaluate(() => (location.hash = '#docker'));
	await settle(page);
	let found = await measure(page, '#docker');
	expect(found.top >= found.lines - 0.5 && Math.abs(found.top - found.padding) <= 1, `${at}: #docker lands at ${found.top} px, the lines end at ${found.lines} px and the padding is ${found.padding} px`);
	if (query.includes('compact')) expect(found.compact, `${at}: the compact line shows over a target far down`);
	if (process.env.DEBUG && found.compact) console.log(`     ${at}: the compact line starts ${found.gap} px below the line above it`);
	await reset(page);
	await page.evaluate(() => document.querySelector('#outbound').scrollIntoView({ block: 'start' }));
	await settle(page);
	found = await measure(page, '#outbound');
	expect(found.top >= found.lines - 0.5 && Math.abs(found.top - found.padding) <= 1, `${at}: scrollIntoView puts #outbound at ${found.top} px under lines ending at ${found.lines} px`);
	await reset(page);
	// A heading focused by code while the bar covers it, and one below the window
	for (const [id, under] of [['#inbound', true], ['#docker', false]]) {
		const heading = `${id} .bui-section-title`;
		await page.evaluate(([selector, under]) => scrollTo(0, under ? document.querySelector(selector).getBoundingClientRect().top + scrollY - 10 : 0), [heading, under]);
		await settle(page);
		await page.evaluate(selector => document.querySelector(selector).focus(), heading);
		await settle(page);
		found = await measure(page, heading);
		const focused = await page.evaluate(selector => document.activeElement === document.querySelector(selector), heading);
		expect(focused && found.top >= found.lines - 0.5, `${at}: ${id}'s heading focused from ${under ? 'under the bar' : 'below the window'} is at ${found.top} px, the lines end at ${found.lines} px (scrolled to ${found.y}, padding ${found.padding})`);
		await reset(page);
	}
}

/** Focuses each control drawn on a sticky line far down the page, by code and by Tab, and says any that moved it. */
async function hold(page, at, keys) {
	await page.evaluate(() => scrollTo(0, 1600));
	await settle(page);
	const controls = await page.evaluate(() =>
		['.bui-family .bui-header-brand', '.bui-family .bui-header-toggle', '.bui-family .bui-disclosure-button', '.bui-sidebar-row .bui-sidebar-button', '.bui-page-compact[data-shown] .bui-page-compact-actions button']
			.flatMap(selector => [...document.querySelectorAll(selector)].map((node, index) => ({ selector, index, drawn: Boolean(node.getClientRects().length) && getComputedStyle(node).visibility !== 'hidden' })))
			.filter(control => control.drawn)
	);
	const moved = [];
	for (const { selector, index } of controls) {
		const before = await page.evaluate(() => scrollY);
		await page.evaluate(([selector, index]) => document.querySelectorAll(selector)[index].focus(), [selector, index]);
		await settle(page);
		const by = await page.evaluate(() => scrollY);
		if (Math.abs(by - before) > 1) moved.push(`${selector}#${index} by code ${before}→${by}`);
		await page.evaluate(y => scrollTo(0, y), before);
		await page.keyboard.press(keys);
		await settle(page);
		const after = await page.evaluate(() => ({ y: scrollY, on: document.activeElement?.className ?? '', inside: Boolean(document.activeElement?.closest('.bui-family, .bui-sidebar-row, .bui-page-compact-line')) }));
		if (after.inside && Math.abs(after.y - before) > 1) moved.push(`Tab from ${selector}#${index} to ${after.on} ${before}→${after.y}`);
		await page.evaluate(y => scrollTo(0, y), before);
		await settle(page);
	}
	expect(controls.length >= 3, `${at}: ${controls.length} controls drawn on the sticky lines`);
	expect(!moved.length, `${at}: focus on a sticky line moved the page: ${moved.join('; ')}`);
}

export const checks = [
	{
		name: 'clear: targets, an address\'s target, scrollIntoView and a heading focused by code land below the bar, the sidebar\'s row and the compact line, at 320, 390 and 1440 px',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const { width, query, padding } of cases) {
				const at = `${width} px${query ? ` ${query}` : ''}`;
				const { page, context } = await open(browser, consumer, { width, query });
				const opened = await measure(page, '#docker');
				if (padding) expect(Math.abs(opened.padding - padding) <= 0.5, `${at}: the document's scroll padding is ${opened.padding} px, not the sticky lines' ${padding} px`);
				await land(page, at, query);
				await context.close();
			}
		}
	},
	{
		name: 'clear: sticky controls, the bar\'s, the sidebar row\'s and the compact line\'s take focus by code and by Tab and move nothing, at 320, 390 and 1440 px',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			// WebKit moves focus to links by Tab only with Option, as Safari does by default
			const keys = browser.engine === 'webkit' ? 'Alt+Tab' : 'Tab';
			for (const { width, query } of cases) {
				const at = `${width} px${query ? ` ${query}` : ''}`;
				const { page, context } = await open(browser, consumer, { width, query });
				await hold(page, at, keys);
				await context.close();
			}
		}
	}
];
