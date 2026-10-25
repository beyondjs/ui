import { el, fill, content } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Button } from '../button.js';
import { ActionMenu } from '../menu.js';

/**
 * The end of a composer's toolbar: the product's extras, the reason sending is unavailable (said
 * beside the action, D44), the stop action while work runs (busy while its `run` works or while the
 * product says so) and the primary action, followed, when there are other ways to send, by a split menu
 * of them: the chevron alone, named "More ways to send" with its tooltip (D11). An unavailable action
 * stays reachable and reads its reason.
 *
 * Since 0.26.0 (D165) Send is one round target with the `up` glyph alone, its words ("Send", "Wake up and
 * send", "Queue") its name and its tooltip, and the stop action the `stop` glyph alone, named by its
 * label ("Interrupt"). Send says its words only when they are what the person must read before sending:
 * a step a message needs (`step`, "Choose a machine and send") or an action that is not a send
 * (`words: true`, "Check whether it started").
 *
 * With nothing to send (`empty`, 0.29.0, D183) Send is quiet and `aria-disabled`, the split menu's ways to
 * send are disabled with it, and nothing is said: a press only puts the caret in the field. A step stays
 * able, since it acts without a message.
 */
export class ComposerActions {
	#element;
	#extras = el('div', { class: 'bui-composer-extras' });
	#reason = el('p', { id: Ids.next('bui-composer-reason'), class: 'bui-composer-reason', hidden: true });
	#split;
	#send;
	#menu = null;
	#stopper = null;
	#stop = null;
	#halting = false;
	#labels;
	#run;
	#refocus;
	#primary = null;
	#label = '';
	#words = false;
	#others = [];
	#disabled = null;
	#step = null;
	#empty = false;
	#busy = false;

	/**
	 * @param {object} options
	 * @param {import('../core/labels.js').Labels} options.labels the composer's copy
	 * @param {(id: string) => void} options.run sends with the action of that id
	 * @param {() => void} options.refocus moves focus to the field when a focused control goes away
	 */
	constructor({ labels, run, refocus }) {
		this.#labels = labels;
		this.#run = run;
		this.#refocus = refocus;
		this.#send = new Button({ label: labels.text('send'), variant: 'primary', glyph: 'up', bare: true, labels: { busy: labels.text('busy') }, onclick: () => this.#run(this.#primary) });
		this.#send.element.classList.add('bui-composer-go');
		this.#split = el('div', { class: 'bui-composer-send' }, [this.#send.element]);
		this.#element = el('div', { class: 'bui-composer-end' }, [this.#extras, this.#reason, this.#split]);
	}

	get element() {
		return this.#element;
	}

	/** The slot before the actions, for the product's extras. */
	get extras() {
		return this.#extras;
	}

	/** The id of the reason's element, which describes the field while sending is unavailable. */
	get reason() {
		return this.#reason.id;
	}

	/** The primary action's id and label (the step's while a step is needed, 0.16.0). */
	get primary() {
		return { id: this.#primary, label: this.#step?.label ?? this.#label };
	}

	/** The step a message needs first (0.16.0, DQ-03): the primary button names it and performs it; null restores it. */
	set step(step) {
		this.#step = step ?? null;
		this.#send.label = this.#step?.label ?? this.#label;
		this.#send.element.toggleAttribute('data-step', Boolean(this.#step));
		this.#face();
		this.#able();
	}

	/** Whether there is nothing to send now (no words, no ready file): Send is quiet while it can't act (0.29.0). */
	set empty(value) {
		if (this.#empty === Boolean(value)) return;
		this.#empty = Boolean(value);
		this.#able();
		this.#items();
	}

	/** Send's glyph alone, or its words when they are what the person must read first (a step, `words`). */
	#face() {
		const words = Boolean(this.#step) || this.#words;
		this.#send.bare = !words;
		this.#send.element.toggleAttribute('data-words', words);
	}

	/**
	 * `[{ id, label, primary?, words? }]`: the first marked primary (else the first) is the button, the
	 * others the split menu; `words` draws the primary's words instead of its glyph (0.26.0).
	 */
	set actions(list) {
		const actions = (Array.isArray(list) ? list : []).filter(action => action && action.label);
		if (!actions.length) actions.push({ id: 'send', label: this.#labels.text('send') });
		const primary = actions.find(action => action.primary) ?? actions[0];
		this.#primary = String(primary.id ?? 'send');
		this.#label = primary.label;
		this.#words = primary.words === true;
		this.#send.label = this.#step?.label ?? primary.label;
		this.#face();
		this.#able();
		this.#others = actions.filter(action => action !== primary).map(action => ({ id: String(action.id ?? action.label), label: action.label }));
		if (this.#others.length && !this.#menu) {
			this.#menu = new ActionMenu({ label: null, name: this.#labels.text('more'), glyph: 'chevron', items: [], align: 'end' });
			this.#split.append(this.#menu.element);
		} else if (!this.#others.length && this.#menu) {
			this.#leave(this.#menu.element);
			this.#menu.destroy();
			this.#menu = null;
		}
		this.#items();
	}

	/** The Dictate button (0.14.0), placed at the end right before the stop action and the primary action. */
	set voice(button) {
		this.#element.insertBefore(button, this.#stopper?.element ?? this.#split);
	}

	/** `{ label, run, busy? }` while work runs, or null. */
	set stop(value) {
		if (!value?.label) {
			if (this.#stopper) this.#leave(this.#stopper.element);
			this.#stopper?.destroy();
			this.#stopper = null;
			this.#stop = null;
			return;
		}
		this.#stop = value;
		if (!this.#stopper) {
			this.#stopper = new Button({ label: value.label, glyph: 'stop', bare: true, labels: { busy: this.#labels.text('busy') }, onclick: () => this.#halt() });
			this.#stopper.element.classList.add('bui-composer-stop');
			this.#element.insertBefore(this.#stopper.element, this.#split);
		} else this.#stopper.label = value.label;
		this.#paint();
	}

	/**
	 * Draws whether sending is unavailable (`{ reason }`, said beside the action) and whether the
	 * composer is busy (a send in flight, or the product's own work).
	 */
	draw({ disabled, busy }) {
		this.#disabled = disabled ?? null;
		this.#busy = Boolean(busy);
		this.#send.busy = this.#busy;
		const reason = this.#disabled?.reason ?? null;
		this.#reason.hidden = !this.#disabled;
		fill(this.#reason, reason ? [content(reason)] : []);
		const button = this.#send.element;
		if (this.#disabled && reason) button.setAttribute('aria-describedby', this.#reason.id);
		else button.removeAttribute('aria-describedby');
		this.#able();
		this.#items();
	}

	destroy() {
		this.#menu?.destroy();
		this.#stopper?.destroy();
		this.#send.destroy();
	}

	/** Whether Send can't act now: nothing to send, and no step, which acts without a message. */
	get #quiet() {
		return this.#empty && !this.#step;
	}

	/** Send's `aria-disabled`: while sending is unavailable, while busy (the button's own) and while quiet. */
	#able() {
		const button = this.#send.element;
		if (this.#disabled || this.#quiet) button.setAttribute('aria-disabled', 'true');
		else if (!this.#busy) button.removeAttribute('aria-disabled');
	}

	/**
	 * The other ways to send wait with Send: with nothing to send or while sending is held they are quiet, and
	 * the reason is said once, beside Send, never under each (D101). Held with a `place` (0.35.0, D183), a
	 * press on one closes the menu and goes there, as a press on Send does; without one it does nothing.
	 */
	#items() {
		if (!this.#menu) return;
		const quiet = Boolean(this.#disabled) || this.#empty;
		const place = Boolean(this.#disabled?.place);
		this.#menu.items = this.#others.map(action => ({ label: action.label, run: () => this.#run(action.id), disabled: quiet && !place, waiting: quiet && place }));
	}

	/** Runs the stop action once at a time; its button stays busy while it works or the product says so. */
	async #halt() {
		if (this.#halting || !this.#stop) return;
		this.#halting = true;
		this.#paint();
		try {
			await this.#stop.run?.();
		} catch (error) {
			globalThis.reportError?.(error);
		} finally {
			this.#halting = false;
			this.#paint();
		}
	}

	#paint() {
		if (this.#stopper) this.#stopper.busy = this.#halting || Boolean(this.#stop?.busy);
	}

	/** A control about to go away gives focus to the field rather than to the page's body. */
	#leave(node) {
		if (node.contains(node.ownerDocument.activeElement)) this.#refocus();
	}
}
