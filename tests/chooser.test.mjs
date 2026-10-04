import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { refs } from './fixtures/refs.mjs';
import { inside } from './fixtures/family.mjs';

/** RefChooser, ProjectPicker and SecretField (0.7.0, D56 shared pieces 2 to 4). */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const names = element => [...element.querySelectorAll('[role="menuitemradio"]')].map(node => node.querySelector('.bui-choice-name').textContent);

test('RefChooser: the default branch first and marked, a label above, a search past the threshold, and onchange for a new choice', () => {
	const changes = [];
	const chooser = new ui.RefChooser({ label: 'Base branch', refs: refs(), onchange: value => changes.push(value) }).mount(document.body);
	const label = chooser.element.querySelector('label.bui-field-label');
	assert.equal(label.textContent, 'Base branch');
	assert.equal(label.getAttribute('for'), chooser.control.id);
	chooser.control.click();
	assert.equal(names(chooser.element)[0], 'main');
	assert.match(chooser.element.querySelector('[role="menuitemradio"]').textContent, /Default/);
	assert.ok(chooser.element.querySelector('.bui-choice-field'), 'seventeen branches open with a search field');
	const field = chooser.element.querySelector('.bui-choice-field');
	field.value = 'login';
	field.dispatchEvent(new Event('input'));
	page.key(field, 'Enter');
	assert.equal(chooser.value, 'feature/login-page');
	assert.deepEqual(changes, ['feature/login-page']);
	assert.ok(document.activeElement === chooser.control);
	chooser.value = 'main';
	assert.deepEqual(changes, ['feature/login-page'], 'setting the value calls nothing');
	chooser.destroy();
});

test('RefChooser: "Use a commit or another ref…" opens a field in place, checks Git\'s rules and lists the typed ref first', () => {
	const changes = [];
	const chooser = new ui.RefChooser({ refs: refs().slice(0, 4), value: 'develop', validate: value => (value === 'HEAD' ? 'Choose a branch, not HEAD.' : null), onchange: value => changes.push(value) }).mount(document.body);
	chooser.control.click();
	const escape = chooser.element.querySelector('[role="menuitem"]');
	assert.equal(escape.textContent, 'Use a commit or another ref…');
	escape.click();
	const other = chooser.element.querySelector('.bui-refs-other');
	const input = other.querySelector('input');
	assert.equal(other.hidden, false);
	assert.ok(document.activeElement === input);
	input.value = 'bad name';
	page.key(input, 'Enter');
	assert.match(other.querySelector('.bui-field-error').textContent, /Git can’t use this name/);
	assert.ok(document.activeElement === input, 'focus stays in the field with its error');
	input.value = 'HEAD';
	page.key(input, 'Enter');
	assert.match(other.querySelector('.bui-field-error').textContent, /not HEAD/, 'the product\'s own rule');
	input.value = '';
	page.key(input, 'Enter');
	assert.match(other.querySelector('.bui-field-error').textContent, /Enter a branch, a tag or a commit/);
	input.value = '  4f2a9c1  ';
	page.key(input, 'Enter');
	assert.equal(other.hidden, true);
	assert.equal(chooser.value, '4f2a9c1');
	assert.deepEqual(changes, ['4f2a9c1']);
	chooser.control.click();
	assert.equal(names(chooser.element)[0], '4f2a9c1', 'the typed ref is listed first');
	assert.match(chooser.element.querySelector('[role="menuitemradio"]').textContent, /Commit or other ref/);
	chooser.control.click();
	chooser.other();
	page.key(other.querySelector('input'), 'Escape');
	assert.equal(other.hidden, true);
	assert.ok(document.activeElement === chooser.control, 'Escape cancels back to the chooser');
	assert.equal(ui.RefChooser.labels.es.escape, 'Usar un commit u otra referencia…');
	chooser.destroy();
});

test('RefChooser: loading is a placeholder, unavailable offers Try again and the escape, empty offers the escape; late refs end both', () => {
	let retried = 0;
	const chooser = new ui.RefChooser({ loading: true, labels: ui.RefChooser.labels.es }).mount(document.body);
	assert.ok(chooser.element.querySelector('.bui-skeleton'));
	assert.equal(chooser.element.querySelector('[role="status"]').textContent, 'Cargando las ramas…');
	assert.equal(chooser.element.querySelectorAll('[role="menuitemradio"]').length, 0, 'no made-up list');
	chooser.unavailable = { retry: () => retried++ };
	assert.equal(chooser.element.querySelector('.bui-refs-problem').textContent, 'No se pudieron leer las ramas.');
	chooser.element.querySelector('.bui-refs-actions .bui-button').click();
	assert.equal(retried, 1);
	chooser.element.querySelector('.bui-refs-escape').click();
	assert.equal(chooser.element.querySelector('.bui-refs-other').hidden, false, 'the escape works while the branches are unavailable');
	chooser.refs = [];
	assert.equal(chooser.element.querySelector('.bui-refs-empty').textContent, 'No hay ramas para elegir.');
	assert.ok(chooser.element.querySelector('.bui-refs-escape'));
	chooser.refs = refs().slice(0, 3);
	assert.ok(!chooser.element.querySelector('.bui-refs-problem'));
	assert.equal(names(chooser.element).length, 3);
	const single = new ui.RefChooser({ refs: [{ name: 'main', default: true }], escape: false, layout: 'inline' }).mount(document.body);
	assert.match(single.element.querySelector('.bui-statement').textContent, /Branch main/, 'one branch and no escape is a statement');
	chooser.destroy();
	single.destroy();
});

test('ProjectPicker: the catalog with each project\'s state here, denied ones explained and never chosen, unset ones only on request', () => {
	const chosen = [];
	const projects = [
		{ id: 'prj_s', name: 'Storefront', here: { state: 'used' } },
		{ id: 'prj_a', name: 'Atlas', here: { state: 'unset' } },
		{ id: 'prj_b', name: 'Billing', here: { state: 'denied' } },
		{ id: 'prj_m', name: 'Mobile', here: { mapped: 0 } }
	];
	const picker = new ui.ProjectPicker({ projects, product: 'Delegate', onchange: id => chosen.push(id) }).mount(document.body);
	assert.equal(picker.value, null, 'nothing is chosen for the person');
	picker.control.click();
	assert.deepEqual(names(picker.element), ['Atlas', 'Billing', 'Mobile', 'Storefront']);
	const items = [...picker.element.querySelectorAll('[role="menuitemradio"]')];
	assert.match(items[0].textContent, /Not set up in Delegate/);
	assert.equal(items[1].getAttribute('aria-disabled'), 'true');
	assert.match(items[1].textContent, /No access in Delegate/);
	items[1].click();
	assert.deepEqual(chosen, []);
	items[0].click();
	assert.deepEqual(chosen, ['prj_a']);
	const unset = new ui.ProjectPicker({ projects, product: 'Delegate', only: 'unset', name: 'project' }).mount(document.body);
	unset.control.click();
	assert.deepEqual(names(unset.element), ['Atlas', 'Mobile']);
	const many = new ui.ProjectPicker({ projects: inside.projects.concat(Array.from({ length: 9 }, (_, index) => ({ id: `p${index}`, name: `Project ${index}` }))), product: 'CDN' }).mount(document.body);
	many.control.click();
	assert.ok(many.element.querySelector('.bui-choice-field'), 'past the bar\'s threshold it searches');
	const none = new ui.ProjectPicker({ projects: [], product: 'CDN', labels: ui.ProjectPicker.labels.es }).mount(document.body);
	assert.equal(none.element.querySelector('.bui-refs-empty').textContent, 'No hay proyectos para elegir.');
	for (const item of [picker, unset, many, none]) item.destroy();
});

test('SecretField: Connect first, the paste folded as the last resort, and a stored secret kept until Replace', () => {
	let connected = 0;
	const form = document.body.appendChild(document.createElement('form'));
	const field = new ui.SecretField({ label: 'Supabase access', credential: 'access token', name: 'token', connect: { label: 'Connect Supabase', run: () => connected++ } }).mount(form);
	const connect = field.element.querySelector('.bui-secret-connect');
	assert.equal(connect.textContent, 'Connect Supabase');
	assert.ok(connect.compareDocumentPosition(field.element.querySelector('details')) & Node.DOCUMENT_POSITION_FOLLOWING, 'Connect comes before the paste');
	connect.click();
	assert.equal(connected, 1);
	const fold = field.element.querySelector('details');
	assert.equal(fold.querySelector('summary').textContent, 'Paste the access token instead');
	assert.match(fold.textContent, /Only when connecting isn’t possible/);
	assert.equal(field.control.disabled, true);
	assert.equal(field.value, null);
	assert.deepEqual([...new FormData(form).keys()], [], 'a closed fold submits nothing');
	fold.open = true;
	fold.dispatchEvent(new Event('toggle'));
	assert.equal(field.control.type, 'password');
	assert.equal(field.control.getAttribute('autocomplete'), 'off');
	field.control.value = 'sbp_123';
	assert.equal(field.value, 'sbp_123');
	field.stored = true;
	assert.match(field.element.querySelector('.bui-secret-stored').textContent, /Stored · Replace/);
	assert.equal(field.value, null, 'the stored secret is kept');
	assert.equal(field.control.value, '', 'never shown or kept as a draft');
	assert.deepEqual([...new FormData(form).keys()], []);
	field.element.querySelector('.bui-secret-stored .bui-link-button').click();
	assert.ok(document.activeElement === field.control);
	assert.deepEqual([...new FormData(form).keys()], ['token']);
	field.element.querySelector('.bui-secret-stored .bui-link-button').click();
	assert.equal(field.value, null, '"Keep the stored access token" goes back');
	const spanish = new ui.SecretField({ label: 'Acceso', credential: 'token', stored: true, labels: ui.SecretField.labels.es });
	assert.match(spanish.element.textContent, /Guardado · Reemplazar/);
	assert.ok(!spanish.element.querySelector('.bui-secret-connect'), 'no Connect without a provider integration');
	field.destroy();
});
