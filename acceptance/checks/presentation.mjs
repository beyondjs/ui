import { expect, overflow } from '../support/browser.mjs';
import { words } from '../support/words.mjs';

/** Motion, themes, narrow screens, zoom, collections and cleanup. */
export const checks = [
	{
		name: 'reduced motion: dialogs, spinners and controls neither animate nor transition',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer, { reducedMotion: 'reduce' });
			await page.getByRole('button', { name: words[consumer.language].open }).click();
			const styles = await page.evaluate(() => {
				const style = selector => getComputedStyle(document.querySelector(selector));
				return { dialog: style('dialog[open]').animationName, button: style('.bui-button').transitionDuration };
			});
			expect(styles.dialog === 'none' && /^0s/.test(styles.button), `still: ${JSON.stringify(styles)}`);
			const moving = await browser.open(consumer);
			await moving.page.getByRole('button', { name: words[consumer.language].open }).click();
			const animated = await moving.page.evaluate(() => getComputedStyle(document.querySelector('dialog[open]')).animationName);
			expect(animated === 'bui-enter', `animates without the preference: ${animated}`);
			await moving.context.close();
		}
	},
	{
		name: 'themes: dark from data-beyond-mode and from the system preference, light when the attribute says so',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const surface = page => page.evaluate(() => getComputedStyle(document.querySelector('.bui-input')).backgroundColor);
			const { page } = await browser.open(consumer);
			expect((await surface(page)) === 'rgb(255, 255, 255)', 'light by default');
			await page.evaluate(() => document.documentElement.setAttribute('data-beyond-mode', 'dark'));
			expect((await surface(page)) === 'rgb(17, 32, 54)', `dark by attribute: ${await surface(page)}`);
			const system = await browser.open(consumer, { colorScheme: 'dark' });
			expect((await surface(system.page)) === 'rgb(17, 32, 54)', 'dark from the system preference');
			await system.page.evaluate(() => document.documentElement.setAttribute('data-beyond-mode', 'light'));
			expect((await surface(system.page)) === 'rgb(255, 255, 255)', 'the attribute overrides the system');
			await system.context.close();
		}
	},
	{
		name: '320px: no horizontal scroll; the header navigation collapses behind its toggle',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer, { viewport: { width: 320, height: 720 } });
			await page.waitForFunction(() => document.querySelectorAll('#listing tbody tr').length > 0);
			expect(!(await overflow(page)), 'no sideways scroll at 320px');
			const nav = page.locator('.bui-header-nav');
			expect(!(await nav.isVisible()), 'navigation collapsed');
			const toggle = page.locator('.bui-header-toggle');
			await toggle.click();
			expect(await nav.isVisible() && (await toggle.getAttribute('aria-expanded')) === 'true', 'toggle opens the navigation');
			await page.locator('.bui-notify > button').click();
			const box = await page.locator('.bui-notify .bui-disclosure-panel').boundingBox();
			expect(box.x >= 0 && box.x + box.width <= 320, `panel fits the screen: ${JSON.stringify(box)}`);
			expect(!(await overflow(page)), 'still no sideways scroll with panels open');
		}
	},
	{
		name: '200% zoom: no horizontal scroll and the dialog fits the viewport',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			// 200% browser zoom of a 1280px window leaves 640 CSS pixels at twice the density.
			const { page } = await browser.open(consumer, { viewport: { width: 640, height: 450 }, deviceScaleFactor: 2 });
			expect(!(await overflow(page)), 'no sideways scroll');
			await page.getByRole('button', { name: words[consumer.language].open }).click();
			const box = await page.getByRole('dialog').boundingBox();
			expect(box.x >= 0 && box.x + box.width <= 640 && box.height <= 450, `dialog fits: ${JSON.stringify(box)}`);
		}
	},
	{
		name: 'collection: rows are links, paging reports state, no matches can be cleared',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer);
			const copy = words[consumer.language];
			const list = page.locator('#listing');
			await list.locator('tbody tr').first().waitFor();
			expect((await list.locator('a.bui-row-link').first().getAttribute('href')) === '#/requests/r1', 'rows link to their detail');
			await list.getByRole('button', { name: copy.next }).click();
			await page.waitForFunction(() => /Request 6/.test(document.querySelector('#listing tbody').textContent));
			expect(await page.evaluate(() => document.activeElement.classList.contains('bui-collection-body')), 'focus moves to the new rows');
			await list.locator('input[type="search"]').fill('zzz');
			await list.getByRole('button', { name: copy.clear }).click();
			await page.waitForFunction(() => document.querySelectorAll('#listing tbody tr').length === 5);
			await list.locator('a.bui-row-link').first().click();
			await page.waitForFunction(() => location.hash === '#/requests/r1');
		}
	},
	{
		name: 'teardown: destroying or unmounting leaves no component element and no added document listener',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const { page, context } = await browser.open(consumer);
			const session = await context.newCDPSession(page);
			const listeners = async () => {
				const { result } = await session.send('Runtime.evaluate', { expression: 'document' });
				const found = await session.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
				return found.listeners.map(listener => listener.type);
			};
			await page.locator('.bui-notify > button').click();
			await page.getByRole('button', { name: words[consumer.language].more }).click();
			const open = await listeners();
			expect(open.includes('pointerdown'), `open panels listen on the document: ${open}`);
			await page.evaluate(() => window.fixture.destroy());
			await page.waitForFunction(() => !document.querySelector('[class*="bui-"]'));
			// The components listen on the document for pointer presses and keys only; React's own
			// document listeners (such as selectionchange) belong to React and stay.
			const left = (await listeners()).filter(type => ['pointerdown', 'keydown'].includes(type));
			expect(!left.length, `component listeners left on the document: ${left}`);
		}
	},
	{
		name: 'Spanish copy passed through labels reaches the components',
		consumers: ['react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer);
			await page.locator('.bui-notify .bui-count:not([hidden])').waitFor();
			expect((await page.locator('.bui-notify > button').getAttribute('aria-label')) === 'Notificaciones, 4 sin leer', 'entry name in Spanish');
			await page.locator('#inbox .bui-notice').first().waitFor();
			const text = await page.locator('#inbox').textContent();
			expect(/Sin leer/.test(text) && /hace \d+ minutos/.test(text), `inbox copy and relative time in Spanish: ${text.slice(0, 160)}`);
			expect(/elegido/.test(await page.locator('#picking .bui-picker-count').textContent()), 'picker count in Spanish');
		}
	}
];
