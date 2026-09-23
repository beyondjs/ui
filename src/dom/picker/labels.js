/** English defaults of the picker's copy; consumers replace any entry through `labels`. */
export const defaults = {
	placeholder: 'Type to search',
	chosen: 'Chosen',
	count: ({ count }) => `${count} selected`,
	none: 'Nothing selected',
	attention: ({ count }) => (count === 1 ? '1 needs attention' : `${count} need attention`),
	remove: 'Remove {label}',
	loading: 'Loading…',
	shown: ({ shown }) => (shown === 1 ? '1 result' : `${shown} results`),
	total: '{shown} of {total} shown',
	empty: ({ query }) => (query ? `No matches for “${query}”.` : 'No matches for these filters.'),
	nothing: 'There is nothing to choose from yet.',
	failure: 'The choices could not be loaded.',
	retry: 'Try again',
	more: 'Load more',
	disabled: 'Not available',
	stale: 'No longer available',
	ineligible: 'Not eligible',
	unavailable: 'Unavailable'
};
