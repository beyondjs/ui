import { Dialog } from '../dialog.js';
import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { names } from '../family/labels.js';

/**
 * The one dialog a session that ended shows, in every product alike.
 *
 * - `expired`: "Sign in again to continue", the person who was signed in, "What you were doing stays
 *   here", **Continue as {name}** and "Use another account".
 * - `revoked`: "You were signed out of Beyond", over an opaque backdrop that hides the page (the session
 *   was ended on purpose, perhaps on a shared computer), with the same actions.
 * - `suspended`: "Your Beyond account is suspended", opaque, with a link to Beyond Accounts and "Use
 *   another account", and no sign-in.
 * - `unavailable`: who did not answer ("Beyond Accounts did not answer", or the product's `source` since
 *   0.33.0), "This page retries automatically", **Try again**. Offline it says "You're offline", that the
 *   session is renewed once back online, and offers nothing, since nothing can answer; back online it tries
 *   again at once.
 *
 * None of them can be dismissed (no ×, Escape, nor a press outside; D63 as amended on 2026-10-07): a
 * product holds nothing a person can use without a session, so each offers a way on instead. While the
 * sign-in window is open (`waiting`) the dialog says to finish there, with "Show the window" and
 * "Cancel"; a blocked window (`blocked`) offers "Continue in this tab" and "Try the window again".
 */
export class SessionNotice {
	static KINDS = Object.freeze(['expired', 'revoked', 'suspended', 'unavailable']);
	static #count = 0;

	#labels;
	#hooks;
	#dialog = null;
	#kind = null;
	#strict = null;
	#phase = 'idle';
	#person = null;
	#accounts;
	#source = null;
	#view;
	#network = () => {
		if (this.#kind !== 'unavailable' || !this.#dialog) return;
		this.#draw();
		if (!this.#offline) this.#hooks.retry();
	};
	#said = `bui-session-said-${(SessionNotice.#count += 1)}`;

	/**
	 * @param {object} options
	 * @param {import('../core/labels.js').Labels} options.labels
	 * @param {string|null} [options.accounts] Beyond Accounts' address, offered to a suspended account
	 * @param {{continue: () => void, other: (() => void)|null, reopen: () => void, cancel: () => void, tab: () => void, retry: () => void}} options.hooks
	 * @param {Window|null} [options.view] the window whose network it hears (0.33.0)
	 */
	constructor({ labels, accounts = null, hooks, view = null }) {
		this.#labels = labels;
		this.#accounts = accounts;
		this.#hooks = hooks;
		this.#view = view;
		view?.addEventListener('online', this.#network);
		view?.addEventListener('offline', this.#network);
	}

	/** Who did not answer, as a product id (`accounts`, `projects`) or a name, for the `unavailable` kind (0.33.0). */
	get source() {
		return this.#source;
	}

	set source(value) {
		this.#source = value ?? null;
	}

	/** The name of who did not answer: Beyond Accounts and Beyond Projects by their full names, the rest as the family's bar names them. */
	get #product() {
		const id = this.#source ?? 'accounts';
		return ['accounts', 'projects'].includes(id) ? `Beyond ${names[id]}` : (names[id] ?? String(id));
	}

	get #offline() {
		return this.#view?.navigator?.onLine === false;
	}

	get shown() {
		return Boolean(this.#dialog?.shown);
	}

	get kind() {
		return this.#kind;
	}

	get phase() {
		return this.#phase;
	}

	/** The dialog's element, or null when none was built. */
	get element() {
		return this.#dialog?.element ?? null;
	}

	/** Opens the dialog for `kind`, or redraws it. */
	show(kind, person = null) {
		const strict = kind === 'revoked' || kind === 'suspended';
		// The dialog's own strictness, kept across hide(): a dialog built for an expired session is never reused for a revoked one
		const rebuild = !this.#dialog || this.#dialog.destroyed || strict !== this.#strict;
		this.#kind = kind;
		this.#person = person;
		this.#phase = 'idle';
		if (rebuild) this.#build(strict);
		this.#draw();
		if (!this.#dialog.shown) void this.#dialog.open();
	}

	/** `idle`, `waiting` (the window is open), `blocked` or `retrying`. */
	set phase(value) {
		this.#phase = value;
		if (this.#dialog) this.#draw();
	}

	/** Closes the dialog: the session was renewed, changed hands or is no longer followed. */
	hide() {
		if (!this.#dialog) return;
		this.#dialog.busy = false;
		this.#dialog.close('done');
		this.#kind = null;
	}

	destroy() {
		this.#view?.removeEventListener('online', this.#network);
		this.#view?.removeEventListener('offline', this.#network);
		this.#dialog?.destroy();
		this.#dialog = null;
	}

	#build(strict) {
		this.#dialog?.destroy();
		// No ×, Escape nor press outside: the person leaves it only through one of its actions
		this.#dialog = new Dialog({ title: '', escape: false, size: 'small' });
		this.#strict = strict;
		// It asks for an answer and cannot be dismissed: announced as an alert dialog, its sentence as its description
		this.#dialog.element.setAttribute('role', 'alertdialog');
		this.#dialog.element.setAttribute('aria-describedby', this.#said);
		this.#dialog.element.classList.add('bui-session');
		this.#dialog.element.classList.toggle('bui-session-opaque', strict);
	}

	#draw() {
		const text = (key, values) => this.#labels.text(key, values);
		const kind = this.#kind;
		const dialog = this.#dialog;
		dialog.element.dataset.kind = kind;
		dialog.element.dataset.phase = this.#phase;
		const away = kind === 'unavailable' && this.#offline;
		dialog.title = away ? text('offline') : text(kind === 'expired' ? 'title' : kind, { product: this.#product });
		const said = away ? 'offline_body' : { expired: 'kept', revoked: 'revoked_body', suspended: 'suspended_body', unavailable: 'unavailable_body' }[kind];
		const line = this.#phase === 'waiting' ? text('waiting') : this.#phase === 'blocked' ? text('blocked') : text(said);
		const status = el('p', { id: this.#said, class: 'bui-session-said', role: kind === 'unavailable' || this.#phase !== 'idle' ? 'status' : null, text: line });
		const focused = dialog.shown && dialog.element.contains(dialog.element.ownerDocument.activeElement);
		dialog.fill([kind === 'unavailable' ? null : this.#chip(), status]);
		dialog.actions = this.#actions();
		// A redraw replaces the buttons: focus moves to the new first choice rather than to the page
		if (focused && !dialog.element.contains(dialog.element.ownerDocument.activeElement)) (dialog.footer.querySelector('[data-autofocus]') ?? dialog.footer.querySelector('button, a'))?.focus();
	}

	#actions() {
		const text = (key, values) => this.#labels.text(key, values);
		const button = (key, run, variant = 'secondary', values = {}) => el('button', { type: 'button', class: `bui-button bui-button-${variant}`, 'data-action': key, onclick: run }, [text(key, values)]);
		const hooks = this.#hooks;
		if (this.#kind === 'suspended') {
			const accounts = this.#accounts ? el('a', { class: 'bui-button bui-button-primary', href: this.#accounts, 'data-action': 'accounts' }, [glyph('external'), el('span', { text: text('accounts') })]) : null;
			return [hooks.other ? button('other', () => hooks.other(), 'quiet') : null, accounts].filter(Boolean);
		}
		if (this.#kind === 'unavailable') {
			if (this.#offline) return [];
			const retry = button(this.#phase === 'retrying' ? 'retrying' : 'retry', () => hooks.retry(), 'primary');
			retry.toggleAttribute('aria-disabled', this.#phase === 'retrying');
			return [retry];
		}
		if (this.#phase === 'waiting') {
			const reopen = button('reopen', () => hooks.reopen());
			reopen.dataset.autofocus = '';
			return [button('cancel', () => hooks.cancel(), 'quiet'), reopen];
		}
		if (this.#phase === 'blocked') {
			const tab = button('tab', () => hooks.tab(), 'primary');
			tab.dataset.autofocus = '';
			return [button('again', () => hooks.continue()), tab];
		}
		const first = SessionNotice.#first(this.#person?.name);
		const go = first ? button('continue', () => hooks.continue(), 'primary', { name: first }) : button('signin', () => hooks.continue(), 'primary');
		go.dataset.autofocus = '';
		return [hooks.other ? button('other', () => hooks.other(), 'quiet') : null, go].filter(Boolean);
	}

	/** The person who was signed in: avatar, name and email, so they recognize themselves. */
	#chip() {
		const person = this.#person;
		if (!person?.name && !person?.email) return null;
		const initials = (person.name ?? person.email ?? '')
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map(word => word[0].toUpperCase())
			.join('');
		return el('div', { class: 'bui-session-person' }, [
			el('span', { class: 'bui-session-avatar', 'aria-hidden': 'true' }, [initials || glyph('user')]),
			el('span', { class: 'bui-session-who' }, [person.name ? el('span', { class: 'bui-session-name', text: person.name }) : null, person.email ? el('span', { class: 'bui-session-email', text: person.email }) : null])
		]);
	}

	static #first(name) {
		return typeof name === 'string' && name.trim() ? name.trim().split(/\s+/)[0] : null;
	}
}
