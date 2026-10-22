import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { TechnicalDetails } from '../operations/details.js';

/** One keyed symptom keeps its disclosure, focus and copy control while its evidence changes. */
export class RecoveryEntry extends Component {
	#element;
	#title = el('p');
	#reason = el('p', { class: 'bui-unavailable-reason', hidden: true });
	#details = null;
	#record = null;

	constructor(entry) {
		super();
		this.#element = el('div', {}, [this.#title, this.#reason]);
		this.update(entry);
	}

	get element() { return this.#element; }

	/** Patch existing nodes; identical evidence does not reset a copy result or announce anything. */
	update({ title, reason, details }) {
		if (this.#title.textContent !== title) this.#title.textContent = title;
		if (this.#reason.textContent !== reason) this.#reason.textContent = reason;
		this.#reason.hidden = !reason;
		const record = details ? JSON.stringify(details) : null;
		if (record === this.#record) return;
		this.#record = record;
		if (!details) {
			this.#details?.destroy();
			this.#details = null;
		} else if (this.#details) this.#details.update({ text: '', request: null, time: null, ...details });
		else {
			this.#details = new TechnicalDetails(details);
			this.#element.append(this.#details.element);
		}
	}

	destroy() {
		this.#details?.destroy();
		super.destroy();
	}
}
