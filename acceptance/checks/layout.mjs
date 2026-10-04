import { expect, overflow } from '../support/browser.mjs';

/**
 * The family page system (D52) measured in the browser: content one gutter from the navigation at
 * every width (16, 24 or 32 px by the region's own width), nothing centered, lines within the
 * reading measure, the side panel beside the main column once the region holds a form column and the
 * panel, the header's status and actions on the title's line from 640 px, no sideways scroll, and
 * "Language and appearance" from the profile menu.
 */
async function open(browser, consumer, { width, query = '', scheme = 'light' }) {
	const view = await browser.open(consumer, { file: 'layout.html', query, viewport: { width, height: 900 }, colorScheme: scheme });
	await view.page.evaluate(() => document.fonts.ready);
	await view.page.waitForSelector('.bui-page-heading');
	return view;
}

const measure = page =>
	page.evaluate(() => {
		const rect = node => node.getBoundingClientRect();
		const panel = document.querySelector('.bui-sidebar-panel');
		const edge = panel && panel.getClientRects().length ? rect(panel).right : 0;
		const region = rect(document.querySelector('.bui-page'));
		const heading = rect(document.querySelector('.bui-page-heading'));
		const actions = document.querySelector('.bui-page-actions');
		const aside = document.querySelector('.bui-page-aside');
		const main = rect(document.querySelector('.bui-page-main'));
		// The most characters on one rendered line of the long paragraphs.
		const longest = Math.max(
			...[...document.querySelectorAll('.bui-section-description, .bui-reading')].map(node => {
				const range = document.createRange();
				range.selectNodeContents(node);
				const lines = new Set([...range.getClientRects()].map(box => Math.round(box.top))).size;
				return Math.ceil(node.textContent.length / Math.max(lines, 1));
			})
		);
		return {
			edge,
			region: region.width,
			start: heading.left - edge,
			arrival: document.querySelector('.bui-arrival') ? rect(document.querySelector('.bui-arrival')).left - edge : null,
			heading: { top: heading.top, bottom: heading.bottom, middle: (heading.top + heading.bottom) / 2 },
			actions: actions ? { top: rect(actions).top, middle: (rect(actions).top + rect(actions).bottom) / 2 } : null,
			aside: aside ? { left: rect(aside).left, top: rect(aside).top } : null,
			main: { right: main.right, bottom: main.bottom },
			longest,
			unused: Math.max(0, region.right - Math.max(main.right, aside ? rect(aside).right : 0))
		};
	});

const gutter = region => (region < 640 ? 16 : region < 1024 ? 24 : 32);

export const checks = [
	{
		name: 'page: content starts one gutter from the navigation at 320 to 2560 px, never centered; lines stay readable; no sideways scroll; both themes',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const scheme of ['light', 'dark']) {
				for (const width of [320, 390, 1023, 1024, 1440, 1920, 2560]) {
					const at = `${width}px ${scheme}`;
					const { page, context } = await open(browser, consumer, { width, scheme, query: '?arrival=1' });
					const found = await measure(page);
					expect(!(await overflow(page)), `${at}: no sideways scroll`);
					expect(Math.abs(found.start - gutter(found.region)) <= 1, `${at}: the H1 starts ${found.start}px from the navigation, expected ${gutter(found.region)} (region ${found.region})`);
					expect(Math.abs(found.arrival - found.start) <= 1, `${at}: the arrival line starts where the H1 does: ${found.arrival} / ${found.start}`);
					expect(found.longest <= 80, `${at}: a line of ${found.longest} characters`);
					// From 640 px the actions sit centred on the H1's line, or wrap below it when the title leaves them no room
					const wrapped = found.actions.top >= found.heading.bottom - 1;
					if (found.region >= 640) expect(wrapped || Math.abs(found.actions.middle - found.heading.middle) <= 2, `${at}: the actions are centred on the H1's line: ${JSON.stringify([found.actions, found.heading])}`);
					if (found.region >= 1400) expect(!wrapped, `${at}: a wide region keeps the actions on the title's line`);
					if (found.region < 640) expect(wrapped, `${at}: under 640 px the actions follow the title`);
					await context.close();
				}
			}
		}
	},
	{
		name: 'page: a resource page shows its side panel beside the main column from a 68rem region and below it under that; a fluid page grows, a form page stops',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const width of [1024, 1440, 1920, 2560]) {
				const { page, context } = await open(browser, consumer, { width, query: '?aside=1' });
				const found = await measure(page);
				const beside = found.region >= 68 * 16;
				if (beside) expect(found.aside.left > found.main.right - 1, `${width}px: the panel is beside the main column: ${JSON.stringify(found)}`);
				else expect(found.aside.top >= found.main.bottom - 1, `${width}px: the panel is below the main column: ${JSON.stringify(found)}`);
				await context.close();
			}
			const fluid = await open(browser, consumer, { width: 1920, query: '?width=fluid&template=list' });
			const wide = await measure(fluid.page);
			expect(wide.unused <= wide.region * 0.05 + 64, `1920px fluid: ${wide.unused}px unused of ${wide.region}`);
			await fluid.context.close();
			const form = await open(browser, consumer, { width: 1920, query: '?width=form&template=settings' });
			const narrow = await form.page.evaluate(() => document.querySelector('.bui-page-body').getBoundingClientRect().width);
			expect(narrow <= 40 * 16 + 1, `1920px form: the body is ${narrow}px, at most 40rem`);
			await form.context.close();
		}
	},
	{
		name: 'page: "Language and appearance" opens from the profile menu, applies at once and offers "Change for all of Beyond"',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page, context } = await open(browser, consumer, { width: 1440 });
			const spanish = consumer.language === 'es';
			await page.locator('.bui-family-account > .bui-navmenu-button, .bui-family-account button[aria-expanded]').first().click();
			await page.locator('.bui-family-preferences').click();
			const dialog = page.locator('dialog.bui-dialog[open]');
			await dialog.waitFor();
			expect((await dialog.locator('h2').first().innerText()).trim() === (spanish ? 'Idioma y apariencia' : 'Language and appearance'), 'the dialog is named');
			await dialog.locator('select[name="appearance"]').selectOption('dark');
			expect((await page.evaluate(() => document.documentElement.getAttribute('data-beyond-mode'))) === 'dark', 'the appearance applies at once');
			expect((await dialog.locator('a').getAttribute('href')) === 'https://accounts.example.test/account', '"Change for all of Beyond" leads to Accounts');
			await dialog.locator('button.bui-button-primary').click();
			await dialog.waitFor({ state: 'detached' });
			const back = await page.evaluate(() => document.activeElement?.closest('.bui-family-account') !== null);
			expect(back, 'focus returns to the profile menu');
			await context.close();
		}
	}
];
