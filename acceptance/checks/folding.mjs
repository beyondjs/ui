import { expect, overflow } from '../support/browser.mjs';
import { open } from './thread.mjs';

/**
 * What 0.11.1 changes, in a real engine on the `thread.html` pages: the composer's Options below 30rem
 * (one toolbar row, a disclosure by keyboard, mouse and touch, folded again by Escape and by a send,
 * absent when wide), a suggestion list the source cut ending with its line, a `ChoiceChip` with one
 * border, a `Facts` row's action on the value's baseline beside its label and under it, and `Hint` and
 * `Age` used by a product's own markup.
 */
const words = {
	en: { options: 'Options', more: 'More actions', cut: '8 of 120 · keep typing to narrow', said: '8 of 120 suggestions · keep typing to narrow' },
	es: { options: 'Opciones', more: 'Más acciones', cut: '8 de 120 · sigue escribiendo para acotar', said: '8 de 120 sugerencias · sigue escribiendo para acotar' }
};
const dock = '.dock .bui-composer';

/** The dock's toolbar as drawn: Options, Attach, the chips, the actions and their rows. */
const toolbar = page =>
	page.evaluate(selector => {
		const root = document.querySelector(selector);
		const box = node => (node && node.getClientRects().length ? node.getBoundingClientRect().toJSON() : null);
		const more = root.querySelector('.bui-composer-more');
		return {
			more: box(more),
			expanded: more?.getAttribute('aria-expanded') ?? null,
			attach: box(root.querySelector('.bui-composer-attach')),
			chips: [...root.querySelectorAll('.bui-composer-settings .bui-chip')].map(box),
			end: box(root.querySelector('.bui-composer-end')),
			bar: box(root.querySelector('.bui-composer-bar')),
			composer: box(root),
			open: root.hasAttribute('data-options')
		};
	}, dock);
const row = (a, b) => Math.abs(a.top + a.height / 2 - (b.top + b.height / 2)) <= 2;

export const checks = [
	{
		name: 'composer Options at 390 and 320 px in both themes: one toolbar row with the settings and Attach folded; pressed, they show beside it from the first row and the actions take the next; none at 1440 px, and compact: false wraps as 0.11.0',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			for (const scheme of ['light', 'dark']) {
				for (const width of [390, 320]) {
					const at = `${width}px ${scheme}`;
					const { page, context } = await open(browser, consumer, { width, height: 844, colorScheme: scheme });
					const folded = await toolbar(page);
					expect(folded.more && !folded.attach && folded.chips.every(chip => !chip), `${at}: Options shown, Attach and the chips folded: ${JSON.stringify(folded)}`);
					expect(row(folded.more, folded.end), `${at}: Options and the actions on one row: ${JSON.stringify([folded.more, folded.end])}`);
					expect(folded.bar.height <= Math.max(folded.more.height, folded.end.height) + 16 + 1, `${at}: one toolbar row: ${folded.bar.height}`);
					expect((await page.locator(`${dock} .bui-composer-more`).getAttribute('aria-label')) === copy.options, `${at}: named`);
					await page.locator(`${dock} .bui-composer-more`).click();
					const shown = await toolbar(page);
					expect(shown.expanded === 'true' && shown.open, `${at}: expanded`);
					expect(shown.attach && shown.chips.every(Boolean), `${at}: Attach and the chips shown: ${JSON.stringify(shown)}`);
					expect(row(shown.more, shown.attach) && shown.chips[0].top < shown.end.top, `${at}: beside Options in the first row, the actions under: ${JSON.stringify(shown)}`);
					expect(shown.chips.every(chip => chip.left >= shown.composer.left - 0.5 && chip.right <= shown.composer.right + 0.5), `${at}: the chips inside the composer`);
					expect(!(await overflow(page)), `${at}: no sideways scroll`);
					await page.locator(`${dock} .bui-composer-more`).click();
					expect(!(await toolbar(page)).open, `${at}: pressed again, folded`);
					const off = await open(browser, consumer, { width, height: 844, colorScheme: scheme, query: '?compact=off' });
					const wrapped = await toolbar(off.page);
					expect(!wrapped.more && wrapped.chips.every(Boolean) && wrapped.chips[0].bottom <= wrapped.end.top + 1, `${at}: compact: false keeps the start's own row`);
					expect(folded.composer.height < wrapped.composer.height, `${at}: the dock is shorter folded: ${folded.composer.height} < ${wrapped.composer.height}`);
					await off.context.close();
					await context.close();
				}
			}
			const { page } = await open(browser, consumer, { width: 1440 });
			const wide = await toolbar(page);
			expect(!wide.more && wide.attach && wide.chips.every(Boolean), `1440px: nothing folded: ${JSON.stringify(wide)}`);
		}
	},
	{
		name: 'composer Options by keyboard: Tab from the field reaches it with its tooltip, Enter shows what it folds and Tab moves into it, a chip\'s menu takes Escape first, then Escape folds with focus on Options; a send folds; 44 px on a touch screen',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			// WebKit on macOS moves Tab among buttons only with Option held, as Safari does by default
			const tab = browser.engine === 'webkit' ? 'Alt+Tab' : 'Tab';
			const { page } = await open(browser, consumer, { width: 390, height: 844 });
			const more = page.locator(`${dock} .bui-composer-more`);
			await page.locator(`${dock} .bui-composer-field`).click();
			await page.keyboard.press(tab);
			expect(await more.evaluate(node => document.activeElement === node), 'Tab from the field reaches Options');
			const hint = page.locator('.bui-hint:not([hidden])');
			await hint.waitFor();
			expect((await hint.textContent()) === copy.options, `its tooltip: ${await hint.textContent()}`);
			await page.keyboard.press('Enter');
			expect((await more.getAttribute('aria-expanded')) === 'true', 'Enter shows them');
			expect(!(await hint.count()), 'no tooltip over what it opened');
			await page.keyboard.press(tab);
			expect(await page.evaluate(selector => document.activeElement === document.querySelector(`${selector} .bui-composer-attach`), dock), 'Tab moves to Attach');
			await page.keyboard.press(tab);
			const chip = page.locator(`${dock} .bui-chip .bui-choice-button`).first();
			expect(await chip.evaluate(node => document.activeElement === node), 'then the first chip');
			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('Escape');
			expect((await more.getAttribute('aria-expanded')) === 'true' && (await chip.evaluate(node => document.activeElement === node)), "the chip's menu took Escape");
			await page.keyboard.press('Escape');
			expect((await more.getAttribute('aria-expanded')) === 'false', 'Escape folds them');
			expect(await more.evaluate(node => document.activeElement === node), 'focus back on Options');
			await more.click();
			await page.locator(`${dock} .bui-composer-field`).fill('Run the checks');
			await page.keyboard.press('Enter');
			await page.waitForFunction(() => window.fixture.log.some(line => line.startsWith('send:Run the checks')));
			await page.waitForFunction(selector => !document.querySelector(selector).hasAttribute('data-options'), dock);
			const touch = await open(browser, consumer, { width: 390, height: 844, hasTouch: true, isMobile: true });
			const size = await touch.page.locator(`${dock} .bui-composer-more`).evaluate(node => node.getBoundingClientRect().toJSON());
			expect(size.width >= 44 && size.height >= 44, `44 px on a touch screen: ${JSON.stringify(size)}`);
			await touch.page.locator(`${dock} .bui-composer-more`).tap();
			expect((await touch.page.locator(`${dock} .bui-composer-more`).getAttribute('aria-expanded')) === 'true', 'a tap shows them');
		}
	},
	{
		name: 'a suggestion list the source cut ends with "8 of 120 · keep typing to narrow" under the options, said once, describing the list; the last option scrolls into view above it',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			for (const width of [1440, 390]) {
				const { page, context } = await open(browser, consumer, { width, height: 844, query: '?suggest=many' });
				await page.locator(`${dock} .bui-composer-field`).click();
				await page.keyboard.type('Fix @part');
				await page.waitForSelector(`${dock} .bui-composer-suggest[data-cut]:not([hidden])`);
				const found = await page.evaluate(selector => {
					const panel = document.querySelector(`${selector} .bui-composer-suggest`);
					const list = panel.querySelector('[role="listbox"]');
					const line = panel.querySelector('.bui-composer-suggest-line');
					const box = node => node.getBoundingClientRect().toJSON();
					return { text: line.textContent, said: panel.querySelector('.bui-announcer').textContent, described: list.getAttribute('aria-describedby') === line.id, options: list.querySelectorAll('[role="option"]').length, panel: box(panel), line: box(line), list: box(list), scrolls: list.scrollHeight > list.clientHeight };
				}, dock);
				expect(found.text === copy.cut && found.described && found.options === 8, `${width}px: the line: ${JSON.stringify(found)}`);
				expect(found.said === copy.said, `${width}px: said with the answer: ${found.said}`);
				expect(found.line.top >= found.list.bottom - 0.5 && found.line.bottom <= found.panel.bottom + 0.5, `${width}px: under the options, inside the list's box`);
				for (let step = 0; step < 7; step += 1) await page.keyboard.press('ArrowDown');
				const last = await page.evaluate(selector => {
					const panel = document.querySelector(`${selector} .bui-composer-suggest`);
					const active = document.getElementById(document.querySelector(`${selector} .bui-composer-field`).getAttribute('aria-activedescendant'));
					return { active: active.getBoundingClientRect().toJSON(), line: panel.querySelector('.bui-composer-suggest-line').getBoundingClientRect().toJSON(), index: [...active.parentNode.children].indexOf(active) };
				}, dock);
				expect(last.index === 7 && last.active.bottom <= last.line.top + 0.5, `${width}px: the last option in view above the line: ${JSON.stringify(last)}`);
				await page.keyboard.press('Escape');
				expect(await page.locator(`${dock} .bui-composer-suggest`).isHidden(), `${width}px: Escape closes it`);
				await context.close();
			}
		}
	},
	{
		name: "a ChoiceChip draws one border, its button's; a Facts row's action reads on the value's baseline beside its label and under it; Hint and Age in a product's own markup",
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			for (const scheme of ['light', 'dark']) {
				const { page, context } = await open(browser, consumer, { width: 1440, colorScheme: scheme });
				const chip = await page.evaluate(selector => {
					const holder = document.querySelector(`${selector} .bui-chip`);
					const style = getComputedStyle(holder);
					const button = getComputedStyle(holder.querySelector('.bui-choice-button'));
					return { holder: [style.borderTopWidth, style.borderLeftWidth, style.backgroundColor, style.paddingLeft], button: button.borderTopWidth };
				}, dock);
				expect(chip.holder[0] === '0px' && chip.holder[1] === '0px' && /rgba\(0, 0, 0, 0\)|transparent/.test(chip.holder[2]) && chip.holder[3] === '0px', `${scheme}: the holder draws no box: ${JSON.stringify(chip)}`);
				expect(parseFloat(chip.button) >= 1, `${scheme}: the button keeps its border`);
				const baselines = await page.evaluate(() => {
					// A zero-height inline block at the start of a text sits on its first line's baseline
					const base = node => {
						const probe = document.createElement('span');
						probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
						node.prepend(probe);
						const at = probe.getBoundingClientRect().top;
						probe.remove();
						return at;
					};
					return ['.bui-page-panel', '#narrow'].map(scope => {
						const row = document.querySelector(`${scope} .bui-facts-row`);
						const value = row.querySelector('.bui-facts-value');
						const words = row.querySelector('.bui-facts-action .bui-button > span:last-child');
						const box = node => node.getBoundingClientRect();
						return { value: base(value), action: base(words), label: base(row.querySelector('.bui-facts-label')), under: box(row.querySelector('dd')).top >= box(row.querySelector('dt')).bottom - 1, end: box(row.querySelector('.bui-facts-action')).right >= box(row.querySelector('dd')).right - 0.5 };
					});
				});
				const [beside, under] = baselines;
				expect(Math.abs(beside.value - beside.action) <= 1 && Math.abs(beside.label - beside.value) <= 1 && !beside.under && beside.end, `${scheme}: beside its label, label, value and action on one baseline, the action at the row's end: ${JSON.stringify(beside)}`);
				expect(under.under && Math.abs(under.value - under.action) <= 1, `${scheme}: under its label, the value and its action on one baseline: ${JSON.stringify(under)}`);
				const own = page.locator('#own .bui-icon-button');
				await own.hover();
				const tip = page.locator('.bui-hint:not([hidden])');
				await tip.waitFor();
				expect((await tip.textContent()) === copy.more && (await tip.getAttribute('aria-hidden')) === 'true', `${scheme}: the family tooltip on a product's own control`);
				const ages = await page.evaluate(() => ({ own: document.getElementById('age').textContent, datetime: document.getElementById('age').getAttribute('datetime'), sidebar: document.querySelectorAll('.bui-sidebar-panel .bui-sidebar-age')[1].querySelector('[aria-hidden]').textContent }));
				expect(ages.own === ages.sidebar && ages.datetime, `${scheme}: Age says what the Sidebar says: ${JSON.stringify(ages)}`);
				await context.close();
			}
		}
	}
];
