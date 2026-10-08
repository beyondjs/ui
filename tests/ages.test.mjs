import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** The Sidebar's entries with their age and a group's count (0.11.0), in both forms, patched in place. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => {
	page.reset();
	page.window.happyDOM.setViewport({ width: 1280, height: 800 });
	document.documentElement.lang = 'en';
});

const ago = minutes => Date.now() - minutes * 60_000;
const groups = (items, count = items.length) => [{ kind: 'entries', key: 'recent', heading: 'Recent', count, items }];
function scene(items, options = {}) {
	const shell = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'bui-shell' }));
	return new ui.Sidebar({ product: 'Conduict', groups: groups(items), ...options }).mount(shell);
}
const forms = sidebar => [sidebar.element.querySelector('.bui-sidebar-panel nav'), sidebar.element.querySelector('dialog nav')];

test('an entry ends with its age in short words, the full moment read with it, in both forms', () => {
	const at = ago(125);
	const sidebar = scene([{ key: 'c1', label: 'Fix the checkout redirect', href: '#/c/c1', mark: { label: 'Needs you', tone: 'warning' }, age: at }]);
	for (const nav of forms(sidebar)) {
		const link = nav.querySelector('.bui-sidebar-entry');
		const time = link.querySelector('time.bui-sidebar-age');
		assert.ok(time, 'its age');
		assert.ok(link.lastElementChild === time && time.previousElementSibling.classList.contains('bui-sidebar-mark'), 'after the mark, at the entry\'s end');
		assert.equal(time.getAttribute('datetime'), new Date(at).toISOString());
		assert.equal(time.querySelector('[aria-hidden="true"]').textContent, '2 h', 'short words shown');
		const full = new Intl.DateTimeFormat('en', { dateStyle: 'full', timeStyle: 'short', hourCycle: 'h23' }).format(new Date(at));
		assert.equal(time.querySelector('.bui-hidden').textContent, `, ${full}`, 'the full moment for assistive technology');
		assert.equal(link.textContent, `Fix the checkout redirect, Needs you, ${full}2 h`);
	}
	sidebar.destroy();
});

test('short words by distance: now, minutes, hours, days, weeks, then the day; the product\'s own words verbatim', () => {
	const cases = [[0, 'now'], [5, '5 min'], [59, '59 min'], [60 * 23, '23 h'], [60 * 24 * 3, '3 d'], [60 * 24 * 14, '2 w']];
	const sidebar = scene(cases.map(([minutes], index) => ({ key: `c${index}`, label: `Entry ${index}`, href: `#/c/${index}`, age: ago(minutes) })));
	const nav = forms(sidebar)[0];
	assert.deepEqual([...nav.querySelectorAll('.bui-sidebar-age [aria-hidden]')].map(node => node.textContent), cases.map(([, words]) => words));
	const old = Date.parse('2024-03-06T10:00:00Z');
	sidebar.groups = groups([{ key: 'old', label: 'Old', href: '#/c/old', age: old }, { key: 'given', label: 'Given', href: '#/c/given', age: { label: 'yesterday', title: 'Yesterday at 10:42' } }]);
	const [first, second] = nav.querySelectorAll('.bui-sidebar-age');
	assert.equal(first.querySelector('[aria-hidden]').textContent, new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(old)), 'another year says it');
	assert.equal(second.querySelector('[aria-hidden]').textContent, 'yesterday');
	assert.equal(second.querySelector('.bui-hidden').textContent, ', Yesterday at 10:42');
	assert.equal(second.hasAttribute('datetime'), false, 'no moment, no datetime');
	sidebar.destroy();
});

test("an entry with an age shows the moment in its tooltip on hover and focus, with the title when it is cut; patching keeps the link", async () => {
	const sidebar = scene([{ key: 'c1', label: 'Fix the checkout redirect', href: '#/c/c1', age: { label: '2 h', title: 'Today at 08:00' } }]);
	const nav = forms(sidebar)[0];
	const link = nav.querySelector('.bui-sidebar-entry');
	link.dispatchEvent(new FocusEvent('focus'));
	const tip = [...document.querySelectorAll('.bui-tooltip')].find(node => !node.hidden);
	assert.ok(tip, 'a tooltip on focus');
	assert.equal(tip.textContent, 'Today at 08:00');
	assert.equal(tip.getAttribute('aria-hidden'), 'true', 'it repeats what the link says');
	sidebar.groups = groups([{ key: 'c1', label: 'Fix the checkout redirect', href: '#/c/c1', age: { label: '3 h', title: 'Today at 07:00' } }]);
	assert.ok(nav.querySelector('.bui-sidebar-entry') === link, 'the link stays');
	assert.equal(link.querySelector('.bui-sidebar-age [aria-hidden]').textContent, '3 h');
	sidebar.groups = groups([{ key: 'c1', label: 'Fix the checkout redirect', href: '#/c/c1' }]);
	assert.equal(link.querySelector('.bui-sidebar-age'), null, 'no age, nothing at the end');
	sidebar.destroy();
});

test('a group says its count beside its heading, read as "Recent, 12"; none without a count; Spanish units', () => {
	const sidebar = scene([{ key: 'c1', label: 'One', href: '#/c/1' }]);
	sidebar.groups = groups([{ key: 'c1', label: 'One', href: '#/c/1' }], 12);
	for (const nav of forms(sidebar)) {
		const heading = nav.querySelector('.bui-sidebar-heading');
		assert.equal(heading.textContent, 'Recent, 12');
		assert.equal(heading.querySelector('.bui-sidebar-count').textContent, '12');
		assert.equal(nav.querySelector('.bui-sidebar-list').getAttribute('aria-labelledby'), heading.id, 'the list is named with its count');
	}
	sidebar.groups = groups([{ key: 'c1', label: 'One', href: '#/c/1' }], null);
	assert.equal(forms(sidebar)[0].querySelector('.bui-sidebar-heading').textContent, 'Recent');
	sidebar.destroy();
	document.documentElement.lang = 'es';
	const spanish = scene([{ key: 'c1', label: 'Uno', href: '#/c/1', age: ago(60 * 24 * 14) }], { labels: ui.Sidebar.labels.es });
	assert.equal(forms(spanish)[0].querySelector('.bui-sidebar-age [aria-hidden]').textContent, '2 sem');
	spanish.destroy();
});
