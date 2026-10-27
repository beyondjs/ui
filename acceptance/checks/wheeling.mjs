import { expect } from '../support/browser.mjs';

/**
 * The wheel over a panel kept in view (`PagePanel`, 0.44.0), on the `conversation.html` pages at 1440 px: over
 * a panel whose content fits, the wheel scrolls the page, since a scroll container that contains its
 * overscroll keeps Chrome's page still under the pointer even with nothing to scroll; over a panel that
 * scrolls (one holding a tall block more), the wheel scrolls the panel and leaves the page where it is, and
 * once the panel has nothing left to scroll the next wheel goes on to the page.
 */
async function open(browser, consumer, height) {
	const view = await browser.open(consumer, { file: 'conversation.html', viewport: { width: 1440, height } });
	await view.page.waitForSelector('.bui-page-panel .facts');
	await view.page.evaluate(() => document.fonts.ready);
	return view;
}

/** The page's scroll, the panel's own and how much it holds beyond its box */
const read = page =>
	page.evaluate(() => {
		const panel = document.querySelector('.bui-page-panel');
		const box = panel.getBoundingClientRect();
		return { y: scrollY, top: panel.scrollTop, room: panel.scrollHeight - panel.clientHeight, x: box.left + box.width / 2, middle: box.top + Math.min(box.height, innerHeight - box.top) / 2, contain: getComputedStyle(panel).overscrollBehaviorY };
	});

/** Whether `test` holds within the bound, read again on every frame */
const settles = (page, test, arg) => page.waitForFunction(test, arg, { timeout: 3000 }).then(() => true, () => false);

export const checks = [
	{
		name: 'page panel and the wheel (0.44.0): over a panel that fits it scrolls the page; over one that scrolls it scrolls the panel, then the page once the panel is at its end',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const fits = await open(browser, consumer, 900);
			const before = await read(fits.page);
			expect(before.room <= 0, `900 px: the panel's content fits: ${JSON.stringify(before)}`);
			await fits.page.mouse.move(before.x, before.middle);
			await fits.page.mouse.wheel(0, 300);
			const scrolled = await settles(fits.page, y => scrollY > y + 50, before.y);
			expect(scrolled, `900 px, a panel that fits: the wheel over it scrolls the page from ${before.y}px (overscroll ${before.contain}, now ${(await read(fits.page)).y}px)`);
			await fits.context.close();

			const tall = await open(browser, consumer, 900);
			// More than the window holds, so the panel scrolls itself
			await tall.page.evaluate(() => document.querySelector('.bui-page-panel').append(Object.assign(document.createElement('div'), { style: 'height: 1600px' })));
			const start = await read(tall.page);
			expect(start.room > 40, `a tall panel holds more than it shows: ${JSON.stringify(start)}`);
			await tall.page.mouse.move(start.x, start.middle);
			await tall.page.mouse.wheel(0, 40);
			expect(await settles(tall.page, () => document.querySelector('.bui-page-panel').scrollTop > 0), `a panel that scrolls: the wheel over it scrolls it: ${JSON.stringify(await read(tall.page))}`);
			const inside = await read(tall.page);
			expect(inside.y === start.y, `a panel that scrolls: the page stays while the panel scrolls: ${start.y} → ${inside.y}`);
			await tall.page.evaluate(() => {
				const panel = document.querySelector('.bui-page-panel');
				panel.scrollTop = panel.scrollHeight;
			});
			// A new gesture once the panel is at its end: engines latch a wheel gesture to the box it started in, Firefox
			// for its wheel transaction (1.5 s since the last wheel event, `mousewheel.transaction.timeout`)
			await tall.page.waitForTimeout(1700);
			const end = await read(tall.page);
			await tall.page.mouse.wheel(0, 300);
			expect(await settles(tall.page, y => scrollY > y + 50, end.y), `a panel that scrolls, at its end: the next wheel scrolls the page from ${end.y}px (overscroll ${end.contain}, now ${(await read(tall.page)).y}px)`);
			await tall.context.close();
		}
	}
];
