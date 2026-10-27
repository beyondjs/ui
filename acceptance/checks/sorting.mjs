import { expect } from '../support/browser.mjs';

/**
 * A `DataTable`'s sort buttons in the Tab order only while its header is seen (0.41.0, D187), on the audit page:
 * at 390 px, where the narrow form hides the header from sight, Tab never lands in it and the buttons stay in the
 * accessibility tree; at 1440 px Tab reaches them. Also after a sort redraws the table.
 */
async function walk(page) {
	await page.evaluate(() => document.activeElement?.blur());
	await page.locator('body').focus().catch(() => undefined);
	const reached = [];
	for (let step = 0; step < 150; step++) {
		await page.keyboard.press('Tab');
		const at = await page.evaluate(() => {
			const node = document.activeElement;
			return { head: Boolean(node?.closest('.bui-data-table thead')), body: Boolean(node?.closest('.bui-data-table tbody')) };
		});
		reached.push(at);
		// Past the header (a row, or a control after the table): what follows is not the header's
		if (at.body || (reached.some(item => item.head) && !at.head)) break;
	}
	return reached;
}

export const checks = [
	{
		name: 'table: a narrow DataTable\'s hidden header keeps its sort buttons out of the Tab order; a wide one\'s are reached (0.41.0, D187)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const width of [390, 1440]) {
				const { page } = await browser.open(consumer, { file: 'audit.html', viewport: { width, height: 900 } });
				await page.locator('.bui-data-table thead button').first().waitFor({ state: 'attached' });
				const reached = await walk(page);
				const head = reached.filter(at => at.head).length;
				if (width === 390) {
					expect(head === 0, `${width}px: Tab never lands in the hidden header (${head} times)`);
					const named = await page.locator('.bui-data-table thead button').evaluateAll(buttons => buttons.map(button => [button.getAttribute('tabindex'), button.getAttribute('aria-hidden')]));
					expect(named.every(([index, hidden]) => index === '-1' && hidden === null), `${width}px: the buttons leave the Tab order and stay for assistive technology: ${JSON.stringify(named)}`);
				} else expect(head > 0, `${width}px: Tab reaches the sort buttons`);
				await page.close();
			}
		}
	}
];
