import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** The Sidebar's entries, top action and search (0.10.0): patched by keys in both forms, focus kept, a bounded search with its states. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => {
	page.reset();
	page.window.happyDOM.setViewport({ width: 1280, height: 800 });
	document.documentElement.style.overflow = '';
});

const entry = (key, label, extra = {}) => ({ key, label, href: `#/c/${key}`, ...extra });
const groups = (recent, attention = []) => [
	{ items: [{ label: 'Overview', href: '#/overview' }, { label: 'Environments', href: '#/environments', meta: '1 ready' }] },
	{ kind: 'entries', key: 'needs', heading: 'Needs you', items: attention },
	{ kind: 'entries', key: 'recent', heading: 'Recent', items: recent, more: { label: 'All conversations', href: '#/conversations' } }
];
function scene(options = {}) {
	const shell = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'bui-shell' }));
	const sidebar = new ui.Sidebar({ product: 'Conduict', section: 'Conversations', groups: groups([entry('c1', 'Fix the checkout redirect', { current: true }), entry('c2', 'Upgrade the build', { mark: { label: 'Failed', tone: 'danger' } })], [entry('c3', 'Add product filters', { mark: { label: 'Needs you', tone: 'warning' } })]), action: { label: 'New conversation', href: '#/new' }, ...options }).mount(shell);
	shell.append(Object.assign(document.createElement('main'), { innerHTML: '<h1 tabindex="-1">Conversation</h1>' }));
	return sidebar;
}
const panel = sidebar => sidebar.element.querySelector('.bui-sidebar-panel nav');
const drawer = sidebar => sidebar.element.querySelector('dialog nav');
const link = (nav, text) => [...nav.querySelectorAll('a')].find(node => node.querySelector('.bui-sidebar-label')?.textContent === text);
const settle = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

test('entries: one line each with at most one mark in words, their headings, the current one, a more link and the top action, in both forms', () => {
	const sidebar = scene();
	for (const nav of [panel(sidebar), drawer(sidebar)]) {
		const action = nav.querySelector('.bui-sidebar-action');
		assert.equal(action.getAttribute('href'), '#/new');
		assert.equal(action.textContent, 'New conversation');
		assert.equal(action.querySelector('svg').dataset.icon, 'plus', 'the plus glyph beside its words');
		assert.ok(nav.firstElementChild === action, 'the action comes first without a context');
		assert.deepEqual([...nav.querySelectorAll('.bui-sidebar-heading')].map(node => node.textContent), ['Needs you', 'Recent']);
		const failed = link(nav, 'Upgrade the build');
		assert.ok(failed.classList.contains('bui-sidebar-entry'));
		const mark = failed.querySelector('.bui-sidebar-mark');
		assert.equal(mark.dataset.tone, 'danger');
		assert.equal(mark.textContent, ', Failed', 'the mark is words');
		assert.equal(link(nav, 'Fix the checkout redirect').getAttribute('aria-current'), 'page');
		assert.equal(nav.querySelector('.bui-sidebar-more').getAttribute('href'), '#/conversations');
		assert.equal(link(nav, 'Environments').querySelector('.bui-sidebar-meta').textContent, '1 ready', 'sections keep their meta');
	}
	assert.equal(sidebar.element.querySelector('.bui-sidebar-section').textContent, 'Conversations');
	sidebar.destroy();
});

test('a live change patches by keys: the navigation stays, focus stays on its link while others move, come and go', () => {
	const sidebar = scene();
	const nav = panel(sidebar);
	const kept = link(nav, 'Upgrade the build');
	kept.focus();
	sidebar.groups = groups([entry('c4', 'Tidy the styles'), entry('c2', 'Upgrade the build', { mark: { label: 'Working', tone: 'progress' } }), entry('c1', 'Fix the checkout redirect', { current: true })]);
	assert.ok(panel(sidebar) === nav, 'the same navigation');
	assert.ok(link(nav, 'Upgrade the build') === kept, 'the same link');
	assert.ok(document.activeElement === kept, 'focus never moves');
	assert.equal(kept.querySelector('.bui-sidebar-mark').textContent, ', Working');
	assert.deepEqual([...nav.querySelectorAll('.bui-sidebar-entries:last-of-type .bui-sidebar-label')].map(node => node.textContent), ['Tidy the styles', 'Upgrade the build', 'Fix the checkout redirect', 'All conversations']);
	assert.equal(nav.querySelectorAll('.bui-sidebar-heading').length, 1, 'an empty group of entries is left out');
	sidebar.groups = groups([entry('c4', 'Tidy the styles'), entry('c1', 'Fix the checkout redirect', { current: true })]);
	assert.ok(document.activeElement === link(nav, 'Fix the checkout redirect'), 'focus on an entry that left moves to the one at its place');
	assert.equal(link(drawer(sidebar), 'Tidy the styles').getAttribute('href'), '#/c/c4', 'the drawer is patched the same');
	sidebar.destroy();
});

test('a cut entry title shows whole on hover and focus only while it is cut', () => {
	const sidebar = scene();
	const node = link(panel(sidebar), 'Fix the checkout redirect');
	const label = node.querySelector('.bui-sidebar-label');
	Object.defineProperty(label, 'scrollWidth', { value: 300, configurable: true });
	Object.defineProperty(label, 'clientWidth', { value: 120, configurable: true });
	node.dispatchEvent(new Event('focus'));
	const tip = [...document.querySelectorAll('.bui-tooltip')].find(item => !item.hidden);
	assert.equal(tip?.textContent, 'Fix the checkout redirect');
	assert.equal(tip.getAttribute('aria-hidden'), 'true', 'the link already says it');
	sidebar.destroy();
});

test('search: results replace the groups after a short wait, are counted politely, and Escape brings the groups back', async () => {
	const asked = [];
	const sidebar = scene({ search: { label: 'Search conversations', delay: 5, source: async ({ query, signal }) => (asked.push([query, signal.aborted]), [entry('c9', `Found ${query}`)]), all: query => `#/conversations?q=${encodeURIComponent(query)}` } });
	const nav = panel(sidebar);
	const field = nav.querySelector('input[type="search"]');
	assert.equal(field.getAttribute('aria-label'), 'Search conversations');
	assert.ok(nav.querySelector('[role="search"]').contains(field));
	field.value = 'checkout';
	field.dispatchEvent(new Event('input'));
	assert.equal(nav.querySelector('.bui-sidebar-groups').hidden, true, 'the groups make way while a query is typed');
	assert.equal(nav.querySelector('.bui-sidebar-line').textContent, 'Searching…');
	await page.until(() => nav.querySelector('.bui-sidebar-results .bui-sidebar-entry'));
	assert.deepEqual(asked, [['checkout', false]]);
	assert.equal(nav.querySelector('.bui-sidebar-line').hidden, true);
	assert.equal(nav.querySelector('.bui-sidebar-results .bui-sidebar-heading').textContent, 'Results');
	assert.equal(nav.querySelector('.bui-announcer').textContent, '1 result', 'a polite count');
	assert.equal(nav.querySelector('.bui-announcer').getAttribute('aria-live'), 'polite');
	assert.equal(nav.querySelector('.bui-sidebar-results .bui-sidebar-more').getAttribute('href'), '#/conversations?q=checkout');
	const copy = drawer(sidebar);
	assert.equal(copy.querySelector('input[type="search"]').value, 'checkout', "the drawer's field follows");
	assert.ok(copy.querySelector('.bui-sidebar-results .bui-sidebar-entry'), 'and shows the same results');
	const escape = page.key(field, 'Escape');
	assert.equal(escape.defaultPrevented, true);
	assert.equal(field.value, '');
	assert.equal(nav.querySelector('.bui-sidebar-groups').hidden, false);
	assert.equal(nav.querySelector('.bui-sidebar-results').hidden, true);
	assert.equal(page.key(field, 'Escape').defaultPrevented, false, 'an empty field lets Escape through');
	sidebar.destroy();
});

test('search: no match, a failure and a source past its bound say so with Try again; a newer query aborts the older one', async () => {
	const signals = [];
	let mode = 'none';
	const sidebar = scene({ search: { label: 'Search conversations', delay: 1, bound: 30, source: ({ signal }) => {
		signals.push(signal);
		if (mode === 'none') return Promise.resolve([]);
		if (mode === 'fail') return Promise.reject(new Error('down'));
		return new Promise(() => {});
	} } });
	const nav = panel(sidebar);
	const field = nav.querySelector('input[type="search"]');
	const type = text => ((field.value = text), field.dispatchEvent(new Event('input')));
	type('zebra');
	await page.until(() => nav.querySelector('.bui-sidebar-line').textContent.startsWith('Nothing'));
	assert.equal(nav.querySelector('.bui-sidebar-line').textContent, 'Nothing matches “zebra”.');
	assert.equal(nav.querySelector('.bui-announcer').textContent, 'Nothing matches “zebra”.');
	mode = 'fail';
	type('zebras');
	await page.until(() => !nav.querySelector('.bui-sidebar-retry').hidden);
	assert.equal(nav.querySelector('.bui-sidebar-line').textContent, 'The search didn’t answer, so results can’t be listed now.');
	mode = 'silent';
	nav.querySelector('.bui-sidebar-retry').click();
	assert.equal(nav.querySelector('.bui-sidebar-line').textContent, 'Searching…');
	await page.until(() => !nav.querySelector('.bui-sidebar-retry').hidden);
	assert.equal(signals.at(-1).aborted, true, 'a source past its bound is aborted, never "nothing matches"');
	type('zebra crossing');
	await settle(5);
	type('zebra crossings');
	await settle(5);
	assert.equal(signals.at(-2).aborted, true, 'the older request is aborted');
	sidebar.destroy();
	assert.equal(signals.at(-1).aborted, true, 'destroying aborts what is pending');
});

test('Enter opens every result and the action is routed like any destination, closing the drawer', async () => {
	page.window.happyDOM.setViewport({ width: 800, height: 800 });
	const seen = [];
	const sidebar = scene({ onnavigate: item => seen.push(item.href), search: { label: 'Search conversations', delay: 1, source: async () => [], all: query => `#/all?q=${query}` } });
	sidebar.open();
	const nav = drawer(sidebar);
	nav.querySelector('.bui-sidebar-action').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
	assert.equal(sidebar.expanded, false, 'a destination closes the drawer');
	sidebar.open();
	const field = nav.querySelector('input[type="search"]');
	field.value = 'redirect';
	field.dispatchEvent(new Event('input'));
	await page.until(() => nav.querySelector('.bui-sidebar-line').textContent.startsWith('Nothing'));
	page.key(field, 'Escape');
	assert.equal(sidebar.expanded, true, 'Escape with a query clears it and keeps the drawer');
	field.value = 'redirect';
	field.dispatchEvent(new Event('input'));
	page.key(field, 'Enter');
	assert.deepEqual(seen, ['#/new', '#/all?q=redirect']);
	sidebar.destroy();
	assert.equal(sidebar.listeners.size, 0);
});

test('Spanish search words, and a search replaced or removed', () => {
	const sidebar = scene({ labels: ui.Sidebar.labels.es, search: { label: 'Buscar conversaciones', source: async () => [] } });
	assert.deepEqual(Object.keys(ui.Sidebar.labels.es).sort(), Object.keys(ui.Sidebar.labels.en).sort());
	assert.equal(new ui.Labels(ui.Sidebar.labels.es).text('count', { count: 3 }), '3 resultados');
	assert.equal(new ui.Labels(ui.Sidebar.labels.en).text('count', { count: 1 }), '1 result');
	sidebar.search = null;
	assert.equal(panel(sidebar).querySelector('input[type="search"]'), null);
	sidebar.action = null;
	assert.equal(panel(sidebar).querySelector('.bui-sidebar-action'), null);
	sidebar.destroy();
});
