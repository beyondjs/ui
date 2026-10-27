import { expect, overflow } from '../support/browser.mjs';

/**
 * A page's lead (0.41.0, D191) in a real engine, on the layout page with `?lead=1`: under the facts line, on the
 * H1's edge, in the body's size and the muted colour, and no line past the reading measure at 390 to 1920 px in
 * both themes, while the facts line keeps the header's width. And the Preferences dialog's "Change for all of
 * Beyond" (0.41.0): in the text's colour with the quiet underline, full on hover, on a page with no base link
 * rule (as Beyond Home's window host) and on pages whose base rule colours links or takes their underline off.
 */
async function open(browser, consumer, { width, query = '', scheme = 'light' }) {
	const view = await browser.open(consumer, { file: 'layout.html', query, viewport: { width, height: 900 }, colorScheme: scheme });
	await view.page.evaluate(() => document.fonts.ready);
	await view.page.waitForSelector('.bui-page-heading');
	return view;
}

/** A colour as the page resolves it: a probe drawn in the value. */
const resolve = (page, value) =>
	page.evaluate(value => {
		const probe = document.body.appendChild(document.createElement('span'));
		probe.style.color = value;
		const color = getComputedStyle(probe).color;
		probe.remove();
		return color;
	}, value);

const lead = page =>
	page.evaluate(() => {
		const round = value => Math.round(value * 10) / 10;
		const first = node => {
			const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, { acceptNode: text => (text.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
			const text = walker.nextNode();
			const range = document.createRange();
			range.setStart(text, text.textContent.search(/\S/));
			range.setEnd(text, text.textContent.search(/\S/) + 1);
			return round(range.getBoundingClientRect().left);
		};
		/** The most characters on one rendered line, counted per line. */
		const characters = node => {
			const lines = new Map();
			const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
			const range = document.createRange();
			for (let text = walker.nextNode(); text; text = walker.nextNode()) {
				for (let index = 0; index < text.length; index++) {
					range.setStart(text, index);
					range.setEnd(text, index + 1);
					const box = range.getClientRects()[0];
					if (box) lines.set(Math.round(box.top), (lines.get(Math.round(box.top)) ?? 0) + 1);
				}
			}
			return { longest: Math.max(0, ...lines.values()), lines: lines.size };
		};
		const node = document.querySelector('.bui-page-lead');
		const facts = document.querySelector('.bui-page-facts');
		const header = document.querySelector('.bui-page-header');
		const style = getComputedStyle(node);
		const probe = document.body.appendChild(document.createElement('p'));
		probe.className = 'bui-reading';
		probe.style.font = style.font;
		const measure = parseFloat(getComputedStyle(probe).maxWidth);
		probe.remove();
		return {
			shown: Boolean(node?.getClientRects().length),
			start: first(node),
			heading: first(document.querySelector('.bui-page-heading')),
			top: node.getBoundingClientRect().top,
			after: facts.getBoundingClientRect().bottom,
			width: node.getBoundingClientRect().width,
			measure,
			header: header.getBoundingClientRect().width,
			facts: facts.getBoundingClientRect().width,
			size: style.fontSize,
			body: getComputedStyle(document.body).fontSize,
			color: style.color,
			...characters(node)
		};
	});

/** The link's colour and underline at rest, and its underline's colour on hover. */
const link = async page => {
	const anchor = page.locator('dialog.bui-dialog[open] .bui-preferences-note a');
	await page.mouse.move(0, 0);
	const rest = await anchor.evaluate(node => {
		const style = getComputedStyle(node);
		return { color: style.color, line: style.textDecorationLine, decoration: style.textDecorationColor };
	});
	await anchor.hover();
	const hover = await anchor.evaluate(node => getComputedStyle(node).textDecorationColor);
	await page.mouse.move(0, 0);
	return { ...rest, hover };
};

export const checks = [
	{
		name: 'page: a lead under the facts line, on the H1\'s edge, muted in the body\'s size and within the reading measure at 390 to 1920 px, both themes (0.41.0, D191)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const scheme of ['light', 'dark']) {
				for (const width of [390, 1024, 1440, 1920]) {
					const at = `${width}px ${scheme}`;
					const { page, context } = await open(browser, consumer, { width, scheme, query: '?lead=1' });
					const found = await lead(page);
					const said = `${at}: ${JSON.stringify(found)}`;
					const muted = await resolve(page, 'var(--color-text-muted)');
					expect(found.shown, `${said}: the lead is drawn`);
					expect(found.top >= found.after - 0.5, `${said}: under the facts line`);
					expect(Math.abs(found.start - found.heading) <= 1, `${said}: it starts on the H1's edge`);
					expect(found.size === found.body, `${said}: in the body's size`);
					expect(found.color === muted, `${said}: in the muted colour ${muted}`);
					expect(found.width <= found.measure + 1, `${said}: within the reading measure`);
					expect(found.longest <= 80, `${said}: no line past 80 characters`);
					if (width >= 1024) expect(found.lines >= 2 && found.header > found.measure + 100, `${said}: it wraps at the measure in a wider header`);
					expect(!(await overflow(page)), `${at}: no sideways scroll`);
					await context.close();
				}
			}
		}
	},
	{
		name: 'preferences: "Change for all of Beyond" in the text\'s colour with the quiet underline, full on hover, with and without a page\'s base link rule (0.41.0)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const bases = { none: null, colored: 'a { color: var(--color-link); }', bare: 'a { color: blue; text-decoration: none; }' };
			for (const scheme of ['light', 'dark']) {
				for (const [base, rule] of Object.entries(bases)) {
					const at = `${scheme}, base rule ${base}`;
					const { page, context } = await open(browser, consumer, { width: 1440, scheme });
					if (rule) await page.addStyleTag({ content: rule });
					await page.locator('.bui-family-account > .bui-navmenu-button, .bui-family-account button[aria-expanded]').first().click();
					await page.locator('.bui-family-preferences').click();
					await page.locator('dialog.bui-dialog[open] .bui-preferences-note a').waitFor();
					const found = await link(page);
					const text = await resolve(page, 'var(--color-link)');
					const quiet = await resolve(page, 'var(--color-border-strong)');
					const said = `${at}: ${JSON.stringify(found)}`;
					expect(found.color === text, `${said}: in the text's colour ${text}`);
					expect(found.line.includes('underline') && found.decoration === quiet, `${said}: the quiet underline ${quiet}`);
					expect(found.hover === text, `${said}: the full underline on hover`);
					await context.close();
				}
			}
		}
	}
];
