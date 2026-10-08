import { Focus } from './focus.js';

/**
 * The children of one container in a given order, changed in place so a live update never moves
 * focus: a child already in its place stays, the child that holds focus is never moved (moving a node
 * blurs it in browsers) and the others are placed around it, and the children no longer listed are
 * removed.
 *
 * When the child holding focus is one of those removed, focus goes to the child now at its place (or
 * the last one), to the first control inside it, so the keyboard never falls back to the page's body.
 */
export class KeyedList {
	#container;

	/** @param {Element} container the element whose children are ordered */
	constructor(container) {
		this.#container = container;
	}

	get element() {
		return this.#container;
	}

	/**
	 * Makes `nodes` the container's children, in that order. Returns the children it removed.
	 *
	 * @param {Element[]} nodes
	 */
	order(nodes) {
		const container = this.#container;
		const active = container.ownerDocument.activeElement;
		const before = [...container.children];
		const leaving = before.filter(node => !nodes.includes(node));
		const lost = leaving.find(node => node.contains(active)) ?? null;
		const held = nodes.find(node => node.parentNode === container && node.contains(active)) ?? null;
		// Every node before the cursor is in its place; the held node is never moved, so the cursor jumps past it.
		let cursor = container.firstElementChild;
		for (const node of nodes) {
			if (node === cursor) cursor = cursor.nextElementSibling;
			else if (node === held) cursor = held.nextElementSibling;
			else container.insertBefore(node, cursor);
		}
		for (const node of leaving) node.remove();
		if (lost && nodes.length) {
			const target = nodes[Math.min(before.indexOf(lost), nodes.length - 1)];
			new Focus(target).targets[0]?.focus({ preventScroll: true });
		}
		return leaving;
	}
}
