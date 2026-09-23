import { Disclosure } from './disclosure.js';
import { el, content } from './core/element.js';
import { icon } from './core/icons.js';
import { Labels } from './core/labels.js';

const defaults = { name: 'Help: {topic}', close: 'Close help' };

/**
 * Essential help behind a small toggle button next to what it explains.
 *
 * Help that a person needs to complete a task must be reachable without hovering: the button opens
 * the explanation with a click, a tap, Enter or Space, Escape closes it and returns focus, and it
 * stays open while being read. The panel flows in the layout, so it never covers the field it
 * explains and fits a 320px screen. `panel` can be placed elsewhere by the consumer.
 */
export class Help extends Disclosure {
	/**
	 * @param {object} options
	 * @param {string} options.topic what the help is about; names the button ("Help: Identifier")
	 * @param {string|Node|Array<string|Node>} options.text the explanation
	 */
	constructor({ topic, text, labels = {}, onchange = null }) {
		const words = new Labels(defaults, labels);
		const body = [].concat(text).map(part => (typeof part === 'string' ? el('p', { text: part }) : content(part)));
		super({ label: icon('help'), name: words.text('name', { topic }), children: body, variant: 'help', class: 'bui-help', onchange });
		this.panel.classList.add('bui-help-panel');
		this.panel.setAttribute('role', 'note');
		this.panel.setAttribute('aria-label', words.text('name', { topic }));
	}
}
