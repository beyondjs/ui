import { expect, overflow } from '../support/browser.mjs';

/**
 * The conversation pieces of 0.10.0 in a real engine, on the `conversation.html` pages: the Composer's
 * keys, heights, split menu, reason, stop and touch targets; LiveText drawn once per frame and still
 * under reduced motion; activity rows and groups by keyboard.
 */
const words = {
	en: { more: 'More ways to send', wait: 'Send without starting', failed: 'Not sent. Your message is still here.', read: 'Read 3 files', state: 'Failed', blocked: 'Only an owner or admin can start web.' },
	es: { more: 'Más formas de enviar', wait: 'Enviar sin iniciar', failed: 'No se envió. Tu mensaje sigue aquí.', read: 'Leyó 3 archivos', state: 'Falló', blocked: 'Solo un propietario o administrador puede iniciar web.' }
};

async function open(browser, consumer, { width = 1440, height = 900, query = '', ...options } = {}) {
	const view = await browser.open(consumer, { file: 'conversation.html', query, viewport: { width, height }, ...options });
	await view.page.waitForSelector('.dock .bui-composer-field');
	await view.page.waitForSelector('#fresh .bui-composer-field');
	await view.page.evaluate(() => document.fonts.ready);
	return view;
}
const sent = (page, text) => page.waitForFunction(value => window.fixture.log.some(entry => entry.endsWith(value)), text, { timeout: 3000 });
const settled = (page, at) => page.waitForFunction(selector => !document.querySelector(`${selector} .bui-composer[data-busy]`), at);

export const checks = [
	{
		name: 'composer: Enter sends, Shift+Enter adds a line, ⌘/Ctrl+Enter sends, an input method\'s Enter and Escape never send or clear, focus stays in the field',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer);
			const field = page.locator('.dock .bui-composer-field');
			await field.click();
			await page.keyboard.type('first line');
			await page.keyboard.press('Shift+Enter');
			await page.keyboard.type('second line');
			expect((await field.inputValue()) === 'first line\nsecond line', `Shift+Enter adds a line: ${JSON.stringify(await field.inputValue())}`);
			await page.keyboard.press('Enter');
			await sent(page, ':first line\nsecond line');
			expect((await field.inputValue()) === '', 'the text left the field at once');
			await settled(page, '.dock');
			expect(await page.evaluate(() => document.activeElement === document.querySelector('.dock .bui-composer-field')), 'focus stays in the field');
			await page.keyboard.type('third');
			await page.keyboard.press('Control+Enter');
			await sent(page, ':third');
			await settled(page, '.dock');
			await page.keyboard.type('fourth');
			await page.keyboard.press('Meta+Enter');
			await sent(page, ':fourth');
			await settled(page, '.dock');
			// An input method's Enter: synthetic events with isComposing and Safari's key code 229 (no real IME runs here)
			const composing = await page.evaluate(() => {
				const control = document.querySelector('.dock .bui-composer-field');
				control.value = 'かな';
				const events = [new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, isComposing: true }), new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })];
				Object.defineProperty(events[1], 'keyCode', { value: 229 });
				return events.map(event => control.dispatchEvent(event));
			});
			expect(composing.every(Boolean), 'an input method\'s Enter is left alone');
			await page.keyboard.press('Escape');
			expect((await field.inputValue()) === 'かな', 'Escape neither sends nor clears');
			expect(!(await page.evaluate(() => window.fixture.log.some(entry => entry.endsWith('かな')))), 'nothing composed was sent');
		}
	},
	{
		name: 'composer: one line when empty and at most 96 px with its toolbar; it grows to 12 lines, then scrolls; the dock is at most a quarter of 320×640; tools take a row of their own when narrow; both themes',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const scheme of ['light', 'dark']) {
				for (const [width, height] of [[1440, 900], [1024, 768], [390, 844], [320, 640]]) {
					const at = `${width}px ${scheme}`;
					const { page, context } = await open(browser, consumer, { width, height, colorScheme: scheme });
					expect(!(await overflow(page)), `${at}: no sideways scroll`);
					const found = await page.evaluate(() => {
						const box = node => node.getBoundingClientRect();
						const field = document.querySelector('.dock .bui-composer-field');
						const line = parseFloat(getComputedStyle(field).lineHeight);
						const tools = box(document.querySelector('#fresh .bui-composer-tools'));
						const end = box(document.querySelector('#fresh .bui-composer-end'));
						return { composer: box(document.querySelector('.dock .bui-composer')).height, dock: box(document.querySelector('.dock')).height, field: box(field).height, line, own: tools.bottom <= end.top + 1, width: box(document.querySelector('#fresh .bui-composer')).width };
					});
					expect(found.field <= found.line * 2, `${at}: one line when empty: ${JSON.stringify(found)}`);
					expect(found.composer <= 96, `${at}: at most 96 px with its toolbar: ${found.composer}`);
					if (width === 320) expect(found.dock <= 160, `${at}: the dock is ${found.dock}px of a 640 px window`);
					if (found.width < 480) expect(found.own, `${at}: the tools take a row of their own: ${JSON.stringify(found)}`);
					await context.close();
				}
			}
			const { page } = await open(browser, consumer, { width: 1024 });
			const grown = await page.evaluate(async () => {
				const field = document.querySelector('.dock .bui-composer-field');
				const line = parseFloat(getComputedStyle(field).lineHeight);
				field.value = Array.from({ length: 20 }, (_, index) => `line ${index + 1}`).join('\n');
				field.dispatchEvent(new Event('input', { bubbles: true }));
				await new Promise(resolve => requestAnimationFrame(resolve));
				return { lines: (field.getBoundingClientRect().height - parseFloat(getComputedStyle(field).paddingTop) - parseFloat(getComputedStyle(field).paddingBottom)) / line, scrolls: field.scrollHeight > field.clientHeight + 1 };
			});
			expect(Math.abs(grown.lines - 12) < 0.6 && grown.scrolls, `12 lines, then it scrolls: ${JSON.stringify(grown)}`);
		}
	},
	{
		name: 'composer: the split menu sends another way, the chevron shows its name, a reason is said beside the action, stop is busy while it runs, a refused send keeps the text',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			const { page } = await open(browser, consumer, { width: 1440 });
			const fresh = page.locator('#fresh');
			await fresh.locator('.bui-composer-field').fill('Run the checks');
			const chevron = fresh.getByRole('button', { name: copy.more });
			await chevron.hover();
			await page.locator('.bui-hint:not([hidden])').waitFor();
			expect((await page.locator('.bui-hint:not([hidden])').textContent()) === copy.more, 'the chevron shows its name as a tooltip');
			await chevron.click();
			await fresh.getByRole('menuitem', { name: copy.wait }).click();
			await sent(page, 'send:wait:Run the checks');
			await settled(page, '#fresh');
			await page.evaluate(() => (window.fixture.refuse = true));
			await fresh.locator('.bui-composer-field').fill('Deploy it');
			await fresh.locator('.bui-composer-field').press('Enter');
			await fresh.locator('.bui-composer-problem:not([hidden])').waitFor();
			expect((await fresh.locator('.bui-composer-field').inputValue()) === 'Deploy it', 'a refused send keeps the text');
			expect((await fresh.locator('.bui-composer-problem').textContent()).trim() === copy.failed, 'and says so');
			await page.evaluate(reason => window.fixture.block(reason), copy.blocked);
			// React applies the state with its next commit
			await fresh.locator('.bui-composer-reason:not([hidden])').waitFor();
			const placed = await page.evaluate(() => {
				const reason = document.querySelector('#fresh .bui-composer-reason').getBoundingClientRect();
				const button = document.querySelector('#fresh .bui-composer-send .bui-button-primary');
				return { beside: reason.right <= button.getBoundingClientRect().left + 1 || reason.bottom <= button.getBoundingClientRect().top + 1, shown: reason.width > 0, disabled: button.getAttribute('aria-disabled'), reachable: button.tabIndex >= 0 && !button.disabled };
			});
			expect(placed.shown && placed.beside && placed.disabled === 'true' && placed.reachable, `the reason beside an action that stays reachable: ${JSON.stringify(placed)}`);
			const stop = page.locator('.dock .bui-composer-stop');
			await stop.click();
			expect((await stop.getAttribute('data-busy')) !== null, 'stop is busy while it runs');
			await page.waitForFunction(() => window.fixture.log.includes('interrupt'));
			await page.waitForFunction(() => !document.querySelector('.dock .bui-composer-stop[data-busy]'));
		}
	},
	{
		name: 'composer on a touch screen at 390 px: 44 px targets, Enter adds a line and the button sends',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, { width: 390, height: 844, hasTouch: true, isMobile: true });
			expect(await page.evaluate(() => matchMedia('(hover: none) and (pointer: coarse)').matches), 'a touch screen');
			const small = await page.evaluate(() => [...document.querySelectorAll('.bui-composer button')].filter(node => node.getClientRects().length).map(node => node.getBoundingClientRect()).filter(box => box.height < 44 || box.width < 44).map(box => [box.width, box.height]));
			expect(!small.length, `targets under 44 px: ${JSON.stringify(small)}`);
			const field = page.locator('.dock .bui-composer-field');
			await field.tap();
			await page.keyboard.type('from a phone');
			await page.keyboard.press('Enter');
			expect((await field.inputValue()) === 'from a phone\n', `Enter adds a line on a touch screen: ${JSON.stringify(await field.inputValue())}`);
			await page.locator('.dock .bui-composer-send .bui-button-primary').tap();
			await sent(page, ':from a phone');
		}
	},
	{
		name: 'live text: many pieces drawn at most once per frame, busy while live with no live region, a still mark under reduced motion, settled at once; the plan beside it says nothing either',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			for (const reducedMotion of ['no-preference', 'reduce']) {
				const { page, context } = await open(browser, consumer, { reducedMotion });
				const before = await page.evaluate(() => window.fixture.draws);
				const frames = await page.evaluate(() => window.fixture.stream(2, 1));
				const draws = (await page.evaluate(() => window.fixture.draws)) - before;
				expect(draws <= frames + 2, `${draws} drawings in ${frames} frames`);
				const live = await page.evaluate(() => {
					const node = document.querySelector('.bui-live');
					const mark = node.querySelector('.bui-live-mark');
					return { busy: node.getAttribute('aria-busy'), regions: node.querySelectorAll('[aria-live], [role="status"], [role="alert"]').length, word: mark?.textContent.trim(), animation: mark ? getComputedStyle(mark, '::after').animationName : null, text: node.textContent };
				});
				expect(live.busy === 'true' && live.regions === 0 && live.word, `live, busy, said by nothing: ${JSON.stringify(live)}`);
				expect(await page.evaluate(() => document.querySelector('.thread .bui-steps') && !document.querySelector('.thread .bui-steps [aria-live]')), 'the plan (announce: false) has no live region of its own');
				expect(live.text.includes('whole suite passes') || live.text.includes('suite passes'), 'the whole answer arrived');
				if (reducedMotion === 'reduce') expect(live.animation === 'none', `a still mark: ${live.animation}`);
				else expect(live.animation === 'bui-pulse', `a pulsing mark: ${live.animation}`);
				await page.evaluate(() => (window.fixture.live.current ?? window.fixture.live).settle());
				const done = await page.evaluate(() => [document.querySelector('.bui-live').hasAttribute('aria-busy'), Boolean(document.querySelector('.bui-live-mark'))]);
				expect(!done[0] && !done[1], `settled: ${done}`);
				await context.close();
			}
		}
	},
	{
		name: 'activity: rows open by keyboard and build their body once, sections fold and copy, a cut title shows whole, states in words, a group folds its rows; an update keeps a row open and focused',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			const { page } = await open(browser, consumer, { width: 390, height: 844 });
			expect(!(await overflow(page)), 'no sideways scroll at 390 px');
			const rows = page.locator('.thread > .bui-activity:not(.bui-activity-group), .thread > .bui-host > .bui-activity:not(.bui-activity-group)');
			const failed = rows.nth(1).locator(':scope > .bui-activity-head');
			expect((await failed.textContent()).includes(copy.state), 'the state in words');
			await failed.focus();
			await page.keyboard.press('Enter');
			expect((await failed.getAttribute('aria-expanded')) === 'true', 'Enter opens it');
			if (consumer.name === 'dom') {
				const code = rows.nth(1).locator('.bui-activity-section').nth(1).locator('code');
				expect((await code.textContent()).split('\n').length === 12, 'the first 12 lines');
				await rows.nth(1).locator('.bui-activity-section').nth(1).getByRole('button', { expanded: false }).click();
				expect((await code.textContent()).split('\n').length === 20, 'Show all shows every line');
				await failed.focus();
				await page.evaluate(() => window.fixture.rows.failed.update({ meta: 'exit 2', title: 'Ran npm test again' }));
				expect((await failed.getAttribute('aria-expanded')) === 'true' && (await page.evaluate(() => document.activeElement.classList.contains('bui-activity-head'))), 'an update keeps it open and focused');
			}
			await failed.focus();
			await page.keyboard.press(' ');
			expect((await failed.getAttribute('aria-expanded')) === 'false', 'Space closes it');
			const group = page.locator('.bui-activity-group > .bui-activity-head');
			expect((await group.locator('.bui-activity-title').textContent()) === copy.read, 'the group\'s title counts its rows');
			await group.click();
			expect((await page.locator('.bui-activity-group .bui-activity-list > li:visible').count()) === 3, 'its rows inside');
			const running = rows.nth(2).locator(':scope > .bui-activity-head');
			const cut = await running.locator('.bui-activity-title').evaluate(node => node.scrollHeight > node.clientHeight + 1);
			expect(cut, 'the long title is cut at two lines at 390 px');
			await running.hover();
			const tip = page.locator('.bui-tooltip:not([hidden])');
			await tip.waitFor();
			expect((await tip.textContent()).includes('failed-payment.test.js'), 'shown whole on hover');
			expect((await rows.nth(2).locator('.bui-activity-tail').textContent()).includes('ok 2'), 'the running step\'s tail');
		}
	}
];
