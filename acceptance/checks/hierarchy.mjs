import { expect, overflow } from '../support/browser.mjs';

const style = (page, selector) => page.locator(selector).first().evaluate(node => {
	const paint = getComputedStyle(node);
	return { size: parseFloat(paint.fontSize), weight: paint.fontWeight, color: paint.color, box: node.getBoundingClientRect().toJSON() };
});

export const checks = [
	{
		name: 'shared hierarchy: Products, notifications and profile align title roles and distinguish section labels in both themes',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const colorScheme of ['light', 'dark']) for (const width of [1440, 390, 320]) {
				const { page, context } = await browser.open(consumer, { file: 'family.html', query: '?family=annotated', viewport: { width, height: 844 }, colorScheme, reducedMotion: 'reduce' });
				try {
					await page.evaluate(() => document.fonts.ready);
					await page.locator('.bui-family-product > button').click();
					const products = await style(page, '.bui-family-product .bui-navmenu-heading');
					const row = await style(page, '.bui-family-product .bui-navmenu-item');
					expect(products.size > row.size && products.weight === '500', 'Products is a recognizable title above regular rows');
					await page.keyboard.press('Escape');
					await page.locator('.bui-family .bui-disclosure-bell').click();
					await page.locator('.bui-notify-title').waitFor();
					const notices = await style(page, '.bui-notify-title');
					expect(notices.size === products.size && notices.weight === products.weight, 'notification and Products titles use the same role');
					await page.keyboard.press('Escape');
					await page.locator('.bui-family-account > button').click();
					const person = await style(page, '.bui-family-name');
					const group = await style(page, '.bui-family-account .bui-navmenu-section:nth-child(2) > .bui-navmenu-heading');
					expect(person.size === products.size && person.weight === products.weight, 'the account identity shares the title role');
					expect(group.size < person.size && group.color !== person.color, 'section labels stay quieter than the identity');
					const menu = await page.locator('.bui-family-account .bui-navmenu-panel').boundingBox();
					expect(menu.x >= 0 && menu.x + menu.width <= width + 1, 'profile remains in the viewport');
				} finally { await context.close(); }
			}
		}
	},
	{
		name: 'shared hierarchy: Unavailable keeps a compact icon beside its heading and aligned readable body and actions at narrow widths',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			for (const colorScheme of ['light', 'dark']) for (const width of [1440, 390, 320]) {
				const { page, context } = await browser.open(consumer, { file: 'family.html', viewport: { width, height: 844 }, colorScheme, reducedMotion: 'reduce' });
				try {
					const card = page.locator('.bui-unavailable');
					await card.scrollIntoViewIfNeeded();
					const title = await style(page, '.bui-unavailable-title');
					const body = await style(page, '.bui-unavailable-reason');
					const icon = await style(page, '.bui-unavailable-icon');
					const actions = await style(page, '.bui-unavailable-actions');
					expect(title.size > body.size && title.weight === '500' && body.weight === '400', 'the heading has clear hierarchy above the body');
					expect(title.color === body.color, 'the title keeps the readable text contrast');
					expect(Math.abs(title.box.left - body.box.left) < 1 && Math.abs(title.box.left - actions.box.left) < 1, 'body and action align with the heading');
					expect(title.box.left - icon.box.right <= 12.5 && title.box.left >= icon.box.right, 'the icon sits close to the heading');
					expect(Math.abs(icon.box.top + icon.box.height / 2 - (title.box.top + 19 * 1.4 / 2)) <= 2, 'icon aligns with the first heading line');
					expect(!(await overflow(page)), 'the wrapped card does not widen the page');
				} finally { await context.close(); }
			}
		}
	}
];
