/** Types of `Floating` (0.15.0): the one positioning primitive of the package's floating surfaces. */

/** An anchor: an element, or a virtual rectangle such as a field's caret, judged by its context element. */
export type FloatingAnchor = Element | { getBoundingClientRect(): DOMRect | { left: number; top: number; right: number; bottom: number; width: number; height: number }; contextElement?: Element | null };

export interface FloatingOptions {
	anchor: FloatingAnchor;
	/** The preferred side; it flips when that side has no room and the other has more. `auto` is below. */
	placement?: 'auto' | 'below' | 'above';
	align?: 'start' | 'end' | 'center';
	/** Distance from the anchor, 4 px by default. */
	gap?: number;
	/** The class the surface carries while above its anchor. */
	above?: string | null;
	/** A refusal dispatches nothing and warns nobody. */
	quiet?: boolean;
}

/** The detail of the `bui-refused` event an anchor dispatches when a surface could not open. */
export interface FloatingRefusal {
	reason: 'hidden';
	/** Opens it again, once the anchor is shown; whether it opened. */
	retry(): boolean;
}

/**
 * Places a floating surface against its anchor: the top layer where the browser has the popover API,
 * flip, shift and size inside the visual viewport less the family bar and `[data-bui-edge]` edges, and
 * placed again on scroll, resize and size changes while open. Products may use it for their own popovers.
 */
export class Floating {
	/** Distance kept from the room's edges (8). */
	static margin: number;
	/** Distance between the anchor and the surface (4). */
	static gap: number;
	/** Whether the browser puts surfaces in the top layer. */
	static readonly top: boolean;
	constructor(element: HTMLElement, options: FloatingOptions);
	readonly element: HTMLElement;
	anchor: FloatingAnchor;
	/** Whether it is shown. */
	readonly open: boolean;
	/** The side it is drawn on. */
	readonly side: 'below' | 'above';
	/** What a refusal's `retry()` runs: the owner's own open. */
	set retry(work: (() => boolean) | null);
	/** Shows it; false when the anchor is not drawn (`bui-refused` dispatched from the anchor). */
	show(): boolean;
	hide(): void;
	place(): void;
	destroy(): void;
}

/**
 * Tells a page's parts that its columns changed width without the window's (0.32.0): a `bui-layout` event
 * bubbling from the part that changed, so a composer's toolbar decides in the frame the change lands.
 */
export class Relayout {
	static readonly event: 'bui-layout';
	static tell(node: EventTarget | null | undefined): void;
	/** Shows or hides `element`, and tells from `node` when that changed. */
	static hide(element: HTMLElement, hidden: boolean, node?: EventTarget): void;
	/** Sets or removes an attribute, and tells from the element when that changed. */
	static mark(element: Element, name: string, on: boolean): void;
}
