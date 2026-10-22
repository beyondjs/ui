import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { Page } from './support/page.mjs';

const page = new Page();
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const { ListRow } = await import('@beyond-js/ui/react');
const h = React.createElement;
const Context = React.createContext('default');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
after(async () => { delete globalThis.IS_REACT_ACT_ENVIRONMENT; await page.close(); });

/** A public-adapter fixture; DOM assertions do not claim browser geometry acceptance. */
class Rows {
	#host = document.createElement('ul');
	#root;
	constructor() { document.body.append(this.#host); this.#root = createRoot(this.#host); }
	get element() { return this.#host; }
	async show(props) {
		await React.act(() => this.#root.render(h(React.StrictMode, null, h(Context.Provider, { value: 'inherited' }, h(ListRow, { title: 'Portal', ...props })))));
	}
	async close() { await React.act(() => this.#root.unmount()); this.#host.remove(); }
}

test(`React ${React.version}: row portals render all slots and preserve context and latest callbacks`, async t => {
	const rows = new Rows(); t.after(() => rows.close());
	const calls = [];
	function Meta({ value }) { return h('button', { onClick: () => calls.push(value) }, value); }
	await rows.show({ href: '/portal', meta: ['Branch', h(Meta, { value: 'First' })], facts: [h('time', null, 'Today'), 0], lead: h('b', null, 'P'), status: h('span', { role: 'status' }, 'Ready') });
	assert.equal(rows.element.querySelector('.bui-row-title').getAttribute('href'), '/portal');
	assert.equal(rows.element.querySelector('.bui-row-meta').textContent, 'Branch · First');
	assert.equal(rows.element.querySelector('.bui-row-lead').textContent, 'P');
	assert.equal(rows.element.querySelector('[role=status]').textContent, 'Ready');
	assert.deepEqual([...rows.element.querySelectorAll('.bui-row-fact')].map(item => item.textContent), ['Today', '0']);
	const button = rows.element.querySelector('.bui-row-meta button'); button.focus();
	await rows.show({ href: '/portal', meta: ['Branch', h(Meta, { value: 'Second' })], facts: [h('time', null, 'Tomorrow'), 0], lead: h('b', null, 'P'), status: h('span', { role: 'status' }, 'Ready') });
	assert.equal(rows.element.querySelector('.bui-row-meta button'), button);
	assert.equal(document.activeElement, button);
	await React.act(() => button.click()); assert.deepEqual(calls, ['Second']);
});

test(`React ${React.version}: native row updates retain focused portal input and its selection`, async t => {
	const rows = new Rows(); t.after(() => rows.close());
	const input = () => h('input', { 'aria-label': 'Note', defaultValue: 'Keep this' });
	await rows.show({ title: 'First', meta: input(), actions: [null, { label: 'Open' }] });
	const control = rows.element.querySelector('input'); control.focus(); control.setSelectionRange(2, 5);
	await rows.show({ title: 'Second', meta: input(), actions: [null, { label: 'Open' }], current: true });
	assert.equal(rows.element.querySelector('input'), control); assert.equal(document.activeElement, control);
	assert.equal(control.selectionStart, 2); assert.equal(control.selectionEnd, 5);
	assert.equal(rows.element.querySelector('.bui-row-title').textContent, 'Second');
	assert.equal(rows.element.querySelector('.bui-row-actions > button').style.getPropertyValue('--bui-action-column'), '2');
});

test(`React ${React.version}: strings, native nodes and state descriptors keep their contracts`, async t => {
	const rows = new Rows(); t.after(() => rows.close());
	const node = document.createElement('em'); node.textContent = 'Native';
	await rows.show({ meta: ['main', null, false, node], facts: [node.cloneNode(true)], lead: 'folder', status: { state: 'ready', label: 'Available' } });
	assert.equal(rows.element.querySelector('.bui-row-meta').textContent, 'main · Native');
	assert.equal(rows.element.querySelector('.bui-row-meta em'), node);
	assert.equal(rows.element.querySelector('.bui-row-status, .bui-status')?.textContent, 'Available');
	await rows.show({ meta: h('em', null, 'React'), lead: { state: 'ready', label: h('span', null, 'Ready') }, status: { state: 'ready', label: h('strong', null, 'Live') } });
	assert.equal(rows.element.querySelector('.bui-row-meta').textContent, 'React');
	assert.ok(rows.element.textContent.includes('Live'));
	await rows.show({ meta: null, lead: null, status: null, facts: [] });
	assert.equal(rows.element.querySelector('.bui-row-meta').hidden, true);
	assert.equal(rows.element.querySelector('.bui-row-end').hidden, true);
});

test(`React ${React.version}: content remounts cleanly across labels replacement and releases on unmount`, async () => {
	const rows = new Rows(); let mounted = 0;
	function Child() { React.useEffect(() => { mounted++; return () => { mounted--; }; }, []); return h('span', null, React.useContext(Context)); }
	await rows.show({ meta: h(Context.Provider, { value: 'inherited' }, h(Child)) });
	assert.equal(mounted, 1); assert.equal(rows.element.querySelector('.bui-row-meta').textContent, 'inherited');
	await rows.show({ meta: h(Child), labels: { more: 'Actions for {title}' } });
	assert.equal(mounted, 1); assert.equal(rows.element.querySelector('.bui-row-meta').textContent, 'inherited');
	await rows.close(); assert.equal(mounted, 0);
});

test(`React ${React.version}: adding row activation preserves latest callback and native title semantics`, async t => {
	const rows = new Rows(); t.after(() => rows.close()); const calls = [];
	await rows.show({ meta: h('span', null, 'Details') });
	assert.equal(rows.element.querySelector('.bui-row-title').localName, 'span');
	await rows.show({ meta: h('span', null, 'Details'), run: () => calls.push('old') });
	const title = rows.element.querySelector('.bui-row-title'); title.focus();
	await rows.show({ meta: h('span', null, 'New details'), run: () => calls.push('latest') });
	assert.equal(document.activeElement, title); title.click(); assert.deepEqual(calls, ['latest']);
});

test(`React ${React.version}: a retained native action recovers focus when row metadata changes`, async t => {
	const rows = new Rows(); t.after(() => rows.close());
	await rows.show({ meta: 'First', actions: [null, { label: 'Open' }] });
	rows.element.querySelector('.bui-row-actions > button').focus();
	await rows.show({ meta: 'Second', actions: [null, { label: 'Open' }] });
	assert.equal(document.activeElement, rows.element.querySelector('.bui-row-actions > button'));
});
