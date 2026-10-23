import { Preferences } from '../dom/preferences/preferences.js';
import { OpeningExit } from './exit.js';
import { OpeningFonts } from './fonts.js';
import { OpeningRecovery } from './recovery.js';
import { OpeningSteps } from './steps.js';
import { OpeningUsual } from './usual.js';
import { OpeningWords, steps } from './words.js';

/**
 * Owns only the document's first opening, before an application has a useful screen (0.21.0).
 *
 * A quick opening shows the product's identity and a live trace, nothing to read. Past `reveal` it says
 * its steps as they happen, each with its time: the document's own (`interface`), then each step the
 * product names on its waiting element (`data-bui-opening-wait`). It says once when a step takes longer
 * than it usually does on this device, says a failure or a lost connection as such, with Reload and
 * Technical details, and loads again by itself when code that could not load can be reached again. When
 * the product's root holds a useful screen with no waiting element, it hands over: the identity settles
 * into the family bar and the rest fades, with the product usable from the first frame. A page restored
 * from the back-forward cache before it opened is opened again.
 */
class OpeningRuntime {
	/** Milliseconds from the navigation's start before the steps are said: a quick opening says none */
	static reveal = 800;
	/** Milliseconds from the navigation's start before an unfinished opening offers Reload (engineering default) */
	static bound = 12000;

	#specs;
	#element;
	#status;
	#words;
	#usual;
	#steps;
	#recovery;
	#observer;
	#language;
	#timers = [];
	#ended = false;
	#broken = false;
	#slow = false;

	constructor(script) {
		this.#specs = JSON.parse(decodeURIComponent(script.dataset.opening));
		const { key, appearance = 'system', locale = 'en', device = false } = this.#specs;
		new Preferences({ key, fallback: { appearance, locale: device && navigator.language.startsWith('es') ? 'es' : locale } }).restore();
		// Installed before module evaluation, including failures that precede DOMContentLoaded.
		addEventListener('error', this.#fault, true);
		addEventListener('unhandledrejection', this.#fault);
		this.#start();
	}

	#start() {
		this.#element = document.getElementById('bui-opening');
		if (!this.#element) return this.#release();
		// The controller runs: the static line for an opening without it is no longer needed
		this.#element.querySelector('[data-opening-fallback]')?.remove();
		this.#element.dataset.state = 'opening';
		this.#status = this.#element.querySelector('[data-opening-status]');
		this.#words = new OpeningWords(this.#specs.product);
		this.#usual = new OpeningUsual(this.#specs.key);
		this.#steps = new OpeningSteps({ list: this.#element.querySelector('[data-opening-steps]'), words: this.#words, usual: this.#usual });
		this.#recovery = new OpeningRecovery({ element: this.#element.querySelector('[data-opening-recovery]'), words: this.#words });
		this.#steps.begin('interface', '', 0);
		this.#observer = new MutationObserver(() => this.#check());
		this.#observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'data-state', 'data-bui-opening-wait'] });
		this.#language = new MutationObserver(() => this.#speak());
		this.#language.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
		this.#timers.push(setTimeout(() => this.#reveal(), Math.max(0, OpeningRuntime.reveal - performance.now())));
		this.#timers.push(setTimeout(() => this.#late(), Math.max(0, OpeningRuntime.bound - performance.now())));
		addEventListener('offline', this.#offline);
		addEventListener('online', this.#online);
		addEventListener('pageshow', this.#restored);
		if (navigator.onLine === false) this.#offline();
		this.#check();
	}

	/** Follows the product: its root drawn, the step its waiting element names, or a useful screen */
	#check() {
		if (this.#ended) return;
		const root = document.querySelector(this.#specs.root);
		if (!root || !root.children.length) return;
		const pending = root.querySelector(this.#specs.pending ?? '[data-bui-opening-wait]');
		if (!pending) return void this.#end(root);
		const id = pending.getAttribute('data-bui-opening-wait') ?? '';
		if (!this.#steps.begin(id, steps.includes(id) ? '' : pending.textContent)) return;
		this.#slow = false;
		if (!this.#recovery.state) this.#say(this.#steps.label);
	}

	/** The one announced line: never the ticking time, and the same words are not said twice */
	#say(text) {
		if (this.#status && this.#status.textContent !== text) this.#status.textContent = text;
	}

	#reveal() {
		if (this.#ended) return;
		this.#steps.show();
		if (!this.#recovery.state) this.#say(this.#steps.label);
		this.#timers.push(setInterval(() => this.#watch(), 500));
	}

	/** Says once per step when it passes its usual time on this device */
	#watch() {
		if (this.#ended || this.#slow || this.#recovery.state || !this.#steps.late) return;
		this.#slow = true;
		this.#say(this.#words.text('longer', { step: this.#steps.label }));
	}

	#late() {
		if (this.#ended || this.#recovery.state) return;
		this.#show('late');
	}

	/** Shows a state that cannot simply wait, with what the details need to say */
	#show(state, error = undefined) {
		this.#steps.show();
		// A failed step's time stops where it failed; a late or offline one keeps counting
		if (state === 'failed') this.#steps.end();
		this.#steps.mark(state === 'failed' || this.#broken ? 'failed' : 'late');
		this.#element.dataset.state = state;
		this.#say(this.#recovery.show(state, { step: this.#steps.label, steps: this.#steps.text, ...(error ? { error } : {}) }));
	}

	/** A script that could not load, or an uncaught failure before a useful screen */
	#fault = event => {
		if (this.#ended || !this.#element) return;
		// Missing images, fonts and optional resources must not turn an opening into a failure.
		if (event.type === 'error' && event.target !== window && event.target?.tagName !== 'SCRIPT') return;
		const script = event.type === 'error' && event.target?.tagName === 'SCRIPT';
		const error = script ? String(event.target.src) : event.type === 'unhandledrejection' ? String(event.reason?.message ?? event.reason) : [event.message, event.filename && `${event.filename}:${event.lineno}`].filter(Boolean).join(' · ');
		const failed = script || /dynamically imported module|importing a module script failed/i.test(error);
		this.#broken ||= failed;
		this.#show(failed ? 'failed' : 'error', error);
		if (navigator.onLine === false) this.#offline();
	};

	#offline = () => {
		if (!this.#ended) this.#show('offline');
	};

	/** Back online: code that could not load is loaded again; otherwise the product's own reads continue */
	#online = () => {
		if (this.#ended || this.#recovery.state !== 'offline') return;
		if (this.#broken) return location.reload();
		this.#recovery.hide();
		this.#steps.mark('active');
		this.#element.dataset.state = 'opening';
		this.#say(this.#steps.label);
		if (performance.now() >= OpeningRuntime.bound) this.#late();
	};

	/** A page that left before it opened (a sign-in, a hand-off) and came back from the cache opens again */
	#restored = event => {
		if (event.persisted && !this.#ended) location.reload();
	};

	/** The document's language changed (the account's, on arrival): every line is said in it */
	#speak() {
		this.#steps.speak();
		this.#say(this.#recovery.state ? this.#recovery.show(this.#recovery.state) : this.#steps.label);
	}

	async #end(root) {
		this.#ended = true;
		this.#release();
		this.#steps.end();
		// Only an opening that went as expected is measured
		if (!this.#recovery.state) this.#usual.keep(this.#steps.durations);
		const focused = this.#element.contains(document.activeElement);
		const leaving = new OpeningExit(this.#element, root).run();
		// A person who reached recovery keeps a keyboard destination when the page arrives late.
		if (focused) {
			const destination = root.querySelector('h1, main, button, a[href]') ?? root;
			if (!destination.hasAttribute('tabindex')) destination.setAttribute('tabindex', '-1');
			destination.focus({ preventScroll: true });
		}
		await leaving;
		this.#element.remove();
		// One set of faces from now on: the application's own, once the ones in use have loaded (0.17.1)
		new OpeningFonts(document.querySelector('link[data-bui-opening]')?.sheet ?? null).release().catch(() => false);
	}

	#release() {
		for (const timer of this.#timers) clearTimeout(timer);
		this.#observer?.disconnect();
		this.#language?.disconnect();
		removeEventListener('error', this.#fault, true);
		removeEventListener('unhandledrejection', this.#fault);
		removeEventListener('offline', this.#offline);
		removeEventListener('online', this.#online);
		removeEventListener('pageshow', this.#restored);
	}
}

new OpeningRuntime(document.currentScript);
