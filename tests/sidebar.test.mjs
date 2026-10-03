import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

/** The shared Sidebar: permanent above the product's cut, a product row and a modal drawer below it. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => {
	page.reset();
	page.window.happyDOM.setViewport({ width: 1024, height: 768 });
	document.documentElement.style.overflow = '';
});

const groups = [
	{ heading: null, items: [{ label: 'Projects', href: '/projects' }] },
	{ heading: 'Project', items: [{ label: 'Requests', href: '/requests', current: true, meta: 3 }, { label: 'Versions', href: '/versions' }, { label: 'Elsewhere', href: 'https://example.test/' }] },
	{ heading: 'Empty', items: [] }
];
/** A page as a product builds it: the family bar's place, then a shell with the sidebar and the main content. */
function scene(options = {}) {
	const bar = document.body.appendChild(Object.assign(document.createElement('header'), { className: 'bar' }));
	bar.append(Object.assign(document.createElement('button'), { textContent: 'Bar' }));
	const shell = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'bui-shell' }));
	const sidebar = new ui.Sidebar({ product: 'Delegate', groups, context: { label: 'Project', name: 'Storefront' }, ...options }).mount(shell);
	const main = shell.appendChild(Object.assign(document.createElement('main'), { innerHTML: '<h1 tabindex="-1">Requests</h1>' }));
	return { bar, shell, sidebar, main };
}
const drawer = sidebar => sidebar.element.querySelector('dialog.bui-drawer');
const button = sidebar => sidebar.element.querySelector('.bui-sidebar-button');

test('above the cut: a permanent sidebar with the context, the groups and the current item; no product row', () => {
	const { sidebar } = scene({ cut: 800 });
	assert.equal(sidebar.mode, 'permanent');
	const panel = sidebar.element.querySelector('.bui-sidebar-panel');
	assert.equal(panel.hidden, false);
	assert.equal(sidebar.element.querySelector('.bui-sidebar-row').hidden, true);
	const nav = panel.querySelector('nav');
	assert.equal(nav.getAttribute('aria-label'), 'Delegate sections');
	assert.deepEqual([...nav.querySelectorAll('.bui-sidebar-context > span')].map(node => node.textContent), ['Project', 'Storefront']);
	assert.deepEqual([...nav.querySelectorAll('.bui-sidebar-heading')].map(node => node.textContent), ['Project'], 'an empty group is left out');
	const current = nav.querySelectorAll('[aria-current="page"]');
	assert.equal(current.length, 1);
	assert.equal(current[0].querySelector('.bui-sidebar-label').textContent, 'Requests');
	assert.equal(current[0].querySelector('.bui-sidebar-meta').textContent, '3');
	assert.equal(nav.querySelector('ul[aria-labelledby]').getAttribute('aria-labelledby'), nav.querySelector('.bui-sidebar-heading').id);
	sidebar.open();
	assert.equal(drawer(sidebar).open, false, 'no drawer above the cut');
	sidebar.destroy();
});

test('below the cut: the product row names the section, and its button opens a modal drawer over an inert page', () => {
	const { bar, shell, sidebar, main } = scene({ cut: 1200 });
	const trigger = button(sidebar);
	assert.equal(sidebar.mode, 'drawer');
	assert.equal(trigger.textContent, 'Requests', 'the visible text is the section in view, which is also its name');
	assert.deepEqual(['aria-haspopup', 'aria-expanded', 'aria-controls'].map(name => trigger.getAttribute(name)), ['dialog', 'false', drawer(sidebar).id]);
	const length = page.window.history.length;
	trigger.focus();
	trigger.click();
	const dialog = drawer(sidebar);
	assert.equal(dialog.open, true);
	assert.equal(trigger.getAttribute('aria-expanded'), 'true');
	assert.deepEqual(['aria-modal', 'aria-label'].map(name => dialog.getAttribute(name)), ['true', 'Delegate sections']);
	assert.equal(dialog.querySelector('.bui-drawer-title').textContent, 'Delegate');
	assert.equal(document.activeElement.getAttribute('aria-current'), 'page', 'focus on the current item');
	assert.ok(dialog.contains(document.activeElement));
	for (const node of [bar, main, sidebar.element.querySelector('.bui-sidebar-row'), sidebar.element.querySelector('.bui-sidebar-panel')]) assert.ok(node.hasAttribute('inert'), `${node.className || node.tagName} is inert`);
	assert.ok(!shell.hasAttribute('inert') && !sidebar.element.hasAttribute('inert'), 'the drawer\'s own ancestors stay live');
	assert.equal(document.documentElement.style.overflow, 'hidden', 'the page does not scroll behind it');
	assert.equal(page.window.history.length, length, 'opening adds no history entry');
	page.key(document.activeElement, 'Escape');
	assert.equal(dialog.open, false);
	assert.ok(document.activeElement === trigger, 'Escape returns focus to the row button');
	assert.equal(trigger.getAttribute('aria-expanded'), 'false');
	assert.ok(![bar, main].some(node => node.hasAttribute('inert')), 'the page is live again');
	assert.equal(document.documentElement.style.overflow, '');
	sidebar.destroy();
});

test('the drawer keeps Tab inside, and the scrim and Close shut it with focus back on the row button', () => {
	const { sidebar } = scene({ cut: 1200 });
	const trigger = button(sidebar);
	sidebar.open();
	const dialog = drawer(sidebar);
	const close = dialog.querySelector('.bui-drawer-close');
	assert.equal(close.getAttribute('aria-label'), 'Close');
	assert.ok(close.hasAttribute('data-bui-hint'), 'an icon-only Close shows its name as a tooltip');
	const links = [...dialog.querySelectorAll('a[href]')];
	links.at(-1).focus();
	page.key(links.at(-1), 'Tab');
	assert.ok(document.activeElement === close, 'Tab from the last item wraps to the first control');
	page.key(close, 'Tab', { shiftKey: true });
	assert.ok(document.activeElement === links.at(-1), 'Shift+Tab wraps back');
	dialog.querySelector('.bui-drawer-scrim').click();
	assert.equal(dialog.open, false, 'a press on the scrim closes it');
	assert.ok(document.activeElement === trigger);
	sidebar.open();
	close.click();
	assert.equal(dialog.open, false);
	assert.ok(document.activeElement === trigger);
	sidebar.destroy();
});

test('choosing a destination closes the drawer, leaves focus to the product and goes through onnavigate', () => {
	const seen = [];
	const { sidebar } = scene({ cut: 1200, onnavigate: (item, event) => seen.push([item.href, item.label, event.defaultPrevented]) });
	const stop = event => event.preventDefault();
	sidebar.open();
	const versions = [...drawer(sidebar).querySelectorAll('a')].find(node => node.textContent === 'Versions');
	versions.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
	assert.equal(drawer(sidebar).open, false);
	assert.ok(document.activeElement !== button(sidebar), 'focus is the product\'s to move to its heading');
	assert.deepEqual(seen, [['/versions', 'Versions', true]]);
	document.addEventListener('click', stop);
	const elsewhere = [...sidebar.element.querySelectorAll('.bui-sidebar-panel a')].find(node => node.textContent === 'Elsewhere');
	elsewhere.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
	const versionsWide = [...sidebar.element.querySelectorAll('.bui-sidebar-panel a')].find(node => node.textContent === 'Versions');
	versionsWide.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, metaKey: true }));
	document.removeEventListener('click', stop);
	assert.equal(seen.length, 1, 'another origin and a modified click are left to the browser');
	sidebar.destroy();
});

test('crossing the cut while the drawer is open closes it at once and moves focus to the permanent current item', () => {
	const { bar, sidebar } = scene({ cut: 1200 });
	sidebar.open();
	page.window.happyDOM.setViewport({ width: 1300, height: 768 });
	page.window.dispatchEvent(new Event('resize'));
	assert.equal(sidebar.mode, 'permanent');
	assert.equal(drawer(sidebar).open, false);
	assert.equal(sidebar.expanded, false);
	assert.ok(sidebar.element.querySelector('.bui-sidebar-panel').contains(document.activeElement), 'focus moved to the sidebar that took its place');
	assert.equal(document.activeElement.getAttribute('aria-current'), 'page');
	assert.ok(!bar.hasAttribute('inert'));
	page.window.happyDOM.setViewport({ width: 800, height: 768 });
	page.window.dispatchEvent(new Event('resize'));
	assert.equal(sidebar.mode, 'drawer', 'and back below the cut');
	sidebar.destroy();
});

test('setters redraw both forms; a page already inert stays inert; destroy releases everything', () => {
	const { bar, sidebar } = scene({ cut: 1200 });
	sidebar.groups = [{ items: [{ label: 'Versions', href: '/versions', current: true }] }];
	assert.equal(button(sidebar).textContent, 'Versions');
	sidebar.section = 'Version 7';
	assert.equal(button(sidebar).textContent, 'Version 7');
	sidebar.section = null;
	sidebar.context = 'Handbook';
	assert.equal(drawer(sidebar).querySelector('.bui-sidebar-context-name').textContent, 'Handbook');
	sidebar.groups = [];
	assert.equal(button(sidebar).textContent, 'Delegate', 'with no current item the row names the product');
	bar.setAttribute('inert', '');
	sidebar.open();
	sidebar.destroy();
	assert.ok(bar.hasAttribute('inert'), 'what was inert before is left as it was');
	assert.equal(document.documentElement.style.overflow, '');
	assert.equal(document.querySelector('.bui-sidebar'), null);
	assert.equal(sidebar.listeners.size, 0, 'the resize and media listeners are released');
	page.window.happyDOM.setViewport({ width: 1000, height: 768 });
	const odd = new ui.Sidebar({ product: 'CDN', cut: -5 }).mount(document.body);
	assert.equal(odd.mode, 'drawer', 'an invalid cut falls back to 1024');
	odd.destroy();
});

test('the drawer slides with the standard motion, which the reduced-motion rule turns off', () => {
	const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
	assert.match(sheet, /\.bui-drawer-panel \{[^}]*animation: bui-slide var\(--motion-standard\) var\(--motion-ease\)/);
	assert.match(sheet, /@media \(prefers-reduced-motion: reduce\) \{\s*:where\(\[class\^='bui-'\]/, 'every bui- element loses its animation under reduced motion');
});
