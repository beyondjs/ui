import { Preferences } from '../dom/preferences/preferences.js';
import { OpeningExit } from './exit.js';
import { OpeningFault } from './fault.js';
import { OpeningFonts } from './fonts.js';
import { OpeningFrame } from './frame.js';
import { OpeningRecovery } from './recovery.js';
import { OpeningRetry } from './retry.js';
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
 * once first. When the product's root holds a useful screen with no waiting element, it hands over: the
 * identity settles into the family bar and the rest fades, with the product usable from the first frame.
 * A page restored from the back-forward cache before it opened is opened again, and a development
 * server's error overlay is never covered.
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
	#timers = [];
	#stall = 0;
	#started = false;
	#ended = false;
	#broken = false;
	#failed = false;
	#reloading = false;
	#slow = false;

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
		if (!this.#element) return this.#release();
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
		if (frame.outdated) this.#outdated(frame);
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

	/**
	 * A document drawn by another version of the package: its development server has not restarted since
	 * the package changed under it. The page is drawn again in this version's form, and anything that
	 * goes wrong says that cause, the one established here.
	 */
	#outdated(frame) {
		this.#recovery.cause = 'outdated';
		this.#recovery.keep({ page: frame.drawn ? `@beyond-js/ui ${frame.drawn}` : this.#words.text('earlier') });
		console.warn(`[@beyond-js/ui] This page was drawn by ${frame.drawn ? `@beyond-js/ui ${frame.drawn}` : 'an earlier @beyond-js/ui'}, and its opening is ${OpeningFrame.version}: restart the development server to serve what is installed.`);
	}

	/** Follows the product: its root drawn, the step its waiting element names, or a useful screen */
	#check() {
		if (this.#ended) return;
		// A development server's error overlay says what failed in full: the opening steps aside for it
		if (document.querySelector('body > vite-error-overlay')) return void this.#yield();
		const root = document.querySelector(this.#specs.root);
		if (!root || !root.children.length) return;
		const pending = root.querySelector(this.#specs.pending ?? '[data-bui-opening-wait]');
		if (!pending) return void this.#end(root);
		const id = pending.getAttribute('data-bui-opening-wait') ?? '';
		if (!this.#steps.begin(id, steps.includes(id) ? '' : this.#line(pending))) return;
		this.#slow = false;
		// Progress: a failure the product outlived is no longer waited on
		clearTimeout(this.#stall);
		if (!this.#recovery.state) this.#say(this.#steps.label);
	}

	/**
	 * A step the product does not name, in its own words: its status line, else its first line of text, to
	 * the end of the first sentence; what a region adds later below that line starts no new step (0.21.2)
	 */
	#line(pending) {
		const status = pending.matches('[role="status"]') ? pending : pending.querySelector('[role="status"]');
		const leaf = [...(status ?? pending).querySelectorAll('*')].find(node => !node.children.length && node.textContent.trim());
		const text = (leaf ?? status ?? pending).textContent.replace(/\s+/g, ' ').trim();
		return text.split(/(?<=[.…!?])\s/)[0];
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

	/** Shows a state that cannot simply wait; a failure stops the running step's time where it failed */
	#show(state) {
		this.#steps.show();
		const step = this.#steps.label;
		if (state === 'failed') this.#steps.end();
		this.#steps.mark(state === 'failed' || this.#broken ? 'failed' : 'late');
		this.#element.dataset.state = state;
		this.#say(this.#recovery.show(state, { ...(step ? { step } : {}), steps: this.#steps.text }));
	}

	/** An uncaught failure before a useful screen, said by what it means for the opening (`OpeningFault`) */
	#fault = event => {
		if (this.#ended || this.#reloading || !this.#element || !OpeningFault.counts(event)) return;
		const root = document.querySelector(this.#specs.root);
		const fault = new OpeningFault(event, { drawn: Boolean(root?.children.length), started: this.#started, words: this.#words });
		this.#recovery.keep({ error: fault.text });
		if (!fault.final) return void this.#hold();
		// Code that could not load is loaded again once, by itself, before anything is said
		if (fault.kind === 'load' && navigator.onLine !== false && new OpeningRetry(this.#specs.key).run()) return void (this.#reloading = true);
		this.#broken ||= fault.kind === 'load';
		this.#failed = true;
		clearTimeout(this.#stall);
		this.#show(navigator.onLine === false ? 'offline' : 'failed');
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

	#offline = () => {
		if (!this.#ended) this.#show('offline');
	};

	/** Back online: code that could not load is loaded again; otherwise the product's own reads continue */
	#online = () => {
		if (this.#ended || this.#recovery.state !== 'offline') return;
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

	/** Steps aside at once for a development server's error overlay */
	#yield() {
		this.#ended = true;
		this.#release();
		this.#element.remove();
	}

	#release() {
		for (const timer of this.#timers) clearTimeout(timer);
		clearTimeout(this.#stall);
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
