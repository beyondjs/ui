import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { inside, outside } from './fixtures/family.mjs';

/** 0.17.1 (D95): the family bar keeps the menu a person has open when its descriptor, fallback or notice changes, and draws nothing new for the same data. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const { Same } = await import('../src/dom/core/same.js');
after(() => page.close());
beforeEach(() => page.reset());

const brand = { src: '/brand/wordmark.svg', href: '/' };
const bar = (options = {}) => new ui.FamilyBar({ product: 'delegate', brand, descriptor: inside, ...options }).mount(document.body);
const open = name => document.querySelector(`[data-part="${name}"] > .bui-navmenu-button[aria-expanded="true"]`);
const panel = name => document.querySelector(`[data-part="${name}"] > .bui-navmenu-panel`);

test('a new descriptor keeps the open project menu open, with its new contents and focus on the same entry', () => {
	const family = bar();
	const trigger = document.querySelector('[data-part="project"] > .bui-navmenu-button');
	page.key(trigger, 'Enter');
	trigger.click();
	assert.ok(open('project'), 'the project menu is open');
	const handbook = [...panel('project').querySelectorAll('.bui-navmenu-item')].find(node => node.textContent.includes('Handbook'));
	handbook.focus();
	const before = panel('project');
	family.descriptor = { ...inside, projects: [...inside.projects, { id: 'prj_lab', name: 'Laboratory', current: false }] };
	assert.notEqual(panel('project'), before, 'the menu is drawn from the new descriptor');
	assert.ok(open('project'), 'and is still open');
	assert.equal(panel('project').hidden, false);
	assert.ok([...panel('project').querySelectorAll('.bui-navmenu-item')].some(node => node.textContent.includes('Laboratory')), 'with the new contents');
	assert.ok(document.activeElement.textContent.includes('Handbook'), 'focus stays on the same entry');
	assert.equal(document.querySelectorAll('[data-part] > .bui-navmenu-button[aria-expanded="true"]').length, 1, 'one menu open');
	page.key(document.activeElement, 'Escape');
	assert.equal(open('project'), null, 'Escape closes it as usual');
	assert.equal(document.activeElement, document.querySelector('[data-part="project"] > .bui-navmenu-button'), 'and returns focus to its button');
	family.destroy();
});

test('a menu opened with a pointer stays on its panel; a menu whose entry left keeps focus in its place; the search typed is applied again', () => {
	const many = { ...inside, projects: Array.from({ length: 12 }, (_, index) => ({ id: `prj_${index}`, name: `Project ${index}`, current: index === 0 })), project: { id: 'prj_0', name: 'Project 0' } };
	const family = bar({ descriptor: many });
	const account = document.querySelector('[data-part="account"] > .bui-navmenu-button');
	account.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
	account.click();
	assert.equal(document.activeElement, panel('account'));
	family.notice = { text: 'Delegate is not set up in this project.' };
	assert.ok(open('account'), 'the account menu stays open across a notice');
	assert.equal(document.activeElement, panel('account'), 'focus stays on its panel');
	page.key(panel('account'), 'Escape');
	const project = document.querySelector('[data-part="project"] > .bui-navmenu-button');
	page.key(project, 'Enter');
	project.click();
	const field = panel('project').querySelector('.bui-navmenu-field');
	assert.ok(field, 'a long list has its search field');
	field.focus();
	field.value = 'project 1';
	field.dispatchEvent(new Event('input', { bubbles: true }));
	const shown = () => [...panel('project').querySelectorAll('li')].filter(node => !node.hidden && node.querySelector('.bui-navmenu-item')).length;
	const filtered = shown();
	family.descriptor = { ...many, person: { ...many.person, name: 'Ana P.' } };
	assert.ok(open('project'));
	assert.equal(panel('project').querySelector('.bui-navmenu-field').value, 'project 1', 'what was typed is kept');
	assert.equal(shown(), filtered, 'and applied');
	assert.equal(document.activeElement, panel('project').querySelector('.bui-navmenu-field'), 'focus stays in the field');
	const second = [...panel('project').querySelectorAll('.bui-navmenu-item')].filter(node => !node.closest('[hidden]'))[1];
	second.focus();
	family.descriptor = { ...many, projects: many.projects.filter(item => item.name !== second.textContent.trim()) };
	assert.ok(open('project'));
	assert.ok(panel('project').contains(document.activeElement) && document.activeElement !== document.body, 'an entry that left gives focus to the one now in its place');
	family.destroy();
});

test('focus that is not in the open menu is not taken, and a menu no longer drawn is not opened again', async () => {
	const family = bar();
	const organization = document.querySelector('[data-part="organization"] > .bui-navmenu-button');
	organization.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
	organization.click();
	assert.ok(open('organization'));
	// A press on the panel's text leaves focus on the page; the menu stays open
	document.activeElement.blur();
	await new Promise(resolve => setTimeout(resolve, 5));
	assert.ok(open('organization'));
	assert.equal(document.activeElement, document.body);
	family.descriptor = { ...inside, person: { ...inside.person, name: 'Ana P.' } };
	assert.ok(open('organization'), 'still open');
	assert.equal(document.activeElement, document.body, 'focus not taken');
	family.descriptor = { ...outside, organizations: [inside.organizations[0]] };
	assert.equal(open('organization'), null, 'one organization: no menu to keep open');
	assert.equal(document.activeElement, document.body);
	family.destroy();
});

test('the same data draws nothing new; data changed in place and set again is drawn', () => {
	const fallback = { organization: 'Northwind', project: 'Storefront' };
	const family = bar({ descriptor: null, fallback });
	const location = document.querySelector('.bui-family-location');
	family.fallback = { ...fallback };
	family.notice = null;
	family.descriptor = null;
	assert.equal(document.querySelector('.bui-family-location'), location, 'the same fallback, notice and descriptor draw nothing new');
	const descriptor = structuredClone(inside);
	family.descriptor = descriptor;
	const drawn = document.querySelector('.bui-family-location');
	assert.notEqual(drawn, location);
	family.descriptor = structuredClone(inside);
	assert.equal(document.querySelector('.bui-family-location'), drawn, 'an equal descriptor draws nothing new');
	descriptor.project.name = 'Shopfront';
	family.descriptor = descriptor;
	assert.match(document.querySelector('.bui-family-project .bui-family-place').textContent, /Shopfront/, 'a descriptor changed in place is heard');
	const run = () => {};
	family.notice = { text: 'Not set up', action: { label: 'Set up', run } };
	const noticed = document.querySelector('.bui-family-location');
	family.notice = { text: 'Not set up', action: { label: 'Set up', run } };
	assert.equal(document.querySelector('.bui-family-location'), noticed, 'the same action function: nothing new');
	family.notice = { text: 'Not set up', action: { label: 'Set up', run: () => {} } };
	assert.notEqual(document.querySelector('.bui-family-location'), noticed, 'another function is another notice');
	family.destroy();
});

test('Same compares plain data by content and anything else by identity', () => {
	const same = new Same();
	const node = document.createElement('div');
	assert.equal(same.keep({ a: [1, { b: 'x' }], node }), false, 'nothing kept yet');
	assert.equal(same.keep({ a: [1, { b: 'x' }], node }), true);
	assert.equal(same.keep({ a: [1, { b: 'y' }], node }), false);
	assert.equal(same.keep({ a: [1, { b: 'y' }], node: document.createElement('div') }), false, 'another node');
	assert.equal(Same.equal([1, 2], [1, 2, 3]), false);
	assert.equal(Same.equal({ a: 1 }, { a: 1, b: undefined }), false);
	assert.equal(Same.equal(NaN, NaN), true);
	same.clear();
	assert.equal(same.keep(1), false, 'cleared');
});

test('React FamilyBar applies a new brand address, account label or entry in place, keeping the open menu; equal values draw nothing new', async () => {
	const react = await import('@beyond-js/ui/react');
	const { default: React } = await import('react');
	const { createRoot } = await import('react-dom/client');
	const h = React.createElement;
	const host = document.body.appendChild(document.createElement('div'));
	const root = createRoot(host);
	const draw = ({ href = '/', label = 'Account', entry = '/settings' } = {}) => React.act(() => root.render(h(react.FamilyBar, { product: 'delegate', brand: { src: '/brand/wordmark.svg', href }, descriptor: inside, account: { label, signout: () => {}, items: [{ label: 'Settings', href: entry }] } })));
	await draw();
	const element = host.querySelector('.bui-family');
	const account = host.querySelector('[data-part="account"] > .bui-navmenu-button');
	page.key(account, 'Enter');
	account.click();
	const settings = [...panel('account').querySelectorAll('.bui-navmenu-item')].find(node => node.textContent.includes('Settings'));
	settings.focus();
	const drawn = panel('account');
	await draw();
	assert.equal(panel('account'), drawn, 'equal values draw nothing new');
	await draw({ href: '/home/', label: 'Your account', entry: '/settings/profile' });
	assert.equal(host.querySelector('.bui-family'), element, 'the same bar, not a new one');
	assert.notEqual(panel('account'), drawn, 'drawn again with the new values');
	assert.ok(open('account'), 'the account menu stays open');
	assert.equal(document.activeElement.getAttribute('href'), '/settings/profile', 'focus on the same entry, at its new address');
	assert.equal(host.querySelector('.bui-header-brand').getAttribute('href'), inside.links.home);
	await React.act(() => root.unmount());
});
