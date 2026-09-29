/**
 * The package's outline icons, 24px paths with a 1.8px stroke (the family's icon convention).
 * Icons are decorative: every control that shows one also carries a visible label or an accessible
 * name. This file is a data catalog plus its one builder.
 */
export const paths = {
	chevron: 'M8 10l4 4 4-4',
	check: 'M5 12.5l4.5 4.5L19 7.5',
	close: ['M6 6l12 12', 'M18 6L6 18'],
	search: ['M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13z', 'M15.5 15.5L20 20'],
	menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
	alert: ['M12 4l9 16H3z', 'M12 10v4', 'M12 17v.5'],
	info: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M12 11v6', 'M12 7.5v.5'],
	help: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6', 'M12 17v.5'],
	bell: ['M6 14.25v-5a6 6 0 0 1 12 0v5l1.5 2h-15z', 'M10 18.75a2 2 0 0 0 4 0'],
	more: ['M6 12h.01', 'M12 12h.01', 'M18 12h.01'],
	refresh: ['M19 7v4h-4', 'M18.4 11A7 7 0 1 0 17 16.5'],
	user: ['M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8z', 'M4.5 20a7.5 7.5 0 0 1 15 0'],
	book: ['M5 4.5h9.5a2.5 2.5 0 0 1 2.5 2.5v12.5H7.5A2.5 2.5 0 0 1 5 17z', 'M5 17a2.5 2.5 0 0 1 2.5-2.5H17'],
	lock: ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
	plug: ['M9 3v5', 'M15 3v5', 'M6.5 8h11v3a5.5 5.5 0 0 1-11 0z', 'M12 16.5V21']
};

/** An inline SVG icon, hidden from assistive technology. */
export function icon(name) {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('viewBox', '0 0 24 24');
	svg.setAttribute('class', 'bui-icon');
	svg.setAttribute('aria-hidden', 'true');
	svg.setAttribute('focusable', 'false');
	for (const d of [].concat(paths[name] ?? [])) {
		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttribute('d', d);
		svg.append(path);
	}
	return svg;
}
