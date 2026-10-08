import { el } from '../core/element.js';
import { Button } from '../button.js';

/**
 * The parts of a `Diff` above its files: the summary line ("3 files changed · +52 −3") with Open all
 * and Fold all when there are two files or more, and the list of files to jump to when there are many,
 * a `nav` named "Files in this change" with one button per file (its path, status and counts).
 */
export class DiffJump {
	#words;

	/** @param {import('./words.js').DiffWords} words */
	constructor(words) {
		this.#words = words;
	}

	/**
	 * The summary line, or null for no files.
	 * @param {import('./entry.js').DiffEntry[]} entries
	 * @param {{open: () => void, fold: () => void}} actions
	 */
	summary(entries, actions) {
		if (!entries.length) return null;
		const added = entries.reduce((sum, entry) => sum + entry.added, 0);
		const removed = entries.reduce((sum, entry) => sum + entry.removed, 0);
		const buttons =
			entries.length > 1
				? el('span', { class: 'bui-diff-actions' }, [
						new Button({ label: this.#words.text('open'), variant: 'quiet', small: true, onclick: actions.open }).element,
						new Button({ label: this.#words.text('fold'), variant: 'quiet', small: true, onclick: actions.fold }).element
					])
				: null;
		return el('div', { class: 'bui-diff-summary' }, [el('p', { class: 'bui-diff-total' }, [this.#words.count('files', entries.length), ' · ', this.#words.tally(added, removed)]), buttons]);
	}

	/**
	 * The list of files to jump to.
	 * @param {import('./entry.js').DiffEntry[]} entries
	 * @param {(path: string) => void} pick
	 */
	list(entries, pick) {
		const items = entries.map(entry =>
			el('li', {}, [
				el('button', { type: 'button', class: 'bui-diff-jump-item', dataset: { path: entry.path, status: entry.status }, onclick: () => pick(entry.path) }, [
					this.#words.path(entry),
					' ',
					el('span', { class: 'bui-diff-status' }, [this.#words.status(entry)]),
					' ',
					this.#words.amount(entry)
				])
			])
		);
		return el('nav', { class: 'bui-diff-jump', 'aria-label': this.#words.text('jump') }, [el('ul', { class: 'bui-diff-jump-list' }, items)]);
	}
}
