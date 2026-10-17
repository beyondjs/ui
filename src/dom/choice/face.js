import { el, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { statement, said } from '../core/statement.js';

/**
 * What a `ChoiceMenu` shows while closed: its button ("Environment: lab", with the state's dot and its
 * words when the state asks for attention; a calm state only in the button's name since 0.11.2, so a dot
 * never stands alone), or, for one option, the statement in its place, with the option's state and its
 * detail (0.7.1).
 */
export class ChoiceFace {
	/**
	 * Draws the button for the option `chosen` (or the placeholder when none is chosen). A chip (0.11.0)
	 * shows its state's word whenever there is one, the dot only beside it, and takes its own `state`
	 * over the chosen option's. With nothing chosen and no placeholder of the product's, a chip's value
	 * is its slot's name ("Machine"), so an empty tray never reads "Choose · Choose" (0.15.0).
	 */
	static draw(button, label, chosen, placeholder, face = null) {
		const own = face?.state ?? null;
		const [state, tone] = (face && own) || chosen?.status || [null, null];
		const attention = tone === 'danger' || tone === 'warning';
		button.dataset.tone = tone ?? '';
		button.classList.toggle('bui-choice-empty', !chosen);
		const slot = Boolean(face?.slot && !chosen);
		const value = el('span', { class: 'bui-choice-value' }, [content(chosen ? chosen.label : slot ? label : placeholder)]);
		const name = slot ? null : el('span', { class: 'bui-choice-label', text: label });
		if (face) {
			// A chip with nothing chosen says its slot's name in the value's place, with its glyph (0.15.0, DQ-02)
			const lead = face.glyph ? glyph(face.glyph) : null;
			button.toggleAttribute('data-slot', slot);
			// A chip: its muted label, the value, then the state's word with its dot beside it, never a dot alone
			const word = state ? el('span', { class: `bui-status bui-status-${tone ?? 'neutral'} bui-chip-state`, 'data-tone': tone ?? 'neutral' }, [el('span', { class: 'bui-status-dot', 'aria-hidden': 'true' }), state]) : null;
			// The whole face in words, for the tooltip of a composer that shortens it to its value (0.11.2)
			button.setAttribute('data-bui-tip', [slot ? label : `${label}: ${value.textContent}`, state].filter(Boolean).join(' · '));
			return button.replaceChildren(...[lead, name, value, word, glyph('chevron')].filter(Boolean));
		}
		button.replaceChildren(
			...[
				name,
				// The dot only beside its shown word (0.11.2): a calm state is in the name alone, never a dot by itself
				chosen && tone && state && attention ? el('span', { class: `bui-choice-dot bui-status-${tone}`, 'aria-hidden': 'true' }, [el('span', { class: 'bui-status-dot' })]) : null,
				value,
				// The state is always in the accessible name; it is shown when it asks for attention
				state ? el('span', { class: attention ? 'bui-choice-state' : 'bui-hidden', text: state }) : null,
				glyph('chevron')
			].filter(Boolean)
		);
	}

	/** The statement of a menu's one option: its label, the option and its state, with the value. */
	static stated(label, option, name) {
		const text = [el('span', { class: 'bui-choice-label', text: label }), ' ', el('span', { class: 'bui-choice-value' }, [content(option.label)])];
		return statement({ text, value: option.value, name, status: option.status ?? null, hint: said(option) });
	}
}
