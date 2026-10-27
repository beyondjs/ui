/**
 * @typedef {object} FocusPaint What a focused element draws, as its computed style says it
 * @property {string} outline its `outline-style`
 * @property {number} width its outline's width in pixels
 * @property {string} color its outline's colour
 * @property {string[]} borders the colours of the borders it draws (a side with a width and a style)
 * @property {string} shadow its `box-shadow`
 * @property {string} focus the value of `--color-focus` where it is
 * @property {string} danger the value of `--color-danger` where it is
 */

/**
 * Reads what an element draws around itself (its outline, borders and shadows) and tells the colours apart,
 * for the development checks of focus (`Focus`, D187). It never changes the page.
 */
export class Paint {
	static #sides = ['top', 'right', 'bottom', 'left'];
	static #colors = /(rgba?\([^)]*\)|color\([^)]*\)|#[0-9a-f]{3,8}\b|transparent)/i;

	/** An element's paint from its computed style. */
	static read(node) {
		const style = node.ownerDocument.defaultView.getComputedStyle(node);
		const value = name => style.getPropertyValue(name).trim();
		const drawn = side => parseFloat(value(`border-${side}-width`)) > 0 && !['none', 'hidden'].includes(value(`border-${side}-style`));
		return {
			outline: value('outline-style') || 'none',
			width: parseFloat(value('outline-width')) || 0,
			color: value('outline-color'),
			borders: Paint.#sides.filter(drawn).map(side => value(`border-${side}-color`)),
			shadow: value('box-shadow') || 'none',
			focus: value('--color-focus'),
			danger: value('--color-danger')
		};
	}

	/** Whether it draws an outline that shows: a style, a width and a colour that is not transparent. */
	static outlined(paint) {
		if (['none', 'hidden', ''].includes(paint.outline) || !(paint.width > 0)) return false;
		const color = Paint.color(paint.color ?? '');
		return !color || color[3] > 0;
	}

	/** Whether a layer of its shadow is a ring: no offset, no blur, a spread and a colour that shows. */
	static ringed(paint) {
		return Paint.layers(paint.shadow).some(({ color, lengths: [x = 0, y = 0, blur = 0, spread = 0] }) => x === 0 && y === 0 && blur === 0 && spread > 0 && (!color || color[3] > 0));
	}

	/** Whether a border or a shadow it draws is in `role`'s colour (at any opacity but none). */
	static tinted(paint, role) {
		const wanted = Paint.color(role ?? '');
		if (!wanted) return false;
		const same = color => Boolean(color) && color[3] > 0 && [0, 1, 2].every(channel => Math.abs(color[channel] - wanted[channel]) <= 2);
		return paint.borders.some(border => same(Paint.color(border))) || Paint.layers(paint.shadow).some(layer => same(layer.color));
	}

	/** A shadow's layers: `[{ color: [r, g, b, a] | null, lengths: number[], inset: boolean }]`. */
	static layers(shadow) {
		if (!shadow || shadow === 'none') return [];
		const layers = [];
		let depth = 0;
		let start = 0;
		for (let index = 0; index <= shadow.length; index += 1) {
			const character = shadow[index];
			if (character === '(') depth += 1;
			else if (character === ')') depth -= 1;
			else if ((character === ',' && depth === 0) || index === shadow.length) {
				layers.push(shadow.slice(start, index).trim());
				start = index + 1;
			}
		}
		return layers.filter(Boolean).map(layer => {
			const found = layer.match(Paint.#colors)?.[0] ?? null;
			const rest = found ? layer.replace(found, ' ') : layer;
			return { color: found ? Paint.color(found) : null, lengths: [...rest.matchAll(/-?\d*\.?\d+(?:px)?(?![\w%])/g)].map(match => parseFloat(match[0])), inset: /\binset\b/.test(rest) };
		});
	}

	/** A colour as `[r, g, b, a]` (channels 0–255, alpha 0–1) from hex, `rgb()`, `rgba()`, `color(srgb …)` or `transparent`; null otherwise. */
	static color(text) {
		const value = text.trim().toLowerCase();
		if (value === 'transparent') return [0, 0, 0, 0];
		const hex = value.match(/^#([0-9a-f]{3,8})$/)?.[1];
		if (hex && [3, 4, 6, 8].includes(hex.length)) {
			const digits = hex.length <= 4 ? [...hex].map(digit => digit + digit) : hex.match(/../g);
			const [r, g, b, a = 'ff'] = digits;
			return [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16), parseInt(a, 16) / 255];
		}
		const call = value.match(/^(rgba?|color)\((.*)\)$/);
		if (!call) return null;
		let body = call[2].trim();
		if (call[1] === 'color') {
			if (!/^srgb\s/.test(body)) return null;
			body = body.slice(4);
		}
		const parts = body.split(/[\s,/]+/).filter(Boolean);
		const numbers = parts.map(part => (part.endsWith('%') ? parseFloat(part) / 100 : parseFloat(part)));
		if (numbers.length < 3 || numbers.some(Number.isNaN)) return null;
		const scale = call[1] === 'color' ? 255 : 1;
		const [r, g, b] = numbers.slice(0, 3).map(channel => channel * scale);
		return [r, g, b, numbers[3] ?? 1];
	}
}
