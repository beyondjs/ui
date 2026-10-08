import { expect, overflow } from '../support/browser.mjs';
import { survey } from '../../tests/support/names.mjs';

/**
 * The thread page of 0.11.0 in a real engine, on the `thread.html` pages: the thread tier with a panel
 * whose width is fluid between --layout-aside and --layout-aside-max (and --layout-aside-wide in its wide
 * form) and no band between them; the panel's own head and its hide control; the header's compact line on
 * scroll without layout shift, still under reduced motion; Facts and Meters; the sidebar's ages and
 * count; and the page from 320 to 2560 px in both themes with its icon-only controls named.
 */
const words = {
	en: { details: 'Details', hide: 'Hide Details', title: 'Fix the checkout redirect after a failed payment', near: 'Near the limit', recent: 'Recent' },
	es: { details: 'Detalles', hide: 'Ocultar Detalles', title: 'Corregir la redirección del pago tras un pago fallido', near: 'Cerca del límite', recent: 'Recientes' }
};
const unlabeled = ['close', 'menu', 'more', 'search', 'bell', 'chevron', 'pin', 'minimize', 'maximize', 'restore', 'help', 'user'];
const rem = 16;
const sizes = { aside: 22 * rem, max: 40 * rem, wide: 48 * rem, thread: 52 * rem, form: 40 * rem, gap: 2 * rem };

export async function open(browser, consumer, { width = 1440, height = 900, query = '', ...options } = {}) {
	const view = await browser.open(consumer, { file: 'thread.html', query, viewport: { width, height }, ...options });
	await view.page.waitForSelector('.dock .bui-composer-field');
	await view.page.waitForSelector('.bui-page[data-panel]');
	await view.page.evaluate(() => document.fonts.ready);
	return view;
}
const measure = page =>
	page.evaluate(() => {
		const box = selector => document.querySelector(selector)?.getBoundingClientRect().toJSON() ?? null;
		return { main: box('.bui-page-main'), panel: box('.bui-page-panel'), body: box('.bui-page-body'), mode: document.querySelector('.bui-page').dataset.panel };
	});

export const checks = [
	{
		name: 'thread tier at 1440, 1920 and 2560 px in both themes: the panel beside with its head, fluid between the aside tier and its maximum (40rem since 0.11.2), no band between thread and panel; the wide form takes every width the thread leaves, to the region\'s edge',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			for (const scheme of ['light', 'dark']) {
				for (const width of [1440, 1920, 2560]) {
					const at = `${width}px ${scheme}`;
					const { page, context } = await open(browser, consumer, { width, colorScheme: scheme });
					const found = await measure(page);
					expect(found.mode === 'beside', `${at}: beside, ${found.mode}`);
					expect(found.panel.width >= sizes.aside - 1 && found.panel.width <= sizes.max + 1, `${at}: the panel between its tiers: ${found.panel.width}`);
					expect(Math.abs(found.panel.left - found.main.right - sizes.gap) <= 1.5, `${at}: one gap between thread and panel, no band: ${found.panel.left - found.main.right}`);
					expect(found.main.width <= sizes.thread + 1, `${at}: the thread at most its tier: ${found.main.width}`);
					if (width >= 1920) expect(Math.abs(found.panel.width - sizes.max) <= 1 && Math.abs(found.main.width - sizes.thread) <= 1, `${at}: thread at its tier and the panel at its maximum: ${JSON.stringify(found)}`);
					if (width === 1440) expect(found.panel.width > sizes.aside - 1 && found.main.width < sizes.thread, `${at}: the thread gives first: ${JSON.stringify(found)}`);
					const head = page.locator('.bui-page-panel-head');
					expect((await head.locator('h2').textContent()) === copy.details && (await head.locator('.bui-page-panel-hide').getAttribute('aria-label')) === copy.hide, `${at}: the panel's head`);
					await page.locator('.bui-page-actions .bui-button').first().click();
					await page.waitForFunction(() => document.querySelector('.bui-page').hasAttribute('data-panel-wide'));
					await page.waitForTimeout(50);
					const wide = await measure(page);
					const region = await page.evaluate(() => {
						const frame = document.querySelector('.bui-page-frame');
						const style = getComputedStyle(frame);
						return frame.getBoundingClientRect().right - parseFloat(style.paddingRight);
					});
					const thread = Math.min(sizes.thread, Math.max(sizes.aside, wide.body.width - sizes.gap - sizes.wide));
					expect(Math.abs(wide.main.width - thread) <= 1.5, `${at}: the thread keeps its tier where it can, giving down to the aside tier: ${wide.main.width} for ${thread}`);
					expect(Math.abs(wide.panel.right - region) <= 1.5, `${at}: the wide panel reaches the region's far edge: ${wide.panel.right} for ${region}`);
					expect(wide.panel.width >= Math.min(sizes.wide, wide.body.width - sizes.aside - sizes.gap) - 1.5, `${at}: the wide panel takes at least its tier: ${wide.panel.width}`);
					expect(!(await overflow(page)), `${at}: no sideways scroll`);
					await context.close();
				}
			}
		}
	},
	{
		name: 'panel head by keyboard: Hide hides it with focus on Details, Details shows it again; below the cut the sheet shows its own head',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			const { page } = await open(browser, consumer);
			const hide = page.locator('.bui-page-panel-hide');
			await hide.focus();
			await page.keyboard.press('Enter');
			await page.locator('.bui-page-panel').waitFor({ state: 'hidden' });
			const toggle = page.locator('.bui-page-actions .bui-button', { hasText: copy.details });
			expect(await toggle.evaluate(node => document.activeElement === node), 'focus on the toggle');
			expect((await toggle.getAttribute('aria-expanded')) === 'false', 'the toggle says it is hidden');
			await page.keyboard.press('Enter');
			await page.locator('.bui-page-panel').waitFor();
			expect(await page.evaluate(() => window.fixture.log.join(',')).then(log => log.includes('panel:false') && log.includes('panel:true')), 'each choice reported');
			await page.setViewportSize({ width: 1100, height: 900 });
			await page.waitForFunction(() => document.querySelector('.bui-page').dataset.panel === 'sheet');
			await toggle.click();
			const sheet = page.locator('dialog.bui-sheet[open]');
			await sheet.waitFor();
			expect((await sheet.locator('.bui-page-panel-head').count()) === 0 && (await sheet.locator('.bui-sheet-close').count()) === 1, 'the sheet has its own head and Close');
			await page.keyboard.press('Escape');
		}
	},
	{
		name: 'compact header at 1440 and 390 px in both themes: one line under the family bar once the title is out, the panel under it, nothing shifts; none at the top; still under reduced motion',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			for (const [width, motion] of [[1440, 'no-preference'], [390, 'reduce']]) {
				for (const scheme of ['light', 'dark']) {
					const at = `${width}px ${scheme} ${motion}`;
					const { page, context } = await open(browser, consumer, { width, colorScheme: scheme, reducedMotion: motion });
					const place = () => page.evaluate(() => document.querySelector('#thread').getBoundingClientRect().top + window.scrollY);
					const before = await place();
					expect(!(await page.locator('.bui-page-compact[data-shown]').count()), `${at}: no compact line at the top`);
					await page.evaluate(() => window.scrollTo(0, 700));
					await page.waitForSelector('.bui-page-compact[data-shown]', { state: 'attached' });
					await page.waitForTimeout(250);
					const found = await page.evaluate(() => {
						const line = document.querySelector('.bui-page-compact-line');
						const box = line.getBoundingClientRect();
						const panel = document.querySelector('.bui-page-panel:not([hidden])')?.getBoundingClientRect() ?? null;
						const style = getComputedStyle(line);
						return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, visible: style.visibility, opacity: style.opacity, transition: style.transitionDuration, title: line.querySelector('.bui-page-compact-title').textContent, status: line.querySelector('.bui-page-compact-status').textContent.trim(), panel, under: document.querySelector('.bui-sidebar[data-mode="drawer"]')?.getBoundingClientRect().bottom ?? 44 };
					});
					expect(Math.abs(found.top - found.under) <= 1.5, `${at}: right under the family bar (and the sidebar's row below its cut): ${found.top} for ${found.under}`);
					expect(found.visible === 'visible' && found.opacity === '1', `${at}: shown: ${JSON.stringify(found)}`);
					expect(found.title === copy.title && found.status, `${at}: the title and the status`);
					if (found.panel) expect(found.panel.top >= found.bottom - 1, `${at}: the panel under the line: ${found.panel.top} < ${found.bottom}`);
					if (motion === 'reduce') expect(found.transition.split(',').every(value => parseFloat(value) === 0), `${at}: no motion: ${found.transition}`);
					expect(Math.abs((await place()) - before) <= 0.5, `${at}: nothing shifted`);
					expect(!(await overflow(page)), `${at}: no sideways scroll`);
					await page.evaluate(() => window.scrollTo(0, 0));
					await page.waitForFunction(() => !document.querySelector('.bui-page-compact[data-shown]'));
					await context.close();
				}
			}
		}
	},
	{
		name: 'Facts and Meters: values at the row\'s end, identifiers monospaced, a narrow box puts values under their labels; a meter in words with its values; a stale one muted',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			for (const scheme of ['light', 'dark']) {
				const { page, context } = await open(browser, consumer, { colorScheme: scheme });
				const found = await page.evaluate(() => {
					const row = document.querySelector('.bui-page-panel .bui-facts-row');
					const box = node => node.getBoundingClientRect();
					const narrow = document.querySelector('#narrow .bui-facts-row');
					const meters = [...document.querySelectorAll('.bui-page-panel [role="meter"]')].map(node => ({ now: node.getAttribute('aria-valuenow'), text: node.getAttribute('aria-valuetext'), name: document.getElementById(node.getAttribute('aria-labelledby'))?.textContent, stale: node.closest('.bui-meter').hasAttribute('data-stale'), opacity: getComputedStyle(node.querySelector('.bui-meter-fill')).opacity, word: node.closest('.bui-meter').querySelector('.bui-meter-word:not([hidden])')?.textContent ?? null }));
					return { end: box(row).right - box(row.querySelector('.bui-facts-data')).right, mono: getComputedStyle(row.querySelector('.bui-facts-value')).fontFamily, under: box(narrow.querySelector('dd')).top >= box(narrow.querySelector('dt')).bottom - 1, meters };
				});
				expect(Math.abs(found.end) <= 1, `${scheme}: the value and its action at the row's end: ${found.end}`);
				expect(/mono|Menlo|Consolas|SF Mono/i.test(found.mono), `${scheme}: monospaced: ${found.mono}`);
				expect(found.under, `${scheme}: a narrow box wraps the value under its label`);
				const [near, week] = found.meters;
				expect(near.now === '86' && near.word === copy.near && near.text.includes(copy.near) && near.name, `${scheme}: the level in words: ${JSON.stringify(near)}`);
				expect(week.stale && parseFloat(week.opacity) < 1, `${scheme}: a stale meter muted: ${JSON.stringify(week)}`);
				await context.close();
			}
		}
	},
	{
		name: "sidebar entries end with their age on one line and say the moment on hover; a group's count beside its heading",
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			const { page } = await open(browser, consumer);
			const nav = page.locator('.bui-sidebar-panel nav');
			const found = await nav.evaluate(node => [...node.querySelectorAll('.bui-sidebar-entry')].map(entry => {
				const age = entry.querySelector('.bui-sidebar-age');
				const box = entry.getBoundingClientRect();
				return { age: age?.querySelector('[aria-hidden]').textContent, inside: age ? age.getBoundingClientRect().right <= box.right + 0.5 : false, line: Math.abs(age.getBoundingClientRect().top + age.getBoundingClientRect().height / 2 - (box.top + box.height / 2)) <= 2, datetime: age?.getAttribute('datetime') };
			}));
			expect(found.length === 4 && found.every(entry => entry.age && entry.inside && entry.line && entry.datetime), `ages at the entries' end: ${JSON.stringify(found)}`);
			const heading = nav.locator('.bui-sidebar-heading', { hasText: copy.recent });
			expect((await heading.locator('.bui-sidebar-count').textContent()) === '12' && (await heading.locator('.bui-sidebar-count').isVisible()), 'the count beside the heading');
			await nav.locator('.bui-sidebar-entry').nth(1).hover();
			const tip = page.locator('.bui-tooltip:not([hidden])');
			await tip.waitFor();
			expect(/20\d\d/.test(await tip.textContent()), `the full moment on hover: ${await tip.textContent()}`);
		}
	},
	{
		name: 'thread page from 320 to 2560 px in both themes: no sideways scroll, and every icon-only control named with its tooltip, a chip\'s Remove included',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const scheme of ['light', 'dark']) {
				for (const width of [320, 390, 768, 1440, 2560]) {
					const at = `${width}px ${scheme}`;
					const { page, context } = await open(browser, consumer, { width, colorScheme: scheme });
					await page.evaluate(() => window.fixture.attach([{ key: 'a', name: 'a-rather-long-screenshot-name-of-the-checkout.png', size: 120_000, state: 'failed', reason: 'Larger than 10 MB' }]));
					await page.waitForSelector('.bui-composer-file');
					expect(!(await overflow(page)), `${at}: no sideways scroll`);
					const bare = (await page.evaluate(survey, true)).filter(control => control.bare);
					expect(bare.some(control => /a-rather-long/.test(control.name)), `${at}: the chip's Remove is surveyed`);
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
