import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { Page } from './support/page.mjs';

const page = new Page();
const { ListRow } = await import('@beyond-js/ui/dom');
const { Button } = await import('@beyond-js/ui/react');
const { default: React } = await import('react');
const { renderToStaticMarkup } = await import('react-dom/server');
after(() => page.close());

test('optional actions keep their semantic column and existing direct-child selectors', () => {
	const calls = [];
	const row = new ListRow({ title: 'acme/portal', run: () => calls.push('row'), actions: [null, { label: 'Open files', run: () => calls.push('files') }] });
	const actions = row.element.querySelectorAll('.bui-row-actions > button');
	assert.equal(actions.length, 1);
	assert.equal(actions[0].style.getPropertyValue('--bui-action-column'), '2');
	assert.ok(actions[0].closest('.bui-action-line'));
	actions[0].click();
	assert.deepEqual(calls, ['files']);
	row.update({ title: 'acme/portal', actions: [{ label: 'New conversation', run() {} }, null] });
	assert.equal(row.element.querySelector('.bui-row-actions > button').style.getPropertyValue('--bui-action-column'), '1');
	assert.equal(row.element.querySelectorAll('.bui-row-actions > button').length, 1);
	row.destroy();
});

test('shared React Button preserves consumer layout classes and disabled semantics', () => {
	const markup = renderToStaticMarkup(React.createElement(Button, { className: 'table-action mt-3', label: 'Retry', disabled: true }));
	assert.match(markup, /class="bui-button bui-button-secondary table-action mt-3"/);
	assert.match(markup, /disabled=""/);
	const busy = renderToStaticMarkup(React.createElement(Button, { className: 'table-action', label: 'Retry', busy: true }));
	assert.match(busy, /aria-disabled="true"/);
	assert.match(busy, /data-busy=""/);
});
