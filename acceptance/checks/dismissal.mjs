import { expect } from '../support/browser.mjs';

/** Every sheet dismisses by default; complete backdrop gestures close once, retaining modal isolation. */
export const checks = [{
	name: 'sheet: default backdrop, inside padding, drags, busy, focus and repeated opening',
	consumers: ['dom', 'react19', 'react18'],
	async run(browser, consumer) {
		for (const colorScheme of ['light', 'dark']) {
			const { page, context } = await browser.open(consumer, { file: 'choosing.html', viewport: { width: 1440, height: 900 }, colorScheme, hasTouch: colorScheme === 'dark', reducedMotion: colorScheme === 'dark' ? 'reduce' : 'no-preference' });
			const opener = page.locator('#sheeting > .bui-button');
			const sheet = page.locator('dialog.bui-sheet[open]');
			await opener.click();
			await sheet.waitFor();
			// Wait on entry geometry before measuring the backdrop, including normal motion.
			await sheet.evaluate(async node => { await Promise.all(node.getAnimations().map(animation => animation.finished)); });
			const box = await sheet.boundingBox();
			const outside = { x: box.x / 2, y: 300 };
			const inside = { x: box.x + 2, y: 300 };
			await page.mouse.click(inside.x, inside.y);
			expect(await sheet.isVisible(), 'padding stays inside');
			for (const [start, end] of [[inside, outside], [outside, inside]]) {
				await page.mouse.move(start.x, start.y); await page.mouse.down();
				await page.mouse.move(end.x, end.y); await page.mouse.up();
				expect(await sheet.isVisible(), 'cross-boundary drag stays open');
			}
			const work = sheet.locator('.bui-sheet-actions .bui-button-primary');
			await work.click();
			await page.mouse.click(outside.x, outside.y);
			await page.keyboard.press('Escape');
			await sheet.locator('.bui-sheet-close').click({ force: true });
			expect(await sheet.isVisible(), 'busy ignores every dismissal');
			await work.click();
			if (colorScheme === 'dark') await page.touchscreen.tap(outside.x, outside.y);
			else await page.mouse.click(outside.x, outside.y);
			await sheet.waitFor({ state: 'hidden' });
			expect(await opener.evaluate(node => node === document.activeElement), 'focus returns to opener');
			expect(await page.evaluate(() => window.fixture.log.filter(item => item === 'sheet:null').length) === 1, 'one dismissal notification');
			for (const kind of ['escape', 'close']) {
				await opener.click(); await sheet.waitFor();
				if (kind === 'escape') await page.keyboard.press('Escape');
				else await sheet.locator('.bui-sheet-close').click();
				await sheet.waitFor({ state: 'hidden' });
				expect(await opener.evaluate(node => node === document.activeElement), `${kind} returns focus`);
			}
			expect(await page.evaluate(() => document.documentElement.style.overflow) === '', 'scroll lock released');
			await context.close();
		}
	}
}];
