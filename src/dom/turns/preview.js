import { el } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Floating } from '../core/floating.js';
import { Status } from '../status/status.js';

const said = value => value !== null && value !== undefined && value !== '';
const tones = Object.freeze({ running: 'running', waiting: 'attention', failed: 'failed' });

/**
 * What a turn holds, shown beside its mark while the pointer rests on it or it has keyboard focus (0.29.0,
 * D182): the turn's message, the start of its answer, its state in words when it has one and its facts,
 * then the keys that move between turns. One surface for the whole index, placed by `Floating` beside the
 * index at the mark's height (flipped above near the window's bottom, kept inside the viewport), in the
 * top layer. It describes the mark it shows (`aria-describedby`), so a screen reader hears it with the
 * mark's name; Escape hides it.
 */
export class TurnPreview {
	#element;
	#title = el('p', { class: 'bui-turns-preview-title' });
	#summary = el('p', { class: 'bui-turns-preview-summary' });
	#facts = el('p', { class: 'bui-turns-preview-facts' });
	#keys = null;
	#floating;
	#side;
	#mark = null;
	#escape = event => event.key === 'Escape' && this.hide();

	/**
	 * @param {object} options
	 * @param {HTMLElement} options.side the index's list, beside which it stands
	 * @param {{previous: string, next: string, words: string}|null} options.keys the keys' line, or null without the page's keys
	 */
	constructor({ side, keys = null }) {
		this.#side = side;
		if (keys) this.#keys = el('p', { class: 'bui-turns-preview-keys' }, [el('kbd', { text: keys.previous }), el('kbd', { text: keys.next }), el('span', { text: keys.words })]);
		this.#element = el('div', { id: Ids.next('bui-turns-preview'), class: 'bui-turns-preview', role: 'tooltip', hidden: true }, [this.#title, this.#summary, this.#facts, this.#keys]);
		side.after(this.#element);
		this.#floating = new Floating(this.#element, { anchor: side, placement: 'below', align: 'start', gap: 0, quiet: true });
	}

	get element() {
		return this.#element;
	}

	/** Whether it is shown now. */
	get shown() {
		return !this.#element.hidden;
	}

	/** The mark it shows, or null. */
	get mark() {
		return this.#mark;
	}

	/** Shows what the turn of `mark` holds beside it. */
	show(mark) {
		if (!mark?.item) return this.hide();
		this.#describe(mark);
		this.#fill(mark);
		this.#floating.anchor = this.#anchor(mark);
		this.#element.hidden = false;
		if (!this.#floating.show()) this.hide();
		else this.#element.ownerDocument.addEventListener('keydown', this.#escape);
	}

	hide() {
		this.#describe(null);
		this.#floating.hide();
		this.#element.hidden = true;
		this.#element.ownerDocument.removeEventListener('keydown', this.#escape);
	}

	destroy() {
		this.hide();
		this.#floating.destroy();
		this.#element.remove();
	}

	#fill(mark) {
		const { title, summary, facts } = mark.item;
		this.#title.textContent = said(title) ? String(title) : '';
		this.#summary.textContent = said(summary) ? String(summary) : '';
		this.#summary.hidden = !said(summary);
		const words = [].concat(facts ?? []).filter(said).map(String);
		const state = mark.state ? el('span', { class: `bui-status bui-status-${Status.tone(tones[mark.state])}` }, [el('span', { class: 'bui-status-dot', 'aria-hidden': 'true' }), el('span', { class: 'bui-status-label', text: mark.word })]) : null;
		this.#facts.replaceChildren(...[state, state && words.length ? ' · ' : null, words.join(' · ')].filter(said));
		this.#facts.hidden = !state && !words.length;
	}

	/** The mark it shows is described by it, and only that one. */
	#describe(mark) {
		const id = this.#element.id;
		const before = this.#mark?.control;
		if (before && before !== mark?.control) {
			const rest = (before.getAttribute('aria-describedby') ?? '').split(' ').filter(each => each && each !== id);
			if (rest.length) before.setAttribute('aria-describedby', rest.join(' '));
			else before.removeAttribute('aria-describedby');
		}
		this.#mark = mark;
		const control = mark?.control;
		if (!control) return;
		const ids = (control.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
		if (!ids.includes(id)) control.setAttribute('aria-describedby', [...ids, id].join(' '));
	}

	/** A point beside the index, a little above the mark's middle, so the preview's first line meets the mark. */
	#anchor(mark) {
		const side = this.#side;
		return {
			contextElement: mark.control,
			getBoundingClientRect: () => {
				const row = mark.control.getBoundingClientRect();
				const left = side.getBoundingClientRect().right + 12;
				const top = row.top + row.height / 2 - 16;
				return { x: left, y: top, left, right: left, top, bottom: top, width: 0, height: 0 };
			}
		};
	}
}
