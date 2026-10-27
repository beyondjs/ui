/**
 * What a stylesheet generates, drawn for the inset measurer (0.44.0, from CDN's `generated.mjs` of the round
 * `tended`): words of `::before` and `::after` whose content is a string or `attr()` (a stacked `DataTable`'s
 * `td[data-label]::before` labels), and a mark drawn in flow by a fill or a border with no words (`content: ''`, a
 * dot before a hint's words). A pseudo-element has no box a script reads, so `window.fixtureGenerated(box)` draws
 * each one inside the box as a `span` with the pseudo-element's own computed style, in its own place (first or last
 * child), turns the pseudo-element off meanwhile, and answers the function that puts the page back. One positioned
 * out of flow, hidden, or drawing nothing is left as it is. `support/insets.mjs` installs it and calls it around
 * each measure; products copy both files.
 */
export class Generated {
	/** The init script that installs `window.fixtureGenerated(box)`: an arrow function, which Playwright sends as its source. */
	static script = () => {
		const alpha = color => {
			const match = /rgba?\(([^)]+)\)/.exec(color);
			if (!match) return color === 'transparent' ? 0 : 1;
			const parts = match[1].split(/[\s,/]+/).filter(Boolean);
			return parts.length > 3 ? parseFloat(parts[3]) : 1;
		};
		/** A generated content's words: its strings and its `attr()` values, in order; an image, a counter or a quote is no words. */
		const quoted = (value, node) => {
			if (['none', 'normal', ''].includes(value) || /url\(|counter|quote/.test(value)) return '';
			let words = '';
			for (const [, double, single, name] of value.matchAll(/"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|attr\(\s*([\w-]+)\s*\)/g)) words += name ? (node.getAttribute(name) ?? '') : (double ?? single).replace(/\\(.)/g, '$1');
			return words;
		};
		window.fixtureGenerated = box => {
			const found = [];
			for (const node of [box, ...box.querySelectorAll('*')])
				for (const side of ['before', 'after']) {
					const style = getComputedStyle(node, `::${side}`);
					const words = quoted(style.content, node);
					// A mark drawn by its fill or its border with no words is drawn as an empty span
					const mark = !words.trim() && /^(""|'')$/.test(style.content) && (alpha(style.backgroundColor) > 0 || style.backgroundImage !== 'none' || parseFloat(style.borderTopWidth) > 0);
					if ((words.trim() || mark) && style.display !== 'none' && !['absolute', 'fixed'].includes(style.position)) found.push({ node, side, words, style: [...style].filter(name => name !== 'content').map(name => [name, style.getPropertyValue(name)]) });
				}
			if (!found.length) return () => undefined;
			const off = document.createElement('style');
			off.textContent = '[data-inset-before]::before, [data-inset-after]::after { content: none !important; }';
			document.head.append(off);
			const made = found.map(({ node, side, words, style }) => {
				const span = document.createElement('span');
				for (const [name, value] of style) span.style.setProperty(name, value);
				span.textContent = words;
				span.setAttribute('aria-hidden', 'true');
				node.setAttribute(`data-inset-${side}`, '');
				side === 'before' ? node.prepend(span) : node.append(span);
				return { node, side, span };
			});
			return () => {
				for (const { node, side, span } of made) span.remove(), node.removeAttribute(`data-inset-${side}`);
				off.remove();
			};
		};
	};
}
