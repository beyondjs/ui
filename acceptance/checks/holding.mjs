import { expect } from '../support/browser.mjs';

/**
 * The fixes of 0.17.1 measured in the browser: the family bar keeps the menu a person has open while its
 * data changes (D95: the same menu stays open in place, focus on the same entry, no entry and no exit
 * until Escape, which still leaves as it came), and the same data draws nothing new; CopyValue's Copy
 * keeps its word on one line in a fact's narrow value; an outage tries again by itself and opens what
 * answered without a reload (D132).
 */
async function open(browser, consumer) {
	const view = await browser.open(consumer, { file: 'hold.html', viewport: { width: 1440, height: 800 } });
	await view.page.evaluate(() => document.fonts.ready);
	return view;
}

/** The open project menu: whether it is open, the entry with focus, pictures leaving and animations running on it. */
const project = page =>
	page.evaluate(() => {
		const part = [...document.querySelectorAll('[data-part="project"]')].find(node => node.getClientRects().length);
		const panel = part.querySelector(':scope > .bui-navmenu-panel');
		return {
			open: part.querySelector(':scope > .bui-navmenu-button').getAttribute('aria-expanded') === 'true' && !panel.hidden,
			focus: panel.contains(document.activeElement) ? document.activeElement.textContent.trim() : null,
			entries: [...panel.querySelectorAll('.bui-navmenu-item')].map(node => node.textContent.trim()),
			leaving: document.querySelectorAll('.bui-disclosure-leaving, .bui-leaving').length,
			running: panel.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length,
			panel
		};
	});

export const checks = [
	{
		name: 'family bar: an open menu stays open in place across new data, focus on the same entry, and leaves as it came on Escape (D95)',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer);
			const button = page.locator('[data-part="project"] > .bui-navmenu-button').first();
			await button.focus();
			await page.keyboard.press('Enter');
			await page.keyboard.press('ArrowDown');
			await page.waitForTimeout(400);
			const before = await project(page);
			expect(before.open && before.focus, `the menu is open with an entry focused: ${JSON.stringify(before)}`);
			const handle = await page.evaluateHandle(() => document.querySelector('[data-part="project"] > .bui-navmenu-panel:not([hidden])'));
			await page.evaluate(() => window.fixture.same());
			await page.waitForTimeout(100);
			expect(await handle.evaluate(node => node.isConnected), 'the same data draws nothing new');
			await page.evaluate(() => window.fixture.redraw());
			// React draws on its own schedule
			await page.waitForFunction(() => [...document.querySelectorAll('[data-part="project"] .bui-navmenu-item')].some(node => node.textContent.includes('Project 1')), null, { timeout: 2000 });
			const after = await project(page);
			expect(after.open, `still open after new data: ${JSON.stringify(after)}`);
			expect(after.focus === before.focus, `focus on the same entry: ${before.focus} → ${after.focus}`);
			expect(after.entries.some(entry => entry.includes('Project 1')), `with the new contents: ${JSON.stringify(after.entries)}`);
			expect(after.leaving === 0 && after.running === 0, `nothing left and nothing entered: ${JSON.stringify(after)}`);
			await page.keyboard.press('Escape');
			const closed = await project(page);
			expect(!closed.open, 'Escape closes it');
			expect(closed.leaving > 0, `and it leaves as it came: ${JSON.stringify(closed)}`);
		}
	},
	{
		name: 'CopyValue: in a fact’s narrow value that breaks words anywhere, Copy keeps its word on one line and its size',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer);
			const measured = await page.evaluate(() => {
				const button = document.querySelector('#fact .bui-copy-button .bui-button');
				const box = button.getBoundingClientRect();
				const value = document.querySelector('#fact .bui-copy-value-text').getBoundingClientRect();
				const fact = document.querySelector('#fact').getBoundingClientRect();
				return { height: box.height, width: box.width, scroll: button.scrollWidth, line: parseFloat(getComputedStyle(button).lineHeight) || 20, value: value.width, right: box.right, fact: fact.right };
			});
			expect(measured.height <= Math.max(44, measured.line * 1.8), `Copy is one line: ${JSON.stringify(measured)}`);
			expect(measured.width + 0.5 >= measured.scroll, `Copy is not squeezed: ${JSON.stringify(measured)}`);
			expect(measured.right <= measured.fact + 0.5, `the value is cut, Copy stays inside: ${JSON.stringify(measured)}`);
		}
	},
	{
		name: 'Unavailable: an outage says when it last tried, tries again by itself and on Try again, and opens what answered with no reload (D132)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer);
			const line = page.locator('.bui-unavailable .bui-again');
			await line.waitFor();
			expect(/^Last tried \d\d:\d\d · trying again by itself$/.test(await line.textContent()), `the line: ${await line.textContent()}`);
			const address = page.url();
			await page.locator('.bui-unavailable-actions button', { hasText: 'Try again' }).click();
			await page.waitForFunction(() => window.fixture.read.tries === 1);
			await page.evaluate(() => {
				window.fixture.read.answer = true;
				window.dispatchEvent(new Event('online'));
			});
			await page.locator('#recovered').waitFor();
			expect(page.url() === address, 'no reload');
			expect((await page.evaluate(() => window.fixture.read.tries)) === 2, 'one more read, when the browser came back online');
		}
	}
];
