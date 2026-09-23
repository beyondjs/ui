import { expect } from '../support/browser.mjs';

/** Dialogs under `StrictMode` and a provider that reads an external store (`fixtures/react/store.jsx`). */
export const checks = [
	{
		name: 'external store: a dialog mounted open stays open, keeps what is typed and reports only the person closing it',
		consumers: ['react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer, { file: 'store.html' });
			const dialog = page.getByRole('dialog', { name: 'Renombrar área' });
			await dialog.waitFor();
			// Longer than any settlement of the development double mount.
			await page.waitForTimeout(300);
			expect(await dialog.isVisible(), 'the dialog is still open');
			expect((await page.locator('dialog').count()) === 1, 'one dialog element');
			expect((await page.evaluate(() => window.fixture.log)).length === 0, `no close reported: ${await page.evaluate(() => window.fixture.log)}`);
			const field = dialog.getByLabel('Nombre del área');
			await field.fill('Facturación');
			await page.evaluate(() => (window.fixture.language.value = 'en'));
			await page.waitForFunction(() => document.querySelector('[lang="en"]'));
			expect(await dialog.isVisible(), 'a store change does not close it');
			expect((await field.inputValue()) === 'Facturación', 'the field keeps what was typed');
			await page.keyboard.press('Escape');
			await dialog.waitFor({ state: 'hidden' });
			const log = await page.evaluate(() => window.fixture.log);
			expect(JSON.stringify(log) === '["first:null"]', `the person closing it is reported once: ${JSON.stringify(log)}`);
		}
	},
	{
		name: 'external store: a dialog opened by a button is filled and closed by its action without a reported close',
		consumers: ['react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer, { file: 'store.html' });
			const first = page.getByRole('dialog', { name: 'Renombrar área' });
			await first.waitFor();
			await first.getByRole('button', { name: 'Cerrar' }).click();
			await first.waitFor({ state: 'hidden' });
			await page.getByRole('button', { name: 'Abrir segundo diálogo' }).click();
			const dialog = page.getByRole('dialog', { name: 'Invitar persona' });
			await dialog.waitFor();
			await page.waitForTimeout(300);
			expect(await dialog.isVisible(), 'the dialog is still open');
			await dialog.getByLabel('Correo').pressSequentially('ana@example.com');
			expect((await dialog.getByLabel('Correo').inputValue()) === 'ana@example.com', 'a controlled field keeps every keystroke');
			await dialog.getByRole('button', { name: 'Invitar' }).click();
			await dialog.waitFor({ state: 'hidden' });
			const log = await page.evaluate(() => window.fixture.log);
			expect(JSON.stringify(log) === '["first:null","invited:ana@example.com"]', `only the person's closing and the action are recorded: ${JSON.stringify(log)}`);
		}
	}
];
