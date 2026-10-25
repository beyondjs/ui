import { expect } from '../support/browser.mjs';

/**
 * Focus says what the keys do there (0.34.0, D187), measured in a real engine: a control the keyboard reached is
 * ringed in coral and the ring settles; a box that takes typing lights its own edge with a halo and a coral caret,
 * from a pointer as from the keyboard, and keeps a wrong value's danger; the composer's box lights while its field
 * has the focus and a press in its empty room reaches the field; the row the arrow keys are on is lit and ringed
 * inside at once; a place the page focuses for reading draws nothing; what the keyboard reaches in a thread lands
 * above the docked composer; and a forced-colors theme still sees the edge.
 */
async function open(browser, consumer, { page: shape = 'forms', scheme = 'light', ...options } = {}) {
	const view = await browser.open(consumer, { file: 'focus.html', query: `?page=${shape}`, viewport: { width: 1280, height: 800 }, colorScheme: scheme, ...options });
	await view.page.evaluate(() => document.fonts.ready);
	return view;
}

/** A role's color as the engine computes it, to compare with a computed border or outline. */
const role = (page, name) =>
	page.evaluate(token => {
		const probe = document.body.appendChild(document.createElement('i'));
		probe.style.color = `var(${token})`;
		const color = getComputedStyle(probe).color;
		probe.remove();
		return color;
	}, name);

/** What the focused element draws once its ring has settled. */
const drawn = (page, selector = null) =>
	page.evaluate(async query => {
		const node = query ? document.querySelector(query) : document.activeElement;
		await Promise.all(node.getAnimations().map(animation => animation.finished.catch(() => undefined)));
		const style = getComputedStyle(node);
		return { active: document.activeElement === node || node.contains(document.activeElement), outline: style.outlineStyle, width: style.outlineWidth, offset: style.outlineOffset, outlineColor: style.outlineColor, border: style.borderTopColor, start: style.borderInlineStartColor, shadow: style.boxShadow, caret: style.caretColor, background: style.backgroundColor };
	}, selector);

/** Tab presses until `selector` has the focus, at most `limit` of them. */
async function tab(page, selector, limit = 20) {
	for (let step = 0; step < limit; step += 1) {
		await page.keyboard.press('Tab');
		if (await page.evaluate(query => document.activeElement?.matches(query), selector)) return;
	}
	throw new Error(`Tab never reached ${selector}`);
}

export const checks = [
	{
		name: 'focus, the ring: a control the keyboard reached is ringed in coral, 2 px, 2 px out, settling onto it; a press draws none; under reduced motion it appears at once',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer);
			const coral = await role(page, '--color-focus');
			await page.locator('#before').focus();
			await page.keyboard.press('Tab');
			const settling = await page.evaluate(() => document.activeElement.getAnimations().map(animation => animation.animationName));
			expect(settling.includes('bui-ring'), `the ring settles: ${JSON.stringify(settling)}`);
			const ring = await drawn(page);
			expect(ring.outline === 'solid' && ring.width === '2px' && ring.offset === '2px' && ring.outlineColor === coral, `coral, 2 px, 2 px out: ${JSON.stringify(ring)}`);
			// WebKit does not focus a pressed button; where one is focused, it draws no ring
			await page.getByRole('button', { name: 'Create pull request' }).click();
			const pressed = await drawn(page, '.fixture-row .bui-button-primary');
			expect(pressed.outline === 'none', `a press draws none: ${JSON.stringify(pressed)}`);
			const still = await open(browser, consumer, { reducedMotion: 'reduce' });
			await still.page.locator('#before').focus();
			await still.page.keyboard.press('Tab');
			const at = await still.page.evaluate(() => ({ moving: document.activeElement.getAnimations().length, offset: getComputedStyle(document.activeElement).outlineOffset }));
			expect(at.moving === 0 && at.offset === '2px', `under reduced motion the ring appears at once: ${JSON.stringify(at)}`);
		}
	},
	{
		name: 'focus, the edge: a field lights its own border with a halo and a coral caret, from a press as from the keyboard, with no ring; a wrong value keeps its danger; a forced-colors theme sees an outline',
		consumers: ['dom'],
		async run(browser, consumer) {
			for (const scheme of ['light', 'dark']) {
				const { page } = await open(browser, consumer, { scheme });
				const [edge, coral, danger] = [await role(page, '--color-focus-edge'), await role(page, '--color-focus'), await role(page, '--color-danger')];
				const field = page.getByLabel('Repository name');
				await field.click();
				const lit = await drawn(page);
				expect(lit.border === edge && lit.outline === 'none' && /3px/.test(lit.shadow) && lit.caret === coral, `${scheme}: a press lights the edge, no ring, a coral caret: ${JSON.stringify({ ...lit, edge, coral })}`);
				await page.keyboard.press('Tab');
				const wrong = await drawn(page);
				expect(wrong.border === danger && /3px/.test(wrong.shadow) && wrong.outline === 'none', `${scheme}: a wrong value keeps the danger's edge: ${JSON.stringify({ ...wrong, danger })}`);
				await page.keyboard.press('Tab');
				const select = await drawn(page);
				expect(select.border === edge && select.outline === 'none', `${scheme}: a select from the keyboard lights its edge: ${JSON.stringify(select)}`);
			}
			if (browser.engine === 'chrome') {
				const { page } = await open(browser, consumer, { forcedColors: 'active' });
				await page.getByLabel('Repository name').click();
				const forced = await drawn(page);
				expect(forced.outline === 'solid' && forced.width === '2px', `a forced-colors theme sees an outline: ${JSON.stringify(forced)}`);
			}
		}
	},
	{
		name: 'focus, the composer: its box lights while its field has the focus and rests while a control has it; a press in its empty room puts the caret in the field; the live line runs inside the edge',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, { page: 'thread' });
			const [edge, rest] = [await role(page, '--color-focus-edge'), await role(page, '--color-border-control')];
			const room = await page.evaluate(() => {
				const bar = document.querySelector('.bui-composer-bar');
				const box = bar.getBoundingClientRect();
				const y = box.top + box.height / 2;
				for (let x = box.left + 4; x < box.right - 4; x += 4) {
					const hit = document.elementFromPoint(x, y);
					if (hit && bar.contains(hit) && !hit.closest('button, a, [role], input, label')) return { x, y };
				}
				return null;
			});
			expect(room, 'the toolbar has room between its controls');
			await page.mouse.click(room.x, room.y);
			const reached = await page.evaluate(() => document.activeElement?.classList.contains('bui-composer-field'));
			expect(reached, 'a press in the box\'s empty room puts the caret in the field');
			const lit = await drawn(page, '.bui-composer-box');
			expect(lit.border === edge && lit.outline === 'none' && /3px/.test(lit.shadow), `the box lights its edge: ${JSON.stringify({ ...lit, edge })}`);
			await page.keyboard.press('Tab');
			const resting = await drawn(page, '.bui-composer-box');
			const control = await drawn(page);
			expect(resting.border === rest && resting.shadow === 'none', `the box rests while a control has the focus: ${JSON.stringify(resting)}`);
			expect(control.outline === 'solid', `and that control is ringed: ${JSON.stringify(control)}`);
			await page.evaluate(() => (window.fixture.composer.live = true));
			const line = await page.evaluate(() => getComputedStyle(document.querySelector('.bui-composer-box'), '::before').top);
			expect(line === '1px', `the live line runs 1 px inside the edge: ${line}`);
		}
	},
	{
		name: 'focus, the cursor: the row the arrow keys are on is lit and ringed inside, at once; the selection keeps its bar',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer);
			await tab(page, '#rows .bui-row-title');
			await page.keyboard.press('ArrowDown');
			const row = await page.evaluate(() => {
				const node = document.activeElement.closest('.bui-row');
				const style = getComputedStyle(node);
				return { second: node === document.querySelectorAll('#rows .bui-row')[1], background: style.backgroundColor, outline: style.outlineStyle, offset: style.outlineOffset, moving: node.getAnimations().length };
			});
			expect(row.second && row.outline === 'solid' && row.offset === '-2px' && row.background !== 'rgba(0, 0, 0, 0)' && row.moving === 0, `the cursor is lit and ringed inside, at once: ${JSON.stringify(row)}`);
		}
	},
	{
		name: 'focus, nothing: a side sheet\'s title and a heading the page focuses for reading draw nothing from the keyboard; the next Tab rings the next control',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer);
			await tab(page, '#details');
			await page.keyboard.press('Enter');
			await page.waitForSelector('dialog.bui-sheet[open]');
			const title = await drawn(page);
			const named = await page.evaluate(() => document.activeElement.classList.contains('bui-sheet-title'));
			expect(named && title.outline === 'none' && title.shadow === 'none', `the sheet's title draws nothing: ${JSON.stringify(title)}`);
			await page.keyboard.press('Tab');
			const next = await drawn(page);
			expect(next.outline === 'solid', `the next Tab rings the next control: ${JSON.stringify(next)}`);
			await page.keyboard.press('Escape');
			await page.waitForFunction(() => !document.querySelector('dialog.bui-sheet[open]'));
			await tab(page, '#read');
			await page.keyboard.press('Enter');
			const heading = await drawn(page);
			const reading = await page.evaluate(() => document.activeElement.id);
			expect(reading === 'results' && heading.outline === 'none', `a heading focused for reading draws nothing: ${JSON.stringify(heading)}`);
		}
	},
	{
		name: 'focus, the card that decides: a request waiting for an answer lights whenever it has the focus, keeping its attention stripe',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer);
			const [edge, warning] = [await role(page, '--color-focus-edge'), await role(page, '--color-warning')];
			await page.evaluate(() => window.fixture.card.element.focus());
			const card = await drawn(page, '.bui-command');
			expect(card.active && card.shadow.includes(edge) && card.start === warning && card.outline === 'none', `the card lights and keeps its stripe: ${JSON.stringify({ ...card, edge, warning })}`);
		}
	},
	{
		name: 'focus, never covered: what the keyboard reaches in a thread lands above the docked composer, however tall it grows',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, { page: 'thread' });
			const clear = () =>
				page.evaluate(() => {
					const link = document.activeElement.getBoundingClientRect();
					const dock = document.querySelector('.bui-page-dock').getBoundingClientRect();
					return { link: link.bottom, dock: dock.top, clear: link.bottom <= dock.top };
				});
			// From the first turn's link, Tab walks down to links below the window, which the engine scrolls into view
			const walk = async presses => {
				await page.evaluate(() => (window.scrollTo(0, 0), document.querySelector('.fixture-link').focus({ preventScroll: true })));
				const seen = [];
				for (let step = 0; step < presses; step += 1) {
					await page.keyboard.press('Tab');
					seen.push(await clear());
				}
				return seen;
			};
			const below = await walk(24);
			expect(below.every(each => each.clear), `every reached link lands above the dock: ${JSON.stringify(below.filter(each => !each.clear))}`);
			await page.locator('.bui-composer-field').fill('One\nTwo\nThree\nFour\nFive\nSix');
			const taller = await walk(24);
			expect(taller.every(each => each.clear), `and above a taller composer: ${JSON.stringify(taller.filter(each => !each.clear))}`);
		}
	}
];
