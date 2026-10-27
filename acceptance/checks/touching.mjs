import { expect } from '../support/browser.mjs';

/**
 * A notification row on a touch screen (0.41.0, D192), in a real engine, on the main page's notification panel
 * and inbox at 390 and 1440 px with a coarse pointer: every control of a row (Mark as read, the earlier updates'
 * toggle) is a 44 px target that stays inside its own row, so no target reaches the next row or covers its
 * targets, nor another target of its own row; and a row is as tall as it is under a fine pointer unless a
 * target needs more, by its end padding at most. Its one inset is measured by `checks/insets.mjs` with a
 * coarse pointer.
 */
async function rows(browser, consumer, width, coarse) {
	const view = await browser.open(consumer, { viewport: { width, height: 900 }, ...(coarse ? { hasTouch: true, isMobile: true } : {}) });
	const { page } = view;
	await page.evaluate(() => document.fonts.ready);
	await page.locator('.bui-notify > button').click();
	await page.waitForSelector('.bui-notify .bui-disclosure-panel:not([hidden]) .bui-notice');
	await page.waitForSelector('.bui-inbox .bui-notice');
	const found = await page.evaluate(() => {
		const box = node => {
			const { top, bottom, left, right } = node.getBoundingClientRect();
			return { top, bottom, left, right };
		};
		return [...document.querySelectorAll('.bui-notify .bui-disclosure-panel:not([hidden]) .bui-notices, .bui-inbox .bui-notices')].map(list =>
			[...list.querySelectorAll(':scope > .bui-notice')].map(row => ({
				row: box(row),
				inset: parseFloat(getComputedStyle(row).getPropertyValue('--bui-notice-inset')),
				targets: [...row.querySelectorAll('.bui-notice-mark, .bui-notice-toggle')].filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden').map(node => ({ name: node.textContent.trim(), ...box(node) }))
			}))
		);
	});
	await view.context.close();
	return found;
}

const overlaps = (a, b) => a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5 && a.left < b.right - 0.5 && b.left < a.right - 0.5;

export const checks = [
	{
		name: 'notifications: on a touch screen a row\'s 44 px targets stay inside the row, never over the next row\'s, and the row grows only as a target needs (0.41.0, D192)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const width of [390, 1440]) {
				const coarse = await rows(browser, consumer, width, true);
				const fine = await rows(browser, consumer, width, false);
				const at = `${browser.engine} ${width}px`;
				expect(coarse.flat().some(row => row.targets.length), `${at}: the rows hold controls to measure`);
				for (const [list, items] of coarse.entries()) {
					for (const [index, item] of items.entries()) {
						const said = `${at} list ${list} row ${index}: ${JSON.stringify(item)}`;
						for (const target of item.targets) {
							expect(target.bottom - target.top >= 43.5, `${said}: ${target.name} is a 44 px target`);
							expect(target.top >= item.row.top - 0.5 && target.bottom <= item.row.bottom + 0.5 && target.left >= item.row.left - 0.5 && target.right <= item.row.right + 0.5, `${said}: ${target.name} stays inside its row`);
							const others = items.filter((_, other) => other !== index).flatMap(other => [other.row, ...other.targets]);
							expect(!others.some(other => overlaps(target, other)), `${said}: ${target.name} covers no other row`);
							expect(!item.targets.some(other => other !== target && overlaps(target, other)), `${said}: ${target.name} covers no other target of its row`);
						}
						const before = fine[list][index].row;
						const grown = item.row.bottom - item.row.top - (before.bottom - before.top);
						const needed = Math.max(0, 44 + item.inset - (before.bottom - before.top));
						expect(grown <= needed + 0.5, `${said}: it grew ${grown} px where a target needs ${needed}`);
					}
				}
			}
		}
	}
];
