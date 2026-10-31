import { Age } from '../time/age.js';
import { AgainLine } from '../again/line.js';

/** Shared sidebar copy, including contextual panel recovery, in English and Spanish. */
export const words = {
	en: {
		sections: '{product} sections',
		close: 'Close',
		hide: 'Hide {name}',
		expand: 'Expand navigation',
		collapse: 'Collapse navigation',
		search: 'Search',
		searching: 'Searching…',
		loading: 'Loading…',
		none: 'Nothing matches “{query}”.',
		unavailable: 'Search did not respond.',
		retry: 'Try again',
		clear: 'Clear search',
		results: 'Results',
		all: 'See all results',
		count: ({ count }) => (count === 1 ? '1 result' : `${count} results`),
		...Age.labels.en,
		...AgainLine.labels.en
	},
	es: {
		sections: 'Secciones de {product}',
		close: 'Cerrar',
		hide: 'Ocultar {name}',
		expand: 'Expandir navegación',
		collapse: 'Contraer navegación',
		search: 'Buscar',
		searching: 'Buscando…',
		loading: 'Cargando…',
		none: 'Nada coincide con «{query}».',
		unavailable: 'La búsqueda no respondió.',
		retry: 'Reintentar',
		clear: 'Borrar búsqueda',
		results: 'Resultados',
		all: 'Ver todos los resultados',
		count: ({ count }) => (count === 1 ? '1 resultado' : `${count} resultados`),
		...Age.labels.es,
		...AgainLine.labels.es
	}
};
