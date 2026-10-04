import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Interaction } from '../core/interaction.js';

/**
 * The line under a picker's list: the status in words (role `status`), Try again after a failure,
 * "Select all shown" while something shown can still be added, and "Load more" while another page
 * exists. A button that leaves while it has focus gives focus back to the search field.
 */
export class PickerFoot {
	#element;
	#status;
	#retry;
	#more;
	#all;
	#input;
	#labels;

	/**
	 * @param {object} options
	 * @param {string} options.id the status's id, which the search field's description names
	 * @param {import('../core/labels.js').Labels} options.labels
	 * @param {HTMLInputElement} options.input the search field
	 * @param {boolean} options.all offers "Select all shown"
	 * @param {{retry: () => void, more: () => void, all: () => void}} options.on
	 */
	constructor({ id, labels, input, all, on }) {
		this.#input = input;
		this.#labels = labels;
		this.#status = el('p', { id, class: 'bui-picker-status', role: 'status' });
		this.#retry = el('button', { type: 'button', class: 'bui-button bui-button-secondary bui-button-small', hidden: true, onclick: () => on.retry() }, [glyph('refresh'), el('span', { text: labels.text('retry') })]);
		this.#more = el('button', { type: 'button', class: 'bui-button bui-button-quiet bui-button-small', hidden: true, onclick: () => on.more() }, [el('span', { text: labels.text('more') })]);
		this.#all = all ? el('button', { type: 'button', class: 'bui-button bui-button-quiet bui-button-small bui-picker-all', hidden: true, onclick: () => on.all() }, [el('span', { text: labels.text('all') })]) : null;
		this.#element = el('div', { class: 'bui-picker-foot' }, [this.#status, this.#retry, this.#all, this.#more]);
	}

	get element() {
		return this.#element;
	}

	/** Says `text`; `problem` marks a failure. */
	say(text, problem = false) {
		this.#status.textContent = text;
		this.#status.classList.toggle('bui-picker-problem', problem);
	}

	/**
	 * The status of a search in words: loading, a failure (the product's `explain`, else "didn't answer
	 * in time" for a source past its bound), nothing to choose, no matches, or how many are shown.
	 */
	describe(search, filtered, explain) {
		const labels = this.#labels;
		const query = search.request?.query ?? '';
		if (search.state === 'loading' || search.state === 'more') return labels.text('loading');
		if (search.state === 'failed') return explain?.(search.error) ?? labels.text(search.error?.name === 'TimeoutError' ? 'late' : 'failure');
		if (search.state !== 'ready') return '';
		const shown = search.items.length + (search.suggested?.items.length ?? 0);
		if (!shown) return query || filtered ? labels.text('empty', { query }) : labels.text('nothing');
		if (search.total !== null) return labels.text('total', { shown, total: search.total });
		return labels.text('shown', { shown });
	}

	/** Shows Try again, and Load more with its busy mark, for the search's state. */
	show({ failed, more, busy }) {
		this.#retry.hidden = !failed;
		this.#keep(this.#more, () => {
			this.#more.hidden = !more;
			this.#more.toggleAttribute('data-busy', busy);
		});
	}

	/** Shows "Select all shown" while `open` (multiple pickers with `all` only). */
	offer(open) {
		if (this.#all) this.#keep(this.#all, () => (this.#all.hidden = !open));
	}

	/** Changes a button; when it leaves while in use, focus goes back to the search field. */
	#keep(button, change) {
		const used = Interaction.used(button);
		change();
		if (used && button.hidden) this.#input.focus();
	}
}
