/** The words of `DataTable` (0.15.0) in English and Spanish. */
export const words = Object.freeze({
	en: Object.freeze({
		search: 'Search {label}',
		range: '{first}–{last} of {total}',
		previous: 'Previous',
		next: 'Next',
		pages: '{label} pages',
		group: ({ name, count }) => `${name} · ${count}`,
		sort: 'Sort by {column}',
		empty: 'Nothing here yet.',
		matches: ({ query }) => (query ? `Nothing matches “${query}”.` : 'Nothing matches.'),
		clear: 'Clear the search',
		loading: 'Loading {label}…',
		failure: 'This list could not be loaded.',
		retry: 'Try again',
		shown: ({ count }) => (count === 1 ? '1 row' : `${count} rows`)
	}),
	es: Object.freeze({
		search: 'Buscar en {label}',
		range: '{first}–{last} de {total}',
		previous: 'Anterior',
		next: 'Siguiente',
		pages: 'Páginas de {label}',
		group: ({ name, count }) => `${name} · ${count}`,
		sort: 'Ordenar por {column}',
		empty: 'Todavía no hay nada aquí.',
		matches: ({ query }) => (query ? `Nada coincide con «${query}».` : 'Nada coincide.'),
		clear: 'Borrar la búsqueda',
		loading: 'Cargando {label}…',
		failure: 'No se pudo cargar esta lista.',
		retry: 'Reintentar',
		shown: ({ count }) => (count === 1 ? '1 fila' : `${count} filas`)
	})
});
