import { expect } from '../support/browser.mjs';

/**
 * A `DataTable`'s row menus (0.44.0, L6), on the audit page: a column of its own at the rows' end, its button on the
 * table's content edge. With a fine pointer a row's menu is seen only where the pointer rests or the focus is, and
 * the keyboard opens it and chooses; on a touch screen it is always seen and a tap opens it. On a narrow table it
 * stays beside the row's name, centred on the name's line, inside the row, the values below; a row with no actions
 * draws none. With `?menu=column` the menus come from a column of the product's own (0.43.0's `menu: true`), which is
 * drawn as the same one menu column, its header's name kept in sight on a wide table.
 */
const menus = page =>
	page.evaluate(() => {
		const rows = [...document.querySelectorAll('.bui-data-table tbody tr')];
		return rows.map(row => {
			const holder = row.querySelector('.bui-data-menu .bui-menu-holder');
			const name = row.querySelector('th').getBoundingClientRect();
			const box = row.getBoundingClientRect();
			const button = holder?.querySelector('.bui-menu-button').getBoundingClientRect() ?? null;
			const values = [...row.querySelectorAll('td:not(.bui-data-menu)')].filter(cell => cell.getBoundingClientRect().height > 0).map(cell => cell.getBoundingClientRect().top);
			return { name: row.querySelector('th').textContent, label: holder?.querySelector('.bui-menu-button').getAttribute('aria-label') ?? null, opacity: holder ? Number(getComputedStyle(holder).opacity) : null, button: button && { top: button.top, bottom: button.bottom, right: button.right, middle: (button.top + button.bottom) / 2 }, line: (name.top + name.bottom) / 2, row: { top: box.top, bottom: box.bottom }, below: values.length ? Math.min(...values) : null, nameBottom: name.bottom };
		});
	});

/** Where the table's words end: the content edge of its body. */
const edge = page =>
	page.evaluate(() => {
		const body = document.querySelector('.bui-data-table .bui-data-body');
		return body.getBoundingClientRect().right - parseFloat(getComputedStyle(body).paddingRight);
	});

export const checks = [
	{
		name: 'table: a DataTable\'s row menus in a column of their own, seen where the pointer or the focus is, opened by keyboard, always seen and tapped on touch, beside the name on a narrow table, from menu(row) or a column of the product\'s own (0.43.0, 0.44.0, L6)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const spanish = consumer.name !== 'dom';
			const more = spanish ? 'Más acciones de web' : 'More actions for web';
			for (const query of ['', '?menu=column']) for (const width of [1440, 390]) {
				const at = `${browser.engine} ${width}px${query}`;
				const { page } = await browser.open(consumer, { file: 'audit.html', query, viewport: { width, height: 900 } });
				if (query && width === 1440) {
					const head = await page.locator('.bui-data-table thead th').last().evaluate(cell => ({ text: cell.textContent, width: cell.getBoundingClientRect().width }));
					expect(head.text === (spanish ? 'Acciones' : 'Actions') && head.width > 0, `${at}: a product's menu column keeps its header in sight: ${JSON.stringify(head)}`);
				}
				await page.mouse.move(0, 0);
				let found = await menus(page);
				const right = await edge(page);
				expect(found.length === 6 && found.filter(row => row.label).length === 5, `${at}: each row with actions has its menu: ${JSON.stringify(found.map(row => row.label))}`);
				expect(found.find(row => row.name === 'lab').label === null, `${at}: a busy machine, with no action, draws none`);
				expect(found.filter(row => row.label).every(row => row.opacity === 0), `${at}: at rest the menus are not seen: ${JSON.stringify(found.map(row => row.opacity))}`);
				const first = found[0];
				expect(Math.abs(first.button.right - right) <= 1, `${at}: the button ends on the table's content edge: ${JSON.stringify({ button: first.button, right })}`);
				if (width === 390) {
					for (const row of found.filter(item => item.button)) {
						expect(Math.abs(row.button.middle - row.line) <= 2, `${at}: ${row.name}'s menu is centred on its name's line: ${JSON.stringify(row)}`);
						expect(row.button.top >= row.row.top - 0.5 && row.button.bottom <= row.row.bottom + 0.5, `${at}: ${row.name}'s menu stays inside its row: ${JSON.stringify(row)}`);
						expect(row.below === null || row.below >= row.nameBottom - 0.5, `${at}: ${row.name}'s values are below its name: ${JSON.stringify(row)}`);
					}
				}
				await page.locator('.bui-data-table tbody tr').first().hover();
				found = await menus(page);
				expect(found[0].opacity === 1 && found[2].opacity === 0, `${at}: the row the pointer rests on shows its menu, alone: ${JSON.stringify(found.map(row => row.opacity))}`);
				await page.mouse.move(0, 0);
				// By keyboard: the focus shows it, Enter opens it, the arrows and Enter choose
				const button = page.locator('.bui-data-table').getByRole('button', { name: more, exact: true });
				await button.focus();
				found = await menus(page);
				expect(found[0].opacity === 1, `${at}: the focus shows the menu: ${found[0].opacity}`);
				await page.keyboard.press('Enter');
				await page.locator('.bui-menu:not([hidden]) [role="menuitem"]').first().waitFor({ state: 'visible' });
				await page.keyboard.press('ArrowDown');
				await page.keyboard.press('Enter');
				const log = await page.evaluate(() => window.fixture.log.at(-1));
				expect(log === 'delete:m0', `${at}: the keyboard chose the second action: ${log}`);
			}
			// A touch screen always shows the menus, and a tap opens one
			for (const query of ['', '?menu=column']) {
				const { page } = await browser.open(consumer, { file: 'audit.html', query, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
				const found = await menus(page);
				expect(found.filter(row => row.label).every(row => row.opacity === 1), `${browser.engine} touch${query}: every menu is seen: ${JSON.stringify(found.map(row => row.opacity))}`);
				await page.locator('.bui-data-table').getByRole('button', { name: more, exact: true }).tap();
				const item = page.locator('.bui-menu:not([hidden]) [role="menuitem"]').first();
				await item.waitFor({ state: 'visible' });
				await item.tap();
				const log = await page.evaluate(() => window.fixture.log.at(-1));
				expect(log === 'rename:m0', `${browser.engine} touch${query}: a tap chose the first action: ${log}`);
			}
		}
	}
];
