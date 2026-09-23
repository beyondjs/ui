/** English defaults of the collection's copy; consumers replace any entry through `labels`. */
export const defaults = {
	search: 'Search {label}',
	placeholder: 'Search',
	all: 'All',
	loading: 'Loading…',
	failure: 'This list could not be loaded.',
	retry: 'Try again',
	empty: 'Nothing here yet.',
	matches: ({ query }) => (query ? `No matches for “${query}”.` : 'Nothing matches these filters.'),
	clear: 'Clear search and filters',
	pages: '{label} pages',
	range: '{first}–{last} of {total}',
	page: 'Page {page}',
	of: 'page {page} of {pages}',
	previous: 'Previous',
	next: 'Next'
};
