import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

/**
 * One inset (D184) in the built stylesheet and in the markup it relies on: each box names its inset on the
 * spacing scale; where the box's own text starts or ends it, its padding takes off the line's half-leading
 * (`calc(inset - (1lh - 1cap) / 2)`) only where `lh` and `cap` exist; a heading, a label or code that leads a box
 * trims itself to its capitals only where `text-box` exists; without them each box keeps its earlier padding;
 * a borderless close glyph ends one inset from the end. The browser acceptance's `insets` checks measure it.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const order = readFileSync(new URL('../tools/build.mjs', import.meta.url), 'utf8');

/** The bodies of every conditional block whose prelude is exactly `prelude`, joined. */
function blocks(prelude) {
	const found = [];
	for (let at = sheet.indexOf(prelude); at !== -1; at = sheet.indexOf(prelude, at + 1)) {
		let depth = 0;
		const start = sheet.indexOf('{', at);
		for (let index = start; index < sheet.length; index += 1) {
			if (sheet[index] === '{') depth += 1;
			if (sheet[index] === '}' && --depth === 0) {
				found.push(sheet.slice(start + 1, index));
				break;
			}
		}
	}
	return found.join('\n');
}
const rule = (text, selector, declaration) => new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{[^}]*${declaration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
const units = blocks('@supports (padding-top: calc(1lh - 1cap))');
const trims = blocks('@supports (text-box: trim-start cap alphabetic)');

test('every box names its inset as a step of the spacing scale', () => {
	const named = [
		['.bui-callout', '--bui-callout-inset', 'var(--space-4)'],
		['.bui-unavailable', '--bui-unavailable-inset', 'var(--space-6)'],
		['.bui-recovery', '--bui-recovery-inset', 'var(--space-4)'],
		[".bui-recovery[data-recovery='page']", '--bui-recovery-inset', 'var(--space-6)'],
		['.bui-empty:not(.bui-empty-unframed)', '--bui-empty-inset', 'var(--space-4)'],
		['.bui-command', '--bui-command-inset', 'var(--space-4)'],
		['.bui-awaited', '--bui-awaited-inset', 'var(--space-4)'],
		['.bui-card-choice', '--bui-card-inset', 'var(--space-3)'],
		['.bui-checklist', '--bui-checklist-inset', 'var(--space-4)'],
		['.bui-page-aside[data-raised]', '--bui-panel-inset', 'var(--space-5)'],
		['.bui-select', '--bui-select-inset', 'var(--space-3)'],
		['.bui-choice-button', '--bui-choice-inset', 'var(--space-3)'],
		['.bui-dialog', '--bui-dialog-inset', 'var(--space-5)'],
		['.bui-sheet', '--bui-sheet-inset', 'var(--space-5)'],
		['.bui-toast', '--bui-toast-inset', 'var(--space-3)'],
		['.bui-menu', '--bui-menu-inset', 'var(--space-4)'],
		['.bui-notice', '--bui-notice-inset', 'var(--space-2)'],
		['.bui-turns-preview', '--bui-preview-inset', 'var(--space-3)'],
		['.bui-palette', '--bui-palette-inset', 'var(--space-4)']
	];
	for (const [selector, name, value] of named) assert.match(sheet, rule(sheet, selector, `${name}: ${value}`), `${selector} names ${name}`);
	assert.match(sheet, /\.bui-raised,\s*\.bui-section\[data-raised\]\s*\{\s*--bui-raised-inset:\s*var\(--space-4\)/);
	assert.match(sheet, /\.bui-consequence,\s*\.bui-details-body,\s*\.bui-help-panel,\s*\.bui-copy-text,\s*\.bui-textarea\s*\{\s*--bui-text-inset:\s*var\(--space-3\)/);
	assert.match(sheet, /@media \(max-width: 480px\)\s*\{\s*\.bui-unavailable,\s*\.bui-recovery\[data-recovery='page'\]\s*\{\s*--bui-unavailable-inset:\s*var\(--space-4\);\s*--bui-recovery-inset:\s*var\(--space-4\)/, 'a narrow notice keeps a narrower inset, as its padding did');
});

test("where a box's own text starts or ends it, its padding takes off the line's half-leading, only where lh and cap exist", () => {
	for (const [selector, declaration] of [
		['.bui-callout', 'padding-block: calc(var(--bui-callout-inset) - (1lh - 1cap) / 2)'],
		[':is(.bui-help-panel, .bui-copy-text, .bui-textarea, .bui-details-body)', 'padding-block: calc(var(--bui-text-inset) - (1lh - 1cap) / 2)'],
		['.bui-toast', 'padding-block: calc(var(--bui-toast-inset) - (1lh - 1cap) / 2)'],
		['.bui-menu-item', 'padding-block: calc(var(--bui-menu-inset, var(--space-4)) - var(--space-1) - (1lh - 1cap) / 2)'],
		['.bui-notice', 'padding-block: calc(var(--bui-notice-inset) - (1lh - 1cap) / 2)'],
		['.bui-card-choice', 'padding-block: var(--bui-card-inset) calc(var(--bui-card-inset) - (1lh - 1cap) / 2)'],
		['.bui-palette-status', 'padding-block: calc(var(--bui-palette-inset, var(--space-4)) - (1lh - 1cap) / 2)']
	])
		assert.match(units, rule(units, selector, declaration), `${selector}: ${declaration}`);
	assert.match(units, /\.bui-callout:has\([^{]*\.bui-callout-actions[^{]*\{\s*padding-block-end:\s*var\(--bui-callout-inset\)/, 'a callout ending in its actions or details keeps the inset under their edges');
	assert.match(units, rule(units, '.bui-awaited-head', 'margin-block-start: calc((1cap - 1lh) / 2)'), "the awaited card's head stands on its title's capitals");
	assert.match(units, rule(units, '.bui-toast > .bui-icon-button', 'margin-block: calc((1lh - var(--bui-target)) / 2)'), 'the close button never grows a toast');
	assert.match(units, rule(units, '.bui-palette-search', 'padding-block: calc(var(--bui-palette-inset, var(--space-4)) - (var(--bui-target) - 1cap) / 2)'), "the palette's field keeps its words one inset from the top and its divider");
	assert.match(sheet, /@supports \(padding-top: calc\(1cap\)\)\s*\{[^@]*\.bui-summary\s*\{[^}]*display:\s*flex;[^}]*margin-block-end:\s*calc\(\(1cap - var\(--bui-target\)\) \/ 2\)/, "folded technical details at a box's end hang their summary's target below its words");
	assert.match(sheet, /\.bui-step-body\s*\{\s*padding-top:\s*max\(0px, calc\(\(24px - 1lh\) \/ 2\)\)/, "a step's first line is centred on its mark");
});

test('a heading, a label or code that leads a box trims itself to its capitals, only where text-box exists', () => {
	assert.match(trims, rule(trims, ':is(.bui-dialog-title, .bui-sheet-title)', 'text-box: trim-start cap alphabetic'));
	assert.match(trims, rule(trims, ':is(.bui-dialog-head, .bui-sheet-head) > .bui-icon-button', 'margin-block-start: calc((1cap - var(--bui-target)) / 2)'), 'the close button centred on the title\'s capitals');
	assert.match(trims, /:is\(\.bui-unavailable-title, [^)]*\.bui-command-title[^{]*\{\s*text-box:\s*trim-start cap alphabetic/);
	assert.match(trims, rule(trims, '.bui-consequence > :first-child > dt', 'text-box: trim-start cap alphabetic'));
	assert.match(trims, rule(trims, '.bui-consequence > :last-child > dd', 'text-box: trim-end cap alphabetic'));
	assert.match(trims, /:not\(\.bui-activity-exchange \*\) > code\s*\{\s*display:\s*block;\s*text-box:\s*trim-both cap alphabetic/, "a code block's own code trims in the face it is drawn in");
	assert.match(trims, rule(trims, ':is(.bui-unavailable-icon, .bui-recovery[data-recovery=\'page\'] .bui-recovery-mark)', 'margin-block-start: calc((1cap - var(--space-6)) / 2)'), "a notice's mark centred on its title's capitals");
});

test('without those units every box keeps its earlier padding, and the insets come after every component', () => {
	for (const [selector, padding] of [
		['.bui-callout', 'padding: var(--space-3) var(--space-4)'],
		['.bui-toast', 'padding: var(--space-2) var(--space-2) var(--space-2) var(--space-3)'],
		['.bui-dialog-head', 'padding: var(--space-4) var(--space-4) 0 var(--space-5)'],
		['.bui-sheet-head', 'padding: var(--space-4) var(--space-4) 0 var(--space-5)'],
		['.bui-help-panel', 'padding: var(--space-3)'],
		['.bui-menu-item', 'padding: var(--space-2) var(--space-3)'],
		['.bui-notice', 'padding: var(--space-2)'],
		['.bui-unavailable', 'padding: var(--space-6)'],
		['.bui-recovery', 'padding: var(--space-3) var(--space-4)'],
		['.bui-empty', 'padding: var(--space-6) var(--space-4)']
	])
		assert.match(sheet, rule(sheet, selector, padding), `${selector} keeps ${padding} as the fallback`);
	assert.match(order, /'links', 'insets', 'insets-floating', 'floating'\]/, 'late in the cascade, before the floating surfaces\' placement');
	assert.ok(sheet.indexOf('--bui-callout-inset') > sheet.indexOf('.bui-callout-actions'), 'after the component stylesheets');
});

test('a borderless close glyph ends one inset from the end: its target hangs past it', () => {
	assert.match(sheet, rule(sheet, '.bui-dialog-head', 'padding-inline-end: calc(var(--bui-dialog-inset, var(--space-5)) - (var(--bui-target) - 18px) / 2)'));
	assert.match(sheet, rule(sheet, '.bui-sheet-head', 'padding-inline-end: calc(var(--bui-sheet-inset, var(--space-5)) - (var(--bui-target) - 18px) / 2)'));
	assert.match(units, rule(units, '.bui-toast', 'padding-inline-end: calc(var(--bui-toast-inset) - (var(--bui-target) - 18px) / 2)'));
	assert.match(sheet, rule(sheet, '.bui-select > .bui-icon', 'right: calc(var(--bui-select-inset) + 1px)'), "a select's chevron ends one inset from its border");
	assert.match(sheet, rule(sheet, '.bui-choice-button', 'padding-inline: var(--bui-choice-inset)'), "a choice's chevron too");
});

test('the components draw the parts the insets hold', () => {
	const dialog = new ui.Dialog({ title: 'Rename area', children: [] }).mount(document.body);
	assert.ok(dialog.element.querySelector(':scope > .bui-dialog-head > .bui-dialog-title') && dialog.element.querySelector(':scope > .bui-dialog-head > .bui-icon-button'), "a dialog's head holds its title and its close button");
	const sheet = new ui.SideSheet({ title: 'Add repositories' }).mount(document.body);
	assert.ok(sheet.element.querySelector('.bui-sheet-head > .bui-sheet-title') && sheet.element.querySelector('.bui-sheet-head > .bui-icon-button'), "a side sheet's head too");
	const note = ui.callout({ tone: 'danger', title: 'The snapshot did not finish', body: 'Start it again.', details: { text: 'timeout', request: 'req_1', time: Date.now() } });
	assert.ok(note.querySelector(':scope > .bui-callout-body > .bui-details:last-child > .bui-summary'), "a failure's technical details end its callout, their summary first");
	const toaster = new ui.Toaster().mount(document.body);
	toaster.show('Machine renamed', { detail: 'Its conversations keep their history.' });
	const toast = document.querySelector('.bui-toast');
	assert.ok(toast.querySelector(':scope > .bui-icon') && toast.querySelector(':scope > .bui-toast-text > .bui-toast-detail') && toast.querySelector(':scope > .bui-icon-button'), 'a toast: its mark, its words with a detail, its close button');
	const missing = new ui.Unavailable({ title: 'Workspace is not open to you yet', reason: 'By invitation.', details: { text: 'refused', request: 'req_2', time: Date.now() } });
	assert.ok(missing.element.querySelector(':scope > .bui-unavailable-icon') && missing.element.querySelector(':scope > .bui-unavailable-body > .bui-unavailable-title:first-child') && missing.element.querySelector(':scope > .bui-unavailable-body > .bui-details:last-child'), "Unavailable: its mark beside its title, its details last");
	const details = new ui.TechnicalDetails({ text: 'dial tcp: i/o timeout', request: 'req_3', time: Date.now() });
	assert.ok(details.element.querySelector('.bui-details-body > .bui-details-content > .bui-details-text:first-child'), 'technical details lead with their words');
	const card = new ui.CommandCard({ title: 'Claude Code asks to run a command', command: 'npm test' }).mount(document.body);
	assert.ok(card.element.querySelector(':scope > .bui-command-title:first-child') && card.element.querySelector(':scope > .bui-command-code > code'), 'a request leads with its title; its command is code inside its block');
	const recovery = new ui.Recovery({ title: 'Beyond Accounts did not answer' });
	assert.ok(recovery.element.querySelector(':scope > .bui-recovery-mark') && recovery.element.querySelector(':scope > .bui-recovery-words > .bui-recovery-title'), 'Recovery: its mark and its words');
	const lost = ui.consequence({ lost: 'The machine', recovery: 'It cannot be undone.' });
	assert.ok(lost.querySelector(':scope > :first-child > dt') && lost.querySelector(':scope > :last-child > dd'), 'a consequence: a label first, words last');
	for (const component of [dialog, sheet, toaster, missing, details, card, recovery]) component.destroy();
});

test("a side sheet's actions stand one inset from its bottom and divider, and a code box's <code> takes the box's monospace", () => {
	assert.match(sheet, /\.bui-sheet-actions\s*\{\s*padding:\s*var\(--bui-sheet-inset,\s*var\(--space-5\)\)/, 'the sheet\'s actions at its inset, not 12 px');
	// The browser's own style gives <code> its default monospace (Courier in Chrome): the box's face is inherited
	assert.match(sheet, /:is\(\.bui-command-code,\s*\.bui-copy-command,\s*\.bui-activity-code\)\s*>\s*code\s*\{\s*font:\s*inherit/);
});

test('an editable command keeps its first line one inset from its top, and a single-line control at compact density and on a touch screen keeps its sides to the room above its capitals (0.35.0)', () => {
	assert.match(units, rule(units, '.bui-command-edit', 'padding-block-start: calc(var(--bui-code-inset) - (1lh - 1cap) / 2)'), 'the textarea, which trims nothing, takes off its own half-leading');
	const lines = blocks('@supports (padding-top: calc(1cap))');
	assert.match(lines, /:root\[data-density='compact'\] :is\(input\.bui-input, \.bui-select, \.bui-choice-button\)\s*\{\s*--bui-line-inset:\s*calc\(\(var\(--bui-control\) - 2px - 1cap\) \/ 2\)/, 'compact density');
	assert.match(lines, /@media \(pointer: coarse\)\s*\{\s*:is\(input\.bui-input, \.bui-select, \.bui-choice-button\)\s*\{\s*--bui-line-inset:/, 'a touch screen');
	for (const [selector, declaration] of [['.bui-select', '--bui-select-inset: var(--bui-line-inset, var(--space-3))'], ['.bui-choice-button', '--bui-choice-inset: var(--bui-line-inset, var(--space-3))']]) {
		assert.match(lines, rule(lines, selector, declaration), `${selector}: ${declaration}, 12 px where the control is the comfortable 36 px`);
	}
	// The fields' and selects' base rules read it, early in the cascade, so a field's own padding still wins (a search's glyph)
	assert.match(sheet, /\.bui-input,\s*\.bui-select-control\s*\{[^}]*padding:\s*0 var\(--bui-line-inset, var\(--space-3\)\)/);
	assert.match(sheet, /\.bui-select-control\s*\{[^}]*padding-right:\s*calc\(var\(--bui-line-inset, var\(--space-3\)\) \+ 22px\)/);
	assert.doesNotMatch(lines, /input\.bui-input\s*\{[^}]*padding|\.bui-select > \.bui-select-control\s*\{[^}]*padding/, 'no late padding of its own, which would beat a field\'s');
	assert.match(sheet, /\.bui-sidebar-query\s*\{[^}]*padding-inline-start:\s*calc\(var\(--space-2\) \* 2 \+ 16px\)/, 'the sidebar\'s search keeps its words after its glyph');
	assert.doesNotMatch(sheet.replace(/@supports \(padding-top: calc\(1cap\)\)\s*\{[\s\S]*?\n\}/g, ''), /--bui-line-inset:/, 'without cap the controls keep their 12 px');
});

test('the recovery line\'s words, wrapping beside Try again, take off their half-leading on both sides in its wide form only (0.35.0)', () => {
	assert.match(units, /@media \(min-width: 481px\)\s*\{\s*\.bui-recovery:not\(\[data-recovery='page'\]\) > \.bui-recovery-words\s*\{\s*margin-block:\s*calc\(\(1cap - 1lh\) \/ 2\)/);
	assert.match(units, /\.bui-recovery\[data-offline\]:not\(\[data-recovery='page'\]\) > \.bui-recovery-mark\s*\{\s*margin-block:\s*calc\(\(1cap - 18px\) \/ 2\);\s*font-size:\s*var\(--text-body\)/, 'offline, with no Try again, the mark does not grow the line (0.35.0)');
	assert.doesNotMatch(sheet.replace(/@supports \(padding-top: calc\(1lh - 1cap\)\)\s*\{[\s\S]*?\n\}/g, ''), /\.bui-recovery-words\s*\{[^}]*margin-block:\s*calc\(\(1cap/, 'only where lh and cap exist');
});

test("on a touch screen a menu's entry, an action menu's or a choice's, centres its words in its 44 px target, its sides keeping that room, only where lh and cap exist (0.35.0)", () => {
	assert.match(units, /@media \(pointer: coarse\)\s*\{\s*\.bui-menu \.bui-menu-item\s*\{\s*justify-content:\s*center;\s*padding:\s*calc\(\(var\(--bui-target\) - 1lh\) \/ 2\) calc\(\(var\(--bui-target\) - 1cap\) \/ 2\)/);
	assert.doesNotMatch(sheet.replace(/@supports \(padding-top: calc\(1lh - 1cap\)\)\s*\{[\s\S]*?\n\}/g, ''), /\.bui-menu \.bui-menu-item\s*\{[^}]*justify-content/, 'without them an entry keeps its earlier padding');
	// The rule names every menu's entries: an action menu's list, and a choice's panel around its list
	const menu = new ui.ActionMenu({ label: 'More actions', items: [{ label: 'Duplicate', run: () => undefined }] });
	assert.ok(menu.element.querySelector('.bui-menu .bui-menu-item'), "an action menu's entries");
	const choice = new ui.ChoiceChip({ label: 'Effort', options: [{ value: 'low', label: 'Low' }, { value: 'high', label: 'High' }], value: 'low' }).mount(document.body);
	assert.ok(choice.element.querySelector('.bui-menu .bui-menu-item'), "a choice's entries");
	for (const component of [menu, choice]) component.destroy();
});
