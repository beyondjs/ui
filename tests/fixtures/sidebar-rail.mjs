/** Fictional product navigation used by the rail's contract and installed browser fixtures. */
export const groups = [
	{ key: 'sections', items: [
		{ key: 'home', label: 'Home', href: '/home', glyph: 'home' },
		{ key: 'repositories', label: 'Repositories', href: '/repositories', glyph: 'code', current: true },
		{ key: 'machines', label: 'Machines', href: '/machines', glyph: 'box', meta: 2 },
		{ key: 'live', label: 'Live', href: '/live', glyph: 'globe' },
		{ key: 'settings', label: 'Settings', href: '/settings', glyph: 'settings' }
	] },
	{ kind: 'object', key: 'conversations', glyph: 'chat', heading: 'Conversations', action: { label: 'New', href: '/conversations/new' }, search: { label: 'Search conversations', source: async () => [] }, groups: [
		{ kind: 'entries', key: 'recent', heading: null, fold: false, items: [{ key: 'first', label: 'Improve checkout', href: '/conversations/first', current: true }] }
	] }
];

export const rail = { panel: 'conversations', open: true, order: ['home', 'conversations', 'repositories', 'machines', 'live', 'settings'] };
