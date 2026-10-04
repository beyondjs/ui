import { el, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { badge, status } from '../feedback.js';
import { TimeWords } from '../time/words.js';

/**
 * The content of one picker result (0.7.0, CNT-93): what a resource row shows to be chosen without
 * opening it.
 *
 * - its picture: `avatar` (an image address, decorative beside the name) or a catalog `glyph`;
 * - its name, then its `marks` (`{ label, tone?, reason? }`, such as "Also in Website" or "Archived on
 *   GitHub"), each a tag whose reason follows in words;
 * - one line of facts: "Private" with a lock or "Public" (`visibility`, in words, D11), the product's
 *   `meta` (a default branch), "Updated 2 h ago" (`updated`) and one `state` (`[label, tone]`);
 * - its `description`, and the reason it cannot be chosen when `disabled`.
 *
 * The row's one action is choosing it: it holds no button, link or field of its own.
 */
export class PickerRow {
	/** The children of an option for `item`, in the words of `labels`. */
	static parts(item, labels, now = Date.now()) {
		const marks = (item.marks ?? []).filter(mark => mark?.label);
		const facts = PickerRow.#facts(item, labels, now);
		const reasons = [...marks.filter(mark => mark.reason).map(mark => mark.reason), item.disabled ? (item.reason ?? labels.text('disabled')) : null].filter(Boolean);
		return [
			el('span', { class: 'bui-option-mark', 'aria-hidden': 'true' }, [glyph('check')]),
			PickerRow.#picture(item),
			el('span', { class: 'bui-option-text' }, [
				el('span', { class: 'bui-option-head' }, [el('span', { class: 'bui-option-label' }, [content(item.label)]), ...marks.map(mark => badge(mark.label, mark.tone ?? 'neutral'))]),
				facts.length ? el('span', { class: 'bui-option-facts' }, facts) : null,
				item.description ? el('span', { class: 'bui-option-description' }, [content(item.description)]) : null,
				...reasons.map(reason => el('span', { class: 'bui-option-reason', text: reason }))
			])
		].filter(Boolean);
	}

	static #picture(item) {
		if (item.avatar) return el('img', { class: 'bui-option-avatar', src: item.avatar, alt: '', width: '20', height: '20', loading: 'lazy' });
		if (item.glyph) return el('span', { class: 'bui-option-glyph', 'aria-hidden': 'true' }, [glyph(item.glyph)]);
		return null;
	}

	static #facts(item, labels, now) {
		const facts = [];
		if (item.visibility === 'private') facts.push(el('span', { class: 'bui-option-private' }, [glyph('lock'), labels.text('private')]));
		else if (item.visibility === 'public') facts.push(el('span', {}, [labels.text('public')]));
		if (item.meta) facts.push(el('span', {}, [content(item.meta)]));
		const updated = TimeWords.moment(item.updated);
		if (updated !== null) facts.push(el('span', { text: PickerRow.#age(now - updated, labels) }));
		if (item.state?.[0]) facts.push(status(item.state[0], item.state[1] ?? 'neutral'));
		return facts.flatMap((fact, index) => (index ? [el('span', { class: 'bui-option-dot', 'aria-hidden': 'true', text: '·' }), fact] : [fact]));
	}

	static #age(elapsed, labels) {
		if (elapsed < 60_000) return labels.text('recent');
		return labels.text('updated', { duration: new TimeWords(labels).rough(elapsed) });
	}
}
