import { expect } from '../support/browser.mjs';

/**
 * A notification row on a touch screen (0.41.0, D192), in a real engine, on the main page's notification panel
 * and inbox at 390 and 1440 px with a coarse pointer: every control of a row (Mark as read, the earlier updates'
 * toggle) is a 44 px target inside its own row that covers none of the row's words, which open its matter
 * (D79), no other target of its row and nothing of the next row; and a row grows over its fine-pointer height
 * by no more than its targets need beyond their lines. Its inset is measured by `checks/insets.mjs` with a
 * coarse pointer: one inset at its top and sides, the target's room below a control's words.
 */
/**
 * Each list's rows: the row's box, its targets and its own words, and what a press on those words reaches, swept
 * with `elementFromPoint` along each line of words with the row in view: never a target of the row (D79).
 */
const measure = selector => {
	const box = node => {
		const { top, bottom, left, right } = node.getBoundingClientRect();
		return { top, bottom, left, right };
	};
	/** The row's own words, outside its controls and its earlier updates: what a press opens the matter by. */
	const words = row => {
		const found = [];
		const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
		for (let text = walker.nextNode(); text; text = walker.nextNode()) {
			const parent = text.parentElement;
			if (!text.textContent.trim() || parent.closest('.bui-notice-mark, .bui-notice-toggle, .bui-notice-earlier, .bui-hidden') || parent.closest('.bui-notice') !== row) continue;
			const range = document.createRange();
			range.selectNodeContents(text);
			found.push(...[...range.getClientRects()].map(({ top, bottom, left, right }) => ({ top, bottom, left, right, text: text.textContent.trim().slice(0, 20) })));
		}
		return found;
	};
	/** What a press along each line of words reaches that is a target. */
	const pressed = lines =>
		lines.flatMap(line =>
			[0.1, 0.3, 0.5, 0.7, 0.9].flatMap(at => {
				const hit = document.elementFromPoint(line.left + (line.right - line.left) * at, (line.top + line.bottom) / 2);
				return hit?.closest('.bui-notice-mark, .bui-notice-toggle') ? [`${line.text} → ${hit.textContent.trim()}`] : [];
			})
		);
	const lists = [...document.querySelectorAll(selector)].map(list => [...list.querySelectorAll(':scope > .bui-notice')]);
	// Every box first, in one scroll position, so rows compare; then each row in view for the press sweep
	const found = lists.map(list =>
		list.map(row => ({
			row: box(row),
			inset: parseFloat(getComputedStyle(row).getPropertyValue('--bui-notice-inset')),
			targets: [...row.querySelectorAll(':scope > .bui-notice-text > .bui-notice-meta > .bui-notice-mark, :scope > .bui-notice-text > .bui-notice-toggle')].filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden').map(node => ({ name: node.textContent.trim(), line: parseFloat(getComputedStyle(node).lineHeight), ...box(node) })),
			words: words(row)
		}))
	);
	lists.forEach((list, at) =>
		list.forEach((row, index) => {
			if (!row.getClientRects().length) return void (found[at][index].pressed = []);
			row.scrollIntoView({ block: 'center' });
			found[at][index].pressed = pressed(words(row));
		})
	);
	return found;
};

async function rows(browser, consumer, width, coarse) {
	const view = await browser.open(consumer, { viewport: { width, height: 900 }, ...(coarse ? { hasTouch: true, isMobile: true } : {}) });
	const { page } = view;
	await page.evaluate(() => document.fonts.ready);
	await page.locator('.bui-notify > button').click();
	await page.waitForSelector('.bui-notify .bui-disclosure-panel:not([hidden]) .bui-notice');
	await page.waitForSelector('.bui-inbox .bui-notice');
	// The panel's rows while it is open, then the inbox's once it is closed, so nothing of one covers the other
	const panel = await page.evaluate(measure, '.bui-notify .bui-disclosure-panel:not([hidden]) .bui-notices');
	await page.keyboard.press('Escape');
	await page.waitForFunction(() => !document.querySelector('.bui-notify .bui-disclosure-panel:not([hidden])'));
	const inbox = await page.evaluate(measure, '.bui-inbox .bui-notices');
	const found = [...panel, ...inbox];
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
							const covered = item.words.filter(word => overlaps(target, word));
							expect(!covered.length, `${said}: ${target.name} covers none of the row's words, which open the matter: ${JSON.stringify(covered)}`);
						}
						expect(!item.pressed.length, `${said}: a press on the row's words opens the matter, never a target: ${item.pressed.join(' | ')}`);
						const before = fine[list][index].row;
						const grown = item.row.bottom - item.row.top - (before.bottom - before.top);
						const needed = item.targets.reduce((sum, target) => sum + Math.max(0, 44 - target.line), 0);
						expect(grown <= needed + 0.5, `${said}: it grew ${grown} px where its targets need ${needed}`);
					}
				}
			}
		}
	}
];
