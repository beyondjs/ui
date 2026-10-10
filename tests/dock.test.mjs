import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page as Window } from './support/page.mjs';

/**
 * The thread template of 0.14.0: the anchored dock (D94), the lane (D96) and the panel's motion (D95),
 * whose columns change once. Layout and real motion are measured in the browser (`acceptance/checks/
 * anchoring.mjs`, `moving.mjs`); here the contract: markup, options, refusals and the order of changes.
 */
const page = new Window();
const ui = await import('@beyond-js/ui/dom');
const { Motion } = await import('../src/dom/core/motion.js');
after(() => page.close());
beforeEach(() => {
	page.reset();
	page.window.happyDOM.setViewport({ width: 1440, height: 900 });
});

const paragraph = text => Object.assign(document.createElement('p'), { textContent: text });

test('the thread template docks its last block at the end of the main column, with an end mark after it, and is a thread width by default', () => {
	const composer = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve() });
	const view = new ui.Page({ template: 'thread', children: [paragraph('The thread')], dock: composer }).mount(document.body);
	assert.equal(view.element.dataset.template, 'thread');
	assert.equal(view.element.dataset.width, 'thread', 'the thread tier unless given');
	const main = view.region;
	const dock = main.querySelector(':scope > .bui-page-dock');
	assert.ok(dock && dock.contains(composer.element), 'the composer is docked');
	assert.equal(main.lastElementChild.className, 'bui-page-dock-end');
	assert.equal(main.lastElementChild.getAttribute('aria-hidden'), 'true');
	assert.equal(main.lastElementChild.previousElementSibling, dock);
	assert.ok(view.dock instanceof ui.PageDock);
	assert.equal(view.dock.element, dock);
	assert.equal(view.dock.stuck, false);
	view.main = [paragraph('Another thread')];
	assert.equal(main.firstElementChild.textContent, 'Another thread');
	assert.equal(main.children[1], dock, 'the dock stays the last block when the main column changes');
	assert.ok(dock.contains(composer.element));
	view.dock = null;
	assert.equal(dock.childElementCount, 0, 'an empty dock');
	view.dock = [composer];
	assert.ok(dock.contains(composer.element));
	view.destroy();
	composer.destroy();
});

test('a dock belongs to the thread template; other templates keep their width default and refuse a dock', () => {
	assert.throws(() => new ui.Page({ template: 'detail', dock: paragraph('x') }), /thread template/);
	const view = new ui.Page({ template: 'detail' });
	assert.equal(view.element.dataset.width, 'standard');
	assert.equal(view.dock, null);
	assert.throws(() => (view.dock = paragraph('x')), /thread template/);
	view.dock = null;
	assert.equal(new ui.Page({ template: 'thread', width: 'reading' }).element.dataset.width, 'reading', 'a width given wins');
	assert.throws(() => new ui.Page({ template: 'canvas' }), TypeError);
});

test('the dock is lifted only while its end mark is out of view: an IntersectionObserver, no scroll handler', () => {
	const watched = [];
	const original = page.window.IntersectionObserver;
	page.window.IntersectionObserver = class {
		#callback;
		constructor(callback) {
			this.#callback = callback;
			watched.push(this);
		}
		observe(node) {
			this.node = node;
		}
		disconnect() {
			this.gone = true;
		}
		report(isIntersecting) {
			this.#callback([{ isIntersecting, target: this.node }]);
		}
	};
	try {
		const view = new ui.Page({ template: 'thread', children: [paragraph('x')] }).mount(document.body);
		const [observer] = watched;
		assert.equal(observer.node, view.region.querySelector('.bui-page-dock-end'));
		observer.report(false);
		assert.equal(view.dock.stuck, true);
		assert.ok(view.dock.element.hasAttribute('data-stuck'));
		observer.report(true);
		assert.equal(view.dock.stuck, false);
		view.destroy();
		assert.ok(observer.gone, 'destroy disconnects it');
	} finally {
		page.window.IntersectionObserver = original;
	}
});

/** A conversation page with its panel and its toggle in the header, as a product builds it. */
function scene() {
	const toggle = new ui.Button({ label: 'Details', variant: 'quiet' });
	const header = new ui.PageHeader({ title: 'Fix the redirect', actions: [toggle] });
	const view = new ui.Page({ template: 'thread', header, children: [paragraph('The thread')], aside: [paragraph('Facts')], label: 'Details', panel: { cut: 1000 } }).mount(document.body);
	view.panel.control(toggle.element);
	return { view, panel: view.panel, toggle: toggle.element, aside: view.element.querySelector('.bui-page-panel') };
}

test('hiding the panel plays its exit before the columns change: inert while it leaves, hidden at its end; showing it again during the exit keeps it', async () => {
	const style = document.head.appendChild(Object.assign(document.createElement('style'), { textContent: ".bui-page-panel[data-motion='out'] { animation: bui-panel-out 120ms forwards; } .bui-page-panel[data-motion='in'] { animation: bui-panel-in 200ms; }" }));
	try {
		const { view, panel, toggle, aside } = scene();
		const moving = page.window.getComputedStyle(aside).animationName;
		toggle.click();
		assert.equal(toggle.getAttribute('aria-expanded'), 'false', 'the toggle says it at once');
		if (moving !== undefined) {
			// The engine computes the stylesheet's animation: the panel leaves before the columns change
			const leaving = aside.dataset.motion === 'out';
			if (leaving) {
				assert.equal(aside.hidden, false, 'still in its column while it leaves');
				assert.equal(aside.inert, true, 'nothing in it is reachable while it leaves');
				aside.dispatchEvent(new page.window.Event('animationend'));
				assert.equal(aside.hidden, false, 'an animation of a descendant does not end it');
				const end = new page.window.Event('animationend', { bubbles: true });
				aside.dispatchEvent(end);
			}
		}
		assert.equal(aside.hidden, true, 'hidden once its exit ended');
		assert.equal(aside.inert, false);
		assert.equal(aside.dataset.motion, undefined);
		toggle.click();
		assert.equal(aside.hidden, false);
		assert.equal(panel.expanded, true);
		view.destroy();
	} finally {
		style.remove();
	}
});

test('an exit that never reports its end is ended by its bound; a kept choice given back changes at once', async () => {
	const { view, panel, aside } = scene();
	const motion = new Motion(aside, (work, delay) => {
		const timer = setTimeout(work, Math.min(delay, 5));
		return () => clearTimeout(timer);
	});
	aside.style.animationName = 'bui-panel-out';
	let done = false;
	const computed = page.window.getComputedStyle;
	page.window.getComputedStyle = node => (node === aside ? { animationName: 'bui-panel-out' } : computed(node));
	try {
		motion.leave(() => (done = true));
		assert.equal(motion.leaving, true);
		assert.equal(aside.inert, true);
		await new Promise(resolve => setTimeout(resolve, 20));
		assert.equal(done, true, 'ended by the bound');
		assert.equal(motion.leaving, false);
		motion.leave(() => assert.fail('a stopped exit never calls done'));
		motion.stop();
		assert.equal(aside.inert, false);
	} finally {
		page.window.getComputedStyle = computed;
	}
	panel.shown = false;
	assert.equal(aside.hidden, true, 'a kept choice is applied at once');
	view.destroy();
});

test('a rail item may widen to the wide lane (D96), in the DOM and patched by update', () => {
	const item = new ui.RailItem({ content: 'npm test', wide: true });
	assert.ok(item.element.hasAttribute('data-wide'));
	item.update({ wide: false });
	assert.ok(!item.element.hasAttribute('data-wide'));
	item.update({ content: 'again' });
	assert.ok(!item.element.hasAttribute('data-wide'), 'what is not given is left as it is');
	assert.ok(!new ui.RailItem({}).element.hasAttribute('data-wide'));
});
