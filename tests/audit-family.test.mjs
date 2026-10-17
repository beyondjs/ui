import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { inside } from './fixtures/family.mjs';

/**
 * The family bar's corrections of 0.15.0: "no context" told apart from "loading" (PKG-14), a product
 * without projects (DQ-19), loading bounded (D40), and Packages among the product names (SNP-16).
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const brand = { src: '/brand/wordmark.svg', href: '/own-home' };
const make = (options = {}) => new ui.FamilyBar({ product: 'packages', brand, account: { signout: () => {} }, ...options }).mount(document.body);
const placeholder = bar => bar.element.querySelector('.bui-family-placeholder');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

test('a product with nothing to load says so: no placeholder, no "Loading where you are", and the product named', () => {
	const bar = make({ descriptor: { context: 'none' }, fallback: { person: 'Ana Pérez' } });
	assert.equal(bar.state, 'none');
	assert.equal(bar.element.dataset.state, 'none');
	assert.equal(placeholder(bar), null, 'no skeleton');
	assert.doesNotMatch(bar.element.textContent, /Loading where you are/);
	assert.equal(bar.element.querySelector('.bui-lockup-name').textContent, 'Packages', 'Packages is a family product (SNP-16)');
	assert.ok(bar.element.querySelector('[data-part="account"]'), 'the account menu works from the fallback');
	bar.descriptor = inside;
	assert.equal(bar.state, 'ready', 'a descriptor arriving draws the place');
	bar.destroy();
});

test('loading is bounded: a descriptor that never comes is drawn as unavailable with the fallback names', async () => {
	const bar = make({ bound: 20, fallback: { organization: 'Northwind', project: 'Storefront' } });
	assert.equal(bar.state, 'loading');
	await wait(40);
	assert.equal(bar.state, 'unavailable', 'every wait ends (D40)');
	assert.match(bar.element.textContent, /Storefront/, 'the names the product knows');
	bar.descriptor = null;
	assert.equal(bar.state, 'loading', 'a new wait starts');
	bar.destroy();
	const unbounded = make({ bound: 0 });
	await wait(30);
	assert.equal(unbounded.state, 'loading', 'bound 0 keeps loading until the product says');
	unbounded.destroy();
	const ended = make({ bound: 10 });
	ended.destroy();
	await wait(30);
	assert.equal(ended.destroyed, true, 'destroying cancels the bound');
});

test('a product without projects shows its organization and never "Choose a project" (Accounts)', () => {
	const bar = make({ product: 'accounts', descriptor: inside, projects: false });
	assert.equal(bar.element.querySelector('[data-part="project"]'), null, 'no project menu');
	assert.equal(bar.element.querySelector('.bui-family-separator'), null, 'no crumb after the organization');
	assert.doesNotMatch(bar.element.textContent, /Choose a project|Storefront/);
	assert.match(bar.element.querySelector('.bui-family-wide').textContent, /Northwind/);
	bar.destroy();
	const fallback = make({ product: 'accounts', descriptor: { unavailable: true }, projects: false, fallback: { organization: 'Northwind', project: 'Storefront' } });
	assert.doesNotMatch(fallback.element.textContent, /Storefront/, 'not even the fallback project');
	fallback.destroy();
});

test('productNames names Packages', () => {
	assert.equal(ui.productNames.packages, 'Packages');
	assert.ok(Object.isFrozen(ui.productNames));
});
