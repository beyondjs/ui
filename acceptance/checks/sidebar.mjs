import { expect, overflow } from '../support/browser.mjs';

/** The shared Sidebar at 1440, 390, 360 and 320 px in both themes: permanent, the product row and the modal drawer. */
async function open(browser, consumer, { width, query = '?family=annotated&sidebar=1024', ...options }) {
	const view = await browser.open(consumer, { file: 'family.html', query, viewport: { width, height: 700 }, ...options });
	await view.page.evaluate(() => document.fonts.ready);
	return view;
}

const state = page =>
	page.evaluate(() => {
		const rect = node => (node && node.getClientRects().length ? node.getBoundingClientRect().toJSON() : null);
		const sidebar = document.querySelector('.bui-sidebar');
		const dialog = sidebar.querySelector('dialog');
		return {
			mode: sidebar.dataset.mode,
			panel: rect(sidebar.querySelector('.bui-sidebar-panel')),
			row: rect(sidebar.querySelector('.bui-sidebar-row')),
			open: dialog.open,
			drawer: rect(dialog.querySelector('.bui-drawer-panel')),
			focus: document.activeElement.className + '|' + (document.activeElement.getAttribute('aria-current') ?? ''),
			inside: dialog.contains(document.activeElement),
			inert: Boolean(document.querySelector('.bui-family').closest('[inert]')),
			scroll: getComputedStyle(document.documentElement).overflow,
			button: sidebar.querySelector('.bui-sidebar-button').getAttribute('aria-expanded')
		};
	});

export const checks = [
	{
		name: 'sidebar at 1440 px is permanent, flush under the bar, full height and sticky; at 390, 360 and 320 px a sticky product row opens a modal drawer, in both themes',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const scheme of ['light', 'dark']) {
				for (const width of [1440, 390, 360, 320]) {
					const at = `${width}px ${scheme}`;
					const { page, context } = await open(browser, consumer, { width, colorScheme: scheme });
					let found = await state(page);
					expect(!(await overflow(page)), `${at}: no sideways scroll`);
					if (width >= 1024) {
						expect(found.mode === 'permanent' && found.panel && !found.row, `${at}: permanent: ${JSON.stringify(found)}`);
						expect(Math.abs(found.panel.top - 44) <= 0.5 && found.panel.left === 0 && Math.abs(found.panel.bottom - 700) <= 0.5, `${at}: flush under the bar, full height: ${JSON.stringify(found.panel)}`);
						const edge = await page.evaluate(() => getComputedStyle(document.querySelector('.bui-sidebar-panel')).borderRightWidth);
						expect(edge === '1px', `${at}: a border on its inner edge`);
						await page.mouse.wheel(0, 900);
						await page.waitForFunction(() => scrollY > 400);
						found = await state(page);
						expect(Math.abs(found.panel.top - 44) <= 0.5, `${at}: sticky while the page scrolls: ${found.panel.top}`);
						await context.close();
						continue;
					}
					expect(found.mode === 'drawer' && !found.panel && found.row, `${at}: the product row: ${JSON.stringify(found)}`);
					expect(Math.abs(found.row.top - 44) <= 0.5 && found.row.height >= 44 && found.row.height <= 45, `${at}: about 44 px under the bar: ${JSON.stringify(found.row)}`);
					const text = await page.locator('.bui-sidebar-button').innerText();
					expect(text.trim() === (consumer.language === 'es' ? 'Pedidos' : 'Requests'), `${at}: the row names the section: ${text}`);
					await page.mouse.wheel(0, 900);
					await page.waitForFunction(() => scrollY > 400);
					expect(Math.abs((await state(page)).row.top - 44) <= 0.5, `${at}: the row stays under the bar`);
					await page.locator('.bui-sidebar-button').click();
					// Measured once the slide has ended.
					await page.waitForFunction(() => document.querySelector('dialog .bui-drawer-panel').getAnimations().every(animation => animation.playState === 'finished'));
					found = await state(page);
					expect(found.open && found.button === 'true' && found.inside && found.focus.endsWith('|page'), `${at}: open, focus on the current item: ${JSON.stringify(found)}`);
					expect(found.inert && found.scroll === 'hidden', `${at}: the page is inert and does not scroll: ${JSON.stringify(found)}`);
					expect(found.drawer.left === 0 && found.drawer.right <= width - 40, `${at}: a strip of scrim to press: ${JSON.stringify(found.drawer)}`);
					await page.keyboard.press('Escape');
					found = await state(page);
					expect(!found.open && found.focus.includes('bui-sidebar-button') && !found.inert && found.scroll !== 'hidden', `${at}: Escape closes and returns focus: ${JSON.stringify(found)}`);
					await page.locator('.bui-sidebar-button').click();
					await page.mouse.click(width - 12, 400);
					found = await state(page);
					expect(!found.open && found.focus.includes('bui-sidebar-button'), `${at}: a press on the scrim closes it: ${JSON.stringify(found)}`);
					await context.close();
				}
			}
		}
	},
	{
		name: 'drawer: Tab stays inside, Close returns focus, a destination closes it and the product moves focus to its heading',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, { width: 390 });
			await page.locator('.bui-sidebar-button').click();
			for (let step = 0; step < 14; step++) {
				await page.keyboard.press(step % 5 === 4 ? 'Shift+Tab' : 'Tab');
				expect((await state(page)).inside, `focus left the drawer after ${step + 1} presses`);
			}
			await page.locator('dialog .bui-drawer-close').click();
			expect((await state(page)).focus.includes('bui-sidebar-button'), 'Close returns focus to the row button');
			await page.locator('.bui-sidebar-button').click();
			await page.locator('dialog a.bui-sidebar-item').nth(2).click();
			const found = await state(page);
			expect(!found.open, 'a destination closes the drawer');
			expect(await page.evaluate(() => document.activeElement.tagName === 'H1'), 'focus is on the product\'s heading');
			expect((await page.evaluate(() => window.fixture.log.join('|'))).includes('section:#/'), 'the product routed the choice');
		}
	},
	{
		name: 'drawer motion: it slides in with the standard motion, appears without motion under reduced motion, and crossing the cut closes it at once',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const reducedMotion of ['no-preference', 'reduce']) {
				const { page, context } = await open(browser, consumer, { width: 390, reducedMotion });
				await page.locator('.bui-sidebar-button').click();
				const motion = await page.evaluate(() => document.querySelector('dialog .bui-drawer-panel').getAnimations().map(animation => [animation.animationName, animation.effect.getTiming().duration]));
				if (reducedMotion === 'reduce') expect(!motion.length, `no motion: ${JSON.stringify(motion)}`);
				else expect(motion.some(([name, duration]) => name === 'bui-slide' && duration === 200), `a 200 ms slide: ${JSON.stringify(motion)}`);
				await page.setViewportSize({ width: 1100, height: 700 });
				await page.waitForFunction(() => document.querySelector('.bui-sidebar').dataset.mode === 'permanent');
				const found = await state(page);
				expect(!found.open && !found.inert && found.focus.endsWith('|page') && found.panel, `crossing the cut: closed, permanent, focus on its current item: ${JSON.stringify(found)}`);
				await context.close();
			}
		}
	}
];
