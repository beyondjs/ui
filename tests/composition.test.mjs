import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

const page = new Page();
const ui = await import('@beyond-js/ui');
after(() => page.close());
beforeEach(() => page.reset());

test('a body-only notice has no empty heading and keeps one set of technical evidence', () => {
 const notice = ui.callout({ body: 'The machine is not available right now.', tone: 'warning', live: true, details: { text: 'Fixture refusal', request: 'fixture-request' } });
 assert.equal(notice.querySelector('.bui-callout-title'), null);
 assert.equal(notice.getAttribute('role'), 'status');
 assert.equal(notice.querySelectorAll('.bui-details').length, 1);
 assert.ok(notice.querySelector('.bui-callout-body > .bui-details'));
});

test('an inline row changes presentation without replacing its focused opening or menu', () => {
 const options = { title: 'Example organization', href: '#organization', meta: 'Owner', menu: [{ label: 'Settings', run() {} }] };
 const row = new ui.ListRow(options).mount(document.body);
 const title = row.element.querySelector('.bui-row-title');
 const menu = row.menu;
 title.focus();
 row.update({ ...options, inline: true });
 assert.ok(row.element.hasAttribute('data-inline'));
 assert.ok(title === row.element.querySelector('.bui-row-title'));
 assert.ok(document.activeElement === title);
 assert.ok(menu === row.menu);
 row.update(options);
 assert.equal(row.element.hasAttribute('data-inline'), false);
 row.destroy();
});

test('installation unavailability is a warning state with its own meaning, not Needs attention', () => {
 const status = new ui.Status({ state: 'unavailable' });
 assert.equal(status.state, 'unavailable');
 assert.equal(status.label, 'Not available right now');
 assert.equal(ui.Status.tone('unavailable'), 'attention');
 assert.equal(ui.Status.labels.es.unavailable, 'No disponible ahora');
 status.destroy();
});
