import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** The visible name of icon-only controls (D11): hover, keyboard focus, touch, Escape, one announcement, cleanup. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const hints = () => [...document.querySelectorAll('.bui-hint')];
const shown = () => hints().filter(node => !node.hidden);
const pointer = (target, type, pointerType = 'mouse', related = null) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType, relatedTarget: related }));

test('a dialog close button shows its name on hover and focus, once for assistive technology', async () => {
	const dialog = new ui.Dialog({ title: 'Rename area', children: [ui.el('input', { 'aria-label': 'Name' })] });
	dialog.open();
	const close = dialog.element.querySelector('.bui-icon-button');
	assert.ok(close.hasAttribute('data-bui-hint'));
	pointer(close, 'pointerover');
	assert.equal(shown().length, 0, 'hover waits a moment');
	await page.until(() => shown().length === 1);
	const [tip] = shown();
	assert.equal(tip.textContent, 'Close');
	assert.equal(tip.getAttribute('aria-hidden'), 'true');
	assert.equal(tip.getAttribute('role'), null);
	assert.equal(close.getAttribute('aria-describedby'), null, 'the name is not announced twice');
	assert.ok(tip.parentNode === dialog.element, 'drawn in the dialog, above the page');
	pointer(close, 'pointerout', 'mouse', document.body);
	assert.equal(shown().length, 0);
	close.focus();
	assert.equal(shown().length, 1, 'keyboard focus shows it at once');
	page.key(document.body, 'Escape');
	assert.equal(shown().length, 0, 'Escape hides it');
	dialog.destroy();
	assert.equal(hints().length, 0, 'destroy removes the hint');
});

test('touch shows the name for a moment; a press with a mouse hides it', async () => {
	const header = new ui.Header({ brand: { label: 'Beyond', href: '/' }, nav: [{ label: 'Requests', href: '/requests' }] }).mount(document.body);
	const toggle = header.element.querySelector('.bui-header-toggle');
	pointer(toggle, 'pointerdown', 'touch');
	assert.equal(shown()[0]?.textContent, 'Open navigation');
	await page.until(() => shown().length === 0, 3000);
	toggle.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
	toggle.click();
	assert.equal(shown().length, 0);
	header.expanded = true;
	toggle.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
	assert.equal(shown().length, 0, 'an expanded control shows no hint over its panel');
	header.destroy();
	assert.equal(hints().length, 0);
});

test('nested components show one hint: the nearest one', () => {
	const dialog = new ui.Dialog({ title: 'Choose', children: [new ui.Help({ topic: 'Identifier', text: 'Never changes.' }).element] });
	dialog.open();
	const help = dialog.element.querySelector('.bui-disclosure-help');
	help.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
	assert.deepEqual(shown().map(node => node.textContent), ['Help: Identifier']);
	dialog.destroy();
});

test('toasts, chips, the anonymous account and a glyph-only action menu carry hints; a removed control hides its hint', () => {
	const toaster = new ui.Toaster().mount(document.body);
	const remove = toaster.show('Saved', { tone: 'danger' });
	const dismiss = toaster.element.querySelector('.bui-icon-button');
	dismiss.focus();
	assert.equal(shown()[0].textContent, 'Dismiss');
	remove();
	assert.equal(shown().length, 0, 'the hint of a removed toast hides');
	const picker = new ui.Picker({ label: 'People', source: async () => ({ items: [], next: null }), selected: [{ id: 'p1', label: 'Ana' }] }).mount(document.body);
	assert.ok(picker.element.querySelector('.bui-chip-remove').hasAttribute('data-bui-hint'));
	const bar = new ui.FamilyBar({ product: 'cdn', brand: { src: '/w.svg', href: '/' }, descriptor: null, account: { signout: () => {} } }).mount(document.body);
	assert.ok(bar.element.querySelector('[data-part="account"] .bui-navmenu-button').hasAttribute('data-bui-hint'));
	const named = new ui.FamilyBar({ product: 'cdn', brand: { src: '/w.svg', href: '/' }, descriptor: null, fallback: { person: 'Ana Pérez' }, account: { signout: () => {} } }).mount(document.body);
	assert.equal(named.element.querySelector('[data-part="account"] .bui-navmenu-button').hasAttribute('data-bui-hint'), false, 'initials are a visible label');
	const bare = new ui.ActionMenu({ label: null, name: 'More actions', items: [{ label: 'Duplicate', run: () => {} }] }).mount(document.body);
	const labelled = new ui.ActionMenu({ label: 'More', name: 'More actions', items: [{ label: 'Duplicate', run: () => {} }] }).mount(document.body);
	assert.ok(bare.element.querySelector('.bui-menu-button').hasAttribute('data-bui-hint'));
	assert.equal(labelled.element.querySelector('.bui-menu-button').hasAttribute('data-bui-hint'), false);
	for (const part of [toaster, picker, bar, named, bare, labelled]) part.destroy();
	assert.equal(hints().length, 0);
});

test('Tooltip with describe: false shows the name without describing the control', () => {
	const button = ui.el('button', { 'aria-label': 'Minimize' }, [ui.icon('minimize')]);
	document.body.append(button);
	const plain = new ui.Tooltip(button, { text: 'Minimize · Ctrl+M', describe: false });
	assert.equal(button.getAttribute('aria-describedby'), null);
	assert.equal(plain.element.getAttribute('aria-hidden'), 'true');
	assert.equal(plain.element.getAttribute('role'), null);
	plain.show();
	assert.equal(plain.shown, true);
	plain.destroy();
	const described = new ui.Tooltip(button, { text: 'Copies the address' });
	assert.equal(button.getAttribute('aria-describedby'), described.element.id, 'the default still describes');
	described.destroy();
});
