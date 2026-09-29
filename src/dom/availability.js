/**
 * The family's one availability vocabulary (decision D20): the ordered states of a product or a
 * capability, each with its English label and its tone for `badge` or `status`. Products show these
 * words and no others; they pass their own language by `key` (the component catalog carries the
 * Spanish set). The list is frozen: it is data, not configuration.
 */
export const availability = Object.freeze(
	[
		{ key: 'available', label: 'Available', tone: 'success' },
		{ key: 'closed', label: 'Closed access', tone: 'warning' },
		{ key: 'preparation', label: 'In preparation', tone: 'info' },
		{ key: 'planned', label: 'Planned', tone: 'neutral' },
		{ key: 'retired', label: 'Retired', tone: 'neutral' }
	].map(state => Object.freeze(state))
);
