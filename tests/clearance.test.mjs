import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { RowStage } from './support/row.mjs';
import { RowClearance } from '../src/dom/core/clearance.js';

/**
 * A row of tabs keeps its current tab whole (0.36.0, D179): where the row rests for a part to show clear of
 * its padding and of the cues that say an end holds more, and ProductNav and Tabs resting there by whole
 * pixels at once, again after a change of size or the fonts, and never against the person's own move.
 * happy-dom has no layout, so `RowStage` lays the row out; the browser acceptance measures real engines.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

// Conduict's machine Settings at 390 px, where the pending found Network cut under the end cue (296–373 px
// against 342–374 px): a 358 px row from 16 px, tabs 4 px apart and cues 32 px wide
const settings = ['Who uses it', 'Repository access', 'Capacity', 'Automatic sleep', 'Network', 'Secrets'];
const widths = { 'Who uses it': 80, 'Repository access': 136, Capacity: 76, 'Automatic sleep': 124, Network: 77, Secrets: 70 };
const items = current => settings.map((label, index) => ({ label, href: `#${index}`, current: label === current }));

/** A row of Tabs laid out by `stage` and mounted; `stage.uninstall()` is the caller's. */
function staged(layout = {}, current = 'Network', Kind = ui.Tabs) {
	const stage = new RowStage(page.window, { widths, ...layout }).install();
	const nav = new Kind({ items: items(current) });
	stage.hold(nav.element.querySelector('.bui-productnav-list'));
	nav.mount(document.body);
	return { stage, nav };
}

/** Whether the tab is whole inside the 358 px row from 16 px, and overlaps no cue drawn. */
function whole(stage, label) {
	const { tab, start, end } = stage.measure(label);
	const apart = cue => !cue.width || tab.right <= cue.left || tab.left >= cue.right;
	return tab.left >= 16 && tab.right <= 374 && apart(start) && apart(end);
}

test('a part already whole and clear stays; one under a cue moves just past it, by whole pixels at least as far as needed', () => {
	const row = new RowClearance({ width: 358, extent: 225, left: { cue: 32 }, right: { cue: 32 } });
	assert.equal(row.rest({ now: 100, start: 200, end: 280 }), 100, 'clear where it rests');
	assert.equal(row.clear({ now: 100, start: 200, end: 280 }), true);
	// Network ends 1 px inside the row, as the earlier scroll left it, under the end cue's 32 px
	assert.equal(row.clear({ now: 151, start: 432, end: 509 }), false);
	assert.equal(row.rest({ now: 151, start: 432, end: 509 }), 183, 'its right edge on the cue\'s left edge');
	assert.equal(row.rest({ now: 151, start: 432, end: 509.4 }), 184, 'a fraction rounds away from the tab');
	assert.equal(row.rest({ now: 120, start: 130, end: 210 }), 98, 'under the start cue: back until its left edge clears it');
	assert.equal(row.rest({ now: 120, start: 130.6, end: 210 }), 98, 'a fraction rounds away from the tab');
});

test('an end hides its cue where the row rests on it, so a part the cue would cover there shows from the end', () => {
	const row = new RowClearance({ width: 358, extent: 225, left: { cue: 32 }, right: { cue: 32 } });
	assert.equal(row.rest({ now: 0, start: 513, end: 583 }), 225, 'the last tab: the row at its end, where no end cue is drawn');
	assert.equal(row.rest({ now: 0, start: 450, end: 550 }), 225, 'one that would rest within a pixel of the end rests on the end');
	assert.equal(row.rest({ now: 200, start: 20, end: 100 }), 0, 'the first tab: the row at its start');
	assert.equal(row.rest({ now: 200, start: 33, end: 100 }), 0, 'a cue that would hide only a pixel of the start: the start itself');
	assert.equal(new RowClearance({ width: 358, extent: 0, right: { cue: 32 } }).rest({ now: 0, start: 300, end: 350 }), 0, 'a row with nothing hidden draws no cue');
});

test('the padding keeps a part off an end where it is wider than the cue; a part wider than the room keeps its inline start', () => {
	const padded = new RowClearance({ width: 358, extent: 300, left: { padding: 40, cue: 32 }, right: { padding: 40, cue: 32 } });
	assert.equal(padded.rest({ now: 0, start: 400, end: 450 }), 132, 'the right padding, 40 px, over the 32 px cue');
	assert.equal(padded.rest({ now: 300, start: 200, end: 260 }), 160, 'the left padding too');
	const narrow = new RowClearance({ width: 100, extent: 400, left: { cue: 32 }, right: { cue: 32 } });
	assert.equal(narrow.rest({ now: 0, start: 100, end: 200 }), 68, 'left to right: its start clear');
	assert.equal(narrow.rest({ now: 0, start: 100, end: 200, lead: 'right' }), 132, 'right to left: its start is its right edge');
	assert.equal(new RowClearance({ width: Number.NaN, extent: -4 }).rest({ now: 0, start: 0, end: 0 }), 0, 'no row measured: nothing moves');
});

test('Tabs rest with the current tab clear of the end cue at 390 px, the pending\'s case, and say both ends hold more', () => {
	const { stage, nav } = staged();
	try {
		assert.equal(stage.scroll, 183, 'never 151, which left Network under the cue');
		assert.ok(whole(stage, 'Network'), JSON.stringify(stage.measure('Network')));
		assert.deepEqual(nav.more, ['start', 'end']);
		nav.items = items('Secrets');
		assert.equal(stage.scroll, 225, 'the last tab at the row\'s end');
		assert.ok(whole(stage, 'Secrets'));
		assert.deepEqual(nav.more, ['start'], 'no end cue there');
		nav.items = items('Repository access');
		assert.equal(stage.scroll, 52, 'back until it clears the start cue');
		assert.ok(whole(stage, 'Repository access'), JSON.stringify(stage.measure('Repository access')));
		nav.items = items('Who uses it');
		assert.equal(stage.scroll, 0, 'the first tab at the row\'s start');
		assert.equal(nav.more.includes('start'), false);
	} finally {
		nav.destroy();
		stage.uninstall();
	}
});

test('ProductNav counts its own padding where it is wider than a cue, and a cue measured as drawn, wider or narrower', () => {
	const wide = staged({ padding: 48 }, 'Network', ui.ProductNav);
	try {
		assert.ok(wide.stage.measure('Network').tab.right <= 374 - 48, JSON.stringify(wide.stage.measure('Network')));
	} finally {
		wide.nav.destroy();
		wide.stage.uninstall();
	}
	const cue = staged({ padding: 16, cue: 56 }, 'Network', ui.ProductNav);
	try {
		const { tab, end } = cue.stage.measure('Network');
		assert.equal(end.width, 56, 'the cue as the stylesheet draws it');
		assert.ok(tab.right <= end.left, JSON.stringify({ tab, end }));
	} finally {
		cue.nav.destroy();
		cue.stage.uninstall();
	}
});

test('the current tab is kept again when the tabs or the row change size, until the person moves the row', () => {
	const { stage, nav } = staged();
	try {
		// A web font wider than the fallback: Network moves right, under the cue, until the row follows
		stage.widths = { 'Who uses it': 92, 'Repository access': 150 };
		assert.equal(whole(stage, 'Network'), false, 'the font moved it');
		stage.resize();
		assert.ok(whole(stage, 'Network'), JSON.stringify(stage.measure('Network')));
		const kept = stage.scroll;
		stage.resize();
		assert.equal(stage.scroll, kept, 'nothing moves while it shows whole');
		// The person swipes the row to its start: a later change of size leaves their position
		stage.move(0);
		stage.widths = { Capacity: 90 };
		stage.resize();
		assert.equal(stage.scroll, 0, 'the person\'s position stays');
		// New tabs keep the new current one again
		nav.items = items('Network');
		assert.ok(whole(stage, 'Network'));
		// A press on a cue is the person's move too
		nav.element.querySelector('.bui-scroll-edge-start').click();
		const pressed = stage.scroll;
		stage.widths = { Network: 96 };
		stage.resize();
		assert.equal(stage.scroll, pressed, 'a cue pressed is never undone');
	} finally {
		nav.destroy();
		stage.uninstall();
	}
});

test('tabs given while the row is outside the document are brought clear once it is laid out, as a product appends them', () => {
	const stage = new RowStage(page.window, { widths }).install();
	const nav = new ui.Tabs({ items: items('Network') });
	try {
		stage.hold(nav.element.querySelector('.bui-productnav-list'));
		document.body.append(nav.element);
		assert.equal(stage.scroll, 0, 'nothing measured outside the document');
		stage.resize();
		assert.ok(whole(stage, 'Network'), JSON.stringify(stage.measure('Network')));
		nav.destroy();
		stage.resize();
		assert.equal(document.querySelector('.bui-tabs'), null, 'a change of size after destroy reaches nothing');
	} finally {
		stage.uninstall();
	}
});

test('a right-to-left row keeps the current tab clear of the cue at its left, its end', () => {
	const { stage, nav } = staged({ rtl: true });
	try {
		assert.ok(stage.scroll < 0, `scrollLeft runs from 0 down: ${stage.scroll}`);
		const { tab, end } = stage.measure('Network');
		assert.ok(end.width && end.right <= tab.left, `the end cue at the left, before the tab: ${JSON.stringify({ tab, end })}`);
		assert.ok(whole(stage, 'Network'), JSON.stringify(stage.measure('Network')));
		nav.items = items('Who uses it');
		assert.equal(stage.scroll, 0, 'the first tab at the row\'s start, its right end');
	} finally {
		nav.destroy();
		stage.uninstall();
	}
});
