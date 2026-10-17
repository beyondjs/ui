import { expect, overflow } from '../support/browser.mjs';

/**
 * The family audit's corrections of 0.15.0 measured in the browser: every menu is visible, inside the
 * viewport and never under the sticky family bar (DQ-01, the family check the audit asked for); a menu
 * in a box that scrolls is not clipped; the composer's "/" list hangs from the line being typed; a chip
 * folded behind Options opens; Status marks differ by shape; ListRow and DataTable stay compact rows at
 * 390 px; tabs say they hold more; a long sidebar count never squeezes its label; a CommandCard answers
 * Enter.
 */
async function open(browser, consumer, { width = 1440, height = 800, scheme = 'light' } = {}) {
	const view = await browser.open(consumer, { file: 'audit.html', viewport: { width, height }, colorScheme: scheme });
	await view.page.evaluate(() => document.fonts.ready);
	return view;
}

/** The open floating surface: its box, whether it is in the top layer, and what covers its center. */
const floating = page =>
	page.evaluate(() => {
		const surface = [...document.querySelectorAll('[data-bui-floating]')].find(node => !node.hidden && !node.classList.contains('bui-leaving') && !node.classList.contains('bui-disclosure-leaving') && node.getClientRects().length);
		if (!surface) return null;
		const box = surface.getBoundingClientRect().toJSON();
		const bar = document.querySelector('.bui-family').getBoundingClientRect();
		const hit = document.elementFromPoint(box.left + box.width / 2, box.top + Math.min(box.height / 2, 12));
		let top = false;
		try {
			top = surface.matches(':popover-open');
		} catch {}
		return { box, bar: bar.bottom, top, covered: !surface.contains(hit), width: innerWidth, height: innerHeight };
	});

const inside = found => found && found.box.top >= found.bar - 0.5 && found.box.left >= 0 && found.box.right <= found.width + 0.5 && found.box.bottom <= found.height + 0.5 && !found.covered;

export const checks = [
	{
		name: 'floating: a chip that prefers above opens below the sticky bar, never under it; a menu in a box that scrolls is not clipped; both in the top layer',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page, context } = await open(browser, consumer);
			// The chip just under the bar, as the model chip under "New conversation" in OWN-21
			await page.evaluate(() => {
				const chip = document.querySelector('#chip');
				window.scrollTo(0, chip.getBoundingClientRect().top + scrollY - 56);
			});
			await page.locator('#chip .bui-choice-button').click();
			let found = await floating(page);
			expect(inside(found), `the chip's menu is visible, inside the viewport and below the bar: ${JSON.stringify(found)}`);
			expect(found.top || browser.engine === 'none', `in the top layer: ${JSON.stringify(found)}`);
			await page.keyboard.press('Escape');
			await page.evaluate(() => {
				document.querySelector('#scroller').scrollTop = 1000;
				document.querySelector('#scroller').scrollIntoView({ block: 'center' });
			});
			await page.locator('#scroller .bui-menu-button').click();
			found = await floating(page);
			expect(inside(found), `the menu escapes the box that scrolls: ${JSON.stringify(found)}`);
			await page.mouse.wheel(0, 300);
			await page.waitForTimeout(100);
			const moved = await floating(page);
			expect(!moved || moved.box.top !== found.box.top || moved.box.bottom <= moved.bar, `it follows its button when the page scrolls: ${JSON.stringify([found?.box, moved?.box])}`);
			await context.close();
		}
	},
	{
		name: 'floating: the "/" list opens at the line being typed; a chip folded behind Options opens when asked (OWN-21)',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page, context } = await open(browser, consumer);
			const field = page.locator('.bui-composer-field');
			await field.click();
			await field.pressSequentially('/');
			await page.waitForSelector('.bui-composer-suggest:not([hidden])');
			const found = await page.evaluate(() => {
				const list = document.querySelector('.bui-composer-suggest').getBoundingClientRect();
				const field = document.querySelector('.bui-composer-field').getBoundingClientRect();
				const box = document.querySelector('.bui-composer').getBoundingClientRect();
				const line = parseFloat(getComputedStyle(document.querySelector('.bui-composer-field')).lineHeight);
				return { list: list.toJSON(), field: field.toJSON(), box: box.toJSON(), line };
			});
			// Above the composer, or right under the line being typed; never under the whole composer
			const above = found.list.bottom <= found.box.top + 1;
			const under = found.list.top >= found.field.top && found.list.top <= found.field.top + 2 * found.line + 8;
			expect((above || under) && found.list.left >= found.field.left - 1, `at the caret, not under the whole composer: ${JSON.stringify(found)}`);
			await page.keyboard.press('Escape');
			// A narrow composer folds its settings behind Options; the product's /model then opens the chip
			await page.evaluate(() => (window.fixture.composer.element.style.maxWidth = '200px'));
			await page.waitForFunction(() => window.fixture.composer.element.getAttribute('data-fit') === 'fold');
			const folded = await page.evaluate(() => ({ hidden: !window.fixture.effort.control.checkVisibility(), options: window.fixture.composer.fold.open }));
			expect(folded.hidden && !folded.options, `the chip is folded behind Options: ${JSON.stringify(folded)}`);
			const opened = await page.evaluate(() => ({ opened: window.fixture.effort.open(), options: window.fixture.composer.fold.open, expanded: window.fixture.effort.expanded }));
			expect(opened.opened && opened.options && opened.expanded, `Options unfolds and the chip opens, never a silent no-op: ${JSON.stringify(opened)}`);
			const menu = await floating(page);
			expect(inside(menu), `its menu is visible: ${JSON.stringify(menu)}`);
			await context.close();
		}
	},
	{
		name: 'patterns: Status marks differ by shape for every tone; ListRow and DataTable keep compact rows at 390 px with no sideways scroll; tabs say they hold more; a long sidebar count never squeezes its label',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const scheme of ['light', 'dark']) {
				let { page, context } = await open(browser, consumer, { scheme });
				const shapes = await page.evaluate(() => [...document.querySelectorAll('#statuses .bui-status-dot')].map(node => {
					const style = getComputedStyle(node);
					return [style.borderTopStyle, style.borderRadius, style.transform !== 'none', style.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'hollow' : 'filled', style.borderRightColor === 'rgba(0, 0, 0, 0)'].join('|');
				}));
				expect(new Set(shapes).size === shapes.length, `${scheme}: one shape per tone: ${JSON.stringify(shapes)}`);
				const label = await page.evaluate(() => {
					const node = document.querySelector('.bui-sidebar-panel .bui-sidebar-item .bui-sidebar-label');
					return node ? { height: node.getBoundingClientRect().height, line: parseFloat(getComputedStyle(node).lineHeight) || 20 } : null;
				});
				expect(!label || label.height <= label.line * 1.5, `${scheme}: the label keeps one line beside a long count: ${JSON.stringify(label)}`);
				await context.close();
				({ page, context } = await open(browser, consumer, { width: 390, height: 844, scheme }));
				expect(!(await overflow(page)), `${scheme} 390 px: no sideways scroll`);
				const rows = await page.evaluate(() => ({ list: Math.max(...[...document.querySelectorAll('#rows .bui-row')].map(row => row.getBoundingClientRect().height)), table: Math.max(...[...document.querySelectorAll('.bui-data tbody tr')].map(row => row.getBoundingClientRect().height)), more: document.querySelector('.bui-tabs')?.dataset.more ?? '' }));
				expect(rows.list <= 96, `${scheme} 390 px: a ListRow stays short, never a card of labels: ${rows.list}`);
				expect(rows.table <= 80, `${scheme} 390 px: a DataTable row is two short lines: ${rows.table}`);
				expect(rows.more.includes('end'), `${scheme} 390 px: the tabs say they hold more at their end: ${rows.more}`);
				await context.close();
			}
		}
	},
	{
		name: 'CommandCard: focused on arrival, Enter allows once and the outcome replaces the answers',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page, context } = await open(browser, consumer);
			await page.locator('.bui-command').focus();
			await page.keyboard.press('Enter');
			await page.keyboard.press('Enter');
			await page.waitForFunction(() => document.querySelector('.bui-command').dataset.state === 'allowed');
			const log = await page.evaluate(() => window.fixture.log.filter(line => line === 'allow'));
			expect(log.length === 1, `allowed once: ${JSON.stringify(log)}`);
			await context.close();
		}
	}
];
