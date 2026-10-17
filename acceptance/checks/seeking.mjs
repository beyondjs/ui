import { expect, focused } from '../support/browser.mjs';
import { open } from './anchoring.mjs';

/**
 * The Sidebar of 0.14.0 in a real engine (D97, D98), on the `round.html` pages: the objects after the
 * sections with New and the search icon on one heading line; the icon expanding into its field in place,
 * Escape and an empty blur returning to it; groups folding with their count and current item, kept after a
 * reload, a group that needs the person opening by itself; ⌘K / Ctrl+K into the search (the drawer below
 * the cut, with New at the product row's end); the current item in the text color.
 */
const modifier = engine => (engine === 'webkit' || process.platform === 'darwin' ? 'Meta' : 'Control');

export const checks = [
	{
		name: 'objects after the sections: New and the search icon on the heading line; the icon expands into its field there, Escape returns focus to it, an empty field left returns too; results keep their bounded states',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer);
			const nav = page.locator('.bui-sidebar-panel nav');
			const line = await nav.locator('.bui-sidebar-object-head').evaluate(head => {
				const top = node => Math.round(node.getBoundingClientRect().top + node.getBoundingClientRect().height / 2);
				return { title: top(head.querySelector('.bui-sidebar-object-title')), action: top(head.querySelector('.bui-sidebar-object-action')), seek: top(head.querySelector('.bui-sidebar-seek')), divider: getComputedStyle(head.parentNode).borderTopStyle };
			});
			expect(Math.abs(line.title - line.action) <= 2 && Math.abs(line.title - line.seek) <= 2, `one heading line: ${JSON.stringify(line)}`);
			expect(line.divider === 'solid', 'a divider before the objects');
			const seek = nav.locator('.bui-sidebar-seek');
			await seek.hover();
			await page.locator('.bui-tooltip:not([hidden])').waitFor();
			expect((await page.locator('.bui-tooltip:not([hidden])').textContent()).startsWith('Search conversations'), 'its name in the tooltip');
			await seek.click();
			const field = nav.locator('.bui-sidebar-object-head input[type="search"]');
			await field.waitFor();
			expect((await page.evaluate(() => document.activeElement?.type)) === 'search', 'focus in the field');
			await field.fill('redirect');
			await nav.locator('.bui-sidebar-results .bui-sidebar-entry').first().waitFor();
			expect(await nav.locator('.bui-sidebar-object-groups').isHidden(), 'the results in the groups’ place');
			await field.press('Escape');
			expect((await focused(page)).includes('Search conversations'), `focus back on the icon: ${await focused(page)}`);
			expect(await nav.locator('.bui-sidebar-object-groups').isVisible(), 'the groups are back');
			await seek.click();
			await page.locator('.bui-page-heading').click();
			expect(await seek.isVisible(), 'an empty field left returns to the icon');
		}
	},
	{
		name: 'groups fold under their heading with their count and current item, kept per device after a reload; a group that needs the person opens by itself; sections never fold; the current item is not a link (D98)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page, context } = await open(browser, consumer);
			const nav = page.locator('.bui-sidebar-panel nav');
			const recent = nav.locator('.bui-sidebar-fold', { hasText: 'Recent' });
			await recent.click();
			expect((await recent.getAttribute('aria-expanded')) === 'false', 'folded');
			expect((await recent.textContent()) === 'Recent, 3', 'its count kept');
			const listed = await nav.locator('.bui-sidebar-object-groups .bui-sidebar-entry:visible').allTextContents();
			expect(listed.some(text => text.startsWith('Fix the checkout redirect')) && !listed.some(text => text.startsWith('Upgrade')), `the current item stays listed: ${listed}`);
			const kept = await context.newPage();
			await kept.goto(page.url());
			await kept.waitForFunction(() => window.fixture?.ready && document.querySelector('.bui-sidebar-fold'));
			expect((await kept.locator('.bui-sidebar-panel .bui-sidebar-fold', { hasText: 'Recent' }).getAttribute('aria-expanded')) === 'false', 'kept after a reload');
			await kept.close();
			if (consumer.name === 'dom') {
				const needs = nav.locator('.bui-sidebar-fold', { hasText: 'Needs you' });
				await needs.click();
				const tone = await needs.evaluate(node => getComputedStyle(node).color);
				const warning = await page.evaluate(() => ((document.body.style.color = 'var(--color-warning)'), getComputedStyle(document.body).color));
				expect(tone === warning, `folded, it keeps its tone: ${tone} against ${warning}`);
				await page.evaluate(() => window.fixture.arrive());
				expect((await needs.getAttribute('aria-expanded')) === 'true', 'a new item that needs the person opens it');
			}
			expect((await nav.locator('.bui-sidebar-group').first().locator('.bui-sidebar-fold').count()) === 0, 'sections never fold');
			const colors = await page.evaluate(() => {
				const current = document.querySelector('.bui-sidebar-panel [aria-current="page"]');
				const probe = document.body.appendChild(document.createElement('span'));
				probe.style.color = 'var(--color-text)';
				const text = getComputedStyle(probe).color;
				probe.style.color = 'var(--color-link)';
				const link = getComputedStyle(probe).color;
				probe.remove();
				return { current: getComputedStyle(current).color, weight: getComputedStyle(current).fontWeight, text, link };
			});
			// Since token set 0.6.0 (C2) every link takes the text's color too; the current item is told apart by weight and its marker
			expect(colors.current === colors.text && colors.weight === '500', `the current item in the text color at 500: ${JSON.stringify(colors)}`);
		}
	},
	{
		name: '⌘K / Ctrl+K opens the search, a single key never does; below the cut it opens the drawer with its search and New ends the product row (SB-07)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer);
			await page.locator('.bui-page-heading').click();
			await page.keyboard.press('k');
			expect((await page.evaluate(() => document.activeElement?.type)) !== 'search', 'k alone does nothing');
			await page.keyboard.press(`${modifier(browser.engine)}+k`);
			await page.waitForFunction(() => document.activeElement?.type === 'search');
			const narrow = await open(browser, consumer, { width: 390, height: 760 });
			const start = narrow.page.locator('.bui-sidebar-row .bui-sidebar-start');
			expect((await start.textContent()) === 'New' && (await start.isVisible()), 'New at the row’s end');
			const row = await narrow.page.evaluate(() => [document.querySelector('.bui-sidebar-row').getBoundingClientRect().right, document.querySelector('.bui-sidebar-start').getBoundingClientRect().right]);
			expect(row[0] - row[1] < 16, `at its end: ${row}`);
			await narrow.page.locator('.bui-page-heading').click();
			await narrow.page.keyboard.press(`${modifier(browser.engine)}+k`);
			await narrow.page.waitForSelector('dialog.bui-drawer[open]');
			await narrow.page.waitForFunction(() => document.activeElement?.type === 'search' && document.activeElement.closest('dialog'));
		}
	}
];
