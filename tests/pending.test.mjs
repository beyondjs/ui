import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

/**
 * What a page holds while its object's first read runs (0.44.0, LOAD-01, D185), the DOM classes: a pending
 * title, an action whose place is reserved, a facts line that may hold a control, a part of a section that
 * waits, the sidebar's objects that wait and an arrival line that holds its place until its way back is known.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');

after(() => page.close());
beforeEach(() => page.reset());

const styles = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
/** The declarations of every rule whose selector list holds `selector` exactly */
const rules = selector =>
	[...styles.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
		.filter(([, selectors]) => selectors.split(',').some(one => one.trim() === selector))
		.map(([, , body]) => body)
		.join(';');

test('a pending title: a placeholder line named "Loading…", busy and out of focus, until the title arrives', () => {
	const header = new ui.PageHeader({ title: null, waiting: true, compact: true });
	document.body.append(header.bar, header.element);
	const { heading } = header;
	assert.equal(header.waiting, true);
	assert.equal(heading.getAttribute('aria-busy'), 'true');
	assert.equal(heading.hasAttribute('tabindex'), false, 'out of the focus order while it waits');
	assert.equal(heading.querySelector('.bui-hidden').textContent, 'Loading…', 'named for assistive technology');
	const line = heading.querySelector('.bui-page-pending');
	assert.ok(line.classList.contains('bui-skeleton'), 'a shared wait, which the opening and the grace see');
	assert.equal(line.getAttribute('aria-hidden'), 'true');
	assert.equal(header.bar.querySelector('.bui-page-compact-title').textContent, '', 'the compact line names nothing meanwhile');
	header.title = 'web';
	assert.equal(header.waiting, false);
	assert.equal(heading.textContent, 'web');
	assert.equal(heading.hasAttribute('aria-busy'), false);
	assert.equal(heading.getAttribute('tabindex'), '-1', 'focusable again');
	assert.equal(header.bar.querySelector('.bui-page-compact-title').textContent, 'web');
	header.wait();
	assert.equal(header.waiting, true, 'waits again for another object');
	assert.equal(heading.querySelector('.bui-page-pending') !== null, true);
	header.destroy();
});

test('a pending title in Spanish, through the header\'s labels', () => {
	assert.equal(ui.PageHeader.labels.es.loading, 'Cargando…');
	const header = new ui.PageHeader({ title: 'x', waiting: true, labels: ui.PageHeader.labels.es });
	assert.equal(header.heading.querySelector('.bui-hidden').textContent, 'Cargando…');
});

test('a focus asked of a pending title lands once the title does, unless the person moved on', () => {
	const link = document.body.appendChild(ui.el('a', { href: '#/web', text: 'web' }));
	const header = new ui.PageHeader({ title: null, waiting: true });
	document.body.append(header.element);
	link.focus();
	header.focus();
	assert.equal(document.activeElement, link, 'nothing named "Loading…" takes the focus');
	header.title = 'web';
	assert.equal(document.activeElement, header.heading, 'the focus lands with the title');

	// A router holding the element itself is kept the same way
	header.wait();
	link.focus();
	header.heading.focus({ preventScroll: true });
	assert.equal(document.activeElement, link);
	const other = document.body.appendChild(ui.el('button', { type: 'button', text: 'Other' }));
	other.focus();
	header.title = 'api';
	assert.equal(document.activeElement, other, 'a person who moved on keeps their place');

	// Nothing kept, nothing moves; and a header destroyed while it waits gives the platform's focus back
	header.title = 'api';
	assert.equal(document.activeElement, other);
	header.wait();
	header.destroy();
	assert.equal(Object.hasOwn(header.heading, 'focus'), false);
});

test('reserved(): the action laid out where it will be, unseen, inert and hidden from assistive technology', () => {
	const restore = new ui.Button({ label: 'Restore', variant: 'primary' });
	const held = ui.reserved(restore);
	assert.ok(held.classList.contains('bui-reserved'));
	assert.equal(held.hasAttribute('inert'), true);
	assert.equal(held.getAttribute('aria-hidden'), 'true');
	assert.equal(held.firstElementChild, restore.element, 'the action itself, or a component\'s element');
	const header = new ui.PageHeader({ title: 'Snapshot', actions: [held] });
	const actions = header.element.querySelector('.bui-page-actions');
	assert.equal(actions.hidden, false, 'the action line is there from the first frame');
	header.actions = [restore];
	assert.equal(actions.querySelector('.bui-reserved'), null, 'the permitted action replaces its place');
	assert.equal(actions.firstElementChild, restore.element);
	header.actions = [];
	assert.equal(actions.hidden, true, 'a refused one leaves nothing');
	assert.match(rules('.bui-reserved'), /display:\s*contents/);
	assert.match(rules('.bui-reserved'), /visibility:\s*hidden/);
});

test('the facts line is a block that may hold a control, such as a ChoiceMenu', () => {
	const choose = new ui.ChoiceMenu({ label: 'Compared with', options: [{ value: 'a', label: 'snap-a' }], value: 'a' });
	const header = new ui.PageHeader({ title: 'Compare', facts: ['Compared with ', choose.element] });
	const facts = header.element.querySelector('.bui-page-facts');
	assert.equal(facts.tagName, 'DIV', 'never a paragraph that a block would break');
	assert.ok(facts.contains(choose.element));
	assert.equal(header.element.querySelector('p .bui-choice, p div'), null, 'no block inside a paragraph');
});

test('a part of a section\'s body waits beside what is drawn; the section is busy while one of its own parts waits', () => {
	const section = new ui.Section({ title: 'Devices' });
	const devices = section.part({ waiting: { rows: 2 } });
	assert.ok(devices instanceof ui.SectionPart);
	const action = ui.el('button', { type: 'button', text: 'Sign out of other devices' });
	section.children = [action, devices.element];
	assert.equal(section.element.getAttribute('aria-busy'), 'true', 'busy while its part waits');
	assert.equal(devices.waiting, true);
	assert.equal(devices.element.querySelectorAll('.bui-skeleton-row').length, 2);
	assert.ok(section.element.contains(action), 'the rest of the body is drawn');
	devices.children = [ui.el('ul', {}, [ui.el('li', { text: 'This Mac' })])];
	assert.equal(section.element.hasAttribute('aria-busy'), false, 'not busy once it is read');
	devices.wait();
	assert.equal(section.element.getAttribute('aria-busy'), 'true', 'a part may wait again');
	section.unavailable();
	assert.equal(section.element.hasAttribute('aria-busy'), false, 'an outage takes the body, its parts with it');

	// A part made but not placed, or a nested section's part, does not make it busy
	const loose = new ui.Section({ title: 'Factors' });
	loose.part({ waiting: true });
	loose.children = [ui.el('p', { text: 'None yet' })];
	assert.equal(loose.element.hasAttribute('aria-busy'), false);
	const inner = new ui.Section({ title: 'Keys', level: 3 });
	inner.children = [inner.part({ waiting: true }).element];
	loose.children = [inner.element];
	assert.equal(inner.element.getAttribute('aria-busy'), 'true');
	assert.equal(loose.element.hasAttribute('aria-busy'), false);
	const part = loose.part({ children: [ui.el('p', { text: 'Read' })] });
	assert.equal(part.waiting, false);
	assert.equal(part.element.textContent, 'Read');
});

test('the sidebar\'s objects wait in their groups\' place, the group busy, until their groups are given', () => {
	const entry = (key, label) => ({ key, label, href: `#/${key}` });
	const objects = state => [{ kind: 'object', key: 'projects', heading: 'Projects', action: { label: 'New', href: '#/new' }, ...state }];
	const sidebar = new ui.Sidebar({ product: 'Beyond Home', groups: objects({ waiting: true }) }).mount(document.body);
	const group = () => sidebar.element.querySelector('.bui-sidebar-panel .bui-sidebar-object');
	assert.equal(group().getAttribute('aria-busy'), 'true');
	assert.equal(group().querySelector('.bui-sidebar-object-title').textContent, 'Projects', 'its heading stays');
	assert.equal(group().querySelector('.bui-sidebar-object-action').textContent, 'New', 'and its action');
	const wait = group().querySelector('.bui-waiting');
	assert.equal(wait.querySelector('[role="status"]').textContent, 'Loading…');
	assert.equal(wait.hasAttribute('data-frame'), false, 'no frame inside the sidebar');
	assert.equal(wait.querySelectorAll('.bui-skeleton-line').length, 3);
	sidebar.groups = objects({ waiting: { rows: 2 }, groups: [{ kind: 'entries', key: 'all', items: [entry('a', 'Storefront')] }] });
	assert.equal(group().querySelectorAll('.bui-waiting').length, 1, 'one wait, its rows as given');
	assert.equal(group().querySelectorAll('.bui-skeleton-line').length, 2);
	assert.equal(group().querySelector('.bui-sidebar-entry'), null, 'no groups while it waits');
	sidebar.groups = objects({ groups: [{ kind: 'entries', key: 'all', items: [entry('a', 'Storefront')] }] });
	assert.equal(group().querySelector('.bui-waiting'), null);
	assert.equal(group().hasAttribute('aria-busy'), false);
	assert.equal(group().querySelector('.bui-sidebar-object-groups').textContent.includes('Storefront'), true);
	sidebar.destroy();
	const spanish = new ui.Sidebar({ product: 'Beyond Home', labels: ui.Sidebar.labels.es, groups: objects({ waiting: true }) }).mount(document.body);
	assert.equal(spanish.element.querySelector('.bui-sidebar-object .bui-waiting [role="status"]').textContent, 'Cargando…');
	spanish.destroy();
});

test('an arrival line holds its place, unseen and inert, until its way back is known', () => {
	const arrival = new ui.Arrival({ product: 'Beyond Projects', href: null });
	const line = arrival.element;
	assert.equal(arrival.href, null);
	assert.equal(line.hasAttribute('data-held'), true);
	assert.equal(line.hasAttribute('inert'), true);
	assert.equal(line.getAttribute('aria-hidden'), 'true');
	assert.equal(line.querySelector('a').hasAttribute('href'), false, 'no way back is offered');
	assert.equal(line.textContent.includes('Back to Beyond Projects'), true, 'its words take their room');
	arrival.href = 'https://projects.example/p/1';
	assert.equal(line.querySelector('a').getAttribute('href'), 'https://projects.example/p/1');
	assert.deepEqual(['data-held', 'inert', 'aria-hidden'].map(name => line.hasAttribute(name)), [false, false, false]);
	arrival.href = '';
	assert.equal(line.hasAttribute('data-held'), true, 'an empty address is not a way back');
	assert.match(rules('.bui-arrival[data-held]'), /visibility:\s*hidden/);
});

test('a pending title\'s line is the title\'s own height, and a panel kept in view never holds the wheel', () => {
	assert.match(rules('.bui-page-heading > .bui-page-pending'), /height:\s*1lh/);
	assert.match(rules('.bui-page-panel'), /overflow-y:\s*auto/);
	assert.doesNotMatch(rules('.bui-page-panel'), /overscroll-behavior/, 'contained, Chrome keeps the page still under the pointer');
});
