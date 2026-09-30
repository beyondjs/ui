/**
 * The controls of a document with their visible text, accessible name and glyphs, so a check can fail
 * any icon-only control without a name (decision D11). It runs in Node over happy-dom
 * (`survey(false)`: no layout, the package's `.bui-hidden` marks visually hidden text) and inside a
 * browser page through Playwright's `page.evaluate(survey, true)`, where rendering and geometry
 * decide what is shown. It is self-contained for that reason: nothing outside the function is used.
 *
 * The accessible name is a simplified computation: `aria-labelledby`, then `aria-label`, then the
 * text of rendered descendants outside `aria-hidden`, then labelled images, then `title`.
 */
export function survey(layout) {
	const selector = 'button, a[href], summary, [role="button"], [role="menuitem"], [role="tab"]';
	const shown = node => {
		if (!layout) return !node.closest('[hidden]');
		return typeof node.checkVisibility === 'function' ? node.checkVisibility({ visibilityProperty: true }) : node.getClientRects().length > 0;
	};
	const clipped = node => {
		if (!layout) return node.closest('.bui-hidden') !== null;
		const box = node.getBoundingClientRect();
		return box.width <= 1 && box.height <= 1;
	};
	const muted = node => node.closest('[aria-hidden="true"]') !== null;
	const texts = (root, keep) => {
		const walker = root.ownerDocument.createTreeWalker(root, 4);
		const found = [];
		for (let node = walker.nextNode(); node; node = walker.nextNode()) if (node.parentElement && keep(node.parentElement)) found.push(node.textContent);
		return found.join(' ').replace(/\s+/g, ' ').trim();
	};
	const name = control => {
		const labelledby = (control.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean);
		const byId = labelledby.map(id => control.ownerDocument.getElementById(id)?.textContent ?? '').join(' ').trim();
		const images = [...control.querySelectorAll('[role="img"][aria-label], img[alt]')].map(node => node.getAttribute('aria-label') ?? node.getAttribute('alt')).join(' ');
		return byId || (control.getAttribute('aria-label') ?? '').trim() || texts(control, node => !muted(node) && shown(node)) || images.trim() || (control.getAttribute('title') ?? '').trim();
	};
	return [...document.querySelectorAll(selector)]
		.filter(control => shown(control) && !muted(control))
		.map(control => {
			const visible = texts(control, node => shown(node) && !clipped(node));
			const glyphs = [...control.querySelectorAll('svg')].filter(shown).map(svg => svg.getAttribute('data-icon') ?? 'unknown');
			const describe = `${control.tagName.toLowerCase()}.${String(control.getAttribute('class') ?? '').replace(/\s+/g, '.')}`;
			return { bare: !visible && glyphs.length > 0, name: name(control), glyphs, describe };
		});
}
