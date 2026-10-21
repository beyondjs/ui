import { expect, overflow } from '../support/browser.mjs';

const style = (page, selector) => page.locator(selector).first().evaluate(node => {
	const paint = getComputedStyle(node);
	return { size: parseFloat(paint.fontSize), weight: paint.fontWeight, color: paint.color, underline: paint.textDecorationLine.includes('underline'), box: node.getBoundingClientRect().toJSON() };
});
/** The Hierarchy warning waits a second after the last change before it checks (0.19.0) */
const settle = page => page.waitForTimeout(1400);

export const checks = [
	{
		name: 'shared hierarchy: Products, notifications and profile align title roles and distinguish section labels in both themes',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const colorScheme of ['light', 'dark']) for (const width of [1440, 390, 320]) {
				const { page, context } = await browser.open(consumer, { file: 'family.html', query: '?family=annotated', viewport: { width, height: 844 }, colorScheme, reducedMotion: 'reduce' });
				try {
					await page.evaluate(() => document.fonts.ready);
					await page.locator('.bui-family-product > button').click();
					const products = await style(page, '.bui-family-product .bui-navmenu-heading');
					const row = await style(page, '.bui-family-product .bui-navmenu-item');
					expect(products.size > row.size && products.weight === '600', 'Products is a semibold title above regular rows (D158)');
					await page.keyboard.press('Escape');
					await page.locator('.bui-family .bui-disclosure-bell').click();
					await page.locator('.bui-notify-title').waitFor();
					const notices = await style(page, '.bui-notify-title');
					expect(notices.size === products.size && notices.weight === products.weight, 'notification and Products titles use the same role');
					await page.keyboard.press('Escape');
					await page.locator('.bui-family-account > button').click();
					const person = await style(page, '.bui-family-name');
					const group = await style(page, '.bui-family-account .bui-navmenu-section:nth-child(2) > .bui-navmenu-heading');
					expect(person.size === products.size && person.weight === products.weight, 'the account identity shares the title role');
					expect(group.size < person.size && group.color !== person.color, 'section labels stay quieter than the identity');
					const menu = await page.locator('.bui-family-account .bui-navmenu-panel').boundingBox();
					expect(menu.x >= 0 && menu.x + menu.width <= width + 1, 'profile remains in the viewport');
				} finally { await context.close(); }
			}
		}
	},
	{
		name: 'shared hierarchy: Unavailable keeps a compact icon beside its heading and aligned readable body and actions at narrow widths',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			for (const colorScheme of ['light', 'dark']) for (const width of [1440, 390, 320]) {
				const { page, context } = await browser.open(consumer, { file: 'family.html', viewport: { width, height: 844 }, colorScheme, reducedMotion: 'reduce' });
				try {
					const card = page.locator('.bui-unavailable');
					await card.scrollIntoViewIfNeeded();
					const title = await style(page, '.bui-unavailable-title');
					const body = await style(page, '.bui-unavailable-reason');
					const icon = await style(page, '.bui-unavailable-icon');
					const actions = await style(page, '.bui-unavailable-actions');
					expect(title.size > body.size && title.weight === '600' && body.weight === '400', 'the heading is semibold above the body (D158)');
					expect(title.color === body.color, 'the title keeps the readable text contrast');
					expect(Math.abs(title.box.left - body.box.left) < 1 && Math.abs(title.box.left - actions.box.left) < 1, 'body and action align with the heading');
					expect(title.box.left - icon.box.right <= 12.5 && title.box.left >= icon.box.right, 'the icon sits close to the heading');
					expect(Math.abs(icon.box.top + icon.box.height / 2 - (title.box.top + 19 * 1.4 / 2)) <= 2, 'icon aligns with the first heading line');
					expect(!(await overflow(page)), 'the wrapped card does not widen the page');
				} finally { await context.close(); }
			}
		}
	}
,
	{
		name: 'shared hierarchy: a side sheet steps down the scale from its title to its sections, their text and labels, its ways on are one quiet line, and a dialog\'s title is semibold above its body (D158)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const colorScheme of ['light', 'dark']) for (const width of [1440, 390]) {
				const { page, context } = await browser.open(consumer, { file: 'hierarchy.html', viewport: { width, height: 900 }, colorScheme, reducedMotion: 'reduce' });
				try {
					await page.evaluate(() => document.fonts.ready);
					await page.evaluate(() => void (window.fixture.sheet ? window.fixture.sheet.open() : window.fixture.show('sheet')));
					await page.locator('.bui-sheet[open] .bui-section-title').first().waitFor();
					const at = `${width} px ${colorScheme}`;
					const title = await style(page, '.bui-sheet[open] .bui-sheet-title');
					const section = await style(page, '.bui-sheet[open] .bui-section-title');
					const body = await style(page, '.bui-sheet[open] .bui-section-body > p:not(.fixture-note)');
					const label = await style(page, '.bui-sheet[open] .bui-meter-label');
					const note = await style(page, '.bui-sheet[open] .fixture-note');
					const way = await style(page, '.bui-sheet[open] .bui-action-line-actions a');
					expect(title.size === 19 && title.weight === '600', `${at}: the sheet's title is the panel's title-2, semibold (${title.size} px, ${title.weight})`);
					expect(section.size === 16 && section.weight === '600', `${at}: a section at level 3 is title-3, semibold (${section.size} px, ${section.weight})`);
					expect(body.size === 15 && body.weight === '400', `${at}: a section's sentence is body text (${body.size} px, ${body.weight})`);
					expect(title.size > section.size && section.size > body.size && body.size > label.size && label.size <= note.size, `${at}: every step is below the one that names it (${title.size}, ${section.size}, ${body.size}, ${label.size}, ${note.size})`);
					expect(section.color === body.color && label.color !== body.color, `${at}: headings in the text colour, labels muted`);
					expect(way.size < body.size && !way.underline && way.color === label.color, `${at}: ways on are one quiet line, smaller than the text, muted and not underlined at rest`);
					expect(!(await overflow(page)), `${at}: the sheet does not widen the page`);
					await page.keyboard.press('Escape');
					await page.evaluate(() => void (window.fixture.dialog ? window.fixture.dialog.open() : window.fixture.show('dialog')));
					await page.locator('.bui-dialog[open] .bui-dialog-title').waitFor();
					const heading = await style(page, '.bui-dialog[open] .bui-dialog-title');
					const text = await style(page, '.bui-dialog[open] .bui-dialog-body p, .bui-dialog[open] p:not(.bui-dialog-description)');
					expect(heading.size > text.size && heading.weight === '600' && text.weight === '400', `${at}: the dialog's title is semibold above its body (${heading.size}/${heading.weight} over ${text.size}/${text.weight})`);
					await page.keyboard.press('Escape');
				} finally { await context.close(); }
			}
		}
	},
	{
		name: 'shared hierarchy: a development build names a heading its region outranks, once, and the shared sheet, sections and dialog draw none (D158)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page, context } = await browser.open(consumer, { file: 'hierarchy.html', viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
			try {
				await page.evaluate(() => document.fonts.ready);
				await page.evaluate(() => void (window.fixture.sheet ? window.fixture.sheet.open() : window.fixture.show('sheet')));
				await page.locator('.bui-sheet[open] .bui-section-title').first().waitFor();
				await settle(page);
				await page.keyboard.press('Escape');
				await page.evaluate(() => void (window.fixture.dialog ? window.fixture.dialog.open() : window.fixture.show('dialog')));
				await page.locator('.bui-dialog[open]').waitFor();
				await settle(page);
				await page.keyboard.press('Escape');
				const clean = await page.evaluate(() => [...window.fixture.warnings]);
				expect(clean.length === 0, `the shared parts were named: ${clean.join(' | ')}`);
				if (consumer.name !== 'dom') return;
				await page.evaluate(() => void window.fixture.wrong.open());
				await page.locator('.bui-sheet[open] .fixture-eyebrow').first().waitFor();
				await settle(page);
				const named = await page.evaluate(() => [...window.fixture.warnings]);
				expect(named.length === 2, `two eyebrow headings, ${named.length} warnings: ${named.join(' | ')}`);
				expect(named.some(message => message.includes('the heading "Load" is 500')) && named.some(message => message.includes('the heading "Work on it" is 500')), `the warnings name the headings: ${named.join(' | ')}`);
				await page.evaluate(() => {
					for (const node of document.querySelectorAll('.bui-sheet[open] .fixture-eyebrow')) node.style.fontWeight = '600';
				});
				await settle(page);
				const again = await page.evaluate(() => [...window.fixture.warnings]);
				expect(again.length === 2, `a heading is named once: ${again.length} warnings`);
			} finally { await context.close(); }
		}
	}
];
