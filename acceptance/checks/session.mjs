import { expect, overflow } from '../support/browser.mjs';

/** A session that ended (0.8.0; the dialog cannot be dismissed since 0.9.0) in a real engine: a hidden frame through the stand-in product's hand-off and landing, the sign-in window, an opaque backdrop and the dialog that stays. */
let count = 0;
async function open(browser, consumer, { product = {}, width = 1280, scheme = 'light' } = {}) {
	const id = `check-${Date.now()}-${(count += 1)}`;
	const view = await browser.open(consumer, { file: 'session.html', query: `?id=${id}`, viewport: { width, height: 800 }, colorScheme: scheme });
	const query = new URLSearchParams({ id, ...product });
	await view.page.evaluate(address => fetch(address, { method: 'POST' }), `/product/set?${query}`);
	return { ...view, id };
}

const log = page => page.evaluate(() => window.fixture.log.join('|'));
const shown = page => page.evaluate(() => Boolean(document.querySelector('dialog.bui-session')?.open));

export const checks = [
	{
		name: 'session: an expired session is renewed in a hidden frame through the landing; nothing is shown and the held write is sent',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, { product: { session: 'ended', reason: 'expired', platform: 'alive' } });
			let seen = false;
			const watching = page.evaluate(() => new Promise(resolve => {
				const observer = new MutationObserver(() => document.querySelector('dialog.bui-session[open]') && resolve(true));
				observer.observe(document.body, { subtree: true, childList: true, attributes: true });
				setTimeout(() => resolve(false), 4000);
			}));
			await page.evaluate(() => void window.fixture.lost('write'));
			await page.waitForFunction(() => window.fixture.log.includes('write:true'), null, { timeout: 8_000 });
			seen = await watching;
			expect(!seen, 'no dialog appeared during a silent renewal');
			expect(await page.evaluate(() => !document.querySelector('iframe')), 'the frame is gone');
			expect((await log(page)).includes('renewed'), `onrenewed ran: ${await log(page)}`);
			expect((await log(page)).includes('landed:renewed'), `the landing said it, not a timeout: ${await log(page)}`);
		}
	},
	{
		name: 'session: without a Beyond session one dialog names the person; Continue opens a window that signs in and closes itself, and the page continues',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page, context } = await open(browser, consumer, { product: { session: 'ended', reason: 'expired', platform: 'none' } });
			await page.evaluate(() => void window.fixture.lost('write'));
			await page.waitForFunction(() => document.querySelector('dialog.bui-session')?.open, null, { timeout: 15_000 });
			const said = await page.evaluate(() => ({ title: document.querySelector('dialog.bui-session .bui-dialog-title').textContent, text: document.querySelector('dialog.bui-session').textContent, focus: document.activeElement?.textContent?.trim() }));
			expect(said.title === 'Sign in again to continue', `title: ${said.title}`);
			expect(/Ada Lovelace/.test(said.text) && /ada@example\.com/.test(said.text), 'the person is named');
			expect(said.focus === 'Continue as Ada', `focus starts on Continue: ${said.focus}`);
			const [popup] = await Promise.all([context.waitForEvent('page'), page.getByRole('button', { name: 'Continue as Ada' }).click()]);
			await popup.waitForLoadState();
			await popup.locator('#signin').click();
			await popup.waitForEvent('close', { timeout: 10_000 });
			await page.waitForFunction(() => window.fixture.log.includes('write:true'), null, { timeout: 10_000 });
			expect(!(await shown(page)), 'the dialog closed');
			expect(await page.evaluate(() => Boolean(document.querySelector('.bui-family-account'))), 'the account menu is back');
		}
	},
	{
		name: 'session: a revoked session hides the page behind an opaque backdrop, in both themes, and cannot be closed',
		consumers: ['dom'],
		async run(browser, consumer) {
			for (const scheme of ['light', 'dark']) {
				const { page } = await open(browser, consumer, { scheme, product: { session: 'ended', reason: 'expired', platform: 'none', ended: 'revoked' } });
				await page.evaluate(() => void window.fixture.lost('read'));
				await page.waitForFunction(() => document.querySelector('dialog.bui-session')?.open, null, { timeout: 15_000 });
				const look = await page.evaluate(() => {
					const dialog = document.querySelector('dialog.bui-session');
					const backdrop = getComputedStyle(dialog, '::backdrop').backgroundColor;
					const canvas = getComputedStyle(document.documentElement).getPropertyValue('--color-canvas').trim();
					return { title: dialog.querySelector('.bui-dialog-title').textContent, backdrop, canvas, close: Boolean(dialog.querySelector('.bui-dialog-head .bui-icon-button')) };
				});
				expect(look.title === 'You were signed out of Beyond', `${scheme}: ${look.title} (${await log(page)})`);
				expect(!/rgba\(.*, 0(\.\d+)?\)$/.test(look.backdrop) && look.backdrop !== 'transparent', `${scheme}: the backdrop is opaque: ${look.backdrop}`);
				expect(!look.close, `${scheme}: no close button`);
				await page.keyboard.press('Escape');
				expect(await shown(page), `${scheme}: Escape does not close it`);
			}
		}
	},
	{
		name: 'session: the dialog cannot be dismissed (no ×, Escape nor a press outside), the page behind cannot be used, a read started meanwhile waits and is sent after Continue, at 1280 and 390 px',
		consumers: ['dom'],
		async run(browser, consumer) {
			for (const width of [1280, 390]) {
				const { page, context } = await open(browser, consumer, { width, product: { session: 'ended', reason: 'expired', platform: 'none' } });
				await page.evaluate(() => void window.fixture.lost('write'));
				await page.waitForFunction(() => document.querySelector('dialog.bui-session')?.open, null, { timeout: 15_000 });
				expect(!(await overflow(page)), `${width}: no sideways scroll with the dialog`);
				expect(await page.evaluate(() => !document.querySelector('dialog.bui-session .bui-dialog-head .bui-icon-button')), `${width}: no close button`);
				await page.keyboard.press('Escape');
				await page.mouse.click(4, 400);
				expect(await shown(page), `${width}: neither Escape nor a press outside closes it`);
				await page.locator('#act').click({ force: true, timeout: 2_000 }).catch(() => undefined);
				expect(!(await log(page)).includes('acted'), `${width}: the page behind cannot be used`);
				expect(await page.evaluate(() => !document.querySelector('.bui-family-signin') && document.documentElement.dataset.session === undefined), `${width}: no Sign in of the bar and no reading state`);
				await page.evaluate(() => void window.fixture.lost('read'));
				const [popup] = await Promise.all([context.waitForEvent('page'), page.getByRole('button', { name: 'Continue as Ada' }).click()]);
				await popup.waitForLoadState();
				await popup.locator('#signin').click();
				await popup.waitForEvent('close', { timeout: 10_000 });
				await page.waitForFunction(() => window.fixture.log.includes('write:true') && window.fixture.log.includes('read:true'), null, { timeout: 10_000 });
				expect(!(await shown(page)), `${width}: the dialog closed once signed in`);
			}
		}
	}
];
