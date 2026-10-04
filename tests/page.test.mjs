import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page as Window } from './support/page.mjs';
import { annotated } from './fixtures/family.mjs';

/**
 * The family page system of 0.6.0 (D52, D54): Page, PageHeader, Tabs, Section, Arrival,
 * PreferencesDialog and the profile menu's "Language and appearance". Layout (the gutter by band,
 * the tiers, the side panel beside the main column) is measured in the browser acceptance.
 */
const page = new Window();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => {
	page.reset();
	page.window.happyDOM.setURL('http://localhost/');
});

const memory = () => {
	const values = new Map();
	return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
};
const preferences = (locale = 'en') => new ui.Preferences({ key: 'beyond-test', fallback: { appearance: 'system', locale }, storage: memory() });

test('Page: the region with its template and width tier, arrival and header first, a side panel only with content', () => {
	const header = new ui.PageHeader({ title: 'web' });
	const arrival = new ui.Arrival({ product: 'Conduict', href: '/back' });
	const region = new ui.Page({ template: 'detail', width: 'standard', arrival, header, children: [ui.el('p', { text: 'Main' })] }).mount(document.body);
	const element = region.element;
	assert.deepEqual([element.dataset.template, element.dataset.width], ['detail', 'standard']);
	const frame = element.querySelector('.bui-page-frame');
	assert.deepEqual([...frame.children].map(child => child.className), ['bui-arrival', 'bui-page-header', 'bui-page-body']);
	assert.equal(element.querySelector('.bui-page-main').textContent, 'Main');
	assert.equal(element.querySelector('.bui-page-aside'), null, 'no side panel without content');
	region.aside = [ui.el('p', { text: 'Facts' })];
	assert.equal(element.querySelector('.bui-page-body > aside.bui-page-aside').textContent, 'Facts');
	region.aside = null;
	assert.equal(element.querySelector('.bui-page-aside'), null, 'the side panel is removed');
	region.width = 'form';
	assert.equal(element.dataset.width, 'form');
	assert.throws(() => (region.width = 'wide'), /width is one of fluid, standard, form, reading/);
	assert.throws(() => new ui.Page({ template: 'card' }), /template is one of overview, list, detail, settings, task, tool/);
	region.destroy();
	assert.equal(document.querySelector('.bui-page'), null);
});

test('PageHeader: crumbs only with levels above, the H1, one status, facts, the actions and tabs; the H1 takes focus', () => {
	const primary = new ui.Button({ label: 'Start', variant: 'primary' });
	const tabs = new ui.Tabs({ items: [{ label: 'Overview', href: '#overview', current: true }, { label: 'Repositories', href: '#repositories' }] });
	const header = new ui.PageHeader({ title: 'web', crumbs: [{ label: 'Environments', href: '/environments' }], status: ui.status('Ready', 'success'), facts: 'Compute Engine · us-east4', actions: [primary], tabs }).mount(document.body);
	const element = header.element;
	assert.equal(element.tagName, 'HEADER');
	assert.equal(element.getAttribute('aria-labelledby'), header.heading.id);
	assert.deepEqual([...element.querySelectorAll('.bui-crumbs a')].map(link => [link.textContent, link.getAttribute('href')]), [['Environments', '/environments']]);
	const line = element.querySelector('.bui-page-title');
	assert.deepEqual([...line.children].map(child => child.className), ['bui-page-heading', 'bui-page-status', 'bui-page-actions'], 'the status follows the H1 and the actions end the line');
	assert.equal(line.querySelector('h1').textContent, 'web');
	assert.equal(element.querySelector('.bui-page-facts').textContent, 'Compute Engine · us-east4');
	assert.ok(element.querySelector('.bui-page-tabs nav.bui-tabs.bui-productnav'), 'the tabs are drawn like ProductNav');
	assert.equal(element.querySelector('.bui-tabs').getAttribute('aria-label'), 'Sections of this page');
	header.focus();
	assert.equal(document.activeElement, header.heading);
	header.crumbs = [];
	header.status = null;
	header.facts = null;
	header.actions = [];
	header.tabs = null;
	assert.deepEqual(['.bui-crumbs', '.bui-page-status', '.bui-page-facts', '.bui-page-actions', '.bui-page-tabs'].map(selector => element.querySelector(selector).hidden), [true, true, true, true, true], 'empty parts take no room');
	header.title = 'web (renamed)';
	assert.equal(header.heading.textContent, 'web (renamed)');
	header.destroy();
});

test('Section: flat, named by its heading, a description, its actions and content', () => {
	const section = new ui.Section({ title: 'Repositories', description: 'Copies on this machine.', actions: [new ui.Button({ label: 'Add a repository' })], children: [ui.el('p', { text: 'acme/web' })] }).mount(document.body);
	const element = section.element;
	const heading = element.querySelector('h2.bui-section-title');
	assert.equal(element.getAttribute('aria-labelledby'), heading.id);
	assert.equal(element.querySelector('.bui-section-description').textContent, 'Copies on this machine.');
	assert.equal(element.querySelector('.bui-section-actions button').textContent, 'Add a repository');
	section.children = [ui.el('p', { text: 'acme/docs' })];
	assert.equal(element.querySelector('.bui-section-body').textContent, 'acme/docs');
	assert.equal(new ui.Section({ title: 'Inner', level: 3 }).element.querySelector('h3').textContent, 'Inner');
	section.destroy();
});

test('Arrival: where the person came from and the way back; a plain same-origin click goes to the product, Dismiss removes it', () => {
	const seen = [];
	let dismissed = 0;
	const arrival = new ui.Arrival({ product: 'Conduict', href: '/environments/env_1?area=repositories', onnavigate: item => seen.push(item.href), ondismiss: () => dismissed++ }).mount(document.body);
	const element = arrival.element;
	assert.equal(element.getAttribute('role'), 'note');
	assert.equal(element.textContent, 'Opened from Conduict · Back to Conduict');
	const back = element.querySelector('a.bui-arrival-back');
	const click = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
	back.dispatchEvent(click);
	assert.deepEqual([seen, click.defaultPrevented], [['/environments/env_1?area=repositories'], true]);
	const modified = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, metaKey: true });
	back.dispatchEvent(modified);
	assert.deepEqual([seen.length, modified.defaultPrevented], [1, false], 'a new-tab click is the browser\'s');
	const dismiss = element.querySelector('button.bui-arrival-dismiss');
	assert.equal(dismiss.getAttribute('aria-label'), 'Dismiss');
	dismiss.click();
	assert.deepEqual([dismissed, document.querySelector('.bui-arrival')], [1, null]);
	const spanish = new ui.Arrival({ product: 'Conduict', href: 'https://conduict.example.test/', labels: ui.Arrival.labels.es });
	assert.equal(spanish.element.textContent, 'Abierto desde Conduict · Volver a Conduict');
	assert.equal(spanish.element.querySelector('button'), null, 'Dismiss only when the product handles it');
});

test('PreferencesDialog: language and appearance apply at once on this device; "Change for all of Beyond" leads to Accounts', async () => {
	const values = preferences();
	const dialog = new ui.PreferencesDialog({ preferences: values, everywhere: 'https://accounts.example.test/account' });
	const closed = dialog.open();
	const element = document.querySelector('dialog.bui-dialog');
	assert.ok(element?.open, 'the dialog is open');
	assert.equal(element.querySelector('.bui-dialog-title, h2').textContent, 'Language and appearance');
	const [language, appearance] = element.querySelectorAll('select');
	assert.deepEqual([...language.options].map(option => option.textContent), ['English', 'Español']);
	assert.deepEqual([...appearance.options].map(option => option.textContent), ['System', 'Light', 'Dark']);
	appearance.value = 'dark';
	appearance.dispatchEvent(new Event('change', { bubbles: true }));
	assert.equal(values.appearance, 'dark');
	assert.equal(document.documentElement.getAttribute('data-beyond-mode'), 'dark');
	language.value = 'es';
	language.dispatchEvent(new Event('change', { bubbles: true }));
	assert.equal(values.locale, 'es');
	const everywhere = element.querySelector('.bui-preferences-note a');
	assert.deepEqual([everywhere.textContent, everywhere.getAttribute('href')], ['Change for all of Beyond', 'https://accounts.example.test/account']);
	assert.ok(element.querySelector('.bui-preferences-note').textContent.startsWith('Applies on this device.'));
	assert.equal(await dialog.open(), null, 'opening again while open does nothing');
	[...element.querySelectorAll('button')].find(button => button.textContent === 'Done').click();
	assert.equal(await closed, true);
	assert.equal(document.querySelector('dialog.bui-dialog'), null, 'closing removes it');
	dialog.open();
	assert.equal(document.querySelector('dialog.bui-dialog h2, dialog.bui-dialog .bui-dialog-title').textContent, 'Idioma y apariencia', 'its copy follows the language in effect');
	assert.equal(document.querySelector('.bui-preferences-note a').textContent, 'Cambiar en todo Beyond');
	dialog.destroy();
	assert.equal(document.querySelector('dialog.bui-dialog'), null);
	assert.throws(() => new ui.PreferencesDialog({ preferences: {} }), /needs the product's Preferences/);
});

test('the profile menu offers "Language and appearance" first in the product group and opens the one dialog', async () => {
	const values = preferences();
	const bar = new ui.FamilyBar({ product: 'delegate', brand: { src: '/brand.svg', href: '/' }, descriptor: annotated, account: { signout: () => {}, items: [{ label: 'Delegate settings', href: '/settings' }], preferences: { preferences: values, everywhere: 'https://accounts.example.test/account' } } }).mount(document.body);
	const profile = bar.element.querySelector('[data-part="account"]');
	const group = [...profile.querySelectorAll('.bui-navmenu-section')].find(section => section.querySelector('.bui-navmenu-heading')?.textContent === 'Delegate');
	assert.deepEqual([...group.querySelectorAll('.bui-navmenu-label')].map(node => node.textContent), ['Language and appearance', 'Delegate settings']);
	group.querySelector('button.bui-family-preferences').click();
	await Promise.resolve();
	assert.ok(document.querySelector('dialog.bui-dialog')?.open, 'the dialog opened');
	bar.destroy();
	assert.equal(document.querySelector('dialog.bui-dialog'), null, 'destroying the bar closes it');
	const plain = new ui.FamilyBar({ product: 'delegate', brand: { src: '/brand.svg', href: '/' }, descriptor: annotated, account: { signout: () => {} } }).mount(document.body);
	assert.equal(plain.element.querySelector('.bui-family-preferences'), null, 'nothing without account.preferences');
	plain.destroy();
});
