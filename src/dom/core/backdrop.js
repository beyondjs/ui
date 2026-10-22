/** Dismissal for a pointer gesture that starts and ends outside a modal surface. */
export class Backdrop {
	#element;
	#dismiss;
	#pressed = false;
	#start;
	#end;
	#cancel;

	/** Coordinates backdrop gestures without treating padding or a drag from inside as dismissal. */
	constructor(element, dismiss) {
		this.#element = element;
		this.#dismiss = dismiss;
		this.#start = event => (this.#pressed = event.button === 0 && this.#outside(event));
		this.#end = event => {
			const pressed = this.#pressed;
			this.#pressed = false;
			if (pressed && this.#outside(event)) this.#dismiss();
		};
		this.#cancel = () => this.reset();
		element.addEventListener('pointerdown', this.#start);
		element.addEventListener('click', this.#end);
		element.addEventListener('pointercancel', this.#cancel);
	}

	#outside(event) {
		if (event.target !== this.#element) return false;
		const box = this.#element.getBoundingClientRect();
		return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
	}

	/** Forget an unfinished gesture when the sheet closes or opens again. */
	reset() {
		this.#pressed = false;
	}

	/** Release the surface's listeners. */
	destroy() {
		this.reset();
		this.#element.removeEventListener('pointerdown', this.#start);
		this.#element.removeEventListener('click', this.#end);
		this.#element.removeEventListener('pointercancel', this.#cancel);
	}
}
