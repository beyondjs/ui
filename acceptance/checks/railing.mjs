import { expect, overflow } from '../support/browser.mjs';

/**
 * The rail of 0.12.0 in a real engine, on the `conversation.html` pages: every mark on the one line
 * (activity rows' own marks and RailItems'), each colored by its state, the line passing behind the
 * marks; a time of day at the far end; an opened command's input and output in one box, each label
 * beside its text; no sideways scroll from 320 px, in both themes.
 */
const words = {
	en: { in: 'In', out: 'Out' },
	es: { in: 'Entrada', out: 'Salida' }
};

async function open(browser, consumer, { width = 1440, height = 900, ...options } = {}) {
	const view = await browser.open(consumer, { file: 'conversation.html', viewport: { width, height }, ...options });
	await view.page.waitForSelector('.thread .bui-rail .bui-rail-item');
	await view.page.evaluate(() => document.fonts.ready);
	return view;
}

/** The line's center and each mark's center and color, in the page's pixels. */
const measure = page =>
	page.evaluate(() => {
		const rail = document.querySelector('.thread .bui-rail');
		const box = rail.getBoundingClientRect();
		const line = getComputedStyle(rail, '::before');
		const x = box.left + Number.parseFloat(line.left) + Number.parseFloat(line.width) / 2;
		const marks = [...rail.querySelectorAll('.bui-rail-mark, .bui-activity-head > .bui-activity-mark')].map(mark => {
			const at = mark.getBoundingClientRect();
			const style = getComputedStyle(mark);
			return { x: at.left + at.width / 2, color: style.color, surface: style.backgroundColor, state: mark.closest('[data-state]')?.dataset.state ?? mark.closest('[data-tone]')?.dataset.tone ?? null };
		});
		const tokens = getComputedStyle(document.documentElement);
		const color = name => {
			const probe = document.createElement('span');
			probe.style.color = `var(${name})`;
			document.body.append(probe);
			const value = getComputedStyle(probe).color;
			probe.remove();
			return value;
		};
		return { x, width: line.width, display: line.content, marks, danger: color('--color-danger'), warning: color('--color-warning'), canvas: tokens.getPropertyValue('--color-canvas') };
	});

export const checks = [
	{
		name: 'rail: every mark on the one line in both themes, each colored by its state, the line behind them; a time at the far end',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const scheme of ['light', 'dark']) {
				const { page } = await open(browser, consumer, { colorScheme: scheme });
				const found = await measure(page);
				expect(found.marks.length === 5, `${scheme}: five marks on the rail (the time has none): ${found.marks.length}`);
				for (const mark of found.marks) expect(Math.abs(mark.x - found.x) <= 1.5, `${scheme}: a ${mark.state} mark on the line: ${mark.x} against ${found.x}`);
				const failed = found.marks.find(mark => mark.state === 'failed');
				const danger = found.marks.find(mark => mark.state === 'danger');
				const waiting = found.marks.find(mark => mark.state === 'waiting');
				expect(failed?.color === found.danger && danger?.color === found.danger, `${scheme}: a failure in the danger color: ${JSON.stringify([failed, danger])}`);
				expect(waiting?.color === found.warning, `${scheme}: a wait for the person in the warning color`);
				expect(found.marks.every(mark => mark.surface !== 'rgba(0, 0, 0, 0)'), `${scheme}: every mark masks the line behind it`);
				const moment = await page.locator('.bui-rail-moment').evaluate(node => ({ align: getComputedStyle(node).textAlign, time: node.querySelector('time').getAttribute('datetime') }));
				expect(moment.align === 'end' && moment.time === '2026-10-09T10:51:00Z', `${scheme}: the time at the far end, with its moment`);
				await page.close();
			}
		}
	},
	{
		name: 'rail: an opened command shows its input and output in one box, each label beside its text; nothing scrolls sideways at 320 px',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			const { page } = await open(browser, consumer, { width: 320, height: 720 });
			expect(!(await overflow(page)), 'no sideways scroll at 320 px');
			const head = page.locator('.bui-rail > .bui-activity > .bui-activity-head, .bui-rail > .bui-host > .bui-activity > .bui-activity-head').first();
			await head.click();
			const box = page.locator('.bui-rail .bui-activity-exchange');
			await box.waitFor();
			const parts = await box.evaluate(node =>
				[...node.querySelectorAll(':scope > .bui-activity-section')].map(part => {
					const label = part.querySelector('.bui-activity-label').getBoundingClientRect();
					const code = part.querySelector('.bui-activity-code').getBoundingClientRect();
					return { label: part.querySelector('.bui-activity-label').textContent, beside: label.right <= code.left + 0.5, top: Math.abs(label.top - code.top) };
				})
			);
			expect(parts.length === 2 && parts[0].label === copy.in && parts[1].label === copy.out, `In and Out in one box: ${JSON.stringify(parts)}`);
			expect(parts.every(part => part.beside && part.top <= 4), `each label beside its text: ${JSON.stringify(parts)}`);
			expect(!(await overflow(page)), 'still no sideways scroll once opened');
			await page.close();
		}
	}
];
