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
			for (let step = 0; step < 6; step++) await page.keyboard.press('Tab');
			expect(await page.evaluate(() => Boolean(document.activeElement.closest('dialog'))), 'Tab stays inside the dialog');
			await page.keyboard.press('Shift+Tab');
			expect(await page.evaluate(() => Boolean(document.activeElement.closest('dialog'))), 'Shift+Tab stays inside the dialog');
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
		name: 'prompt: a required value is explained before the prompt resolves',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer);
			await page.getByRole('button', { name: 'Name area' }).click();
			const dialog = page.getByRole('dialog');
			await page.keyboard.press('Enter');
			await dialog.getByText('Name the area.').waitFor();
			expect(await dialog.getByLabel('Area name').getAttribute('aria-invalid') === 'true', 'field marked invalid');
			await page.keyboard.type('Billing');
			await page.keyboard.press('Enter');
			await dialog.waitFor({ state: 'hidden' });
			expect((await page.evaluate(() => window.fixture.log)).includes('prompt:Billing'), 'prompt resolved with the value');
		}
	}
];
