import { expect } from '../support/browser.mjs';
import { open } from './anchoring.mjs';

/**
 * The composer of 0.14.0 in a real engine (D100, CV-11, CV-16), on the `round.html` pages: focus as the
 * box's own 2 px border with no ring beside it; the tray inside the box on its lower edge; commands after
 * "/"; ArrowUp's recall; the growth cap near a third of the window with Expand into a taller editor and
 * back with the draft; and Dictate with a fake microphone where the engine gives one (Chrome, Firefox):
 * voice to editable text at the caret, never sent, and Cancel discarding.
 */
const field = page => page.locator('.bui-page-dock .bui-composer-field');

export const checks = [
	{
		name: 'focus draws the box’s own border, 2 px of the focus color with no outline ring; the tray sits inside the box on its lower edge',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer);
			await field(page).focus();
			const box = await page.evaluate(() => {
				const box = document.querySelector('.bui-page-dock .bui-composer-box');
				const style = getComputedStyle(box);
				const probe = document.body.appendChild(document.createElement('span'));
				probe.style.color = 'var(--color-focus)';
				const focus = getComputedStyle(probe).color;
				probe.remove();
				const tray = document.querySelector('.bui-page-dock .bui-composer-tray').getBoundingClientRect();
				const frame = box.getBoundingClientRect();
				return { border: style.borderTopColor, focus, shadow: style.boxShadow, outline: style.outlineStyle, tray: { inside: tray.left >= frame.left && tray.right <= frame.right && tray.bottom <= frame.bottom + 0.5, edge: Math.round(frame.bottom - tray.bottom) } };
			});
			expect(box.border === box.focus && box.shadow.includes('inset') && box.outline === 'none', `the border itself: ${JSON.stringify(box)}`);
			expect(box.tray.inside && box.tray.edge <= 2, `the tray on the box's lower edge: ${JSON.stringify(box.tray)}`);
		}
	},
	{
		name: 'commands list after "/" and run without sending; ArrowUp in an empty field recalls the last message to edit',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer);
			await field(page).click();
			await page.keyboard.type('/mo');
			const list = page.locator('.bui-page-dock .bui-composer-suggest:not([hidden])');
			await list.locator('[role="option"]', { hasText: 'Change the model' }).waitFor();
			await page.keyboard.press('Enter');
			await page.waitForFunction(() => window.fixture.log.includes('command:model'));
			expect((await field(page).inputValue()) === '', 'the command left the field');
			expect(!(await page.evaluate(() => window.fixture.log.some(entry => entry.startsWith('send:')))), 'never sent');
			await page.keyboard.press('ArrowUp');
			await page.waitForFunction(() => document.querySelector('.bui-page-dock .bui-composer-field').value === 'Also add a test');
		}
	},
	{
		name: 'the field stops near a third of the window and Expand opens a taller editor over the content; Escape returns with the draft, the caret and focus',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, { width: 1440, height: 900 });
			await field(page).fill(Array.from({ length: 40 }, (_, index) => `Line ${index + 1}`).join('\n'));
			await field(page).dispatchEvent('input');
			const capped = await page.evaluate(() => ({ height: document.querySelector('.bui-page-dock .bui-composer-field').getBoundingClientRect().height, view: innerHeight, offered: document.querySelector('.bui-page-dock .bui-composer').hasAttribute('data-capped') }));
			expect(capped.height <= capped.view * 0.34 + 1 && capped.offered, `capped near a third, Expand offered: ${JSON.stringify(capped)}`);
			await page.locator('.bui-composer-expand').click();
			await page.waitForSelector('dialog.bui-composer-editor[open]');
			const tall = await page.evaluate(() => document.querySelector('dialog.bui-composer-editor .bui-composer-field').getBoundingClientRect().height);
			expect(tall > capped.height * 1.5, `a taller editor: ${tall} against ${capped.height}`);
			expect((await page.evaluate(() => document.activeElement?.className)) === 'bui-composer-field', 'focus stays in the field');
			await page.keyboard.press('Escape');
			await page.waitForFunction(() => !document.querySelector('dialog.bui-composer-editor[open]'));
			expect((await field(page).inputValue()).endsWith('Line 40'), 'the draft is kept');
			expect((await page.evaluate(() => document.activeElement?.closest('.bui-page-dock') !== null)), 'focus back in the dock');
		}
	},
	{
		name: 'Dictate with a fake microphone: recording with its time and Stop, then the words at the caret, editable and never sent; Cancel discards; Escape cancels',
		consumers: ['dom'],
		async run(browser, consumer) {
			if (browser.engine === 'webkit') return; // Playwright's WebKit has no fake capture device: dictation is checked in Chrome and Firefox
			const { page, context } = await open(browser, consumer);
			if (browser.engine === 'chrome') await context.grantPermissions(['microphone']);
			const voice = page.locator('.bui-page-dock .bui-dictation-button');
			expect(await voice.isVisible(), 'Dictate is offered where the browser can record');
			await field(page).fill('Fix it');
			await voice.click();
			const line = page.locator('.bui-page-dock .bui-dictation');
			await page.waitForFunction(() => document.querySelector('.bui-page-dock .bui-dictation')?.dataset.state === 'recording', null, { timeout: 5000 });
			expect((await line.textContent()).includes('/ 2:00'), `the time against the cap: ${await line.textContent()}`);
			await page.waitForTimeout(1300);
			await line.getByRole('button', { name: 'Stop' }).click();
			await page.waitForFunction(() => document.querySelector('.bui-page-dock .bui-composer-field').value === 'Fix it and keep the cart', null, { timeout: 5000 });
			const heard = await page.evaluate(() => window.fixture.log.find(entry => entry.startsWith('transcribe:')));
			expect(/^transcribe:audio\/(webm|mp4)/.test(heard) && heard.endsWith(':true:true'), `the recording's own type and some seconds: ${heard}`);
			expect(!(await page.evaluate(() => window.fixture.log.some(entry => entry.startsWith('send:')))), 'never sent');
			await voice.click();
			await page.waitForFunction(() => document.querySelector('.bui-page-dock .bui-dictation')?.dataset.state === 'recording');
			await page.keyboard.press('Escape');
			await page.waitForFunction(() => document.querySelector('.bui-page-dock .bui-dictation')?.dataset.state === 'idle');
			expect((await page.evaluate(() => window.fixture.log.filter(entry => entry.startsWith('transcribe:')).length)) === 1, 'a cancelled recording is never transcribed');
		}
	}
];
