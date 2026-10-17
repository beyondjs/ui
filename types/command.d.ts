/** Types of 0.16.0's `CommandPalette`, `ChoiceCards` and `Primaries`, re-exported by `@beyond-js/ui/dom`. */
import type { Copy } from './notifications.js';
import type { Component } from './dom.js';

/** One result of a palette: `run(item)` is the product's action, else `href` is followed. */
export interface PaletteItem {
	id: string;
	label: string;
	detail?: string | null;
	glyph?: string | null;
	/** A shortcut shown at its end ("G then M"), hidden on touch. */
	keys?: string | null;
	href?: string | null;
	run?: ((item: PaletteItem) => void) | null;
}
/** What a product (or a product it hosts) contributes to the palette. */
export interface PaletteSource {
	key: string;
	label: string;
	search: (query: string, context: { signal: AbortSignal }) => PaletteItem[] | Promise<PaletteItem[]>;
	/** Asked before anything is typed too. */
	empty?: boolean;
}
export interface CommandPaletteOptions {
	sources?: PaletteSource[];
	/** Items opened last, kept on this device only (items with an address). */
	recent?: { key: string; limit?: number; storage?: Storage | null } | false;
	/** ⌘K / Ctrl+K opens and closes it. */
	shortcut?: boolean;
	onnavigate?: ((item: PaletteItem, event: Event) => void) | null;
	delay?: number;
	bound?: number;
	labels?: Copy;
}
/** ⌘K as the product's main navigator: grouped results from its sources, recent items, keyboard first (DQ-21). */
export class CommandPalette extends Component {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: CommandPaletteOptions);
	readonly opened: boolean;
	/** The shortcut as shown and as `aria-keyshortcuts`. */
	readonly keys: { text: string; keys: string };
	set sources(sources: PaletteSource[]);
	open(query?: string): void;
	close(): void;
	toggle(): void;
}

export interface ChoiceCard {
	value: string;
	title: string | Node;
	detail?: string | Node | null;
	facts?: Array<string | Node | null | false>;
	status?: [string, 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'progress'] | null;
	disabled?: boolean;
	reason?: string | Node | null;
}
/** Options compared as cards, native radios applied at once (DQ-15). */
export class ChoiceCards extends Component {
	constructor(options: { label: string | Node; options: Array<ChoiceCard | null | false>; value?: string | null; name?: string | null; onchange?: ((value: string) => void) | null; description?: string | Node | null });
	value: string | null;
	set options(options: Array<ChoiceCard | null | false>);
	set disabled(disabled: boolean);
}

/** One primary action per region, warned while a product is developed (DQ-09). */
export class Primaries {
	static regions: string;
	static enabled: boolean;
	constructor(options: { root: Element; warn?: ((message: string, region: Element) => void) | null });
	check(): Array<{ region: Element; count: number }>;
	destroy(): void;
}

/** A precondition of sending (0.16.0, DQ-03): `run` performs it; anything but `false` sends the message after it. */
export interface ComposerStepOption {
	label: string;
	run: (input: { text: string }) => unknown;
}
