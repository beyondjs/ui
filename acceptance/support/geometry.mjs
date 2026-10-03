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
			// The controls left to right: each ends before the next begins (a shrunk group can still overflow).
			const controls = [...bar.querySelectorAll('.bui-header-toggle, .bui-header-brand, .bui-navmenu-button, .bui-family-static, .bui-family-placeholder, .bui-family-docs, .bui-disclosure-bell')].filter(shown).map(node => [node.getAttribute('aria-label') ?? node.className, node.getBoundingClientRect()]).sort((a, b) => a[1].left - b[1].left);
			const overlaps = controls.slice(1).filter(([, rect], index) => rect.left < controls[index][1].right - 0.5).map(([label], index) => `${controls[index][0]} / ${label}`);
			const centre = node => {
				const rect = node.getBoundingClientRect();
				return round(rect.top + rect.height / 2 - middle);
			};
			const named = [
				['wordmark', image],
				['product', bar.querySelector('[data-part="product"] .bui-navmenu-button')],
				['location', [...bar.querySelectorAll('.bui-family-thread .bui-navmenu-button')].find(shown)],
				['docs', bar.querySelector('.bui-family-docs')],
				['bell', bar.querySelector('.bui-disclosure-bell')]
				// The avatar's disc is ink on the letters' axis (support/ink.mjs); its button is centred above.
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

	/**
	 * The wide location's two names: the width of each name's text, its whole width, whether it is cut
	 * and the width of its button.
	 */
	static location(page) {
		return page.evaluate(() => {
			const round = value => Math.round(value * 100) / 100;
			const one = part => {
				const holder = document.querySelector(`.bui-family-wide .bui-family-${part}`);
				const place = holder?.querySelector('.bui-family-place');
				if (!place || !place.getClientRects().length) return null;
				const button = holder.querySelector('.bui-navmenu-button') ?? holder;
				return { text: place.textContent, width: round(place.getBoundingClientRect().width), whole: place.scrollWidth, cut: place.scrollWidth > place.clientWidth + 1, button: round(button.getBoundingClientRect().width) };
			};
			return { organization: one('organization'), project: one('project') };
		});
	}

	/** Every control of the bar that is shown, with its width and height, and the wordmark's height. */
	static targets(page) {
		return page.evaluate(() => {
			const round = value => Math.round(value * 100) / 100;
			const bar = document.querySelector('.bui-family');
			const shown = node => node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden';
			const controls = [...bar.querySelectorAll('.bui-header-toggle, .bui-header-brand, .bui-navmenu-button, .bui-family-docs, .bui-disclosure-bell')].filter(shown).map(node => {
				const rect = node.getBoundingClientRect();
				return { name: node.closest('[data-part]')?.dataset.part ?? node.className.split(' ')[0], width: round(rect.width), height: round(rect.height) };
			});
			return { controls, mark: round(bar.querySelector('.bui-header-brand img').getBoundingClientRect().height), location: shown(bar.querySelector('.bui-family-thread')) };
		});
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
