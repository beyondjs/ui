import { expect, overflow } from '../support/browser.mjs';

/**
 * Framed choices (0.46.0) in a real engine, in the installed DOM and React consumers, at 1440 and 390 px in both
 * themes: one framed box drawn as a framed list's (its border and dividers in `--color-border-strong`, its radius),
 * the chosen row on the selection's surface and the pointer's row lifted; the state's tag at the row's end on a wide
 * row and under the hint on a narrow one; a press anywhere on a row (its hint, its tag) toggles its control, a
 * disabled row never, and nothing moves on a press; the title is the row's name and the hint muted under it; the
 * control the keyboard reaches takes the family's ring, the row none, at once under reduced motion.
 */
/** A press where a person presses: at the middle of what they see, whatever is drawn over it. */
const press = async (page, locator) => {
	const box = await locator.boundingBox();
	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
};
const next = browser => (browser.engine === 'webkit' ? 'Alt+Tab' : 'Tab');

/** A role's colour as the engine computes it for a property. */
const role = (page, token, property = 'color') =>
	page.evaluate(([name, key]) => {
		const probe = document.body.appendChild(document.createElement('i'));
		probe.style[key] = `var(${name})`;
		const color = getComputedStyle(probe)[key];
		probe.remove();
		return color;
	}, [token, property]);

/** Where each part of a row is drawn, and its paint. */
const read = (page, nth) =>
	page.locator('#permissions .bui-choice').nth(nth).evaluate(row => {
		const box = node => (node ? node.getBoundingClientRect().toJSON() : null);
		const paint = getComputedStyle(row);
		const title = row.querySelector('.bui-choice-title');
		const note = row.querySelector('.bui-choice-note');
		return {
			row: box(row),
			inset: parseFloat(paint.getPropertyValue('--bui-choices-inset')),
			input: box(row.querySelector('input')),
			title: box(title),
			note: box(note),
			tag: box(row.querySelector('.bui-status')),
			checked: row.querySelector('input').checked,
			background: paint.backgroundColor,
			divider: getComputedStyle(row, '::before').borderTopColor,
			dividing: getComputedStyle(row, '::before').content,
			outline: paint.outlineStyle,
			line: parseFloat(getComputedStyle(title).lineHeight),
			face: { size: getComputedStyle(title).fontSize, weight: getComputedStyle(title).fontWeight, color: getComputedStyle(title).color },
			hint: note ? { size: getComputedStyle(note).fontSize, weight: getComputedStyle(note).fontWeight, color: getComputedStyle(note).color } : null
		};
	});

export const checks = [
	{
		name: 'framed choices (0.46.0): one framed box of rows, the chosen row on the selection, the tag at the end or under a narrow row\'s hint, the whole row its control\'s, at 1440 and 390 px in both themes',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			for (const width of [1440, 390]) for (const colorScheme of ['light', 'dark']) {
				const at = `${browser.engine} ${width}px ${colorScheme}`;
				const { page, context } = await browser.open(consumer, { file: 'framing.html', viewport: { width, height: 900 }, colorScheme, reducedMotion: 'reduce' });
				try {
					await page.evaluate(() => document.fonts.ready);
					const strong = await role(page, '--color-border-strong');
					const selected = await role(page, '--color-surface-selected', 'backgroundColor');
					const lift = await role(page, '--overlay-lift', 'backgroundColor');
					const muted = await role(page, '--color-text-muted');
					const text = await role(page, '--color-text');
					const frame = await page.locator('#permissions .bui-choices-list').evaluate(node => {
						const style = getComputedStyle(node);
						return { width: style.borderTopWidth, color: style.borderTopColor, radius: style.borderTopLeftRadius };
					});
					expect(frame.width === '1px' && frame.color === strong && frame.radius === '8px', `${at}: one framed box in the strong border: ${JSON.stringify(frame)}`);
					const [read0, run, remove, notes] = await Promise.all([0, 1, 2, 3].map(nth => read(page, nth)));
					expect(read0.dividing === 'none' && run.divider === strong && run.dividing !== 'none', `${at}: dividers between rows only: ${JSON.stringify([read0.dividing, run.divider])}`);
					expect(run.checked && run.background === selected && read0.background === 'rgba(0, 0, 0, 0)', `${at}: the chosen row sits on the selection: ${JSON.stringify([run.background, read0.background])}`);
					expect(read0.face.size === '15px' && read0.face.weight === '500' && read0.face.color === text && read0.hint.size === '13px' && read0.hint.weight === '400' && read0.hint.color === muted, `${at}: the title names the row, its hint muted under it: ${JSON.stringify([read0.face, read0.hint])}`);
					for (const row of [read0, run, remove, notes]) {
						expect(Math.abs(row.input.left - row.row.left - row.inset) < 1 && Math.abs(row.input.top - row.row.top - row.inset) < 1, `${at}: the control first, one inset in: ${JSON.stringify([row.row, row.input])}`);
						const centre = row.title.top + row.line / 2;
						expect(row.title.left >= row.input.right && Math.abs(centre - (row.input.top + row.input.height / 2)) < 1, `${at}: the title's first line is centred on the control: ${JSON.stringify([row.title, row.input, row.line])}`);
						if (row.note) expect(row.note.top >= row.title.bottom - 0.5 && Math.abs(row.note.left - row.title.left) < 1, `${at}: the hint under the title, on its edge`);
					}
					const narrow = width < 480;
					for (const row of [read0, run, notes]) {
						if (narrow) expect(Math.abs(row.tag.left - row.title.left) < 1 && row.tag.top >= (row.note ?? row.title).bottom - 0.5, `${at}: on a narrow row the tag goes under the hint: ${JSON.stringify(row)}`);
						else expect(Math.abs(row.row.right - row.inset - row.tag.right) < 1 && row.tag.top < row.title.bottom && (!row.note || row.tag.bottom <= row.note.top + 0.5), `${at}: the tag at the row's end, on the title's line: ${JSON.stringify(row)}`);
					}
					expect(remove.tag === null, `${at}: no state, no tag`);
					// A press on the hint, then on the tag, toggles the row; a press on the disabled row's reason does nothing
					const before = await page.evaluate(() => window.fixture.changes.length);
					const first = page.locator('#permissions .bui-choice').nth(0);
					await press(page, first.locator('.bui-choice-note'));
					expect(await first.locator('input').isChecked(), `${at}: a press on the hint chooses the row`);
					expect((await read(page, 0)).background === selected, `${at}: the row chosen by a press sits on the selection`);
					await press(page, first.locator('.bui-status'));
					expect(!(await first.locator('input').isChecked()), `${at}: a press on the tag unchooses it`);
					await press(page, page.locator('#permissions .bui-choice').nth(2).locator('.bui-choice-note'));
					expect(!(await page.locator('#permissions .bui-choice').nth(2).locator('input').isChecked()), `${at}: a disabled row never toggles`);
					const changes = await page.evaluate(() => window.fixture.changes.slice());
					expect(changes.length - before === 2, `${at}: two changes reported: ${JSON.stringify(changes)}`);
					// The pointer's row is lifted; a press moves nothing
					const last = page.locator('#permissions .bui-choice').nth(3);
					await last.hover();
					expect((await read(page, 3)).background === lift, `${at}: the pointer's row is lifted`);
					const rest = await read(page, 3);
					await page.mouse.down();
					const pressed = await read(page, 3);
					await page.mouse.up();
					expect(['row', 'input', 'title', 'tag'].every(part => JSON.stringify(rest[part]) === JSON.stringify(pressed[part])), `${at}: nothing moves on a press`);
					// A radio group framed alike: a press on the second row's hint chooses it
					await press(page, page.locator('#reach .bui-choice').nth(1).locator('.bui-choice-note'));
					expect(await page.locator('#reach input[value="all"]').isChecked(), `${at}: a framed radio row is chosen by a press`);
					expect(!(await overflow(page)), `${at}: no horizontal overflow`);
				} finally {
					await context.close();
				}
			}
		}
	},
	{
		name: 'framed choices (0.46.0): the control the keyboard reaches takes the family\'s ring, the row draws none, at once under reduced motion, and the keyboard toggles it',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const colorScheme of ['light', 'dark']) {
				const { page, context } = await browser.open(consumer, { file: 'framing.html', viewport: { width: 1280, height: 900 }, colorScheme, reducedMotion: 'reduce' });
				try {
					const coral = await role(page, '--color-focus');
					await page.getByRole('button', { name: 'Before the permissions' }).focus();
					await page.keyboard.press(next(browser));
					const reached = await page.evaluate(() => {
						const node = document.activeElement;
						const style = getComputedStyle(node);
						const row = node.closest('.bui-choice');
						return { input: node.matches('#permissions input[value="read"]'), outline: style.outlineStyle, width: style.outlineWidth, offset: style.outlineOffset, color: style.outlineColor, moving: node.getAnimations().length, row: getComputedStyle(row).outlineStyle };
					});
					expect(reached.input, `${colorScheme}: Tab reaches the first row's control: ${JSON.stringify(reached)}`);
					expect(reached.outline === 'solid' && reached.width === '2px' && reached.offset === '2px' && reached.color === coral, `${colorScheme}: the family's ring on the control: ${JSON.stringify(reached)}`);
					expect(reached.moving === 0 && reached.row === 'none', `${colorScheme}: at once under reduced motion, and no ring on the row: ${JSON.stringify(reached)}`);
					await page.keyboard.press('Space');
					expect(await page.locator('#permissions input[value="read"]').isChecked(), `${colorScheme}: Space chooses the row`);
				} finally {
					await context.close();
				}
			}
		}
	}
];
