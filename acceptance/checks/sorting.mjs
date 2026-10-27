import { expect } from '../support/browser.mjs';

/**
 * A `DataTable`'s sort buttons in the Tab order only while its header is seen (0.41.0, D187), on the audit page:
 * at 390 px, where the narrow form hides the header from sight, Tab never lands in it and the buttons stay in the
 * accessibility tree; at 1440 px Tab reaches them. Since 0.44.0 the narrow form is sorted from its own line.
 */
/**
 * Where Tab goes from a button placed right before the table's body, after its search: the next stop is the first sort button where the
 * header shows, and never a part of the header where it is hidden. WebKit's Tab passes over buttons and links,
 * as a Mac does without full keyboard access, so there the buttons' own Tab order is what is read.
 */
async function next(page) {
	await page.evaluate(() => {
		const body = document.querySelector('.bui-data-table .bui-data-body');
		const probe = document.createElement('button');
		probe.id = 'sorting-probe';
		probe.textContent = 'Before the rows';
		body.before(probe);
		probe.focus();
	});
	await page.keyboard.press('Tab');
	return page.evaluate(() => {
		const node = document.activeElement;
		const buttons = [...document.querySelectorAll('.bui-data-table thead button')];
		return { head: Boolean(node?.closest('.bui-data-table thead')), first: node === buttons[0], moved: node?.id !== 'sorting-probe', indexes: buttons.map(button => button.tabIndex) };
	});
}

/** The narrow table's sort line, its rows' names and the last state the table reported (0.44.0). */
const read = page =>
	page.evaluate(() => {
		const table = document.querySelector('.bui-data-table');
		const line = table.querySelector('.bui-data-order');
		const select = line.querySelector('select');
		return {
			shown: line.getBoundingClientRect().height > 0,
			value: select.value,
			focused: document.activeElement === select,
			names: [...table.querySelectorAll('tbody tr th')].map(cell => cell.textContent),
			sorted: [...table.querySelectorAll('thead th')].map(cell => cell.getAttribute('aria-sort')),
			reported: window.fixture.log.filter(entry => entry.startsWith('table:')).at(-1) ?? null
		};
	});

export const checks = [
	{
		name: 'table: a narrow DataTable is sorted from its own line above the rows, by keyboard and by touch, reporting what the header reports; the wide header and the line show one order (0.44.0)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer, { file: 'audit.html', viewport: { width: 390, height: 900 } });
			const label = consumer.name === 'dom' ? 'Sort by' : 'Ordenar por';
			const select = page.getByLabel(label, { exact: true });
			await select.waitFor({ state: 'visible' });
			let found = await read(page);
			expect(found.shown && found.value === '', `${browser.engine} 390px: the line shows the product's order: ${JSON.stringify(found)}`);
			// By keyboard: Tab reaches the select from right before the line (WebKit's Tab passes over controls a Mac
			// reaches only with full keyboard access, so there it is focused), and typing chooses an order
			await page.evaluate(() => {
				const probe = document.createElement('button');
				probe.id = 'ordering-probe';
				probe.textContent = 'Before the table';
				document.querySelector('.bui-data-order').before(probe);
				probe.focus();
			});
			await page.keyboard.press('Tab');
			if (browser.engine === 'webkit' && !(await read(page)).focused) await select.focus();
			found = await read(page);
			expect(found.focused, `${browser.engine} 390px: Tab reaches the sort line: ${JSON.stringify(found)}`);
			await page.keyboard.press('KeyN');
			found = await read(page);
			expect(found.value === 'ascending:name' && found.names[0] === 'api' && found.focused, `${browser.engine} 390px: typing chooses the first order by name, the rows follow and the focus stays: ${JSON.stringify(found)}`);
			expect(found.reported === 'table:{"query":"","sort":"name","direction":"ascending","page":1}', `${browser.engine} 390px: it reports the header's shape: ${found.reported}`);
			// The wide header shows the order the line chose, and the line shows the header's
			await page.setViewportSize({ width: 1440, height: 900 });
			await page.waitForFunction(() => document.querySelector('.bui-data-order').getBoundingClientRect().height === 0);
			found = await read(page);
			expect(found.sorted[0] === 'ascending', `${browser.engine} 1440px: the header says the line's order and the line is hidden: ${JSON.stringify(found)}`);
			await page.locator('.bui-data-table thead th').nth(2).locator('button').click();
			await page.setViewportSize({ width: 390, height: 900 });
			await select.waitFor({ state: 'visible' });
			found = await read(page);
			expect(found.value === 'ascending:conversations', `${browser.engine} 390px: the line says the header's order: ${JSON.stringify(found)}`);
			// By touch: a tap reaches the select, whose choice is the platform's own picker
			const touch = await browser.open(consumer, { file: 'audit.html', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
			const control = touch.page.getByLabel(label, { exact: true });
			await control.tap();
			await control.selectOption('descending:conversations');
			found = await read(touch.page);
			expect(found.value === 'descending:conversations' && found.names[0] === 'cache', `${browser.engine} touch: the rows follow the chosen order: ${JSON.stringify(found)}`);
			expect(found.reported === 'table:{"query":"","sort":"conversations","direction":"descending","page":1}', `${browser.engine} touch: it reports the header's shape: ${found.reported}`);
		}
	},
	{
		name: 'table: a narrow DataTable\'s hidden header keeps its sort buttons out of the Tab order; a wide one\'s are reached (0.41.0, D187)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const width of [390, 1440]) {
				const { page } = await browser.open(consumer, { file: 'audit.html', viewport: { width, height: 900 } });
				await page.locator('.bui-data-table thead button').first().waitFor({ state: 'attached' });
				const found = await next(page);
				expect(found.moved, `${width}px: Tab moves on from the button before the table`);
				if (width === 390) {
					expect(!found.head, `${width}px: Tab never lands in the hidden header`);
					const named = await page.locator('.bui-data-table thead button').evaluateAll(buttons => buttons.map(button => [button.getAttribute('tabindex'), button.getAttribute('aria-hidden')]));
					expect(named.every(([index, hidden]) => index === '-1' && hidden === null), `${width}px: the buttons leave the Tab order and stay for assistive technology: ${JSON.stringify(named)}`);
				} else {
					expect(found.indexes.every(index => index === 0), `${width}px: the sort buttons are in the Tab order: ${found.indexes}`);
					// WebKit's Tab passes over buttons as a Mac does without full keyboard access, so only the others are pressed through
					if (browser.engine !== 'webkit') expect(found.first, `${width}px: Tab reaches the first sort button`);
				}
				await page.close();
			}
		}
	}
];
