import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { Page } from './support/page.mjs';

const page = new Page();
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const { ListRow } = await import('@beyond-js/ui/react');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
after(async () => {
	delete globalThis.IS_REACT_ACT_ENVIRONMENT;
	await page.close();
});

/** Renders through the public React adapter; no CSS geometry is inferred from this DOM harness. */
class Rows {
	#host = document.createElement('ul');
	#root;
	#calls = [];

	constructor() {
		document.body.append(this.#host);
		this.#root = createRoot(this.#host);
	}

	async show(actions) {
		await React.act(() => this.#root.render(React.createElement(React.StrictMode, null,
			React.createElement(ListRow, { title: 'acme/portal', actions, run: () => this.#calls.push('row') }))));
	}

	get buttons() {
		return [...this.#host.querySelectorAll('.bui-row-actions > button')];
	}

	get columns() {
		return this.buttons.map(button => button.style.getPropertyValue('--bui-action-column'));
	}

	get calls() {
		return this.#calls;
	}

	async close() {
		await React.act(() => this.#root.unmount());
		this.#host.remove();
	}
}

test(`React ${React.version}: leading and middle empty slots preserve action columns and callbacks`, async t => {
	const rows = new Rows();
	t.after(() => rows.close());
	const calls = [];
	const open = { label: 'Open files', onSelect: () => calls.push('open') };
	const more = { label: 'More', onSelect: () => calls.push('more') };
	await rows.show([null, open]);
	assert.deepEqual(rows.columns, ['2']);
	rows.buttons[0].click();
	await rows.show([open, null, more]);
	assert.deepEqual(rows.columns, ['1', '3']);
	rows.buttons[1].click();
	assert.deepEqual(calls, ['open', 'more']);
	assert.deepEqual(rows.calls, [], 'an action does not open its row');
});

test(`React ${React.version}: the same action moving slots updates its column`, async t => {
	const rows = new Rows();
	t.after(() => rows.close());
	const calls = [];
	const open = { label: 'Open files', onSelect: () => calls.push('open') };
	await rows.show([open, null]);
	assert.deepEqual(rows.columns, ['1']);
	await rows.show([null, open]);
	assert.deepEqual(rows.columns, ['2']);
	rows.buttons[0].click();
	await rows.show([open, null]);
	assert.deepEqual(rows.columns, ['1']);
	rows.buttons[0].click();
	assert.deepEqual(calls, ['open', 'open']);
});

test(`React ${React.version}: a missing action reappears without shifting its neighbor or using stale callbacks`, async t => {
	const rows = new Rows();
	t.after(() => rows.close());
	const calls = [];
	const start = { label: 'New conversation', onSelect: () => calls.push('start') };
	const open = { label: 'Open files', onSelect: () => calls.push('old') };
	await rows.show([start, open]);
	await rows.show([null, open]);
	assert.deepEqual(rows.columns, ['2']);
	await rows.show([start, { ...open, onSelect: () => calls.push('latest') }]);
	assert.deepEqual(rows.columns, ['1', '2']);
	rows.buttons[0].click();
	rows.buttons[1].click();
	await rows.show([start, { ...open, onSelect: () => calls.push('newest') }]);
	rows.buttons[1].click();
	assert.deepEqual(calls, ['start', 'latest', 'newest']);
	assert.deepEqual(rows.calls, []);
});
