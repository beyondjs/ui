import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** 0.17.1 (D132): one `Again` for every outage, React `useAgain`, the line "Last tried … · trying again by itself" and `Unavailable`'s outage that tries again by itself. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const react = await import('@beyond-js/ui/react');
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
after(() => page.close());
beforeEach(() => page.reset());

/** Timers and a clock moved by hand. */
class Time {
	now = Date.parse('2026-10-18T12:04:00Z');
	#timers = new Map();
	#id = 0;
	setTimeout = (work, wait) => {
		this.#timers.set(++this.#id, { work, at: this.now + wait });
		return this.#id;
	};
	clearTimeout = id => void this.#timers.delete(id);
	get waits() {
		return [...this.#timers.values()].map(timer => timer.at - this.now);
	}
	async pass(milliseconds) {
		this.now += milliseconds;
		for (const [id, timer] of [...this.#timers]) {
			if (timer.at > this.now) continue;
			this.#timers.delete(id);
			timer.work();
		}
		await new Promise(resolve => setTimeout(resolve, 0));
	}
}

/** A read that fails until told to answer, counting its tries and how many ran at once. */
class Read {
	tries = 0;
	running = 0;
	most = 0;
	answer = false;
	#hold = null;
	hold() {
		let release;
		this.#hold = new Promise(resolve => (release = resolve));
		return release;
	}
	run = async () => {
		this.tries += 1;
		this.running += 1;
		this.most = Math.max(this.most, this.running);
		await this.#hold;
		this.running -= 1;
		if (this.answer === 'refused') return { refused: true };
		if (!this.answer) throw new Error('unavailable');
	};
}

const events = () => new page.window.EventTarget();
const visible = () => Object.assign(new page.window.EventTarget(), { visibilityState: 'visible' });

test('it tries after 5, 15, 30 and 60 s, then every 60 s, and stops when the read answers', async () => {
	const time = new Time();
	const read = new Read();
	const again = new ui.Again({ run: read.run, now: () => time.now, timers: time, events: events(), page: visible() });
	const seen = [];
	again.listen(moments => seen.push(moments));
	again.start();
	assert.equal(again.last, time.now, 'the read that found the outage is the first try');
	assert.deepEqual(time.waits, [5000]);
	const tried = [];
	for (const wait of [5000, 15000, 30000, 60000, 60000, 60000]) {
		await time.pass(wait);
		tried.push(read.tries);
		assert.equal(again.last, time.now);
	}
	assert.deepEqual(tried, [1, 2, 3, 4, 5, 6]);
	assert.deepEqual(time.waits, [60000], 'every 60 s from the fourth try');
	read.answer = true;
	await time.pass(60000);
	assert.equal(again.active, false, 'an answer ends the waiting');
	assert.deepEqual(time.waits, [], 'nothing is scheduled');
	assert.ok(seen.some(moments => moments.trying) && seen.at(-1).active === false);
	assert.equal(await again.now(), true, 'stopped, it says it had an answer');
	assert.equal(read.tries, 7, 'and reads nothing');
});

test('a refusal is an answer: it is never tried again', async () => {
	const time = new Time();
	const read = new Read();
	read.answer = 'refused';
	const again = new ui.Again({ run: read.run, now: () => time.now, timers: time, events: events(), page: visible() });
	again.start();
	await time.pass(5000);
	assert.equal(read.tries, 1);
	assert.equal(again.active, false);
	await time.pass(60000);
	assert.equal(read.tries, 1);
	const quiet = new ui.Again({ run: async () => false, now: () => time.now, timers: time, events: events(), page: visible() });
	quiet.start();
	assert.equal(await quiet.now(), false, 'resolving false is not an answer');
	assert.equal(quiet.active, true);
	quiet.stop();
});

test('one try at a time: Try again, online and the page shown again ask while a try runs and get that try', async () => {
	const time = new Time();
	const read = new Read();
	const target = events();
	const document = visible();
	const again = new ui.Again({ run: read.run, now: () => time.now, timers: time, events: target, page: document });
	again.start();
	const release = read.hold();
	const first = again.now();
	const second = again.now();
	target.dispatchEvent(new Event('online'));
	document.dispatchEvent(new Event('visibilitychange'));
	assert.equal(again.trying, true);
	assert.deepEqual(time.waits, [], 'no try is scheduled while one runs');
	release();
	assert.equal(await first, false);
	assert.equal(await second, false);
	assert.equal(read.tries, 1, 'one read');
	assert.equal(read.most, 1);
	assert.deepEqual(time.waits, [15000], 'the next wait follows the one tried');
	target.dispatchEvent(new Event('online'));
	await time.pass(0);
	assert.equal(read.tries, 2, 'the browser back online tries at once');
	again.stop();
	target.dispatchEvent(new Event('online'));
	document.dispatchEvent(new Event('visibilitychange'));
	await time.pass(120000);
	assert.equal(read.tries, 2, 'stopped, nothing is heard or scheduled');
});

test('a hidden page is not read for nobody: the try that falls due waits until the page is shown', async () => {
	const time = new Time();
	const read = new Read();
	const document = visible();
	const again = new ui.Again({ run: read.run, now: () => time.now, timers: time, events: events(), page: document });
	again.start();
	document.visibilityState = 'hidden';
	await time.pass(5000);
	assert.equal(read.tries, 0);
	assert.equal(again.next, null);
	document.visibilityState = 'visible';
	document.dispatchEvent(new Event('visibilitychange'));
	await time.pass(0);
	assert.equal(read.tries, 1, 'shown again, it tries at once');
	again.stop();
});

test('the line says when it last tried and that it tries by itself, in English and Spanish, and hides once answered', async () => {
	const time = new Time();
	const read = new Read();
	const again = new ui.Again({ run: read.run, now: () => time.now, timers: time, events: events(), page: visible() });
	const line = new ui.AgainLine({ again, locale: 'en-GB', now: () => time.now }).mount(document.body);
	assert.equal(line.element.hidden, true, 'nothing to say before it waits');
	again.start();
	const at = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(time.now));
	assert.equal(line.text, `Last tried ${at} · trying again by itself`);
	const release = read.hold();
	const trying = again.now();
	assert.equal(line.text, 'Trying again…');
	assert.equal(line.element.dataset.again, 'trying');
	release();
	await trying;
	assert.equal(line.element.dataset.again, 'waiting');
	assert.match(ui.AgainLine.say({ active: true, trying: false, last: time.now }, { labels: ui.AgainLine.labels.es, locale: 'es', now: time.now }), /^Último intento \d\d:\d\d · se vuelve a intentar por sí solo$/);
	assert.equal(ui.AgainLine.say({ active: false, trying: false, last: time.now }), '');
	assert.deepEqual(Object.keys(ui.AgainLine.labels.en), Object.keys(ui.AgainLine.labels.es));
	read.answer = true;
	await again.now();
	assert.equal(line.element.hidden, true);
	line.destroy();
});

test('Unavailable with kind outage and its read tries again by itself, offers Try again and recovers; a refusal never tries', async () => {
	const time = new Time();
	const read = new Read();
	const shown = new ui.Unavailable({ title: 'Snapshots is not answering', reason: 'Your snapshots are safe.', kind: 'outage', again: { run: read.run, now: () => time.now, timers: time, events: events(), page: visible() } }).mount(document.body);
	const line = shown.element.querySelector('.bui-again');
	assert.match(line.textContent, /^Last tried .+ · trying again by itself$/);
	const retry = shown.element.querySelector('.bui-unavailable-actions button');
	assert.equal(retry.textContent, 'Try again', 'no action of the product: the shared Try again');
	retry.click();
	await time.pass(0);
	assert.equal(read.tries, 1);
	read.answer = true;
	await time.pass(15000);
	assert.equal(read.tries, 2, 'it read again by itself and the service answered');
	assert.equal(shown.again.active, false);
	assert.equal(line.hidden, true);
	shown.destroy();
	const own = document.createElement('button');
	const second = new ui.Unavailable({ title: 'x', reason: 'y', kind: 'outage', action: own, again: async () => {}, labels: ui.Unavailable.labels.es });
	assert.equal(second.element.querySelector('.bui-unavailable-actions button'), own, 'the product’s own action is kept');
	assert.match(second.element.querySelector('.bui-again').textContent, /^Último intento/);
	second.destroy();
	assert.equal(second.again.active, false, 'destroyed, it stops');
	const refused = new ui.Unavailable({ title: 'No access', reason: 'Ask an owner.', kind: 'access', again: read.run });
	assert.equal(refused.again, null, 'a refusal is never tried again');
	assert.equal(refused.element.querySelector('.bui-again'), null);
	assert.ok(ui.Unavailable.labels.es.retry && ui.Unavailable.labels.es.tried);
});

test('React useAgain and Unavailable: tries while failing, stops when the place answers or goes away', async () => {
	const h = React.createElement;
	const host = document.body.appendChild(document.createElement('div'));
	const root = createRoot(host);
	const time = new Time();
	const read = new Read();
	const seen = [];
	function Place({ failing }) {
		const again = react.useAgain(failing, read.run, { now: () => time.now, timers: time, events: events(), page: visible() });
		seen.push(again);
		return failing ? h(react.AgainLine, { moments: again }) : h('p', null, 'Your snapshots');
	}
	await React.act(() => root.render(h(Place, { failing: true })));
	assert.match(host.textContent, /^Last tried .+ · trying again by itself$/);
	await React.act(() => seen.at(-1).now());
	assert.equal(read.tries, 1, 'Try again');
	await React.act(() => root.render(h(Place, { failing: false })));
	assert.equal(seen.at(-1).active, false, 'answered: it stops');
	await time.pass(60000);
	assert.equal(read.tries, 1);
	let calls = 0;
	await React.act(() => root.render(h(react.Unavailable, { title: 'CDN is not answering', reason: 'Nothing was lost.', kind: 'outage', again: async () => void (calls += 1) })));
	assert.match(host.querySelector('.bui-again').textContent, /trying again by itself/);
	await React.act(() => host.querySelector('.bui-unavailable-actions button').click());
	assert.equal(calls, 1);
	assert.equal(host.querySelector('.bui-again'), null, 'the read answered: the line goes');
	await React.act(() => root.render(h(react.Unavailable, { title: 'No access', reason: 'Ask an owner.', kind: 'access', again: async () => void (calls += 1) })));
	assert.equal(host.querySelector('.bui-again'), null, 'a refusal is never tried again');
	await React.act(() => root.unmount());
});
