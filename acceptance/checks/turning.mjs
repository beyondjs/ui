import { expect, overflow } from '../support/browser.mjs';

/**
 * A thread read by turns (0.29.0) in a real engine, on the `turns.html` pages (the DOM page in English, the
 * React pages in Spanish): the turns at the region's width up to 80rem and the composer on its 48rem lane on
 * their axis (D180); the index of the turns in the thread's gutter, the turn being read current, a preview
 * beside it and marks that lengthen under the pointer, gone under a 1024 px region (D182); the compact line
 * saying the message of the turn being read, pressed to go back to it, and Option/Alt with the arrows
 * moving between turns (D181, D182); the composer's quiet Send and its one inset, measured from the font's
 * own capitals (D183, D184).
 */
async function open(browser, consumer, { width = 1440, height = 900, query = '', ...options } = {}) {
	const view = await browser.open(consumer, { file: 'turns.html', query, viewport: { width, height }, ...options });
	await view.page.waitForSelector('.bui-page-dock .bui-composer-field');
	await view.page.evaluate(() => document.fonts.ready);
	await settle(view.page);
	return view;
}
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 30)))));
const messages = {
	en: ['Look at the checkout redirect', 'Can you also check the same flow on mobile Safari?\nIt has its own cookie rules.'],
	es: ['Mira la redirección del pago', '¿Puedes revisar el mismo flujo en Safari para móviles?\nTiene sus propias reglas de cookies.']
};
const language = consumer => (consumer.name === 'dom' ? 'en' : 'es');

/** Where the turns, the message, the composer, the heading and the index stand. */
const geometry = page =>
	page.evaluate(() => {
		const box = node => {
			if (!node) return null;
			const { left, right, top, bottom, width, height } = node.getBoundingClientRect();
			return { left, right, top, bottom, width, height };
		};
		const index = document.querySelector('.bui-turns');
		return {
			rem: parseFloat(getComputedStyle(document.documentElement).fontSize),
			gutter: parseFloat(getComputedStyle(document.querySelector('.bui-page-frame')).paddingLeft),
			region: box(document.querySelector('.bui-page')),
			turn: box(document.querySelector('.fixture-turn')),
			message: box(document.querySelector('.fixture-message')),
			composer: box(document.querySelector('.bui-page-dock .bui-composer-box')),
			heading: box(document.querySelector('.bui-page-heading')),
			list: box(document.querySelector('.bui-turns-list')),
			shown: Boolean(index) && getComputedStyle(index).display !== 'none' && !index.hidden,
			marks: document.querySelectorAll('.bui-turns-mark').length,
			height: innerHeight
		};
	});

/** Scrolls so the top of `key`'s turn stands `past` pixels above the page's sticky edge. */
const reach = (page, key, past) =>
	page.evaluate(
		async ({ key, past }) => {
			const edge = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
			const turn = document.getElementById(`turn=${key}`);
			window.scrollTo(0, scrollY + turn.getBoundingClientRect().top - edge + past);
			await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 50))));
		},
		{ key, past }
	);
/** The distance from the page's sticky edge to the top of `key`'s turn. */
const offset = (page, key) =>
	page.evaluate(key => {
		const edge = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
		return Math.round(document.getElementById(`turn=${key}`).getBoundingClientRect().top - edge);
	}, key);

export const checks = [
	{
		name: 'a thread reads by turns (D180): the turns at the region up to 80rem, centred, the message across its turn on the heading\'s edge, the composer on its 48rem lane on their axis, at 1024, 1440, 1920 and 2560 px in both themes',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const scheme of ['light', 'dark']) {
				for (const width of [1024, 1440, 1920, 2560]) {
					const at = `${width}px ${scheme}`;
					const { page, context } = await open(browser, consumer, { width, colorScheme: scheme });
					const found = await geometry(page);
					const room = found.region.width - 2 * found.gutter;
					expect(Math.abs(found.turn.width - Math.min(80 * found.rem, room)) <= 2, `${at}: the turn takes the region up to 80rem: ${JSON.stringify(found)}`);
					expect(Math.abs(found.turn.left - found.region.left - (found.region.width - found.turn.width) / 2) <= 2, `${at}: centred: ${JSON.stringify(found)}`);
					expect(Math.abs(found.message.left - found.turn.left) <= 1 && Math.abs(found.message.right - found.turn.right) <= 1, `${at}: the message across its turn: ${JSON.stringify(found)}`);
					expect(Math.abs(found.heading.left - found.turn.left) <= 1, `${at}: on the heading's edge: ${JSON.stringify(found)}`);
					expect(Math.abs(found.composer.width - Math.min(48 * found.rem, found.turn.width)) <= 2, `${at}: the composer on its 48rem lane: ${JSON.stringify(found)}`);
					expect(Math.abs(found.composer.left + found.composer.width / 2 - (found.turn.left + found.turn.width / 2)) <= 2, `${at}: on the turns' axis: ${JSON.stringify(found)}`);
					if (found.region.width >= 1024) expect(found.gutter === 48, `${at}: the thread's gutter holds its index: ${found.gutter}`);
					expect(!(await overflow(page)), `${at}: no sideways scroll`);
					await context.close();
				}
			}
		}
	},
	{
		name: 'the index of the turns (D182): one mark per turn in the gutter, beside the turns and halfway down, the turn being read current, a preview beside the index on hover and focus with the marks lengthening; still under reduced motion; gone under a 1024 px region',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page, context } = await open(browser, consumer, { width: 1440 });
			const found = await geometry(page);
			expect(found.shown && found.marks === 12, `the index shows its twelve turns: ${JSON.stringify(found)}`);
			expect(found.list.right <= found.turn.left - 8 && found.list.left >= found.region.left + 4, `in the gutter, beside the turns: ${JSON.stringify(found)}`);
			expect(Math.abs(found.list.top + found.list.height / 2 - found.height / 2) <= 6, `halfway down the window: ${JSON.stringify(found)}`);
			await reach(page, 't3', 120);
			const current = await page.locator('.bui-turns-mark[aria-current="true"]').getAttribute('href');
			expect(current === '#turn=t3', `the turn being read is current: ${current}`);
			const mark = page.locator('.bui-turns-mark').nth(6);
			await mark.hover();
			const preview = page.locator('.bui-turns-preview');
			await preview.waitFor({ state: 'visible' });
			// The dashes ease to their lengths (--motion-quick): measure them once they settle
			await page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => undefined))));
			const placed = await page.evaluate(() => {
				const list = document.querySelector('.bui-turns-list').getBoundingClientRect();
				const card = document.querySelector('.bui-turns-preview').getBoundingClientRect();
				const dash = index => document.querySelectorAll('.bui-turns-dash')[index].getBoundingClientRect().width;
				return { list: list.right, card: { left: card.left, right: card.right, top: card.top, bottom: card.bottom }, width: innerWidth, height: innerHeight, near: [...document.querySelectorAll('.bui-turns-mark')].map(node => node.dataset.near ?? null), pointed: dash(6), far: dash(11), top: document.querySelector('.bui-turns-preview').matches(':popover-open') };
			});
			expect(placed.card.left >= placed.list && placed.card.right <= placed.width && placed.card.bottom <= placed.height, `beside the index, inside the window: ${JSON.stringify(placed)}`);
			expect(placed.near.slice(4, 9).join(',') === '2,1,0,1,2' && placed.pointed > placed.far, `the pointed mark and its neighbours lengthen: ${JSON.stringify(placed)}`);
			expect(placed.top, 'the preview stands in the top layer');
			const title = (await preview.locator('.bui-turns-preview-title').textContent()).trim();
			expect(title.length > 0 && (await page.locator('.fixture-message').nth(6).textContent()).trim() === title, `it says the turn's message: ${title}`);
			await page.mouse.move(700, 450);
			await page.locator('.bui-turns-mark').nth(1).focus();
			await preview.waitFor({ state: 'visible' });
			const described = await page.evaluate(() => document.activeElement.getAttribute('aria-describedby') === document.querySelector('.bui-turns-preview').id);
			expect(described, 'the focused mark is described by the preview');
			await page.keyboard.press('Escape');
			await preview.waitFor({ state: 'hidden' });
			await context.close();
			const still = await open(browser, consumer, { width: 1440, reducedMotion: 'reduce' });
			const motion = await still.page.evaluate(() => getComputedStyle(document.querySelector('.bui-turns-dash')).transitionDuration);
			expect(/^0s(, 0s)*$/.test(motion), `nothing moves under reduced motion: ${motion}`);
			await still.context.close();
			const narrow = await open(browser, consumer, { width: 1000 });
			const small = await geometry(narrow.page);
			expect(!small.shown, `under a 1024 px region the index leaves: ${JSON.stringify(small)}`);
			expect(!(await overflow(narrow.page)), 'no sideways scroll');
			await narrow.context.close();
		}
	},
	{
		name: 'the compact line says the message of the turn being read, pressed to go back to it (D181); Option/Alt with the arrows moves between turns, back to the message first, never from the composer (D182)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const [, safari] = messages[language(consumer)];
			const { page, context } = await open(browser, consumer, { width: 1440, height: 900 });
			await reach(page, 't4', 240);
			const line = await page.evaluate(() => {
				const bar = document.querySelector('.bui-page-compact');
				const subject = bar.querySelector('.bui-page-compact-subject');
				return { shown: bar.hasAttribute('data-shown'), said: bar.hasAttribute('data-subject'), text: subject.textContent, title: bar.querySelector('.bui-page-compact-title').hidden, lines: Math.round(subject.getBoundingClientRect().height / parseFloat(getComputedStyle(subject).lineHeight)) };
			});
			expect(line.shown && line.said && line.text === safari && line.title, `the line says the turn's message in place of the title: ${JSON.stringify(line)}`);
			expect(line.lines === 2, `as written, on two lines: ${JSON.stringify(line)}`);
			const before = await page.evaluate(() => ({ y: Math.round(scrollY), hash: location.hash }));
			// Pressed where the person sees it: a locator's click would first scroll the sticky line's holder into
			// view (WebKit does), which changes the turn being read before the press
			const box = await page.locator('.bui-page-compact-subject').boundingBox();
			await page.mouse.click(box.x + Math.min(box.width / 2, 120), box.y + box.height / 2);
			await settle(page);
			const after = await page.evaluate(() => ({ y: Math.round(scrollY), hash: location.hash, focus: document.activeElement?.className ?? null, edge: getComputedStyle(document.documentElement).scrollPaddingTop }));
			expect(Math.abs(await offset(page, 't4')) <= 2, `pressed, it goes back to the message: ${await offset(page, 't4')} ${JSON.stringify({ before, after })}`);
			await page.evaluate(() => document.activeElement?.blur());
			await reach(page, 't4', 240);
			await page.keyboard.press('Alt+ArrowUp');
			await settle(page);
			expect(Math.abs(await offset(page, 't4')) <= 2, `Up goes back to the message of the turn being read first: ${await offset(page, 't4')}`);
			await page.keyboard.press('Alt+ArrowUp');
			await settle(page);
			expect(Math.abs(await offset(page, 't3')) <= 2, `then to the previous turn: ${await offset(page, 't3')}`);
			await page.keyboard.press('Alt+ArrowDown');
			await page.keyboard.press('Alt+ArrowDown');
			await settle(page);
			expect(Math.abs(await offset(page, 't5')) <= 2, `Down moves to the next turns: ${await offset(page, 't5')}`);
			const hash = await page.evaluate(() => location.hash);
			expect(hash === '#turn=t5', `the address keeps the turn: ${hash}`);
			const said = await page.evaluate(() => document.querySelector('.bui-page-compact').hasAttribute('data-subject'));
			expect(!said, 'at the turn\'s start its message is in view: the line says the title');
			await page.locator('.bui-page-dock .bui-composer-field').focus();
			await page.keyboard.press('Alt+ArrowDown');
			await settle(page);
			expect(Math.abs(await offset(page, 't5')) <= 2, 'the composer keeps its keys');
			await context.close();
		}
	},
	{
		name: 'the composer: with nothing to send Send is quiet and aria-disabled and a press only puts the caret in the field (D183); one inset on every side, the capitals and the controls one inset from the box\'s edges (D184), in both themes',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const scheme of ['light', 'dark']) {
				const { page, context } = await open(browser, consumer, { width: 1440, colorScheme: scheme });
				const send = page.locator('.bui-page-dock .bui-composer-go');
				expect((await send.getAttribute('aria-disabled')) === 'true', `${scheme}: Send can't act yet`);
				await send.click({ force: true });
				await settle(page);
				const after = await page.evaluate(() => ({ focus: document.activeElement === document.querySelector('.bui-page-dock .bui-composer-field'), alarm: [...document.querySelectorAll('.bui-page-dock .bui-composer-problem')].some(node => !node.hidden), band: !document.querySelector('.bui-page-dock .bui-composer-line').hidden }));
				expect(after.focus && !after.alarm && !after.band, `${scheme}: a press says nothing and puts the caret in the field: ${JSON.stringify(after)}`);
				const inset = await page.evaluate(() => {
					const dock = document.querySelector('.bui-page-dock');
					const box = dock.querySelector('.bui-composer-box').getBoundingClientRect();
					const field = dock.querySelector('.bui-composer-field');
					const style = getComputedStyle(field);
					const context = document.createElement('canvas').getContext('2d');
					context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
					const metrics = context.measureText('M');
					const line = parseFloat(style.lineHeight);
					const top = field.getBoundingClientRect().top + parseFloat(style.paddingTop);
					const baseline = top + (line - (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent)) / 2 + metrics.fontBoundingBoxAscent;
					const capitals = baseline - metrics.actualBoundingBoxAscent;
					const controls = [...dock.querySelectorAll('.bui-composer-bar button')].filter(node => node.getBoundingClientRect().width > 0).map(node => node.getBoundingClientRect());
					const first = controls.reduce((a, b) => (a.left <= b.left ? a : b));
					const last = controls.reduce((a, b) => (a.right >= b.right ? a : b));
					return { above: capitals - box.top, below: box.bottom - Math.max(...controls.map(rect => rect.bottom)), start: first.left - box.left, text: field.getBoundingClientRect().left + parseFloat(style.paddingLeft) - box.left, end: box.right - last.right };
				});
				expect(Math.abs(inset.above - inset.below) <= 2, `${scheme}: as much room above the words as under the controls: ${JSON.stringify(inset)}`);
				expect(Math.abs(inset.start - inset.text) <= 1 && Math.abs(inset.end - inset.text) <= 1, `${scheme}: the + on the text's edge and Send one inset from the end: ${JSON.stringify(inset)}`);
				expect(inset.above >= 11 && inset.above <= 15, `${scheme}: one inset of about 12 px: ${JSON.stringify(inset)}`);
				await context.close();
			}
		}
	}
];
