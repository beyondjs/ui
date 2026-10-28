import { expect, overflow } from '../support/browser.mjs';

/** Readable inbox matters and object rows, with independent actions on narrow and touch screens. */
export const checks = [{
	name: 'list presentation: hierarchy, visible opening, separators and independent targets in both themes',
	consumers: ['dom', 'react19', 'react18'],
	async run(browser, consumer) {
		for (const width of [320, 390, 1280]) for (const colorScheme of ['light', 'dark']) {
			const { page, context } = await browser.open(consumer, { viewport: { width, height: 900 }, colorScheme, hasTouch: width < 400 });
			const inbox = page.locator('#inbox');
			await inbox.locator('.bui-notice').first().waitFor();
			const first = inbox.locator('.bui-notices:not(.bui-notice-earlier) > .bui-notice').first();
			const open = first.locator('> .bui-notice-text > .bui-notice-open');
			const view = consumer.language === 'es' ? 'Ver' : 'View';
			expect(await open.locator('.bui-notice-view').textContent() === view, 'an explicit localized way to open');
			expect((await open.getAttribute('aria-label')).includes(await open.locator('.bui-notice-title').textContent()), 'the opening name identifies the matter');
			expect(await first.locator(':scope > .bui-notice-text > [data-control="open"]').count() === 1, 'one opening target');
			await open.focus();
			expect(await open.evaluate(node => getComputedStyle(node.closest('.bui-notice')).outlineStyle) === 'solid', 'keyboard focus rings its row');
			const shape = await first.evaluate(node => {
				const title = node.querySelector('.bui-notice-title').getBoundingClientRect();
				const cue = node.querySelector('.bui-notice-view').getBoundingClientRect();
				const summary = node.querySelector('.bui-notice-summary').getBoundingClientRect();
				const mark = node.querySelector('.bui-notice-mark').getBoundingClientRect();
				const row = node.getBoundingClientRect();
				return { separate: title.right <= cue.left - 4, clear: mark.top >= summary.bottom, inside: mark.bottom <= row.bottom + 1, gap: summary.top - title.bottom };
			});
			expect(shape.separate && shape.clear && shape.inside && shape.gap >= 4, `${width}/${colorScheme}: targets and copy do not overlap: ${JSON.stringify(shape)}`);
			const border = await inbox.locator('.bui-notices:not(.bui-notice-earlier) > .bui-notice').nth(1).evaluate(node => getComputedStyle(node, '::before').borderTopWidth);
			expect(border === '1px', 'each following matter has a divider');
			expect(!(await overflow(page)), `no sideways scroll at ${width}`);
			await open.press('Enter');
			await page.waitForFunction(() => location.hash.startsWith('#/opened/'));
			await context.close();
		}
	}
}, {
	name: 'list presentation: object rows keep a compact rhythm and their wrapped actions follow the name',
	consumers: ['dom', 'react19'],
	async run(browser, consumer) {
		for (const width of [390, 1280]) {
			const { page, context } = await browser.open(consumer, { file: 'audit.html', viewport: { width, height: 900 } });
			const shape = await page.locator('#rows .bui-row').first().evaluate(row => {
				const name = row.querySelector('.bui-row-title').getBoundingClientRect();
				const meta = row.querySelector('.bui-row-meta').getBoundingClientRect();
				const fact = row.querySelector('.bui-row-fact').getBoundingClientRect();
				return { height: row.getBoundingClientRect().height, gap: meta.top - name.bottom, aligned: Math.abs(fact.left - name.left) < 1 };
			});
			expect(shape.gap >= 4 && shape.height < (width < 400 ? 120 : 85), `readable but compact: ${JSON.stringify(shape)}`);
			if (width < 400) expect(shape.aligned, 'wrapped facts follow the title column');
			expect(!(await overflow(page)), 'objects and table fit the viewport');
			await context.close();
		}
	}
}];
