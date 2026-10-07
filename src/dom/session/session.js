import { Component } from '../core/component.js';
import { Labels } from '../core/labels.js';
import { words } from './words.js';
import { Silent } from './silent.js';
import { Trip } from './trip.js';
import { SessionNotice } from './notice.js';
import { Watch } from './watch.js';
import { Held } from './held.js';
import { Reader } from './reader.js';
import { Retry } from './retry.js';
import { Channel } from './channel.js';

/**
 * A session that ends while the person works, answered the same way in every Beyond product (D63,
 * presenting D26; Beyond Suite's `docs/family/session-renewal.md`). A 401-class answer calls `lost()`, a look
 * on return to the tab calls `check()`. Unless suspended, the session is first renewed with nothing
 * shown (`Silent`, `prompt=none`, once per `pause`); otherwise one dialog (`SessionNotice`) whose
 * Continue signs in in a window that closes itself (`Trip`). The dialog cannot be dismissed (D63 as
 * amended on 2026-10-07): there is no state in which the page is open without a session, so what the
 * page asks for meanwhile waits behind it. Someone else signing in calls `onchanged`; tabs follow each
 * other. `lost({ replay })` resolves true for `read` once renewed, for `write` once renewed while it
 * waited, never for `false`.
 */
export class Session extends Component {
	/** The copy in English and Spanish. */
	static labels = words;
	static STATES = Object.freeze(['signed', 'renewing', 'asking', 'ended']);

	#element;
	#options;
	#labels;
	#person;
	#state = 'signed';
	#kind = null;
	#held = new Held();
	#attempted = 0;
	#retry;
	#host;
	#reader;
	#subscribers = new Set();
	#notice;
	#watch;
	#silent;
	#trip;
	#channel;

	/**
	 * Options, described with their defaults in `types/session.d.ts` (`SessionOptions`): the product's
	 * `product` id, its `read()` of its own session (a rejection is unavailable, never a sign-out) and
	 * its hand-off `start(mode)` for `silent`, `window` and `tab`; who is signed in (`person`,
	 * `expires`); "Use another account" (`other`), Beyond Accounts' address for a suspended account
	 * (`accounts`), a host that asks the person itself (`delegate`, the Desktop), the product's own
	 * sign-in behind Continue (`signin`, an installed shell; since 0.8.2), and `onrenewed` / `onchanged`.
	 */
	constructor({ product, read, start, person = null, expires = null, other = null, accounts = null, delegate = null, signin = null, onrenewed = null, onchanged = null, silent = true, pause = 60_000, bound = 8_000, wait = 10_000, interval = 2_000, document = globalThis.document, labels = {} }) {
		super();
		this.#element = document.createElement('span');
		this.#labels = new Labels(words.en, labels);
		this.#person = person;
		this.#options = { product, start, delegate, signin, onrenewed, onchanged, silent, pause, document };
		this.#reader = new Reader(read, bound);
		this.#retry = new Retry(() => this.#again());
		// A host that did not answer is asked again by itself, on the same steps as Beyond Accounts
		this.#host = new Retry(() => void this.#hand());
		const hooks = {
			continue: () => this.#continue(),
			other: other ? () => other() : null,
			reopen: () => this.#trip.show(start('window')),
			cancel: () => void (this.#trip.stop(), (this.#notice.phase = 'idle')),
			tab: () => this.#tab(),
			retry: () => this.#again()
		};
		this.#notice = new SessionNotice({ labels: this.#labels, accounts, hooks });
		this.#watch = new Watch({ document, check: () => void this.check() });
		this.#watch.expires = expires;
		this.#silent = new Silent({ document, bound: wait });
		this.#trip = new Trip({ document, read: () => this.#reader.read(), interval, hooks: { ondone: answer => this.#renewed(answer, true), onclosed: () => (this.#notice.phase = 'idle'), onblocked: () => (this.#notice.phase = 'blocked') } });
		this.#channel = new Channel(document.defaultView, product, () => void this.#heard());
	}

	get element() {
		return this.#element;
	}

	/** `signed`, `renewing` (nothing shown), `asking` (the dialog) or `ended` (suspended, or a host's no). */
	get state() {
		return this.#state;
	}

	get person() {
		return this.#person;
	}

	/** `expired`, `revoked`, `suspended` or `unavailable` while not signed. */
	get kind() {
		return this.#kind;
	}

	/** The dialog, for a product's tests and its own focus handling. */
	get notice() {
		return this.#notice;
	}

	/** Copy a product shows where a held action was not sent again (`unsent`). */
	text(key, values) {
		return this.#labels.text(key, values);
	}

	/**
	 * A request came back `UNAUTHENTICATED` (or `ACCOUNT_SUSPENDED`): resolves with whether to send it again.
	 * @param {{reason?: string|null, replay?: 'read'|'write'|false}} [lost]
	 */
	lost({ reason = null, replay = 'read' } = {}) {
		if (this.#state === 'ended' || this.destroyed) return Promise.resolve(false);
		const held = this.#held.add(replay);
		// Signed means no recovery runs: the last one ended in a renewal
		if (this.#state === 'signed') void this.#recover(reason);
		return held;
	}

	/**
	 * Reads the session now (on a look, or when a live transport dropped): an ended one is renewed or
	 * asked for before the person acts. Resolves with the state after looking, so a transport says
	 * nothing of its own unless it is `signed` (a dropped stream while signed is an outage).
	 * @returns {Promise<'signed'|'renewing'|'asking'|'ended'>}
	 */
	async check() {
		if (this.#state !== 'signed' || this.destroyed) return this.#state;
		const answer = await this.#reader.read();
		if (this.#state === 'signed' && !this.destroyed) {
			if (answer.state === 'signed') this.#known(answer);
			else if (answer.state === 'ended') void this.lost({ reason: answer.reason ?? null, replay: false });
		}
		return this.#state;
	}

	/** Hears `{type, state, person}` on every change of state, renewal and change of person. */
	subscribe(listener) {
		this.#subscribers.add(listener);
		return () => this.#subscribers.delete(listener);
	}

	destroy() {
		this.#held.settle(false);
		this.#retry.reset();
		this.#host.reset();
		this.#trip.stop();
		this.#watch.destroy();
		this.#notice.destroy();
		this.#channel.close();
		this.#subscribers.clear();
		super.destroy();
	}

	async #recover(reason) {
		this.#go('renewing');
		const { start, silent, pause } = this.#options;
		const address = reason !== 'suspended' && silent && Date.now() - this.#attempted > pause ? start('silent') : null;
		let said = null;
		if (address) {
			this.#attempted = Date.now();
			const { outcome, ended } = await this.#silent.attempt(address);
			said = outcome === 'unavailable' ? 'unavailable' : ended;
		}
		const answer = await this.#reader.read();
		if (this.destroyed) return;
		if (answer.state === 'signed') return this.#renewed(answer, false);
		if (answer.state === 'unavailable' || said === 'unavailable') return this.#ask('unavailable');
		// Beyond Accounts' word on the Beyond session outranks the product's on its own
		const kind = said ?? answer.reason ?? reason;
		this.#ask(kind === 'suspended' || kind === 'revoked' ? kind : 'expired');
	}

	#ask(kind) {
		this.#kind = kind;
		if (kind === 'suspended') this.#held.settle(false);
		// Inside a host (the Desktop) the host is the one voice for every kind: a frame never draws a dialog
		if (this.#options.delegate) return void this.#hand();
		if (kind === 'unavailable') this.#retry.schedule();
		this.#go(kind === 'suspended' ? 'ended' : 'asking');
		this.#notice.show(kind, this.#person);
	}

	/**
	 * A host asks the person (the Desktop); its answer is confirmed with the product's own read. A `false`
	 * answer means the window is closing (the person closed the application, or someone else signed in
	 * there), so the session ends with nothing shown; a host that did not answer, or a yes the product's
	 * read does not confirm, is asked again by itself.
	 */
	async #hand() {
		if (this.destroyed || this.#state === 'ended' || this.#state === 'signed') return;
		this.#go('asking');
		const request = { reason: this.#kind, person: this.#person, address: this.#options.start('window') };
		const done = await Promise.resolve().then(() => this.#options.delegate(request)).catch(() => null);
		if (this.destroyed || this.#state !== 'asking') return;
		if (done === false) return this.#end();
		const answer = done ? await this.#reader.read() : null;
		if (this.destroyed || this.#state !== 'asking') return;
		if (answer?.state === 'signed') return this.#renewed(answer, true);
		this.#host.schedule();
	}

	/** Continue: the sign-in window, or the product's own sign-in (`signin`, an installed shell's browser) */
	async #continue() {
		const { start, signin } = this.#options;
		if (!signin) {
			const address = start('window');
			if (!address) return this.#tab();
			this.#notice.phase = 'waiting';
			return this.#trip.start(address);
		}
		this.#notice.phase = 'waiting';
		const done = await Promise.resolve().then(signin).catch(() => false);
		if (this.destroyed || this.#state !== 'asking') return;
		const answer = done ? await this.#reader.read() : null;
		if (answer?.state === 'signed') return this.#renewed(answer, true);
		this.#notice.phase = 'idle';
	}

	#tab() {
		const address = this.#options.start('tab');
		if (address) this.#options.document.defaultView?.location.assign(address);
	}

	/** Accounts did not answer: tried again by itself (`Retry`), and from the dialog at once. */
	async #again() {
		if (this.#kind !== 'unavailable' || this.#notice.phase === 'retrying') return;
		this.#notice.phase = 'retrying';
		this.#attempted = 0;
		this.#go('renewing');
		await this.#recover(null);
	}

	/** A host's no: nothing held is sent and nothing is shown, since the window is closing. */
	#end() {
		this.#retry.reset();
		this.#host.reset();
		this.#trip.stop();
		this.#held.settle(false);
		this.#go('ended');
	}

	#renewed(answer, interactive) {
		if (this.destroyed) return;
		const person = answer.person ?? null;
		if (this.#person?.id && person?.id && person.id !== this.#person.id) return this.#changed(person);
		this.#person = person ?? this.#person;
		this.#watch.expires = answer.expires ?? null;
		this.#retry.reset();
		this.#host.reset();
		this.#kind = null;
		this.#trip.stop();
		this.#notice.hide();
		this.#held.settle(true);
		this.#go('signed');
		this.#channel.post();
		this.#emit({ type: 'renewed', interactive });
		this.#options.onrenewed?.(this.#person);
	}

	/** Someone else signed in: nothing held is sent, and the product starts again for them. */
	#changed(person) {
		this.#held.settle(false);
		this.#retry.reset();
		this.#host.reset();
		this.#trip.stop();
		this.#notice.hide();
		this.#person = person;
		this.#kind = null;
		this.#go('signed');
		this.#emit({ type: 'changed' });
		if (this.#options.onchanged) return this.#options.onchanged(person);
		this.#options.document.defaultView?.location.assign('/');
	}

	#known(answer) {
		if (this.#person?.id && answer.person?.id && answer.person.id !== this.#person.id) return this.#changed(answer.person);
		this.#person = answer.person ?? this.#person;
		this.#watch.expires = answer.expires ?? null;
	}

	/** Another tab renewed, or the sign-in window's landing spoke. */
	async #heard() {
		if (this.#trip.open) return this.#trip.wake();
		if (this.#state !== 'asking') return;
		const answer = await this.#reader.read();
		if (answer.state === 'signed' && this.#state !== 'signed') this.#renewed(answer, true);
	}

	#go(state) {
		if (state === this.#state) return;
		this.#state = state;
		this.#emit({ type: 'state' });
	}

	#emit(event) {
		for (const listener of [...this.#subscribers]) listener({ ...event, state: this.#state, person: this.#person });
	}
}
