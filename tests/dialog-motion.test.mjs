import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Dialog } from '@beyond-js/ui/dom';

const page = new Page();
after(() => page.close());
beforeEach(() => page.reset());

/** A declared animation lets the contract test drive completion without elapsed-time sleeps. */
class Fixture {
	constructor() {
		const style = document.createElement('style');
		style.textContent = '.bui-dialog[data-motion="out"] { animation-name: leaving; animation-duration: 0.12s; }';
		document.head.append(style);
	}
	end(dialog) { dialog.element.dispatchEvent(new Event('animationend')); }
}

test('Dialog holds its modal through the exit, rejects repeated close, then settles once and restores focus', async () => {
	const fixture = new Fixture();
	const opener = document.createElement('button');
	document.body.append(opener); opener.focus();
	const values = [];
	const dialog = new Dialog({ title: 'Rename', onclose: value => values.push(value) });
	const closed = dialog.open();
	assert.equal(dialog.close('saved'), true);
	assert.equal(dialog.shown, true);
	assert.equal(dialog.element.inert, true);
	assert.equal(dialog.close('duplicate'), false);
	fixture.end(dialog);
	assert.equal(await closed, 'saved');
	assert.equal(dialog.shown, false);
	assert.ok(document.activeElement === opener);
	assert.deepEqual(values, ['saved']);
	dialog.destroy();
});

test('Reopening cancels an exit and keeps the same opening; destroy settles the requested value', async () => {
	const fixture = new Fixture();
	const dialog = new Dialog({ title: 'Rename' });
	const closed = dialog.open();
	dialog.close('abandoned');
	assert.ok(dialog.open() === closed);
	assert.equal(dialog.element.inert, false);
	fixture.end(dialog);
	assert.equal(dialog.shown, true);
	dialog.close('kept');
	dialog.destroy();
	assert.equal(await closed, 'kept');
	assert.equal(dialog.element.isConnected, false);
});

test('An exit without animationend ends within the shared bound', async () => {
	new Fixture();
	const dialog = new Dialog({ title: 'Rename' });
	const closed = dialog.open();
	dialog.close('done');
	assert.equal(await closed, 'done');
	assert.equal(dialog.shown, false);
	dialog.destroy();
});
