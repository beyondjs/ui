import { el, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { statement } from '../core/statement.js';

/**
 * What a `ChoiceMenu` shows while closed: its button ("Environment: lab", with the state's dot, and
 * its words when the state asks for attention), or, for one option, the statement in its place.
 */
export class ChoiceFace {
	/** Draws the button for the option `chosen` (or the placeholder when none is chosen). */
	static draw(button, label, chosen, placeholder) {
		const [state, tone] = chosen?.status ?? [null, null];
		const attention = tone === 'danger' || tone === 'warning';
		button.dataset.tone = tone ?? '';
		button.classList.toggle('bui-choice-empty', !chosen);
		button.replaceChildren(
			...[
				el('span', { class: 'bui-choice-label', text: label }),
				chosen && tone ? el('span', { class: `bui-choice-dot bui-status-${tone}`, 'aria-hidden': 'true' }, [el('span', { class: 'bui-status-dot' })]) : null,
				el('span', { class: 'bui-choice-value' }, [content(chosen ? chosen.label : placeholder)]),
				// The state is always in the accessible name; it is shown when it asks for attention
				state ? el('span', { class: attention ? 'bui-choice-state' : 'bui-hidden', text: state }) : null,
				glyph('chevron')
			].filter(Boolean)
		);
	}

	/** The statement of a menu's one option: its label, the option and its state, with the value. */
	static stated(label, option, name) {
		const [state, tone] = option.status ?? [null, null];
		const extra = state ? [el('span', { class: `bui-status bui-status-${tone ?? 'neutral'}` }, [el('span', { class: 'bui-status-dot', 'aria-hidden': 'true' }), state])] : [];
		const text = [el('span', { class: 'bui-choice-label', text: label }), ' ', el('span', { class: 'bui-choice-value' }, [content(option.label)])];
		return statement({ text, value: option.value, name, extra });
	}
}
