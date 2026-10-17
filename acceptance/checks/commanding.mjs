import { expect, overflow } from '../support/browser.mjs';

/**
 * The patterns of 0.16.0 measured in the browser: ⌘K's palette (top layer, keys, recent items), choice
 * cards by keyboard, a composer whose Send names its missing step, an approval card's scoped decisions
 * with a note, one bar on a phone (the family bar's button opens the sidebar's drawer; no product row) and
 * the development warning of a region with two primary actions.
 */
async function open(browser, consumer, { width = 1280, height = 800, scheme = 'light' } = {}) {
	const warnings = [];
	const view = await browser.open(consumer, { file: 'wave.html', viewport: { width, height }, colorScheme: scheme, prepare: async context => context.on('console', message => message.type() === 'warning' && warnings.push(message.text())) });
	await view.page.evaluate(() => document.fonts.ready);
	return { ...view, warnings };
}

const logged = (page, line) => page.waitForFunction(text => window.fixture.log.includes(text), line);

export const checks = [
	{
		name: 'palette: ⌘K / Ctrl+K opens it in the top layer with focus in its field; groups, arrows and Enter open an item; Escape closes and focus returns; no sideways scroll at 390 px',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const width of [1280, 390]) {
				const { page, context } = await open(browser, consumer, { width });
				await page.locator('.bui-composer-field').focus();
				const apple = await page.evaluate(() => /mac|iphone|ipad/i.test(navigator.platform));
				await page.keyboard.press(apple ? 'Meta+k' : 'Control+k');
				await page.waitForSelector('dialog.bui-palette[open]');
				const found = await page.evaluate(() => {
					const dialog = document.querySelector('dialog.bui-palette');
					let modal = false;
					try {
						modal = dialog.matches(':modal');
					} catch {}
					return { modal, focus: document.activeElement === dialog.querySelector('input'), box: dialog.getBoundingClientRect().toJSON(), width: innerWidth };
				});
				expect(found.modal && found.focus, `${width}px: modal with focus in its field: ${JSON.stringify(found)}`);
				expect(found.box.left >= 0 && found.box.right <= found.width, `${width}px: inside the window: ${JSON.stringify(found.box)}`);
				await page.keyboard.type('a');
				await page.waitForSelector('.bui-palette-group[data-source="machines"] [role="option"]');
				await page.keyboard.press('ArrowDown');
				await page.keyboard.press('Enter');
				await logged(page, 'palette:#/machines/api');
				expect(!(await page.evaluate(() => document.querySelector('dialog.bui-palette').open)), `${width}px: closed after opening an item`);
				await page.keyboard.press(apple ? 'Meta+k' : 'Control+k');
				await page.waitForSelector('dialog.bui-palette[open] .bui-palette-group[data-source="recent"]');
				await page.keyboard.press('Escape');
				const back = await page.evaluate(() => ({ open: document.querySelector('dialog.bui-palette').open, field: document.activeElement?.classList.contains('bui-composer-field') }));
				expect(!back.open && back.field, `${width}px: Escape closes and focus returns: ${JSON.stringify(back)}`);
				expect(!(await overflow(page)), `${width}px: no sideways scroll`);
				await context.close();
			}
		}
	},
	{
		name: 'choice cards: the arrows choose the next open card and it applies at once, a closed card is skipped; the composer\'s Send names its step, performs it and sends; scoped decisions with a note',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page, context } = await open(browser, consumer);
			await page.locator('.bui-card-radio').first().focus();
			await page.keyboard.press('ArrowRight');
			await logged(page, 'size:standard');
			await page.keyboard.press('ArrowRight');
			const chosen = await page.evaluate(() => document.querySelector('.bui-card-radio:checked')?.value);
			expect(chosen === 'small' || chosen === 'standard', `a closed card is never chosen: ${chosen}`);
			const send = page.locator('.bui-composer-send .bui-button-primary');
			expect(/machine|máquina/i.test(await send.textContent()), `Send names its step: ${await send.textContent()}`);
			await page.locator('.bui-composer-field').fill('Fix the redirect');
			await send.click();
			await logged(page, 'step:Fix the redirect');
			await logged(page, 'send:Fix the redirect');
			await page.locator('.bui-command-actions button').nth(2).click();
			await page.locator('.bui-command-note-field').fill('Clean only dist');
			await page.keyboard.press('Enter');
			await logged(page, 'decide:note:Clean only dist');
			await context.close();
		}
	},
	{
		name: 'one bar on a phone: at 390 px no product row, the page starts under the bar and the bar\'s button opens the drawer and gets focus back; at 1280 px no button; two primaries in a region are warned',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			let { page, context, warnings } = await open(browser, consumer, { width: 390, height: 844 });
			const found = await page.evaluate(() => {
				const row = document.querySelector('.bui-sidebar-row');
				const toggle = document.querySelector('.bui-family .bui-header-toggle');
				return { row: row ? getComputedStyle(row).display : 'none', toggle: toggle ? getComputedStyle(toggle).display : 'none', main: document.querySelector('#main').getBoundingClientRect().top, bar: document.querySelector('.bui-family').getBoundingClientRect().bottom };
			});
			expect(found.row === 'none' && found.toggle !== 'none', `one bar: ${JSON.stringify(found)}`);
			expect(Math.abs(found.main - found.bar) <= 1, `the page starts under the bar: ${JSON.stringify(found)}`);
			await page.locator('.bui-family .bui-header-toggle').click();
			await page.waitForSelector('.bui-sidebar dialog[open]');
			await page.keyboard.press('Escape');
			await page.waitForFunction(() => !document.querySelector('.bui-sidebar dialog').open);
			const back = await page.evaluate(() => ({ focus: document.activeElement?.classList.contains('bui-header-toggle'), expanded: document.querySelector('.bui-family .bui-header-toggle').getAttribute('aria-expanded') }));
			expect(back.focus && back.expanded === 'false', `focus back on the bar's button, closed: ${JSON.stringify(back)}`);
			expect(!(await overflow(page)), '390px: no sideways scroll');
			await context.close();
			({ page, context, warnings } = await open(browser, consumer, { width: 1280 }));
			const wide = await page.evaluate(() => getComputedStyle(document.querySelector('.bui-family .bui-header-toggle')).display);
			expect(wide === 'none', `no button beside a permanent sidebar: ${wide}`);
			await page.waitForTimeout(100);
			expect(warnings.some(text => /2 primary actions in one region/.test(text)), `the development warning: ${JSON.stringify(warnings)}`);
			await context.close();
		}
	}
];
