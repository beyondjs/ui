import { expect } from '../support/browser.mjs';
import { words } from '../support/words.mjs';
import { copy } from '../fixtures/data/turns.js';

/**
 * Nothing still to write is a failure in no form (0.32.0, D183), in a real engine: the focused form of the
 * main page waits quiet while its required title is empty and a press puts the caret there, saying
 * nothing; on the choosing page a required secret behind its fold, a `Quiet` Add and React's `Form` with
 * a footer that names it wait the same way; and a composer's files wait for words on the turns page, Send
 * quiet and the field saying what they wait for. The prompt's own case is `keyboard.mjs`'s.
 */
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 30)))));

/**
 * Presses a control where it rests, as a person does. A quiet control takes none of Playwright's
 * actionability checks, its wait for a still element included, and the main page still moves while its
 * inbox and picker load: a press then lands on whatever moved under the pointer.
 */
async function press(page, locator) {
	await locator.scrollIntoViewIfNeeded();
	let last = null;
	for (let tries = 0; tries < 40; tries += 1) {
		const box = await locator.boundingBox();
		if (box && last && Math.abs(box.x - last.x) < 0.5 && Math.abs(box.y - last.y) < 0.5) return page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
		last = box;
		await settle(page);
	}
	throw new Error('the control kept moving');
}

export const checks = [
	{
		name: 'focused form: while the required title is empty its submit is quiet and a press puts the caret in the title, saying nothing; a title makes it able (D183)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer);
			const text = words[consumer.language];
			const form = page.locator('#form');
			const submit = form.getByRole('button', { name: text.submit });
			const title = form.getByLabel(text.title);
			expect((await submit.getAttribute('aria-disabled')) === 'true', 'nothing to submit yet');
			// Playwright counts aria-disabled as disabled; reachable means no native `disabled`
			expect(!(await submit.evaluate(node => node.disabled)), 'still reachable');
			await press(page, submit);
			await settle(page);
			const after = await form.evaluate(node => ({
				caret: document.activeElement === node.querySelector('input[name="title"]'),
				said: [...node.querySelectorAll('.bui-field-error, .bui-form-problem')].filter(part => part.getClientRects().length && part.textContent.trim()).map(part => part.textContent.trim()),
				invalid: node.querySelector('input[name="title"]').getAttribute('aria-invalid')
			}));
			expect(after.caret && !after.said.length && after.invalid !== 'true', `a press says nothing and puts the caret in the title: ${JSON.stringify(after)}`);
			expect(!(await page.evaluate(() => window.fixture.log)).some(entry => entry.startsWith('submit:')), 'nothing was sent');
			await title.fill('Export invoices');
			expect(!(await submit.getAttribute('aria-disabled')), 'a title makes it able');
			await title.fill('   ');
			expect((await submit.getAttribute('aria-disabled')) === 'true', 'blanks are nothing');
		}
	},
	{
		name: 'composer: files that wait for words keep Send quiet, a press and Enter send nothing and the field says what they wait for; words make it able (0.32.0, D183)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const said = copy(consumer.name === 'dom' ? 'en' : 'es');
			const { page, context } = await browser.open(consumer, { file: 'turns.html', viewport: { width: 1440, height: 900 } });
			await page.waitForSelector('.bui-page-dock .bui-composer-field');
			const dock = '.bui-page-dock';
			const read = () =>
				page.evaluate(selector => ({
					placeholder: document.querySelector(`${selector} .bui-composer-placeholder`).textContent,
					quiet: document.querySelector(`${selector} .bui-composer-go`).getAttribute('aria-disabled') === 'true',
					chips: document.querySelectorAll(`${selector} .bui-composer-file[data-state="ready"]`).length
				}), dock);
			expect((await read()).placeholder === said.placeholder, 'the product\'s own words before a file');
			await page.evaluate(() => window.fixture.attach());
			await page.waitForSelector(`${dock} .bui-composer-file[data-state="ready"]`);
			const waiting = await read();
			expect(waiting.placeholder === said.attach && waiting.quiet && waiting.chips === 1, `a ready file waits for words: ${JSON.stringify(waiting)}`);
			const shown = await page.locator(`${dock} .bui-composer-placeholder`).evaluate(node => node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden');
			expect(shown, 'the field says it where the person writes');
			const sent = () => page.evaluate(() => window.fixture.log.filter(entry => entry.startsWith('send:')));
			await press(page, page.locator(`${dock} .bui-composer-go`));
			await settle(page);
			const pressed = await page.evaluate(selector => ({ caret: document.activeElement === document.querySelector(`${selector} .bui-composer-field`), said: document.querySelector(`${selector} .bui-composer-status`)?.textContent.trim() ?? '' }), dock);
			expect(pressed.caret && !pressed.said, `a press puts the caret where the words go, saying nothing: ${JSON.stringify(pressed)}`);
			await page.keyboard.press('Enter');
			await settle(page);
			expect(!(await sent()).length, 'neither a press nor Enter sends the files without words');
			const written = consumer.name === 'dom' ? 'Use it for the layout' : 'Úsala para el diseño';
			await page.locator(`${dock} .bui-composer-field`).fill(written);
			expect(!(await read()).quiet, 'words make it something to send');
			await page.locator(`${dock} .bui-composer-field`).fill('');
			expect((await read()).quiet, 'emptied again, it waits again');
			await page.locator(`${dock} .bui-composer-field`).fill(written);
			await page.keyboard.press('Enter');
			await page.waitForFunction(() => window.fixture.log.some(entry => entry.startsWith('send:')));
			expect((await sent()).join() === `send:${written}`, 'the words go with the files');
			await context.close();
		}
	},
	{
		name: 'secret field: a required secret still to give keeps Save quiet, and a press opens its fold with the caret in it, saying nothing (0.32.0, D183)',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page, context } = await browser.open(consumer, { file: 'choosing.html', viewport: { width: 1440, height: 900 } });
			await page.waitForFunction(() => window.fixture?.ready);
			await page.evaluate(() => window.fixture.secret());
			const form = page.locator('#secret-form');
			await form.getByLabel('Name').fill('TOKEN');
			const save = form.getByRole('button', { name: 'Save' });
			expect((await save.getAttribute('aria-disabled')) === 'true', 'the form waits for the value');
			await press(page, save);
			await settle(page);
			const after = await form.evaluate(node => ({
				open: node.querySelector('details').open,
				caret: document.activeElement === node.querySelector('input[type="password"]'),
				said: [...node.querySelectorAll('.bui-field-error, .bui-form-problem')].filter(part => part.getClientRects().length && part.textContent.trim()).map(part => part.textContent.trim())
			}));
			expect(after.open && after.caret && !after.said.length, `a press opens the fold with the caret in it, saying nothing: ${JSON.stringify(after)}`);
			expect(!(await page.evaluate(() => window.fixture.log)).some(entry => entry.startsWith('secret:')), 'nothing was sent');
			await page.keyboard.type('s3cret');
			expect(!(await save.getAttribute('aria-disabled')), 'a value makes it able');
			await context.close();
		}
	},
	{
		name: 'Quiet: Add waits quiet for a choice made beside it, a press only goes to the search, and a choice makes it act (0.32.0, D183)',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page, context } = await browser.open(consumer, { file: 'choosing.html', viewport: { width: 1440, height: 900 } });
			await page.waitForFunction(() => window.fixture?.ready);
			await page.evaluate(() => window.fixture.quiet());
			const holder = page.locator('#quieting');
			const add = holder.getByRole('button', { name: 'Add' });
			expect((await add.getAttribute('aria-disabled')) === 'true', 'nothing chosen yet');
			await press(page, add);
			await settle(page);
			expect(await holder.locator('input[type="search"]').evaluate(node => document.activeElement === node), 'a press goes to the search');
			expect(!(await page.evaluate(() => window.fixture.log)).includes('quiet:add'), 'and does nothing else');
			await holder.locator('input[type="checkbox"]').check();
			expect(!(await add.getAttribute('aria-disabled')), 'a choice makes it able');
			await press(page, add);
			expect((await page.evaluate(() => window.fixture.log)).includes('quiet:add'), 'then it acts');
			await context.close();
		}
	},
	{
		name: 'React Form: a footer that names the form waits for a marked choice and a required note, a press goes to each in turn, then it submits (0.32.0, D183)',
		consumers: ['react19'],
		async run(browser, consumer) {
			const { page, context } = await browser.open(consumer, { file: 'choosing.html', viewport: { width: 1440, height: 900 } });
			await page.waitForFunction(() => window.fixture?.ready);
			await page.evaluate(() => window.fixture.form());
			const holder = page.locator('#adding');
			const add = holder.getByRole('button', { name: 'Añadir' });
			await add.waitFor();
			const caret = selector => holder.locator(selector).evaluate(node => document.activeElement === node);
			const submitted = () => page.evaluate(() => window.fixture.log.includes('form:submit'));
			expect((await add.getAttribute('aria-disabled')) === 'true', 'nothing chosen yet');
			await press(page, add);
			await settle(page);
			expect((await caret('input[type="search"]')) && !(await submitted()), 'a press goes to where the choice is made, sending nothing');
			await holder.locator('input[type="checkbox"]').check();
			await settle(page);
			expect((await add.getAttribute('aria-disabled')) === 'true', 'the note still waits');
			await press(page, add);
			await settle(page);
			expect((await caret('input[name="note"]')) && !(await submitted()), 'then to the note');
			await holder.locator('input[name="note"]').fill('Para la tienda');
			expect(!(await add.getAttribute('aria-disabled')), 'nothing waits: able');
			await press(page, add);
			await page.waitForFunction(() => window.fixture.log.includes('form:submit'));
			await context.close();
		}
	}
];
