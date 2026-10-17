/** The words of `CommandPalette` (0.16.0) in English and Spanish. */
export const words = Object.freeze({
	en: Object.freeze({ label: 'Search', placeholder: 'Search or jump to…', recent: 'Recent', looking: 'Looking…', unavailable: 'Not available right now', none: 'Nothing matches “{query}”.', empty: 'Type to search.', results: ({ count }) => (count === 1 ? '1 result' : `${count} results`), close: 'Close' }),
	es: Object.freeze({ label: 'Buscar', placeholder: 'Busca o ve a…', recent: 'Recientes', looking: 'Buscando…', unavailable: 'No disponible ahora', none: 'Nada coincide con «{query}».', empty: 'Escribe para buscar.', results: ({ count }) => (count === 1 ? '1 resultado' : `${count} resultados`), close: 'Cerrar' })
});
