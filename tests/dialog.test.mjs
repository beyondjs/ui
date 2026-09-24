import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

function opener() {
	const button = document.createElement('button');
	button.textContent = 'Open';
	document.body.append(button);
	button.focus();
	return button;
}

test('Dialog is named by its title, opens modally, focuses the first field and restores focus', async () => {
	const origin = opener();
	const input = document.createElement('input');
	const dialog = new ui.Dialog({ title: 'Rename', description: 'Names are visible to members.', children: [input] });
	const closed = dialog.open();
	assert.equal(dialog.shown, true);
	assert.equal(document.getElementById(dialog.element.getAttribute('aria-labelledby')).textContent, 'Rename');
	assert.ok(dialog.element.getAttribute('aria-describedby'));
	assert.equal(document.activeElement, input);
	dialog.close('saved');
	assert.equal(await closed, 'saved');
	assert.equal(document.activeElement, origin);
	assert.equal(dialog.element.isConnected, false, 'an adopted dialog leaves the page');
});

test('Escape dismisses with null; with escape: false nothing dismisses it but close()', async () => {
	const dialog = new ui.Dialog({ title: 'Info' });
	const first = dialog.open();
	page.key(dialog.element, 'Escape');
	assert.equal(await first, null);
	const strict = new ui.Dialog({ title: 'Choose', escape: false });
	strict.open();
	page.key(strict.element, 'Escape');
	strict.element.dispatchEvent(new Event('cancel', { cancelable: true }));
	assert.equal(strict.shown, true);
	assert.equal(strict.element.querySelector('.bui-icon-button'), null, 'no close button without escape');
	strict.close(1);
	assert.equal(strict.shown, false);
});

test('a busy dialog cannot be dismissed by Escape, cancel, the close button or close()', () => {
	const dialog = new ui.Dialog({ title: 'Publishing' });
	dialog.open();
	dialog.busy = true;
	assert.equal(dialog.element.getAttribute('aria-busy'), 'true');
	assert.equal(dialog.element.getAttribute('closedby'), 'none');
	page.key(dialog.element, 'Escape');
	dialog.element.dispatchEvent(new Event('cancel', { cancelable: true }));
	dialog.element.querySelector('.bui-icon-button').click();
	assert.equal(dialog.close('x'), false);
	assert.equal(dialog.shown, true);
	// A close that bypasses the class (a dialog form) reopens it while busy.
	dialog.element.close();
	assert.equal(dialog.shown, true);
	dialog.busy = false;
	assert.equal(dialog.close('done'), true);
});

test('Tab wraps inside the dialog in both directions', () => {
	const [a, b] = [document.createElement('button'), document.createElement('button')];
	const dialog = new ui.Dialog({ title: 'Wrap', escape: false, actions: [a, b] });
	dialog.open();
	b.focus();
	assert.equal(page.key(dialog.element, 'Tab').defaultPrevented, true);
	assert.equal(document.activeElement, a);
	page.key(dialog.element, 'Tab', { shiftKey: true });
	assert.equal(document.activeElement, b);
	dialog.destroy();
});

test('destroy while open resolves null, restores focus and removes the element', async () => {
	const origin = opener();
	const dialog = new ui.Dialog({ title: 'Gone' });
	const closed = dialog.open();
	dialog.busy = true;
	dialog.destroy();
	assert.equal(await closed, null);
	assert.equal(document.activeElement, origin);
	assert.equal(document.querySelector('dialog'), null);
	assert.equal(await dialog.open(), null, 'a destroyed dialog never opens');
});

test('focus goes to `restore` when the opener disappeared', async () => {
	const origin = opener();
	const fallback = document.createElement('h1');
	fallback.tabIndex = -1;
	document.body.append(fallback);
	const dialog = new ui.Dialog({ title: 'Delete', restore: fallback });
	const closed = dialog.open();
	origin.remove();
	dialog.close();
	await closed;
	assert.equal(document.activeElement, fallback);
});

test('confirm resolves true or false; a danger confirmation focuses the safe choice', async () => {
	const asked = ui.confirm({ title: 'Discard changes?', message: 'Unsaved text is lost.', tone: 'danger', accept: 'Descartar', cancel: 'Seguir editando' });
	const dialog = document.querySelector('dialog');
	assert.equal(document.activeElement.textContent, 'Seguir editando');
	[...dialog.querySelectorAll('button')].find(button => button.textContent === 'Descartar').click();
	assert.equal(await asked, true);
	const refused = ui.confirm({ title: 'Leave?' });
	page.key(document.querySelector('dialog'), 'Escape');
	assert.equal(await refused, false);
	assert.equal(document.querySelector('dialog'), null);
});

test('focus: cancel starts on Cancel without danger styling, and a danger may ask for Accept', async () => {
	const asked = ui.confirm({ title: 'Publish V3 to Production?', accept: 'Publish', focus: 'cancel' });
	assert.equal(document.activeElement.textContent, 'Cancel');
	const publish = [...document.querySelectorAll('dialog button')].find(button => button.textContent === 'Publish');
	assert.equal(publish.classList.contains('bui-button-danger'), false);
	assert.equal(publish.classList.contains('bui-button-primary'), true);
	page.key(document.querySelector('dialog'), 'Escape');
	assert.equal(await asked, false);
	const danger = ui.confirm({ title: 'Remove?', tone: 'danger', focus: 'accept', accept: 'Remove' });
	assert.equal(document.activeElement.textContent, 'Remove');
	page.key(document.querySelector('dialog'), 'Escape');
	assert.equal(await danger, false);
});

test('confirm with work stays busy, keeps a failure in the dialog, and resolves after a retry', async () => {
	let attempts = 0;
	let release;
	const asked = ui.confirm({ title: 'Delete project?', explain: error => `Not deleted: ${error.message}`, work: () => new Promise((resolve, reject) => { attempts++; release = attempts === 1 ? () => reject(new Error('locked')) : resolve; }) });
	const dialog = document.querySelector('dialog');
	const accept = [...dialog.querySelectorAll('button')].find(button => button.textContent === 'Confirm');
	accept.click();
	assert.equal(dialog.getAttribute('aria-busy'), 'true');
	page.key(dialog, 'Escape');
	assert.equal(dialog.open, true, 'busy confirmation is not dismissed');
	accept.click();
	assert.equal(attempts, 1, 'a second press while busy does nothing');
	release();
	await page.until(() => /Not deleted: locked/.test(dialog.textContent));
	assert.equal(dialog.open, true);
	accept.click();
	release();
	assert.equal(await asked, true);
	assert.equal(attempts, 2);
});

test('prompt validates before resolving its value, and resolves null when cancelled', async () => {
	const asked = ui.prompt({ title: 'New area', label: 'Name', messages: { valueMissing: 'Name the area.' } });
	const dialog = document.querySelector('dialog');
	const input = dialog.querySelector('input');
	assert.equal(document.activeElement, input);
	dialog.querySelector('form').requestSubmit();
	assert.match(dialog.textContent, /Name the area/);
	input.value = 'Billing';
	dialog.querySelector('form').requestSubmit();
	assert.equal(await asked, 'Billing');
	const cancelled = ui.prompt({ title: 'Rename', label: 'Name', value: 'Old' });
	[...document.querySelectorAll('dialog button')].find(button => button.textContent === 'Cancel').click();
	assert.equal(await cancelled, null);
});

test('alert resolves once acknowledged', async () => {
	const told = ui.alert({ title: 'Session ended', message: 'Sign in again to continue.', ok: 'Entendido' });
	[...document.querySelectorAll('dialog button')].find(button => button.textContent === 'Entendido').click();
	assert.equal(await told, undefined);
});
