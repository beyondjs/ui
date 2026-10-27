import { Generated } from './generated.mjs';

/**
 * A box's four insets measured optically (D184), as the composer's check measures its own: from each inner
 * border edge to what the box draws inside it.
 *
 * - **Text** by its lines: capitals from the font's own cap height (a canvas `measureText('H')` in the
 *   line's computed font, or the page's `1cap` where a canvas draws a generic family in another face)
 *   above a baseline placed by a zero-height inline-block probe in that font. A
 *   text ends where its column ends (the content edge of the block it wraps in, or of a flat row), not
 *   where a short line stops or a hanging space reaches; a scroller between it and the box clips it. A
 *   box wider than what it holds (a short notice at its maximum width) says its right is `free` room.
 * - **A drawn shape** by its box: a control or mark with a border all round or a fill unlike what is
 *   behind it, an input or select that draws its box, an image or a progress bar.
 * - **A glyph** (an icon's SVG) by its box, for the inline measures only when it sits on a line of text:
 *   it is centred on that line, which decides the row.
 * - **A borderless field** (an input, select or textarea that draws no box of its own) by its text:
 *   single-line ones centred in the content box, a textarea's first line at its top, as engines draw them.
 *
 * A control with neither border nor fill (a quiet button, a borderless close button) draws only its words
 * or its glyph, so those are what count. A divider (a shape 2 px thin or less) is not content.
 * top: the highest capitals or edge; bottom: the lowest baseline or edge; left and right: where the
 * content starts and ends. A spec names the box (a selector or the box itself, `nth` of its matches),
 * `extra` shapes drawn inside it from outside its element (a select's chevron), `flat` rows whose surface
 * shows only under the pointer or focus (a menu's entries, measured at rest by their words) and `field`
 * for a box that is itself a single-line control. Values are CSS pixels, rounded to tenths.
 *
 * Since 0.41.0, from CDN's copy of the round `landed`: the walk goes into an element drawn as its children
 * alone (`display: contents`, a definition list's groups), which `checkVisibility()` calls not shown since
 * it has no box of its own, and whose empty box never says a line stops short; and `scrolls` counts what a
 * box or a holder inside it hides (`overflow: hidden` or `clip`) as well as what it scrolls, so a trim that
 * hides a box's last line never passes for none. What is hidden on purpose is left out: a caption a clip
 * hides from sight (one only a screen reader reads) and a text a line clamp ends with its ellipsis (a
 * turn's preview), and a line it hides is not drawn: a clamp's or a clip's hidden lines decide no side. A
 * background whose every layer is a line 2 px thin or less that does not repeat across it (a table's row
 * dividers) is a divider, never a fill.
 *
 * Since 0.44.0, from CDN's `generated.mjs` of the round `tended`: words a stylesheet generates (`::before` and
 * `::after` whose content is a string or `attr()`, such as a stacked `DataTable`'s `td[data-label]::before`
 * labels) are read as text. A pseudo-element has no box a script reads, so for the measure only each one in the
 * box is drawn as a `span` with its own computed style and words in its own place (first or last child) while the
 * pseudo-element is turned off, then the page is put back before the measure returns. A mark it draws in flow by its
 * fill or its border with no words (`content: ''`, a dot before a hint's words) is drawn so too, an empty span the
 * measure reads as a shape; one positioned out of flow, hidden, or drawing nothing is left as it is. `generated:
 * false` in a spec measures without them; `generated.mjs` draws them. Products copy this file and `generated.mjs`;
 * `checks/measuring.mjs` holds them.
 */
export class Insets {
	/** Installs `window.fixtureInsets(spec)`, and what draws generated content for it (`generated.mjs`), in every page of a context before it loads. */
	static async install(context) {
		await context.addInitScript(Generated.script);
		await context.addInitScript(() => {
			const round = value => Math.round(value * 10) / 10;
			const alpha = color => {
				const match = /rgba?\(([^)]+)\)/.exec(color);
				if (!match) return color === 'transparent' ? 0 : 1;
				const parts = match[1].split(/[\s,/]+/).filter(Boolean);
				return parts.length > 3 ? parseFloat(parts[3]) : 1;
			};
			const fonts = new Map();
			/** The engine's ascent and descent for a font, and its capitals' height from the font's own drawing. */
			const font = style => {
				const key = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
				if (fonts.has(key)) return fonts.get(key);
				const holder = document.createElement('div');
				holder.style.cssText = `position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;margin:0;padding:0;border:0;line-height:normal;font:${key}`;
				const text = document.createTextNode('H');
				const probe = document.createElement('span');
				probe.style.cssText = 'display:inline-block;width:0;height:0;margin:0;padding:0;border:0;vertical-align:baseline';
				const height = document.createElement('span');
				height.style.cssText = 'display:inline-block;width:0;height:1cap;margin:0;padding:0;border:0';
				holder.append(text, probe, height);
				document.body.append(holder);
				const range = document.createRange();
				range.selectNodeContents(text);
				const box = range.getBoundingClientRect();
				const baseline = probe.getBoundingClientRect().top;
				const drawn = height.getBoundingClientRect().height;
				holder.remove();
				const canvas = document.createElement('canvas').getContext('2d');
				canvas.font = key;
				// A canvas draws a generic family in its own face where the page may not (WebKit's monospace is
				// Courier there and Menlo in the page): past a pixel apart, the page's own cap height is the drawn one
				const ink = canvas.measureText('H').actualBoundingBoxAscent;
				const metrics = { ascent: baseline - box.top, descent: box.bottom - baseline, cap: Math.abs(ink - drawn) > 1 ? drawn : ink };
				fonts.set(key, metrics);
				return metrics;
			};
			const shown = node => node.checkVisibility?.({ visibilityProperty: true, opacityProperty: true }) ?? node.getClientRects().length > 0;
			const clipped = style => style.position === 'absolute' && (style.clip !== 'auto' || style.clipPath !== 'none');
			/** A text a line clamp ends on purpose, saying it is cut with its ellipsis. */
			const clamped = style => Boolean(style.webkitLineClamp) && style.webkitLineClamp !== 'none';
			/** The colour behind a node: its nearest ancestor's fill. */
			const behind = node => {
				for (let item = node.parentElement; item; item = item.parentElement) {
					const color = getComputedStyle(item).backgroundColor;
					if (alpha(color) > 0) return color;
				}
				return 'rgb(255, 255, 255)';
			};
			const fields = new Set(['input', 'select', 'textarea']);
			/** A field that shows text: a select, a textarea or an input that is not a mark of its own (a radio, a checkbox). */
			const typed = node => node.localName !== 'input' || !['checkbox', 'radio', 'range', 'color', 'file', 'image', 'hidden'].includes(node.type);
			const pictures = new Set(['img', 'video', 'canvas', 'progress', 'meter']);
			/** A computed list of layers, split at the commas outside parentheses. */
			const layers = value => value.split(/,(?![^(]*\))/).map(layer => layer.trim().split(/\s+(?![^(]*\))/));
			/** Whether a layer repeats along an axis (0 across, 1 down), from its computed `background-repeat`. */
			const repeats = (repeat, axis) => {
				if (repeat.length === 2) return repeat[axis] !== 'no-repeat';
				if (repeat[0] === 'repeat-x') return axis === 0;
				if (repeat[0] === 'repeat-y') return axis === 1;
				return repeat[0] !== 'no-repeat';
			};
			/**
			 * Whether every layer of a background is a line 2 px thin or less that does not repeat across its thin side:
			 * a divider drawn as a background (a table's rows), never a fill. A thin layer that repeats tiles into a fill.
			 */
			const lined = style => {
				const sizes = layers(style.backgroundSize);
				const repeat = layers(style.backgroundRepeat);
				return sizes.every((size, index) => size.some((length, axis) => /^\d+(\.\d+)?px$/.test(length) && parseFloat(length) <= 2 && !repeats(repeat[index % repeat.length], axis)));
			};
			/** Whether a node draws its own box: a fill unlike what is behind it, or a border on every side. */
			const boxed = node => {
				const style = getComputedStyle(node);
				if (style.backgroundImage !== 'none' && !fields.has(node.localName) && !lined(style)) return true;
				if (alpha(style.backgroundColor) > 0 && style.backgroundColor !== behind(node)) return true;
				return ['Top', 'Right', 'Bottom', 'Left'].every(side => parseFloat(style[`border${side}Width`]) > 0 && !['none', 'hidden'].includes(style[`border${side}Style`]) && alpha(style[`border${side}Color`]) > 0);
			};
			const rect = (node, kind) => {
				const { top, bottom, left, right } = node.getBoundingClientRect();
				return { kind, top, bottom, left, right, what: `${node.localName}.${String(node.className?.baseVal ?? node.className).split(' ')[0]}` };
			};
			const content = node => {
				const style = getComputedStyle(node);
				const { top, bottom, left, right } = node.getBoundingClientRect();
				return { top: top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop), bottom: bottom - parseFloat(style.borderBottomWidth) - parseFloat(style.paddingBottom), left: left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft), right: right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight) };
			};
			/** Whether something stands after a node on its row, which ends the node's column there. */
			const followed = node => {
				const mine = node.getBoundingClientRect();
				return [...node.parentElement.children].some(child => child !== node && shown(child) && child.getBoundingClientRect().left >= mine.right - 0.5 && child.getBoundingClientRect().top < mine.bottom && child.getBoundingClientRect().bottom > mine.top);
			};
			/**
			 * Where a text's column ends: the content edge of the block it wraps in, or of the flat row that holds it;
			 * `free` when a block on the way to the box stops short of its parent's end with nothing after it (a short
			 * line in a box wider than what it holds), so the room after it is free, not an inset.
			 */
			const end = (text, box, flat) => {
				let item = text.parentElement;
				while (item !== box && ['inline', 'contents'].includes(getComputedStyle(item).display)) item = item.parentElement;
				const row = flat.length ? text.parentElement.closest(flat.join(', ')) : null;
				if (row && box.contains(row)) return { right: Math.max(content(item).right, content(row).right), free: false };
				let free = false;
				for (let node = item; node !== box && !free; node = node.parentElement) {
					// A group drawn as its children alone has no box to stop short of (0.41.0)
					if (getComputedStyle(node).display === 'contents') continue;
					if (followed(node)) break;
					free = node.getBoundingClientRect().right + (parseFloat(getComputedStyle(node).marginRight) || 0) < content(node.parentElement).right - 0.5;
				}
				return { right: content(item).right, free };
			};
			/** A scroller between a text and its box clips what the text draws past it. */
			const scroller = (text, box) => {
				for (let item = text.parentElement; item && item !== box; item = item.parentElement) if (getComputedStyle(item).overflowX !== 'visible') return content(item);
				return null;
			};
			/** What clips a text's lines above and below: the padding box of its nearest holder, the box included, that hides or scrolls its overflow. */
			const ceiling = (text, box) => {
				for (let item = text.parentElement; item; item = item.parentElement) {
					const style = getComputedStyle(item);
					if (style.overflowY !== 'visible') {
						const { top, bottom } = item.getBoundingClientRect();
						return { top: top + parseFloat(style.borderTopWidth), bottom: bottom - parseFloat(style.borderBottomWidth) };
					}
					if (item === box) break;
				}
				return null;
			};
			/** The lines of a text node that show, each with its capitals, baseline and content area: a line a clamp or a clip hides is not drawn. */
			const lines = (text, parent, box, flat) => {
				const metrics = font(getComputedStyle(parent));
				const range = document.createRange();
				range.selectNodeContents(text);
				const edge = end(text, box, flat);
				const clip = scroller(text, box);
				const held = ceiling(text, box);
				const shows = area => !held || (area.top < held.bottom - 0.5 && area.bottom > held.top + 0.5);
				return [...range.getClientRects()].filter(area => area.width > 0.5 && shows(area)).map(area => {
					const baseline = area.top + metrics.ascent;
					return { kind: 'text', top: area.top, bottom: area.bottom, caps: baseline - metrics.cap, baseline, left: Math.max(area.left, clip?.left ?? -Infinity), right: clip ? Math.min(edge.right, clip.right) : edge.right, free: edge.free, what: text.textContent.trim().slice(0, 24) };
				});
			};
			/** A field's own text: one line centred in its content box, or a textarea's first and last lines at its edges. */
			const field = node => {
				const style = getComputedStyle(node);
				const metrics = font(style);
				const area = metrics.ascent + metrics.descent;
				const line = style.lineHeight === 'normal' ? area : parseFloat(style.lineHeight);
				const inner = content(node);
				const what = (node.value || node.placeholder || '').slice(0, 24);
				const at = top => ({ caps: top + (line - area) / 2 + metrics.ascent - metrics.cap, baseline: top + (line - area) / 2 + metrics.ascent });
				if (node.localName === 'textarea') {
					const rows = Math.max(1, Math.round((node.scrollHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)) / line));
					const first = at(inner.top);
					const last = at(inner.top + (rows - 1) * line);
					return { kind: 'text', top: inner.top, bottom: inner.top + rows * line, caps: first.caps, baseline: last.baseline, left: inner.left, right: inner.right, what };
				}
				const { caps, baseline } = at(inner.top + (inner.bottom - inner.top - line) / 2);
				return { kind: 'text', top: baseline - metrics.ascent, bottom: baseline + metrics.descent, caps, baseline, left: inner.left, right: inner.right, what };
			};
			/** Everything the box draws inside it: its texts' lines, its shapes and glyphs, never inside a shape. */
			const leaves = (box, flat) => {
				const found = [];
				const walk = node => {
					for (const child of node.childNodes) {
						if (child.nodeType === 3) {
							if (child.textContent.trim()) found.push(...lines(child, node, box, flat));
							continue;
						}
						// An element drawn as its children alone has no box of its own to show: its children are what it draws
						if (child.nodeType === 1 && getComputedStyle(child).display === 'contents') {
							walk(child);
							continue;
						}
						if (child.nodeType !== 1 || !shown(child) || clipped(getComputedStyle(child))) continue;
						const area = child.getBoundingClientRect();
						if (area.width <= 1.5 && area.height <= 1.5) continue;
						const drawn = !flat.some(selector => child.matches(selector)) && boxed(child);
						if (fields.has(child.localName) && typed(child) && !drawn) found.push(field(child));
						else if (drawn || fields.has(child.localName) || pictures.has(child.localName)) {
							if (Math.min(area.width, area.height) > 2) found.push(rect(child, 'shape'));
						} else if (child.localName === 'svg') found.push(rect(child, 'glyph'));
						else walk(child);
					}
				};
				walk(box);
				return found;
			};
			const beside = (glyph, texts) => texts.some(text => glyph.bottom > text.top && glyph.top < text.bottom);
			window.fixtureInsets = spec => {
				const node = typeof spec.box === 'string' ? document.querySelectorAll(spec.box)[spec.nth ?? 0] : spec.box;
				if (!node) return { missing: spec.box };
				const restore = spec.generated === false || spec.field || !window.fixtureGenerated ? () => undefined : window.fixtureGenerated(node);
				try {
					return inside(node, spec);
				} finally {
					restore();
				}
			};
			const inside = (node, { extra = [], flat = [], field: control = false }) => {
				const style = getComputedStyle(node);
				const outer = node.getBoundingClientRect();
				const inner = { top: outer.top + parseFloat(style.borderTopWidth), bottom: outer.bottom - parseFloat(style.borderBottomWidth), left: outer.left + parseFloat(style.borderLeftWidth), right: outer.right - parseFloat(style.borderRightWidth) };
				const found = control ? [field(node)] : leaves(node, flat);
				for (const selector of extra) for (const item of node.parentElement.querySelectorAll(selector)) if (shown(item)) found.push(rect(item, item.localName === 'svg' ? 'glyph' : 'shape'));
				if (!found.length) return { empty: true };
				const texts = found.filter(item => item.kind === 'text');
				const rows = found.filter(item => item.kind !== 'glyph' || !beside(item, texts));
				const high = rows.reduce((a, b) => ((a.caps ?? a.top) <= (b.caps ?? b.top) ? a : b));
				const low = rows.reduce((a, b) => ((a.baseline ?? a.bottom) >= (b.baseline ?? b.bottom) ? a : b));
				const start = found.reduce((a, b) => (a.left <= b.left ? a : b));
				const finish = found.reduce((a, b) => (a.right >= b.right ? a : b));
				const said = (item, side) => (item.kind === 'text' ? `${side} of "${item.what}"` : item.what);
				// A trim inside a scroller turns what it took off into overflow: the box, or a holder inside it, would scroll,
				// or hide it where it hides its overflow; what is hidden on purpose (a caption for a screen reader, a clamped text) is not
				const scrollers = [node, ...node.querySelectorAll('*')].filter(item => {
					const style = getComputedStyle(item);
					return /auto|scroll|hidden|clip/.test(style.overflowY) && !clipped(style) && !clamped(style);
				});
				const scrolls = scrollers.reduce((most, item) => Math.max(most, item.scrollHeight - item.clientHeight), 0);
				return {
					scrolls,
					top: round((high.caps ?? high.top) - inner.top),
					bottom: round(inner.bottom - (low.baseline ?? low.bottom)),
					left: round(start.left - inner.left),
					right: round(inner.right - finish.right),
					free: Boolean(finish.free),
					by: { top: said(high, 'caps'), bottom: said(low, 'baseline'), left: said(start, 'start'), right: said(finish, 'end') }
				};
			};
		});
	}

	/** The four insets of the box a spec names. */
	static measure(page, spec) {
		return page.evaluate(spec => window.fixtureInsets(spec), spec);
	}
}
