import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

const page = new Page();
const { SideSheet } = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => { page.reset(); document.head.replaceChildren(); });

/** Contract checks drive completion; actual painted frames belong to browser acceptance. */
class Fixture {
	constructor() {
		const style = document.createElement('style');
		style.textContent = '.bui-sheet[data-motion="out"] { animation-name: leaving; animation-duration: 0.12s; }';
		document.head.append(style);
	}
	end(sheet) { sheet.element.dispatchEvent(new Event('animationend')); }
}

test('the native sheet remains modal and unsettled until exit ends, then teardown and focus happen once', async () => {
	const fixture = new Fixture();
	const opener = document.createElement('button');
	document.body.append(opener); opener.focus();
	const values = [];
	const sheet = new SideSheet({ title: 'Machine', onclose: value => values.push(value) });
	const done = sheet.open().then(value => { sheet.destroy(); return value; });
	assert.equal(sheet.close('done'), true);
	await Promise.resolve();
	assert.equal(sheet.shown, true);
	assert.equal(sheet.element.inert, true);
	assert.equal(document.documentElement.style.overflow, 'hidden');
	assert.deepEqual(values, []);
	assert.equal(sheet.close('again'), false);
	assert.equal(document.querySelectorAll('.bui-leaving, .bui-sheet-veil').length, 0);
	fixture.end(sheet);
	assert.equal(await done, 'done');
	assert.deepEqual(values, ['done']);
	assert.equal(document.activeElement, opener);
	assert.equal(sheet.element.isConnected, false);
});

test('reopen cancels exit, keeps the opening promise and ignores the old completion', async () => {
	const fixture = new Fixture();
	const sheet = new SideSheet({ title: 'Machine' });
	const done = sheet.open();
	sheet.close('abandoned');
	assert.equal(sheet.open(), done);
	assert.equal(sheet.element.inert, false);
	fixture.end(sheet);
	assert.equal(sheet.shown, true);
	sheet.close('finished');
	fixture.end(sheet);
	assert.equal(await done, 'finished');
	sheet.destroy();
});

test('missing animation completion is bounded; no animation settles immediately', async () => {
	new Fixture();
	const sheet = new SideSheet({ title: 'Machine' });
	const done = sheet.open();
	sheet.close('bounded');
	assert.equal(await done, 'bounded');
	document.head.replaceChildren();
	const immediate = sheet.open();
	sheet.close('immediate');
	assert.equal(sheet.shown, false);
	assert.equal(await immediate, 'immediate');
	sheet.destroy();
});

test('destroy during exit settles once and leaves no delayed cleanup of a later surface', async () => {
	const fixture = new Fixture();
	const values = [];
	const sheet = new SideSheet({ title: 'Machine', onclose: value => values.push(value) });
	const done = sheet.open();
	sheet.close('destroyed'); sheet.destroy();
	fixture.end(sheet);
	assert.equal(await done, 'destroyed');
	assert.deepEqual(values, ['destroyed']);
	assert.equal(sheet.element.isConnected, false);
});
