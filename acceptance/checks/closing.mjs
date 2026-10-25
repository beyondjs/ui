import { expect, overflow } from '../support/browser.mjs';

/**
 * 0.33.0 measured in the browser (D163, D186): a table's cells and a picker say an outage in their own
 * places, inline and with no Try again, while the page's one line names who did not answer; a change
 * answered unavailable is said in the warning tone; the inbox's outage is the page form; and offline the
 * line names no product, offers no Try again and names its cause again once the browser is online. 1440,
 * 390 and 320 px in both themes.
 */
const measure = page =>
	page.evaluate(() => {
		const box = node => node.getBoundingClientRect().toJSON();
		const notice = document.querySelector('.bui-recovery');
		const cells = [...document.querySelectorAll('.bui-data-table .bui-empty-inline')];
		const place = document.querySelector('.bui-picker-status .bui-empty-inline');
		// The mark beside the words' first line, its middle on that line's middle
		const line = node => {
			const mark = node.querySelector('.bui-empty-mark').getBoundingClientRect();
			const range = document.createRange();
			range.selectNodeContents(node.querySelector('.bui-empty-said'));
			const first = range.getClientRects()[0];
			return { mark: mark.width, centered: Math.abs((mark.top + mark.bottom) / 2 - (first.top + first.bottom) / 2) <= 3, inside: box(node).right <= innerWidth + 1, color: getComputedStyle(node.querySelector('.bui-empty-mark')).color };
		};
		return {
			title: notice.querySelector('.bui-recovery-title').textContent,
			actions: [...notice.querySelectorAll('button')].filter(button => !button.closest('details') && !button.hidden && button.getClientRects().length).length,
			again: notice.querySelector('.bui-again')?.textContent ?? '',
			rows: notice.querySelector('details')?.querySelectorAll('tbody tr').length ?? 0,
			cells: cells.map(cell => ({ text: cell.textContent, ...line(cell) })),
			place: place ? { text: place.textContent, ...line(place) } : null,
			buttons: [...document.querySelectorAll('.bui-picker-foot button')].filter(button => !button.hidden).length,
			warning: getComputedStyle(document.querySelector('.bui-recovery')).borderLeftColor
		};
	});

export const checks = [
	{
		name: 'outage close: cells and a picker say it in place, inline, with no Try again, at 1440, 390 and 320 px in both themes (0.33.0)',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			for (const colorScheme of ['light', 'dark'])
				for (const width of [1440, 390, 320]) {
					const { page, context } = await browser.open(consumer, { file: 'closing.html', viewport: { width, height: 900 }, colorScheme });
					try {
						await page.evaluate(() => document.fonts.ready);
						await page.locator('.bui-picker-status .bui-empty-inline').waitFor();
						await page.locator('.bui-recovery:not([hidden]) .bui-again').waitFor();
						const found = await measure(page);
						const where = `${consumer.name} ${width} ${colorScheme}: ${JSON.stringify(found)}`;
						expect(found.title === 'Beyond Projects did not answer' && found.actions === 1, `one line names who did not answer, with one Try again: ${where}`);
						expect(found.rows === 2, `the cells’ read and the picker’s search in one Technical details: ${where}`);
						expect(found.cells.length === 2 && found.cells.every(cell => cell.text === 'Not available right now' && cell.mark === 16 && cell.centered && cell.inside), `each cell says it inline, its mark beside its words: ${where}`);
						expect(found.place?.text === 'Not available right now' && found.place.mark === 16 && found.place.inside, `the picker says it in place: ${where}`);
						expect(found.buttons === 0, `the picker offers no Try again of its own: ${where}`);
						expect(found.cells.every(cell => cell.color === found.warning), `the outage’s mark in the warning color: ${where}`);
						expect(!(await overflow(page)), `no sideways scroll: ${where}`);
					} finally {
						await context.close();
					}
				}
		}
	},
	{
		name: 'outage close: a change answered unavailable is said in the warning tone, politely, never as a failure (D186)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const width of [1440, 320]) {
				const { page, context } = await browser.open(consumer, { file: 'closing.html', viewport: { width, height: 900 } });
				try {
					await page.locator('.closing-form button[type="submit"]').click();
					await page.locator('.closing-form .bui-callout').waitFor();
					const said = await page.evaluate(() => {
						const callout = document.querySelector('.closing-form .bui-callout');
						return { warning: callout.classList.contains('bui-callout-warning'), role: callout.getAttribute('role'), text: [...callout.querySelectorAll('.bui-callout-title, .bui-callout-text')].map(node => node.textContent), right: callout.getBoundingClientRect().right, viewport: innerWidth };
					});
					expect(said.warning && said.role === 'status', `warning and polite: ${JSON.stringify(said)}`);
					expect(said.text.join(' | ') === 'Beyond Projects did not answer | Nothing was changed.', `who did not answer and that nothing was changed: ${JSON.stringify(said)}`);
					expect(said.right <= said.viewport + 1 && !(await overflow(page)), `it fits: ${JSON.stringify(said)}`);
				} finally {
					await context.close();
				}
			}
		}
	},
	{
		name: 'outage close: the inbox’s outage is the page form, its read in Technical details, and it gives the page back',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const colorScheme of ['light', 'dark'])
				for (const width of [1440, 320]) {
					const { page, context } = await browser.open(consumer, { file: 'closing.html', query: '?inbox=1', viewport: { width, height: 900 }, colorScheme });
					try {
						await page.locator('.bui-recovery[data-recovery="page"]:not([hidden])').waitFor();
						const found = await page.evaluate(() => {
							const notice = document.querySelector('.bui-recovery');
							return { title: notice.querySelector('h2.bui-recovery-title')?.textContent, callouts: document.querySelectorAll('.bui-inbox .bui-callout').length, tools: document.querySelector('.bui-inbox-tools').getClientRects().length, details: notice.querySelector('details')?.textContent ?? '', left: notice.getBoundingClientRect().left, h1: document.querySelector('h1').getBoundingClientRect().left };
						});
						const where = `${consumer.name} ${width} ${colorScheme}: ${JSON.stringify(found)}`;
						expect(found.title === 'Beyond Projects did not answer' && found.callouts === 0, `the page form, no callout of its own: ${where}`);
						expect(found.tools === 0, `no filter that cannot work: ${where}`);
						expect(/Notifications[\s\S]*req_inbox_7Hq2/.test(found.details), `its read in the line’s Technical details: ${where}`);
						expect(Math.abs(found.left - found.h1) <= 1, `on the H1’s edge: ${where}`);
						expect(!(await overflow(page)), `no sideways scroll: ${where}`);
						if (width === 1440 && colorScheme === 'light') {
							await page.evaluate(() => (window.fixture.read.answer = true));
							await page.locator('.bui-recovery-actions button').click();
							await page.waitForFunction(() => !document.querySelector('.bui-inbox .bui-recovery') && document.querySelector('.bui-inbox-tools').getClientRects().length);
						}
					} finally {
						await context.close();
					}
				}
		}
	},
	{
		name: 'outage close: offline the line says so with no Try again, once, and names its cause again online',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page, context } = await browser.open(consumer, { file: 'closing.html', viewport: { width: 390, height: 900 } });
			try {
				await page.locator('.bui-recovery:not([hidden]) .bui-again').waitFor();
				await context.setOffline(true);
				await page.waitForFunction(() => document.querySelector('.bui-recovery-title').textContent === 'You’re offline');
				const away = await measure(page);
				expect(away.actions === 0 && /as soon as you’re back online$/.test(away.again), `nothing that cannot work: ${JSON.stringify(away)}`);
				expect(away.cells.length === 2 && away.place, `each place still says it is not available: ${JSON.stringify(away)}`);
				await context.setOffline(false);
				await page.waitForFunction(() => document.querySelector('.bui-recovery-title').textContent === 'Beyond Projects did not answer');
				expect((await measure(page)).actions === 1, 'online again, its Try again is back');
			} finally {
				await context.close();
			}
		}
	}
];
