import { Tooltip } from '../tooltip.js';

/**
 * A lane's tooltip, made on first need (0.22.0): the package's `Tooltip` over `trigger`, placed by
 * `Floating`, hidden from assistive technology because the lane's own name and description already say
 * its words. It is made on the trigger's first hover (and first focus, with `focus`), so a lane nobody
 * points at adds nothing to the page; from then on the tooltip's own listeners show and hide it. Each time
 * it would show, `when()` decides and `text()` gives its words; `refresh()` writes them again while it is
 * shown, so a ticking duration stays current without redrawing anything else.
 */
export class LaneTip {
	#trigger;
	#text;
	#when;
	#tip = null;
	#first;

	/**
	 * @param {Element} trigger what is pointed at (a lane, or its trace)
	 * @param {{text: () => string, when?: () => boolean, focus?: boolean}} options
	 */
	constructor(trigger, { text, when = () => true, focus = false }) {
		this.#trigger = trigger;
		this.#text = text;
		this.#when = when;
		this.#first = event => {
			// A touch press chooses the lane; it is no hover.
			if (event.type === 'pointerenter' && event.pointerType === 'touch') return;
			this.show();
		};
		trigger.addEventListener('pointerenter', this.#first);
		if (focus) trigger.addEventListener('focus', this.#first);
	}

	/** Whether it is shown now. */
	get shown() {
		return this.#tip?.shown ?? false;
	}

	/** Shows it when `when()` agrees and its trigger is drawn. */
	show() {
		this.#make().show();
	}

	hide() {
		this.#tip?.hide();
	}

	/** Writes its words again while it is shown. */
	refresh() {
		if (this.shown) this.#tip.text = this.#text();
	}

	destroy() {
		this.#release();
		this.#tip?.destroy();
		this.#tip = null;
	}

	#release() {
		this.#trigger.removeEventListener('pointerenter', this.#first);
		this.#trigger.removeEventListener('focus', this.#first);
	}

	#make() {
		if (this.#tip) return this.#tip;
		this.#release();
		const tip = new Tooltip(this.#trigger, {
			text: this.#text(),
			describe: false,
			when: () => {
				if (!this.#when()) return false;
				tip.text = this.#text();
				return true;
			}
		});
		this.#tip = tip;
		return tip;
	}
}
