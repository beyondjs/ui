import { expect, focused } from '../support/browser.mjs';
import { words } from '../support/words.mjs';

/** Keyboard, focus and Escape across the action menu and dialogs, with the real keyboard. */
export const checks = [
	{
		name: 'action menu: ArrowDown opens on the first item, arrows move, disabled item explains, Escape returns focus',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer);
			const copy = words[consumer.language];
			const button = page.getByRole('button', { name: copy.more });
			await button.focus();
			await page.keyboard.press('ArrowDown');
			expect((await focused(page)).startsWith('button||'), `first item focused, got ${await focused(page)}`);
			await page.keyboard.press('ArrowDown');
			const disabled = await page.evaluate(() => document.activeElement.getAttribute('aria-disabled'));
			expect(disabled === 'true', 'second item is the disabled one');
			await page.keyboard.press('Enter');
			expect(await page.locator('#actions [role="menu"]').isVisible(), 'a disabled item does not close the menu');
			await page.keyboard.press('Escape');
			expect(await page.evaluate(() => document.activeElement.getAttribute('aria-haspopup')) === 'menu', 'focus returned to the menu button');
			expect(!(await page.locator('#actions [role="menu"]').isVisible()), 'menu closed');
		}
	},
	{
		name: 'choice menu: ArrowDown opens on the chosen option, a disabled option explains, Enter chooses, Escape returns focus; the button never cuts its words at 320 px',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer, { viewport: { width: 320, height: 800 } });
			const button = page.locator('#picking .bui-choice-button');
			expect((await button.innerText()).includes('Choose'), 'nothing is chosen for the person');
			await button.focus();
			await page.keyboard.press('ArrowDown');
			expect((await page.evaluate(() => document.activeElement.getAttribute('role'))) === 'menuitemradio', 'an option takes focus');
			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('ArrowDown');
			expect((await page.evaluate(() => document.activeElement.getAttribute('aria-disabled'))) === 'true', 'the deleted option is reachable to read its reason');
			await page.keyboard.press('Enter');
			expect(await page.locator('#picking .bui-choice-list').isVisible(), 'a disabled option does not choose or close');
			await page.keyboard.press('ArrowUp');
			await page.keyboard.press('Enter');
			expect((await page.evaluate(() => document.activeElement.classList.contains('bui-choice-button'))), 'focus returned to the button');
			const text = await button.innerText();
			expect(text.includes('laboratory-with-a-long-name') && text.includes('Machine missing'), `the button reads ${text}`);
			const cut = await button.evaluate(node => node.scrollWidth > node.clientWidth + 1 || [...node.querySelectorAll('span')].some(part => part.scrollWidth > part.clientWidth + 1));
			expect(!cut, 'the button cuts its words');
			const inside = await button.evaluate(node => node.getBoundingClientRect().right <= document.documentElement.clientWidth);
			expect(inside, 'the button runs past the viewport');
			await button.click();
			await page.keyboard.press('Escape');
			expect((await page.evaluate(() => document.activeElement.classList.contains('bui-choice-button'))), 'Escape returns focus to the button');
		}
	},
	{
		name: 'action menu at the bottom of the viewport: opens above its button, inside the viewport, and scrolls nothing (click, ArrowDown, ArrowUp)',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer, { viewport: { width: 1280, height: 600 } });
			const copy = words[consumer.language];
			const button = page.getByRole('button', { name: copy.more });
			// The page is scrolled until the menu button sits just above the bottom edge of the viewport
			// (with room added before it, so any page can scroll that far).
			const before = await button.evaluate(node => {
				document.body.style.paddingTop = '100vh';
				window.scrollBy(0, node.getBoundingClientRect().bottom - innerHeight + 6);
				return window.scrollY;
			});
			for (const way of ['click', 'ArrowDown', 'ArrowUp']) {
				if (way === 'click') await button.click();
				else {
					await button.focus();
					await page.keyboard.press(way);
				}
				const state = await page.evaluate(() => {
					const list = document.querySelector('#actions [role="menu"]');
					const box = list.getBoundingClientRect();
					return { scroll: scrollY, top: box.top, bottom: box.bottom, left: box.left, right: box.right, anchor: list.previousElementSibling.getBoundingClientRect().top, width: innerWidth, height: innerHeight, focus: document.activeElement.getAttribute('role') };
				});
				expect(state.focus === 'menuitem', `${way}: an item takes focus, got ${state.focus}`);
				expect(state.scroll === before, `${way}: the page did not scroll (${before} → ${state.scroll})`);
				expect(state.bottom <= state.anchor, `${way}: the list (${state.top}–${state.bottom}) opens above its button (top ${state.anchor})`);
				expect(state.top >= 0 && state.left >= 0 && state.right <= state.width, `${way}: the list stays inside the ${state.width}×${state.height} viewport: ${JSON.stringify(state)}`);
				await page.keyboard.press('Escape');
				expect(await page.evaluate(() => document.activeElement.getAttribute('aria-haspopup')) === 'menu', `${way}: Escape returns focus to the button`);
				expect((await page.evaluate(() => scrollY)) === before, `${way}: returning focus did not scroll`);
			}
		}
	},
	{
		name: 'dialog: focus moves in, Tab wraps, Escape closes and focus returns to the opener',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer);
			const copy = words[consumer.language];
			const opener = page.getByRole('button', { name: copy.open });
			await opener.click();
			const dialog = page.getByRole('dialog');
			await dialog.waitFor();
			expect(await page.evaluate(() => document.activeElement.tagName) === 'INPUT', 'the field takes focus');
			// Plain Tab reaches every target in order and wraps, in WebKit too, whose own Tab skips buttons (0.45.1)
			const targets = await dialog.evaluate(node => node.querySelectorAll('button, input').length);
			const stops = [];
			for (let step = 0; step < targets * 2; step++) {
				await page.keyboard.press('Tab');
				stops.push(await page.evaluate(() => (document.activeElement.closest('dialog') ? `${document.activeElement.tagName}|${document.activeElement.textContent.trim()}|${document.activeElement.getAttribute('aria-label') ?? ''}` : 'outside')));
			}
			expect(!stops.includes('outside'), `Tab stays inside the dialog: ${stops.join(', ')}`);
			expect(new Set(stops).size === targets && stops.slice(0, targets).join() === stops.slice(targets).join(), `Tab reaches each of the ${targets} targets once a round: ${stops.join(', ')}`);
			await page.keyboard.press('Shift+Tab');
			expect(await page.evaluate(() => Boolean(document.activeElement.closest('dialog'))), 'Shift+Tab stays inside the dialog');
			expect(`${await page.evaluate(() => `${document.activeElement.tagName}|${document.activeElement.textContent.trim()}|${document.activeElement.getAttribute('aria-label') ?? ''}`)}` === stops.at(-2), 'Shift+Tab goes back one target');
			await page.keyboard.press('Escape');
			await dialog.waitFor({ state: 'hidden' });
			expect((await focused(page)).includes(copy.open), `focus returned to the opener, got ${await focused(page)}`);
		}
	},
	{
		name: 'busy confirmation: Escape and backdrop cannot dismiss it, a failure stays in it, retry resolves',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer);
			const copy = words[consumer.language];
			await page.getByRole('button', { name: copy.remove }).click();
			const dialog = page.getByRole('dialog');
			await dialog.waitFor();
			expect((await focused(page)).includes(copy.cancel), 'a danger confirmation focuses the safe choice');
			await dialog.getByRole('button', { name: copy.accept, exact: true }).click();
			expect(await dialog.getAttribute('aria-busy') === 'true', 'busy while the work runs');
			for (let press = 0; press < 3; press++) await page.keyboard.press('Escape');
			await page.mouse.click(5, 5);
			expect(await dialog.isVisible(), 'repeated Escape and a backdrop press do not dismiss a busy dialog');
			await page.getByText(copy.failed).waitFor();
			expect(await dialog.isVisible(), 'the failure stays in the dialog');
			await dialog.getByRole('button', { name: copy.accept, exact: true }).click();
			await dialog.waitFor({ state: 'hidden', timeout: 5000 });
			const log = await page.evaluate(() => window.fixture.log);
			expect(log.includes('confirm:true'), `confirmation resolved true, log ${log}`);
		}
	},
	{
		name: 'prompt: an empty field keeps Confirm quiet, and Enter keeps the caret there, saying nothing (D183); a value resolves it',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer);
			await page.getByRole('button', { name: 'Name area' }).click();
			const dialog = page.getByRole('dialog');
			const field = dialog.getByLabel('Area name');
			expect((await dialog.getByRole('button', { name: 'Confirm' }).getAttribute('aria-disabled')) === 'true', 'nothing to confirm yet');
			await page.keyboard.press('Enter');
			await page.waitForTimeout(100);
			expect(await dialog.isVisible(), 'the prompt stays open');
			expect(!(await dialog.getByText('Name the area.').count()) && (await field.getAttribute('aria-invalid')) !== 'true', 'an empty field is no failure');
			expect(await field.evaluate(node => node === document.activeElement), 'the caret stays where the name is written');
			await page.keyboard.type('Billing');
			expect(!(await dialog.getByRole('button', { name: 'Confirm' }).getAttribute('aria-disabled')), 'a name makes Confirm able');
			await page.keyboard.press('Enter');
			await dialog.waitFor({ state: 'hidden' });
			expect((await page.evaluate(() => window.fixture.log)).includes('prompt:Billing'), 'prompt resolved with the value');
		}
	}
];
