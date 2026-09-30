/**
 * The family's one outline icon catalog (decision D11): paths on a 24 px grid, drawn with one 1.8 px
 * round stroke by `.bui-icon`. The catalog merges the package's first glyphs, the family reference's
 * set and Workspace's client set (redrawn to this stroke, duplicates removed), the Desktop's window
 * controls and CDN's step markers. New glyphs may be drawn on the Lucide grid (ISC licence).
 *
 * This file is data only: `Glyph` (`icons.js`) builds elements from it. A name says what the glyph
 * shows or means in plain English; a product that used another name maps it (see the catalog guide).
 */
export const paths = Object.freeze({
	// Direction and navigation
	chevron: 'M8 10l4 4 4-4',
	right: 'M10 7l5 5-5 5',
	left: 'M14 7l-5 5 5 5',
	back: ['M19 12H5', 'M11 6l-6 6 6 6'],
	external: ['M14 5h5v5', 'M19 5l-8 8', 'M17 14v5H5V7h5'],
	home: ['M4 11l8-7 8 7', 'M6 9.5V20h12V9.5'],
	menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
	more: ['M6 12h.01', 'M12 12h.01', 'M18 12h.01'],

	// Actions
	check: 'M5 12.5l4.5 4.5L19 7.5',
	close: ['M6 6l12 12', 'M18 6L6 18'],
	plus: ['M12 5v14', 'M5 12h14'],
	minus: 'M5 12h14',
	search: ['M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13z', 'M15.5 15.5L20 20'],
	refresh: ['M19 7v4h-4', 'M18.4 11A7 7 0 1 0 17 16.5'],
	play: 'M8 5.5v13l10-6.5z',
	stop: 'M7 7h10v10H7z',
	send: 'M4 12l16-8-6 16-3-7z',
	merge: ['M6 4v16', 'M18 4v6a4 4 0 0 1-4 4H6', 'M6 8l-3 3', 'M6 8l3 3'],

	// Window controls (with `close`)
	pin: ['M9 4h6', 'M10 4v5l-3 4h10l-3-4V4', 'M12 13v7'],
	minimize: 'M6 17h12',
	maximize: 'M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
	restore: ['M7 9h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z', 'M9 9V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2'],

	// States and notices
	alert: ['M12 4l9 16H3z', 'M12 10v4', 'M12 17v.5'],
	exclamation: ['M12 6v8', 'M12 18v.5'],
	info: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M12 11v6', 'M12 7.5v.5'],
	help: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6', 'M12 17v.5'],
	bell: ['M6 14.25v-5a6 6 0 0 1 12 0v5l1.5 2h-15z', 'M10 18.75a2 2 0 0 0 4 0'],
	lock: ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
	shield: 'M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6z',
	key: ['M8 11a4 4 0 1 1 0 .1', 'M12 11h9', 'M18 11v3.5', 'M15 11v2.5'],
	clock: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M12 7.5V12l3 2'],
	eye: ['M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z', 'M12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z'],
	star: 'M12 4l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z',

	// People and places
	user: ['M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8z', 'M4.5 20a7.5 7.5 0 0 1 15 0'],
	people: ['M9 5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z', 'M2.5 20a6.5 6.5 0 0 1 13 0', 'M15.5 5.2a3.5 3.5 0 0 1 0 6.6', 'M18 14.2a6.5 6.5 0 0 1 3.5 5.8'],
	building: ['M5 20V5h9v15', 'M14 10h5v10', 'M8 8h3', 'M8 11h3', 'M8 14h3', 'M3 20h18'],
	globe: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M3 12h18', 'M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z'],
	chat: 'M4.5 5.5h15v10h-9l-4 3.5v-3.5h-2z',

	// Things and work
	folder: 'M3.5 6.5h6l2 2h9v10h-17z',
	archive: ['M4 8h16v12H4z', 'M8 8V5h8v3', 'M9 14h6'],
	book: ['M5 4.5h9.5a2.5 2.5 0 0 1 2.5 2.5v12.5H7.5A2.5 2.5 0 0 1 5 17z', 'M5 17a2.5 2.5 0 0 1 2.5-2.5H17'],
	code: ['M8.5 8l-4 4 4 4', 'M15.5 8l4 4-4 4', 'M13.5 5.5l-3 13'],
	branch: ['M7 4v11', 'M7 15a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z', 'M17 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z', 'M17 9c0 4-10 3-10 6'],
	camera: ['M4 8h3l2-2.5h6L17 8h3v11H4z', 'M12 10.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6z'],
	graph: ['M6 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4z', 'M18 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4z', 'M12 15a2 2 0 1 1 0 4 2 2 0 0 1 0-4z', 'M7.3 8.6l3.6 6.6', 'M16.7 8.6l-3.6 6.6'],
	box: ['M4 7.5l8-4 8 4v9l-8 4-8-4z', 'M4 7.5l8 4 8-4', 'M12 11.5v9'],
	layers: ['M12 4l9 5-9 5-9-5z', 'M3 14l9 5 9-5'],
	grid: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
	window: ['M3 5h18v14H3z', 'M3 9h18'],
	rocket: ['M12 3c3.5 2 5 5.5 5 9.5l-2.5 3h-5L7 12.5C7 8.5 8.5 5 12 3z', 'M12 8.5v.5', 'M9.5 15.5L8 20l4-2 4 2-1.5-4.5'],
	plug: ['M9 3v5', 'M15 3v5', 'M6.5 8h11v3a5.5 5.5 0 0 1-11 0z', 'M12 16.5V21'],
	coins: ['M12 4c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3z', 'M4 7v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7', 'M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5'],
	flask: ['M9.5 3.5h5', 'M10.5 3.5v6L5 19a1 1 0 0 0 .9 1.5h12.2A1 1 0 0 0 19 19l-5.5-9.5v-6']
});

/**
 * The glyphs that may appear without a visible label (decision D11): conventional controls whose
 * button carries an accessible name and a tooltip that shows the name, and its shortcut when there is
 * one. Every other icon comes with a visible label. The owner's list is the first ten; `help` (the
 * question mark that opens essential help beside a field) and `user` (the account avatar before a
 * name is known) were added at the 0.3.0 integration under the same rule, for the owner to confirm.
 */
export const unlabeled = Object.freeze(['close', 'menu', 'more', 'search', 'bell', 'chevron', 'pin', 'minimize', 'maximize', 'restore', 'help', 'user']);
