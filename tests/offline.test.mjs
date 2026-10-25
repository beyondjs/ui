import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** 0.33.0: an outage while the browser is offline names no product, says it once and recovers online; Session names who did not answer. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const { SessionProduct, ada } = await import('./support/session.mjs');
SessionProduct.context = { ui, page };
after(() => page.close());
beforeEach(() => page.reset());

/** A browser's network, switched by hand: `onLine` and the window's `online` and `offline` events. */
class Network extends page.window.EventTarget {
	onLine = true;
	set(online) {
		this.onLine = online;
		this.dispatchEvent(new page.window.Event(online ? 'online' : 'offline'));
	}
}

const options = network => ({ events: network, page: null, network });
const failing = async () => false;

test('Again waits while offline, says so to its listeners and tries at once back online', async () => {
	const network = new Network();
	network.onLine = false;
	let tries = 0;
	const again = new ui.Again({ ...options(network), steps: [10], run: async () => (tries += 1, network.onLine) });
	const heard = [];
	again.listen(moments => heard.push(moments.offline));
	again.start();
	assert.equal(again.moments.offline, true);
	await new Promise(resolve => setTimeout(resolve, 40));
	assert.equal(tries, 0, 'a try that falls due offline waits: nothing can answer');
	network.set(true);
	await page.until(() => !again.active);
	assert.equal(tries, 1, 'online again, it tries at once');
	assert.ok(heard.includes(false), 'its listeners heard the network change');
	assert.match(ui.AgainLine.say({ active: true, trying: false, last: Date.now(), offline: true }), /^Last tried .+ · trying again as soon as you’re back online$/);
	assert.match(ui.AgainLine.say({ active: true, trying: false, last: Date.now(), offline: true }, { labels: ui.AgainLine.labels.es }), /^Último intento .* · se vuelve a intentar en cuanto vuelvas a tener conexión$/);
	again.stop();
});

test('offline, the line says the person is offline, with no Try again, and names its cause again online', async () => {
	const network = new Network();
	const recovery = new ui.Recovery({ title: 'Conduict did not answer', again: options(network) }).mount(document.body);
	let answered = false;
	recovery.set('machines', { title: 'Machines', details: { request: 'req_1', time: null, text: 'Failed to fetch' }, run: async () => answered });
	const title = () => recovery.element.querySelector('.bui-recovery-title').textContent;
	const retry = () => recovery.element.querySelector('.bui-recovery-actions button');
	assert.equal(title(), 'Conduict did not answer');
	network.set(false);
	assert.equal(title(), 'You’re offline', 'no product is blamed while the browser is offline');
	assert.equal(recovery.title, 'Conduict did not answer', 'the product’s cause is kept for when it is online');
	assert.equal(recovery.offline, true);
	assert.equal(retry().hidden, true, 'nothing that cannot work');
	assert.match(recovery.element.querySelector('.bui-again').textContent, /as soon as you’re back online$/);
	assert.equal(recovery.element.querySelector(':scope > .bui-hidden[role="status"]').textContent, 'You’re offline');
	assert.equal(recovery.element.querySelectorAll('details').length, 1, 'its evidence stays');
	answered = true;
	network.set(true);
	await page.until(() => recovery.element.hidden);
	assert.equal(title(), 'Conduict did not answer', 'back online it names its cause, and its read answered at once');
	recovery.destroy();
});

test('offline is one incident: the first notice of the page says it and the others wait hidden', () => {
	const network = new Network();
	network.onLine = false;
	const first = new ui.Recovery({ title: 'Beyond Projects did not answer', again: options(network) }).mount(document.body);
	const second = new ui.Recovery({ title: 'Conduict did not answer', again: options(network) }).mount(document.body);
	const local = new ui.Recovery({ title: 'The development service did not answer', again: options(network), local: true }).mount(document.body);
	second.set('work', { title: 'Your work', run: failing });
	assert.equal(second.element.hidden, false, 'alone, it says it');
	first.set('projects', { title: 'Projects', run: failing });
	local.set('files', { title: 'Files', run: failing });
	assert.equal(first.element.hidden, false);
	assert.equal(second.element.hidden, true, 'said once: the first in the page’s order speaks');
	assert.equal(local.element.hidden, false, 'a dependency on this computer is still named');
	assert.equal(local.element.querySelector('.bui-recovery-title').textContent, 'The development service did not answer');
	assert.equal(local.element.querySelector('.bui-recovery-actions button').hidden, false);
	first.destroy();
	assert.equal(second.element.hidden, false, 'the next one speaks once the first leaves');
	network.set(true);
	assert.equal(second.element.querySelector('.bui-recovery-title').textContent, 'Conduict did not answer');
	second.destroy();
	local.destroy();
});

test('offline in Spanish, and Unavailable’s outage says the person is offline in place of who did not answer', () => {
	const network = new Network();
	network.onLine = false;
	const recovery = new ui.Recovery({ title: 'Conduict no respondió', labels: ui.Recovery.labels.es, again: options(network) }).mount(document.body);
	recovery.set('work', { title: 'Tu trabajo', run: failing });
	assert.equal(recovery.element.querySelector('.bui-recovery-title').textContent, 'Estás sin conexión');
	assert.match(recovery.element.querySelector('.bui-again').textContent, /en cuanto vuelvas a tener conexión$/);
	recovery.destroy();
	const shown = new ui.Unavailable({ title: 'Machines aren’t available', reason: 'Conduict did not answer', kind: 'outage', again: { run: failing, ...options(network) } }).mount(document.body);
	const reason = shown.element.querySelector('.bui-unavailable-reason');
	assert.equal([...reason.children].find(node => !node.hidden).textContent, 'You’re offline');
	assert.equal(shown.element.querySelector('.bui-unavailable-actions button').hidden, true);
	network.set(true);
	assert.equal([...reason.children].find(node => !node.hidden).textContent, 'Conduict did not answer');
	assert.equal(shown.element.querySelector('.bui-unavailable-actions button').hidden, false);
	shown.destroy();
});

const { dialog, button } = SessionProduct;

test('Session names who did not answer: the product’s source, its read’s own, else Beyond Accounts', async () => {
	const product = new SessionProduct();
	const session = product.session({ silent: false, source: 'projects', read: async () => Promise.reject(new Error('down')) });
	void session.lost({});
	await page.until(() => dialog()?.open);
	assert.equal(dialog().querySelector('.bui-dialog-title').textContent, 'Beyond Projects did not answer');
	assert.equal(session.notice.source, 'projects');
	session.destroy();
	const own = new SessionProduct().session({ silent: false, read: async () => ({ state: 'unavailable', source: 'conduict' }), labels: ui.Session.labels.es });
	void own.lost({});
	await page.until(() => dialog()?.open);
	assert.equal(dialog().querySelector('.bui-dialog-title').textContent, 'Conduict no respondió');
	own.destroy();
	for (const [source, name] of [['accounts', 'Beyond Accounts'], ['projects', 'Beyond Projects'], ['cdn', 'Beyond CDN'], ['snapshots', 'Beyond Snapshots'], ['delegate', 'Beyond Delegate'], ['conduict', 'Conduict'], ['home', 'Beyond Home'], ['The development service', 'The development service']])
		assert.equal(ui.CauseName.of(source), name, 'the family’s catalog of causes');
	const cdn = new SessionProduct().session({ silent: false, source: 'cdn', read: async () => Promise.reject(new Error('down')) });
	void cdn.lost({});
	await page.until(() => dialog()?.open);
	assert.equal(dialog().querySelector('.bui-dialog-title').textContent, 'Beyond CDN did not answer');
	cdn.destroy();
});

test('Session offline: the dialog says so, offers nothing that cannot work, and tries again back online', async t => {
	const online = Object.getOwnPropertyDescriptor(navigator, 'onLine');
	let state = false;
	Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => state });
	t.after(() => (online ? Object.defineProperty(navigator, 'onLine', online) : delete navigator.onLine));
	const product = new SessionProduct();
	let reads = 0;
	const session = product.session({ silent: false, read: async () => (reads += 1, state ? { state: 'signed', person: ada } : Promise.reject(new TypeError('Failed to fetch'))) });
	void session.lost({});
	await page.until(() => dialog()?.open);
	assert.equal(dialog().querySelector('.bui-dialog-title').textContent, 'You’re offline');
	assert.match(dialog().textContent, /Your session is renewed as soon as you’re back online\. Your work stays here\./);
	assert.equal(button('Try again'), undefined, 'nothing that cannot work');
	const before = reads;
	state = true;
	window.dispatchEvent(new window.Event('online'));
	await page.until(() => session.state === 'signed');
	assert.ok(reads > before, 'back online it reads again at once');
	session.destroy();
});
