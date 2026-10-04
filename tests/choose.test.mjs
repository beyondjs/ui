import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { branches } from './fixtures/refs.mjs';

/** "Choose, never type" (0.7.0, D56): a long menu's search and type-ahead, one option as a statement, a suggested value and a carried draft. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const many = () => branches.map(name => ({ value: name, label: name }));
const shown = menu => [...menu.element.querySelectorAll('[role="menuitemradio"]')].filter(node => !node.closest('li').hidden).map(node => node.textContent);

test('ChoiceMenu: past the threshold it opens on a search field that matches the beginning or any segment', () => {
	const chosen = [];
	const menu = new ui.ChoiceMenu({ label: 'Branch', options: many(), value: 'main', actions: [{ label: 'Use a commit or another ref…', run: () => {} }], onchange: value => chosen.push(value) }).mount(document.body);
	assert.ok(many().length > ui.ChoiceMenu.threshold);
	menu.open();
	const field = menu.element.querySelector('.bui-choice-field');
	assert.ok(field && document.activeElement === field, 'focus lands in the search field');
	assert.equal(field.getAttribute('aria-label'), 'Search Branch');
	field.value = 'login';
	field.dispatchEvent(new Event('input'));
	assert.deepEqual(shown(menu), ['feature/login-page', 'fix/login-redirect']);
	assert.ok(!menu.element.querySelector('[role="menuitem"]').closest('li').hidden, 'actions stay listed');
	field.value = 'Ñand';
	field.dispatchEvent(new Event('input'));
	assert.deepEqual(shown(menu), ['release/ñandú'], 'case and accents are ignored');
	field.value = 'zzz';
	field.dispatchEvent(new Event('input'));
	assert.equal(menu.element.querySelector('.bui-choice-none').textContent, 'Nothing matches “zzz”.');
	page.key(field, 'Escape');
	assert.equal(field.value, '', 'Escape clears the query first');
	assert.equal(menu.expanded, true);
	field.value = 'rel';
	field.dispatchEvent(new Event('input'));
	page.key(field, 'Enter');
	assert.deepEqual(chosen, ['release/2026.10']);
	assert.equal(menu.expanded, false);
	assert.ok(document.activeElement === menu.control, 'focus returns to the button');
	menu.open();
	page.key(menu.element.querySelector('.bui-choice-field'), 'ArrowDown');
	assert.equal(document.activeElement.getAttribute('role'), 'menuitemradio');
	page.key(document.activeElement, 'ArrowUp');
	assert.ok(document.activeElement === menu.element.querySelector('.bui-choice-field'), 'up from the first option goes back to the field');
	page.key(document.activeElement, 'Escape');
	assert.equal(menu.expanded, false, 'Escape on an empty field closes');
	menu.destroy();
});

test('ChoiceMenu: a short list has no search field and moves by type-ahead', () => {
	const menu = new ui.ChoiceMenu({ label: 'Environment', options: [{ value: 'web', label: 'web' }, { value: 'lab', label: 'lab' }, { value: 'legacy', label: 'legacy' }] }).mount(document.body);
	menu.open();
	assert.ok(!menu.element.querySelector('.bui-choice-field'));
	page.key(document.activeElement, 'l');
	assert.equal(document.activeElement.textContent, 'lab');
	page.key(document.activeElement, 'l');
	assert.equal(document.activeElement.textContent, 'legacy', 'the same letter again moves to the next');
	menu.close();
	const searched = new ui.ChoiceMenu({ label: 'Project', options: many().slice(0, 9), search: 8 }).mount(document.body);
	searched.open();
	assert.ok(searched.element.querySelector('.bui-choice-field'), 'a number is the threshold');
	menu.destroy();
	searched.destroy();
});

test('one option that can be chosen is a statement in ChoiceMenu, Select and a radio group; its value is submitted', () => {
	const form = document.body.appendChild(document.createElement('form'));
	const menu = new ui.ChoiceMenu({ label: 'Infrastructure', name: 'infrastructure', options: [{ value: 'docker', label: 'Docker on this computer', status: ['Ready', 'success'] }] }).mount(form);
	assert.equal(menu.stated, true);
	assert.equal(menu.value, 'docker');
	assert.match(menu.element.textContent, /Infrastructure Docker on this computer.*Ready/);
	assert.ok(!menu.element.querySelector('button'), 'nothing to press');
	menu.open();
	assert.equal(menu.expanded, false);
	const select = new ui.Select({ name: 'region', options: [{ value: 'us-east4', label: 'Virginia (us-east4)' }] });
	new ui.Field({ label: 'Region', control: select }).mount(form);
	assert.equal(select.stated, true);
	assert.equal(select.control.tagName, 'OUTPUT');
	assert.equal(form.querySelector(`label[for="${select.control.id}"]`).textContent, 'Region', 'the label names the statement');
	const radios = new ui.Choices({ legend: 'Plan', type: 'radio', name: 'plan', options: [{ value: 'max', label: 'Max' }] }).mount(form);
	assert.equal(radios.stated, true);
	assert.equal(radios.value, 'max');
	const box = new ui.Choices({ legend: 'Terms', name: 'terms', options: [{ value: 'yes', label: 'I agree' }] }).mount(form);
	assert.equal(box.stated, false, 'a single checkbox is a yes or no, not a choice');
	assert.deepEqual(Object.fromEntries(new FormData(form)), { infrastructure: 'docker', region: 'us-east4', plan: 'max' });
	menu.options = [{ value: 'docker', label: 'Docker' }, { value: 'gce', label: 'Compute Engine' }];
	assert.equal(menu.stated, false, 'a second option makes it a choice again');
	assert.ok(menu.element.querySelector('.bui-choice-button'));
	const kept = new ui.ChoiceMenu({ label: 'Engine', statement: false, options: [{ value: 'claude', label: 'Claude Code' }] }).mount(form);
	assert.equal(kept.stated, false);
	assert.equal(new ui.Select({ options: [{ value: 'a', label: 'A', disabled: true }] }).stated, false, 'a disabled option is not stated');
	assert.equal(new ui.ChoiceMenu({ label: 'Engine', options: [{ value: 'claude', label: 'Claude Code' }], actions: [{ label: 'Connect another…', run: () => {} }] }).stated, false, 'an action keeps the menu');
});

test('Field with suggest follows the context until the person edits it, and takes it back when emptied', () => {
	const field = new ui.Field({ label: 'Slug', suggest: 'storefront' }).mount(document.body);
	const mark = field.element.querySelector('.bui-field-suggested');
	assert.equal(field.value, 'storefront');
	assert.equal(mark.hidden, false);
	assert.match(field.element.querySelector('label').textContent, /Slug Suggested/);
	field.suggest = 'storefront-eu';
	assert.equal(field.value, 'storefront-eu', 'a new suggestion is followed');
	field.control.value = 'shop';
	field.control.dispatchEvent(new Event('input'));
	assert.equal(mark.hidden, true);
	assert.equal(field.edited, true);
	field.suggest = 'storefront-us';
	assert.equal(field.value, 'shop', 'the person\'s value stands');
	field.control.value = '';
	field.control.dispatchEvent(new Event('input'));
	field.control.dispatchEvent(new Event('blur'));
	assert.equal(field.value, 'storefront-us', 'an emptied field takes the suggestion back');
	assert.equal(mark.hidden, false);
	field.control.value = 'x';
	field.control.dispatchEvent(new Event('input'));
	field.follow();
	assert.equal(field.value, 'storefront-us');
	const given = new ui.Field({ label: 'Name', suggest: 'web', value: 'api', labels: ui.Field.labels.es });
	assert.equal(given.value, 'api');
	assert.equal(given.edited, true, 'a value given by the product stands');
	assert.equal(given.element.querySelector('.bui-field-suggested').textContent, 'Sugerido');
	assert.ok(!new ui.Field({ label: 'Plain' }).element.querySelector('.bui-field-suggested'));
});

test('Draft carries the known context in the search or in a hash route, and reads it back without anything else', () => {
	const draft = new ui.Draft({ environment: 'env_1', provider: 'gce', agent: 'claude', from: 'conduict', extra: 'x', project: 'prj_1' });
	assert.deepEqual({ ...draft.values }, { environment: 'env_1', provider: 'gce', agent: 'claude', from: 'conduict', for: 'conduict' }, '`for` falls back to `from`');
	assert.equal(draft.address('/conversations/new?q=1&from=desktop'), '/conversations/new?q=1&environment=env_1&provider=gce&agent=claude&from=conduict');
	assert.equal(draft.address('#/acme/storefront/environments?add=repositories'), '#/acme/storefront/environments?add=repositories&environment=env_1&provider=gce&agent=claude&from=conduict');
	assert.equal(draft.address('https://projects.example.test/?project=prj_1'), 'https://projects.example.test/?project=prj_1&environment=env_1&provider=gce&agent=claude&from=conduict');
	const read = ui.Draft.read('https://conduict.example.test/#/acme/web?environment=env_2&agent=codex&for=delegate&from=conduict');
	assert.deepEqual({ ...read.values }, { environment: 'env_2', agent: 'codex', from: 'conduict', for: 'delegate' });
	assert.deepEqual({ ...ui.Draft.read('/?environment=%3Cscript%3E&from=conduict%20now').values }, {}, 'malformed values are dropped');
	assert.equal(ui.Draft.read('').empty, true);
	assert.equal(ui.Draft.read(new URL('https://a.test/?agent=claude')).values.agent, 'claude');
	assert.ok(Object.isFrozen(read.values));
});
