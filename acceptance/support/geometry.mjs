/**
 * Measurements of the family bar and the lockup in the page, after the audit method: layout boxes
 * from the browser, the wordmark letters from their place in the image (capitals from y = 3.26 to
 * 11.624 of its 16.742 view box height), and a name's baseline from a zero-sized probe placed on it,
 * its cap top from the font's cap height at the rendered size. Values are CSS pixels; offsets are
 * the name's minus the letters' (positive is lower).
 */
export class Geometry {
	/** Everything the width and theme check asserts about the bar. */
	static bar(page) {
		return page.evaluate(() => {
			const round = value => Math.round(value * 100) / 100;
			const bar = document.querySelector('.bui-family');
			const box = bar.getBoundingClientRect();
			const middle = box.top + box.height / 2;
			const shown = node => node && node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden';
			const image = bar.querySelector('.bui-header-brand img');
			const name = bar.querySelector('[data-part="product"] .bui-lockup-name');
			const letters = window.fixtureLetters(image, name);
			const parts = [...bar.querySelectorAll('.bui-header-start > *, .bui-family-thread > *, .bui-family-end > *, .bui-navmenu-button, .bui-family-docs, .bui-disclosure-bell')].filter(shown);
			const outside = parts.filter(node => {
				const rect = node.getBoundingClientRect();
				return rect.top < box.top - 0.5 || rect.bottom > box.bottom + 0.5 || rect.left < -0.5 || rect.right > innerWidth + 0.5;
			});
			const groups = ['.bui-header-start', '.bui-header-context', '.bui-header-end'].map(selector => bar.querySelector(selector).getBoundingClientRect());
			const overlaps = [];
			if (groups[0].right > groups[1].left + 0.5) overlaps.push('brand/location');
			if (groups[1].right > groups[2].left + 0.5) overlaps.push('location/end');
			const centre = node => {
				const rect = node.getBoundingClientRect();
				return round(rect.top + rect.height / 2 - middle);
			};
			const named = [
				['wordmark', image],
				['product', bar.querySelector('[data-part="product"] .bui-navmenu-button')],
				['location', [...bar.querySelectorAll('.bui-family-thread .bui-navmenu-button')].find(shown)],
				['docs', bar.querySelector('.bui-family-docs')],
				['bell', bar.querySelector('.bui-disclosure-bell')],
				['avatar', bar.querySelector('.bui-family-avatar')]
			].filter(([, node]) => shown(node));
			return {
				height: round(box.height),
				top: round(box.top),
				background: getComputedStyle(bar).backgroundColor,
				outside: outside.map(node => node.className.baseVal ?? node.className),
				overlaps,
				mark: round(image.getBoundingClientRect().height),
				clipped: name.scrollWidth > name.clientWidth + 1,
				centres: named.map(([label, node]) => [label, centre(node)]),
				name: letters,
				wide: shown(bar.querySelector('.bui-family-wide')),
				narrow: shown(bar.querySelector('.bui-family-narrow')),
				docs: shown(bar.querySelector('.bui-family-docs'))
			};
		});
	}

	/** The name against the letters for every lockup of the page's lockup section. */
	static lockups(page) {
		return page.evaluate(() => [...document.querySelectorAll('#lockups .bui-lockup')].map(node => ({ height: node.querySelector('img').getBoundingClientRect().height, ...window.fixtureLetters(node.querySelector('img'), node.querySelector('.bui-lockup-name')) })));
	}

	/** What must not move when the descriptor arrives: the bar's height, the wordmark and the name. */
	static parts(page) {
		return page.evaluate(() => {
			const bar = document.querySelector('.bui-family');
			const left = selector => Math.round(bar.querySelector(selector).getBoundingClientRect().left * 100) / 100;
			return { state: bar.dataset.state, menus: bar.querySelectorAll('.bui-family-thread .bui-navmenu').length, height: bar.getBoundingClientRect().height, mark: left('.bui-header-brand img'), name: left('[data-part="product"] .bui-lockup-name') };
		});
	}

	/** Installs `window.fixtureLetters(image, name)` in every page of a context before it loads. */
	static async install(context) {
		await context.addInitScript(() => {
			window.fixtureLetters = (image, name) => {
				const box = image.getBoundingClientRect();
				const probe = document.createElement('span');
				probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
				name.append(probe);
				const base = probe.getBoundingClientRect().top;
				probe.remove();
				const style = getComputedStyle(name);
				const canvas = document.createElement('canvas').getContext('2d');
				canvas.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
				const top = base - canvas.measureText('H').actualBoundingBoxAscent;
				const round = value => Math.round(value * 100) / 100;
				return { top: round(top - (box.top + (box.height * 3.26) / 16.742)), base: round(base - (box.top + (box.height * 11.624) / 16.742)) };
			};
		});
	}
}
