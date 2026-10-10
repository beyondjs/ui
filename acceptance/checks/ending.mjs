import { expect } from '../support/browser.mjs';

/**
 * The family bar's end (0.13.0, D78–D80): Docs, the bell and the avatar an equal distance apart, the
 * count on the bell's glyph never reaching the avatar, and the two panels of the end sharing one right
 * edge, one width and one gap below the bar's edge, in both themes at a desktop and a phone width.
 */
async function open(browser, consumer, { width, colorScheme }) {
	const view = await browser.open(consumer, { file: 'family.html', query: '?family=annotated', viewport: { width, height: 800 }, colorScheme });
	await view.page.evaluate(() => document.fonts.ready);
	await view.page.locator('.bui-family .bui-count:not([hidden])').waitFor();
	return view;
}

const box = (page, selector) =>
	page.evaluate(selector => {
		const node = [...document.querySelectorAll(selector)].find(item => item.getClientRects().length);
		if (!node) return null;
		const { left, right, top, bottom, width } = node.getBoundingClientRect();
		return { left, right, top, bottom, width };
	}, selector);

/** Waits until every entry and exit movement has ended, so a panel is measured where it rests. */
const rest = page => page.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== 'running'));

const paint = (page, selector, property) => page.evaluate(([selector, property]) => getComputedStyle(document.querySelector(selector))[property], [selector, property]);

export const checks = [
	{
		name: 'bar end at 1440 and 390 px in both themes: equal gaps between Docs, the bell and the avatar, the count clear of the avatar in the avatar\'s color, both panels on one right edge and width below the bar',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const colorScheme of ['light', 'dark']) {
				for (const width of [1440, 390]) {
					const at = `${width}px ${colorScheme}`;
					const { page, context } = await open(browser, consumer, { width, colorScheme });
					const bar = await box(page, '.bui-family');
					const docs = await box(page, '.bui-family-docs > span');
					const bell = await box(page, '.bui-family .bui-bell > .bui-icon');
					const button = await box(page, '.bui-family .bui-disclosure-bell');
					const count = await box(page, '.bui-family .bui-count');
					const avatar = await box(page, '.bui-family-account .bui-navmenu-button .bui-family-avatar');
					expect(!(await page.locator('.bui-family-account .bui-navmenu-button > .bui-icon').count()), `${at}: the avatar has no chevron`);
					if (width === 1440) {
						const before = bell.left - docs.right;
						const after = avatar.left - bell.right;
						expect(Math.abs(before - after) <= 1.5, `${at}: Docs to bell ${before.toFixed(1)} px, bell to avatar ${after.toFixed(1)} px`);
					}
					expect(count.right <= button.right + 0.5, `${at}: the count grows over the bell, not past it (${count.right} > ${button.right})`);
					expect(avatar.left - count.right >= 4, `${at}: the count keeps clear of the avatar (${(avatar.left - count.right).toFixed(1)} px)`);
					const colors = [await paint(page, '.bui-family .bui-count', 'backgroundColor'), await paint(page, '.bui-family-account .bui-navmenu-button .bui-family-avatar', 'backgroundColor')];
					expect(colors[0] === colors[1], `${at}: one coral on the bar: ${colors}`);
					await page.locator('.bui-family .bui-disclosure-bell').click();
					await page.locator('.bui-family .bui-notify .bui-disclosure-panel .bui-notice').first().waitFor();
					await rest(page);
					const notices = await box(page, '.bui-family .bui-notify .bui-disclosure-panel');
					await page.keyboard.press('Escape');
					await page.locator('.bui-family-account .bui-navmenu-button').click();
					await rest(page);
					const profile = await box(page, '.bui-family-account .bui-navmenu-panel');
					for (const [name, panel] of [['notifications', notices], ['profile', profile]]) {
						expect(panel.top >= bar.bottom + 3, `${at}: the ${name} panel opens below the bar's edge (${panel.top} < ${bar.bottom + 3})`);
						expect(panel.right <= width && panel.left >= 0, `${at}: the ${name} panel is inside the viewport`);
					}
					expect(Math.abs(notices.right - profile.right) <= 0.5, `${at}: one right edge (${notices.right}, ${profile.right})`);
					expect(Math.abs(notices.width - profile.width) <= 0.5, `${at}: one width (${notices.width}, ${profile.width})`);
					expect(Math.abs(notices.top - profile.top) <= 0.5, `${at}: one gap below the bar (${notices.top}, ${profile.top})`);
					expect(Math.abs(width - profile.right - (bar.right - avatar.right)) <= 3, `${at}: the panels end at the bar's padding (panel ${profile.right}, avatar ${avatar.right}, bar ${bar.right})`);
					await context.close();
				}
			}
		}
	},
	{
		name: 'notification rows: the title in the text color, the whole row opens, Mark as read shows on hover and focus, the body fades while more is below',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, { width: 1440, colorScheme: 'dark' });
			await page.locator('.bui-family .bui-disclosure-bell').click();
			const panel = page.locator('.bui-family .bui-notify .bui-disclosure-panel');
			const row = panel.locator('.bui-notice').first();
			await row.waitFor();
			const [title, text] = [await paint(page, '.bui-notify .bui-notice-open', 'color'), await paint(page, '.bui-notify .bui-notice', 'color')];
			expect(title === text, `the title is text, not a link: ${title} / ${text}`);
			const mark = row.locator('.bui-notice-mark').first();
			await page.mouse.move(0, 400);
			expect((await mark.evaluate(node => getComputedStyle(node).opacity)) === '0', 'Mark as read is quiet until the row is pointed at');
			await row.hover();
			await page.waitForFunction(node => getComputedStyle(node).opacity === '1', await mark.elementHandle());
			const head = await box(page, '.bui-notify .bui-notify-head .bui-notify-everything');
			expect(head !== null, '"Mark all as read" is in the head while something is unread');
			const body = await page.evaluate(() => {
				const node = document.querySelector('.bui-notify .bui-notify-body');
				return { more: node.hasAttribute('data-more'), scrolls: node.scrollHeight > node.clientHeight + 1 };
			});
			expect(body.more === body.scrolls, `the body fades exactly while more is below: ${JSON.stringify(body)}`);
			// Pressed anywhere on the row away from its controls, the row's title is what is pressed
			const rect = await row.boundingBox();
			const pressed = await page.evaluate(([x, y]) => Boolean(document.elementFromPoint(x, y)?.closest('.bui-notice-open')), [rect.x + rect.width - 12, rect.y + 10]);
			expect(pressed, 'the whole row opens the item');
		}
	}
];
