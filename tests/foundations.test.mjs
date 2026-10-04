import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * The approved foundations as the component stylesheet applies them (token set 0.2.0): sentence
 * case, Rubik 300 only at body size and larger, `border-control` on controls, elevation only on what
 * overlaps the page. Read from the built `dist/styles.css`, the file consumers install.
 */
const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selector: selector.trim().replace(/\s+/g, ' '), body }));
const find = selector => rules.filter(rule => rule.selector.split(',').map(part => part.trim()).includes(selector));

test('no capitals by style: nothing is transformed to upper case (D20)', () => {
	assert.doesNotMatch(sheet, /text-transform:\s*(uppercase|capitalize)/);
	for (const selector of ['.bui-badge', '.bui-table thead th', '.bui-table tbody td::before', '.bui-navmenu-heading', '.bui-consequence dt']) {
		assert.ok(find(selector).length, selector);
		for (const rule of find(selector)) assert.doesNotMatch(rule.body, /letter-spacing:\s*0\.0[3-9]|letter-spacing:\s*0\.[1-9]/, selector);
	}
});

test('text below body size never uses Rubik 300 (D09)', () => {
	const small = rules.filter(rule => /font-size:\s*var\(--text-(small|label)\)/.test(rule.body));
	assert.ok(small.length > 20, `${small.length} rules`);
	for (const rule of small) assert.doesNotMatch(rule.body, /--weight-light/, rule.selector);
	assert.doesNotMatch(sheet, /--weight-light/);
});

test('labels are told apart by weight 500, not by case', () => {
	for (const selector of ['.bui-badge', '.bui-table thead th', '.bui-table tbody td::before', '.bui-navmenu-heading']) {
		assert.ok(find(selector).some(rule => /font-weight:\s*var\(--weight-medium\)/.test(rule.body)), selector);
	}
});

test('controls take border-control; dividers and tags keep border-strong (D08)', () => {
	for (const selector of ['.bui-input', '.bui-select-control', '.bui-option-mark', '.bui-toggles', '.bui-menu-button', '.bui-disclosure-button', '.bui-button-secondary']) {
		assert.ok(find(selector).some(rule => /var\(--color-border-control\)/.test(rule.body)), selector);
		for (const rule of find(selector)) assert.doesNotMatch(rule.body, /--color-border-strong/, selector);
	}
	assert.ok(find('.bui-toggle + .bui-toggle').some(rule => /--color-border-strong/.test(rule.body)));
	assert.ok(find('.bui-badge').some(rule => /--color-border-strong/.test(rule.body)));
});

test('elevation only on what overlaps the page: menus, panels, tooltips, toasts, dialogs, side sheets and the sidebar drawer (D10)', () => {
	const overlapping = /\.bui-(menu|disclosure-panel|disclosure-leaving|tooltip|toast|dialog|drawer-panel|sheet)\b/;
	const raised = rules.filter(rule => /box-shadow:\s*var\(--elevation-/.test(rule.body));
	assert.ok(raised.length >= 4, `${raised.length} rules`);
	for (const rule of raised) assert.match(rule.selector, overlapping, rule.selector);
	// Every other shadow is a mark (inset) or none.
	for (const rule of rules.filter(rule => /box-shadow:/.test(rule.body) && !/box-shadow:\s*var\(--elevation-/.test(rule.body))) {
		assert.match(rule.body, /box-shadow:\s*(none|inset\b)/, rule.selector);
	}
});
