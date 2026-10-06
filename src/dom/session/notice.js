import { Dialog } from '../dialog.js';
import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';

/**
 * The one dialog a session that ended shows, in every product alike.
 *
 * - `expired`: "Sign in again to continue", the person who was signed in, "What you were doing stays
 *   here", **Continue as {name}** and "Use another account". It can be closed (Escape, ×): the page
 *   stays readable and the family bar offers "Sign in".
 * - `revoked`: "You were signed out of Beyond", over an opaque backdrop that hides the page (the session
 *   was ended on purpose, perhaps on a shared computer), with the same actions; it cannot be closed.
 * - `suspended`: "Your Beyond account is suspended", opaque, with no sign-in and a link to Beyond
 *   Accounts; it cannot be closed.
 * - `unavailable`: "Beyond Accounts is not answering", with **Try again**; it can be closed.
 *
 * While the sign-in window is open (`waiting`) the dialog says to finish there, with "Show the window"
 * and "Cancel"; a blocked window (`blocked`) offers "Continue in this tab" and "Try the window again".
 */
export class SessionNotice {
	static KINDS = Object.freeze(['expired', 'revoked', 'suspended', 'unavailable']);

	#labels;
	#hooks;
	#dialog = null;
	#kind = null;
	#strict = null;
	#phase = 'idle';
	#person = null;
	#accounts;
	#close;
	#closing = false;

	/**
	 * @param {object} options
	 * @param {import('../core/labels.js').Labels} options.labels
	 * @param {string|null} [options.accounts] Beyond Accounts' address, offered to a suspended account
	 * @param {string} [options.close] the close button's name, in the product's language
	 * @param {{continue: () => void, other: (() => void)|null, reopen: () => void, cancel: () => void, tab: () => void, retry: () => void, dismiss: () => void}} options.hooks
	 */
	constructor({ labels, accounts = null, close = 'Close', hooks }) {
		this.#labels = labels;
		this.#accounts = accounts;
		this.#close = close;
		this.#hooks = hooks;
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

	/** Closes the dialog without calling `dismiss`. */
	hide() {
		if (!this.#dialog) return;
		this.#closing = true;
		this.#dialog.busy = false;
		this.#dialog.close('done');
		this.#closing = false;
		this.#kind = null;
	}

	destroy() {
		this.#closing = true;
		this.#dialog?.destroy();
		this.#dialog = null;
	}

	#build(strict) {
		this.#closing = true;
		this.#dialog?.destroy();
		this.#closing = false;
		// Escape and × close only a dialog the person may leave; the page then stays readable
		const onclose = value => value === null && !this.#closing && this.#hooks.dismiss();
		this.#dialog = new Dialog({ title: '', escape: !strict, size: 'small', onclose, labels: { close: this.#close } });
		this.#strict = strict;
		this.#dialog.element.classList.add('bui-session');
		this.#dialog.element.classList.toggle('bui-session-opaque', strict);
	}

	#draw() {
		const text = (key, values) => this.#labels.text(key, values);
		const kind = this.#kind;
		const dialog = this.#dialog;
		dialog.element.dataset.kind = kind;
		dialog.element.dataset.phase = this.#phase;
		dialog.title = text(kind === 'expired' ? 'title' : kind);
		const said = { expired: 'kept', revoked: 'revoked_body', suspended: 'suspended_body', unavailable: 'unavailable_body' }[kind];
		const line = this.#phase === 'waiting' ? text('waiting') : this.#phase === 'blocked' ? text('blocked') : text(said);
		const status = el('p', { class: 'bui-session-said', role: kind === 'unavailable' || this.#phase !== 'idle' ? 'status' : null, text: line });
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
			return this.#accounts ? [el('a', { class: 'bui-button bui-button-primary', href: this.#accounts, 'data-action': 'accounts' }, [glyph('external'), el('span', { text: text('accounts') })])] : [];
		}
		if (this.#kind === 'unavailable') {
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
