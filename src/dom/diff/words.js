import { el } from '../core/element.js';
import { Labels } from '../core/labels.js';
import { labels as copy } from './labels.js';

/**
 * What `Diff` says, in one place: its labels with the product's own entries, counts formatted for its
 * locale and their plurals, a file's status in words, its path drawn with the directory muted and the
 * name whole, and "+12 −3" with the sentence a screen reader reads in its place.
 */
export class DiffWords {
	#labels;
	#format;

	/**
	 * @param {object} [labels] entries replacing the English defaults
	 * @param {string} [locale] a BCP 47 tag for the counts
	 */
	constructor(labels = {}, locale = undefined) {
		this.#labels = new Labels(copy.en, labels);
		try {
			this.#format = new Intl.NumberFormat(locale);
		} catch {
			this.#format = new Intl.NumberFormat();
		}
	}

	/** One entry's text with its values. */
	text(key, values) {
		return this.#labels.text(key, values);
	}

	/** A count in the locale's digits. */
	number(value) {
		return this.#format.format(value);
	}

	/** An entry that counts something, with its plural. */
	count(key, count) {
		return this.#labels.text(key, { count, number: this.number(count) });
	}

	/** A file's status in words ("Added", "Mode changed"). */
	status(entry) {
		return this.#labels.text(entry.word);
	}

	/** "12 added lines, 3 removed lines". */
	counts(added, removed) {
		return this.#labels.text('counts', { plus: this.count('plus', added), minus: this.count('minus', removed) });
	}

	/** A file's counts, or "Binary" for a binary file, whose lines are not counted. */
	amount(entry) {
		return entry.binary ? el('span', { class: 'bui-diff-count' }, [this.#labels.text('bytes')]) : this.tally(entry.added, entry.removed);
	}

	/** "+12 −3" for sight, with its sentence for a screen reader. */
	tally(added, removed) {
		return el('span', { class: 'bui-diff-count' }, [
			el('span', { 'aria-hidden': 'true' }, [el('span', { class: 'bui-diff-plus' }, [`+${this.number(added)}`]), ' ', el('span', { class: 'bui-diff-minus' }, [`−${this.number(removed)}`])]),
			el('span', { class: 'bui-hidden' }, [this.counts(added, removed)])
		]);
	}

	/** A path with its directory muted and its name in medium weight; a rename as "old → new". */
	path(entry, id = null) {
		const part = path => {
			const cut = path.lastIndexOf('/') + 1;
			return [cut ? el('span', { class: 'bui-diff-dir' }, [path.slice(0, cut)]) : null, el('span', { class: 'bui-diff-name' }, [path.slice(cut)])];
		};
		const moved = entry.previous ? [part(entry.previous), el('span', { class: 'bui-diff-arrow', 'aria-hidden': 'true' }, [' → ']), el('span', { class: 'bui-hidden' }, [` ${this.text('to')} `])] : [];
		return el('span', { class: 'bui-diff-path', id }, [moved, part(entry.path)]);
	}

	/** The words `CopyButton` says, in this diff's language. */
	get copy() {
		const [copied, refused, said, why, selected] = ['done', 'refused', 'said', 'why', 'selected'].map(key => this.text(key));
		return { copy: this.text('path'), copied, refused, said, why, selected };
	}
}
