import { expect } from '../support/browser.mjs';
import { words } from '../support/words.mjs';

/** Paired modal motion, native modality, keyboard return and reduced motion in installed consumers. */
export const checks = [{
	name: 'dialog motion: paired entry/exit, prompt lifetime, focus and reduced motion',
	consumers: ['dom', 'react19', 'react18'],
	async run(browser, consumer) {
		for (const preference of ['no-preference', 'reduce', 'device']) {
			const reduced = preference !== 'no-preference';
			const { page } = await browser.open(consumer, { reducedMotion: preference === 'reduce' ? 'reduce' : 'no-preference' });
			if (preference === 'device') await page.evaluate(() => document.documentElement.dataset.motion = 'reduced');
			const copy = words[consumer.language];
			const names = consumer.name === 'dom' ? [copy.open, 'Name area'] : [copy.open];
			for (const name of names) {
				const opener = page.getByRole('button', { name, exact: true });
				await opener.click();
				const dialog = page.locator('dialog.bui-dialog[open]');
				await dialog.waitFor();
				const entry = await dialog.evaluate(node => ({ name: getComputedStyle(node).animationName, duration: getComputedStyle(node).animationDuration, backdrop: getComputedStyle(node, '::backdrop').animationName }));
				expect(reduced ? entry.name === 'none' : entry.name === 'bui-enter' && parseFloat(entry.duration) > 0, `entry: ${JSON.stringify(entry)}`);
				expect(entry.backdrop === (reduced ? 'none' : 'bui-dialog-veil-in'), 'backdrop follows motion preference');
				await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
				expect(await dialog.evaluate(node => node.contains(document.activeElement)), 'keyboard stays in dialog');
				const exit = await dialog.evaluate(node => {
					node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
					return { open: node.open, inert: node.inert, name: getComputedStyle(node).animationName, mark: node.dataset.motion };
				});
				expect(reduced ? !exit.open : exit.open && exit.inert && exit.name === 'bui-leave' && exit.mark === 'out', `exit: ${JSON.stringify(exit)}`);
				await dialog.waitFor({ state: 'hidden' });
				expect(await opener.evaluate(node => document.activeElement === node), 'focus returns after exit');
				expect(await page.locator('.bui-dialog.bui-leaving').count() === 0, 'no orphan picture');
			}
		}
	}
}];
