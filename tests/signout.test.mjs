import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Listeners } from './support/listeners.mjs';
import { annotated, leaving } from './fixtures/family.mjs';

/** Q09 and D48: "Sign out of Beyond" ends the product's session under a bound, then goes to Accounts' /leave. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const visits = [];
after(() => page.close());
beforeEach(() => {
	page.reset();
	page.window.happyDOM.setURL('http://localhost/app/requests?project=prj_shop&dialog=rename&returned=accounts#/r/7');
	visits.length = 0;
	page.window.location.assign = address => visits.push(address);
});

const brand = { src: '/brand/wordmark.svg', href: '/own-home' };
const make = (signout, options = {}) => new ui.FamilyBar({ product: 'delegate', brand, descriptor: leaving, account: { signout }, ...options }).mount(document.body);
const entry = bar => bar.element.querySelector('[data-part="account"] .bui-family-signout');
const open = bar => bar.element.querySelector('[data-part="account"] .bui-navmenu-button');
const left = () => new URL(visits[0]);

test('the entry reads "Sign out of Beyond", last and set apart', () => {
	const bar = make({ end: () => {} });
	const sections = [...bar.element.querySelectorAll('[data-part="account"] .bui-navmenu-section')];
	assert.ok(sections.at(-1).classList.contains('bui-family-leave'));
	assert.equal(entry(bar).textContent, 'Sign out of Beyond');
	assert.equal(entry(bar).tagName, 'BUTTON');
	bar.destroy();
	const spanish = make({ end: () => {} }, { labels: { signout: 'Cerrar sesión en Beyond' } });
	assert.equal(entry(spanish).textContent, 'Cerrar sesión en Beyond');
	spanish.destroy();
});

test('ends the product\'s session, then goes to /leave with the product and the way back', async () => {
	const calls = [];
	const bar = make({ end: async () => calls.push('end') });
	open(bar).click();
	entry(bar).click();
	await page.until(() => visits.length);
	assert.deepEqual(calls, ['end']);
	assert.equal(left().origin + left().pathname, 'https://accounts.example.test/leave');
	assert.equal(left().searchParams.get('product'), 'delegate');
	assert.equal(left().searchParams.get('return'), 'http://localhost/app/requests?project=prj_shop#/r/7', 'without transient parameters, without returned=accounts');
	bar.destroy();
});

test('while it runs the entry says so, keeps the menu open and ignores another press', async () => {
	let finish;
	let calls = 0;
	const bar = make({ end: () => (calls++, new Promise(resolve => (finish = resolve))) });
	open(bar).click();
	entry(bar).click();
	await page.until(() => calls);
	entry(bar).click();
	entry(bar).click();
	assert.equal(calls, 1, 'one press');
	assert.equal(entry(bar).getAttribute('aria-disabled'), 'true');
	assert.equal(entry(bar).textContent, 'Signing out…');
	assert.ok(entry(bar).querySelector('.bui-spinner'));
	assert.equal(open(bar).getAttribute('aria-expanded'), 'true', 'the menu stays open while it works');
	finish();
	await page.until(() => visits.length);
	assert.equal(visits.length, 1);
	bar.destroy();
});

test('a failing end() or one that never answers does not block: /leave ends every product session anyway', async () => {
	const failing = make({ end: async () => {
		throw new Error('session store down');
	} });
	entry(failing).click();
	await page.until(() => visits.length === 1);
	failing.destroy();
	const silent = make({ end: () => new Promise(() => {}), bound: 30 });
	const started = Date.now();
	entry(silent).click();
	await page.until(() => visits.length === 2);
	assert.ok(Date.now() - started >= 25, 'it waited for the bound');
	assert.equal(new URL(visits[1]).pathname, '/leave');
	silent.destroy();
});

test('before() returning false cancels: nothing ends and the person stays', async () => {
	const calls = [];
	let answer = false;
	const bar = make({ before: async () => (calls.push('before'), answer), end: () => calls.push('end') });
	open(bar).click();
	entry(bar).click();
	await page.until(() => calls.length);
	await new Promise(resolve => setTimeout(resolve, 10));
	assert.deepEqual(calls, ['before']);
	assert.deepEqual(visits, []);
	assert.equal(entry(bar).hasAttribute('aria-disabled'), false, 'pressable again');
	assert.equal(entry(bar).textContent, 'Sign out of Beyond');
	answer = true;
	entry(bar).click();
	await page.until(() => visits.length);
	assert.deepEqual(calls, ['before', 'before', 'end']);
	bar.destroy();
});

test('without links.leave: end(), then the product\'s after(); the entry is usable again', async () => {
	const calls = [];
	const bar = make({ end: () => calls.push('end'), after: () => calls.push('after') }, { descriptor: annotated });
	open(bar).click();
	entry(bar).click();
	await page.until(() => calls.length === 2);
	assert.deepEqual(calls, ['end', 'after']);
	assert.deepEqual(visits, [], 'no Accounts address to go to');
	assert.equal(entry(bar).hasAttribute('aria-disabled'), false);
	assert.equal(open(bar).getAttribute('aria-expanded'), 'false', 'the menu closes once it is done');
	bar.destroy();
});

test('while the descriptor is unavailable the product\'s fallback.links.leave is used', async () => {
	const bar = make({ end: () => {} }, { descriptor: { unavailable: true }, fallback: { person: 'Ana Pérez', links: { leave: 'https://accounts.example.test/leave' } } });
	entry(bar).click();
	await page.until(() => visits.length);
	assert.equal(left().searchParams.get('product'), 'delegate');
	bar.destroy();
});

test('the earlier forms still work: a callback and { href }', () => {
	const calls = [];
	const bar = make(() => calls.push('signout'));
	entry(bar).click();
	assert.deepEqual(calls, ['signout']);
	assert.deepEqual(visits, [], 'a callback leaves navigation to the product');
	bar.destroy();
	const link = make({ href: '/signout' });
	assert.equal(entry(link).getAttribute('href'), '/signout');
	link.destroy();
});

test('one sign-out entry in the open menu after closings, a descriptor that arrives later and a bar made again with other options; nothing left registered', async t => {
	// The package's stylesheet floats the panels, so a closing panel leaves a picture of itself
	const style = document.createElement('style');
	style.textContent = '.bui-disclosure-panel { position: absolute; }';
	document.head.append(style);
	const listeners = new Listeners(page.window).install();
	t.after(() => (style.remove(), listeners.uninstall()));
	const own = { label: 'Workspace preferences', run: () => {} };
	const signouts = bar => bar.element.querySelectorAll('.bui-family-signout');
	const opened = bar => {
		if (open(bar).getAttribute('aria-expanded') !== 'true') open(bar).click();
		return signouts(bar);
	};
	let bar = make({ end: () => {} }, { descriptor: null, account: { signout: { end: () => {} }, label: 'Sign out', items: [own] } });
	opened(bar);
	page.key(open(bar), 'Escape');
	opened(bar);
	[...bar.element.querySelectorAll('[data-part="account"] .bui-navmenu-item')].find(node => node.textContent === own.label).click();
	assert.equal(open(bar).getAttribute('aria-expanded'), 'false', 'choosing an entry closes the menu');
	assert.equal(opened(bar).length, 1, 'the open menu holds one sign-out entry, not pictures of earlier closings');
	page.key(open(bar), 'Escape');
	bar.descriptor = leaving;
	assert.equal(opened(bar).length, 1, 'one after the descriptor arrives');
	assert.equal(document.querySelectorAll('.bui-family').length, 1);
	bar.destroy();
	bar = make({ end: () => {} }, { descriptor: leaving, account: { signout: { end: () => {} }, items: [own] } });
	const entries = opened(bar);
	assert.equal(entries.length, 1, 'one in a bar made again with the label changed');
	assert.equal(entries[0].textContent, 'Sign out of Beyond');
	page.key(open(bar), 'Escape');
	bar.destroy();
	assert.equal(document.querySelectorAll('.bui-family-signout').length, 0, 'nothing of either bar is left, pictures included');
	await new Promise(resolve => setTimeout(resolve, 0));
	assert.deepEqual(listeners.present(), [], 'no listener left on the document or the window');
});
