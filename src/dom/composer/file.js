import { el, fill } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Cut, NameTip } from '../core/cut.js';
import { Button } from '../button.js';

const states = Object.freeze(['uploading', 'failed', 'ready']);

/**
 * One attachment of a composer (0.11.0), as a removable chip patched in place: a thumbnail for an image
 * (the product's object URL, or one made here from the `File` and revoked when it goes) or the `file`
 * glyph, its name (cut on one line only while a tooltip shows it whole on hover; Remove's name and
 * tooltip say it whole on focus, D44), its size and its state in words: uploading with its progress,
 * failed with its reason and Retry, or ready. Remove is the `close` glyph alone (D11's closed list),
 * named "Remove {name}".
 */
export class FileChip {
	static states = states;

	#element;
	#thumb = el('span', { class: 'bui-composer-thumb', 'aria-hidden': 'true' });
	#name = el('span', { class: 'bui-composer-file-name' });
	#meta = el('span', { class: 'bui-composer-file-meta' });
	#bar = el('span', { class: 'bui-composer-file-bar', 'aria-hidden': 'true' }, [el('span')]);
	#retry;
	#remove;
	#tip;
	#url = null;
	#picture = null;
	#item = null;

	/**
	 * @param {object} options
	 * @param {import('../core/labels.js').Labels} options.labels the composer's copy
	 * @param {(item: object) => void} options.onremove the person asked to remove it
	 * @param {(item: object) => void} options.onretry the person asked to try a failed one again
	 */
	constructor({ labels, onremove, onretry }) {
		this.#retry = new Button({ label: labels.text('retry'), variant: 'quiet', onclick: () => onretry(this.#item) });
		this.#retry.element.classList.add('bui-composer-file-retry');
		this.#remove = el('button', { type: 'button', class: 'bui-icon-button bui-composer-file-remove', 'data-bui-hint': true, onclick: () => onremove(this.#item) }, [glyph('close')]);
		const text = el('span', { class: 'bui-composer-file-text' }, [this.#name, this.#meta, this.#bar]);
		this.#element = el('li', { class: 'bui-composer-file' }, [this.#thumb, text, this.#retry.element, this.#remove]);
		this.#tip = new NameTip(this.#name, { text: () => this.#name.textContent, cut: () => Cut.text(this.#name) });
	}

	get element() {
		return this.#element;
	}

	/** The item as the product last gave it. */
	get item() {
		return this.#item;
	}

	/** The state, normalized: `uploading`, `failed` or `ready`. */
	get state() {
		return this.#element.dataset.state;
	}

	/**
	 * @param {{key: string, name: string, size?: number|null, type?: string|null, state?: string, progress?: number|null, reason?: string|null, thumbnail?: string|Blob|null, file?: File|null}} item
	 * @param {{labels: import('../core/labels.js').Labels, size: (bytes: number) => string, percent: (share: number) => string, retry: boolean}} words
	 *   the copy, the formats and whether Retry is offered (the product handles it)
	 */
	update(item, { labels, size, percent, retry }) {
		this.#item = item;
		const state = states.includes(item.state) ? item.state : 'ready';
		const name = String(item.name ?? '');
		this.#element.dataset.state = state;
		if (this.#name.textContent !== name) this.#name.textContent = name;
		this.#remove.setAttribute('aria-label', labels.text('remove', { name }));
		const bytes = Number.isFinite(item.size) ? size(item.size) : null;
		const progress = Number.isFinite(item.progress) ? Math.min(1, Math.max(0, item.progress)) : null;
		const said = state === 'uploading' ? labels.text('uploading', { percent: progress === null ? '' : percent(progress) }).trim() : state === 'failed' ? labels.text('rejected', { reason: item.reason ?? labels.text('unknown') }) : null;
		this.#meta.textContent = [bytes, said].filter(Boolean).join(' · ');
		this.#bar.hidden = state !== 'uploading' || progress === null;
		this.#bar.firstChild.style.setProperty('--bui-file', String(progress ?? 0));
		this.#retry.element.hidden = state !== 'failed' || !retry || item.retry === false;
		this.#show(item);
	}

	destroy() {
		this.#tip.destroy();
		this.#retry.destroy();
		this.#free();
	}

	/** The thumbnail of an image, or the file glyph. */
	#show({ thumbnail = null, file = null, type = null }) {
		const source = thumbnail ?? file;
		const image = typeof source === 'string' || /^image\//.test(type ?? source?.type ?? '');
		if (source === this.#picture && this.#thumb.childNodes.length) return;
		this.#free();
		this.#picture = source;
		if (!source || !image) return void fill(this.#thumb, [glyph('file')]);
		const view = this.#element.ownerDocument.defaultView;
		if (typeof source !== 'string') this.#url = view?.URL?.createObjectURL?.(source) ?? null;
		const address = typeof source === 'string' ? source : this.#url;
		fill(this.#thumb, [address ? el('img', { src: address, alt: '', decoding: 'async' }) : glyph('file')]);
	}

	#free() {
		if (this.#url) this.#element.ownerDocument.defaultView?.URL?.revokeObjectURL?.(this.#url);
		this.#url = null;
	}
}
