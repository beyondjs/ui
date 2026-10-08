/** Types of the icon catalog (decision D11), re-exported by `@beyond-js/ui`, `/dom` and `/react`. */

/** A name of the catalog; `icons` lists them in catalog order. */
export type IconName =
	| 'chevron'
	| 'right'
	| 'left'
	| 'back'
	| 'external'
	| 'home'
	| 'menu'
	| 'more'
	| 'check'
	| 'close'
	| 'plus'
	| 'minus'
	| 'search'
	| 'refresh'
	| 'play'
	| 'stop'
	| 'send'
	| 'merge'
	| 'pin'
	| 'minimize'
	| 'maximize'
	| 'restore'
	| 'alert'
	| 'exclamation'
	| 'info'
	| 'help'
	| 'bell'
	| 'lock'
	| 'shield'
	| 'key'
	| 'clock'
	| 'eye'
	| 'star'
	| 'user'
	| 'people'
	| 'building'
	| 'globe'
	| 'chat'
	| 'folder'
	| 'file'
	| 'attach'
	| 'terminal'
	| 'archive'
	| 'book'
	| 'code'
	| 'branch'
	| 'camera'
	| 'graph'
	| 'box'
	| 'layers'
	| 'grid'
	| 'window'
	| 'rocket'
	| 'plug'
	| 'coins'
	| 'flask';

/** The sizes an icon is drawn at, in CSS pixels. */
export type IconSize = 16 | 20 | 24;

/** The glyphs that may appear without a visible label (decision D11). */
export type UnlabeledIconName = 'close' | 'menu' | 'more' | 'search' | 'bell' | 'chevron' | 'pin' | 'minimize' | 'maximize' | 'restore' | 'help' | 'user';

export interface IconOptions {
	/** 16, 20 (default) or 24 px. */
	size?: IconSize;
	/** The accessible name; without it the icon is hidden from assistive technology. */
	label?: string | null;
}

/** Every name of the catalog, in catalog order. */
export const icons: readonly IconName[];

/** The closed list of glyphs that may appear without a visible label, on a control with an accessible name and a tooltip. */
export const unlabeled: readonly UnlabeledIconName[];

/** An icon of the catalog as an inline SVG element. Throws on an unknown name, another size or an empty label. */
export function icon(name: IconName, options?: IconOptions): SVGSVGElement;
