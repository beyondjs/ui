import { Preferences } from '../dom/preferences/preferences.js';
import { OpeningExit } from './exit.js';
import { OpeningFault } from './fault.js';
import { OpeningFocus } from './focus.js';
import { OpeningFonts } from './fonts.js';
import { OpeningFrame } from './frame.js';
import { OpeningRecovery } from './recovery.js';
import { OpeningRetry } from './retry.js';
import { OpeningScreen } from './screen.js';
import { OpeningSteps } from './steps.js';
import { OpeningUsual } from './usual.js';
import { OpeningWords, steps } from './words.js';

/**
 * Owns only the document's first opening, before an application has a useful screen (0.21.0, 0.25.0).
 *
 * A quick opening shows the product's identity and a live trace, nothing to read. Past `reveal` it says
 * its steps as they happen, each with its time: the document's own (`interface`), then each step the
 * product names on its waiting element (`data-bui-opening-wait`). It says once when a step takes longer
 * than it usually does on this device. When it cannot simply wait it says only what is true: still
 * running past `bound` (or after a failure the product may outlive, with no progress within `stall`),
 * unable to open (its code could not load or threw before drawing anything: every sign of progress
 * stops), or offline (it opens by itself on reconnecting). Code that could not load reloads by itself
 * once first. Once the product's root holds its structure with no waiting element, the opening covers
 * it (`arriving`) until its first screen is complete, within a budget (`OpeningScreen`, 0.31.0), then hands
 * over: the identity settles into the family bar and the rest fades, the product usable from the first
 * frame. A page restored from the back-forward cache before it opened is opened again, and a
 * development server's error overlay is never covered. Since 0.35.0 a focus the product asks for while
 * covered lands when it shows (`OpeningFocus`), and `html[data-bui-opened]` says the opening has gone.
 */
class OpeningRuntime {
	/** Milliseconds from the navigation's start before the steps are said: a quick opening says none */
	static reveal = 800;
	/** Milliseconds from the navigation's start before an unfinished opening offers Reload (engineering default) */
	static bound = 12000;
	/** Milliseconds a failure the product may outlive is given to show progress (engineering default) */
	static stall = 4000;

	#specs;
	#element;
	#status;
	#words;
	#usual;
	#steps;
	#recovery;
	#observer;
	#language;
	#screen = new OpeningScreen();
	#focus = null;
	#timers = [];
	#stall = 0;
	#started = false;
	#ended = false;
	#broken = false;
	#failed = false;
	#reloading = false;
	#arriving = false;
	#slow = false;
	/** The failure the technical details name */
	#cause = null;

	constructor(script) {
		this.#specs = JSON.parse(decodeURIComponent(script.dataset.opening));
		const { key, appearance = 'system', locale = 'en', device = false } = this.#specs;
		new Preferences({ key, fallback: { appearance, locale: device && navigator.language.startsWith('es') ? 'es' : locale } }).restore();
		// Installed before module evaluation, including failures that precede DOMContentLoaded.
		addEventListener('error', this.#fault, true);
		addEventListener('unhandledrejection', this.#fault);
		// The document's modules have run: a throw is no longer the product's start
		addEventListener('DOMContentLoaded', () => (this.#started = true), { once: true });
		this.#start();
	}

	#start() {
		this.#element = document.getElementById('bui-opening');
		// No opening to run: the product is there already, and the document says so (0.35.0)
		if (!this.#element) return void (this.#release(), OpeningExit.opened());
		this.#words = new OpeningWords(this.#specs.product);
		const frame = new OpeningFrame(this.#element, this.#words);
		const { stage, status, list } = frame.draw();
		// The controller runs: the static line for an opening without it is no longer needed
		this.#element.querySelector('[data-opening-fallback]')?.remove();
		this.#element.dataset.state = 'opening';
		this.#status = status;
		this.#usual = new OpeningUsual(this.#specs.key);
		this.#steps = new OpeningSteps({ list, words: this.#words, usual: this.#usual });
		this.#recovery = new OpeningRecovery({ parent: stage, words: this.#words, development: Boolean(this.#specs.development) || frame.outdated });
		this.#recovery.keep({ version: `@beyond-js/ui ${OpeningFrame.version}` });
		if (frame.outdated) this.#recovery.outdated(frame.drawn, OpeningFrame.version);
		this.#steps.begin('interface', '', 0);
		this.#observer = new MutationObserver(() => this.#check());
		this.#observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'data-state', 'data-bui-opening-wait'] });
		this.#language = new MutationObserver(() => this.#speak());
		this.#language.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
		this.#timers.push(setTimeout(() => this.#reveal(), Math.max(0, OpeningRuntime.reveal - performance.now())));
		this.#timers.push(setTimeout(() => this.#late(), Math.max(0, OpeningRuntime.bound - performance.now())));
		for (const [type, handler] of [['offline', this.#offline], ['online', this.#online], ['pageshow', this.#restored]]) addEventListener(type, handler);
		if (navigator.onLine === false) this.#offline();
		// Last, so a throw above never leaves focus() wrapped: until the hand-over, a focus asked for is kept
		this.#focus = new OpeningFocus(this.#element);
		this.#check();
	}

	/** Follows the product: its root drawn, the step its waiting element names, or a useful screen */
	#check() {
		if (this.#ended) return;
		// A development server's error overlay says what failed in full: the opening steps aside for it
		if (document.querySelector('body > vite-error-overlay')) return void this.#yield();
		const root = document.querySelector(this.#specs.root);
		if (!root || !root.children.length) return;
		const pending = root.querySelector(this.#specs.pending ?? '[data-bui-opening-wait]');
		if (!pending) return void this.#arrive(root);
		if (this.#arriving) this.#resume();
		const id = pending.getAttribute('data-bui-opening-wait') ?? '';
		if (!this.#steps.begin(id, steps.includes(id) ? '' : this.#words.line(pending))) return;
		this.#slow = false;
		// Progress: a failure the product outlived is no longer waited on, nor said
		clearTimeout(this.#stall);
		if (this.#failed) this.#revive();
		if (!this.#recovery.state) this.#say(this.#steps.label);
	}

	/**
	 * The product drew its structure: its last step ends here. A quick opening covers it until the first
	 * screen is complete, within its budget, so the product arrives once; one that already said its steps
	 * or its recovery hands over at once, since the person waited and each region's wait now says more.
	 */
	#arrive(root) {
		this.#steps.end();
		if (this.#steps.shown || this.#recovery.state || !this.#screen.holds(root)) return void this.#end(root);
		this.#arriving = true;
		this.#screen.watch(() => this.#check());
	}

	/** The product named a step again after drawing its structure: the opening waits for it as before */
	#resume() {
		this.#arriving = false;
		this.#screen.reset();
		if (performance.now() >= OpeningRuntime.reveal) this.#reveal();
	}

	/** The product moved after the opening said it could not open: it is alive, and the opening waits again */
	#revive() {
		this.#failed = false;
		this.#broken = false;
		if (this.#recovery.state === 'offline') return;
		this.#recovery.hide();
		this.#element.dataset.state = 'opening';
		if (performance.now() >= OpeningRuntime.bound) this.#late();
	}

	/** The one announced line: never the ticking time, and the same words are not said twice */
	#say(text) {
		if (this.#status && this.#status.textContent !== text) this.#status.textContent = text;
	}

	/** Past `reveal`, the steps; never while the opening covers a drawn structure, which ends within its budget */
	#reveal() {
		if (this.#ended || this.#arriving) return;
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

	/** Shows a state that cannot simply wait; a failure stops the running step's time where it failed */
	#show(state) {
		this.#steps.show();
		const step = this.#steps.label;
		if (state === 'failed') this.#steps.end();
		this.#steps.mark(state === 'failed' || this.#failed || this.#broken ? 'failed' : 'late');
		this.#element.dataset.state = state;
		this.#say(this.#recovery.show(state, { ...(step ? { step } : {}), steps: this.#steps.text }));
	}

	/** An uncaught failure before a useful screen, said by what it means for the opening (`OpeningFault`) */
	#fault = event => {
		if (this.#ended || this.#reloading || !this.#element || !OpeningFault.counts(event)) return;
		const root = document.querySelector(this.#specs.root);
		// What fails once the product drew its structure is the product's to say: the opening steps aside
		if (this.#arriving && root) return void this.#end(root);
		const fault = new OpeningFault(event, { drawn: Boolean(root?.children.length), started: this.#started, words: this.#words });
		// The details keep the failure that matters: the first one, unless a later one is final
		if (!this.#cause || (fault.final && !this.#cause.final)) {
			this.#cause = fault;
			this.#recovery.keep({ error: fault.text });
		}
		if (!fault.final) return void this.#hold();
		// Code that could not load is loaded again once, by itself, before anything is said
		if (fault.kind === 'load' && navigator.onLine !== false && new OpeningRetry(this.#specs.key).run()) return void (this.#reloading = true);
		this.#broken ||= fault.kind === 'load';
		this.#failed = true;
		clearTimeout(this.#stall);
		// Offline, code that could not load loads again on reconnecting; a start that threw stays said
		const offline = navigator.onLine === false;
		this.#show(offline && this.#broken ? 'offline' : 'failed');
		if (offline) this.#recovery.connected(false);
	};

	/** A failure the product may outlive: said only when nothing moves within `stall`, by what is on screen */
	#hold() {
		clearTimeout(this.#stall);
		this.#stall = setTimeout(() => {
			if (this.#ended || this.#recovery.state) return;
			const drawn = document.querySelector(this.#specs.root)?.children.length;
			this.#failed = !drawn;
			this.#show(drawn ? 'late' : 'failed');
		}, OpeningRuntime.stall);
	}

	/**
	 * Offline is said only when reconnecting can help: over a start that threw, which a connection cannot
	 * fix, the failure stays said and its Reload waits for the connection
	 */
	#offline = () => {
		if (this.#ended) return;
		this.#recovery.connected(false);
		if (!(this.#failed && !this.#broken)) this.#show('offline');
	};

	/** Back online: code that could not load is loaded again; otherwise the product's own reads continue */
	#online = () => {
		if (this.#ended) return;
		this.#recovery.connected(true);
		if (this.#recovery.state !== 'offline') return;
		if (this.#broken) return location.reload();
		if (this.#failed) return this.#show('failed');
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
		const sentence = this.#recovery.speak();
		this.#say(this.#recovery.state ? sentence : this.#steps.label);
	}

	async #end(root) {
		this.#ended = true;
		this.#release();
		this.#steps.end();
		// Only an opening that went as expected is measured
		if (!this.#recovery.state) this.#usual.keep(this.#steps.durations);
		const exit = new OpeningExit(this.#element, root, this.#focus);
		// Whatever the hand-over meets, the opening leaves and the document says so (0.35.0)
		try {
			await exit.run();
		} finally {
			this.#element.remove();
			// One set of faces from now on: the application's own, once the ones in use have loaded (0.17.1)
			new OpeningFonts(document.querySelector('link[data-bui-opening]')?.sheet ?? null).release().catch(() => false);
			exit.landed.then(() => OpeningExit.opened());
		}
	}

	/** Steps aside at once for a development server's error overlay */
	#yield() {
		this.#ended = true;
		this.#release();
		this.#element.remove();
		OpeningExit.opened();
	}

	#release() {
		for (const timer of this.#timers) clearTimeout(timer);
		clearTimeout(this.#stall);
		this.#screen.reset();
		this.#focus?.release();
		this.#steps?.end();
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
