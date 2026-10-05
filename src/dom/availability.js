/**
 * The family's one availability vocabulary (decision D20): the ordered states of a product or a
 * capability, each with its English label and its tone for `badge` or `status`. Products show these
 * words and no others; since 0.7.2 each entry also carries `labels: { en, es }`, so a Spanish page
 * shows `state.labels.es`. The list is frozen: it is data, not configuration.
 */
export const availability = Object.freeze(
	[
		{ key: 'available', label: 'Available', es: 'Disponible', tone: 'success' },
		{ key: 'closed', label: 'Closed access', es: 'Acceso cerrado', tone: 'warning' },
		{ key: 'preparation', label: 'In preparation', es: 'En preparación', tone: 'info' },
		{ key: 'planned', label: 'Planned', es: 'Planificado', tone: 'neutral' },
		{ key: 'retired', label: 'Retired', es: 'Retirado', tone: 'neutral' }
	].map(({ es, ...state }) => Object.freeze({ ...state, labels: Object.freeze({ en: state.label, es }) }))
);
