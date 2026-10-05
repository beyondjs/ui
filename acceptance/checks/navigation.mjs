import { expect, overflow } from '../support/browser.mjs';
import { Geometry } from '../support/geometry.mjs';
import { Ink } from '../support/ink.mjs';

/** The 0.4.0 family bar: one optical axis, the edge line, menu row states, the project menu and the grouped profile menu. */
const prepare = async context => {
	await Geometry.install(context);
	await Ink.install(context);
};

async function open(browser, consumer, { width = 1440, query = '?family=annotated', ...options } = {}) {
	const view = await browser.open(consumer, { file: 'family.html', query, viewport: { width, height: 800 }, prepare, ...options });
	await view.page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map(image => image.decode().catch(() => {}))]));
	return view;
}

const contrast = (a, b) => {
	const luminance = rgb => {
		const [r, g, b] = rgb.match(/[\d.]+/g).slice(0, 3).map(value => value / 255).map(value => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	};
	const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (high + 0.05) / (low + 0.05);
};

export const checks = [
	{
		name: 'family bar on ink at 1440, 1024, 390, 360 and 320 px in both themes: texts and icons on the wordmark letters\' axis, equal divider-to-text distances, the edge line without a double border',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const scheme of ['light', 'dark']) {
				for (const width of [1440, 1024, 390, 360, 320]) {
					const at = `${width}px ${scheme}`;
					const { page, context } = await open(browser, consumer, { width, colorScheme: scheme });
					const ink = await Ink.measure(page);
					const off = ink.offsets.filter(([, offset]) => Math.abs(offset) > 0.75);
					expect(!off.length, `${at}: off the letters' axis by more than 0.75 px: ${JSON.stringify(ink.offsets)}`);
					if (ink.gaps.location !== null) expect(Math.abs(ink.gaps.product - ink.gaps.location) <= 0.75, `${at}: divider to text, product ${ink.gaps.product} px, location ${ink.gaps.location} px`);
					const edge = await page.evaluate(() => {
						const bar = document.querySelector('.bui-family');
						const line = getComputedStyle(bar, '::after');
						const probe = document.createElement('div');
						probe.style.cssText = 'color: var(--color-border)';
						document.body.append(probe);
						const token = getComputedStyle(probe).color;
						probe.remove();
						const below = document.elementFromPoint(innerWidth / 2, bar.getBoundingClientRect().bottom + 2);
						const holder = below?.closest('.bui-productnav, .bui-sidebar, main') ?? below;
						return { width: line.borderBottomWidth, color: line.borderBottomColor, token, top: line.top, bar: getComputedStyle(bar).backgroundColor, under: holder ? getComputedStyle(holder).borderTopWidth : '0px' };
					});
					expect(edge.width === '1px' && edge.color === edge.token, `${at}: a 1 px line in --color-border under the bar: ${JSON.stringify(edge)}`);
					expect(edge.under === '0px', `${at}: no second border under the line: ${JSON.stringify(edge)}`);
					if (scheme === 'dark') expect(contrast(edge.color, edge.bar) > 1.2, `${at}: the line is distinct from the bar: ${contrast(edge.color, edge.bar).toFixed(2)}:1`);
					expect(!(await overflow(page)), `${at}: no sideways scroll`);
					await context.close();
				}
			}
		}
	},
	{
		name: 'menu rows: an unavailable product is disabled, muted (4.5:1) and quiet on hover; a pointer opens without painting focus; the keyboard paints it',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer);
			const trigger = page.locator('.bui-family [data-part="product"] .bui-navmenu-button');
			await trigger.click();
			const painted = await page.evaluate(() => [...document.querySelectorAll('.bui-family [data-part="product"] .bui-navmenu-item')].filter(node => node.matches(':focus-visible')).length);
			expect(painted === 0, `a pointer open paints no entry as focused: ${painted}`);
			const off = page.locator('.bui-family [data-part="product"] .bui-navmenu-item[aria-disabled="true"]').first();
			const before = await off.evaluate(node => ({ background: getComputedStyle(node).backgroundColor, color: getComputedStyle(node).color, panel: getComputedStyle(node.closest('.bui-navmenu-panel')).backgroundColor, cursor: getComputedStyle(node).cursor, role: node.getAttribute('role'), tab: node.tabIndex }));
			await off.hover();
			const after = await off.evaluate(node => getComputedStyle(node).backgroundColor);
			expect(after === before.background && before.cursor === 'default', `no hover and no pointer on an unavailable row: ${JSON.stringify([before, after])}`);
			expect(before.role === 'link' && before.tab === 0, `named and focusable: ${JSON.stringify(before)}`);
			expect(contrast(before.color, before.panel) >= 4.5, `muted text passes 4.5:1: ${contrast(before.color, before.panel).toFixed(2)}`);
			const link = page.locator('.bui-family [data-part="product"] a.bui-navmenu-item:not([aria-current])').first();
			const rest = await link.evaluate(node => getComputedStyle(node).backgroundColor);
			await link.hover();
			const hovered = await link.evaluate(node => [getComputedStyle(node).backgroundColor, getComputedStyle(node).cursor]);
			expect(hovered[0] !== rest && hovered[1] === 'pointer', `a link row shows the hover surface and the pointer: ${JSON.stringify([rest, hovered])}`);
			const current = await page.locator('.bui-family [data-part="product"] [aria-current="page"]').evaluate(node => getComputedStyle(node).backgroundColor);
			expect(current !== rest, `the current row has the selected surface: ${current}`);
			await page.keyboard.press('Escape');
			await trigger.focus();
			await page.keyboard.press('Enter');
			expect(await page.evaluate(() => document.activeElement.matches('.bui-navmenu-item:focus-visible')), 'opened from the keyboard, the first entry paints focus');
		}
	},
	{
		name: 'project menu: states beside the rows, the product\'s own group, all projects of the organization; outside a project "Choose a project" with search past eight rows',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const spanish = consumer.language === 'es';
			const { page, context } = await open(browser, consumer);
			await page.locator('.bui-family-wide [data-part="project"] .bui-navmenu-button').click();
			const panel = page.locator('.bui-family-wide [data-part="project"] .bui-navmenu-panel');
			const states = await panel.locator('.bui-navmenu-state').allInnerTexts();
			const expected = spanish ? ['Sin configurar en Delegate', 'Sin acceso en Delegate'] : ['Not set up in Delegate', 'No access in Delegate'];
			expect(states.length === 2 && expected.every(text => states.some(state => state.includes(text))), `states: ${states}`);
			const headings = await panel.locator('.bui-navmenu-heading').allInnerTexts();
			expect(headings.some(text => text === (spanish ? 'Solo en Delegate' : 'Only in Delegate')), `the product's own group: ${headings}`);
			const all = await panel.locator('.bui-navmenu-action').last().getAttribute('href');
			expect(all.endsWith('#/projects'), `all projects goes to the product's page: ${all}`);
			const box = await panel.boundingBox();
			expect(box.x + box.width <= 1440, 'inside the viewport');
			await context.close();
			for (const width of [1440, 390, 320]) {
				// With the product's sections in a sidebar, as the family's products now are: no toggle in the bar.
				const view = await open(browser, consumer, { width, query: '?family=many&sidebar=1024', hasTouch: width < 480, isMobile: width < 480 });
				const part = width < 720 ? 'location' : 'project';
				const button = view.page.locator(`.bui-family [data-part="${part}"]:visible .bui-navmenu-button`);
				if (part === 'project') expect((await button.innerText()).trim() === (spanish ? 'Elegir un proyecto' : 'Choose a project'), `${width}px: the chooser's name`);
				await button.click();
				const field = view.page.locator(`.bui-family [data-part="${part}"]:visible .bui-navmenu-field`);
				expect(await field.isVisible(), `${width}px: twelve projects get a search field`);
				await field.fill('zzz');
				const none = view.page.locator(`.bui-family [data-part="${part}"]:visible .bui-navmenu-none:not([hidden])`);
				expect((await none.count()) === 1 && (await none.innerText()).includes('zzz'), `${width}px: no match is said`);
				await field.fill('ech');
				const shown = await view.page.locator(`.bui-family [data-part="${part}"]:visible .bui-navmenu-section:has(.bui-navmenu-search) li:not([hidden]) > a.bui-navmenu-item:not(.bui-navmenu-action) .bui-navmenu-label`).allInnerTexts();
				expect(shown.length === 1 && shown[0] === 'Échelle', `${width}px: filtered without accents: ${shown}`);
				const fits = await view.page.locator(`.bui-family [data-part="${part}"]:visible .bui-navmenu-panel`).boundingBox();
				expect(fits.x >= 0 && fits.x + fits.width <= width && !(await overflow(view.page)), `${width}px: the menu fits: ${JSON.stringify(fits)}`);
				await view.page.keyboard.press('Escape');
				expect(await button.evaluate(node => node === document.activeElement), `${width}px: Escape returns focus to the button`);
				await view.context.close();
			}
		}
	},
	{
		name: 'profile menu: grouped Accounts pages completed with the product and the way back; Tab past the last entry closes it',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, { query: '?family=annotated&returned=accounts&tab=2' });
			const trigger = page.locator('.bui-family [data-part="account"] .bui-navmenu-button');
			await trigger.focus();
			await page.keyboard.press('Enter');
			const headings = await page.locator('.bui-family [data-part="account"] .bui-navmenu-heading').allInnerTexts();
			expect(headings.some(text => text.startsWith('Northwind Studio · ')), `the organization's group: ${headings}`);
			const hrefs = await page.locator('.bui-family [data-part="account"] a[data-manage]').evaluateAll(nodes => nodes.map(node => node.href));
			expect(hrefs.length === 4, `account, organizations, members and settings: ${hrefs.length}`);
			for (const href of hrefs) {
				const url = new URL(href);
				const back = new URL(url.searchParams.get('return'));
				expect(url.searchParams.get('product') === 'delegate' && back.searchParams.get('returned') === 'accounts' && back.searchParams.get('tab') === '2' && back.searchParams.getAll('returned').length === 1, `completed: ${href}`);
			}
			const path = [];
			for (let step = 0; step < 12 && (await trigger.getAttribute('aria-expanded')) === 'true'; step++) {
				// WebKit, like Safari by default, tabs only to fields; Option+Tab reaches links and buttons.
				await page.keyboard.press(browser.engine === 'webkit' ? 'Alt+Tab' : 'Tab');
				path.push(await page.evaluate(() => `${document.activeElement.tagName}.${document.activeElement.className}`));
			}
			expect((await trigger.getAttribute('aria-expanded')) === 'false', `Tab out of the panel closed it: ${path.join(' > ')}`);
			expect(await page.evaluate(() => !document.activeElement.closest('[data-part="account"]')), 'focus moved on');
		}
	},
	{
		name: 'profile menu: GitHub after the organization’s Accounts pages, at Projects’ address as given, at 1440 and 390 px (0.7.4, PRJ-14)',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			for (const width of [1440, 390]) {
				const { page, context } = await open(browser, consumer, { query: '?family=annotated', width });
				await page.locator('.bui-family [data-part="account"] .bui-navmenu-button').click();
				const group = page.locator('.bui-family [data-part="account"] .bui-navmenu-section').filter({ hasText: 'Northwind Studio · ' });
				const labels = await group.locator('.bui-navmenu-label').allInnerTexts();
				expect(labels.at(-1) === 'GitHub', `${width}px: GitHub last in the organization's group: ${labels}`);
				const entry = page.locator('.bui-family [data-part="account"] a.bui-family-github');
				expect((await entry.getAttribute('href')) === 'https://projects.example.test/?organization=org_north&view=github', `${width}px: as given`);
				expect(await entry.isVisible(), `${width}px: shown`);
				await context.close();
			}
		}
	}
];
