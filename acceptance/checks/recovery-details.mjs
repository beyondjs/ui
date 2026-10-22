import { expect } from '../support/browser.mjs';

/** Focused geometry check for the shared diagnostic surface, scheduled with the coordinated release. */
export const checks = [{
	name: 'technical details: panel and text share a readable width at 320, 390 and 1440 px in both themes',
	consumers: ['dom', 'react19', 'react18'],
	async run(browser, consumer) {
		const { page } = await browser.open(consumer, { file: 'operations.html', query: '?at=0' });
		for (const width of [320, 390, 1440]) {
			await page.setViewportSize({ width, height: 900 });
			for (const theme of ['light', 'dark']) {
				await page.evaluate(mode => { document.documentElement.dataset.beyondMode = mode; }, theme);
				const found = await page.evaluate(() => {
					const details = [...document.querySelectorAll('main.operations .bui-details')].find(node => node.textContent.includes('req_7Hq2'));
					details.open = true;
					const body = details.querySelector('.bui-details-body');
					const content = details.querySelector('.bui-details-content');
					const text = details.querySelector('.bui-details-text');
					const style = getComputedStyle(text);
					return { panel: body.getBoundingClientRect().width, content: content.getBoundingClientRect().width,
						text: text.getBoundingClientRect().width, cap: parseFloat(getComputedStyle(details).maxWidth),
						edge: body.getBoundingClientRect().right, viewport: innerWidth, overflow: text.scrollWidth > text.clientWidth + 1,
						weight: style.fontWeight, leading: parseFloat(style.lineHeight), size: parseFloat(style.fontSize) };
				});
				expect(found.panel <= found.cap + 1, `${width} ${theme}: diagnostic surface fits its own measure ${JSON.stringify(found)}`);
				expect(Math.abs(found.content - found.text) <= 1, `${width} ${theme}: technical text uses the panel's content width ${JSON.stringify(found)}`);
				expect(found.edge <= found.viewport + 1 && !found.overflow, `${width} ${theme}: diagnostics fit without page overflow ${JSON.stringify(found)}`);
				expect(found.weight === '400' && found.leading > found.size, `${width} ${theme}: readable regular diagnostic text ${JSON.stringify(found)}`);
			}
		}
	}
}];
