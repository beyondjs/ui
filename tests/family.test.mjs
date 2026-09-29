import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { inside, outside, alone, spanish } from './fixtures/family.mjs';

const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const brand = { src: '/brand/wordmark.svg', href: '/own-home' };
const make = (options = {}) => new ui.FamilyBar({ product: 'delegate', brand, account: { signout: () => {} }, ...options }).mount(document.body);
const menu = (bar, part) => bar.element.querySelector(`.bui-family-wide [data-part="${part}"], .bui-family-brand [data-part="${part}"], .bui-family-end [data-part="${part}"]`);
const button = (bar, part) => menu(bar, part)?.querySelector('.bui-navmenu-button');
// The entries a menu shows; the location's sections the product menu carries are hidden by the package stylesheet.
const entries = (bar, part) => [...menu(bar, part).querySelectorAll('.bui-navmenu-item')].filter(node => !node.closest('.bui-family-carried'));
const texts = nodes => nodes.map(node => node.querySelector('.bui-navmenu-label').textContent);

test('FamilyBar renders the descriptor: the lockup as switcher, the location and the account', () => {
	const bar = make({ descriptor: inside });
	assert.equal(bar.state, 'ready');
	assert.ok(bar.element.classList.contains('bui-header') && bar.element.classList.contains('bui-family'));
	const home = bar.element.querySelector('.bui-header-brand');
	assert.equal(home.getAttribute('href'), inside.links.home);
	assert.equal(home.getAttribute('aria-label'), 'Beyond home');
	assert.equal(home.querySelector('img.bui-lockup-mark').getAttribute('aria-hidden'), 'true');
	assert.equal(button(bar, 'product').getAttribute('aria-label'), 'Product: Delegate. Change product');
	assert.equal(button(bar, 'product').querySelector('.bui-lockup-name').textContent, 'Delegate');
	assert.equal(button(bar, 'organization').getAttribute('aria-label'), 'Organization: Northwind. Change organization');
	assert.equal(button(bar, 'project').getAttribute('aria-label'), 'Project: Storefront. Change project');
	assert.equal(button(bar, 'account').getAttribute('aria-label'), 'Account: Ana Pérez');
	assert.equal(button(bar, 'account').querySelector('.bui-family-avatar').textContent, 'AP');
	assert.equal(bar.element.querySelector('.bui-family-docs').getAttribute('href'), inside.links.docs);
	assert.equal(bar.element.querySelector('.bui-family-thread .bui-family-separator').textContent, '/');
	bar.destroy();
});

test('FamilyBar product menu: entries in order with availability, reasons and the current product', () => {
	const bar = make({ descriptor: inside });
	const items = entries(bar, 'product');
	assert.deepEqual(texts(items), ['Projects', 'Workspace', 'Delegate', 'CDN', 'Snapshots']);
	assert.equal(menu(bar, 'product').querySelector('.bui-navmenu-heading').textContent, 'This project in each product');
	assert.deepEqual(items.map(item => item.querySelector('.bui-navmenu-meta').textContent), ['Project overview', 'This project in Workspace', 'This project in Delegate', 'This project in CDN', 'This project in Snapshots']);
	const [projects, workspace, delegate, cdn, snapshots] = items;
	assert.equal(projects.getAttribute('href'), inside.products[0].url);
	assert.equal(workspace.tagName, 'A', 'an advisory reason with an address stays a link');
	assert.equal(workspace.querySelector('.bui-badge').textContent, 'Not open to you yet');
	assert.ok(workspace.querySelector('.bui-badge-warning'));
	assert.equal(cdn.tagName, 'SPAN', 'no address: not a link');
	assert.equal(cdn.getAttribute('href'), null);
	assert.equal(cdn.getAttribute('tabindex'), '-1');
	assert.equal(cdn.querySelector('.bui-badge').textContent, 'Not set up here');
	assert.equal(snapshots.tagName, 'SPAN', 'a reason that is not advisory is not a link even with an address');
	assert.equal(snapshots.querySelector('.bui-badge').textContent, 'Project archived');
	assert.equal(delegate.getAttribute('aria-current'), 'page');
	assert.deepEqual(items.filter(item => item.hasAttribute('aria-current')), [delegate]);
	bar.destroy();
	const strict = make({ descriptor: inside, advisory: [] });
	assert.equal(entries(strict, 'product')[1].tagName, 'SPAN', 'without advisory reasons every unavailable entry is text');
	strict.destroy();
});

test('FamilyBar outside a project: products of the organization, no project menu', () => {
	const bar = make({ product: 'cdn', descriptor: outside });
	assert.equal(menu(bar, 'project'), null);
	assert.equal(bar.element.querySelector('.bui-family-wide .bui-family-separator'), null);
	assert.equal(menu(bar, 'product').querySelector('.bui-navmenu-heading').textContent, 'Products');
	const items = entries(bar, 'product');
	assert.deepEqual(items.map(item => item.querySelector('.bui-navmenu-meta').textContent), ['Projects of this organization', 'Delegated projects', 'Applications', 'Members and invitations']);
	assert.equal(items[2].getAttribute('aria-current'), 'page');
	assert.equal(bar.element.querySelector('.bui-family-docs'), null, 'no docs address, no Docs link');
	bar.destroy();
});

test('FamilyBar location menus: current markers, roles and destinations', () => {
	const bar = make({ descriptor: inside });
	const organizations = entries(bar, 'organization');
	assert.deepEqual(texts(organizations), ['Northwind', 'Southwind']);
	assert.equal(organizations[0].getAttribute('aria-current'), 'true');
	assert.equal(organizations[1].getAttribute('aria-current'), null);
	assert.deepEqual(organizations.map(item => item.querySelector('.bui-navmenu-meta').textContent), ['Owner', 'Developer']);
	assert.equal(organizations[1].getAttribute('href'), 'http://localhost/projects/?organization=org_south');
	const projects = entries(bar, 'project');
	assert.deepEqual(texts(projects), ['Storefront', 'Handbook', 'All projects']);
	assert.equal(projects[0].getAttribute('aria-current'), 'true');
	assert.equal(projects[1].getAttribute('href'), 'https://delegate.example.test/?project=prj_docs', 'the current product keeps the project choice');
	assert.equal(projects[2].getAttribute('href'), 'http://localhost/projects/?organization=org_north');
	assert.equal(menu(bar, 'project').querySelector('.bui-navmenu-heading').textContent, 'Projects of Northwind');
	bar.destroy();
	const accounts = make({ product: 'accounts', descriptor: inside });
	assert.equal(entries(accounts, 'project')[1].getAttribute('href'), 'http://localhost/projects/?project=prj_docs', 'a product without an entry goes to Projects');
	accounts.destroy();
	const workspace = make({ product: 'workspace', descriptor: inside, advisory: [] });
	assert.equal(entries(workspace, 'project')[1].getAttribute('href'), 'http://localhost/projects/?project=prj_docs', 'an entry that is not open goes to Projects');
	workspace.destroy();
});

test('FamilyBar narrow location: one menu named by the place with both sections', () => {
	const bar = make({ descriptor: inside });
	const narrow = bar.element.querySelector('.bui-family-narrow [data-part="location"]');
	assert.ok(narrow);
	const trigger = narrow.querySelector('.bui-navmenu-button');
	assert.equal(trigger.getAttribute('aria-label'), 'Location: Northwind / Storefront. Change organization or project');
	assert.equal(trigger.querySelector('.bui-family-place').textContent, 'Storefront');
	assert.deepEqual([...narrow.querySelectorAll('.bui-navmenu-heading')].map(node => node.textContent), ['Organizations', 'Projects of Northwind']);
	bar.destroy();
	const org = make({ descriptor: outside });
	const place = org.element.querySelector('.bui-family-narrow [data-part="location"] .bui-navmenu-button');
	assert.equal(place.querySelector('.bui-family-place').textContent, 'Northwind');
	assert.equal(org.element.querySelectorAll('.bui-family-narrow .bui-navmenu-heading').length, 1);
	org.destroy();
});

test('FamilyBar while loading: lockup and placeholders, no location menus, one Projects link, sign out kept', () => {
	const bar = make({ descriptor: null });
	assert.equal(bar.state, 'loading');
	assert.equal(bar.element.dataset.state, 'loading');
	assert.equal(bar.element.querySelector('.bui-header-brand').getAttribute('href'), '/own-home');
	assert.equal(button(bar, 'product').querySelector('.bui-lockup-name').textContent, 'Delegate');
	assert.equal(bar.element.querySelectorAll('.bui-family-thread .bui-navmenu').length, 0);
	assert.ok(bar.element.querySelector('.bui-family-wide .bui-family-placeholder'));
	assert.equal(bar.element.querySelector('.bui-family-wide .bui-hidden').textContent, 'Loading where you are');
	const items = entries(bar, 'product');
	assert.deepEqual(texts(items), ['Projects']);
	assert.equal(items[0].getAttribute('href'), '/own-home');
	assert.equal(button(bar, 'account').getAttribute('aria-label'), 'Account');
	assert.ok(menu(bar, 'account').querySelector('.bui-family-signout'));
	bar.destroy();
});

test('FamilyBar unavailable: the fallback names say where you are, without menus', () => {
	const bar = make({ descriptor: { unavailable: true }, fallback: { person: 'Ana Pérez', organization: 'Northwind', project: 'Storefront' } });
	assert.equal(bar.state, 'unavailable');
	assert.deepEqual([...bar.element.querySelectorAll('.bui-family-wide .bui-family-static')].map(node => node.textContent), ['Northwind', 'Storefront']);
	// As text the names keep the width rules of the menus they stand for (shared width, organization capped).
	assert.deepEqual([...bar.element.querySelectorAll('.bui-family-wide .bui-family-static')].map(node => node.classList.contains('bui-family-organization') ? 'organization' : node.classList.contains('bui-family-project') ? 'project' : null), ['organization', 'project']);
	assert.equal(bar.element.querySelector('.bui-family-narrow .bui-family-static').textContent, 'Storefront');
	assert.equal(bar.element.querySelectorAll('.bui-family-thread .bui-navmenu').length, 0);
	assert.equal(bar.element.querySelector('.bui-family-placeholder'), null);
	assert.deepEqual(texts(entries(bar, 'product')), ['Projects']);
	assert.equal(button(bar, 'account').getAttribute('aria-label'), 'Account: Ana Pérez');
	bar.fallback = { organization: 'Southwind' };
	assert.deepEqual([...bar.element.querySelectorAll('.bui-family-wide .bui-family-static')].map(node => node.textContent), ['Southwind']);
	bar.destroy();
});

test('FamilyBar fallback links: home, account and docs while unavailable or loading; the descriptor\'s win; no divider with no place', () => {
	const links = { home: '/projects/', account: '/accounts/account', members: '/accounts/members', docs: '/docs/' };
	const bar = make({ descriptor: { unavailable: true }, fallback: { person: 'Ana Pérez', links } });
	const hrefs = () => entries(bar, 'account').map(node => [node.textContent.trim(), node.getAttribute('href')]);
	assert.equal(bar.element.querySelector('.bui-header-brand').getAttribute('href'), '/projects/');
	assert.equal(entries(bar, 'product')[0].getAttribute('href'), '/projects/', 'the one Projects entry goes to the fallback home');
	assert.deepEqual(hrefs().filter(([, href]) => href), [['Your account', '/accounts/account'], ['Docs', '/docs/']], 'members only with an organization in view');
	assert.equal(bar.element.querySelector('.bui-family-docs').getAttribute('href'), '/docs/');
	// Unavailable with no organization or project: nothing after the product name, not even a divider.
	assert.equal(bar.element.querySelector('.bui-family-divider'), null);
	assert.equal(bar.element.querySelector('.bui-family-thread .bui-family-static, .bui-family-thread .bui-family-separator'), null);
	// Only a project: shown without a separator before it.
	bar.fallback = { project: 'Storefront', links };
	assert.ok(bar.element.querySelector('.bui-family-divider'));
	assert.equal(bar.element.querySelector('.bui-family-wide').textContent, 'Storefront');
	// Loading keeps its placeholder and divider, and the fallback addresses.
	bar.descriptor = null;
	bar.fallback = { links };
	assert.ok(bar.element.querySelector('.bui-family-divider') && bar.element.querySelector('.bui-family-placeholder'));
	assert.ok(hrefs().some(([label, href]) => label === 'Your account' && href === '/accounts/account'));
	// Ready: the descriptor's addresses win, and a key it lacks still comes from the fallback.
	bar.descriptor = { ...inside, links: { home: inside.links.home, account: inside.links.account } };
	assert.equal(bar.element.querySelector('.bui-header-brand').getAttribute('href'), inside.links.home);
	assert.ok(hrefs().some(([label, href]) => label === 'Your account' && href === inside.links.account));
	assert.equal(bar.element.querySelector('.bui-family-docs').getAttribute('href'), '/docs/');
	bar.destroy();
});

test('FamilyBar without fallback links keeps the brand address and offers no account link while unavailable', () => {
	const bar = make({ descriptor: { unavailable: true }, fallback: { person: 'Ana Pérez', links: { account: '', home: null } } });
	assert.equal(bar.element.querySelector('.bui-header-brand').getAttribute('href'), '/own-home');
	assert.equal(entries(bar, 'account').filter(node => node.getAttribute('href')).length, 0);
	assert.equal(bar.element.querySelector('.bui-family-docs'), null);
	bar.destroy();
});

test('FamilyBar account menu: person, account links, product entries, docs and sign out', async () => {
	const calls = [];
	const bar = make({ descriptor: inside, account: { signout: () => calls.push('signout'), items: [{ label: 'Delegate settings', href: '/settings' }, { label: 'Keyboard shortcuts', run: () => calls.push('keys') }] } });
	const account = menu(bar, 'account');
	assert.equal(account.querySelector('.bui-family-name').textContent, 'Ana Pérez');
	assert.equal(account.querySelector('.bui-family-email').textContent, 'ana@example.test');
	assert.deepEqual(texts(entries(bar, 'account')), ['Your account', 'Members of this organization', 'Delegate settings', 'Keyboard shortcuts', 'Docs', 'Sign out']);
	assert.equal(account.querySelector('.bui-family-docs-item').getAttribute('href'), inside.links.docs);
	account.querySelector('.bui-navmenu-button').click();
	[...account.querySelectorAll('button.bui-navmenu-item')].find(node => node.textContent === 'Keyboard shortcuts').click();
	assert.equal(bar.element.querySelector('[data-part="account"] .bui-navmenu-button').getAttribute('aria-expanded'), 'false', 'choosing closes the menu');
	account.querySelector('.bui-family-signout').click();
	assert.deepEqual(calls, ['keys', 'signout']);
	bar.destroy();
	const leave = make({ descriptor: alone, account: { signout: { href: '/signout' }, label: 'Sign out…' } });
	const out = menu(leave, 'account').querySelector('.bui-family-signout');
	assert.equal(out.getAttribute('href'), '/signout');
	assert.equal(out.textContent, 'Sign out…');
	assert.deepEqual(texts(entries(leave, 'account')), ['Sign out…'], 'no organization: no members link');
	assert.equal(leave.element.querySelectorAll('.bui-family-thread .bui-navmenu').length, 0);
	leave.destroy();
});

test('FamilyBar labels: Spanish copy replaces the English defaults; product names stay', () => {
	const bar = make({ descriptor: inside, labels: spanish, products: { delegate: 'Delegate' } });
	assert.equal(bar.element.querySelector('.bui-header-brand').getAttribute('aria-label'), 'Inicio de Beyond');
	assert.equal(button(bar, 'product').getAttribute('aria-label'), 'Producto: Delegate. Cambiar de producto');
	assert.equal(button(bar, 'organization').getAttribute('aria-label'), 'Organización: Northwind. Cambiar de organización');
	assert.equal(button(bar, 'project').getAttribute('aria-label'), 'Proyecto: Storefront. Cambiar de proyecto');
	assert.equal(entries(bar, 'product')[1].querySelector('.bui-badge').textContent, 'Aún no está abierto para ti');
	assert.equal(menu(bar, 'account').querySelector('.bui-family-signout').textContent, 'Cerrar sesión');
	bar.destroy();
});

test('FamilyBar keyboard: a menu opens on its first entry, arrows move, Escape returns focus', t => {
	// The package stylesheet's rule hiding the carried location sections (happy-dom loads no stylesheet).
	const style = document.head.appendChild(Object.assign(document.createElement('style'), { textContent: '.bui-family-carried { display: none; }' }));
	t.after(() => style.remove());
	const bar = make({ descriptor: inside });
	const trigger = button(bar, 'product');
	trigger.focus();
	trigger.click();
	assert.equal(trigger.getAttribute('aria-expanded'), 'true');
	const items = entries(bar, 'product');
	assert.ok(document.activeElement === items[0], 'focus on the first entry');
	page.key(document.activeElement, 'ArrowDown');
	assert.ok(document.activeElement === items[1]);
	page.key(document.activeElement, 'End');
	assert.ok(document.activeElement === items[4], 'an unavailable entry is reachable');
	page.key(document.activeElement, 'ArrowDown');
	assert.ok(document.activeElement === items[0], 'wraps');
	page.key(document.activeElement, 'Escape');
	assert.equal(trigger.getAttribute('aria-expanded'), 'false');
	assert.ok(document.activeElement === trigger, 'focus returns to the button');
	bar.destroy();
});

test('FamilyBar product menu carries the location\'s sections for the touch fold, apart from its own entries', () => {
	const bar = make({ descriptor: inside });
	const carried = [...menu(bar, 'product').querySelectorAll('.bui-family-carried')];
	assert.equal(carried.length, 2, 'organizations and projects');
	const hrefs = carried.map(section => [...section.querySelectorAll('a.bui-navmenu-item')].map(node => node.getAttribute('href')));
	const location = [...bar.element.querySelectorAll('.bui-family-narrow .bui-navmenu-item')].map(node => node.getAttribute('href')).filter(Boolean);
	assert.deepEqual(hrefs.flat(), location, 'the same entries as the location menu');
	bar.descriptor = { ...inside, project: null };
	assert.equal(menu(bar, 'product').querySelectorAll('.bui-family-carried').length, 1, 'outside a project: organizations only');
	bar.descriptor = { unavailable: true };
	assert.equal(menu(bar, 'product').querySelectorAll('.bui-family-carried').length, 0, 'nothing to carry without a descriptor');
	bar.destroy();
});

test('FamilyBar descriptor setter redraws and keeps focus on the same part', () => {
	const bar = make({ descriptor: null });
	button(bar, 'product').focus();
	bar.descriptor = inside;
	assert.equal(bar.state, 'ready');
	assert.ok(document.activeElement === button(bar, 'product'), 'focus stays on the switcher');
	assert.equal(bar.element.querySelectorAll('[data-part="product"]').length, 1, 'the old switcher is gone');
	bar.descriptor = { unavailable: true };
	assert.equal(bar.state, 'unavailable');
	bar.descriptor = undefined;
	assert.equal(bar.state, 'loading');
	bar.destroy();
});

test('FamilyBar onnavigate takes over plain clicks on same-origin links only', () => {
	const seen = [];
	const bar = make({ descriptor: inside, onnavigate: (item, event) => seen.push([item.href, event.defaultPrevented]) });
	const click = (node, options = {}) => node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...options }));
	// Clicks the bar leaves alone would navigate the test page, so a listener on the document stops them there.
	const stop = event => event.preventDefault();
	document.addEventListener('click', stop);
	click(bar.element.querySelector('.bui-header-brand'));
	click(entries(bar, 'product')[2]);
	click(entries(bar, 'organization')[1]);
	click(bar.element.querySelector('.bui-header-brand'), { metaKey: true });
	document.removeEventListener('click', stop);
	assert.deepEqual(seen, [[inside.links.home, true], [entries(bar, 'organization')[1].getAttribute('href'), true]]);
	bar.destroy();
});

test('FamilyBar toggle passes through and destroy releases everything', () => {
	const changes = [];
	const bar = make({ descriptor: inside, toggle: { controls: 'sidebar', expanded: false, onchange: value => changes.push(value) } });
	const toggle = bar.element.querySelector('.bui-header-toggle');
	assert.equal(toggle.getAttribute('aria-controls'), 'sidebar');
	toggle.click();
	assert.deepEqual(changes, [true]);
	assert.equal(bar.expanded, true);
	button(bar, 'organization').click();
	bar.destroy();
	assert.equal(document.querySelector('.bui-family'), null);
	assert.equal(bar.destroyed, true);
});
