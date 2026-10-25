import { expect, overflow } from '../support/browser.mjs';
import { press, settle } from '../support/press.mjs';
import { words } from '../fixtures/data/pressing.js';

/**
 * Where a press puts the person (0.34.0, D183), in a real engine, on the `pressing.html` pages:
 * - a branch chip that waits for the repository chip is quiet and reachable, and a click, Enter, Space or
 *   ArrowDown only puts focus on the repository chip, opening nothing; a tray chip's whole face is its tooltip;
 * - the held Send's press goes there too, sending nothing, while Enter in the field keeps focus there;
 * - the line comments that go with the message are a `ComposerChip` in the tray, one target tall with its
 *   label muted beside its value, whole there, and its face in the tooltip only once a shortened toolbar sets
 *   its label aside;
 * - React's `Form` with `report` says the browser's own message for a wrong email, runs no `onSubmit` and
 *   leaves the email focused.
 */
const copy = consumer => words[consumer.name === 'dom' ? 'en' : 'es'];
const open = (browser, consumer, options = {}) => browser.open(consumer, { file: 'pressing.html', viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', ...options });
/** Which tray chip holds the focus (0 the repository's, 1 the branch's), and whether a choice list is open. */
const state = page =>
	page.evaluate(() => ({
		at: [...document.querySelectorAll('.bui-composer-tray .bui-chip .bui-choice-button')].indexOf(document.activeElement),
		open: [...document.querySelectorAll('.bui-choice-list')].some(list => !list.hidden),
		sent: window.fixture.log.filter(entry => entry.startsWith('send:')).length
	}));
const chips = page => page.locator('.bui-composer-tray .bui-chip .bui-choice-button');
/** Chooses the first repository, as a person does. */
async function choose(page) {
	await press(page, chips(page).first());
	await page.locator('.bui-choice-list:not([hidden]) [role="menuitemradio"]').first().click();
	await settle(page);
}

export const checks = [
	{
		name: 'pressing: a branch chip that waits is quiet and reachable, and a click, Enter, Space or ArrowDown only puts focus on the repository chip, opening nothing; a repository lets it open (0.34.0, D183)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page, context } = await open(browser, consumer);
			const [repository, branch] = [chips(page).nth(0), chips(page).nth(1)];
			await branch.waitFor();
			expect((await branch.getAttribute('aria-disabled')) === 'true', 'the branch waits, quiet');
			expect(!(await branch.evaluate(node => node.disabled)), 'never natively disabled');
			const said = await page.locator('.bui-composer').evaluate(node => node.textContent);
			await repository.focus();
			await page.keyboard.press('Tab');
			expect((await state(page)).at === 1, 'Tab reaches it');
			for (const key of ['Enter', 'Space', 'ArrowDown']) {
				await branch.focus();
				await page.keyboard.press(key);
				await settle(page);
				const after = await state(page);
				expect(after.at === 0 && !after.open, `${key} only puts the person at the repository chip: ${JSON.stringify(after)}`);
			}
			await press(page, branch);
			await settle(page);
			const clicked = await state(page);
			expect(clicked.at === 0 && !clicked.open, `a click too: ${JSON.stringify(clicked)}`);
			expect((await page.locator('.bui-composer').evaluate(node => node.textContent)) === said, 'and nothing is said');
			await choose(page);
			expect(!(await branch.getAttribute('aria-disabled')), 'a repository makes it able');
			// A tray chip shows its value alone: its whole face is its tooltip, as a setting's is (0.34.0)
			await branch.focus();
			await page.keyboard.press('Shift+Tab');
			await page.locator('.bui-hint:not([hidden])').waitFor();
			const tip = await page.locator('.bui-hint:not([hidden])').textContent();
			expect(tip === `${copy(consumer).repository}: acme/web`, `the repository chip's whole face in the tooltip: ${tip}`);
			await press(page, branch);
			await settle(page);
			expect((await state(page)).open, 'a press opens it now');
			await page.keyboard.press('Escape');
			await context.close();
		}
	},
	{
		name: 'pressing: a held Send puts a press on the repository chip and sends nothing; Enter in the field sends nothing and keeps focus there; a repository lets it send (0.34.0, D183)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page, context } = await open(browser, consumer);
			const send = page.locator('.bui-composer-go');
			await send.waitFor();
			expect((await send.getAttribute('aria-disabled')) === 'true', 'Send is held');
			expect((await page.locator('.bui-composer-reason').textContent()) === copy(consumer).held, 'its reason beside it');
			await press(page, send);
			await settle(page);
			const pressed = await state(page);
			expect(pressed.at === 0 && pressed.sent === 0, `a press goes to the repository chip, sending nothing: ${JSON.stringify(pressed)}`);
			const field = page.locator('.bui-composer-field');
			await field.focus();
			await page.keyboard.press('Enter');
			await settle(page);
			expect((await state(page)).sent === 0 && (await field.evaluate(node => document.activeElement === node)), 'Enter sends nothing and keeps focus in the field');
			await choose(page);
			expect(!(await send.getAttribute('aria-disabled')), 'a repository lets it send');
			await press(page, send);
			await page.waitForFunction(() => window.fixture.log.some(entry => entry.startsWith('send:')));
			await context.close();
		}
	},
	{
		name: 'pressing: the line comments are a ComposerChip in the tray, one target tall beside its chips, its label muted beside its value, no chevron and whole, at 1440 and 390 px in both themes; a shortened toolbar sets a chip\'s label aside, its face then the tooltip (0.34.0)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const colorScheme of ['light', 'dark']) for (const width of [1440, 390]) {
				const at = `${width}px ${colorScheme}`;
				const { page, context } = await open(browser, consumer, { viewport: { width, height: 844 }, colorScheme });
				await page.evaluate(() => document.fonts.ready);
				// Its face is its name (WCAG 2.5.3), and its description is read after it
				const chip = page.getByRole('button', { name: new RegExp(`^${copy(consumer).comments}\\s*2$`) });
				expect((await chip.getAttribute('aria-label')) === null, `${at}: its face is its name`);
				const described = await chip.evaluate(node => document.getElementById(node.getAttribute('aria-describedby'))?.textContent ?? null);
				expect(described === copy(consumer).description, `${at}: its description is read after its name: ${described}`);
				const shape = await chip.evaluate(node => {
					const label = node.querySelector('.bui-composer-chip-label');
					const value = node.querySelector('.bui-composer-chip-value');
					const neighbour = document.querySelector('.bui-composer-tray .bui-chip .bui-choice-button');
					return {
						height: node.getBoundingClientRect().height,
						target: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bui-target')),
						beside: neighbour.getBoundingClientRect().height,
						round: parseFloat(getComputedStyle(node).borderTopLeftRadius) >= node.getBoundingClientRect().height / 2 - 0.5,
						glyphs: node.querySelectorAll('svg').length,
						muted: getComputedStyle(label).color !== getComputedStyle(value).color,
						whole: label.getBoundingClientRect().width > 2 && value.scrollWidth <= value.clientWidth + 1 && node.scrollWidth <= node.clientWidth + 1,
						inside: node.getBoundingClientRect().right <= document.querySelector('.bui-composer-box').getBoundingClientRect().right
					};
				});
				expect(Math.abs(shape.height - shape.target) <= 0.5 && Math.abs(shape.height - shape.beside) <= 0.5, `${at}: one target tall, as the chips beside it: ${JSON.stringify(shape)}`);
				expect(shape.round && shape.glyphs === 1 && shape.muted, `${at}: round, its glyph and no chevron, its label muted beside its value: ${JSON.stringify(shape)}`);
				expect(shape.whole && shape.inside, `${at}: whole in the tray: ${JSON.stringify(shape)}`);
				expect(!(await overflow(page)), `${at}: no sideways scroll`);
				if (width === 1440 && colorScheme === 'light') {
					await chip.focus();
					await page.keyboard.press('Shift+Tab');
					await page.keyboard.press('Tab');
					await settle(page);
					expect((await page.locator('.bui-hint:not([hidden])').count()) === 0, 'whole, it shows no tooltip');
					await page.keyboard.press('Enter');
					await page.waitForFunction(() => window.fixture.log.includes('comments:open'));
					if (consumer.name === 'dom') {
						// The toolbar's shortened level, as the fit sets it when its row does not fit
						await page.evaluate(() => (document.querySelector('.bui-composer').dataset.fit = 'short'));
						const instructions = page.locator('.bui-composer-settings .bui-composer-chip');
						expect((await instructions.locator('.bui-composer-chip-label').evaluate(node => node.getBoundingClientRect().width)) <= 1.5, 'its label set aside');
						await page.locator('.bui-composer-field').focus();
						await page.keyboard.press('Tab');
						expect(await instructions.evaluate(node => document.activeElement === node), 'the settings\' chip after the field');
						await page.locator('.bui-hint:not([hidden])').waitFor();
						expect((await page.locator('.bui-hint:not([hidden])').textContent()) === `${words.en.instructions}: 1`, 'its whole face in the family tooltip');
					}
					const warned = await page.evaluate(() => window.fixture.warnings.filter(message => message.includes('@beyond-js/ui')));
					expect(!warned.length, `the development build names nothing: ${warned.join(' | ')}`);
				}
				await context.close();
			}
		}
	},
	{
		name: 'pressing: React\'s Form with report says the browser\'s own message for a wrong email, runs no onSubmit and leaves the email focused; corrected, it submits (0.34.0)',
		consumers: ['react19', 'react18'],
		async run(browser, consumer) {
			const { page, context } = await open(browser, consumer);
			const text = copy(consumer).invite;
			const form = page.locator('#invite');
			await form.getByLabel(text.name).fill('Ana');
			await form.getByLabel(text.email).fill('ana');
			const submit = form.getByRole('button', { name: text.send });
			expect(!(await submit.getAttribute('aria-disabled')), 'nothing waits: a wrong value is no wait');
			await press(page, submit);
			await settle(page);
			const after = await form.evaluate(node => {
				const email = node.querySelector('input[name="email"]');
				return { focused: document.activeElement === email, wrong: email.validity.typeMismatch, said: Boolean(email.validationMessage), sent: window.fixture.log.some(entry => entry.startsWith('form:submit')) };
			});
			expect(after.focused && after.wrong && after.said && !after.sent, `the wrong email says the browser's message and keeps the focus, with no onSubmit: ${JSON.stringify(after)}`);
			await form.getByLabel(text.email).fill('ana@example.com');
			await press(page, submit);
			await page.waitForFunction(() => window.fixture.log.includes('form:submit:ana@example.com'));
			await context.close();
		}
	}
];
