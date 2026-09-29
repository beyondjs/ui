import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** The family patterns of 0.2.0 besides the bar: ProductNav, Unavailable, a confirmation's consequence and the availability vocabulary. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

test('ProductNav: tabs with the current one marked, named, optionally sticky, onnavigate on plain clicks', () => {
	const seen = [];
	const nav = new ui.ProductNav({ label: 'Delegate', items: [{ label: 'Requests', href: '/requests', current: true }, { label: 'Versions', href: '/versions' }, null], onnavigate: item => seen.push(item.href) }).mount(document.body);
	assert.equal(nav.element.tagName, 'NAV');
	assert.equal(nav.element.getAttribute('aria-label'), 'Delegate');
	assert.equal(nav.element.classList.contains('bui-productnav-sticky'), false);
	const links = [...nav.element.querySelectorAll('a')];
	assert.deepEqual(links.map(link => [link.textContent, link.getAttribute('aria-current')]), [['Requests', 'page'], ['Versions', null]]);
	links[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
	assert.deepEqual(seen, ['/versions']);
	nav.items = [{ label: 'Requests', href: '/requests' }, { label: 'Versions', href: '/versions', current: true }];
	assert.equal(nav.element.querySelector('[aria-current]').textContent, 'Versions');
	nav.destroy();
	assert.equal(document.querySelector('.bui-productnav'), null);
	const sticky = new ui.ProductNav({ items: [], sticky: true, labels: { nav: 'Producto' } });
	assert.ok(sticky.element.classList.contains('bui-productnav-sticky'));
	assert.equal(sticky.element.getAttribute('aria-label'), 'Producto');
});

test('Unavailable: title, reason, who can change it, code and actions, with the icon of its kind', () => {
	const action = new ui.Button({ label: 'Ask for access', variant: 'primary' }).element;
	const view = new ui.Unavailable({ title: 'Workspace is not open to you yet', reason: 'Development environments open by invitation.', owner: 'An owner of Northwind', action, code: 'NOT_ADMITTED' }).mount(document.body);
	const section = view.element;
	assert.equal(section.tagName, 'SECTION');
	assert.equal(section.dataset.unavailable, 'access');
	const heading = section.querySelector('h2.bui-unavailable-title');
	assert.equal(section.getAttribute('aria-labelledby'), heading.id);
	assert.equal(heading.textContent, 'Workspace is not open to you yet');
	assert.equal(section.querySelector('.bui-unavailable-reason').textContent, 'Development environments open by invitation.');
	assert.equal(section.querySelector('.bui-unavailable-owner').textContent, 'Who can change this: An owner of Northwind');
	assert.equal(section.querySelector('.bui-unavailable-code .bui-badge-neutral').textContent, 'NOT_ADMITTED');
	assert.ok(section.querySelector('.bui-unavailable-actions').firstChild === action);
	assert.equal(section.querySelector('.bui-unavailable-icon svg path').getAttribute('d'), ui.icon('lock').querySelector('path').getAttribute('d'));
	assert.equal(section.querySelector('.bui-callout-danger, .bui-badge-danger'), null, 'never a failure tone');
	view.destroy();
	assert.equal(document.querySelector('.bui-unavailable'), null);
});

test('Unavailable: kinds, heading level, labels and the optional parts left out', () => {
	const plug = new ui.Unavailable({ title: 'No repository', reason: 'This project has no repository yet.', kind: 'association', level: 3, labels: { owner: 'Quién puede cambiarlo: ' }, owner: 'Ana' });
	assert.ok(plug.element.classList.contains('bui-unavailable-association'));
	assert.ok(plug.element.querySelector('h3.bui-unavailable-title'));
	assert.equal(plug.element.querySelector('.bui-unavailable-label').textContent, 'Quién puede cambiarlo: ');
	const bare = new ui.Unavailable({ title: 'Not in this plan', reason: 'Exports need another plan.', kind: 'capability', level: 9 });
	assert.equal(bare.element.dataset.unavailable, 'capability');
	assert.ok(bare.element.querySelector('h2'), 'an invalid level falls back to 2');
	assert.equal(bare.element.querySelector('.bui-unavailable-owner, .bui-unavailable-code, .bui-unavailable-actions'), null);
	const unknown = new ui.Unavailable({ title: 'x', reason: 'y', kind: 'other' });
	assert.equal(unknown.element.dataset.unavailable, 'access', 'an unknown kind is access');
});

test('confirm with a consequence: what is lost, kept and how to undo, under the message, localizable', async () => {
	const asked = ui.confirm({
		title: 'Delete Storefront?',
		message: 'The project and its entries are deleted.',
		accept: 'Delete project',
		tone: 'danger',
		consequence: { lost: ['Its entries in each product', 'Its repositories'], kept: 'The products’ own records', recovery: 'Deletion cannot be undone.' },
		labels: { lost: 'Se pierde' }
	});
	const dialog = document.querySelector('dialog');
	const list = dialog.querySelector('dl.bui-consequence');
	assert.ok(dialog.querySelector('.bui-question-message').nextElementSibling === list, 'right under the message');
	assert.deepEqual([...list.querySelectorAll('dt')].map(node => node.textContent), ['Se pierde', 'What is kept', 'How to undo']);
	assert.deepEqual([...list.querySelectorAll('.bui-consequence-lost li')].map(node => node.textContent), ['Its entries in each product', 'Its repositories']);
	assert.equal(list.querySelector('.bui-consequence-recovery dd').textContent, 'Deletion cannot be undone.');
	assert.ok([...dialog.querySelectorAll('button')].some(button => button.textContent === 'Delete project'));
	page.key(dialog, 'Escape');
	assert.equal(await asked, false);
	const partial = ui.confirm({ title: 'Archive?', consequence: { kept: 'Everything', lost: [] } });
	assert.deepEqual([...document.querySelectorAll('dialog dt')].map(node => node.textContent), ['What is kept']);
	page.key(document.querySelector('dialog'), 'Escape');
	await partial;
	const none = ui.confirm({ title: 'Leave?' });
	assert.equal(document.querySelector('dialog .bui-consequence'), null);
	page.key(document.querySelector('dialog'), 'Escape');
	await none;
});

test('availability: the one ordered vocabulary with tones, frozen', () => {
	assert.deepEqual(ui.availability.map(state => [state.key, state.label, state.tone]), [
		['available', 'Available', 'success'],
		['closed', 'Closed access', 'warning'],
		['preparation', 'In preparation', 'info'],
		['planned', 'Planned', 'neutral'],
		['retired', 'Retired', 'neutral']
	]);
	assert.ok(Object.isFrozen(ui.availability) && ui.availability.every(Object.isFrozen));
	const [open] = ui.availability;
	assert.equal(ui.badge(open.label, open.tone).className, 'bui-badge bui-badge-success');
});
