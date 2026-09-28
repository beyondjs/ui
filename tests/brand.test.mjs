import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

test('lockup names the product beside the wordmark; the image alone carries the accessible name Beyond', () => {
	const named = ui.lockup({ src: '/brand/wordmark.svg', name: 'Accounts' });
	assert.equal(named.className, 'bui-lockup');
	assert.equal(named.querySelector('.bui-lockup-mark').getAttribute('alt'), 'Beyond');
	assert.equal(named.querySelector('.bui-lockup-name').textContent, 'Accounts');
	assert.equal(named.textContent, 'Accounts');
	const bare = ui.lockup({ src: '/brand/wordmark.svg', alt: 'Beyond Snapshots' });
	assert.equal(bare.querySelector('.bui-lockup-name'), null);
	assert.equal(bare.querySelector('img').getAttribute('alt'), 'Beyond Snapshots');
});

test('Header: a brand lockup is shown but not read; the link is named once by the brand label', () => {
	const header = new ui.Header({ brand: { label: 'Beyond Snapshots', href: '/', lockup: { src: '/brand/wordmark.svg', name: 'Snapshots' } } }).mount(document.body);
	const link = header.element.querySelector('.bui-header-brand');
	assert.equal(link.getAttribute('aria-label'), 'Beyond Snapshots');
	assert.equal(link.querySelector('.bui-lockup').getAttribute('aria-hidden'), 'true');
	assert.equal(link.querySelector('.bui-lockup-name').textContent, 'Snapshots');
	assert.equal(link.querySelector('.bui-hidden'), null);
	header.destroy();
	const plain = new ui.Header({ brand: { label: 'Beyond', href: '/' } }).mount(document.body);
	assert.equal(plain.element.querySelector('.bui-header-brand').getAttribute('aria-label'), null);
	assert.equal(plain.element.querySelector('.bui-header-name').textContent, 'Beyond');
	plain.destroy();
});
