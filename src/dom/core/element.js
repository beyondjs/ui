/**
 * The small DOM vocabulary every component is written in.
 *
 * `el` creates an element from a tag, properties and children. Properties accept `class`, `text`,
 * `dataset`, `on<event>` handlers and any other attribute; `null`, `undefined` and `false` skip a
 * property, and `true` writes an empty attribute. Children may be nodes, strings, numbers or nested
 * arrays; empty values are skipped so a component can write conditional children inline. These are
 * stateless, pure builders, which is the standalone-function exception the coding standard allows.
 *
 * Handlers given here belong to the created element and are released with it; listeners on
 * `document` or `window` go through `Component.listen` so `destroy()` releases them.
 */
export function el(tag, props = {}, children = []) {
	const node = document.createElement(tag);
	for (const [key, value] of Object.entries(props)) {
		if (value === null || value === undefined || value === false) continue;
		if (key === 'class') node.className = value;
		else if (key === 'text') node.textContent = value;
		else if (key === 'dataset') Object.assign(node.dataset, value);
		else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
		else if (key === 'value') node.value = value;
		else if (key === 'checked') node.checked = Boolean(value);
		else node.setAttribute(key, value === true ? '' : String(value));
	}
	return append(node, children);
}

/** Appends children, flattening arrays and skipping empty values. */
export function append(parent, children) {
	for (const child of [].concat(children)) {
		if (child === null || child === undefined || child === false || child === '') continue;
		if (Array.isArray(child)) append(parent, child);
		else parent.append(child.nodeType ? child : document.createTextNode(String(child)));
	}
	return parent;
}

/** Replaces every child of a node. */
export function fill(parent, children) {
	parent.replaceChildren();
	return append(parent, children);
}

/** Text or a node given by a consumer, as a child: strings stay text, never HTML. */
export function content(value) {
	if (value === null || value === undefined) return null;
	return value.nodeType ? value : String(value);
}
