import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

/** `ListRow` and `CopyValue` (0.15.0, DQ-12, DQ-09, DQ-05): a dense row that opens its object, with quiet actions and an overflow menu, a check in a picker, patched in place; a copyable mono value. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const react = await import('@beyond-js/ui/react');
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
after(() => page.close());
beforeEach(() => page.reset());

const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const machine = (extra = {}) => ({ title: 'web', href: '/machines/web', meta: ['Standard', null, '2 conversations'], lead: { state: 'ready' }, status: { state: 'busy', label: 'Busy · 1 running' }, facts: ['3 d'], ...extra });

test('a row: its mark, its name opening the object, a muted line, its end; the name never coral, the whole row its target', () => {
	const row = new ui.ListRow(machine({ actions: [{ label: 'Wake', run: () => {} }], menu: [{ label: 'Delete…', tone: 'danger', run: () => {} }] })).mount(document.createElement('ul'));
	const root = row.element;
	assert.equal(root.localName, 'li');
	const title = root.querySelector('a.bui-row-title');
	assert.equal(title.getAttribute('href'), '/machines/web');
	assert.equal(title.textContent, 'web');
	assert.equal(root.querySelector('.bui-row-meta').textContent, 'Standard · 2 conversations', 'empty parts are left out');
	assert.equal(root.querySelector('.bui-row-lead .bui-status-label').textContent, 'Ready', "the lead's words stay for assistive technology");
	assert.equal(root.querySelector('.bui-row-end .bui-status').textContent, 'Busy · 1 running');
	assert.equal(root.querySelector('.bui-row-fact').textContent, '3 d');
	assert.equal(root.querySelector('.bui-row-actions .bui-button-quiet').textContent, 'Wake', 'actions are quiet (DQ-09)');
	const more = root.querySelector('.bui-menu-button');
	assert.equal(more.getAttribute('aria-label'), 'More actions for web');
	assert.ok(root.hasAttribute('data-open'));
	assert.match(sheet, /\.bui-row\[data-open\] \.bui-row-title::after\s*\{[^}]*inset:\s*0/);
	assert.match(sheet, /\.bui-row-title\s*\{[^}]*color:\s*var\(--color-text\)/);
	assert.match(sheet, /@container bui-row \(max-width: 30rem\)/, 'compact on a narrow row, never label and value cards');
	row.destroy();
});

test('a row opened in place runs its action; actions and the menu run theirs and never open the row', () => {
	const calls = [];
	const row = new ui.ListRow({ title: 'Fix the redirect', run: () => calls.push('open'), actions: [{ label: 'Archive', run: () => calls.push('archive') }], menu: [{ label: 'Rename', run: () => calls.push('rename') }], tag: 'div' }).mount(document.body);
	assert.equal(row.element.localName, 'div');
	row.element.querySelector('button.bui-row-title').click();
	row.element.querySelector('.bui-row-actions button').click();
	row.menu.open();
	row.menu.element.querySelector('[role="menuitem"]').click();
	assert.deepEqual(calls, ['open', 'archive', 'rename']);
	row.destroy();
});

test('update patches in place: the focused name keeps focus, the menu keeps its instance, removed parts go', () => {
	const row = new ui.ListRow(machine({ menu: [{ label: 'Delete…', run: () => {} }] })).mount(document.body);
	const name = row.element.querySelector('.bui-row-title');
	const menu = row.menu;
	name.focus();
	row.update(machine({ title: 'web (renamed)', current: true, menu: [{ label: 'Sleep', run: () => {} }, { label: 'Delete…', run: () => {} }] }));
	assert.equal(row.element.querySelector('.bui-row-title'), name);
	assert.equal(document.activeElement, name);
	assert.equal(row.menu, menu);
	assert.equal(name.getAttribute('aria-current'), 'page');
	assert.ok(row.element.hasAttribute('data-current'));
	row.update({ title: 'web' });
	assert.equal(row.menu, null);
	assert.equal(row.element.querySelector('.bui-row-meta').hidden, true);
	assert.equal(row.element.querySelector('.bui-row-end').hidden, true);
	assert.equal(row.element.querySelector('span.bui-row-title').textContent, 'web', 'without href or run it is a name only');
	row.destroy();
});

test('a choice in a picker: a named checkbox before the name, its state the product\'s (DQ-05)', () => {
	const changes = [];
	const row = new ui.ListRow({ title: 'acme/web', meta: 'Already in this project', select: { checked: false, name: 'repository', value: 'acme/web', onchange: checked => changes.push(checked) }, labels: ui.ListRow.labels.es }).mount(document.body);
	const check = row.element.querySelector('input[type="checkbox"].bui-row-check');
	assert.equal(check.getAttribute('aria-label'), 'Elegir acme/web');
	assert.deepEqual([check.name, check.value], ['repository', 'acme/web']);
	check.click();
	assert.deepEqual(changes, [true]);
	row.update({ title: 'acme/web', select: { checked: true, disabled: true } });
	assert.deepEqual([check.checked, check.disabled], [true, true]);
	row.update({ title: 'acme/web' });
	assert.equal(row.element.querySelector('.bui-row-check'), null);
	for (const key of Object.keys(ui.ListRow.labels.en)) assert.ok(key in ui.ListRow.labels.es, key);
	row.destroy();
});

test('CopyValue: mono, its whole value named, cut in its middle keeping its end, copied by its button', async () => {
	const written = [];
	Object.defineProperty(page.window.navigator, 'clipboard', { value: { writeText: async text => written.push(text) }, configurable: true });
	const value = new ui.CopyValue({ value: 'sha256:9f2c1e0b77aa41c2', label: 'the digest', cut: 'middle' }).mount(document.body);
	const text = value.element.querySelector('.bui-copy-value-text');
	assert.equal(text.getAttribute('aria-label'), 'sha256:9f2c1e0b77aa41c2');
	assert.equal(value.element.querySelector('.bui-copy-value-tail').textContent, '0b77aa41c2'.slice(-8));
	const button = value.element.querySelector('button');
	assert.equal(button.getAttribute('aria-label'), 'Copy the digest');
	button.click();
	await page.until(() => written.length === 1);
	assert.deepEqual(written, ['sha256:9f2c1e0b77aa41c2']);
	value.value = 'short';
	assert.equal(value.element.querySelector('.bui-copy-value-tail'), null, 'a short value is not cut');
	const link = new ui.CopyValue({ value: 'https://cdn.example.test/r/4', href: 'https://cdn.example.test/r/4', labels: ui.CopyValue.labels.es }).mount(document.body);
	assert.equal(link.element.querySelector('a.bui-copy-value-text').getAttribute('href'), 'https://cdn.example.test/r/4');
	assert.equal(link.element.querySelector('button').textContent.trim(), 'Copiar');
	value.destroy();
	link.destroy();
});

test('React ListRow and CopyValue drive the same classes and read callbacks from the latest props', async () => {
	const h = React.createElement;
	const host = document.createElement('ul');
	host.className = 'bui-rows';
	document.body.append(host);
	const root = createRoot(host);
	const calls = [];
	const draw = label => React.act(() => root.render(h(react.ListRow, { title: label, run: () => calls.push(label), meta: 'Standard', menu: [{ label: 'Delete', onSelect: () => calls.push(`delete ${label}`) }] })));
	await draw('web');
	await draw('lab');
	assert.equal(host.querySelector('.bui-row-title').textContent, 'lab');
	host.querySelector('.bui-row-title').click();
	assert.deepEqual(calls, ['lab']);
	await React.act(() => root.render(h(react.CopyValue, { value: 'req_1' })));
	assert.equal(host.querySelector('.bui-copy-value-text').textContent, 'req_1');
	await React.act(() => root.unmount());
});
