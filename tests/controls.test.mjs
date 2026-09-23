import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

test('Labels apply placeholders and consumer functions; unknown keys fall back to the key', () => {
	const labels = new ui.Labels({ count: '{count} left', plural: ({ count }) => (count === 1 ? 'uno' : `${count} varios`) }, { count: 'Quedan {count}' });
	assert.equal(labels.text('count', { count: 3 }), 'Quedan 3');
	assert.equal(labels.text('plural', { count: 1 }), 'uno');
	assert.equal(labels.text('missing'), 'missing');
});

test('destroy() releases outside listeners and cancels timers', async () => {
	const menu = new ui.ActionMenu({ label: 'More', items: [{ label: 'Edit' }] }).mount(document.body);
	menu.open();
	assert.equal(menu.listeners.size, 1);
	let fired = false;
	menu.later(() => (fired = true), 10);
	menu.destroy();
	assert.equal(menu.listeners.size, 0);
	assert.equal(document.body.children.length, 0);
	await new Promise(resolve => setTimeout(resolve, 30));
	assert.equal(fired, false);
	menu.destroy();
});

test('Button.run ignores presses while busy and recovers after a failure', async () => {
	let runs = 0;
	let release;
	const button = new ui.Button({ label: 'Save', variant: 'primary', labels: { busy: '{label} en curso' } }).mount(document.body);
	const first = button.run(() => new Promise(resolve => ((release = resolve), runs++)));
	assert.equal(button.element.getAttribute('aria-disabled'), 'true');
	assert.match(button.element.textContent, /Save en curso/);
	assert.equal(await button.run(async () => runs++), undefined);
	release();
	await first;
	assert.equal(runs, 1);
	assert.equal(button.busy, false);
	await assert.rejects(button.run(async () => { throw new Error('no'); }), /no/);
	assert.equal(button.busy, false);
	let clicks = 0;
	const guarded = new ui.Button({ label: 'Go', busy: true, onclick: () => clicks++ }).mount(document.body);
	guarded.element.click();
	assert.equal(clicks, 0);
});

test('ActionMenu: arrows move, Escape returns focus, disabled items explain and do nothing', () => {
	let ran = 0;
	const menu = new ui.ActionMenu({ label: 'Actions', items: [{ label: 'Rename', run: () => ran++ }, { label: 'Delete', disabled: true, reason: 'Only owners delete', run: () => ran++ }] }).mount(document.body);
	const button = menu.element.querySelector('button');
	page.key(button, 'ArrowDown');
	const items = [...menu.element.querySelectorAll('[role="menuitem"]')];
	assert.equal(document.activeElement, items[0]);
	page.key(items[0], 'ArrowDown');
	assert.equal(document.activeElement, items[1]);
	assert.equal(items[1].getAttribute('aria-disabled'), 'true');
	assert.match(document.getElementById(items[1].getAttribute('aria-describedby')).textContent, /Only owners/);
	items[1].click();
	assert.equal(ran, 0);
	page.key(items[1], 'Escape');
	assert.equal(menu.expanded, false);
	assert.equal(document.activeElement, button);
	button.click();
	items[0].click();
	assert.equal(ran, 1);
	assert.equal(document.activeElement, button);
});

test('Field validates with consumer messages, rechecks while typing and clears', () => {
	const field = new ui.Field({ label: 'Name', required: true, hint: 'As people know it', messages: { valueMissing: 'Escribe un nombre.' } }).mount(document.body);
	assert.equal(field.check(), false);
	assert.equal(field.control.getAttribute('aria-invalid'), 'true');
	assert.match(field.element.textContent, /Escribe un nombre/);
	assert.match(field.control.getAttribute('aria-describedby'), /-hint .*-error/);
	field.control.value = 'Ana';
	field.control.dispatchEvent(new Event('input'));
	assert.equal(field.invalid, false);
	assert.equal(field.control.hasAttribute('aria-invalid'), false);
	const custom = new ui.Field({ label: 'Slug', validate: value => (/\s/.test(value) ? 'No spaces.' : null) });
	custom.control.value = 'a b';
	assert.equal(custom.check(), false);
});

test('Choices report checkbox arrays and radio values; Select keeps native values', () => {
	const changes = [];
	const boxes = new ui.Choices({ legend: 'Areas', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B', disabled: true, reason: 'Archived' }], value: ['a'], onchange: value => changes.push(value) }).mount(document.body);
	assert.deepEqual(boxes.value, ['a']);
	assert.match(boxes.element.textContent, /Archived/);
	const radios = new ui.Choices({ legend: 'Theme', type: 'radio', options: [{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }], value: 'dark' });
	assert.equal(radios.value, 'dark');
	radios.value = 'light';
	assert.equal(radios.value, 'light');
	const select = new ui.Select({ options: [{ value: 'en', label: 'English' }, { group: 'Other', options: [{ value: 'es', label: 'Español' }] }], value: 'es' });
	assert.equal(select.value, 'es');
	assert.equal(new ui.Field({ label: 'Language', control: select }).element.querySelector('label').htmlFor, select.control.id);
});

test('Help opens from its button, closes with Escape and returns focus; outside press closes', () => {
	const help = new ui.Help({ topic: 'Identifier', text: ['The identifier never changes.', 'Copy it for support.'], labels: { name: 'Ayuda: {topic}' } }).mount(document.body);
	assert.equal(help.button.getAttribute('aria-label'), 'Ayuda: Identifier');
	help.button.click();
	assert.equal(help.expanded, true);
	assert.equal(help.panel.hidden, false);
	page.key(help.panel, 'Escape');
	assert.equal(help.expanded, false);
	assert.equal(document.activeElement, help.button);
	help.button.click();
	document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
	assert.equal(help.expanded, false);
});

test('Tooltip describes its trigger, shows on focus, hides on Escape and cleans up on destroy', () => {
	const trigger = document.createElement('button');
	trigger.setAttribute('aria-describedby', 'other');
	document.body.append(trigger);
	const tip = new ui.Tooltip(trigger, { text: 'Copies the address' });
	assert.equal(trigger.getAttribute('aria-describedby'), `other ${tip.element.id}`);
	trigger.dispatchEvent(new FocusEvent('focus'));
	assert.equal(tip.shown, true);
	page.key(document.body, 'Escape');
	assert.equal(tip.shown, false);
	tip.destroy();
	assert.equal(trigger.getAttribute('aria-describedby'), 'other');
	assert.equal(document.querySelector('[role="tooltip"]'), null);
});

test('Toaster: polite successes leave, failures stay in the assertive region until dismissed', async () => {
	const toaster = new ui.Toaster().mount(document.body);
	toaster.show('Saved', { duration: 20 });
	toaster.show('Could not save', { tone: 'danger' });
	assert.equal(toaster.element.querySelector('[role="status"]').children.length, 1);
	assert.equal(toaster.element.querySelector('[role="alert"]').children.length, 1);
	await page.until(() => !toaster.element.querySelector('[role="status"]').children.length);
	assert.equal(toaster.element.querySelector('[role="alert"]').children.length, 1);
	toaster.element.querySelector('[role="alert"] button').click();
	assert.equal(toaster.element.querySelector('[role="alert"]').children.length, 0);
});

test('Header: slots, breadcrumb, collapsible navigation and taken-over navigation', () => {
	const visits = [];
	const header = new ui.Header({
		brand: { label: 'Beyond', href: '/' },
		context: [{ label: 'Northwind', href: '/o/n' }, { label: 'Storefront', current: true }],
		nav: [{ label: 'Requests', href: '/r', current: true }, { label: 'Settings', href: '/s' }],
		notifications: document.createElement('span'),
		onnavigate: item => visits.push(item.href),
		labels: { open: 'Abrir navegación' }
	}).mount(document.body);
	const toggle = header.element.querySelector('.bui-header-toggle');
	assert.equal(toggle.getAttribute('aria-expanded'), 'false');
	assert.equal(toggle.getAttribute('aria-label'), 'Abrir navegación');
	toggle.click();
	assert.equal(header.expanded, true);
	header.element.querySelector('.bui-header-nav a[href="/s"]').click();
	assert.deepEqual(visits, ['/s']);
	assert.equal(header.element.querySelector('[aria-current="page"]').textContent, 'Storefront');
	header.context = null;
	assert.equal(header.element.querySelector('.bui-header-context').hidden, true);
});

test('FocusedForm submits once, reports failure without losing values, and recovers', async () => {
	const form = document.createElement('form');
	const name = new ui.Field({ label: 'Name', name: 'name', required: true });
	const submit = document.createElement('button');
	submit.textContent = 'Create';
	form.append(name.element, submit);
	document.body.append(form);
	const sent = [];
	let fail = true;
	let release;
	const behavior = new ui.FocusedForm(form, {
		fields: [name],
		labels: { busy: 'Creating…' },
		explain: error => `Not created: ${error.message}`,
		submit: values => new Promise((resolve, reject) => { sent.push(values); release = () => (fail ? reject(new Error('conflict')) : resolve()); })
	});
	form.requestSubmit();
	assert.equal(sent.length, 0, 'invalid form is not sent');
	assert.equal(document.activeElement, name.control);
	name.control.value = 'Alpha';
	form.requestSubmit();
	form.requestSubmit();
	assert.equal(sent.length, 1, 'double submission ignored');
	assert.equal(submit.textContent, 'Creating…');
	release();
	await page.until(() => !behavior.busy);
	assert.match(form.textContent, /Not created: conflict/);
	assert.equal(name.control.value, 'Alpha');
	assert.equal(submit.textContent, 'Create');
	fail = false;
	form.requestSubmit();
	release();
	await page.until(() => !behavior.busy);
	assert.doesNotMatch(form.textContent, /Not created/);
	behavior.destroy();
	assert.equal(form.querySelector('.bui-form-problem'), null);
});

test('feedback builders carry words, not only color', () => {
	assert.equal(ui.status('Live', 'success').textContent, 'Live');
	assert.equal(ui.callout({ tone: 'danger', title: 'Failed', live: true }).getAttribute('role'), 'alert');
	assert.equal(ui.loading('Cargando…').getAttribute('role'), 'status');
	assert.equal(ui.skeleton(2).getAttribute('aria-hidden'), 'true');
});
