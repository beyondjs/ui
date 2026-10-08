import { el } from '../core/element.js';
import { Button } from '../button.js';
import { ComposerZone } from './zone.js';

const vias = Object.freeze(['paste', 'drop', 'pick']);

/**
 * How files reach a composer (0.11.0): pasted into the field (an image copied to the clipboard), dropped
 * on the composer (with a visible drop target while files are dragged over it) or picked with Attach (the
 * `attach` glyph beside its word, D11). Each way hands the files to the product's `onfiles(files, via)`;
 * the product checks types and sizes and sets the chips (a refused file is a failed chip with its reason).
 *
 * A paste that carries text is the text's: only a paste of files without text attaches (a screenshot, an
 * image copied from a page), so pasting rich text that also carries a picture never attaches it. Since
 * 0.11.2 a drop on the product's work surface (`attach.zone`, `ComposerZone`) attaches too.
 */
export class ComposerIntake {
	static vias = vias;

	#root;
	#button;
	#input;
	#target;
	#onfiles;
	#depth = 0;
	#handlers = [];
	#zone;

	/**
	 * @param {object} options
	 * @param {HTMLElement} options.root the composer, where files are dropped
	 * @param {HTMLElement} options.box the box the drop target covers
	 * @param {HTMLTextAreaElement} options.field the field files are pasted into
	 * @param {import('../core/labels.js').Labels} options.labels the composer's copy (`attach`, `drop`)
	 * @param {{label?: string|null, accept?: string|null, multiple?: boolean, onfiles: (files: File[], via: 'paste'|'drop'|'pick') => void, zone?: Element|null}} options.attach
	 */
	constructor({ root, box, field, labels, attach }) {
		if (typeof attach?.onfiles !== 'function') throw new TypeError("A composer's attachments arrive through attach.onfiles");
		this.#root = root;
		this.#onfiles = attach.onfiles;
		this.#input = el('input', { type: 'file', class: 'bui-hidden', tabindex: '-1', 'aria-hidden': 'true', accept: attach.accept ?? null, multiple: attach.multiple !== false });
		this.#input.addEventListener('change', () => {
			this.#give([...(this.#input.files ?? [])], 'pick');
			this.#input.value = '';
		});
		this.#button = new Button({ label: attach.label ?? labels.text('attach'), glyph: 'attach', variant: 'quiet', onclick: () => this.#input.click() });
		this.#button.element.classList.add('bui-composer-attach');
		this.#target = el('div', { class: 'bui-composer-drop', 'aria-hidden': 'true' }, [el('span', { text: labels.text('drop') })]);
		box.append(this.#target);
		this.#on(field, 'paste', event => this.#paste(event));
		this.#on(root, 'dragenter', event => this.#enter(event));
		this.#on(root, 'dragover', event => this.#over(event));
		this.#on(root, 'dragleave', event => this.#leave(event));
		this.#on(root, 'drop', event => this.#drop(event));
		this.#zone = new ComposerZone({ words: labels.text('drop'), give: files => this.#give(files, 'drop') });
		this.#zone.element = attach.zone ?? null;
	}

	/** The product's work surface that takes dropped files too (`ComposerZone`), or null (0.11.2). */
	get zone() {
		return this.#zone;
	}

	/** The Attach button and its file input, for the toolbar's start. */
	get elements() {
		return [this.#button.element, this.#input];
	}

	/** Whether files are being dragged over the composer now. */
	get dragging() {
		return this.#root.hasAttribute('data-drop');
	}

	/** Opens the platform's file chooser, as a press on Attach does. */
	pick() {
		this.#input.click();
	}

	destroy() {
		for (const [target, type, handler] of this.#handlers) target.removeEventListener(type, handler);
		this.#handlers = [];
		this.#zone.destroy();
		this.#button.destroy();
		this.#target.remove();
		this.#input.remove();
		this.#root.removeAttribute('data-drop');
	}

	#on(target, type, handler) {
		target.addEventListener(type, handler);
		this.#handlers.push([target, type, handler]);
	}

	#give(files, via) {
		if (files.length) this.#onfiles(files, via);
	}

	#paste(event) {
		const data = event.clipboardData;
		const files = [...(data?.files ?? [])];
		if (!files.length || data.getData?.('text/plain')) return;
		event.preventDefault();
		this.#give(files, 'paste');
	}

	static #files(event) {
		return [...(event.dataTransfer?.types ?? [])].includes('Files');
	}

	#enter(event) {
		if (!ComposerIntake.#files(event)) return;
		event.preventDefault();
		this.#depth += 1;
		this.#root.setAttribute('data-drop', '');
	}

	#over(event) {
		if (!ComposerIntake.#files(event)) return;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
		this.#root.setAttribute('data-drop', '');
	}

	#leave(event) {
		if (!ComposerIntake.#files(event)) return;
		this.#depth = Math.max(0, this.#depth - 1);
		if (!this.#depth) this.#root.removeAttribute('data-drop');
	}

	#drop(event) {
		if (!ComposerIntake.#files(event) && !event.dataTransfer?.files?.length) return;
		event.preventDefault();
		this.#depth = 0;
		this.#root.removeAttribute('data-drop');
		this.#give([...(event.dataTransfer?.files ?? [])], 'drop');
	}
}
