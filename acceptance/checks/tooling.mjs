import { expect } from '../support/browser.mjs';

/**
 * The collection tools of 0.44.0 (D162 L8, L10) on the tools page, at 390 and 1280 px: a period chosen in the
 * header's Filters is kept as text, said whole in its removable chip and read by the source (DOM) or by both
 * views of one toolbar (React); the toolbar never widens the page; and an empty collection's own action sits in
 * `EmptyState`'s actions row, one inset above the box's end.
 */

/** Opens the header's Filters and chooses a value of the period's select */
async function choose(page, value) {
	const button = page.locator('.bui-page-header .bui-list-filters .bui-disclosure-button').first();
	await button.click();
	const select = page.locator('.bui-collection-filter select').first();
	await select.waitFor({ state: 'visible' });
	await select.selectOption(value);
	return select;
}

/** What the page shows of the chosen period, and whether anything is cut or widens the page */
function measure(page) {
	return page.evaluate(() => {
		const chip = document.querySelector('.bui-list-restriction:not([hidden])');
		const words = chip?.querySelector('span');
		const select = document.querySelector('.bui-collection-filter select');
		return {
			chip: chip?.textContent ?? null,
			cut: words ? words.scrollWidth > words.clientWidth + 1 : null,
			sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
			options: select ? [...select.options].map(option => option.textContent) : []
		};
	});
}

export const checks = [
	{
		name: 'tools: a period filter in the header is chosen, kept as text and said whole in its chip, at 390 and 1280 px (0.44.0, L8)',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const spanish = consumer.name !== 'dom';
			for (const width of [390, 1280]) {
				const { page } = await browser.open(consumer, { file: 'tools.html', viewport: { width, height: 900 } });
				await page.locator('.bui-page-header .bui-list-tools').waitFor({ state: 'attached' });
				await choose(page, '2026-09');
				const shown = await measure(page);
				const offered = spanish ? ['Cualquier fecha', 'Últimos 7 días', 'Últimos 30 días', 'octubre de 2026', 'septiembre de 2026', 'agosto de 2026'] : ['Any time', 'Last 7 days', 'Last 30 days', 'October 2026', 'September 2026', 'August 2026'];
				expect(JSON.stringify(shown.options) === JSON.stringify(offered), `${width}px: the periods offered: ${JSON.stringify(shown.options)}`);
				expect(shown.chip === (spanish ? 'Periodo: septiembre de 2026' : 'Period: September 2026'), `${width}px: the chip names the period: ${shown.chip}`);
				expect(shown.cut === false, `${width}px: the chip's words are whole`);
				expect(!shown.sideways, `${width}px: the toolbar never widens the page`);
				if (spanish) {
					await page.waitForFunction(() => window.fixture.changes.at(-1)?.filters.period === '2026-09');
					const views = await page.evaluate(() => ['graph', 'table'].map(name => [...document.querySelectorAll(`[data-view="${name}"] .bui-row-title`)].map(title => title.textContent)));
					expect(views[0].length === 2 && JSON.stringify(views[0]) === JSON.stringify(views[1]), `${width}px: one toolbar filters both views: ${JSON.stringify(views)}`);
					await page.evaluate(() => window.fixture.focus());
					const focused = await page.evaluate(() => document.activeElement?.matches('input[type="search"]') ?? false);
					expect(focused, `${width}px: the tools' handle opens and focuses the search`);
				} else {
					await page.waitForFunction(() => window.fixture.requests.at(-1)?.filters.period === '2026-09' && document.querySelectorAll('.bui-collection .bui-row').length === 2);
				}
				await page.close();
			}
		}
	},
	{
		name: 'tools: an empty collection\'s own action sits in EmptyState\'s actions row, one inset above the box\'s end (0.44.0, L10)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer, { file: 'tools.html', query: '?empty=1', viewport: { width: 1280, height: 900 } });
			const action = page.locator('.bui-collection .bui-empty > .bui-empty-actions .bui-button-primary');
			await action.waitFor({ state: 'visible' });
			const found = await page.evaluate(() => {
				const box = document.querySelector('.bui-collection .bui-empty');
				const button = box.querySelector('.bui-empty-actions .bui-button-primary');
				const style = getComputedStyle(box);
				return {
					below: box.getBoundingClientRect().bottom - button.getBoundingClientRect().bottom,
					inset: parseFloat(style.paddingBottom) + parseFloat(style.borderBottomWidth),
					padding: parseFloat(style.paddingBottom),
					token: parseFloat(style.getPropertyValue('--bui-empty-inset')),
					words: button.textContent.trim()
				};
			});
			expect(Math.abs(found.below - found.inset) <= 1, `the action ends one inset above the box's end: ${JSON.stringify(found)}`);
			expect(Math.abs(found.padding - found.token) <= 1, `the box keeps the empty state's inset below its action: ${JSON.stringify(found)}`);
			expect(found.words === (consumer.name === 'dom' ? 'Register application' : 'Registrar aplicación'), `the action is named whole: ${found.words}`);
			await action.click();
			const pressed = await page.evaluate(() => window.fixture.pressed.length);
			expect(pressed === 1, 'pressing the action runs it once');
			await page.close();
		}
	}
];
