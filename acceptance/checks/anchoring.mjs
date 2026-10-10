import { expect, overflow } from '../support/browser.mjs';

/**
 * The thread template of 0.14.0 in a real engine, on the `round.html` pages: the dock anchored at the same
 * distance from the window's bottom at the top, the middle and the end of the scroll and on a short and an
 * empty thread (D94), its hairline only while content passes beneath; one lane for the message, prose and
 * the composer, code passing it, the panel next to the lane (D96); Facts' value column (D99); a quiet
 * action line (D102); highlighted code.
 */
export async function open(browser, consumer, { width = 1440, height = 900, query = '', ...options } = {}) {
	const view = await browser.open(consumer, { file: 'round.html', query, viewport: { width, height }, ...options });
	await view.page.waitForSelector('.bui-page-dock .bui-composer-field');
	await view.page.evaluate(() => document.fonts.ready);
	await view.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
	return view;
}
const distance = page =>
	page.evaluate(() => {
		const box = document.querySelector('.bui-page-dock .bui-composer-box').getBoundingClientRect();
		return { gap: Math.round((innerHeight - box.bottom) * 10) / 10, stuck: document.querySelector('.bui-page-dock').hasAttribute('data-stuck') };
	});
const scroll = (page, where) =>
	page.evaluate(async where => {
		const end = document.documentElement.scrollHeight - innerHeight;
		window.scrollTo(0, where === 'top' ? 0 : where === 'end' ? end : Math.round(end / 2));
		await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 50))));
	}, where);

export const checks = [
	{
		name: 'the dock keeps one distance from the window’s bottom at the top, middle and end of a long thread and on a short and an empty one, with its hairline only while content passes beneath (D94), at 1440 and 390 px',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const [width, height] of [[1440, 900], [390, 760]]) {
				const { page } = await open(browser, consumer, { width, height });
				const seen = [];
				for (const where of ['top', 'middle', 'end']) {
					await scroll(page, where);
					seen.push({ where, ...(await distance(page)) });
				}
				const gaps = seen.map(entry => entry.gap);
				expect(Math.max(...gaps) - Math.min(...gaps) <= 1, `one distance while scrolling at ${width}: ${JSON.stringify(seen)}`);
				expect(seen[0].stuck && seen[1].stuck && !seen[2].stuck, `a hairline while content passes beneath, none at the end: ${JSON.stringify(seen)}`);
				for (const length of ['short', 'empty']) {
					const other = await open(browser, consumer, { width, height, query: `?length=${length}` });
					const measured = await distance(other.page);
					expect(Math.abs(measured.gap - gaps[2]) <= 1 && !measured.stuck, `a ${length} thread docks at the same distance at ${width}: ${measured.gap} against ${gaps[2]}`);
				}
				const gutter = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.bui-page-dock')).paddingBottom));
				expect(Math.abs(gaps[2] - gutter) <= 1, `one gutter under the composer at ${width}: ${gaps[2]} against ${gutter}`);
				expect(!(await overflow(page)), `no sideways scroll at ${width}`);
			}
		}
	},
	{
		name: 'one edge, one lane (D96): the message, prose and composer share a right edge, code passes it, the panel comes next to the lane and the rest falls on the far side, at 2000 and 1440 px, with the panel hidden too',
		consumers: ['dom'],
		async run(browser, consumer) {
			for (const width of [2000, 1440]) {
				const { page } = await open(browser, consumer, { width, height: 1000 });
				const edges = () =>
					page.evaluate(() => {
						const right = selector => Math.round(document.querySelector(selector).getBoundingClientRect().right);
						const panel = document.querySelector('.bui-page-panel');
						return { message: right('.message'), prose: right('.answer'), composer: right('.bui-page-dock .bui-composer'), code: right('.code'), panel: panel.hidden ? null : Math.round(panel.getBoundingClientRect().left), region: Math.round(document.querySelector('.bui-page').getBoundingClientRect().right) };
					});
				const beside = await edges();
				expect(Math.abs(beside.message - beside.prose) <= 1 && Math.abs(beside.prose - beside.composer) <= 1, `one right edge at ${width}: ${JSON.stringify(beside)}`);
				expect(beside.code >= beside.prose - 1, `code may pass the lane: ${JSON.stringify(beside)}`);
				expect(Math.abs(beside.panel - beside.prose - 32) <= 2, `the panel one gap after the lane at ${width}: ${JSON.stringify(beside)}`);
				await page.locator('.bui-page-header .bui-button', { hasText: 'Details' }).click();
				await page.waitForFunction(() => document.querySelector('.bui-page-panel').hidden);
				const alone = await edges();
				expect(Math.abs(alone.message - alone.prose) <= 1 && Math.abs(alone.prose - alone.composer) <= 1, `one right edge without the panel: ${JSON.stringify(alone)}`);
				expect(alone.code > alone.prose + 100, `code widens to the wide lane without the panel: ${JSON.stringify(alone)}`);
				expect(alone.region - alone.code > 0, 'what is left falls on the far side');
			}
		}
	},
	{
		name: 'Facts read in two columns (D99): the value one column after its label, a number at the end in tabular figures; a quiet action line muted until hover (D102); highlighted code in the code colors',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, { width: 1920, height: 1000 });
			const facts = await page.evaluate(() => {
				const rows = [...document.querySelectorAll('.bui-facts-row')].map(row => ({ label: row.querySelector('.bui-facts-label').getBoundingClientRect(), value: row.querySelector('.bui-facts-value').getBoundingClientRect(), row: row.getBoundingClientRect(), numeric: row.hasAttribute('data-numeric'), figures: getComputedStyle(row.querySelector('.bui-facts-value')).fontVariantNumeric }));
				const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
				return rows.map(({ label, value, row, numeric, figures }) => ({ start: Math.round(value.left - row.left), end: Math.round(row.right - value.right), numeric, figures, rem, labelStart: Math.round(label.left - row.left) }));
			});
			const words = facts.filter(row => !row.numeric);
			const numbers = facts.filter(row => row.numeric);
			expect(words.length && words.every(row => Math.abs(row.start - 9.5 * row.rem - 12) <= 2), `a word value starts one column after its label: ${JSON.stringify(facts)}`);
			expect(numbers.length && numbers.every(row => row.end <= 1 && row.figures.includes('tabular-nums')), `a number at the end in tabular figures: ${JSON.stringify(numbers)}`);
			const line = page.locator('.bui-action-line-actions .bui-button').first();
			const colors = await page.evaluate(() => {
				const style = getComputedStyle(document.documentElement);
				const probe = document.body.appendChild(document.createElement('span'));
				const resolve = name => ((probe.style.color = `var(${name})`), getComputedStyle(probe).color);
				const result = { muted: resolve('--color-text-muted'), text: resolve('--color-text'), keyword: resolve('--color-code-keyword'), string: resolve('--color-code-string') };
				probe.remove();
				return { ...result, button: getComputedStyle(document.querySelector('.bui-action-line-actions .bui-button')).color, kinds: [...new Set([...document.querySelectorAll('.code span')].map(node => [node.className, getComputedStyle(node).color].join('=')))], facts: getComputedStyle(document.querySelector('.bui-action-line-facts')).fontVariantNumeric };
			});
			expect(colors.button === colors.muted, `quiet actions are muted: ${JSON.stringify(colors)}`);
			expect(colors.facts.includes('tabular-nums'), 'the facts in tabular figures');
			await line.hover();
			expect((await line.evaluate(node => getComputedStyle(node).color)) === colors.text, 'stronger on hover');
			expect(colors.kinds.includes(`bui-code-keyword=${colors.keyword}`) && colors.kinds.includes(`bui-code-string=${colors.string}`), `keywords and strings in their colors: ${colors.kinds}`);
		}
	}
];
