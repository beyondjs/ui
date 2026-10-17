import { Component } from '../core/component.js';
import { el, content } from '../core/element.js';
import { Labels } from '../core/labels.js';
import { words, tones } from './labels.js';

/**
 * A state in words with a mark whose **shape** says it as well as its hue (0.15.0, decision C2 and the
 * audit's DQ-04): one component for the dot beside a name and the badge in a row. The states are a
 * closed set (`Status.states`, each to its tone): `ready`, `busy`, `waking`, `asleep`, `attention`,
 * `failed`, `unknown`, `success`, `running`, `idle`, `pending`, `stopped` and `done`. A product maps its
 * own states to them and may give its own words (`label`); otherwise the family's words are used
 * (`Status.labels`). The words always carry the meaning; the mark is hidden from assistive technology.
 *
 * `variant: 'dot'` (default) is the mark and the words; `'badge'` draws them in a pill. A state that is
 * running pulses its ring for a few seconds and then holds; nothing moves under reduced motion. Changing
 * `state` or `label` patches the element in place; with `live` a change is said politely.
 */
export class Status extends Component {
	/** The words of each state in English and Spanish. */
	static labels = words;
	/** Each state's tone: `success`, `progress`, `attention`, `failure`, `idle` or `unknown`. */
	static states = tones;

	#element;
	#text = el('span', { class: 'bui-status-label' });
	#labels;
	#state;
	#label;

	/**
	 * @param {object} options
	 * @param {string} options.state one of `Status.states`; an unknown name is drawn as `unknown`
	 * @param {string|Node|null} [options.label] the product's words, else the family's for the state
	 * @param {'dot'|'badge'} [options.variant]
	 * @param {boolean} [options.live] a change of state or words is announced politely
	 * @param {object} [options.labels] the words of the states (`Status.labels.es`)
	 */
	constructor({ state, label = null, variant = 'dot', live = false, labels = {} }) {
		super();
		this.#labels = new Labels(words.en, labels);
		this.#element = el('span', { class: `bui-status${variant === 'badge' ? ' bui-status-badge' : ''}`, role: live ? 'status' : null }, [el('span', { class: 'bui-status-dot', 'aria-hidden': 'true' }), this.#text]);
		this.#label = label;
		this.state = state;
	}

	/** The tone of a state name (its shape and hue), `unknown` for a name outside the set. */
	static tone(state) {
		return Object.hasOwn(tones, state) ? tones[state] : 'unknown';
	}

	get element() {
		return this.#element;
	}

	get state() {
		return this.#state;
	}

	/** Changes the state; the words follow it unless the product gave its own. */
	set state(state) {
		this.#state = Object.hasOwn(tones, state) ? state : 'unknown';
		const tone = Status.tone(this.#state);
		this.#element.className = this.#element.className.replace(/\bbui-status-(success|progress|attention|failure|idle|unknown)\b/g, '').replace(/\s+/g, ' ').trim();
		this.#element.classList.add(`bui-status-${tone}`);
		this.#element.dataset.state = this.#state;
		this.#element.dataset.tone = tone;
		this.#draw();
	}

	/** The words shown: the product's, or the family's for the state. */
	get label() {
		return this.#text.textContent;
	}

	/** Gives the product's words (null returns to the family's). */
	set label(label) {
		this.#label = label ?? null;
		this.#draw();
	}

	#draw() {
		const words = this.#label ?? this.#labels.text(this.#state);
		if (typeof words === 'string' && this.#text.textContent === words && this.#text.childNodes.length === 1) return;
		this.#text.replaceChildren(content(words) ?? '');
	}
}
