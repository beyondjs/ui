import { expect, overflow } from '../support/browser.mjs';

export const checks = [
	{
		name: 'rail navigation: desktop context toggles by keyboard, updates in place and preserves labels in both themes',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			for (const colorScheme of ['light', 'dark']) {
				const { page, context, errors } = await browser.open(consumer, { file: 'navigation.html', viewport: { width: 1440, height: 900 }, colorScheme, reducedMotion: 'reduce' });
				try {
					const rail = page.locator('.bui-sidebar-rail');
					const trigger = rail.locator('button[aria-expanded]');
					expect(await rail.isVisible(), 'the rail is visible');
					const home = rail.locator('[data-glyph="home"]');
					await home.hover();
					await page.locator('.bui-hint:visible').filter({ hasText: 'Home' }).waitFor();
					await page.mouse.move(500, 500);
					await page.keyboard.press('Tab');
					await home.focus();
					await page.locator('.bui-hint:visible').filter({ hasText: 'Home' }).waitFor();
					await page.keyboard.press('Escape');
					expect(await rail.locator('.bui-sidebar-rail-item').count() === 6, 'one entry per section and one object toggle');
					expect(await page.locator('.bui-sidebar-panel .bui-sidebar-context').count() === 0, 'no repeated project context');
					const heading = await page.locator('.bui-sidebar-panel .bui-sidebar-object-head').evaluate(node => {
						const title = node.querySelector('.bui-sidebar-object-title');
						const action = node.querySelector('.bui-sidebar-object-action');
						const close = node.querySelector('.bui-sidebar-collapse');
						const text = document.createRange(); text.selectNodeContents(title);
						return { lines: text.getClientRects().length, title: title.getBoundingClientRect().toJSON(), action: action.getBoundingClientRect().toJSON(), close: close.getBoundingClientRect().toJSON() };
					});
					expect(heading.lines === 1, 'the full contextual heading fits one line');
					expect(heading.action.top >= heading.title.bottom, 'New sits below the title');
					expect(heading.close.left >= heading.title.right, 'Close stays beside the title');
					await page.locator('.bui-sidebar-collapse').click();
					expect(await page.locator('.bui-sidebar-panel').isHidden(), 'the panel collapses');
					expect(await trigger.evaluate(node => node === document.activeElement), 'focus returns to the toggle');
					await trigger.press('Space');
					await page.locator('.bui-sidebar-panel').waitFor({ state: 'visible' });
					expect(await trigger.getAttribute('aria-expanded') === 'true', 'the panel reopens');
					const machines = rail.locator('[data-glyph="box"]');
					await machines.focus();
					await page.evaluate(() => window.fixture.update());
					await page.waitForFunction(() => document.querySelector('.bui-sidebar-rail [data-glyph="box"]').getAttribute('aria-label').includes('3'));
					expect(await machines.evaluate(node => node === document.activeElement), 'data changes keep focus');
					expect(!(await overflow(page)), 'no horizontal scroll');
					expect(errors.length === 0, errors.join('\n'));
				} finally { await context.close(); }
			}
		}
	},
	{
		name: 'rail navigation: mobile keeps one merged hamburger, complete drawer and focus across the desktop cut',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const width of [390, 320]) {
				const { page, context, errors } = await browser.open(consumer, { file: 'navigation.html', viewport: { width, height: 844 }, hasTouch: true, isMobile: browser.engine !== 'firefox', reducedMotion: 'reduce' });
				try {
					expect(await page.locator('.bui-sidebar-rail').isHidden(), 'no duplicate rail on mobile');
					const hamburger = page.locator('.bui-family .bui-header-toggle');
					await hamburger.click();
					const drawer = page.locator('dialog.bui-drawer[open]');
					await drawer.waitFor();
					expect(await drawer.locator('.bui-sidebar-object').count() === 1, 'conversations remain available');
					expect(await drawer.locator('.bui-sidebar-context').count() === 1, 'context remains in the drawer');
					expect(!(await overflow(page)), 'no sideways scroll');
					await page.setViewportSize({ width: 1440, height: 900 });
					await page.waitForFunction(() => document.querySelector('.bui-sidebar').dataset.mode === 'permanent');
					expect(await page.locator('dialog.bui-drawer').getAttribute('open') === null, 'crossing the cut closes the drawer');
					expect(await page.locator('.bui-sidebar-rail').evaluate(node => node.contains(document.activeElement)), 'focus reaches the rail');
					expect(errors.length === 0, errors.join('\n'));
				} finally { await context.close(); }
			}
		}
	},
	{
		name: 'rail navigation: Products popup has concise context, a current check and balanced alignment inside the viewport',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const width of [1440, 390, 320]) {
				const { page, context } = await browser.open(consumer, { file: 'navigation.html', viewport: { width, height: 844 }, reducedMotion: 'reduce' });
				try {
					const button = page.locator('.bui-family-product > button');
					await button.click();
					const panel = page.locator('.bui-family-product .bui-navmenu-panel');
					await panel.waitFor({ state: 'visible' });
					const found = await panel.evaluate(node => {
						const heading = node.querySelector('.bui-navmenu-heading');
						const label = node.querySelector('.bui-navmenu-label');
						const products = node.querySelector('.bui-navmenu-section:not(.bui-family-carried)');
						return { rect: node.getBoundingClientRect().toJSON(), heading: heading.textContent, aligned: Math.abs(heading.getBoundingClientRect().left + parseFloat(getComputedStyle(heading).paddingLeft) - label.getBoundingClientRect().left), repeated: products.querySelectorAll('.bui-navmenu-meta').length, check: Boolean(products.querySelector('[aria-current] > .bui-icon')) };
					});
					expect(found.heading === (consumer.language === 'es' ? 'Productos' : 'Products'), 'one concise heading');
					expect(found.repeated === 0 && found.check, 'no repeated project sentence; current choice is marked');
					expect(found.aligned <= 1, 'title and row text align');
					expect(found.rect.left >= 0 && found.rect.right <= width + 1, 'popup inside viewport');
					await page.keyboard.press('Escape');
					expect(await button.evaluate(node => node === document.activeElement), 'Escape returns focus');
				} finally { await context.close(); }
			}
		}
	},
	{
		name: 'rail navigation: contextual destination links navigate normally and expose a Floating tooltip on hover and keyboard focus',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer, { file: 'navigation.html', query: '?linked', reducedMotion: 'reduce' });
			const link = page.locator('.bui-sidebar-rail a[data-glyph="chat"]');
			expect(await link.getAttribute('href') === '/conversations', 'the object is a route destination');
			expect(await link.getAttribute('aria-current') === 'page', 'the current route is marked');
			expect(await link.getAttribute('aria-expanded') === null, 'a destination never masquerades as a toggle');
			await link.hover();
			const name = consumer.language === 'es' ? 'Conversaciones' : 'Conversations';
			await page.locator('.bui-hint:visible').filter({ hasText: name }).waitFor();
			await page.mouse.move(500, 500);
			await page.keyboard.press('Tab');
			await link.focus();
			await page.locator('.bui-hint:visible').filter({ hasText: name }).waitFor();
			await link.press('Enter');
			expect(await page.evaluate(name => window.fixture.log.includes(name), name), 'the normal navigation handler receives the readable destination');
		}
	}
];
