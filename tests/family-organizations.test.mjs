import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { outside } from './fixtures/family.mjs';

/**
 * The family bar's organization menu telling organizations apart (D195, 0.40.0): a mark on every row
 * once one organization has a logo, and the short name of a name two organizations share.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const brand = { src: '/brand/wordmark.svg', href: '/own-home' };
const make = (options = {}) => new ui.FamilyBar({ product: 'delegate', brand, account: { signout: () => {} }, ...options }).mount(document.body);
const rows = bar => [...bar.element.querySelectorAll('.bui-family-wide [data-part="organization"] .bui-navmenu-item')];
const metas = bar => rows(bar).map(row => row.querySelector('.bui-navmenu-meta')?.textContent ?? null);
const with3 = organizations => ({ ...outside, organizations, organization: { id: organizations[0].id, name: organizations[0].name, role: organizations[0].role } });

const logo = 'https://accounts.example.test/v1/logos/k1';
const three = [
	{ id: 'org_a', name: 'Tienda Willy', role: 'owner', current: true, slug: 'tienda-willy', url: 'https://delegate.example.test/?organization=org_a' },
	{ id: 'org_b', name: 'tienda willy ', role: 'developer', slug: 'tienda-willy-2', url: 'https://delegate.example.test/?organization=org_b' },
	{ id: 'org_c', name: 'Northwind', role: 'admin', slug: 'northwind', url: 'https://delegate.example.test/?organization=org_c' }
];

test('a name two organizations share is told apart by its short name; other names stand alone', () => {
	const bar = make({ descriptor: with3(three) });
	assert.deepEqual(metas(bar), ['tienda-willy · Owner', 'tienda-willy-2 · Developer', 'Administrator'], 'shared names ignore case and outer spaces');
	assert.equal(bar.element.querySelector('.bui-organization-mark'), null, 'no logo anywhere: no marks');
	bar.destroy();
});

test('a shared name without a short name keeps its role alone, and a row opening Projects says so after it', () => {
	const organizations = [
		{ ...three[0], url: undefined },
		{ ...three[1], slug: undefined, url: undefined }
	];
	const bar = make({ descriptor: with3(organizations) });
	assert.deepEqual(metas(bar), ['tienda-willy · Owner · Opens in Beyond Projects', 'Developer · Opens in Beyond Projects']);
	bar.destroy();
});

test('one logo gives every row its mark: the logo over its initial, the initial alone elsewhere', () => {
	const bar = make({ descriptor: with3([{ ...three[0], logo }, three[1], three[2]]) });
	const marks = rows(bar).map(row => row.firstElementChild);
	assert.ok(marks.every(mark => mark.classList.contains('bui-organization-mark')), 'every row starts with a mark');
	assert.deepEqual(marks.map(mark => mark.firstChild.textContent), ['T', 'T', 'N'], 'the initial of each name, upper case');
	assert.ok(marks.every(mark => mark.getAttribute('aria-hidden') === 'true'), 'marks stay out of the rows’ names');
	const image = marks[0].querySelector('img');
	assert.equal(image.getAttribute('src'), logo);
	assert.equal(image.getAttribute('alt'), '');
	assert.equal(image.getAttribute('referrerpolicy'), 'no-referrer');
	assert.equal(marks[1].querySelector('img'), null);
	image.dispatchEvent(new page.window.Event('load'));
	assert.ok(marks[0].hasAttribute('data-picture'), 'a loaded logo marks its square');
	bar.destroy();
});

test('a logo that fails is removed, so the initial remains', () => {
	const bar = make({ descriptor: with3([{ ...three[0], logo }, three[2]]) });
	const mark = rows(bar)[0].firstElementChild;
	mark.querySelector('img').dispatchEvent(new page.window.Event('error'));
	assert.equal(mark.querySelector('img'), null);
	assert.equal(mark.textContent, 'T');
	assert.equal(mark.hasAttribute('data-picture'), false);
	bar.destroy();
});

test('only addresses the bar shows count as logos: https, an image as data, http on a loopback host', () => {
	const shown = address => {
		const bar = make({ descriptor: with3([{ ...three[0], logo: address }, three[2]]) });
		const found = rows(bar)[0].querySelector('.bui-organization-mark img')?.getAttribute('src') ?? null;
		bar.destroy();
		return found;
	};
	assert.equal(shown('data:image/png;base64,iVBORw0KGgo='), 'data:image/png;base64,iVBORw0KGgo=');
	assert.equal(shown('http://accounts.beyond.localhost:5190/v1/logos/k1'), 'http://accounts.beyond.localhost:5190/v1/logos/k1', 'local development serves logos over http');
	for (const refused of ['http://accounts.example.test/v1/logos/k1', 'javascript:alert(1)', 'data:text/html,hi', 'ftp://example.test/logo.png', 'not an address', '']) {
		const bar = make({ descriptor: with3([{ ...three[0], logo: refused }, three[2]]) });
		assert.equal(bar.element.querySelector('.bui-organization-mark'), null, `${refused}: no logo, so no marks`);
		bar.destroy();
	}
});

test('the product’s own organizations, without a descriptor, are told apart the same way', () => {
	const fallback = { person: 'Ana Pérez', organization: 'Tienda Willy', organizations: [{ ...three[0], logo }, three[1]] };
	const bar = make({ descriptor: { unavailable: true }, fallback });
	const found = [...bar.element.querySelectorAll('.bui-family-wide .bui-navmenu-item')].filter(row => /tienda willy/i.test(row.querySelector('.bui-navmenu-label').textContent));
	assert.deepEqual(found.map(row => row.querySelector('.bui-navmenu-meta').textContent), ['tienda-willy · Owner', 'tienda-willy-2 · Developer']);
	assert.ok(found.every(row => row.firstElementChild.classList.contains('bui-organization-mark')));
	bar.destroy();
});

test('React draws the same mark as the DOM, and drops a logo that fails', async () => {
	globalThis.IS_REACT_ACT_ENVIRONMENT = true;
	const { default: React } = await import('react');
	const { createRoot } = await import('react-dom/client');
	const react = await import('@beyond-js/ui/react');
	const host = document.createElement('div');
	document.body.append(host);
	const root = createRoot(host);
	const shape = node => (node.nodeType === 3 ? node.textContent : { tag: node.tagName, attributes: [...node.attributes].map(({ name, value }) => `${name}=${value}`).sort(), children: [...node.childNodes].map(shape) });
	await React.act(() => root.render(React.createElement(react.OrganizationMark, { name: 'tienda willy', logo })));
	assert.deepEqual(shape(host.firstElementChild), shape(new ui.OrganizationMark({ name: 'tienda willy', picture: logo }).element));
	await React.act(() => host.querySelector('img').dispatchEvent(new page.window.Event('error')));
	assert.equal(host.querySelector('img'), null, 'a logo that fails is removed');
	assert.equal(host.textContent, 'T');
	await React.act(() => root.render(React.createElement(react.OrganizationMark, { name: 'Northwind', logo: 'javascript:alert(1)' })));
	assert.deepEqual(shape(host.firstElementChild), shape(new ui.OrganizationMark({ name: 'Northwind' }).element), 'an address the bar does not show is no logo');
	await React.act(() => root.unmount());
});
