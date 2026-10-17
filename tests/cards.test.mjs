import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** `ChoiceCards` (0.16.0, DQ-15) and `Primaries` (0.16.0, DQ-09). */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const react = await import('@beyond-js/ui/react');
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
after(() => page.close());
beforeEach(() => page.reset());

const sizes = [
	{ value: 'small', title: 'Small', detail: 'For one conversation at a time', facts: ['2 cores', '4 GB'], status: ['Default', 'info'] },
	{ value: 'standard', title: 'Standard', facts: ['4 cores', '16 GB'] },
	{ value: 'large', title: 'Large', facts: ['8 cores', '32 GB'], disabled: true, reason: 'Your organization allows Small and Standard' }
];

test('ChoiceCards: native radios in a fieldset, each card its title, detail, facts and state; applied at once; a closed option says why', () => {
	const changes = [];
	const cards = new ui.ChoiceCards({ label: 'Size', options: sizes, value: 'small', onchange: value => changes.push(value) }).mount(document.body);
	const root = cards.element;
	assert.equal(root.localName, 'fieldset');
	assert.equal(root.querySelector('legend').textContent, 'Size');
	const radios = [...root.querySelectorAll('input[type="radio"]')];
	assert.equal(new Set(radios.map(radio => radio.name)).size, 1, 'one group');
	assert.ok(radios[0].checked && root.querySelector('.bui-card-choice').hasAttribute('data-checked'));
	assert.equal(radios[0].getAttribute('aria-describedby'), root.querySelector('.bui-card-body').id);
	assert.equal(root.querySelectorAll('.bui-card-fact').length, 6);
	assert.ok(radios[2].disabled);
	assert.match(root.querySelectorAll('.bui-card-choice')[2].textContent, /allows Small and Standard/);
	radios[1].click();
	assert.deepEqual(changes, ['standard'], 'no Save: the choice applies');
	radios[2].click();
	assert.deepEqual(changes, ['standard'], 'a closed option is never chosen');
	cards.value = 'large';
	assert.equal(cards.value, null, 'a value no option can take chooses nothing');
	cards.value = 'small';
	radios[0].focus();
	cards.options = sizes.slice(0, 2);
	assert.equal(document.activeElement.value, 'small', 'focus stays on its option through new options');
	cards.destroy();
});

test('React ChoiceCards reads onChange from the latest props and applies value', async () => {
	const host = document.createElement('div');
	document.body.append(host);
	const root = createRoot(host);
	const heard = [];
	const draw = (value, mark) => React.act(() => root.render(React.createElement(react.ChoiceCards, { label: 'Size', options: sizes, value, onChange: chosen => heard.push(`${mark}:${chosen}`) })));
	await draw('small', 'a');
	await draw('standard', 'b');
	assert.ok(host.querySelectorAll('input')[1].checked);
	host.querySelectorAll('input')[0].click();
	assert.deepEqual(heard, ['b:small']);
	await React.act(() => root.unmount());
});

test('Primaries warns once for a region with two primary actions; nested regions count their own; hidden ones do not count', async () => {
	const warned = [];
	const root = document.createElement('div');
	root.innerHTML = '<header class="bui-page-header"><button class="bui-button bui-button-primary">Create</button><section class="bui-section"><button class="bui-button bui-button-primary">Add</button></section></header>';
	document.body.append(root);
	const primaries = new ui.Primaries({ root, warn: (message, region) => warned.push([message, region.className]) });
	assert.deepEqual(primaries.check(), [], 'one each');
	const second = Object.assign(document.createElement('button'), { className: 'bui-button bui-button-primary', hidden: true });
	root.querySelector('header').append(second);
	assert.deepEqual(primaries.check(), [], 'a hidden primary is not counted');
	second.hidden = false;
	await new Promise(resolve => setTimeout(resolve, 40));
	assert.equal(warned.length, 1);
	assert.match(warned[0][0], /2 primary actions in one region/);
	assert.equal(warned[0][1], 'bui-page-header');
	primaries.check();
	assert.equal(warned.length, 1, 'once per region');
	primaries.destroy();
	assert.equal(ui.Primaries.enabled, false, 'off outside a development build');
});
