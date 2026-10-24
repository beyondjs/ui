/** Types of `Button` (re-exported by `@beyond-js/ui` and `/dom`); since 0.26.0 (D165) a button may be bare: its glyph alone, its words its name and tooltip. */
import type { Component, Content } from './dom.js';
import type { Copy } from './notifications.js';

export interface ButtonOptions {
	label: Content;
	variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
	glyph?: string | null;
	href?: string | null;
	onclick?: ((event: MouseEvent) => void) | null;
	disabled?: boolean;
	busy?: boolean;
	type?: 'button' | 'submit' | 'reset';
	small?: boolean;
	name?: string | null;
	describedby?: string | null;
	labels?: Copy;
	/** The glyph alone, the label its name and tooltip (0.26.0, D165); a glyph of the closed list only. */
	bare?: boolean;
	/** A step not yet taken (0.32.0, D183): quiet and still reachable, a press only going to `place()`. */
	waiting?: boolean;
	place?: (() => HTMLElement | null | undefined) | null;
}
export class Button extends Component {
	constructor(options: ButtonOptions);
	busy: boolean;
	/** Since 0.32.0 (D183): quiet and still reachable, a press only going to `place()`. */
	waiting: boolean;
	disabled: boolean;
	set label(value: Content);
	/** Since 0.26.0: the glyph alone (`bare`, its words its name and tooltip), another glyph, a name apart from the words. */
	bare: boolean;
	set glyph(name: string | null);
	set name(value: string | null);
	run<T>(work: () => Promise<T>): Promise<T | undefined>;
}
