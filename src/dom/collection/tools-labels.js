/**
 * Shared search and filter words, inherited by Collection and DataTable. A period filter (0.44.0) says
 * `anytime` for no period, `days` and `span` for its choices, and names months in `locale`'s language.
 */
export const words = Object.freeze({
	en: Object.freeze({ search: 'Search {label}', placeholder: 'Search', tools: '{label} tools', filters: 'Filters', filtered: 'Filters ({count})', remove: 'Remove {label}: {value}', reset: 'Clear filters', erase: 'Clear search', query: 'Search: {query}', all: 'All', unknown: 'Unavailable choice', anytime: 'Any time', days: ({ count }) => (Number(count) === 1 ? 'Today' : `Last ${count} days`), span: '{start} – {end}', locale: 'en' }),
	es: Object.freeze({ search: 'Buscar en {label}', placeholder: 'Buscar', tools: 'Herramientas de {label}', filters: 'Filtros', filtered: 'Filtros ({count})', remove: 'Quitar {label}: {value}', reset: 'Borrar filtros', erase: 'Borrar búsqueda', query: 'Búsqueda: {query}', all: 'Todos', unknown: 'Opción no disponible', anytime: 'Cualquier fecha', days: ({ count }) => (Number(count) === 1 ? 'Hoy' : `Últimos ${count} días`), span: '{start} – {end}', locale: 'es' })
});
