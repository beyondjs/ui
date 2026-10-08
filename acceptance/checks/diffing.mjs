import { expect, overflow } from '../support/browser.mjs';
import { checks as behavior } from './diffing-keys.mjs';
import { survey } from '../../tests/support/names.mjs';

/**
 * The diff of 0.11.2 in a real engine, on the `diff.html` pages (a plain DOM page in English, a React
 * page in Spanish): no sideways scroll of the page at 1440, 768, 390 and 320 px in both themes, a long
 * line scrolling inside its own file's box with the numbers and signs kept in view, additions and
 * deletions told apart by their sign and their background with the sign and the code at 4.5:1 against
 * the row, and a selection of the code that copies no number, sign or spoken prefix. The keyboard, the
 * list of files, the large file, motion and Copy path are in `diffing-keys.mjs`.
 */
export const words = {
	en: { summary: '5 files changed', status: 'Renamed', copy: 'Copy path', copied: 'Copied', jump: 'Files in this change', large: 'Large diff · 1,500 lines', show: 'Show' },
	es: { summary: '5 archivos cambiados', status: 'Renombrado', copy: 'Copiar ruta', copied: 'Copiado', jump: 'Archivos de este cambio', large: 'Diff extenso · 1500 líneas', show: 'Mostrar' }
};

export async function open(browser, consumer, { width = 1440, height = 900, query = '', ...options } = {}) {
	const view = await browser.open(consumer, { file: 'diff.html', query, viewport: { width, height }, ...options });
	await view.page.waitForSelector('.bui-diff .bui-diff-file');
	await view.page.evaluate(() => document.fonts.ready);
	return view;
}

/** Contrast of colors as computed by the engine (`rgb()`, `rgba()` or `color(srgb …)`), WCAG's formula. */
const measure = page =>
	page.evaluate(() => {
		const channels = value => {
			const numbers = value.match(/[\d.]+/g).map(Number);
			return value.startsWith('color(') ? numbers.slice(0, 3).map(part => part * 255) : numbers.slice(0, 3);
		};
		const light = value => {
			const [r, g, b] = channels(value).map(part => part / 255).map(part => (part <= 0.03928 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4));
			return 0.2126 * r + 0.7152 * g + 0.0722 * b;
		};
		const ratio = (a, b) => {
			const [high, low] = [light(a), light(b)].sort((x, y) => y - x);
			return (high + 0.05) / (low + 0.05);
		};
		const row = kind => {
			const node = document.querySelector(`.bui-diff-line[data-kind="${kind}"]`);
			const background = getComputedStyle(node).backgroundColor;
			const sign = node.querySelector('.bui-diff-sign');
			return {
				background,
				sign: getComputedStyle(sign, '::before').content,
				signs: ratio(getComputedStyle(sign).color, background),
				code: ratio(getComputedStyle(node.querySelector('.bui-diff-code')).color, background),
				number: ratio(getComputedStyle(node.querySelector('.bui-diff-num')).color, background)
			};
		};
		return { add: row('add'), delete: row('delete'), context: row('context') };
	});

export const checks = [
	{
		name: 'diff at 1440, 768, 390 and 320 px in both themes: no sideways scroll of the page, a long line scrolls inside its file with numbers kept in view, rows told apart by sign and background at 4.5:1',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			for (const scheme of ['light', 'dark']) {
				for (const width of [1440, 768, 390, 320]) {
					const at = `${width}px ${scheme}`;
					const { page, context } = await open(browser, consumer, { width, colorScheme: scheme });
					expect(!(await overflow(page)), `${at}: no sideways scroll`);
					const summary = await page.locator('.bui-diff-total').textContent();
					expect(summary.startsWith(copy.summary), `${at}: the summary in the page's language: ${summary}`);
					const found = await measure(page);
					expect(found.add.sign === '"+"' && found.delete.sign === '"−"' && ['""', 'none', 'normal'].includes(found.context.sign), `${at}: the signs: ${JSON.stringify([found.add.sign, found.delete.sign, found.context.sign])}`);
					expect(found.add.background !== found.context.background && found.delete.background !== found.context.background && found.add.background !== found.delete.background, `${at}: three backgrounds: ${JSON.stringify(found)}`);
					for (const kind of ['add', 'delete', 'context']) {
						for (const part of ['signs', 'code', 'number']) {
							if (kind === 'context' && part === 'signs') continue;
							expect(found[kind][part] >= 4.5, `${at}: ${kind} ${part} at ${found[kind][part].toFixed(2)}:1`);
						}
					}
					const box = page.locator('.bui-diff-file[data-path="src/i18n/messages.js"] .bui-diff-lines');
					const scrolled = await box.evaluate(node => {
						const wide = node.scrollWidth > node.clientWidth + 1;
						node.scrollLeft = 240;
						const frame = node.getBoundingClientRect();
						const gutter = node.querySelector('.bui-diff-line .bui-diff-gutter').getBoundingClientRect();
						const number = node.querySelector('.bui-diff-line .bui-diff-num:not([data-number=""])').getBoundingClientRect();
						return { wide, left: node.scrollLeft, frame: frame.left, gutter: gutter.left, number: [number.left, number.right], right: frame.right };
					});
					expect(scrolled.wide && scrolled.left > 0, `${at}: the long line scrolls inside its box: ${JSON.stringify(scrolled)}`);
					expect(Math.abs(scrolled.gutter - scrolled.frame) <= 1.5 && scrolled.number[0] >= scrolled.frame - 1 && scrolled.number[1] <= scrolled.right, `${at}: numbers in view while scrolled: ${JSON.stringify(scrolled)}`);
					expect(!(await overflow(page)), `${at}: still no sideways scroll of the page`);
					const name = await page.locator('.bui-diff-file[data-path="src/pay/total.js"] .bui-diff-status').textContent();
					expect(name === copy.status, `${at}: the status in words: ${name}`);
					await context.close();
				}
			}
		}
	},
	{
		name: 'diff selection: selecting the code copies only code, with no number, sign or spoken prefix; a path wraps whole at 320 px; every control has words',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, { width: 320 });
			const text = await page.evaluate(() => {
				const rows = document.querySelector('.bui-diff-file[data-path="src/pay/total.js"] .bui-diff-rows');
				const selection = getSelection();
				selection.removeAllRanges();
				const range = document.createRange();
				range.setStartBefore(rows.children[1]);
				range.setEndAfter(rows.lastElementChild);
				selection.addRange(range);
				return selection.toString();
			});
			expect(!/\d+:|Line|Línea|added|añadida|−/.test(text), `only code is selected: ${JSON.stringify(text)}`);
			expect(text.includes('export function total(items) {') && text.includes('item.price * item.quantity'), `the code is selected: ${JSON.stringify(text)}`);
			const path = await page.locator('.bui-diff-file[data-path="src/checkout/redirect.js"] .bui-diff-path').evaluate(node => ({ width: node.scrollWidth, box: node.clientWidth, text: node.textContent }));
			expect(path.width <= path.box + 1 && path.text === 'src/checkout/redirect.js', `the path whole and wrapped: ${JSON.stringify(path)}`);
			const controls = await page.evaluate(survey, true);
			const bare = controls.filter(control => control.bare);
			expect(!bare.length, `no icon-only control: ${bare.map(control => control.describe).join(', ')}`);
			const header = controls.find(control => /redirect\.js/.test(control.name) && /bui-diff-toggle/.test(control.describe ?? ''));
			expect(header && /Modified|Modificado/.test(header.name), `a header names its path and status: ${header?.name}`);
		}
	},
	...behavior
];
