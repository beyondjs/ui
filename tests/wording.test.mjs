import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Notices } from './fixtures/notices.mjs';

/**
 * The shared words of 0.7.6, which a product kept its own copy of until then: why the inbox is
 * unavailable (with the relay's reason), the tabs' accessible name for what they belong to, and a
 * loading line that names what it waits for.
 */
const page = new Page();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ui = await import('@beyond-js/ui/dom');
const react = await import('@beyond-js/ui/react');
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
after(() => page.close());
beforeEach(() => page.reset());

const products = { delegate: 'Delegate', cdn: 'CDN', projects: 'Projects' };

test('the inbox says why notifications are unavailable when the relay names a known reason', async () => {
	const notices = new Notices();
	notices.absent = true;
	notices.reason = 'projects_unavailable';
	const inbox = new ui.NotificationInbox({ adapter: notices.adapter, products }).mount(document.body);
	await page.until(() => /unavailable/.test(inbox.element.textContent));
	assert.match(inbox.element.textContent, /Notifications are unavailable right now because Beyond Projects did not answer\. Everything else works\./);
	notices.reason = 'session_rejected';
	await inbox.load();
	assert.match(inbox.element.textContent, /because Beyond Accounts did not accept your session\./);
	notices.reason = 'Conduict did not answer.';
	await inbox.load();
	assert.match(inbox.element.textContent, /Notifications are unavailable right now\. Everything else works\./, 'a reason that is not a code is not shown');
	notices.reason = null;
	notices.absent = false;
	await inbox.load();
	assert.doesNotMatch(inbox.element.textContent, /unavailable/, 'the reason goes with the recovery');
	inbox.destroy();
});

test('the entry\'s panel says the reason in Spanish, and every code has a sentence in both languages', async () => {
	const notices = new Notices();
	notices.absent = true;
	notices.reason = 'not_configured';
	const entry = new ui.NotificationEntry({ adapter: notices.adapter, labels: ui.NotificationEntry.labels.es }).mount(document.body);
	entry.button.click();
	await page.until(() => /disponibles/.test(entry.panel.textContent));
	assert.match(entry.panel.textContent, /Las notificaciones no están disponibles ahora porque esta instalación no está conectada a Beyond Projects\. Todo lo demás funciona\./);
	entry.destroy();
	for (const code of ['not_configured', 'not_platform_session', 'session_rejected', 'projects_unavailable', 'accounts_unavailable']) {
		for (const set of [ui.NotificationEntry.labels.en, ui.NotificationEntry.labels.es, ui.NotificationInbox.labels.es]) assert.equal(typeof set[code], 'string', code);
	}
	assert.equal(ui.NotificationEntry.labels.en.unavailable, 'Notifications are unavailable right now. Everything else works.', 'the plain sentence is unchanged');
});

test('Tabs name what they belong to; a given label still wins and the default is unchanged', () => {
	const name = tabs => tabs.element.getAttribute('aria-label') ?? tabs.element.querySelector('[aria-label]')?.getAttribute('aria-label');
	const items = [{ label: 'Overview', href: '#o', current: true }];
	assert.equal(name(new ui.Tabs({ items })), 'Sections of this page');
	assert.equal(name(new ui.Tabs({ items, name: 'My first VM' })), 'Sections of My first VM');
	assert.equal(name(new ui.Tabs({ items, name: 'My first VM', labels: ui.Tabs.labels.es })), 'Secciones de My first VM');
	assert.equal(name(new ui.Tabs({ items, name: 'My first VM', label: 'Areas of My first VM' })), 'Areas of My first VM');
	assert.equal(ui.Tabs.labels.es.nav, 'Secciones de esta página');
});

test('the React Tabs pass their name to the DOM class', async () => {
	const host = document.body.appendChild(document.createElement('div'));
	const root = createRoot(host);
	await React.act(() => root.render(React.createElement(react.Tabs, { name: 'web', labels: react.Tabs.labels.es, items: [{ label: 'Resumen', href: '#o', current: true }] })));
	assert.equal(host.querySelector('.bui-tabs').getAttribute('aria-label'), 'Secciones de web');
	await React.act(() => root.unmount());
});

test('a loading line names what it waits for, in English and Spanish', () => {
	assert.equal(ui.loading.text({ name: 'the conversation' }), 'Loading the conversation…');
	assert.equal(ui.loading.text({ name: 'Conduict', kind: 'opening' }), 'Opening Conduict…');
	assert.equal(ui.loading.text({ name: 'the review', kind: 'reading' }), 'Reading the review…');
	assert.equal(ui.loading.text({ name: 'la conversación', language: 'es' }), 'Cargando la conversación…');
	assert.equal(ui.loading.text({ name: 'Conduict', kind: 'opening', language: 'es' }), 'Abriendo Conduict…');
	assert.equal(ui.loading.text({ name: 'la revisión', kind: 'reading', language: 'es' }), 'Leyendo la revisión…');
	assert.equal(ui.loading.text({ name: 'x', kind: 'unknown' }), 'Loading x…', 'an unknown kind reads as loading');
	const line = ui.loading(ui.loading.text({ name: 'the conversation' }));
	assert.equal(line.getAttribute('role'), 'status');
	assert.equal(line.textContent, 'Loading the conversation…');
	assert.deepEqual(Object.keys(ui.loading.names.es), Object.keys(ui.loading.names.en));
	assert.ok(Object.isFrozen(ui.loading.names) && Object.isFrozen(ui.loading.names.en));
	assert.equal(react.Loading.names, ui.loading.names);
	assert.equal(react.Loading.text, ui.loading.text);
	assert.equal(react.Loading.labels.es, 'Cargando…');
});
