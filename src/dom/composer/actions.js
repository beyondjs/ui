import { el, fill, content } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Button } from '../button.js';
import { ActionMenu } from '../menu.js';

/**
 * The end of a composer's toolbar: the product's extras, the reason sending is unavailable (said
 * beside the action, D44), the stop action while work runs (a labelled button with the `stop` glyph,
 * busy while its `run` works or while the product says so) and the primary action, followed, when
 * there are other ways to send, by a split menu of them: the chevron alone, named "More ways to send"
 * with its tooltip (D11). An unavailable action stays reachable and reads its reason.
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
	#others = [];
	#disabled = null;

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
		this.#send = new Button({ label: labels.text('send'), variant: 'primary', labels: { busy: labels.text('busy') }, onclick: () => this.#run(this.#primary) });
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

	/** The primary action's id and label. */
	get primary() {
		return { id: this.#primary, label: this.#label };
	}

	/** `[{ id, label, primary? }]`: the first marked primary (else the first) is the button, the others the split menu. */
	set actions(list) {
		const actions = (Array.isArray(list) ? list : []).filter(action => action && action.label);
		if (!actions.length) actions.push({ id: 'send', label: this.#labels.text('send') });
		const primary = actions.find(action => action.primary) ?? actions[0];
		this.#primary = String(primary.id ?? 'send');
		this.#label = primary.label;
		this.#send.label = primary.label;
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
			this.#stopper = new Button({ label: value.label, glyph: 'stop', labels: { busy: this.#labels.text('busy') }, onclick: () => this.#halt() });
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
		this.#send.busy = Boolean(busy);
		const reason = this.#disabled?.reason ?? null;
		this.#reason.hidden = !this.#disabled;
		fill(this.#reason, reason ? [content(reason)] : []);
		const button = this.#send.element;
		if (this.#disabled) {
			button.setAttribute('aria-disabled', 'true');
			if (reason) button.setAttribute('aria-describedby', this.#reason.id);
		} else {
			if (!busy) button.removeAttribute('aria-disabled');
			button.removeAttribute('aria-describedby');
		}
		this.#items();
	}

	destroy() {
		this.#menu?.destroy();
		this.#stopper?.destroy();
		this.#send.destroy();
	}

	#items() {
		if (!this.#menu) return;
		const reason = this.#disabled?.reason ?? null;
		this.#menu.items = this.#others.map(action => ({ label: action.label, run: () => this.#run(action.id), disabled: Boolean(this.#disabled), reason }));
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
