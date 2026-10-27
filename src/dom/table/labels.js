import { words as tools } from '../collection/tools-labels.js';

/** The words of `DataTable` (0.15.0) in English and Spanish; its narrow sort line and row menus since 0.44.0. */
export const words = Object.freeze({
	en: Object.freeze({
		...tools.en,
		search: 'Search {label}',
		range: '{first}–{last} of {total}',
		previous: 'Previous',
		next: 'Next',
		pages: '{label} pages',
		group: ({ name, count }) => `${name} · ${count}`,
		sort: 'Sort by {column}',
		order: 'Sort by',
		unsorted: 'Default order',
		ascending: '{column}, ascending',
		descending: '{column}, descending',
		actions: 'Actions',
		more: 'More actions for {name}',
		empty: 'Nothing here yet.',
		matches: ({ query }) => (query ? `Nothing matches “${query}”.` : 'Nothing matches.'),
		clear: 'Clear the search',
		clearFilters: 'Clear search and filters',
		loading: 'Loading {label}…',
		failure: 'This list could not be loaded.',
		retry: 'Try again',
		shown: ({ count }) => (count === 1 ? '1 row' : `${count} rows`)
	}),
	es: Object.freeze({
		...tools.es,
		search: 'Buscar en {label}',
		range: '{first}–{last} de {total}',
		previous: 'Anterior',
		next: 'Siguiente',
		pages: 'Páginas de {label}',
		group: ({ name, count }) => `${name} · ${count}`,
		sort: 'Ordenar por {column}',
		order: 'Ordenar por',
		unsorted: 'Orden predeterminado',
		ascending: '{column}, ascendente',
		descending: '{column}, descendente',
		actions: 'Acciones',
		more: 'Más acciones de {name}',
		empty: 'Todavía no hay nada aquí.',
		matches: ({ query }) => (query ? `Nada coincide con «${query}».` : 'Nada coincide.'),
		clear: 'Borrar la búsqueda',
		clearFilters: 'Borrar la búsqueda y los filtros',
		loading: 'Cargando {label}…',
		failure: 'No se pudo cargar esta lista.',
		retry: 'Reintentar',
		shown: ({ count }) => (count === 1 ? '1 fila' : `${count} filas`)
	})
});
