/** Types of the helpers a product reuses beside the components (0.11.1): `Hint` and `Age`, part of `@beyond-js/ui/dom`. */
import type { Copy } from './notifications.js';
import type { Component } from './dom.js';

/**
 * The family tooltip for glyph-only controls (D11), public since 0.11.1: one hint serves every control
 * inside `root` with `data-bui-hint` and an `aria-label` (plus ` · {data-bui-shortcut}`); it shows on
 * hover after a short delay, at once on keyboard focus and on a touch press, and hides on a click,
 * leaving, blur and Escape. It repeats the accessible name, so it is hidden from assistive technology.
 * One hint per root; `destroy()` releases its listeners.
 */
export class Hint extends Component {
	constructor(root: Element);
	readonly shown: boolean;
	/** Shows the name of `target`, a control inside the root. */
	show(target: Element): void;
	hide(): void;
	/** Hides it when its control is inside `node`, about to be removed. */
	release(node: Node): void;
}
/** One age as the family says it (0.11.1): short words, the full moment and the ISO string. */
export interface AgeWords {
	/** "now", "5 min", "2 h", "3 d", "2 w", then "6 Oct" (with its year when it is another). */
	label: string;
	/** The full moment in the locale ("Thursday, 8 October 2026 at 10:42"), read with the label and shown on hover. */
	title: string;
	/** For `<time datetime>`. */
	datetime: string;
}
/** How long ago something happened, in the `Sidebar`'s wording (0.11.1); it knows no DOM. */
export class Age {
	/** The units (`now`, `minutes`, `hours`, `days`, `weeks`) in English and Spanish. */
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	/** Milliseconds from a Date, a number or an ISO string; null for anything unreadable. */
	static moment(value: Date | number | string | null | undefined): number | null;
	/** `labels` defaults to the locale's language (Spanish for `es`, else English); `now` to the clock's. */
	constructor(options?: { locale?: string; labels?: Copy; now?: () => number });
	/** The age of a moment against `now`, or null when there is none. */
	of(value: Date | number | string | null | undefined): AgeWords | null;
}
