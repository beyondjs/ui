/**
 * The family bar measured on ink, as the review of 2026-10-02 measured it: the vertical centre of each
 * text's capitals (baseline from a zero-sized probe, cap height from the font's metrics at the rendered
 * size), of each glyph's drawing (its SVG bounding box on screen), of the avatar's disc and of the
 * location divider, against the wordmark letters' centre (capitals from y = 3.26 to 11.624 of the
 * image's 16.742 view box height); and the distance from each divider to the first letter's ink of the
 * name after it. CSS pixels.
 */
export class Ink {
	/** Installs `window.fixtureInk()` in every page of a context before it loads. */
	static async install(context) {
		await context.addInitScript(() => {
			const round = value => Math.round(value * 100) / 100;
			const shown = node => node && node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden' && node.checkVisibility?.() !== false;
			const metrics = node => {
				const style = getComputedStyle(node);
				const canvas = document.createElement('canvas').getContext('2d');
				canvas.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
				return canvas;
			};
			/** The centre of a text element's capitals. */
			const caps = node => {
				const probe = document.createElement('span');
				probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
				node.append(probe);
				const base = probe.getBoundingClientRect().top;
				probe.remove();
				return base - metrics(node).measureText('H').actualBoundingBoxAscent / 2;
			};
			/** The left edge of the first letter's ink. */
			const left = node => {
				const text = [...node.childNodes].find(child => child.nodeType === 3 && child.textContent.trim()) ?? node.firstChild;
				const range = document.createRange();
				range.setStart(text, 0);
				range.setEnd(text, 1);
				return range.getBoundingClientRect().left - metrics(node).measureText(text.textContent[0]).actualBoundingBoxLeft;
			};
			const glyph = svg => {
				const box = svg.getBBox();
				const matrix = svg.getScreenCTM();
				return matrix.f + matrix.d * (box.y + box.height / 2);
			};
			window.fixtureInk = () => {
				const bar = document.querySelector('.bui-family');
				const image = bar.querySelector('.bui-header-brand img');
				const box = image.getBoundingClientRect();
				const axis = box.top + (box.height * (3.26 + 11.624)) / 2 / 16.742;
				const wide = [...bar.querySelectorAll('.bui-family-thread .bui-family-wide, .bui-family-thread .bui-family-narrow')].find(shown);
				const place = [...(wide?.querySelectorAll('.bui-family-place') ?? [])].find(shown);
				const divider = [...bar.querySelectorAll('.bui-family-divider')].find(shown);
				const product = bar.querySelector('[data-part="product"]');
				const name = product.querySelector('.bui-lockup-name');
				const parts = [
					['product name', name, caps],
					['product chevron', product.querySelector('.bui-navmenu-button > .bui-icon'), glyph],
					['location name', place, caps],
					['location chevron', [...(wide?.querySelectorAll('.bui-navmenu-button > .bui-icon') ?? [])].find(shown), glyph],
					['location divider', divider, node => node.getBoundingClientRect().top + node.getBoundingClientRect().height / 2],
					['docs label', bar.querySelector('.bui-family-docs span'), caps],
					['docs glyph', bar.querySelector('.bui-family-docs .bui-icon'), glyph],
					['bell', bar.querySelector('.bui-disclosure-bell > .bui-icon'), glyph],
					['avatar', bar.querySelector('.bui-family-avatar'), node => node.getBoundingClientRect().top + node.getBoundingClientRect().height / 2]
				].filter(([, node]) => shown(node));
				const before = getComputedStyle(product, '::before');
				const lockup = product.getBoundingClientRect().left + parseFloat(before.marginLeft) + parseFloat(before.width);
				return {
					axis: round(axis),
					offsets: parts.map(([label, node, measure]) => [label, round(measure(node) - axis)]),
					gaps: {
						product: round(left(name) - lockup),
						location: divider && place ? round(left(place) - divider.getBoundingClientRect().right) : null
					}
				};
			};
		});
	}

	static measure(page) {
		return page.evaluate(() => window.fixtureInk());
	}
}
