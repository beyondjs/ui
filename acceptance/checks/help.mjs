import { expect } from '../support/browser.mjs';
import { words } from '../support/words.mjs';

/** Essential help, tooltips and the focused form on keyboard and touch. */
export const checks = [
	{
		name: 'help opens by keyboard and closes with Escape; tooltip shows on focus and hides on Escape',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer);
			const copy = words[consumer.language];
			const help = page.getByRole('button', { name: copy.help });
			await help.focus();
			await page.keyboard.press('Enter');
			const note = page.locator('#helping .bui-help-panel');
			expect(await note.isVisible(), 'help opens with Enter');
			await page.keyboard.press('Escape');
			expect(!(await note.isVisible()), 'Escape closes help');
			expect(await help.evaluate(node => node === document.activeElement), 'focus returns to the help button');
			await page.keyboard.press('Space');
			expect(await note.isVisible(), 'help opens with Space');
			const copyButton = page.locator('#helping .bui-button, #helping .bui-tooltip-anchor button').first();
			await copyButton.focus();
			const tip = page.locator('[role="tooltip"]');
			await tip.waitFor();
			const described = await copyButton.getAttribute('aria-describedby');
			expect(described && described.includes(await tip.getAttribute('id')), 'the tooltip describes its control');
			await page.keyboard.press('Escape');
			await tip.waitFor({ state: 'hidden' });
		}
	},
	{
		name: 'touch: a tap opens help and a press shows the tooltip; touch targets are at least 44px',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer, { hasTouch: true, isMobile: true, viewport: { width: 390, height: 800 } });
			const copy = words[consumer.language];
			await page.getByRole('button', { name: copy.help }).tap();
			expect(await page.locator('#helping .bui-help-panel').isVisible(), 'a tap opens help');
			await page.locator('#helping button').filter({ hasText: /Copy address|Copiar dirección/ }).tap();
			await page.locator('[role="tooltip"]').waitFor();
			const small = await page.evaluate(() =>
				[...document.querySelectorAll('.bui-button, .bui-icon-button, .bui-disclosure-button, .bui-menu-button, .bui-chip-remove, .bui-header-toggle')]
					.filter(node => node.offsetParent !== null)
					.map(node => [node.className, Math.round(node.getBoundingClientRect().height)])
					.filter(([, height]) => height < 44)
			);
			expect(!small.length, `touch targets under 44px: ${JSON.stringify(small)}`);
		}
	},
	{
		name: 'focused form: a double submission sends once and states that it is working',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer);
			const copy = words[consumer.language];
			const form = page.locator('#form');
			await form.getByRole('button', { name: copy.submit }).click();
			expect(await form.getByLabel(copy.title).evaluate(node => node === document.activeElement || node.matches(':invalid')), 'an empty title is refused first');
			await form.getByLabel(copy.title).fill('Export invoices');
			await form.getByRole('button', { name: copy.submit }).dblclick();
			await form.getByText(copy.busy).waitFor();
			await page.keyboard.press('Enter');
			await form.getByRole('button', { name: copy.submit }).waitFor();
			const sent = (await page.evaluate(() => window.fixture.log)).filter(entry => entry.startsWith('submit:'));
			expect(sent.length === 1, `sent once, got ${sent.length}`);
		}
	}
];
