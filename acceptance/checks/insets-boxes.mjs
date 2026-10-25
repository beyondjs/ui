/**
 * The boxes the insets check measures (D184), page by page: each `step` opens what it needs on the page
 * already loaded and names the boxes it then measures. A box's `inset` is its custom property (read on the box)
 * or the number its padding already keeps; `sides` lists what is held to that inset within a pixel (all four
 * unless said), `free` the sides that may hold free room but never come closer (a textarea taller than its
 * words, a last row that is the product's own); an empty `sides` measures a box for the record only, a box
 * that cannot keep one inset without a design decision. A right side a short line does not reach is free room
 * by itself (the measurement's `free`).
 */
const es = consumer => consumer.name !== 'dom';
const closed = async page => (await page.keyboard.press('Escape'), page.waitForFunction(() => !document.querySelector('dialog.bui-dialog[open]')));
const palette = async page => {
	await page.locator('.bui-composer-field').focus();
	const apple = await page.evaluate(() => /mac|iphone|ipad/i.test(navigator.platform));
	await page.keyboard.press(apple ? 'Meta+k' : 'Control+k');
	await page.waitForSelector('dialog.bui-palette[open]');
	await page.keyboard.type('a');
	await page.waitForSelector('.bui-palette-group[data-source="machines"] [role="option"]');
};
const record = [];

export const pages = {
	notices: [
		{
			file: 'insets.html',
			steps: [
				{ boxes: [
					{ name: 'callout ending in actions', box: '#callout-actions .bui-callout', inset: '--bui-callout-inset' },
					{ name: 'callout ending in text', box: '#callout-text .bui-callout', inset: '--bui-callout-inset' },
					{ name: 'callout ending in folded technical details', box: '#callout-details .bui-callout', inset: '--bui-callout-inset' },
					{ name: 'framed empty state', box: '#empty .bui-empty', inset: '--bui-empty-inset' },
					{ name: 'checklist', box: '#checklist .bui-checklist', inset: '--bui-checklist-inset', free: ['bottom'] },
					{ name: 'raised section', box: '#section .bui-section', inset: '--bui-raised-inset' },
					{ name: 'textarea', box: '#notes textarea', field: true, inset: '--bui-text-inset', free: ['bottom'] },
					{ name: 'Unavailable ending in text', box: '#refusal .bui-unavailable', inset: '--bui-unavailable-inset' },
					{ name: 'Recovery whose words wrap beside Try again', box: '#recovery-wide .bui-recovery', inset: '--bui-recovery-inset' }
				] },
				{ open: page => page.locator('#callout-details summary').click(), boxes: [{ name: 'callout ending in open technical details', box: '#callout-details .bui-callout', inset: '--bui-callout-inset' }] },
				{ open: async page => (await page.evaluate(() => window.fixture.toast()), page.waitForSelector('.bui-toast')), boxes: [{ name: 'toast with a detail', box: '.bui-toast', inset: '--bui-toast-inset' }] }
			]
		},
		{ file: 'hold.html', steps: [{ boxes: [{ name: 'Unavailable for an outage, with Try again', box: '.bui-unavailable', inset: '--bui-unavailable-inset' }] }] },
		{ file: 'family.html', steps: [
			{ boxes: [{ name: 'Unavailable for access, with its action', box: '.bui-unavailable', inset: '--bui-unavailable-inset' }] },
			{ open: page => page.locator('.bui-family [data-part="product"] .bui-navmenu-button').click(), boxes: [{ name: 'family bar menu panel', box: '.bui-family [data-part="product"] .bui-navmenu-panel:not([hidden])', flat: ['.bui-navmenu-item', 'a', 'button'], inset: 16, sides: record }] }
		] },
		{ file: 'recovery.html', steps: [{ boxes: [{ name: 'Recovery line', box: '.bui-recovery', inset: '--bui-recovery-inset' }] }] },
		{ file: 'recovery.html', query: '?whole=1', steps: [{ boxes: [{ name: 'Recovery as the page', box: '.bui-recovery', inset: '--bui-recovery-inset' }] }] }
	],
	cards: [
		{ file: 'insets.html', steps: [{ boxes: [{ name: 'an editable CommandCard', box: '#command-edit .bui-command', inset: '--bui-command-inset' }, { name: 'its command field', box: '#command-edit textarea', field: true, inset: '--bui-code-inset', free: ['bottom'] }] }] },
		{ file: 'audit.html', steps: [
			{ boxes: [{ name: 'CommandCard', box: '.bui-command', inset: '--bui-command-inset' }, { name: 'CommandCard code', box: '.bui-command-code', inset: '--bui-code-inset' }, { name: 'ChoiceChip', box: '#chip .bui-choice-button', inset: 8, sides: record }] },
			{ open: page => page.locator('#chip .bui-choice-button').click(), boxes: [{ name: 'a choice menu with one chosen', box: '.bui-choice-list:not([hidden])', flat: ['.bui-menu-item'], inset: '--bui-menu-inset' }] }
		] },
		{ file: 'wave.html', steps: [{ boxes: [{ name: 'the tallest choice card', box: '.bui-card-choice', nth: 2, inset: '--bui-card-inset' }, { name: 'the chosen choice card', box: '.bui-card-choice', nth: 0, inset: '--bui-card-inset', free: ['bottom'] }] }] },
		{ file: 'layout.html', query: '?raised=1', steps: [{ boxes: [{ name: 'raised side panel', box: '.bui-page-aside[data-raised]', inset: '--bui-panel-inset', free: ['bottom'] }] }] },
		{ file: 'operations.html', steps: [
			{ boxes: [{ name: 'Select', box: '.bui-select-control', field: true, extra: [':scope > .bui-icon'], inset: '--bui-select-inset' }, { name: 'awaited card', box: '.bui-awaited', inset: '--bui-awaited-inset' }] },
			{ open: page => page.locator('main details > summary').first().click(), boxes: [{ name: 'technical details', box: 'main > details .bui-details-body, main > .bui-host > details .bui-details-body', inset: '--bui-text-inset' }] }
		] },
		{ file: 'conversation.html', steps: [{ open: page => page.locator('.bui-rail > .bui-activity > .bui-activity-head, .bui-rail > .bui-host > .bui-activity > .bui-activity-head').first().click(), boxes: [{ name: 'activity exchange', box: '.bui-rail .bui-activity-exchange', inset: 12, sides: record }] }] },
		{ file: 'pressing.html', steps: [{ boxes: [{ name: 'ComposerChip', box: '.bui-composer-tray .bui-composer-chip', inset: 12, sides: record }] }] }
	],
	overlays: [
		{ file: null, steps: [
			{ boxes: [{ name: 'a form field', box: '#form input', field: true, inset: 12 }] },
			{ open: (page, consumer) => page.getByRole('button', { name: es(consumer) ? 'Abrir diálogo' : 'Open dialog' }).click(), boxes: [{ name: 'Dialog', box: 'dialog.bui-dialog[open]', inset: '--bui-dialog-inset' }, { name: 'a dialog\'s field', box: 'dialog.bui-dialog[open] input', field: true, inset: 12 }] },
			{ open: async (page, consumer) => (await closed(page), page.getByRole('button', { name: es(consumer) ? 'Más acciones' : 'More actions' }).click()), boxes: [{ name: 'ActionMenu at rest', box: '.bui-menu:not([hidden])', flat: ['.bui-menu-item'], inset: '--bui-menu-inset' }] },
			{ open: (page, consumer) => page.getByRole('menuitem', { name: es(consumer) ? 'Aviso' : 'Toast' }).click(), boxes: [{ name: 'toast', box: '.bui-toast', inset: '--bui-toast-inset' }] },
			{ open: (page, consumer) => page.getByRole('button', { name: es(consumer) ? 'Ayuda: Identificador del proyecto' : 'Help: Project identifier' }).click(), boxes: [{ name: 'help', box: '#helping .bui-help-panel', inset: '--bui-text-inset' }] },
			{ open: page => page.locator('#helping button').filter({ hasText: /Copy address|Copiar dirección/ }).hover(), boxes: [{ name: 'Tooltip', box: '[role="tooltip"]:not([hidden])', inset: 8 }] },
			{ open: async page => (await page.locator('.bui-notify > button').click(), await page.waitForSelector('.bui-notify .bui-disclosure-panel:not([hidden]) .bui-notice'), page.locator('.bui-notify .bui-notice').first().hover()), boxes: [{ name: 'a notification row under the pointer', box: '.bui-notify .bui-disclosure-panel:not([hidden]) .bui-notice', inset: '--bui-notice-inset' }, { name: 'notification panel', box: '.bui-notify .bui-disclosure-panel:not([hidden])', flat: ['.bui-notice', '.bui-notify-all'], inset: 16, sides: record }] }
		] },
		{ file: 'choosing.html', steps: [
			{ boxes: [{ name: 'CopyMessage', box: '.bui-copy-text', inset: '--bui-text-inset' }] },
			{ open: (page, consumer) => page.getByRole('button', { name: es(consumer) ? 'Borrar My first VM' : 'Delete My first VM' }).click(), boxes: [{ name: 'a confirmation', box: 'dialog.bui-dialog[open]', inset: '--bui-dialog-inset' }, { name: 'its consequence', box: 'dialog.bui-dialog[open] .bui-consequence', inset: '--bui-text-inset' }] }
		] },
		{ file: 'choosing.html', query: '?sheet=1', steps: [{ open: page => page.waitForFunction(() => document.querySelector('.bui-sheet')?.open && document.querySelector('.bui-sheet').getAnimations().every(animation => animation.playState === 'finished')), boxes: [{ name: 'SideSheet', box: '.bui-sheet[open]', inset: '--bui-sheet-inset', sides: ['top', 'left', 'right'] }] }] },
		{ file: 'wave.html', steps: [{ open: palette, boxes: [{ name: 'CommandPalette', box: 'dialog.bui-palette[open]', flat: ['.bui-palette-option'], inset: '--bui-palette-inset' }] }] },
		{ file: 'thread.html', widths: [1440], steps: [{ open: page => page.locator('#own .bui-icon-button').focus(), boxes: [{ name: 'Hint', box: '.bui-hint:not([hidden])', inset: 8 }] }] },
		{ file: 'turns.html', widths: [1440], steps: [{ open: async page => (await page.locator('.bui-turns-mark').nth(6).hover(), page.locator('.bui-turns-preview').waitFor({ state: 'visible' })), boxes: [{ name: 'a turn\'s preview', box: '.bui-turns-preview', inset: '--bui-preview-inset' }] }] },
		{ file: 'index.html', consumers: ['dom'], steps: [
			{ boxes: [{ name: 'ChoiceMenu', box: '#picking .bui-choice-button', inset: '--bui-choice-inset' }] },
			{ open: page => page.locator('#picking .bui-choice-button').first().click(), boxes: [{ name: 'a choice menu with nothing chosen', box: '.bui-choice-list:not([hidden])', flat: ['.bui-menu-item'], inset: '--bui-menu-inset', sides: record }] }
		] }
	]
};
