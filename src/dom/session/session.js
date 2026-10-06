import { Component } from '../core/component.js';
import { Labels } from '../core/labels.js';
import { words } from './words.js';
import { Silent } from './silent.js';
import { Trip } from './trip.js';
import { SessionNotice } from './notice.js';
import { Guard } from './guard.js';
import { Watch } from './watch.js';
import { Held } from './held.js';
import { Reader } from './reader.js';
import { Retry } from './retry.js';
import { Channel } from './channel.js';

/**
 * A session that ends while the person works, answered the same way in every Beyond product (the
 * family rule on ended sessions, which presents D26).
 *
 * 1. **Renewed without being seen.** A product's request that comes back `UNAUTHENTICATED` calls
 *    `lost()`; a look when the tab is shown again, the network returns or the computer wakes calls
 *    `check()`. Unless the account is suspended, the product's hand-off runs in a hidden frame with
 *    `prompt=none` (`Silent`): with a living Beyond session it renews, the held requests are sent again
 *    and nothing is shown. At most one silent attempt per `pause`, so a loop ends in the dialog.
 * 2. **One dialog when the person is needed** (`SessionNotice`): **Continue as {name}** opens the sign-in
 *    in a window that closes itself (`Trip`), and the page continues where it was. An expired session's
 *    dialog can be closed: the page stays readable, a press that would act opens it again (`Guard`) and
 *    the family bar offers "Sign in". A revoked session hides the page; a suspended account is offered
 *    no sign-in; an unavailable Accounts is not a sign-out and is tried again by itself.
 * 3. **The same person, or a fresh start.** Signing in as someone else drops what was held and calls
 *    `onchanged` (by default the product's home). A renewal in one tab reaches the others.
 *
 * `lost({ replay })` resolves with whether the caller sends its request again: `read` once renewed;
 * `write` once renewed while it waited (not after the dialog was closed); `false` never (a destructive
 * or irreversible action, which the person presses again; `labels.unsent` says so).
 */
export class Session extends Component {
	/** The copy in English and Spanish. */
	static labels = words;
	static STATES = Object.freeze(['signed', 'renewing', 'asking', 'reading', 'ended']);

	#element;
	#options;
	#labels;
	#person;
	#state = 'signed';
	#kind = null;
	#held = new Held();
	#attempted = 0;
	#retry;
	#reader;
	#subscribers = new Set();
	#notice;
	#guard;
	#watch;
	#silent;
	#trip;
	#channel;

	/**
	 * Options, described with their defaults in `types/session.d.ts` (`SessionOptions`): the product's
	 * `product` id, its `read()` of its own session (a rejection is unavailable, never a sign-out) and
	 * its hand-off `start(mode)` for `silent`, `window` and `tab`; who is signed in (`person`,
	 * `expires`); "Use another account" (`other`), Beyond Accounts' address for a suspended account
	 * (`accounts`), the family `bar`, a host that asks the person itself (`delegate`, the Desktop), and
	 * `onrenewed` / `onchanged`.
	 */
	constructor({ product, read, start, person = null, expires = null, other = null, accounts = null, bar = null, delegate = null, onrenewed = null, onchanged = null, silent = true, pause = 60_000, bound = 8_000, wait = 10_000, interval = 2_000, document = globalThis.document, labels = {} }) {
		super();
		this.#element = document.createElement('span');
		this.#labels = new Labels(words.en, labels);
		this.#person = person;
		this.#options = { product, start, bar, delegate, onrenewed, onchanged, silent, pause, document };
		this.#reader = new Reader(read, bound);
		this.#retry = new Retry(() => this.#again());
		const hooks = {
			continue: () => this.#continue(),
			other: other ? () => other() : null,
			reopen: () => this.#trip.show(start('window')),
			cancel: () => void (this.#trip.stop(), (this.#notice.phase = 'idle')),
			tab: () => this.#tab(),
			retry: () => this.#again(),
			dismiss: () => this.#dismiss()
		};
		this.#notice = new SessionNotice({ labels: this.#labels, accounts, close: this.#labels.text('close'), hooks });
		this.#guard = new Guard({ document, onblock: () => this.open() });
		this.#watch = new Watch({ document, check: () => void this.check() });
		this.#watch.expires = expires;
		this.#silent = new Silent({ document, bound: wait });
		this.#trip = new Trip({ document, read: () => this.#reader.read(), interval, hooks: { ondone: answer => this.#renewed(answer, true), onclosed: () => (this.#notice.phase = 'idle'), onblocked: () => (this.#notice.phase = 'blocked') } });
		this.#channel = new Channel(document.defaultView, product, () => void this.#heard());
	}

	get element() {
		return this.#element;
	}

	/** `signed`, `renewing`, `asking` (the dialog), `reading` (closed without signing in) or `ended`. */
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
		if (this.#state === 'ended' || this.#state === 'reading' || this.destroyed) return Promise.resolve(false);
		const held = this.#held.add(replay);
		// Signed means no recovery runs: the last one ended in a renewal
		if (this.#state === 'signed') void this.#recover(reason);
		return held;
	}

	/** Reads the session now (on a look): an ended one is renewed or asked for before the person acts. */
	async check() {
		if (this.#state !== 'signed' || this.destroyed) return;
		const answer = await this.#reader.read();
		if (this.#state !== 'signed' || this.destroyed) return;
		if (answer.state === 'signed') return this.#known(answer);
		if (answer.state === 'ended') void this.lost({ reason: answer.reason ?? null, replay: false });
	}

	/** Opens the dialog again from "Sign in" in the bar, or from a stopped press while reading. */
	open() {
		if (this.#state !== 'reading') return;
		this.#guard.active = false;
		this.#bar(null);
		if (this.#options.delegate) return void this.#hand();
		this.#go('asking');
		this.#notice.show(this.#kind ?? 'expired', this.#person);
	}

	/** Hears `{type, state, person}` on every change of state, renewal and change of person. */
	subscribe(listener) {
		this.#subscribers.add(listener);
		return () => this.#subscribers.delete(listener);
	}

	destroy() {
		this.#held.settle(false);
		this.#retry.reset();
		this.#trip.stop();
		this.#watch.destroy();
		this.#guard.active = false;
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
		if (kind === 'unavailable') this.#retry.schedule();
		if (this.#options.delegate && kind !== 'suspended' && kind !== 'unavailable') return void this.#hand();
		this.#go(kind === 'suspended' ? 'ended' : 'asking');
		this.#notice.show(kind, this.#person);
	}

	/** A host asks the person (the Desktop); its answer is confirmed with the product's own read. */
	async #hand() {
		this.#go('asking');
		const done = await this.#options.delegate({ reason: this.#kind, person: this.#person, address: this.#options.start('window') }).catch(() => false);
		if (this.destroyed || this.#state !== 'asking') return;
		const answer = done ? await this.#reader.read() : null;
		if (answer?.state === 'signed') return this.#renewed(answer, true);
		this.#dismiss();
	}

	#continue() {
		const address = this.#options.start('window');
		if (!address) return this.#tab();
		this.#notice.phase = 'waiting';
		this.#trip.start(address);
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

	/** The dialog was closed: the page stays readable, nothing held is sent, the bar offers "Sign in". */
	#dismiss() {
		if (this.#state === 'ended' || this.#state === 'signed') return;
		this.#trip.stop();
		this.#held.settle(false);
		this.#go('reading');
		this.#guard.active = true;
		this.#bar({ run: () => this.open() });
	}

	#renewed(answer, interactive) {
		if (this.destroyed) return;
		const person = answer.person ?? null;
		if (this.#person?.id && person?.id && person.id !== this.#person.id) return this.#changed(person);
		this.#person = person ?? this.#person;
		this.#watch.expires = answer.expires ?? null;
		this.#retry.reset();
		this.#kind = null;
		this.#trip.stop();
		this.#notice.hide();
		this.#guard.active = false;
		this.#bar(null);
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
		this.#trip.stop();
		this.#notice.hide();
		this.#guard.active = false;
		this.#bar(null);
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
		if (this.#state !== 'asking' && this.#state !== 'reading') return;
		const answer = await this.#reader.read();
		if (answer.state === 'signed' && this.#state !== 'signed') this.#renewed(answer, true);
	}

	#bar(value) {
		if (this.#options.bar) this.#options.bar.signin = value;
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
