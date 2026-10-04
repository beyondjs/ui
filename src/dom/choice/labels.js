/** The copy of `ChoiceMenu` in English and Spanish (`ChoiceMenu.labels`). */
export const labels = Object.freeze({
	en: Object.freeze({
		placeholder: 'Choose',
		search: 'Search {label}',
		none: ({ query }) => `Nothing matches “${query}”.`
	}),
	es: Object.freeze({
		placeholder: 'Elegir',
		search: 'Buscar {label}',
		none: ({ query }) => `Nada coincide con «${query}».`
	})
});
