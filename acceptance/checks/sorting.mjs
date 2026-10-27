import { expect } from '../support/browser.mjs';

/**
 * A `DataTable`'s sort buttons in the Tab order only while its header is seen (0.41.0, D187), on the audit page:
 * at 390 px, where the narrow form hides the header from sight, Tab never lands in it and the buttons stay in the
 * accessibility tree; at 1440 px Tab reaches them.
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

export const checks = [
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
