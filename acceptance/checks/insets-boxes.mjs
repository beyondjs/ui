/**
 * The boxes the insets check measures (D184), page by page: each `step` opens what it needs on the page
 * already loaded and names the boxes it then measures. A box's `inset` is its custom property (read on the box)
 * or the number its padding already keeps, or `even` for a single-line control, whose height decides the room
 * above its capitals and whose sides keep that room (0.35.0); `sides` lists what is held to that inset within a
 * pixel (all four unless said), `free` the sides that may hold free room but never come closer (a textarea taller than its
 * words, a last row that is the product's own); an empty `sides` measures a box for the record only, a box
 * that cannot keep one inset without a design decision. A right side a short line does not reach is free room
 * by itself (the measurement's `free`). `touch` gives what a box keeps instead on a touch screen (0.35.0), where
 * every target is 44 px tall: a menu's `even` sides (an action menu's, a choice's), since its entries' height decides its inset;
 * the notification panel, whose taller rows scroll it by design. Since 0.41.0 (D192) a notification row keeps its
 * inset at its top and sides there; below its last line a control's 44 px target stands in the row's own
 * padding, off its words, so its bottom is free room (`checks/touching.mjs`).
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
/** Points at a control, or, on a touch screen, where no pointer hovers, focuses it: what shows on either (0.35.0) */
const point = async (page, control) => ((await page.evaluate(() => matchMedia('(pointer: coarse)').matches)) ? control.focus() : control.hover());
/** The sidebar's search (0.35.0): its words start after its glyph, never under it, whatever the field's own sides. */
const query = async page => {
	const placed = await page.locator('.bui-sidebar-panel .bui-sidebar-query').first().evaluate(field => {
		const style = getComputedStyle(field);
		return { glyph: field.parentElement.querySelector(':scope > .bui-icon').getBoundingClientRect().right, words: field.getBoundingClientRect().left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft) };
	});
	if (placed.words < placed.glyph + 4) throw new Error(`the sidebar's search writes under its glyph: ${JSON.stringify(placed)}`);
};
/** A command's CopyMessage (0.35.0): only its code box takes the code's face and lines; its holder, Copy and result keep the interface's. */
const holder = async page => {
	const faces = await page.locator('#copy-command .bui-copy').evaluate(node => {
		const style = element => getComputedStyle(element);
		const box = node.querySelector('.bui-copy-text');
		return { holder: style(node).fontFamily, copy: style(node.querySelector('.bui-button')).fontFamily, box: style(box).fontFamily, lines: style(node).whiteSpace, scroll: style(node).overflowX };
	});
	if (faces.holder === faces.box || faces.copy === faces.box || faces.lines === 'pre' || faces.scroll !== 'visible') throw new Error(`a command's holder takes its code box's face or lines: ${JSON.stringify(faces)}`);
};

/**
 * A DataTable in a framed box (0.41.0): the package's raised section, its title first, and a product's own 20 px
 * card with the table `framed` at its top. Its words keep the box's inset; its rows' fills hang into the box's
 * padding as a menu's entries do, so a row under the pointer is a flat row, measured by its words; a grouped one
 * starts with its first group's heading at 390 px. Its last row
 * keeps its own padding, so the bottom is free room. Since 0.44.0 a framed table lifts only while it leads its card:
 * the card's line hidden before it leaves it leading, and a framed table after a line its card shows stays where
 * it is drawn, the line's capitals at the inset.
 */
const tables = [
	{ name: 'a DataTable in a raised section', box: '#table-raised .bui-section', inset: '--bui-raised-inset', flat: ['.bui-data tbody tr'], free: ['bottom'] },
	{ name: 'a framed DataTable in a product\'s card', box: '#table-card .insets-card', inset: 20, flat: ['.bui-data tbody tr'], free: ['bottom'] },
	{ name: 'a framed, grouped DataTable in a product\'s card', box: '#table-grouped .insets-card', inset: 20, flat: ['.bui-data tbody tr'], free: ['bottom'] },
	{ name: 'a framed DataTable after a line its card shows', box: '#table-after .insets-card', inset: 20, flat: ['.bui-data tbody tr'], free: ['bottom'] }
];

/**
 * Whether each framed table is lifted (0.44.0): the one that leads its card (a hidden line before it) is, by its
 * table's margin on a wide table or its first row's on a narrow one; the one after a line its card shows is not,
 * and its first line starts below the line's.
 */
const leading = async page => {
	const found = await page.evaluate(() => {
		const lift = block => {
			const table = document.querySelector(`${block} .bui-table`);
			const row = table.querySelector('tbody > tr');
			return parseFloat(getComputedStyle(table).marginBlockStart) + parseFloat(getComputedStyle(row).marginBlockStart);
		};
		const line = document.querySelector('#table-after .insets-updated').getBoundingClientRect().bottom;
		const shown = [...document.querySelectorAll('#table-after .bui-data :is(thead, tbody)')].find(part => part.getBoundingClientRect().height > 1);
		return { card: lift('#table-card'), after: lift('#table-after'), line, below: shown.getBoundingClientRect().top };
	});
	if (!(found.card < -1) || Math.abs(found.after) > 0.01 || found.below < found.line) throw new Error(`a framed table lifts only while it leads its card: ${JSON.stringify(found)}`);
};

/**
 * Points at a table's first row, and holds its fill inside the box, hanging into the box's padding no further than
 * a menu's entries hang into theirs: at least 2 px from the border, at most the box's inset (0.41.0).
 */
const pointed = async (page, block) => {
	const row = page.locator(`${block} tbody tr`).first();
	await row.hover();
	const placed = await row.evaluate((node, block) => {
		const box = document.querySelector(block).querySelector('.bui-section, .insets-card');
		const style = getComputedStyle(box);
		const outer = box.getBoundingClientRect();
		const fill = node.getBoundingClientRect();
		return { color: getComputedStyle(node).backgroundColor, left: fill.left - outer.left - parseFloat(style.borderLeftWidth), right: outer.right - parseFloat(style.borderRightWidth) - fill.right, inset: parseFloat(style.paddingLeft) };
	}, block);
	const sides = [placed.left, placed.right];
	if (placed.color === 'rgba(0, 0, 0, 0)' || sides.some(side => side < 2 || side > placed.inset + 0.5)) throw new Error(`a table's row fill hangs into its box no further than a menu's: ${JSON.stringify(placed)}`);
};

export const pages = {
	notices: [
		{
			file: 'insets.html',
			steps: [
				{ boxes: [
					{ name: 'callout ending in actions', box: '#callout-actions .bui-callout', inset: '--bui-callout-inset' },
					{ name: 'callout ending in a copyable value', box: '#callout-copy .bui-callout', inset: '--bui-callout-inset' },
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
				{ open: async page => (await page.evaluate(() => window.fixture.toast()), page.waitForSelector('.bui-toast')), boxes: [{ name: 'toast with a detail', box: '.bui-toast', inset: '--bui-toast-inset' }] },
				{ open: holder, boxes: [{ name: 'CopyMessage of a command', box: '#copy-command .bui-copy-text', inset: '--bui-text-inset' }] },
				{ open: leading, boxes: tables },
				{ open: page => pointed(page, '#table-card'), boxes: tables.slice(1, 2).map(box => ({ ...box, name: `${box.name}, a row under the pointer` })) },
				{ open: page => pointed(page, '#table-raised'), boxes: tables.slice(0, 1).map(box => ({ ...box, name: `${box.name}, a row under the pointer` })) }
			]
		},
		{ file: 'hold.html', steps: [{ boxes: [{ name: 'Unavailable for an outage, with Try again', box: '.bui-unavailable', inset: '--bui-unavailable-inset' }] }] },
		{ file: 'family.html', steps: [
			{ boxes: [{ name: 'Unavailable for access, with its action', box: '.bui-unavailable', inset: '--bui-unavailable-inset' }] },
			{ open: page => page.locator('.bui-family [data-part="product"] .bui-navmenu-button').click(), boxes: [{ name: 'family bar menu panel', box: '.bui-family [data-part="product"] .bui-navmenu-panel:not([hidden])', flat: ['.bui-navmenu-item', 'a', 'button'], inset: 16, sides: record }] }
		] },
		{ file: 'recovery.html', steps: [
			{ boxes: [{ name: 'Recovery line', box: '.bui-recovery', inset: '--bui-recovery-inset' }] },
			// Offline (0.33.0) the line says so with no Try again: its words alone set it (0.35.0)
			{ open: async page => (await page.context().setOffline(true), page.waitForSelector('.bui-recovery[data-offline]:not([hidden])')), boxes: [{ name: 'Recovery offline, with no Try again', box: '.bui-recovery[data-offline]', inset: '--bui-recovery-inset' }] }
		] },
		{ file: 'recovery.html', query: '?whole=1', steps: [{ boxes: [{ name: 'Recovery as the page', box: '.bui-recovery', inset: '--bui-recovery-inset' }] }] },
		// With no Technical details (0.44.0): the line ends at Try again, or offline at its words, never an empty row's gap further
		{ file: 'recovery.html', query: '?bare=1', steps: [
			{ boxes: [{ name: 'Recovery line with no Technical details', box: '.bui-recovery', inset: '--bui-recovery-inset' }] },
			{ open: async page => (await page.context().setOffline(true), page.waitForSelector('.bui-recovery[data-offline]:not([hidden])')), boxes: [{ name: 'Recovery offline with no Technical details', box: '.bui-recovery[data-offline]', inset: '--bui-recovery-inset' }] }
		] },
		{ file: 'recovery.html', query: '?whole=1&bare=1', steps: [
			{ boxes: [{ name: 'Recovery as the page with no Technical details', box: '.bui-recovery', inset: '--bui-recovery-inset' }] },
			{ open: async page => (await page.context().setOffline(true), page.waitForSelector('.bui-recovery[data-offline]:not([hidden])')), boxes: [{ name: 'Recovery as the page offline with no Technical details', box: '.bui-recovery[data-offline]', inset: '--bui-recovery-inset' }] }
		] }
	],
	cards: [
		{ file: 'insets.html', steps: [
			{ boxes: [{ name: 'an editable CommandCard', box: '#command-edit .bui-command', inset: '--bui-command-inset' }, { name: 'its command field', box: '#command-edit textarea', field: true, inset: '--bui-code-inset', free: ['bottom'] }] },
			// A choice whose entries are one line each, as a composer's Effort (0.35.0)
			{ open: page => page.locator('#effort .bui-choice-button').click(), boxes: [{ name: 'a choice menu of one-line entries', box: '.bui-choice-list:not([hidden])', flat: ['.bui-menu-item'], inset: '--bui-menu-inset', touch: { inset: 'even' } }] }
		] },
		{ file: 'audit.html', steps: [
			{ boxes: [{ name: 'CommandCard', box: '.bui-command', inset: '--bui-command-inset' }, { name: 'CommandCard code', box: '.bui-command-code', inset: '--bui-code-inset' }, { name: 'ChoiceChip', box: '#chip .bui-choice-button', inset: 8, sides: record }] },
			{ open: page => page.locator('#chip .bui-choice-button').click(), boxes: [{ name: 'a choice menu with one chosen', box: '.bui-choice-list:not([hidden])', flat: ['.bui-menu-item'], inset: '--bui-menu-inset', touch: { inset: 'even' } }] }
		] },
		{ file: 'wave.html', steps: [{ boxes: [{ name: 'the tallest choice card', box: '.bui-card-choice', nth: 2, inset: '--bui-card-inset' }, { name: 'the chosen choice card', box: '.bui-card-choice', nth: 0, inset: '--bui-card-inset', free: ['bottom'] }] }] },
		{ file: 'layout.html', query: '?raised=1', steps: [{ boxes: [{ name: 'raised side panel', box: '.bui-page-aside[data-raised]', inset: '--bui-panel-inset', free: ['bottom'] }] }] },
		// Pinned beside the main column at 1440 px, a scroller there, and flowing at 390 px (0.38.0, D189): the same inset
		{ file: 'layout.html', query: '?raised=1&pinned=1&long=1', steps: [{ boxes: [{ name: 'pinned raised side panel', box: '.bui-page-aside[data-pinned]', inset: '--bui-panel-inset', free: ['bottom'] }] }] },
		{ file: 'operations.html', steps: [
			{ boxes: [{ name: 'Select', box: '.bui-select-control', field: true, extra: [':scope > .bui-icon'], inset: 'even' }, { name: 'awaited card', box: '.bui-awaited', inset: '--bui-awaited-inset' }] },
			{ open: page => page.locator('main details > summary').first().click(), boxes: [{ name: 'technical details', box: 'main > details .bui-details-body, main > .bui-host > details .bui-details-body', inset: '--bui-text-inset' }] }
		] },
		{ file: 'conversation.html', steps: [{ open: page => page.locator('.bui-rail > .bui-activity > .bui-activity-head, .bui-rail > .bui-host > .bui-activity > .bui-activity-head').first().click(), boxes: [{ name: 'activity exchange', box: '.bui-rail .bui-activity-exchange', inset: 12, sides: record }] }] },
		{ file: 'pressing.html', steps: [{ boxes: [{ name: 'ComposerChip', box: '.bui-composer-tray .bui-composer-chip', inset: 12, sides: record }] }] },
		{ file: 'conversation.html', widths: [1440], steps: [{ open: query, boxes: [{ name: 'the sidebar\'s search field', box: '.bui-sidebar-panel .bui-sidebar-query', field: true, inset: 'even', sides: record }] }] }
	],
	overlays: [
		{ file: null, steps: [
			{ boxes: [{ name: 'a form field', box: '#form input', field: true, inset: 'even' }] },
			{ open: (page, consumer) => page.getByRole('button', { name: es(consumer) ? 'Abrir diálogo' : 'Open dialog' }).click(), boxes: [{ name: 'Dialog', box: 'dialog.bui-dialog[open]', inset: '--bui-dialog-inset' }, { name: 'a dialog\'s field', box: 'dialog.bui-dialog[open] input', field: true, inset: 'even' }] },
			{ open: async (page, consumer) => (await closed(page), page.getByRole('button', { name: es(consumer) ? 'Más acciones' : 'More actions' }).click()), boxes: [{ name: 'ActionMenu at rest', box: '.bui-menu:not([hidden])', flat: ['.bui-menu-item'], inset: '--bui-menu-inset', touch: { inset: 'even' } }] },
			{ open: (page, consumer) => page.getByRole('menuitem', { name: es(consumer) ? 'Aviso' : 'Toast' }).click(), boxes: [{ name: 'toast', box: '.bui-toast', inset: '--bui-toast-inset' }] },
			{ open: (page, consumer) => page.getByRole('button', { name: es(consumer) ? 'Ayuda: Identificador del proyecto' : 'Help: Project identifier' }).click(), boxes: [{ name: 'help', box: '#helping .bui-help-panel', inset: '--bui-text-inset' }] },
			{ open: page => point(page, page.locator('#helping button').filter({ hasText: /Copy address|Copiar dirección/ })), boxes: [{ name: 'Tooltip', box: '[role="tooltip"]:not([hidden])', inset: 8 }] },
			{ open: async page => (await page.locator('.bui-notify > button').click(), await page.waitForSelector('.bui-notify .bui-disclosure-panel:not([hidden]) .bui-notice'), page.locator('.bui-notify .bui-notice').first().hover()), boxes: [{ name: 'a notification row under the pointer', box: '.bui-notify .bui-disclosure-panel:not([hidden]) .bui-notice', inset: '--bui-notice-inset', touch: { free: ['bottom'] } }, { name: 'notification panel', box: '.bui-notify .bui-disclosure-panel:not([hidden])', flat: ['.bui-notice', '.bui-notify-all'], inset: 16, sides: record, touch: { scrolls: true } }] }
		] },
		{ file: 'choosing.html', steps: [
			{ boxes: [{ name: 'CopyMessage', box: '.bui-copy-text', inset: '--bui-text-inset' }] },
			{ open: (page, consumer) => page.getByRole('button', { name: es(consumer) ? 'Borrar My first VM' : 'Delete My first VM' }).click(), boxes: [{ name: 'a confirmation', box: 'dialog.bui-dialog[open]', inset: '--bui-dialog-inset' }, { name: 'its consequence', box: 'dialog.bui-dialog[open] .bui-consequence', inset: '--bui-text-inset' }] }
		] },
		{ file: 'choosing.html', query: '?sheet=1', steps: [{ open: page => page.waitForFunction(() => document.querySelector('.bui-sheet')?.open && document.querySelector('.bui-sheet').getAnimations().every(animation => animation.playState === 'finished')), boxes: [{ name: 'SideSheet', box: '.bui-sheet[open]', inset: '--bui-sheet-inset', sides: ['top', 'left', 'right'] }] }] },
		{ file: 'wave.html', steps: [{ open: palette, boxes: [{ name: 'CommandPalette', box: 'dialog.bui-palette[open]', flat: ['.bui-palette-option'], inset: '--bui-palette-inset' }] }] },
		{ file: 'thread.html', widths: [1440], steps: [{ open: page => page.locator('#own .bui-icon-button').focus(), boxes: [{ name: 'Hint', box: '.bui-hint:not([hidden])', inset: 8 }] }] },
		{ file: 'turns.html', widths: [1440], steps: [{ open: async page => (await point(page, page.locator('.bui-turns-mark').nth(6)), page.locator('.bui-turns-preview').waitFor({ state: 'visible' })), boxes: [{ name: 'a turn\'s preview', box: '.bui-turns-preview', inset: '--bui-preview-inset' }] }] },
		{ file: 'index.html', consumers: ['dom'], steps: [
			{ boxes: [{ name: 'ChoiceMenu', box: '#picking .bui-choice-button', inset: 'even' }] },
			{ open: page => page.locator('#picking .bui-choice-button').first().click(), boxes: [{ name: 'a choice menu with nothing chosen', box: '.bui-choice-list:not([hidden])', flat: ['.bui-menu-item'], inset: '--bui-menu-inset', sides: record }] }
		] }
	]
};
