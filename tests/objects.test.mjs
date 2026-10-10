import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/**
 * The Sidebar of 0.14.0 (D97, D98): the product's objects after its sections, with their action and their
 * search's icon on one heading line, groups of entries that fold and keep their fold per device and
 * product, ⌘K / Ctrl+K as an option a product enables, and the objects' action at the product row's end.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => {
	page.reset();
	page.window.happyDOM.setViewport({ width: 1280, height: 800 });
	page.window.localStorage.clear();
	document.documentElement.style.overflow = '';
});

const entry = (key, label, extra = {}) => ({ key, label, href: `#/c/${key}`, ...extra });
const settle = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));
const asked = [];
const source = async ({ query }) => (asked.push(query), [entry('r1', `Result for ${query}`)]);
const objects = ({ needs = [entry('c3', 'Add filters', { mark: { label: 'Needs you', tone: 'warning' } })], recent = [entry('c1', 'Fix the redirect', { current: true }), entry('c2', 'Upgrade the build')], row = false } = {}) => [
	{ items: [{ label: 'Overview', href: '#/overview' }, { label: 'Environments', href: '#/environments' }] },
	{ kind: 'object', key: 'conversations', heading: 'Conversations', action: { label: 'New', href: '#/new', row }, search: { label: 'Search conversations', source, delay: 0 }, groups: [{ kind: 'entries', key: 'needs', heading: 'Needs you', items: needs, attention: true }, { kind: 'entries', key: 'recent', heading: 'Recent', count: recent.length, items: recent }], more: { label: 'All conversations', href: '#/conversations' } }
];
function scene(options = {}) {
	const shell = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'bui-shell' }));
	const sidebar = new ui.Sidebar({ product: 'Conduict', context: { label: 'Project', name: 'Storefront' }, groups: objects(), ...options }).mount(shell);
	return sidebar;
}
const panel = sidebar => sidebar.element.querySelector('.bui-sidebar-panel nav');
const drawer = sidebar => sidebar.element.querySelector('dialog nav');

test('order: the context, the sections, then the objects with their heading line (action and search icon), their groups and their more link, in both copies', () => {
	const sidebar = scene();
	for (const nav of [panel(sidebar), drawer(sidebar)]) {
		assert.ok(nav.firstElementChild.classList.contains('bui-sidebar-context'), 'the context line stays the first child: a stable hook products anchor after');
		const object = nav.querySelector('.bui-sidebar-object');
		assert.ok(nav.querySelector('.bui-sidebar-context').compareDocumentPosition(object) & 4);
		const sections = [...nav.querySelectorAll('.bui-sidebar-group')].find(node => !node.closest('.bui-sidebar-object'));
		assert.ok(sections.compareDocumentPosition(object) & 4, 'after the sections');
		const head = object.querySelector('.bui-sidebar-object-head');
		assert.equal(head.querySelector('.bui-sidebar-object-title').textContent, 'Conversations');
		assert.equal(object.getAttribute('aria-labelledby'), head.querySelector('.bui-sidebar-object-title').id);
		const action = head.querySelector('.bui-sidebar-object-action');
		assert.equal(action.textContent, 'New');
		assert.equal(action.querySelector('svg').dataset.icon, 'plus', 'the word with the plus glyph (plus is not on the closed list)');
		const seek = head.querySelector('.bui-sidebar-seek');
		assert.equal(seek.getAttribute('aria-label'), 'Search conversations');
		assert.ok(seek.hasAttribute('data-bui-hint'), 'the search glyph alone shows its name (D11)');
		assert.equal(seek.querySelector('svg').dataset.icon, 'search');
		assert.ok(head.querySelector('.bui-sidebar-search').hidden, 'the field waits behind its icon');
		assert.deepEqual([...object.querySelectorAll('.bui-sidebar-fold-label')].map(node => node.textContent), ['Needs you', 'Recent']);
		assert.equal(object.lastElementChild.textContent, 'All conversations');
		assert.equal(nav.querySelector('.bui-sidebar-action'), null, 'no top action when the objects carry theirs');
	}
	assert.equal(sidebar.shortcut, false, 'the shortcut is a product’s option, off by default');
	sidebar.destroy();
});

test('a group of entries folds under its disclosure heading, keeps its count and its current item, and its choice per device and product', () => {
	const sidebar = scene();
	const nav = panel(sidebar);
	const recent = [...nav.querySelectorAll('.bui-sidebar-fold')].find(node => node.textContent.startsWith('Recent'));
	assert.equal(recent.getAttribute('aria-expanded'), 'true');
	assert.equal(recent.textContent, 'Recent, 2', 'its count, read with its name');
	const list = document.getElementById(recent.getAttribute('aria-controls'));
	assert.ok(list.classList.contains('bui-sidebar-list'));
	recent.click();
	assert.equal(recent.getAttribute('aria-expanded'), 'false');
	assert.ok(list.closest('.bui-sidebar-group').hasAttribute('data-folded'));
	assert.deepEqual([...list.children].filter(li => li.hasAttribute('data-current')).map(li => li.textContent), ['Fix the redirect'], 'the current item stays listed');
	assert.equal(recent.textContent, 'Recent, 2', 'the count is kept folded');
	const copy = [...drawer(sidebar).querySelectorAll('.bui-sidebar-fold')].find(node => node.textContent.startsWith('Recent'));
	assert.equal(copy.getAttribute('aria-expanded'), 'false', 'the drawer follows');
	assert.equal(page.window.localStorage.getItem('bui-sidebar:Conduict:recent'), 'folded');
	sidebar.destroy();
	const again = scene();
	const kept = [...panel(again).querySelectorAll('.bui-sidebar-fold')].find(node => node.textContent.startsWith('Recent'));
	assert.equal(kept.getAttribute('aria-expanded'), 'false', 'kept after a reload');
	kept.click();
	assert.equal(page.window.localStorage.getItem('bui-sidebar:Conduict:recent'), null);
	again.destroy();
	const other = scene({ product: 'Delegate' });
	assert.equal([...panel(other).querySelectorAll('.bui-sidebar-fold')].every(node => node.getAttribute('aria-expanded') === 'true'), true, 'per product');
	other.destroy();
});

test('a group that needs the person keeps its tone folded and opens by itself when a new item needs them; sections never fold', () => {
	const sidebar = scene();
	const nav = panel(sidebar);
	const needs = () => [...nav.querySelectorAll('.bui-sidebar-fold')].find(node => node.textContent.startsWith('Needs you'));
	needs().click();
	const group = needs().closest('.bui-sidebar-group');
	assert.ok(group.hasAttribute('data-folded') && group.hasAttribute('data-attention'));
	sidebar.groups = objects();
	assert.equal(needs().getAttribute('aria-expanded'), 'false', 'the same items keep it folded');
	sidebar.groups = objects({ needs: [entry('c3', 'Add filters'), entry('c9', 'Approve a command')] });
	assert.equal(needs().getAttribute('aria-expanded'), 'true', 'a new item opens it');
	const sections = [...nav.querySelectorAll('.bui-sidebar-group')].filter(node => !node.closest('.bui-sidebar-object'));
	assert.ok(sections.length && sections.every(node => !node.querySelector('.bui-sidebar-fold')), 'sections have no disclosure');
	sidebar.destroy();
});

test('storage that throws keeps the choice for the page only', () => {
	const storage = Object.getOwnPropertyDescriptor(page.window, 'localStorage');
	Object.defineProperty(page.window, 'localStorage', { configurable: true, get: () => ({ getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); }, removeItem: () => { throw new Error('blocked'); } }) });
	try {
		const sidebar = scene();
		const fold = panel(sidebar).querySelector('.bui-sidebar-fold');
		fold.click();
		assert.equal(fold.getAttribute('aria-expanded'), 'false');
		sidebar.destroy();
	} finally {
		if (storage) Object.defineProperty(page.window, 'localStorage', storage);
		else delete page.window.localStorage;
	}
});

test('the search icon expands into its field over the heading line; Escape returns to it with focus; an empty field left returns too', async () => {
	const sidebar = scene();
	const nav = panel(sidebar);
	const head = nav.querySelector('.bui-sidebar-object-head');
	const seek = head.querySelector('.bui-sidebar-seek');
	const field = head.querySelector('input[type="search"]');
	seek.click();
	assert.ok(head.hasAttribute('data-searching'));
	assert.equal(seek.hidden, true);
	assert.equal(document.activeElement, field);
	field.value = 'redirect';
	field.dispatchEvent(new page.window.Event('input', { bubbles: true }));
	await settle(5);
	assert.equal(asked.at(-1), 'redirect');
	assert.ok(nav.querySelector('.bui-sidebar-object-groups').hidden, 'results take the groups’ place');
	assert.equal(nav.querySelector('.bui-sidebar-object .bui-sidebar-results .bui-sidebar-label').textContent, 'Result for redirect');
	assert.ok(!nav.querySelector('.bui-sidebar-groups').hidden, 'the sections stay');
	page.key(field, 'Escape');
	assert.equal(field.value, '');
	assert.ok(!head.hasAttribute('data-searching'));
	assert.equal(document.activeElement, seek, 'focus returns to the icon');
	assert.ok(!nav.querySelector('.bui-sidebar-object-groups').hidden);
	seek.click();
	field.dispatchEvent(new page.window.FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
	assert.ok(!head.hasAttribute('data-searching'), 'an empty field left returns to the icon');
	sidebar.destroy();
});

test('⌘K / Ctrl+K opens the search when the product enables it; a host turns it off; a key a host took is left; no single key', () => {
	const sidebar = scene({ shortcut: true });
	const nav = panel(sidebar);
	const seek = nav.querySelector('.bui-sidebar-seek');
	assert.equal(seek.dataset.buiShortcut, 'Ctrl+K');
	assert.equal(seek.getAttribute('aria-keyshortcuts'), 'Control+K');
	const field = nav.querySelector('.bui-sidebar-object-head input');
	page.key(document.body, 'k');
	assert.notEqual(document.activeElement, field, 'k alone does nothing');
	const pressed = page.key(document.body, 'k', { ctrlKey: true });
	assert.ok(pressed.defaultPrevented);
	assert.equal(document.activeElement, field);
	page.key(field, 'Escape');
	const taken = new page.window.KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true });
	taken.preventDefault();
	document.body.dispatchEvent(taken);
	assert.notEqual(document.activeElement, field, 'a key a host handled is left to it');
	sidebar.shortcut = false;
	page.key(document.body, 'k', { ctrlKey: true });
	assert.notEqual(document.activeElement, field, 'off');
	sidebar.destroy();
	const plain = scene();
	assert.equal(plain.element.querySelector('.bui-sidebar-seek').dataset.buiShortcut, undefined);
	assert.ok(!page.key(document.body, 'k', { ctrlKey: true }).defaultPrevented);
	plain.destroy();
});

test('below the cut, ⌘K opens the drawer with its search, and the objects’ action may end the product row (SB-07)', () => {
	page.window.happyDOM.setViewport({ width: 600, height: 800 });
	const sidebar = scene({ shortcut: true, groups: objects({ row: true }) });
	assert.equal(sidebar.mode, 'drawer');
	const start = sidebar.element.querySelector('.bui-sidebar-row .bui-sidebar-start');
	assert.equal(start.getAttribute('href'), '#/new');
	assert.equal(start.textContent, 'New');
	page.key(document.body, 'k', { ctrlKey: true });
	assert.equal(sidebar.expanded, true);
	assert.equal(document.activeElement, drawer(sidebar).querySelector('.bui-sidebar-object-head input'));
	sidebar.close();
	sidebar.groups = objects();
	assert.equal(sidebar.element.querySelector('.bui-sidebar-start'), null, 'without row, the row keeps only its button');
	sidebar.destroy();
});

test('the current item reads in the text color (D98): no link color on it', async () => {
	const { readFileSync } = await import('node:fs');
	const css = readFileSync(new URL('../src/styles/sidebar.css', import.meta.url), 'utf8');
	const rule = css.slice(css.indexOf(".bui-sidebar-item[aria-current='page'] {"));
	const body = rule.slice(0, rule.indexOf('}'));
	assert.match(body, /color: var\(--color-text\);/);
	assert.match(body, /font-weight: var\(--weight-medium\)/);
	assert.match(body, /inset 2px 0 0 var\(--color-accent\)/);
	assert.doesNotMatch(body, /--color-link/);
});
