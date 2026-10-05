import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Notices } from './fixtures/notices.mjs';
import { inside } from './fixtures/family.mjs';

/** 0.7.2: a confirmation's work affected and what keeps costing, `consequence` for a product's own dialog, and Spanish copy across the package. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const terms = list => [...list.querySelectorAll('dt')].map(node => node.textContent);

test('confirm states the work it affects and what keeps costing, in D17 order, each only when given', async () => {
	const asked = ui.confirm({
		title: 'Delete My first VM?',
		accept: 'Delete environment',
		tone: 'danger',
		consequence: { recovery: 'Deletion cannot be undone.', costing: 'The disk snapshot, until you delete it', kept: 'Its conversations', lost: 'The machine and its copies', affected: ['2 running conversations stop'] }
	});
	const list = document.querySelector('dialog .bui-consequence');
	assert.deepEqual(terms(list), ['Work it affects', 'What is lost', 'What is kept', 'What keeps costing', 'How to undo']);
	assert.equal(list.querySelector('.bui-consequence-affected li').textContent, '2 running conversations stop');
	assert.equal(list.querySelector('.bui-consequence-costing dd').textContent, 'The disk snapshot, until you delete it');
	page.key(document.querySelector('dialog'), 'Escape');
	assert.equal(await asked, false);
	const spanish = ui.confirm({ title: '¿Borrar?', accept: 'Borrar', consequence: { affected: 'Las conversaciones en curso', costing: 'El disco' }, labels: ui.confirm.labels.es });
	assert.deepEqual(terms(document.querySelector('dialog .bui-consequence')), ['Trabajo afectado', 'Qué sigue costando']);
	page.key(document.querySelector('dialog'), 'Escape');
	await spanish;
	const earlier = ui.confirm({ title: 'x', consequence: { lost: 'A', kept: 'B', recovery: 'C' } });
	assert.deepEqual(terms(document.querySelector('dialog .bui-consequence')), ['What is lost', 'What is kept', 'How to undo'], 'the earlier keys are unchanged');
	page.key(document.querySelector('dialog'), 'Escape');
	await earlier;
});

test('consequence(parts, labels) draws the same list for a product\'s own dialog, or nothing', () => {
	const list = ui.consequence({ affected: ['A conversation is interrupted'], costing: [null, 'Storage'], lost: [] }, ui.consequence.labels.es);
	assert.equal(list.className, 'bui-consequence');
	assert.deepEqual(terms(list), ['Trabajo afectado', 'Qué sigue costando'], 'empty parts are left out');
	assert.equal(list.querySelectorAll('.bui-consequence-costing li').length, 1, 'empty lines are left out');
	assert.equal(ui.consequence({}), null);
	assert.equal(ui.consequence(null), null);
	assert.deepEqual([...ui.consequence.order], ['affected', 'lost', 'kept', 'costing', 'recovery']);
	assert.equal(ui.consequence({ lost: 'x' }, { lost: 'Se pierde' }).querySelector('dt').textContent, 'Se pierde', 'a product may pass its own terms');
});

test('FocusedForm says a failure in Spanish', async () => {
	const form = document.body.appendChild(document.createElement('form'));
	form.append(Object.assign(document.createElement('button'), { type: 'submit', textContent: 'Guardar' }));
	const behavior = new ui.FocusedForm(form, { submit: async () => Promise.reject(new Error('down')), labels: ui.FocusedForm.labels.es });
	form.dispatchEvent(new Event('submit', { cancelable: true }));
	await page.until(() => form.querySelector('[role="alert"]'));
	assert.match(form.querySelector('[role="alert"]').textContent, /No funcionó\. Vuelve a intentarlo\./);
	behavior.destroy();
});

test('every component a Spanish page shows carries a Spanish set', async () => {
	const sets = { FamilyBar: ui.FamilyBar, NotificationEntry: ui.NotificationEntry, NotificationInbox: ui.NotificationInbox, Header: ui.Header, Help: ui.Help, Sidebar: ui.Sidebar, ProductNav: ui.ProductNav, Tabs: ui.Tabs, PageHeader: ui.PageHeader, FocusedForm: ui.FocusedForm, Dialog: ui.Dialog, Question: ui.Question, Unavailable: ui.Unavailable, Toaster: ui.Toaster, Field: ui.Field, Picker: ui.Picker, Collection: ui.Collection, ChoiceMenu: ui.ChoiceMenu };
	for (const [name, component] of Object.entries(sets)) {
		const { en, es } = component.labels ?? {};
		assert.ok(en && es && Object.isFrozen(component.labels), `${name}.labels has en and es`);
		for (const key of Object.keys(en)) assert.ok(key in es, `${name}.labels.es.${key}`);
	}
	assert.equal(ui.loading.labels.es, 'Cargando…');
	assert.equal(ui.loading(ui.loading.labels.es).textContent, 'Cargando…');
	assert.deepEqual(ui.availability.map(state => state.labels.es), ['Disponible', 'Acceso cerrado', 'En preparación', 'Planificado', 'Retirado']);
	assert.ok(ui.availability.every(state => state.labels.en === state.label && Object.isFrozen(state.labels)));
	const bar = new ui.FamilyBar({ product: 'delegate', brand: { src: '/w.svg', href: '/' }, descriptor: inside, account: { signout: () => {} }, labels: ui.FamilyBar.labels.es }).mount(document.body);
	assert.equal(bar.element.querySelector('a[aria-label]')?.getAttribute('aria-label'), 'Inicio de Beyond');
	bar.destroy();
	const entry = new ui.NotificationEntry({ adapter: new Notices().adapter, labels: ui.NotificationEntry.labels.es }).mount(document.body);
	await page.until(() => /Notificaciones/.test(entry.button.getAttribute('aria-label')));
	entry.destroy();
	const help = new ui.Help({ topic: 'Identificador', text: 'Nunca cambia.', labels: ui.Help.labels.es }).mount(document.body);
	assert.equal(help.button.getAttribute('aria-label'), 'Ayuda: Identificador');
	help.destroy();
	const header = new ui.PageHeader({ title: 'web', crumbs: [{ label: 'Entornos', href: '#' }], labels: ui.PageHeader.labels.es });
	assert.equal(header.element.querySelector('nav').getAttribute('aria-label'), 'Ruta de navegación');
});
