import { words } from './tools-labels.js';

/** The collection's copy: `defaults` in English; `Collection.labels` holds English and Spanish. */
export const defaults = {
	...words.en,
	search: 'Search {label}',
	placeholder: 'Search',
	all: 'All',
	loading: 'Loading…',
	failure: 'This list could not be loaded.',
	outage: 'Not available right now',
	retry: 'Try again',
	empty: 'Nothing here yet.',
	matches: ({ query }) => (query ? `No matches for “${query}”.` : 'Nothing matches these filters.'),
	clear: 'Clear search and filters',
	pages: '{label} pages',
	range: '{first}–{last} of {total}',
	page: 'Page {page}',
	of: 'page {page} of {pages}',
	previous: 'Previous',
	next: 'Next',
	columns: ({ count }) => (count === 1 ? 'Show 1 more column' : `Show ${count} more columns`),
	fewer: 'Show fewer columns',
	end: 'Nothing more',
	keys: '↑ ↓ to move · Enter to open'
};

export const spanish = {
	...words.es,
	search: 'Buscar en {label}',
	placeholder: 'Buscar',
	all: 'Todos',
	loading: 'Cargando…',
	failure: 'No se pudo cargar esta lista.',
	outage: 'No disponible en este momento',
	retry: 'Reintentar',
	empty: 'Todavía no hay nada aquí.',
	matches: ({ query }) => (query ? `Nada coincide con «${query}».` : 'Nada coincide con estos filtros.'),
	clear: 'Borrar la búsqueda y los filtros',
	pages: 'Páginas de {label}',
	range: '{first}–{last} de {total}',
	page: 'Página {page}',
	of: 'página {page} de {pages}',
	previous: 'Anterior',
	next: 'Siguiente',
	columns: ({ count }) => (count === 1 ? 'Mostrar 1 columna más' : `Mostrar ${count} columnas más`),
	fewer: 'Mostrar menos columnas',
	end: 'No hay más',
	keys: '↑ ↓ para moverte · Enter para abrir'
};
