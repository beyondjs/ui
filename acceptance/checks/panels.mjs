import { expect, overflow } from '../support/browser.mjs';
import { survey } from '../../tests/support/names.mjs';

/**
 * The Sidebar's entries and search and the Page's panel kept in view (0.10.0) in a real engine, on the
 * `conversation.html` pages: entries patched without moving focus, the bounded search's states, the
 * drawer showing the same; the panel beside and sticky from 73rem, hidden by its toggle, a side sheet
 * below; and the page at 320 to 1440 px in both themes with its icon-only controls named.
 */
const words = {
	en: { needs: 'Needs you', recent: 'Recent', long: 'Upgrade the build to the latest toolchain and explain every warning it prints along the way', count: '1 result', none: 'Nothing matches “zzz”.', unavailable: 'The search didn’t answer, so results can’t be listed now.', retry: 'Try again', details: 'Details', action: 'New conversation', searching: 'Searching…' },
	es: { needs: 'Te espera', recent: 'Recientes', long: 'Upgrade the build to the latest toolchain and explain every warning it prints along the way', count: '1 resultado', none: 'Nada coincide con «zzz».', unavailable: 'La búsqueda no respondió, así que ahora no se pueden mostrar resultados.', retry: 'Reintentar', details: 'Detalles', action: 'Nueva conversación', searching: 'Buscando…' }
};
const unlabeled = ['close', 'menu', 'more', 'search', 'bell', 'chevron', 'pin', 'minimize', 'maximize', 'restore', 'help', 'user'];

async function open(browser, consumer, { width = 1440, height = 900, query = '', ...options } = {}) {
	const view = await browser.open(consumer, { file: 'conversation.html', query, viewport: { width, height }, ...options });
	await view.page.waitForSelector('.bui-sidebar-entry', { state: 'attached' });
	await view.page.waitForSelector('.dock .bui-composer-field');
	await view.page.evaluate(() => document.fonts.ready);
	return view;
}
const search = async (page, text) => {
	const field = page.locator('.bui-sidebar-panel input[type="search"]');
	await field.fill(text);
	return field;
};

export const checks = [
	{
		name: 'sidebar entries at 1440 px: one line each with a mark in words, a cut title whole on hover; a live change patches by key without moving focus or redrawing',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			const { page } = await open(browser, consumer);
			const nav = page.locator('.bui-sidebar-panel nav');
			const headings = await nav.locator('.bui-sidebar-heading').allTextContents();
			expect(headings.includes(copy.needs) && headings.includes(copy.recent), `the entries' headings: ${headings}`);
			expect((await nav.locator('.bui-sidebar-action').textContent()).trim() === copy.action, 'the top action');
			const long = nav.locator('.bui-sidebar-entry', { hasText: copy.long.slice(0, 20) });
			const shape = await long.evaluate(node => {
				const label = node.querySelector('.bui-sidebar-label');
				const box = label.getBoundingClientRect();
				return { cut: label.scrollWidth > label.clientWidth + 1, lines: Math.round(box.height / parseFloat(getComputedStyle(label).lineHeight)), inside: node.getBoundingClientRect().right <= document.querySelector('.bui-sidebar-panel').getBoundingClientRect().right, mark: node.querySelector('.bui-sidebar-mark')?.textContent };
			});
			expect(shape.cut && shape.lines === 1 && shape.inside && shape.mark, `one cut line inside the sidebar, with its mark: ${JSON.stringify(shape)}`);
			await long.hover();
			const tip = page.locator('.bui-tooltip:not([hidden])');
			await tip.waitFor();
			expect((await tip.textContent()) === copy.long, 'the whole title on hover');
			await page.evaluate(() => (window.kept = document.querySelector('.bui-sidebar-panel nav')));
			const focused = nav.locator('.bui-sidebar-entry').nth(3);
			const text = await focused.locator('.bui-sidebar-label').textContent();
			await focused.focus();
			await page.evaluate(() => window.fixture.update());
			await page.waitForFunction(() => document.querySelector('.bui-sidebar-panel .bui-sidebar-mark[data-tone="progress"]'));
			const after = await page.evaluate(() => ({ same: window.kept === document.querySelector('.bui-sidebar-panel nav'), active: document.activeElement.querySelector?.('.bui-sidebar-label')?.textContent, entries: document.querySelectorAll('.bui-sidebar-panel .bui-sidebar-entry').length }));
			expect(after.same && after.active === text && after.entries === 6, `patched, focus kept on "${text}": ${JSON.stringify(after)}`);
		}
	},
	{
		name: 'sidebar search: searching, results with a polite count, no match, unavailable with Try again and past its bound, Escape clears, Enter opens all results',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			const { page } = await open(browser, consumer);
			const nav = page.locator('.bui-sidebar-panel nav');
			const field = await search(page, 'check');
			await nav.locator('.bui-sidebar-results .bui-sidebar-entry').first().waitFor();
			expect(await nav.locator('.bui-sidebar-groups').isHidden(), 'the results take the groups\' place');
			expect((await nav.locator('.bui-announcer').textContent()) === copy.count, `a polite count: ${await nav.locator('.bui-announcer').textContent()}`);
			expect((await nav.locator('.bui-announcer').getAttribute('aria-live')) === 'polite', 'polite');
			await field.press('Enter');
			await page.waitForFunction(() => window.fixture.log.includes('navigate:#/conversations?q=check'));
			await field.press('Escape');
			expect((await field.inputValue()) === '' && (await nav.locator('.bui-sidebar-groups').isVisible()), 'Escape clears and the groups come back');
			await search(page, 'zzz');
			await nav.locator('.bui-sidebar-line', { hasText: copy.none }).waitFor();
			for (const mode of ['fail', 'slow']) {
				const view = await open(browser, consumer, { query: `?search=${mode}` });
				await search(view.page, 'check');
				if (mode === 'slow') await view.page.locator('.bui-sidebar-panel .bui-sidebar-line', { hasText: copy.searching }).waitFor({ timeout: 1000 });
				await view.page.locator('.bui-sidebar-panel .bui-sidebar-line', { hasText: copy.unavailable }).waitFor({ timeout: 4000 });
				expect(await view.page.locator('.bui-sidebar-panel .bui-sidebar-retry').isVisible(), `${mode}: Try again`);
				await view.page.locator('.bui-sidebar-panel .bui-sidebar-retry').click();
				await view.page.waitForFunction(() => window.fixture.log.filter(entry => entry === 'search:check').length === 2);
				await view.page.locator('.bui-sidebar-panel .bui-sidebar-line', { hasText: copy.unavailable }).waitFor({ timeout: 4000 });
				await view.context.close();
			}
		}
	},
	{
		name: 'sidebar drawer at 390 px shows the same entries, action and search, and the row keeps its fixed section name',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			const { page } = await open(browser, consumer, { width: 390, height: 844 });
			await page.locator('.bui-sidebar-button').click();
			const dialog = page.locator('dialog.bui-drawer[open]');
			await dialog.waitFor();
			expect((await dialog.locator('.bui-sidebar-entry').count()) === 5, 'the same entries');
			expect((await dialog.locator('.bui-sidebar-action').textContent()).trim() === copy.action, 'the same action');
			await dialog.locator('input[type="search"]').fill('check');
			await dialog.locator('.bui-sidebar-results .bui-sidebar-entry').first().waitFor();
			await dialog.locator('input[type="search"]').press('Escape');
			expect(await dialog.isVisible(), 'Escape with a query clears it and keeps the drawer');
			await page.keyboard.press('Escape');
			await dialog.waitFor({ state: 'detached' }).catch(() => undefined);
			expect(!(await page.locator('dialog.bui-drawer[open]').count()), 'a second Escape closes the drawer');
			expect(!(await overflow(page)), 'no sideways scroll');
		}
	},
	{
		name: 'page panel: beside and sticky from 73rem with its own scroll, hidden and shown by its toggle; below the cut a side sheet with focus in and back; crossing the cut; both themes',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			for (const scheme of ['light', 'dark']) {
				const { page, context } = await open(browser, consumer, { width: 1440, colorScheme: scheme });
				const toggle = page.getByRole('button', { name: copy.details, exact: true });
				const aside = page.locator('.bui-page-panel');
				const place = () => aside.evaluate(node => ({ shown: !node.hidden, top: node.getBoundingClientRect().top, left: node.getBoundingClientRect().left, main: document.querySelector('.bui-page-main').getBoundingClientRect().right, scroll: getComputedStyle(node).overflowY, sticky: getComputedStyle(node).position }));
				let found = await place();
				expect(found.shown && found.left >= found.main && found.sticky === 'sticky' && found.scroll === 'auto', `${scheme}: beside, sticky, its own scroll: ${JSON.stringify(found)}`);
				expect((await toggle.getAttribute('aria-expanded')) === 'true', 'the toggle says it is shown');
				await page.mouse.wheel(0, 700);
				await page.waitForFunction(() => scrollY > 300);
				const top = (await place()).top;
				expect(Math.abs(top - found.top) <= 1 || Math.abs(top - 68) <= 2, `${scheme}: it stays in view while the page scrolls: ${top}`);
				await toggle.click();
				found = await place();
				expect(!found.shown && (await toggle.getAttribute('aria-expanded')) === 'false', `${scheme}: hidden by its toggle`);
				expect(await page.evaluate(() => window.fixture.log.includes('panel:false')), 'the choice is reported');
				await toggle.click();
				expect((await place()).shown, 'shown again');
				await context.close();
			}
			const { page } = await open(browser, consumer, { width: 1280 });
			const toggle = page.getByRole('button', { name: copy.details, exact: true });
			expect(await page.locator('.bui-page-panel').isHidden(), 'below the cut it is out of the flow');
			expect((await toggle.getAttribute('aria-expanded')) === 'false', 'and the toggle says so');
			await toggle.click();
			const sheet = page.locator('dialog.bui-sheet[open]');
			await sheet.waitFor();
			expect((await sheet.locator('.facts').count()) === 3 && (await toggle.getAttribute('aria-expanded')) === 'true', 'its content opens in a side sheet');
			expect(await sheet.evaluate(node => node.contains(document.activeElement)), 'focus moves into the sheet');
			await page.keyboard.press('Escape');
			await sheet.waitFor({ state: 'detached' }).catch(() => undefined);
			expect(await toggle.evaluate(node => document.activeElement === node), 'focus returns to the toggle');
			await toggle.click();
			await page.locator('dialog.bui-sheet[open]').waitFor();
			await page.setViewportSize({ width: 1440, height: 900 });
			await page.waitForFunction(() => document.querySelector('.bui-page').dataset.panel === 'beside');
			expect(!(await page.locator('dialog.bui-sheet[open]').count()) && (await page.locator('.bui-page-panel').isVisible()), 'crossing the cut closes the sheet and shows the panel beside');
		}
	},
	{
		name: 'page panel decided before its first frame: placed by mount() or by the product itself, a sheet in a region below its cut in a wider window (1280 px), beside at 1440 px',
		consumers: ['dom'],
		async run(browser, consumer) {
			// The panel's mode in the first frame after the page enters the document
			const prepare = context => context.addInitScript(() => {
				window.placements = [];
				new MutationObserver(records => {
					for (const node of records.flatMap(record => [...record.addedNodes])) {
						const page = node.nodeType === 1 ? (node.matches('.bui-page') ? node : node.querySelector('.bui-page')) : null;
						if (page) requestAnimationFrame(() => window.placements.push(page.dataset.panel ?? null));
					}
				}).observe(document, { childList: true, subtree: true });
			});
			for (const [width, mode] of [[1280, 'sheet'], [1440, 'beside']]) {
				for (const place of ['element', 'mount']) {
					const { page, context } = await open(browser, consumer, { width, query: `?place=${place}`, prepare });
					await page.waitForFunction(() => window.placements.length > 0);
					const first = await page.evaluate(() => window.placements[0]);
					expect(first === mode, `${width} px, placed by ${place}: its first frame drew it ${first}, not ${mode}`);
					await context.close();
				}
			}
		}
	},
	{
		name: 'conversation page from 320 to 1440 px in both themes: no sideways scroll, and every icon-only control named with its tooltip',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const scheme of ['light', 'dark']) {
				for (const width of [320, 390, 768, 1024, 1440]) {
					const at = `${width}px ${scheme}`;
					const { page, context } = await open(browser, consumer, { width, colorScheme: scheme });
					expect(!(await overflow(page)), `${at}: no sideways scroll`);
					const bare = (await page.evaluate(survey, true)).filter(control => control.bare);
					for (const control of bare) {
						expect(control.name && control.hint, `${at}: icon-only ${control.describe} named with a tooltip`);
						expect(control.glyphs.every(name => unlabeled.includes(name)), `${at}: ${control.describe} shows ${control.glyphs} alone`);
					}
					await context.close();
				}
			}
		}
	}
];
