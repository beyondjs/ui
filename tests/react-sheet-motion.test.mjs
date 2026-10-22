import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

const page = new Page();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React, act } = await import('react');
const { createRoot } = await import('react-dom/client');
const { SideSheet } = await import('@beyond-js/ui/react');
let root;
after(async () => { await act(() => root?.unmount()); await page.close(); });
beforeEach(async () => {
	await act(() => root?.unmount()); page.reset(); document.head.replaceChildren();
	const host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});

/** Keep the sheet mounted, as a product does while controlling its visibility. */
class Fixture {
	#closed = [];
	get values() { return this.#closed; }
	async render(open, guard = null) {
		await act(() => root.render(React.createElement(SideSheet, { open, title: 'Add repository', guard, onClose: value => this.#closed.push(value) }, React.createElement('input', { defaultValue: 'typed' }))));
	}
}

test('a changed guard applies without rebuilding the sheet or losing its fields', async () => {
	const fixture = new Fixture();
	await fixture.render(true, () => false);
	const sheet = document.querySelector('.bui-sheet');
	await act(() => sheet.querySelector('.bui-sheet-close').click());
	assert.equal(sheet.open, true);
	await fixture.render(true, () => true);
	assert.equal(document.querySelector('.bui-sheet'), sheet);
	assert.equal(sheet.querySelector('input').value, 'typed');
	await act(() => sheet.querySelector('.bui-sheet-close').click());
	assert.deepEqual(fixture.values, [null]);
});

test('controlled false then true during exit cancels removal and restores dismissal reporting', async () => {
	const style = document.createElement('style');
	style.textContent = '.bui-sheet[data-motion="out"] { animation-name: leaving; animation-duration: 0.12s; }';
	document.head.append(style);
	const fixture = new Fixture();
	await fixture.render(true);
	const sheet = document.querySelector('.bui-sheet');
	await fixture.render(false);
	assert.equal(sheet.inert, true);
	await fixture.render(true);
	assert.equal(sheet.inert, false);
	await act(() => sheet.dispatchEvent(new Event('animationend')));
	assert.equal(sheet.open, true);
	assert.deepEqual(fixture.values, []);
	await act(() => sheet.querySelector('.bui-sheet-close').click());
	await act(() => sheet.dispatchEvent(new Event('animationend')));
	assert.deepEqual(fixture.values, [null]);
});
