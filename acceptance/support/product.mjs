/**
 * A stand-in product for the `session:` checks, served by the acceptance server under `/product/`.
 * Each check names its own `id`, whose state is the product's session (`signed`, or `ended` with a
 * reason) and Beyond Accounts' (`alive` or not, with the reason it ended). `start?mode=` is the
 * product's hand-off: with a living Beyond session it signs the product in and lands with `renewed`;
 * without one a `silent` start lands with `interaction` and Accounts' reason, as `prompt=none` does, and
 * a `window` start shows the stand-in sign-in page, whose button makes Accounts' session alive and
 * starts again. `set` (POST) changes the state.
 */
export class Product {
	static #states = new Map();
	static #person = { id: 'acc_ada', name: 'Ada Lovelace', email: 'ada@example.com' };

	static #state(id) {
		if (!Product.#states.has(id)) Product.#states.set(id, { session: 'signed', reason: null, platform: 'alive', ended: null });
		return Product.#states.get(id);
	}

	/** Answers a `/product/…` request; returns false for any other path. */
	static answer(url, request, response) {
		if (!url.pathname.startsWith('/product/')) return false;
		const id = url.searchParams.get('id') ?? '';
		const state = Product.#state(id);
		const landed = query => `/fixtures/dom/landed.html?${query}&product=demo`;
		const json = body => response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify(body));
		const go = address => response.writeHead(302, { location: address, 'cache-control': 'no-store' }).end();
		const step = url.pathname.slice('/product/'.length);
		if (step === 'session') return json(state.session === 'signed' ? { state: 'signed', person: Product.#person } : { state: 'ended', reason: state.reason });
		if (step === 'set' && request.method === 'POST') {
			for (const key of ['session', 'reason', 'platform', 'ended']) if (url.searchParams.has(key)) state[key] = url.searchParams.get(key) || null;
			return json(state);
		}
		if (step === 'start') {
			const mode = url.searchParams.get('mode');
			if (state.platform === 'alive') {
				state.session = 'signed';
				state.reason = null;
				return go(mode === 'tab' ? '/fixtures/dom/session.html' : landed('session=renewed'));
			}
			if (mode === 'silent') return go(landed(`session=interaction${state.ended ? `&ended=${state.ended}` : ''}`));
			return go(`/fixtures/signin.html?id=${encodeURIComponent(id)}&mode=${mode}`);
		}
		response.writeHead(404).end();
		return true;
	}
}
