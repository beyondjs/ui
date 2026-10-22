import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Page } from './support/page.mjs';

/**
 * A heading outranks what it names (0.19.0, D158): every title the components draw is semibold and takes
 * its level's size, read from the built `dist/styles.css`; every heading element they draw is either a
 * title or a label by design (`data-bui-label`); and `Hierarchy`, the warning a development build gives,
 * names a heading that is lighter than semibold or outranked in its region, once, and nothing else.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const root = fileURLToPath(new URL('..', import.meta.url));
const sheet = readFileSync(join(root, 'dist/styles.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selector: selector.trim().replace(/\s+/g, ' '), body }));
const find = selector => rules.filter(rule => rule.selector.split(',').map(part => part.trim()).includes(selector));
const declares = (selector, pattern) => find(selector).some(rule => pattern.test(rule.body));
const semibold = /font-weight:\s*var\(--weight-semibold\)/;

/** Every title the components draw: a page, a section, a panel, a sheet, a dialog, a menu's head, a message */
const titles = ['.bui-page-heading', '.bui-page-compact-title', '.bui-section-title', '.bui-page-panel-title', '.bui-sheet-title', '.bui-dialog-title', '.bui-drawer-title', '.bui-unavailable-title', '.bui-facts-title', '.bui-checklist-title', '.bui-awaited-title', '.bui-statusrow-title', '.bui-notify-title', '.bui-family-name', '.bui-family-product .bui-navmenu-section:first-child > .bui-navmenu-heading', '.bui-callout-title', '.bui-empty-title', '.bui-command-title', '.bui-toast-title', '.bui-card-title'];

test('every title is semibold, so weight tells it from its text as well as size (D127, D158)', () => {
	for (const selector of titles) {
		assert.ok(find(selector).length, `${selector} has a rule`);
		assert.ok(declares(selector, semibold), `${selector} is semibold`);
		for (const rule of find(selector)) assert.doesNotMatch(rule.body, /font-weight:\s*var\(--weight-(medium|regular)\)/, selector);
	}
});

test('a heading takes its level\'s size: a side sheet\'s title is a panel\'s, and a section inside it is one step below (D158)', () => {
	assert.ok(declares('.bui-sheet-title', /font-size:\s*var\(--text-title-2\)/), 'the sheet title is title-2, as the page panel\'s');
	assert.ok(declares('.bui-page-panel-title', /font-size:\s*var\(--text-title-2\)/));
	assert.ok(declares('.bui-section-title', /font-size:\s*var\(--text-title-2\)/), 'a section of a page');
	assert.ok(declares('h3.bui-section-title', /font-size:\s*var\(--text-title-3\)/), 'a section at level 3');
	assert.ok(declares('.bui-dialog-title', /font-size:\s*var\(--text-title-3\)/), 'a dialog holds no sections: title-3 above body text');
});

test('a label by design keeps the label role, quieter than its rows: menu groups, notice days, list headings', () => {
	for (const selector of ['.bui-navmenu-heading', '.bui-notice-day', '.bui-picker-heading', '.bui-sidebar-heading']) {
		assert.ok(declares(selector, /font-size:\s*var\(--text-label\)/), `${selector} at the label size`);
		assert.ok(declares(selector, /color:\s*var\(--color-text-muted\)/), `${selector} muted`);
	}
});

test('every heading element a component draws is a semibold title or a label by design (data-bui-label)', () => {
	const sources = [];
	const walk = directory => {
		for (const entry of readdirSync(directory, { withFileTypes: true })) {
			const path = join(directory, entry.name);
			if (entry.isDirectory()) walk(path);
			else if (entry.name.endsWith('.js')) sources.push(path);
		}
	};
	walk(join(root, 'src/dom'));
	walk(join(root, 'src/react'));
	const drawn = [];
	for (const path of sources) {
		const text = readFileSync(path, 'utf8');
		// el('h2', { … }), el(`h${level}`, { … }), el(level === 3 ? 'h3' : 'h2', { … }) and React's h(…) alike
		for (const match of text.matchAll(/\b(?:el|h)\(\s*(?:'h[1-6]'|`h\$\{[^}]+\}`|[^,()]*\?\s*'h[1-6]'\s*:\s*'h[1-6]')\s*,\s*\{([^}]*)\}/g)) {
			const props = match[1];
			const name = /class(?:Name)?:\s*'([^']+)'/.exec(props)?.[1];
			if (name) drawn.push({ path: path.slice(root.length), name, label: /'data-bui-label':\s*true/.test(props) });
		}
	}
	assert.ok(drawn.length >= 12, `${drawn.length} heading elements found`);
	for (const { path, name, label } of drawn) {
		const selector = `.${name.split(' ')[0]}`;
		if (label) assert.ok(!declares(selector, semibold), `${path}: ${selector} is a label by design, not a title`);
		else assert.ok(declares(selector, semibold), `${path}: ${selector} is a heading, so semibold, or a label by design marked data-bui-label`);
	}
});

/** A paint read from data attributes: happy-dom lays nothing out, so a test says what a browser would draw */
const painted = node => ({ size: Number(node.dataset.size ?? 15), weight: Number(node.dataset.weight ?? 400), shown: node.dataset.shown !== 'no' });
const region = html => {
	const host = document.createElement('div');
	host.innerHTML = html;
	document.body.append(host);
	return host;
};

test('Hierarchy names a heading lighter than semibold, and one outranked by text in the region it names, once each', () => {
	const warned = [];
	const host = region(`
		<section aria-labelledby="state"><h3 id="state" data-size="12" data-weight="500">State</h3><p>Asleep</p></section>
		<section aria-labelledby="load"><h3 id="load" data-size="12" data-weight="600">Load</h3><span data-size="13">Processor</span></section>
		<section aria-labelledby="sleep"><h3 id="sleep" data-size="16" data-weight="600">When it sleeps</h3><p data-size="15">Put to sleep at 17:08</p><a data-size="15">Change when it sleeps</a></section>`);
	const hierarchy = new ui.Hierarchy({ root: host, warn: (message, heading) => warned.push([message, heading.id]), measure: painted, wait: 10 });
	const found = hierarchy.check();
	assert.deepEqual(found.map(item => [item.heading.id, item.reason]), [['state', 'weight'], ['load', 'outranked']]);
	assert.equal(found[1].by.text, 'Processor');
	assert.equal(found[1].by.size, 13);
	assert.match(warned[0][0], /the heading "State" is 500; a heading is semibold/);
	assert.match(warned[1][0], /the heading "Load" \(12 px, 600\) is outranked in the region it names by "Processor" \(13 px, 400\)/);
	hierarchy.check();
	assert.equal(warned.length, 2, 'once per heading');
	hierarchy.destroy();
});

test('as large and heavier outranks a heading; as large and lighter does not; a region is the one the heading names', () => {
	const host = region(`
		<div data-bui-region><h2 id="lab" data-size="15" data-weight="600">lab</h2><p data-size="15" data-weight="400">Your machine in Storefront</p></div>
		<div data-bui-region><h2 id="usage" data-size="15" data-weight="600">Usage</h2><strong data-size="15" data-weight="700">$10.22</strong></div>
		<div data-bui-region><p data-size="26">Outside the region the heading names</p><section aria-labelledby="named"><h2 id="named" data-size="16" data-weight="600">Named</h2><p data-size="15">Inside</p></section></div>`);
	const found = new ui.Hierarchy({ root: host, warn: () => null, measure: painted, wait: 10 }).check();
	assert.deepEqual(found.map(item => [item.heading.id, item.reason, item.by?.text]), [['usage', 'outranked', '$10.22']]);
});

test('a label by design, a hidden heading and hidden text are not checked; a heading\'s words are read where they are drawn', () => {
	const host = region(`
		<section aria-labelledby="today"><h3 id="today" data-bui-label data-size="12" data-weight="500">Today</h3><p data-size="15">Fix the checkout redirect</p></section>
		<section aria-labelledby="gone" hidden><h3 id="gone" data-size="12" data-weight="500">Gone</h3></section>
		<section aria-labelledby="quiet"><h3 id="quiet" data-size="16" data-weight="600">Quiet</h3><p data-size="40" data-shown="no">Folded away</p></section>
		<section aria-labelledby="file"><h3 id="file" data-size="16" data-weight="400"><button data-size="16" data-weight="600">Changed files</button></h3><p data-size="13">src/app.js</p></section>`);
	const found = new ui.Hierarchy({ root: host, warn: () => null, measure: painted, wait: 10 }).check();
	assert.deepEqual(found, [], 'the file heading draws its words in a semibold button; nothing else is checked');
});

test('Hierarchy checks again after a change, waits for the page to settle, and is off outside a development build', async () => {
	const warned = [];
	const host = region('<section aria-labelledby="state"><h3 id="state" data-size="16" data-weight="600">State</h3><p data-size="15">Asleep</p></section>');
	const hierarchy = new ui.Hierarchy({ root: host, warn: message => warned.push(message), measure: painted, wait: 10 });
	await new Promise(resolve => setTimeout(resolve, 40));
	assert.equal(warned.length, 0, 'a heading that outranks its text');
	host.querySelector('p').dataset.size = '19';
	host.querySelector('p').textContent = 'Asleep since 17:08';
	await new Promise(resolve => setTimeout(resolve, 60));
	assert.equal(warned.length, 1, 'the change was checked');
	hierarchy.destroy();
	assert.equal(ui.Hierarchy.enabled, false, 'off outside a development build');
	assert.equal(ui.Hierarchy.weight, 600);
});


test('subgroups exclude preceding parent titles and peer content; ARIA headings and container exemptions stay checked', () => {
	const host = region(readFileSync(join(root, 'tests/fixtures/hierarchy-groups.html'), 'utf8'));
	const hierarchy = new ui.Hierarchy({ root: host, warn: () => null, measure: painted });
	assert.deepEqual(hierarchy.check().map(item => [item.heading.id, item.reason]), [['role', 'weight'], ['blanket', 'weight']]);
	hierarchy.destroy();
});
