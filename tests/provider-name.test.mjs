import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

/** The names a page's `open()` calls give their windows, and the windows they return. */
class Names {
	given = [];
	install(view) {
		const saved = view.open;
		view.open = (href, name) => {
			this.given.push(name);
			return { href, name, closed: false, close() { this.closed = true; }, focus() {}, location: { replace: address => void address } };
		};
		return () => (view.open = saved);
	}
}

const start = (options = {}) => new ui.ProviderWindow({ provider: 'GitHub', href: '/v1/providers/github/start', read: async () => ({ state: 'pending' }), same: false, interval: 0, channel: null, ...options }).mount(document.body);

test('ProviderWindow opens its window as beyond-provider unless a name is given (0.44.0)', () => {
	const names = new Names();
	const restore = names.install(window);
	try {
		const plain = start();
		plain.open();
		assert.deepEqual(names.given, ['beyond-provider']);
		plain.destroy();
	} finally {
		restore();
	}
});

test('two trips from one page, each named after its attempt, open two windows', () => {
	const names = new Names();
	const restore = names.install(window);
	try {
		const first = start({ name: 'beyond-provider-a1' });
		const second = start({ name: 'beyond-provider-a2' });
		first.open();
		second.open();
		assert.deepEqual(names.given, ['beyond-provider-a1', 'beyond-provider-a2']);
		assert.equal(first.state, 'open');
		assert.equal(second.state, 'open');
		first.destroy();
		second.destroy();
	} finally {
		restore();
	}
});
