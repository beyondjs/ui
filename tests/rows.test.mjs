import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** StatusRow, CopyMessage and ProviderWindow (0.7.0): one state with its way on, a text to copy, and a provider's window read from the server. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

/** A provider window a test opens, closes and blocks. */
class Popups {
	opened = [];
	blocked = false;
	install(view) {
		const saved = view.open;
		view.open = href => {
			if (this.blocked) return null;
			// Opened blank, then sent to the address (0.7.5)
			const popup = { href, closed: false, close() { this.closed = true; }, focus() { this.focused = true; }, location: { replace: address => (popup.href = address) } };
			this.opened.push(popup);
			return popup;
		};
		return () => (view.open = saved);
	}
}

test('StatusRow: one state with how fresh it is, its reason, who can change it, facts and one action, updated in place', () => {
	const clock = new ui.Clock({ now: () => Date.parse('2026-10-04T12:10:00Z') });
	const action = Object.assign(document.createElement('button'), { textContent: 'Unsuspend on GitHub' });
	const row = new ui.StatusRow({ title: 'acme', kind: 'GitHub organization', state: { label: 'Suspended', tone: 'warning', checked: '2026-10-04T12:08:00Z' }, reason: 'The Beyond app is suspended on acme.', owner: 'Whoever suspended it on GitHub', facts: ['Linked by Ada · 12 Sep'], action, more: [{ label: 'Disconnect acme', run: () => {} }], clock }).mount(document.body);
	const region = row.element;
	assert.equal(region.tagName, 'SECTION');
	assert.equal(document.getElementById(region.getAttribute('aria-labelledby')).textContent, 'acme');
	assert.equal(region.querySelector('h3').textContent, 'acme', 'a level-3 title by default');
	assert.equal(row.text, 'Suspended · Checked 2 min ago');
	assert.match(region.textContent, /GitHub organization.*The Beyond app is suspended on acme\.Who can change this: Whoever suspended it on GitHub.*Linked by Ada/);
	assert.ok(region.querySelector('.bui-statusrow-actions').contains(action));
	const more = region.querySelector('.bui-menu-button');
	assert.equal(more.getAttribute('aria-label'), 'More actions for acme');
	row.update({ state: { label: 'Active', tone: 'success', checked: '2026-10-04T12:10:00Z' }, reason: null, owner: null, action: null, more: [] });
	assert.equal(row.text, 'Active · Checked just now');
	assert.equal(region.querySelector('.bui-statusrow-reason').hidden, true);
	assert.equal(region.querySelector('.bui-statusrow-actions').hidden, true, 'no action, no actions line');
	row.update({ state: { label: 'Active', tone: 'success', checked: '2026-10-04T12:00:00Z', connected: false } });
	assert.match(row.text, /^Last known: Active/);
	assert.ok(region.querySelector('.bui-statusrow-neutral'), 'a lost source is never drawn as a state');
	const spanish = new ui.StatusRow({ title: 'acme', state: { label: 'Activa' }, owner: 'Propietarios', labels: { ...ui.StatusRow.labels.es, freshness: ui.Freshness.labels.es } });
	assert.match(spanish.element.textContent, /Quién puede cambiarlo: Propietarios/);
	row.destroy();
	spanish.destroy();
});

test('CopyMessage: the text whole, one copy action, and a refused or silent clipboard said in place with the text selected', async () => {
	const saved = navigator.clipboard.writeText;
	const copies = [];
	navigator.clipboard.writeText = async text => void copies.push(text);
	const message = new ui.CopyMessage({ text: 'Could you approve the Beyond app for acme on GitHub?', label: 'Message for an owner of acme' }).mount(document.body);
	const button = message.element.querySelector('button');
	assert.equal(button.textContent, 'Copy message');
	assert.equal(await message.copy(), true);
	assert.deepEqual(copies, ['Could you approve the Beyond app for acme on GitHub?']);
	assert.equal(message.element.querySelector('.bui-copy-result').textContent, 'Copied');
	navigator.clipboard.writeText = async () => {
		throw new Error('NotAllowedError');
	};
	assert.equal(await message.copy(), false);
	assert.match(message.element.querySelector('.bui-copy-result').textContent, /didn’t let Beyond copy it/);
	assert.match(String(window.getSelection()), /approve the Beyond app/);
	const bound = ui.CopyMessage.bound;
	ui.CopyMessage.bound = 20;
	navigator.clipboard.writeText = () => new Promise(() => {});
	assert.equal(await message.copy(), false, 'no answer within the bound');
	ui.CopyMessage.bound = bound;
	const command = new ui.CopyMessage({ text: 'ssh -p 2222 ada@env-1', kind: 'command', labels: ui.CopyMessage.labels.es }).mount(document.body);
	assert.equal(command.element.querySelector('pre code').textContent, 'ssh -p 2222 ada@env-1');
	assert.equal(command.element.querySelector('button').textContent, 'Copiar comando');
	command.text = 'ssh -p 2223 ada@env-2';
	assert.equal(command.element.querySelector('code').textContent, 'ssh -p 2223 ada@env-2');
	navigator.clipboard.writeText = saved;
	message.destroy();
	command.destroy();
});

test('ProviderWindow: opened from a press, followed while open, and ended by what the server says once it closes', async () => {
	const popups = new Popups();
	const restore = popups.install(window);
	const answers = [{ state: 'pending' }, { state: 'done', connection: 'con_acme' }];
	const ended = [];
	const provider = new ui.ProviderWindow({ provider: 'GitHub', href: 'https://projects.example.test/v1/providers/github/start', same: false, poll: 5, read: async () => answers.shift(), onend: (outcome, answer) => ended.push([outcome, answer.connection]) }).mount(document.body);
	const start = provider.element.querySelector('button');
	assert.equal(start.textContent, 'Continue to GitHub');
	start.click();
	assert.equal(provider.state, 'open');
	assert.equal(popups.opened[0].href, 'https://projects.example.test/v1/providers/github/start');
	assert.match(provider.element.textContent, /Finish on GitHub.*Complete the steps in the GitHub window\. This page updates by itself\./);
	provider.element.querySelector('.bui-provider-actions .bui-button-secondary').click();
	assert.equal(popups.opened[0].focused, true, 'Reopen brings the open window forward');
	popups.opened[0].closed = true;
	await page.until(() => provider.state === 'closed');
	assert.match(provider.element.textContent, /The GitHub window closed before you finished\. Nothing was connected\./);
	provider.element.querySelector('button').click();
	await page.until(() => popups.opened.length === 2);
	popups.opened[1].closed = true;
	await page.until(() => provider.state === 'done');
	assert.deepEqual(ended, [['done', 'con_acme']]);
	assert.equal(provider.element.textContent, '');
	provider.destroy();
	restore();
});

test('ProviderWindow: a blocked window offers this tab, messages count only from the allowed origin, and a silent read is said', async () => {
	const popups = new Popups();
	const restore = popups.install(window);
	let reads = 0;
	let answer = { state: 'done' };
	const provider = new ui.ProviderWindow({ provider: 'GitHub', href: '/start', origin: 'https://projects.example.test', same: false, poll: 1000, bound: 30, read: async () => (reads++, answer) }).mount(document.body);
	popups.blocked = true;
	provider.open();
	assert.equal(provider.state, 'blocked');
	assert.match(provider.element.textContent, /Your browser blocked the GitHub window\./);
	assert.deepEqual([...provider.element.querySelectorAll('button')].map(node => node.textContent), ['Continue in this tab', 'Try the window again']);
	popups.blocked = false;
	provider.element.querySelectorAll('button')[1].click();
	assert.equal(provider.state, 'open');
	window.dispatchEvent(new window.MessageEvent('message', { origin: 'https://evil.example.test', data: { type: 'beyond-provider' } }));
	await new Promise(resolve => setTimeout(resolve, 10));
	assert.equal(reads, 0, 'another origin is ignored');
	answer = new Promise(() => {});
	popups.opened[0].closed = true;
	window.dispatchEvent(new window.MessageEvent('message', { origin: 'https://projects.example.test', data: { type: 'beyond-provider' } }));
	await page.until(() => provider.state === 'unknown');
	assert.match(provider.element.textContent, /It isn’t known yet whether you finished on GitHub.*Check again/);
	answer = { state: 'waiting', request: 'req_1' };
	let waited = null;
	const handed = new ui.ProviderWindow({ provider: 'GitHub', href: '/start', same: false, read: async () => answer, onend: outcome => (waited = outcome), labels: ui.ProviderWindow.labels.es }).mount(document.body);
	await handed.check();
	assert.equal(waited, 'waiting', 'a request waiting for an owner is the product\'s to draw');
	assert.equal(handed.element.querySelector('button').textContent, 'Continuar en GitHub');
	provider.destroy();
	handed.destroy();
	restore();
});

test('ProviderWindow: inside a frame or on a touch screen it continues in this tab; Cancel reads nothing', () => {
	const popups = new Popups();
	const restore = popups.install(window);
	const assigned = [];
	const saved = window.matchMedia;
	window.matchMedia = query => ({ matches: query === '(pointer: coarse)' });
	const location = window.location;
	const touch = new ui.ProviderWindow({ provider: 'GitHub', href: '/start?attempt=att_1', read: async () => ({ state: 'none' }) }).mount(document.body);
	const original = location.assign;
	location.assign = href => assigned.push(href);
	touch.open();
	assert.deepEqual(assigned, ['/start?attempt=att_1']);
	assert.equal(touch.state, 'away');
	assert.equal(popups.opened.length, 0);
	window.matchMedia = saved;
	let reads = 0;
	const cancelled = new ui.ProviderWindow({ provider: 'GitHub', href: '/start', same: false, poll: 5, read: async () => (reads++, { state: 'done' }) }).mount(document.body);
	cancelled.open();
	cancelled.element.querySelector('.bui-provider-actions .bui-button-quiet').click();
	assert.equal(cancelled.state, 'idle');
	assert.equal(popups.opened[0].closed, true);
	assert.equal(reads, 0);
	location.assign = original;
	touch.destroy();
	cancelled.destroy();
	restore();
});
