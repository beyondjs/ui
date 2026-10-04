import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** SideSheet (0.7.0, LR-07): focus in and back, Tab kept inside, Escape and Close unless busy, never a press outside, a failure in place. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

function opener(text = 'Add repositories') {
	const button = Object.assign(document.createElement('button'), { textContent: text });
	document.body.append(button);
	button.focus();
	return button;
}

test('opens modal from the inline end with focus on its title, and closes on Escape with focus back on the opener', async () => {
	const button = opener();
	const sheet = new ui.SideSheet({ title: 'Add repositories to Storefront', description: 'Conduict clones them on My first VM.', children: [Object.assign(document.createElement('input'), { name: 'q' })] });
	const closed = sheet.open();
	assert.equal(sheet.shown, true);
	assert.ok(sheet.element.isConnected);
	assert.equal(sheet.element.tagName, 'DIALOG');
	assert.ok(sheet.element.classList.contains('bui-sheet-form'));
	const title = sheet.element.querySelector('.bui-sheet-title');
	assert.equal(sheet.element.getAttribute('aria-labelledby'), title.id);
	assert.ok(document.activeElement === title, 'focus lands on the title');
	assert.equal(document.documentElement.style.overflow, 'hidden', 'the page behind does not scroll');
	page.key(sheet.element.querySelector('input'), 'Escape');
	assert.equal(await closed, null);
	assert.equal(sheet.shown, false);
	assert.ok(!sheet.element.isConnected, 'a sheet it placed itself leaves the page');
	assert.ok(document.activeElement === button, 'focus returns to the opener');
	assert.equal(document.documentElement.style.overflow, '');
});

test('focus goes to [data-autofocus]; Tab and Shift+Tab stay inside; restore given to open wins', async () => {
	opener();
	const elsewhere = opener('Repositories tab');
	const search = Object.assign(document.createElement('input'), { type: 'search' });
	search.setAttribute('data-autofocus', '');
	const add = Object.assign(document.createElement('button'), { textContent: 'Add 1 repository' });
	const sheet = new ui.SideSheet({ title: 'Add repositories', children: [search], actions: [add] });
	const done = sheet.open({ restore: elsewhere });
	assert.ok(document.activeElement === search);
	const close = sheet.element.querySelector('.bui-sheet-close');
	page.key(search, 'Tab');
	assert.ok(document.activeElement === add);
	page.key(add, 'Tab');
	assert.ok(document.activeElement === close, 'wraps to the first control');
	page.key(close, 'Tab', { shiftKey: true });
	assert.ok(document.activeElement === add, 'Shift+Tab wraps back');
	assert.equal(sheet.close('added'), true);
	assert.equal(await done, 'added');
	assert.ok(document.activeElement === elsewhere, 'the restore given to open receives focus');
});

test('a press outside never closes it; while busy neither Escape, Close nor close() does', async () => {
	const button = opener();
	const closes = [];
	const sheet = new ui.SideSheet({ title: 'Add repositories', onclose: value => closes.push(value) });
	sheet.open();
	sheet.element.dispatchEvent(new window.MouseEvent('click', { bubbles: true, clientX: 1, clientY: 1 }));
	document.body.dispatchEvent(new window.PointerEvent('pointerdown', { bubbles: true }));
	assert.equal(sheet.shown, true, 'a press outside does nothing');
	sheet.busy = true;
	assert.equal(sheet.element.getAttribute('aria-busy'), 'true');
	assert.equal(sheet.element.getAttribute('closedby'), 'none');
	const close = sheet.element.querySelector('.bui-sheet-close');
	assert.equal(close.getAttribute('aria-disabled'), 'true');
	close.click();
	page.key(sheet.element, 'Escape');
	assert.equal(sheet.close('x'), false);
	sheet.element.dispatchEvent(new window.Event('cancel', { cancelable: true }));
	assert.equal(sheet.shown, true);
	sheet.busy = false;
	close.click();
	assert.equal(sheet.shown, false);
	assert.deepEqual(closes, [null]);
	assert.ok(document.activeElement === button);
});

test('error(node) shows a failure at the top without closing or losing the body; error(null) clears it', () => {
	const sheet = new ui.SideSheet({ title: 'Add repositories', labels: ui.SideSheet.labels.es });
	const typed = Object.assign(document.createElement('input'), { value: 'acme/we' });
	sheet.fill([typed]);
	sheet.open();
	const problem = sheet.element.querySelector('.bui-sheet-problem');
	assert.equal(problem.hidden, true);
	sheet.error(ui.callout({ tone: 'warning', title: 'Beyond Projects didn’t answer.', actions: [Object.assign(document.createElement('button'), { textContent: 'Try again' })] }));
	assert.equal(problem.hidden, false);
	assert.equal(problem.getAttribute('role'), 'alert');
	assert.match(problem.textContent, /didn’t answer.*Try again/);
	assert.equal(sheet.shown, true);
	assert.equal(sheet.body.querySelector('input').value, 'acme/we');
	sheet.error(null);
	assert.equal(problem.hidden, true);
	assert.equal(sheet.element.querySelector('.bui-sheet-close').getAttribute('aria-label'), 'Cerrar');
	sheet.title = 'Añadir repositorios';
	assert.equal(sheet.element.querySelector('.bui-sheet-title').textContent, 'Añadir repositorios');
	sheet.destroy();
	assert.ok(!sheet.element.isConnected);
});

test('the standard width, an accessible name of its own, a closed sheet refusing close, and an unknown width refused', async () => {
	const sheet = new ui.SideSheet({ title: 'acme/web', label: 'Repository acme/web', width: 'standard' });
	assert.ok(sheet.element.classList.contains('bui-sheet-standard'));
	assert.equal(sheet.element.getAttribute('aria-label'), 'Repository acme/web');
	assert.equal(sheet.element.getAttribute('aria-labelledby'), null);
	assert.equal(sheet.close(), false, 'nothing to close');
	const first = sheet.open();
	assert.ok(sheet.open() === first, 'opening again returns the same promise');
	sheet.destroy();
	assert.equal(await first, null);
	assert.equal(await sheet.open(), null, 'a destroyed sheet never opens');
	assert.throws(() => new ui.SideSheet({ title: 'x', width: 'reading' }), /form, standard/);
});
