import { expect } from '../support/browser.mjs';
import { open, words } from './diffing.mjs';

/**
 * The diff's behavior in a real engine (0.11.2), registered through `diffing.mjs`: real keys (Tab to the
 * first file's header, ArrowDown between files, `]` and `[` between hunks, Enter folding and opening,
 * Alt+ArrowDown from inside the lines), the list of files moving focus to a file, the large file's Show
 * drawing in chunks while the page keeps answering, no chevron motion under reduced motion, and Copy path
 * saying it copied in place.
 */
const active = page => page.evaluate(() => {
	const node = document.activeElement;
	return { file: node?.closest('.bui-diff-file')?.dataset.path ?? null, kind: node?.classList.contains('bui-diff-toggle') ? 'header' : node?.classList.contains('bui-diff-hunk') ? 'hunk' : (node?.className ?? ''), text: node?.textContent.slice(0, 60) ?? '' };
});

export const checks = [
	{
		name: 'diff keyboard: Tab reaches the first header, ArrowDown the next, ] and [ the hunks, Enter folds and opens, Alt+ArrowDown from the lines',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer);
			const tab = browser.engine === 'webkit' ? 'Alt+Tab' : 'Tab';
			let found = null;
			for (let count = 0; count < 20; count += 1) {
				await page.keyboard.press(tab);
				found = await active(page);
				if (found.kind === 'header') break;
			}
			expect(found.kind === 'header' && found.file === 'src/checkout/redirect.js', `Tab reaches the first header: ${JSON.stringify(found)}`);
			await page.keyboard.press(']');
			found = await active(page);
			expect(found.kind === 'hunk' && found.text.startsWith('@@ -1,5 +1,6 @@'), `] to the first hunk: ${JSON.stringify(found)}`);
			await page.keyboard.press(']');
			await page.keyboard.press(']');
			found = await active(page);
			expect(found.kind === 'hunk' && found.text.startsWith('@@ -90,3 +91,4 @@'), `] to the third hunk: ${JSON.stringify(found)}`);
			await page.keyboard.press('[');
			found = await active(page);
			expect(found.text.startsWith('@@ -40,16 +41,16 @@'), `[ back: ${JSON.stringify(found)}`);
			await page.keyboard.press('Alt+ArrowUp');
			found = await active(page);
			expect(found.kind === 'header' && found.file === 'src/checkout/redirect.js', `Alt+ArrowUp to its file's header: ${JSON.stringify(found)}`);
			await page.keyboard.press('ArrowDown');
			found = await active(page);
			expect(found.kind === 'header' && found.file === 'src/pay/total.js', `ArrowDown to the next header: ${JSON.stringify(found)}`);
			const header = page.locator('.bui-diff-file[data-path="src/pay/total.js"] .bui-diff-toggle');
			await page.keyboard.press('Enter');
			expect((await header.getAttribute('aria-expanded')) === 'false', 'Enter folds');
			await page.keyboard.press('Enter');
			expect((await header.getAttribute('aria-expanded')) === 'true', 'Enter opens');
			await page.keyboard.press('End');
			found = await active(page);
			expect(found.file === 'fixtures/orders.csv', `End to the last header: ${JSON.stringify(found)}`);
			await page.locator('.bui-diff-file[data-path="src/pay/total.js"] .bui-diff-lines').focus();
			await page.keyboard.press('Alt+ArrowDown');
			found = await active(page);
			expect(found.kind === 'header' && found.file === 'public/receipt.png', `Alt+ArrowDown from the lines: ${JSON.stringify(found)}`);
			const describe = await page.evaluate(() => document.getElementById(document.querySelector('.bui-diff').getAttribute('aria-describedby'))?.textContent);
			expect(describe?.includes(']'), `the keys are described once on the diff: ${describe}`);
		}
	},
	{
		name: 'diff list of files: from four files, a press opens a folded file, brings it into view and moves focus to its header; twelve files at 320 px',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			const { page } = await open(browser, consumer, { width: 390, height: 700 });
			const nav = page.locator('nav.bui-diff-jump');
			expect((await nav.getAttribute('aria-label')) === copy.jump, 'the list is named');
			await nav.locator('button', { hasText: 'orders.csv' }).click();
			await page.waitForFunction(() => document.activeElement?.closest('.bui-diff-file')?.dataset.path === 'fixtures/orders.csv');
			const file = page.locator('.bui-diff-file[data-path="fixtures/orders.csv"]');
			expect(await file.evaluate(node => node.hasAttribute('data-open')), 'the large file opened');
			await page.waitForFunction(() => {
				const box = document.querySelector('.bui-diff-file[data-path="fixtures/orders.csv"] .bui-diff-toggle').getBoundingClientRect();
				return box.top >= 0 && box.bottom <= innerHeight;
			});
			const many = await open(browser, consumer, { width: 320, query: '?patch=many' });
			const items = await many.page.locator('.bui-diff-jump-item').count();
			expect(items === 12, `twelve files listed: ${items}`);
			expect(!(await many.page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), '320 px without sideways scroll');
			await many.page.locator('.bui-diff-jump-item').last().focus();
			await many.page.keyboard.press('Enter');
			await many.page.waitForFunction(() => document.activeElement?.closest('.bui-diff-file')?.dataset.path === 'src/parts/part-12.js');
		}
	},
	{
		name: 'diff large file: folded first, "Large diff" with Show, rows drawn in chunks while the page keeps answering, no page error',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			const { page } = await open(browser, consumer);
			const file = page.locator('.bui-diff-file[data-path="fixtures/orders.csv"]');
			expect(!(await file.evaluate(node => node.hasAttribute('data-open'))) && (await file.locator('.bui-diff-line').count()) === 0, 'folded with no lines');
			await file.locator('.bui-diff-toggle').click();
			const large = file.locator('.bui-diff-large');
			expect((await large.locator('span').first().textContent()) === copy.large, `the large line: ${await large.textContent()}`);
			const drawn = await page.evaluate(async () => {
				const show = document.querySelector('.bui-diff-file[data-path="fixtures/orders.csv"] .bui-diff-large button');
				show.click();
				const rows = () => document.querySelector('.bui-diff-file[data-path="fixtures/orders.csv"] .bui-diff-rows')?.children.length ?? 0;
				const counts = [rows()];
				let last = performance.now();
				let gap = 0;
				while (rows() < 1501) {
					await new Promise(resolve => requestAnimationFrame(resolve));
					const now = performance.now();
					gap = Math.max(gap, now - last);
					last = now;
					counts.push(rows());
					if (counts.length > 200) break;
				}
				return { counts, gap };
			});
			expect(drawn.counts[0] === 500 && drawn.counts.at(-1) === 1501, `drawn in chunks: ${drawn.counts.join(',')}`);
			expect(new Set(drawn.counts).size >= 3, `more than one frame: ${drawn.counts.join(',')}`);
			expect(drawn.gap < 1000, `the page kept answering between frames: ${Math.round(drawn.gap)} ms`);
			expect((await file.locator('.bui-diff-lines').getAttribute('aria-busy')) === null, 'not busy once drawn');
		}
	},
	{
		name: 'diff motion: the chevron turns with --motion-quick, and not at all under reduced motion',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const motion of ['no-preference', 'reduce']) {
				const { page, context } = await open(browser, consumer, { reducedMotion: motion });
				const duration = await page.locator('.bui-diff-chevron .bui-icon').first().evaluate(node => getComputedStyle(node).transitionDuration);
				const still = duration.split(',').every(value => parseFloat(value) === 0);
				expect(motion === 'reduce' ? still : !still, `${motion}: ${duration}`);
				await context.close();
			}
		}
	},
	{
		name: 'diff Copy path: the path copied, "Copied" said in place on the button',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			const stub = browser.engine === 'chrome' ? null : context => context.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => void (window.copied = text) }, configurable: true }));
			const { page, context } = await open(browser, consumer, { prepare: stub });
			if (browser.engine === 'chrome') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
			const button = page.locator('.bui-diff-file[data-path="src/pay/total.js"] .bui-copy-button button');
			expect((await button.textContent()) === copy.copy, 'Copy path in words');
			await button.click();
			await page.waitForFunction(text => document.querySelector('.bui-diff-file[data-path="src/pay/total.js"] .bui-copy-button button').textContent === text, copy.copied);
			const copied = browser.engine === 'chrome' ? await page.evaluate(() => navigator.clipboard.readText()) : await page.evaluate(() => window.copied);
			expect(copied === 'src/pay/total.js', `the new path copied: ${copied}`);
		}
	}
];
