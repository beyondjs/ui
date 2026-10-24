/**
 * Tells a page's parts that its columns changed width without the window's (0.32.0): a panel shown or
 * hidden beside the content, its wide form, the Sidebar's panel. The event (`bui-layout`) bubbles from the
 * part that changed, in the task that changed it, so a part that measures itself (a composer's toolbar)
 * decides in the frame the change lands rather than one frame after, as it does for the window's resize.
 */
export class Relayout {
	static event = 'bui-layout';

	/** @param {EventTarget|null|undefined} node the part whose change moved the columns */
	static tell(node) {
		const view = node?.ownerDocument?.defaultView;
		if (!view?.CustomEvent) return;
		node.dispatchEvent(new view.CustomEvent(Relayout.event, { bubbles: true }));
	}

	/** Shows or hides `element`, and tells from `node` when that changed. */
	static hide(element, hidden, node = element) {
		if (element.hidden === Boolean(hidden)) return;
		element.hidden = Boolean(hidden);
		Relayout.tell(node);
	}

	/** Sets or removes the attribute `name` of `element`, and tells from it when that changed. */
	static mark(element, name, on) {
		if (element.hasAttribute(name) === Boolean(on)) return;
		element.toggleAttribute(name, Boolean(on));
		Relayout.tell(element);
	}
}
