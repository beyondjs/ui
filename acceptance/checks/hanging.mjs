import { expect } from '../support/browser.mjs';

/**
 * A borderless control is placed by what it draws (0.37.0, D188), in a real engine, on the hanging page at 1280
 * and 390 px: a quiet control's words start on the edge its column's text starts on (in a row of its own, in
 * an action line, leading a callout, wrapped under a composer's state), a composer band's action ends on the
 * box's inset, and its surface, once pointed at, hangs past its words without reaching the box's border, a
 * bordered neighbour or the words it follows. Beside text its words stand at least twice the hang away. No
 * two lines of one case start 0.5 to 4 px apart: a near miss is never meant.
 */
const widths = [1280, 390];
const near = { low: 0.5, high: 4 };

/** Installs the page's measures: where a node's words start and end, and the line starts of a case. */
const measures = () => {
	const round = value => Math.round(value * 10) / 10;
	const texts = node => {
		const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, { acceptNode: text => (text.textContent.trim() && text.parentElement.getClientRects().length ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
		const found = [];
		for (let text = walker.nextNode(); text; text = walker.nextNode()) found.push(text);
		return found;
	};
	const glyph = (text, at) => {
		const range = document.createRange();
		range.setStart(text, at);
		range.setEnd(text, at + 1);
		return range.getBoundingClientRect();
	};
	/** Where a node's words start and end, its first glyph's line included. */
	const words = node => {
		const found = texts(node);
		if (!found.length) return null;
		const first = found[0];
		const last = found.at(-1);
		const start = glyph(first, first.textContent.search(/\S/));
		const end = glyph(last, last.textContent.trimEnd().length - 1);
		return { left: round(start.left), right: round(end.right), top: round(start.top), bottom: round(start.bottom) };
	};
	/** The inner edges of a box (inside its border). */
	const inner = node => {
		const box = node.getBoundingClientRect();
		const style = getComputedStyle(node);
		return { left: round(box.left + parseFloat(style.borderLeftWidth)), right: round(box.right - parseFloat(style.borderRightWidth)) };
	};
	/** Every line start of a case: text and controls that begin their line, by what they draw. */
	const starts = section => {
		const items = [];
		for (const node of section.querySelectorAll('p, .bui-callout-title, .bui-callout-text, .bui-button, .bui-status, .bui-composer-placeholder, .bui-copy-value-text')) {
			if (!node.getClientRects().length || node.closest('[hidden]')) continue;
			if (node.matches('p') && node.querySelector('.bui-button, .bui-status')) continue;
			const dot = node.matches('.bui-status') ? node.querySelector('.bui-status-dot') : null;
			// A control that draws its box (a bordered or filled button, a glyph alone in its round edge) by its box
			const drawn = node.matches('.bui-button:is(:not(.bui-button-quiet), .bui-button-bare)');
			const at = dot ? dot.getBoundingClientRect() : drawn ? node.getBoundingClientRect() : words(node);
			if (at) items.push({ name: `${node.className || node.localName} "${node.textContent.trim().slice(0, 24)}"`, left: round(at.left), top: at.top, bottom: at.bottom });
		}
		const line = (a, b) => a.top < b.bottom - 2 && b.top < a.bottom - 2;
		return items.filter(item => !items.some(other => other !== item && line(item, other) && other.left < item.left - 0.5));
	};
	window.hanging = { words, inner, starts, round };
};

export const checks = [
	{
		name: 'hanging: a quiet control is placed by its words, its surface hangs past them inside its box, and no line start misses another by 0.5–4 px (D188)',
		consumers: ['dom'],
		async run(browser, consumer) {
			for (const width of widths) {
				const { page, errors } = await browser.open(consumer, { file: 'hanging.html', viewport: { width, height: 1200 } });
				await page.evaluate(() => document.fonts.ready);
				await page.evaluate(measures);
				const at = `at ${width} px`;
				const hover = async selector => {
					await page.hover(selector);
					await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
					const box = await page.evaluate(selector => {
						const node = document.querySelector(selector);
						const rect = node.getBoundingClientRect();
						return { left: hanging.round(rect.left), right: hanging.round(rect.right), fill: getComputedStyle(node).backgroundColor };
					}, selector);
					await page.mouse.move(0, 0);
					return box;
				};

				// A column: every quiet control's words on the text's edge
				const column = await page.evaluate(() => {
					const edge = hanging.words(document.querySelector('#column [data-edge]')).left;
					const rows = [...document.querySelectorAll('#column .hanging-row:not([data-beside], [data-after]) > .bui-button-quiet')].map(node => hanging.words(node).left);
					const line = hanging.words(document.querySelector('#column .bui-action-line-actions > :first-child')).left;
					return { edge, rows, line };
				});
				for (const left of [...column.rows, column.line]) expect(Math.abs(left - column.edge) <= 0.5, `a quiet control's words start ${left - column.edge} px off its column's text ${at}`);

				// Beside a bordered control: its own padding stays, so its surface never meets the other's
				const beside = await page.evaluate(() => {
					const save = document.querySelector('#column [data-beside] > .bui-button-secondary').getBoundingClientRect().right;
					return { save: hanging.round(save), words: hanging.words(document.querySelector('#column [data-beside] > .bui-button-quiet')).left };
				});
				const cancel = await hover('#column [data-beside] > .bui-button-quiet');
				expect(cancel.left - beside.save >= 4, `Cancel's surface comes ${cancel.left - beside.save} px from Save ${at}`);
				expect(beside.words - beside.save >= 12, `Cancel's words stand ${beside.words - beside.save} px from Save ${at}`);

				// After a sentence: its words twice its hang away, its surface clear of the sentence
				const after = await page.evaluate(() => ({ text: hanging.words(document.querySelector('#column [data-after] > span')).right, words: hanging.words(document.querySelector('#column [data-after] > .bui-button-quiet')).left }));
				const opens = await hover('#column [data-after] > .bui-button-quiet');
				expect(after.words - after.text >= 15.5, `an action's words stand ${after.words - after.text} px after its sentence ${at}`);
				expect(opens.left - after.text >= 4, `an action's surface comes ${opens.left - after.text} px from its sentence ${at}`);

				// A callout led by a quiet action
				const lead = await page.evaluate(() => ({ title: hanging.words(document.querySelector('#callout .bui-callout-title')).left, action: hanging.words(document.querySelector('#callout .bui-callout-actions > .bui-button-quiet')).left }));
				expect(Math.abs(lead.action - lead.title) <= 0.5, `the callout's quiet action starts ${lead.action - lead.title} px off its title ${at}`);

				// A composer band's action ends on the box's inset; its surface stays inside the border
				const end = await page.evaluate(() => {
					const box = document.querySelector('#band-end .bui-composer-box');
					const inset = parseFloat(getComputedStyle(box).getPropertyValue('--bui-composer-inset'));
					return { inner: hanging.inner(box), inset, words: hanging.words(document.querySelector('#band-end .bui-composer-status-action .bui-button')).right };
				});
				expect(Math.abs(end.inner.right - end.words - end.inset) <= 0.5, `the band's action ends ${end.inner.right - end.words} px from the border, its inset ${end.inset} ${at}`);
				const wake = await hover('#band-end .bui-composer-status-action .bui-button');
				expect(end.inner.right - wake.right >= 2, `the band action's surface comes ${end.inner.right - wake.right} px from the border ${at}`);

				// A product's own line in the band: its wrapped action's words on the state mark's edge
				const wrapped = await page.evaluate(() => {
					const box = document.querySelector('#band-line .bui-composer-box');
					const mark = document.querySelector('#band-line .bui-status-dot').getBoundingClientRect();
					const action = hanging.words(document.querySelector('#band-line .hanging-line > .bui-button-quiet'));
					return { inner: hanging.inner(box), mark: hanging.round(mark.left), top: hanging.round(mark.top), action };
				});
				expect(wrapped.action.top > wrapped.top + 4, `the product line's action did not wrap ${at}: the case no longer measures a wrap`);
				expect(Math.abs(wrapped.action.left - wrapped.mark) <= 0.5, `the wrapped action's words start ${wrapped.action.left - wrapped.mark} px off the mark's edge ${at}`);
				const again = await hover('#band-line .hanging-line > .bui-button-quiet');
				expect(again.left - wrapped.inner.left >= 2, `the wrapped action's surface comes ${again.left - wrapped.inner.left} px from the border ${at}`);

				// A copyable value: Copy twice its hang after the value, its surface clear of it
				const copy = await page.evaluate(() => ({ value: hanging.words(document.querySelector('#copy .bui-copy-value-text')).right, words: hanging.words(document.querySelector('#copy .bui-copy-button .bui-button')).left }));
				const copied = await hover('#copy .bui-copy-button .bui-button');
				expect(copy.words - copy.value >= 15.5, `Copy's words stand ${copy.words - copy.value} px after its value ${at}`);
				expect(copied.left - copy.value >= 4, `Copy's surface comes ${copied.left - copy.value} px from its value ${at}`);

				// No near miss: the line starts of each case share an edge or stand clearly apart
				const misses = await page.evaluate(({ low, high }) => {
					const found = [];
					for (const section of document.querySelectorAll('.hanging-case')) {
						const starts = hanging.starts(section);
						for (const [index, one] of starts.entries()) for (const other of starts.slice(index + 1)) {
							const apart = Math.abs(one.left - other.left);
							if (apart > low && apart < high) found.push(`${section.id}: ${one.name} and ${other.name} start ${hanging.round(apart)} px apart`);
						}
					}
					return found;
				}, near);
				expect(!misses.length, `line starts that nearly meet ${at}:\n${misses.join('\n')}`);
				expect(!errors.length, `page errors ${at}: ${errors.join('; ')}`);
				await page.context().close();
			}
		}
	}
];
