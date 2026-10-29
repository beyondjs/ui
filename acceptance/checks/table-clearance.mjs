import { expect, overflow } from '../support/browser.mjs';

/** Reads painted menu bounds against the metadata line, including React's product-owned portal. */
export class TableClearance {
	/** Captures actual target and following-value rectangles in both menu compositions. */
	static async measure(page) {
		return page.locator('.bui-data tbody tr').evaluateAll(rows => rows.map(row => {
			const button = row.querySelector('.bui-menu-button')?.getBoundingClientRect();
			const name = row.querySelector('th').getBoundingClientRect();
			const values = [...row.querySelectorAll('td:not(.bui-data-menu)')].map(cell => cell.getBoundingClientRect()).filter(box => box.height);
			const box = row.getBoundingClientRect();
			return { id: row.dataset.key, mode: row.closest('#native, #column').id, name: { top: name.top, bottom: name.bottom }, button: button ? { top: button.top, bottom: button.bottom, height: button.height, right: button.right } : null, below: Math.min(...values.map(value => value.top)), row: { top: box.top, bottom: box.bottom, right: box.right } };
		}));
	}
}

export const checks = [{
	name: 'table menu clearance: metadata follows the full target in framed mobile rows',
	consumers: ['dom', 'react19', 'react18'],
	async run(browser, consumer) {
		for (const width of [320, 390]) for (const hasTouch of [false, true]) for (const colorScheme of ['light', 'dark']) {
			const { page, context } = await browser.open(consumer, { file: 'table-clearance.html', viewport: { width, height: 1000 }, hasTouch, colorScheme });
			await page.evaluate(() => document.fonts.ready);
			const found = await TableClearance.measure(page);
			const at = `${browser.engine}/${consumer.name}/${width}/${hasTouch ? 'coarse' : 'fine'}/${colorScheme}`;
			expect(found.length === 8 && found.filter(row => row.button).length === 6, `${at}: both menu APIs and empty rows are present`);
			for (const row of found.filter(item => item.button)) {
				expect(row.below >= row.button.bottom - 0.5, `${at}: metadata overlaps the menu: ${JSON.stringify(row)}`);
				expect(Math.abs((row.button.top + row.button.bottom - row.name.top - row.name.bottom) / 2) <= 2, `${at}: menu remains centred beside the name: ${JSON.stringify(row)}`);
				expect(row.button.top >= row.row.top - 0.5 && row.button.bottom <= row.row.bottom + 0.5 && row.button.right <= row.row.right + 0.5, `${at}: menu remains inside the row: ${JSON.stringify(row)}`);
				expect(row.button.height >= (hasTouch ? 44 : 24), `${at}: target remains usable: ${JSON.stringify(row)}`);
			}
			expect(!(await overflow(page)), `${at}: no horizontal overflow`);
			for (const mode of ['native', 'column']) {
				const button = page.locator(`#${mode} .bui-menu-button`).first();
				await button.focus();
				if (hasTouch) await button.tap(); else await button.press('Enter');
				await page.getByRole('menuitem', { name: 'Open Sam Example', exact: true }).click();
				expect(await page.evaluate(() => window.fixture.chosen) === 'sam', `${at}: ${mode} menu acts independently`);
				await page.evaluate(() => { window.fixture.chosen = null; });
			}
			await context.close();
		}
	}
}];
